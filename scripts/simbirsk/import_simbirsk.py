"""Импорт лонгрида «Симбирск 1918–1919» из docx заказчика.

    python3 scripts/simbirsk/import_simbirsk.py [--check]

Пишет три артефакта:

    public/content/longreads/simbirsk.json      канон, по longread.schema.json
    public/content/longreads/simbirsk.data.js   тот же json классическим скриптом
    content-src/simbirsk-media-wanted.md        сводка медиа-долга для заказчика

Почему скриптом, а не руками (CLAUDE.md §9): заказчик пришлёт следующую версию
файла, и ручная перепечатка будет затёрта. Правка идёт сюда либо в
simbirsk.patch.json — трёхфайловая модель та же, что у справок.

Почему рядом с json лежит ещё и .data.js. Киоск запускается как
file:///opt/mtk29/dist/index.html, а под file:// в Chromium НЕ работают ни
fetch/XHR, ни внешние module-скрипты (проверено на Chrome 14x: внешний
классический <script src> исполняется, `type="module"` — нет, fetch падает
с «Failed to fetch»). Значит, страница, которая тянет свой контент через
fetch, на целевом железе окажется пустой. Тот же вывод раньше сделала зона ui
для сцены /expo/ — там данные лежат в data.js и people-data.js обычными
скриптами. Канон остаётся json (его читают валидатор и остальные зоны),
а .data.js — его машинная копия для страницы.

Разбор docx — общий парсер зоны content (scripts/import/docxlib.py): прямой
обход word/document.xml. python-docx теряет текст гиперссылок, а в этом
источнике 13 ссылок на госкаталог, и потерять их нельзя — это и есть весь
учёт иллюстраций.

Структура источника машиночитаема без эвристик по тексту:

    жирный абзац        заголовок «Раздел N. Название»
    курсивный абзац     лид секции; ровно «Иллюстрации:» — начало блока медиа
    обычный абзац       текст, либо «N. аннотация», либо «Нужно подобрать: …»
    абзац-гиперссылка   url к предыдущей аннотации
"""

from __future__ import annotations

import json
import re
import sys
from copy import deepcopy
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "import"))

from docxlib import Document, PARSER_VERSION, norm_space  # noqa: E402

SRC_REL = "Симбирск 1918-1919 гг..docx"
SRC = ROOT.parent / "IN" / "new" / "МТК №29" / SRC_REL

LONGREADS = ROOT / "public" / "content" / "longreads"

# Трёхфайловая модель зоны content (CLAUDE.md §9): машина пишет .gen.json,
# человек — .patch.json, слияние ложится в .json. Машина никогда не пишет
# в файл, который правил человек, поэтому .patch.json генератор не создаёт
# и не трогает: его заводят руками, когда приедут иллюстрации.
OUT_GEN = LONGREADS / "simbirsk.gen.json"
PATCH = LONGREADS / "simbirsk.patch.json"
OUT_JSON = LONGREADS / "simbirsk.json"

OUT_DATA = LONGREADS / "simbirsk.data.js"
OUT_WANTED = ROOT / "content-src" / "simbirsk-media-wanted.md"

# Второй машинный вход: временные изображения из Госкаталога, снятые
# scripts/simbirsk/fetch_goskatalog.py. Не патч и не ручной файл — поэтому
# подмешивается в .gen.json, а не поверх него.
PLACEHOLDERS = ROOT / "content-src" / "simbirsk-placeholders.json"

LONGREAD_ID = "simbirsk"

# Разделов в источнике ровно столько. Расхождение роняет прогон: если
# заказчик пришлёт версию с другой разметкой, молча собранный огрызок
# опаснее отказа — он выглядит как готовый лонгрид.
EXPECTED_SECTIONS = 11

# Куда этому скрипту вообще позволено писать. Сторож в самой записи, а не
# разовая проверка: допишет кто-нибудь путь — и прогон начнёт затирать чужое.
#
# Все три пути — зона simbirsk по §4 после разведения границ 2026-08-04:
# каталог лонгридов закреплён за нами (у content там только схема),
# а `content-src/simbirsk-*` выделен из общего content-src отдельной строкой.
# Остальной content-src принадлежит зоне content и трогать его нельзя.
ALLOWED_WRITES = (
    "public/content/longreads/",
    "content-src/simbirsk-media-wanted.md",
    "content-src/simbirsk-placeholders.json",
)


def write_guarded(path: Path, text: str) -> None:
    """Запись с проверкой зоны. Чужой путь — отказ, а не тихая перезапись."""
    rel = path.relative_to(ROOT).as_posix()
    if not any(rel == a or rel.startswith(a) for a in ALLOWED_WRITES):
        raise PermissionError(
            f"{rel} — вне зоны simbirsk (CLAUDE.md §4). "
            "Запись отменена. Нужен чужой файл — заявка оркестратору."
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")

# ── связи с уже импортированным ────────────────────────────────────────────
#
# В этом docx нет разметки заказчика «жирный курсив = упоминание сущности»
# (в справках она есть, здесь — ноль вхождений). Поэтому связи берутся не из
# форматирования, а из словаря ниже: подстрока в тексте секции → id справки.
#
# Словарь ведётся руками и намеренно узкий. Правило отбора: сущность названа
# в тексте прямо и по делу, а не фоном. «Ленин» в разделе 8 — по делу (взятие
# его родного города, телеграмма ему же), «Ленин» в разделе 9 — адресат чужой
# телеграммы, тоже прямое упоминание. А вот РСФСР в тексте не названа ни разу,
# и заводить её «по смыслу» нельзя.
#
# Каждый id проверяется против public/content/<вид>/_index.json на прогоне:
# промах = падение импорта, а не тихая битая ссылка.
#
# Третье поле — маски, которые вырезаются из текста ДО поиска подстрок этого
# правила. Нужны там, где короткий корень попадает внутрь чужого слова:
# «здание бывшего кадетского корпуса» — это военное училище, а не партия
# кадетов; «левый эсер Муравьёв» — это левые эсеры, а не ПСР. Без масок обе
# ссылки уезжают в карточку не той сущности, причём молча.
REF_RULES = [
    # (id, вид, [подстроки-триггеры], [маски-исключения])
    ("kappel",        "persons", ["Каппел"], []),
    ("tukhachevsky",  "persons", ["Тухачевск"], []),
    ("lenin",         "persons", ["Ленин"], []),
    ("trotsky",       "persons", ["Троцк"], []),
    ("frunze",        "persons", ["Фрунзе"], []),
    ("kolchak",       "persons", ["Колчак"], []),
    ("sverdlov",      "persons", ["Свердлов"], []),
    ("dutov",         "persons", ["Дутов"], []),

    ("bolsheviks",    "parties", ["большевик", "Большевик", "РКП(б)", "коммунист"], []),
    ("srs",           "parties", ["эсер", "Эсер"], [r"лев\w+\s+эсер\w*"]),
    ("left-srs",      "parties", ["левый эсер", "левые эсер", "левых эсер"], []),
    ("mensheviks",    "parties", ["меньшевик"], []),
    ("cadets",        "parties", ["кадет"], [r"кадетск\w+\s+корпус\w*"]),

    ("komuch",        "states",  ["КОМУЧ", "Комуч", "комучев"], []),
    ("chapannaya-voyna", "states", ["Чапанная война", "чапанные", "«Чапанная война»"], []),
    ("czechoslovak-corps", "states", ["Чехословацкого корпуса", "чехословак"], []),
    ("vsp",           "states",  ["Сибирское правительство"], []),
    ("orenburg-cossack-host", "states", ["оренбургские казаки"], []),

    ("vystuplenie-chekhoslovatskogo-korpusa", "events",
     ["выступление Чехословацкого корпуса", "началось выступление Чехословацкого"], []),
    ("vzyatie-kazani-chastyami-narodnoy-armii", "events", ["взяли Казань"], []),
    ("vesennee-nastuplenie-russkoy-armii", "events", ["наступления армий адмирала Колчака"], []),
]

# Куда ведёт плашка связи. Раздела «Персоналии» отдельной корневой страницей
# нет — личности живут в сцене (зона ui), поэтому у них свой адрес.
# Форма хэша — из docs/content-schema.md: #/<вид>/<id>.
HREF_PAGE = {
    "persons": "expo/people.html",
    "parties": "parties.html",
    "states":  "states.html",
    "events":  "states.html",
}
HREF_KIND = {"persons": "person", "parties": "party", "states": "state", "events": "event"}
KIND_OF = {"persons": "person", "parties": "party", "states": "state", "events": "event"}

# ── транслитерация для слагов секций ───────────────────────────────────────
TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(text: str) -> str:
    out = []
    for ch in text.lower():
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif ch.isalnum() and ch.isascii():
            out.append(ch)
        else:
            out.append("-")
    s = re.sub(r"-{2,}", "-", "".join(out)).strip("-")
    return s


# ── разбор ─────────────────────────────────────────────────────────────────

SECTION_RE = re.compile(r"^Раздел\s+(\d+)\.\s*(.+)$")
MEDIA_ITEM_RE = re.compile(r"^(\d+)\.\s*(.+)$", re.S)
WANTED_RE = re.compile(r"^Нужно подобрать:\s*(.*)$", re.S)
ILLUSTRATIONS_RE = re.compile(r"^Иллюстрации:?\s*$")
# Хвост-пояснение в скобках в конце аннотации: «(см. литература в конце)».
TAIL_RE = re.compile(r"\s*\(([^()]*)\)\s*$")


def para_style(p):
    """Формат абзаца по его непустым runs: 'bold' | 'italic' | 'link' | 'plain'."""
    runs = [r for r in p.runs if r.text.strip()]
    if not runs:
        return "empty"
    if all(r.url for r in runs):
        return "link"
    if all(r.bold for r in runs):
        return "bold"
    if all(r.italic for r in runs):
        return "italic"
    return "plain"


def split_title(line: str) -> tuple[str, str | None]:
    """«Симбирск в годы Гражданской войны: май 1918 – весна 1919» → заголовок и датировка.

    Двоеточие в титуле источника разделяет название и период. Не разрезав его,
    получаем на странице две строки подряд с одной и той же датой: сам заголовок
    и подпись под ним. Полная строка целиком сохраняется в dates.raw.
    """
    head, sep, tail = line.rpartition(":")
    if not sep:
        return line, None
    tail = tail.strip()
    # Разрезаем только если хвост похож на период, а не на вторую часть названия.
    if re.search(r"\d{4}", tail):
        return head.strip(), tail
    return line, None


def parse(doc: Document) -> dict:
    """docx → структура лонгрида. Один линейный проход, состояние — текущая секция."""
    title = norm_space(doc.paras[0].text) if doc.paras else ""

    sections: list[dict] = []
    tail_notes: list[str] = []       # хвост документа после последней секции
    tail_sources: list[dict] = []    # ...та его часть, что под «Литература и карты»
    tail_header = ""
    cur: dict | None = None
    in_media = False
    after_sections = False

    for p in doc.paras[1:]:
        text = norm_space(p.text)
        if not text:
            continue
        style = para_style(p)

        m = SECTION_RE.match(text)
        if style == "bold" and m:
            cur = {
                "n": int(m.group(1)),
                "id": slugify(m.group(2)),
                "title_ru": m.group(2).strip(),
                "title_en": None,
                "lede_ru": None,
                "lede_en": None,
                "paragraphs_ru": [],
                "paragraphs_en": [],
                "media": [],
                "media_wanted_ru": [],
                "refs": {},
            }
            sections.append(cur)
            in_media = False
            continue

        # Жирный абзац, но не «Раздел N» — хвост документа: «Литература и карты»,
        # «Примечание к иллюстративному ряду». Секции кончились.
        if style == "bold":
            after_sections = True
            tail_header = text
            cur = None
            continue

        if after_sections or cur is None:
            # Строка «11 разделов; каждый раздел» перед первой секцией — служебная
            # заметка составителя, в контент не идёт.
            if cur is None and not after_sections:
                continue
            # Под «Литература и карты» голый url — это источник, а не примечание:
            # в таблице ниже он лежал бы в колонке «Ссылка».
            if "Литератур" in tail_header and text.startswith("http"):
                tail_sources.append({"title_ru": None, "url": text})
            else:
                tail_notes.append(text)
            continue

        if style == "italic":
            if ILLUSTRATIONS_RE.match(text):
                in_media = True
            elif cur["lede_ru"] is None and not in_media:
                cur["lede_ru"] = text
            else:
                cur["paragraphs_ru"].append(text)
            continue

        if style == "link":
            # Ссылка относится к последней заведённой аннотации. Отдельно
            # стоящих ссылок в источнике нет, но если появятся — не молчим.
            if cur["media"]:
                cur["media"][-1]["source_url"] = text
            else:
                cur["media"].append(_media_slot(len(cur["media"]) + 1, None, text))
            continue

        # style == 'plain'
        if in_media:
            w = WANTED_RE.match(text)
            if w:
                cur["media_wanted_ru"] += _split_wanted(w.group(1))
                continue
            mi = MEDIA_ITEM_RE.match(text)
            if mi:
                cur["media"].append(_media_slot(int(mi.group(1)), norm_space(mi.group(2))))
                continue
            # Нумерации нет, но блок иллюстраций открыт — всё равно слот.
            cur["media"].append(_media_slot(len(cur["media"]) + 1, text))
            continue

        cur["paragraphs_ru"].append(text)

    return {
        "title_ru": title,
        "sections": sections,
        "tail": tail_notes,
        "tail_sources": tail_sources,
    }


def _media_slot(n: int, caption: str | None, url: str | None = None) -> dict:
    note = None
    if caption:
        t = TAIL_RE.search(caption)
        if t:
            note = t.group(1).strip()
            caption = caption[: t.start()].strip()
    return {
        "n": n,
        "slot": "gallery",
        "file": None,
        "src_file": None,
        "caption_ru": caption,
        "caption_en": None,
        "inv_ru": None,
        "source_url": url,
        "source_note_ru": note,
        "w": None,
        "h": None,
        "tiers": [],
    }


GK_ID_RE = re.compile(r"[?&]id=(\d+)")


def gk_id(url: str | None) -> str | None:
    """Числовой id позиции из ссылки вида …/#/collections?id=67744736."""
    if not url:
        return None
    m = GK_ID_RE.search(url)
    return m.group(1) if m else None


def attach_placeholders(sections: list[dict]) -> int:
    """Подмешать временные изображения к слотам по id позиции каталога.

    Аннотацию из docx НЕ трогаем: в каталоге у предмета своё название, иногда
    расходящееся с тем, что написал заказчик, а на экране должна стоять его
    формулировка. Из каталога берём только то, чего в docx нет физически:
    файл, размеры и реквизиты, по которым музею предъявляют запрос.
    """
    if not PLACEHOLDERS.exists():
        return 0
    items = json.loads(PLACEHOLDERS.read_text(encoding="utf-8")).get("items", {})
    n = 0
    for sec in sections:
        for m in sec["media"]:
            p = items.get(gk_id(m.get("source_url")) or "")
            if not p:
                continue
            m["file"] = p["file"]
            m["w"], m["h"] = p["w"], p["h"]
            m["tiers"] = p["tiers"]
            m["placeholder"] = True
            m["holder_ru"] = p.get("holder_ru")
            m["gk_no"] = p.get("gk_no")
            m["kp_no"] = p.get("kp_no")
            n += 1
    return n


def render_requisites(data: dict) -> list[str]:
    """Таблица реквизитов — с ней заказчик идёт в музей за оригиналами.

    Пустые клетки не прячем: пустая колонка «номер по КП» и есть перечень того,
    что предстоит выяснить. Заполняется генератором заглушек со страниц
    госкаталога, руками — только через .patch.json.
    """
    rows = [(s, m) for s in data["sections"] for m in s["media"] if m.get("source_url")]
    if not rows:
        return []

    known = sum(1 for _, m in rows if m.get("kp_no"))
    holders = {m.get("holder_ru") for _, m in rows if m.get("holder_ru")}

    L = [
        "## Реквизиты позиций госкаталога",
        "",
        f"Позиций со ссылкой — {len(rows)}, реквизиты сняты у {known}.",
        "Номер по книге поступлений — то, что называют в музее; по нему",
        "и запрашиваются оригиналы.",
        "",
    ]

    # Держатель у всех один — выносим строкой, а не повторяем в 13 строках
    # таблицы: с такой таблицей идут в музей, и лишняя колонка в ней мешает.
    single_holder = holders.pop() if len(holders) == 1 else None
    if single_holder:
        L += [f"**Держатель всех позиций — {single_holder}.**",
              "То есть фонд самого заказчика.", ""]

    # Сколько изображений у предмета в каталоге: два — это лицо и оборот,
    # и в запросе надо назвать, какая сторона нужна.
    if PLACEHOLDERS.exists():
        items = json.loads(PLACEHOLDERS.read_text(encoding="utf-8")).get("items", {})
        multi = sum(1 for v in items.values() if (v.get("images_count") or 1) > 1)
        if multi:
            L += [f"У {multi} из {len(items)} предметов в каталоге по нескольку "
                  "изображений (лицо и оборот).", "Временным взято первое — какое "
                  "нужно на самом деле, в музее скажут точнее нас.", ""]

    head = "| № | Предмет | Госкаталог | № по КП | Файл |"
    if not single_holder:
        head = "| № | Предмет | Госкаталог | Держатель | № по КП | Файл |"
    L += [head, "|" + "---|" * (head.count("|") - 1)]

    for s, m in rows:
        cap = (m.get("caption_ru") or "—").replace("|", "/")
        if len(cap) > 54:
            cap = cap[:54].rstrip() + "…"
        state = "заглушка" if m.get("placeholder") else ("оригинал" if m.get("file") else "нет")
        cells = [f"{s['n']}.{m['n']}", cap, gk_id(m["source_url"]) or "—"]
        if not single_holder:
            cells.append(m.get("holder_ru") or "—")
        cells += [m.get("kp_no") or "—", state]
        L.append("| " + " | ".join(cells) + " |")
    L.append("")
    return L


def _split_wanted(s: str) -> list[str]:
    """«портрет Гимова; виды Симбирска; завод.» → три заявки."""
    return [x for x in (norm_space(p).strip(" .;") for p in s.split(";")) if x]


def parse_sources(doc: Document) -> list[dict]:
    """Таблица «Литература и карты»: первая строка — шапка, дальше пары."""
    out = []
    for table in doc.tables:
        for row in table.rows[1:]:
            cells = [c.text.strip() for c in row.cells]
            title = norm_space(cells[0]) if cells else ""
            url = norm_space(cells[1]) if len(cells) > 1 else ""
            if not title and not url:
                continue
            out.append({
                "title_ru": title or None,
                "url": url if url.startswith("http") else None,
            })
    return out


# ── связи ──────────────────────────────────────────────────────────────────

def load_index(kind_dir: str) -> dict:
    """Индекс чужой зоны — вход ОБЯЗАТЕЛЬНЫЙ, отказ громкий.

    Мягкое «нет файла — работаем без него» здесь было бы хуже отказа: без
    индекса ref_labels собрался бы пустым, плашки связей молча исчезли бы
    со всех одиннадцати разделов, а прогон отчитался бы успехом. Файл чужой
    (зона content), его могут переименовать, имея на то полное право, —
    поэтому сообщение должно называть файл и владельца, а не падать
    трассировкой JSONDecodeError.
    """
    path = ROOT / "public" / "content" / kind_dir / "_index.json"
    if not path.exists():
        raise SystemExit(
            f"нет {path.relative_to(ROOT)} — это индекс зоны content, по нему "
            "строятся подписи плашек связей. Переименовали? Спроси зону content."
        )
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise SystemExit(f"{path.relative_to(ROOT)} не читается: {exc}") from exc
    items = data.get("items") or []
    if not items:
        raise SystemExit(
            f"{path.relative_to(ROOT)} пуст — связей не построить. "
            "Пустой вход это ошибка, а не «нечего делать»."
        )
    return {i["id"]: i for i in items}


def attach_refs(sections: list[dict], indexes: dict) -> dict:
    """Проставить refs по словарю и собрать денормализованный ref_labels."""
    labels: dict[str, dict] = {}

    for sec in sections:
        haystack = " ".join(
            [sec["title_ru"], sec.get("lede_ru") or ""] + sec["paragraphs_ru"]
        )
        buckets: dict[str, list[str]] = {}
        for ref_id, bucket, needles, masks in REF_RULES:
            text = haystack
            for mask in masks:
                text = re.sub(mask, " ", text, flags=re.IGNORECASE)
            if not any(nd in text for nd in needles):
                continue
            buckets.setdefault(bucket, [])
            if ref_id not in buckets[bucket]:
                buckets[bucket].append(ref_id)

            item = indexes[bucket].get(ref_id)
            if item is None:
                raise SystemExit(
                    f"refs: «{ref_id}» нет в public/content/{bucket}/_index.json. "
                    "Ссылка вела бы в никуда — поправь REF_RULES."
                )
            labels[ref_id] = {
                "kind": KIND_OF[bucket],
                "title_ru": item.get("title_ru") or ref_id,
                "camp": item.get("camp"),
                "href": f"{HREF_PAGE[bucket]}#/{HREF_KIND[bucket]}/{ref_id}",
            }
        sec["refs"] = {k: buckets[k] for k in sorted(buckets)}

    return labels


def aggregate_related(sections: list[dict]) -> dict:
    """Сводные related на весь лонгрид — в форме common#/definitions/related."""
    out: dict[str, list[str]] = {}
    for sec in sections:
        for bucket, ids in (sec.get("refs") or {}).items():
            acc = out.setdefault(bucket, [])
            for i in ids:
                if i not in acc:
                    acc.append(i)
    return {k: sorted(v) for k, v in sorted(out.items())}


# ── сборка документа ───────────────────────────────────────────────────────

def build(doc: Document) -> dict:
    parsed = parse(doc)
    sections = parsed["sections"]
    if len(sections) != EXPECTED_SECTIONS:
        raise SystemExit(
            f"разобрано {len(sections)} разделов вместо {EXPECTED_SECTIONS} — "
            "источник изменился, проверь разметку «Раздел N. Название»"
        )

    indexes = {b: load_index(b) for b in ("persons", "parties", "states", "events")}
    labels = attach_refs(sections, indexes)

    attach_placeholders(sections)

    n_media = sum(len(s["media"]) for s in sections)
    n_files = sum(1 for s in sections for m in s["media"] if m["file"])
    n_stub = sum(1 for s in sections for m in s["media"] if m.get("placeholder"))
    n_wanted = sum(len(s["media_wanted_ru"]) for s in sections)

    flags = []
    if n_files == 0 and n_media:
        flags.append("media-missing")
    if n_stub:
        # Ни одного выкупленного оригинала: всё, что показано, — превью
        # из витрины каталога. Флаг виден в json и уходит в предприёмочный
        # чеклист, чтобы «картинки есть» не приняли за «вопрос закрыт».
        flags.append("media-placeholder")
    if n_wanted:
        flags.append("media-wanted")

    title_ru, period_ru = split_title(parsed["title_ru"])

    data = {
        "schema": 1,
        "id": LONGREAD_ID,
        "kind": "longread",
        "title_ru": title_ru,
        "title_en": None,
        "subtitle_ru": period_ru,
        "subtitle_en": None,
        "sort_key_ru": "симбирск",
        "camp": None,
        "dates": {
            "from": "1918",
            "to": "1919",
            "precision": "year",
            "display_ru": period_ru,
            "style": "single",
            "raw": parsed["title_ru"],
        },
        "summary_ru": None,
        "summary_en": None,
        # Английского нет ни в одной справке заказчика, и здесь тоже: колонки EN
        # в источнике просто нет. Не «пусто и ладно», а честный статус — иначе
        # переключатель RU/EN покажет русский и это примут за баг движка (§9).
        "en_status": "missing",
        "sections": sections,
        "sources": parse_sources(doc) + parsed["tail_sources"],
        "notes_ru": parsed["tail"],
        "related": aggregate_related(sections),
        "ref_labels": dict(sorted(labels.items())),
        "media": [],
        "flags": flags,
        "src": {
            "file": SRC_REL,
            "no": None,
            "ns": None,
            "group": None,
            "sha256": doc.file_sha256,
            "parser": f"import_simbirsk.py/docxlib {PARSER_VERSION}",
        },
    }

    return data


def merge_patch(base: dict, patch: dict) -> dict:
    """Слияние человеческой правки поверх машинной. Секции и медиа — по ключу n.

    Копия ГЛУБОКАЯ, и это не перестраховка. При поверхностной `dict(base)`
    вложенные секции и медиа остаются теми же объектами, что и в машинном
    результате: правка из патча оседала заодно и в .gen.json, то есть машинный
    артефакт переставал быть машинным. Ломается ровно та гарантия, ради которой
    трёхфайловая модель и заведена, и молча — оба файла выглядят правдоподобно.
    """
    out = deepcopy(base)
    for k, v in patch.items():
        if k == "sections" and isinstance(v, list):
            by_n = {s["n"]: s for s in out["sections"]}
            for ps in v:
                tgt = by_n.get(ps.get("n"))
                if tgt is None:
                    continue
                for pk, pv in ps.items():
                    if pk == "media" and isinstance(pv, list):
                        mb = {m["n"]: m for m in tgt["media"]}
                        for pm in pv:
                            if pm.get("n") in mb:
                                mb[pm["n"]].update(pm)
                            else:
                                tgt["media"].append(pm)
                        tgt["media"].sort(key=lambda m: m["n"])
                    elif pk != "n":
                        tgt[pk] = pv
        else:
            out[k] = v
    return out


# ── артефакты ──────────────────────────────────────────────────────────────

def render_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def render_data_js(data: dict) -> str:
    """Классический скрипт с тем же содержимым — единственный способ довезти
    контент до страницы под file://, где fetch запрещён."""
    body = json.dumps(data, ensure_ascii=False, indent=2)
    return (
        "/* ┌────────────────────────────────────────────────────────────────┐\n"
        "   │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.               │\n"
        "   │  Источник:  ../IN/new/МТК №29/Симбирск 1918-1919 гг..docx      │\n"
        "   │  Генератор: python3 scripts/simbirsk/import_simbirsk.py        │\n"
        "   │  Канон:     public/content/longreads/simbirsk.json             │\n"
        "   └────────────────────────────────────────────────────────────────┘\n"
        "\n"
        "   Зачем копия json обычным скриптом: киоск запускается с\n"
        "   file:///opt/mtk29/dist/index.html, а под file:// fetch и внешние\n"
        "   module-скрипты блокируются — раздел вышел бы пустым. Тот же приём,\n"
        "   что у сцены /expo/ (data.js, people-data.js).  CLAUDE.md §5. */\n"
        "\n"
        "window.MTK_LONGREADS = window.MTK_LONGREADS || {};\n"
        f"window.MTK_LONGREADS[{json.dumps(LONGREAD_ID)}] = {body};\n"
    )


def render_wanted(data: dict) -> str:
    """Сводка медиа-долга — вопрос заказчику, а не задача зоны."""
    total_links = sum(1 for s in data["sections"] for m in s["media"] if m["source_url"])
    total_slots = sum(len(s["media"]) for s in data["sections"])
    total_wanted = sum(len(s["media_wanted_ru"]) for s in data["sections"])

    L = [
        "# Симбирск 1918–1919 — чего не хватает по иллюстрациям",
        "",
        f"Сгенерировано `scripts/simbirsk/import_simbirsk.py` из `IN/new/МТК №29/{SRC_REL}`.",
        "Руками не править — правка уедет при следующем прогоне.",
        "",
        "## Коротко",
        "",
        f"- Изображений внутри docx — **0**. Ни одного файла заказчик не поставил.",
        f"- Слотов иллюстраций с аннотацией — **{total_slots}**, из них со ссылкой "
        f"на госкаталог — **{total_links}**.",
        f"- Строк «нужно подобрать» — **{total_wanted}**.",
        "",
        "Ссылки на госкаталог **не выкачивались**: это внешний источник, права на",
        "изображения — отдельный разговор с заказчиком. Киоск офлайн и по ним",
        "ходить не может в принципе, файлы нужны физически.",
        "",
        "## Вопросы заказчику",
        "",
        "1. По 13 позициям госкаталога — кто передаёт файлы и на каких правах?",
        "   Нужны оригиналы, а не превью с портала.",
        "2. Позиции «нужно подобрать» — заказчик подбирает сам или это наша работа?",
        "3. Патронный завод: в источнике сказано, что фотографии лежат в музее ОАО",
        "   «Ульяновский патронный завод» и нужен официальный запрос на скан.",
        "   Кто и когда его отправляет?",
        "4. Две карты-схемы (бои за Симбирск, июль 1918; Симбирская операция,",
        "   сентябрь 1918) в docx помечены как «см. литература» — то есть их нужно",
        "   рисовать. Это работа зоны `maps`, и её пока никто не ставил.",
        "",
        "## По разделам",
        "",
    ]

    for s in data["sections"]:
        L.append(f"### {s['n']}. {s['title_ru']}")
        L.append("")
        if not s["media"] and not s["media_wanted_ru"]:
            L.append("_В источнике по этому разделу иллюстраций не заявлено._")
            L.append("")
            continue
        if s["media"]:
            L.append("Заявлено с аннотацией:")
            L.append("")
            for m in s["media"]:
                cap = m["caption_ru"] or "—"
                L.append(f"{m['n']}. {cap}")
                if m["source_note_ru"]:
                    L.append(f"   - примечание источника: {m['source_note_ru']}")
                if m["source_url"]:
                    L.append(f"   - госкаталог: {m['source_url']}")
                else:
                    L.append("   - ссылки нет — источник изображения не указан")
            L.append("")
        if s["media_wanted_ru"]:
            L.append("Нужно подобрать:")
            L.append("")
            for w in s["media_wanted_ru"]:
                L.append(f"- {w}")
            L.append("")

    L += render_requisites(data)

    if data["notes_ru"]:
        L.append("## Примечания из источника")
        L.append("")
        for n in data["notes_ru"]:
            L.append(f"- {n}")
        L.append("")

    if data["sources"]:
        L.append("## Литература и карты, названные в источнике")
        L.append("")
        for s in data["sources"]:
            title = s["title_ru"] or "—"
            L.append(f"- {title}" + (f"  \n  {s['url']}" if s["url"] else ""))
        L.append("")

    return "\n".join(L)


# ── прогон ─────────────────────────────────────────────────────────────────

def main() -> int:
    check = "--check" in sys.argv[1:]

    if not SRC.exists():
        print(f"нет исходника: {SRC}", file=sys.stderr)
        return 2

    gen = build(Document(str(SRC)))

    # Слияние с человеческой правкой. Патча пока нет и быть не должно:
    # иллюстраций заказчик не поставил, править нечего.
    data = gen
    if PATCH.exists():
        data = merge_patch(gen, json.loads(PATCH.read_text(encoding="utf-8")))

    artifacts = [
        (OUT_GEN, render_json(gen)),
        (OUT_JSON, render_json(data)),
        (OUT_DATA, render_data_js(data)),
        (OUT_WANTED, render_wanted(data)),
    ]

    if check:
        stale = [p for p, text in artifacts
                 if not p.exists() or p.read_text(encoding="utf-8") != text]
        if stale:
            for p in stale:
                print(f"  ✗ {p.relative_to(ROOT)} разошёлся с исходником", file=sys.stderr)
            print("\nПрогони: python3 scripts/simbirsk/import_simbirsk.py", file=sys.stderr)
            return 1
        print("simbirsk:check — артефакты совпадают с docx")
        return 0

    for p, text in artifacts:
        write_guarded(p, text)

    n_sec = len(data["sections"])
    n_par = sum(len(s["paragraphs_ru"]) for s in data["sections"])
    n_media = sum(len(s["media"]) for s in data["sections"])
    n_links = sum(1 for s in data["sections"] for m in s["media"] if m["source_url"])
    n_wanted = sum(len(s["media_wanted_ru"]) for s in data["sections"])
    n_refs = len(data["ref_labels"])
    chars = sum(len(p) for s in data["sections"] for p in s["paragraphs_ru"])

    # Со знаменателем: «11/11» и «0/11» различаются мгновенно, а «11» и «0»
    # требуют помнить, сколько должно было быть.
    print(f"разделов {n_sec}/{EXPECTED_SECTIONS}, абзацев {n_par}, знаков {chars}")
    n_stub = sum(1 for s in data["sections"] for m in s["media"] if m.get("placeholder"))
    n_real = sum(1 for s in data["sections"] for m in s["media"]
                 if m.get("file") and not m.get("placeholder"))
    print(f"слотов иллюстраций {n_media} (со ссылкой {n_links}, "
          f"временных {n_stub}/{n_links}, выкупленных {n_real}/{n_media}), "
          f"заявок «нужно подобрать» {n_wanted}")
    print(f"связей с импортированным {n_refs}: "
          + ", ".join(f"{k} {len(v)}" for k, v in data["related"].items()))
    for p, _ in artifacts:
        print(f"  → {p.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
