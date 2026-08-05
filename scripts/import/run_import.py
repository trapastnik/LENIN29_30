"""CLI-оркестратор импорта: docx из `IN/` → json в `public/content/`.

Трёхфайловая модель — заказчик пришлёт правки, и машина не имеет права
затирать сделанное руками:

    public/content/persons/lenin.gen.json     ← перезаписывается импортом
    public/content/persons/lenin.patch.json   ← правки руками, машина не трогает
    public/content/persons/lenin.json         ← слияние, результат прогона

Глубокое слияние: патч выигрывает, массив `media` мержится по ключу `n`,
`null` в патче означает «удалить поле».

Прогон печатает: новых / изменённых / без изменений / конфликтов с патчем.
Конфликт — это когда импорт изменил поле, которое перекрыто патчем: значит,
заказчик поправил ровно то место, что уже правили руками, и правку надо
пересмотреть глазами.

Примеры:
    python3 scripts/import/run_import.py --pilot
    python3 scripts/import/run_import.py --kind party
    python3 scripts/import/run_import.py --kind state --only РСФСР
    python3 scripts/import/run_import.py --seed-aliases
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

ROOT = HERE.parents[1]
IN = ROOT.parent / "IN" / "new" / "МТК №29"
CONTENT = ROOT / "public" / "content"
SRC = ROOT / "content-src"

import aliases_manual  # noqa: E402
import camps  # noqa: E402
import docxlib  # noqa: E402
import entity_chronicle  # noqa: E402
import entity_event  # noqa: E402
import entity_party  # noqa: E402
import entity_person  # noqa: E402
import entity_state  # noqa: E402
import richtext  # noqa: E402
import ruforms  # noqa: E402
import spravka  # noqa: E402
from docxlib import Document, Table, fold  # noqa: E402
from ids import IdRegistry  # noqa: E402
from media_link import MediaScope  # noqa: E402

DIRS = {
    "person": CONTENT / "persons",
    "party": CONTENT / "parties",
    "state": CONTENT / "states",
    "event": CONTENT / "events",
    "chronicle": CONTENT / "chronicle",
}

PILOT = {
    # Пилот вехи M1b — не массовый прогон. Набор выбран так, чтобы задеть
    # все формы таблиц и все известные аномалии.
    "party": [
        "Партии/Большевики/Большевики.docx",                      # пять фото, две аббревиатуры
        "Партии/Социалисты-революционеры (эсеры)/Эсеры.docx",     # имена файлов не совпадают регистром
        "Партии/Красные/Красные.docx",                            # обзорная: две колонки, ни полей, ни фото
    ],
    "state": [
        "Территория/Красные/01 РСФСР.docx",                       # символика, многочастное медиа 05 1/05 2
        "Территория/Белые/Вооруженные силы Юга России (ВСЮР)/22 ВСЮР.docx",  # подпапка на единицу
        "Территория/Революционная демократия/34 Комуч.docx",      # к этому id привязана единственная готовая карта
    ],
    "person": [
        "Личности/Ленин/ЛЕНИН В.И..docx",                         # три колонки, занятый id
        "Личности/Колчак/КОЛЧАК А.В..docx",                       # две колонки, без ПРИМЕЧАНИЯ
        "Личности/Григорьев/ГРИГОРЬЕВ Н.А..docx",                 # годы со знаком вопроса
    ],
    "chronicle": ["1917"],
}


# ------------------------------------------------------------------ контекст


class Ctx:
    """Всё, что адаптеру нужно знать о разбираемой единице."""

    def __init__(self, registry: IdRegistry, aliases: richtext.Aliases,
                 reports: List[str]):
        self.registry = registry
        self.aliases = aliases
        self.reports = reports
        self.src_rel = ""
        self.scope: Optional[MediaScope] = None
        self.camp = None
        self.venn_groups = None
        self.fallback_title = ""
        self.slug_hint = None
        self.no = None
        self.ns = None
        self.group = None
        self.events_by_no: Dict[str, List[dict]] = {}
        self.geo_failures: List[str] = []

    def resolve_id(self, kind: str, title: str, slug_hint: Optional[str] = None,
                   match_on: Optional[list] = None) -> str:
        return self.registry.resolve(kind, self.src_rel, title,
                                     slug_hint or self.slug_hint, match_on)

    def src_block(self, doc: Document) -> dict:
        return {
            "file": self.src_rel,
            "no": self.no,
            "ns": self.ns,
            "group": self.group,
            "sha256": doc.sha256,
            "parser": docxlib.PARSER_VERSION,
        }

    def resolve_card(self, no: str, hint: str) -> Optional[str]:
        """«Переход к справке 24 …» → id карточки события.

        Номер уникален не всегда, поэтому при нескольких кандидатах выбираем
        по совпадению слов заголовка.
        """
        cands = self.events_by_no.get(no) or []
        if not cands:
            return None
        if len(cands) == 1:
            return cands[0]["id"]
        want = set(fold(hint).split())
        best, score = None, -1
        for c in cands:
            s = len(want & set(fold(c["title"]).split()))
            if s > score:
                best, score = c, s
        return best["id"] if best else None


# ------------------------------------------------------------------ слияние


def deep_merge(gen, patch):
    """Слить машинный json с ручным патчем. Патч выигрывает.

    `null` в патче — это «удалить поле», а не «записать null»: иначе поле,
    которое человек хотел убрать, вернулось бы следующим прогоном.
    """
    if patch is None:
        return gen
    if isinstance(gen, dict) and isinstance(patch, dict):
        out = dict(gen)
        for k, v in patch.items():
            if v is None:
                out.pop(k, None)
            elif k in out:
                out[k] = deep_merge(out[k], v)
            else:
                out[k] = v
        return out
    if isinstance(gen, list) and isinstance(patch, list):
        if _keyed_by_n(gen) and _keyed_by_n(patch):
            by_n = {item["n"]: dict(item) for item in gen}
            for item in patch:
                n = item.get("n")
                if n in by_n:
                    by_n[n] = deep_merge(by_n[n], item)
                else:
                    by_n[n] = item
            return [by_n[k] for k in sorted(by_n)]
        return patch
    return patch


def _keyed_by_n(lst) -> bool:
    return bool(lst) and all(isinstance(x, dict) and "n" in x for x in lst)


def changed_keys(old: Optional[dict], new: dict) -> set:
    if not old:
        return set()
    keys = set(old) | set(new)
    return {k for k in keys if old.get(k) != new.get(k)}


def patch_keys(patch: Optional[dict]) -> set:
    return set(patch or {})


# ------------------------------------------------------------------ запись


# Каталоги, в которые зоне `content` можно писать (CLAUDE.md §4). Всё
# остальное — чужое: `public/expo/**` у `ui`, `public/content/longreads/**`
# у `simbirsk`, `maps/` и `geo/` у `maps`, `deploy/` и `package.json`
# у оркестратора.
WRITE_ZONES = (
    SRC,
    CONTENT / "persons", CONTENT / "parties", CONTENT / "states",
    CONTENT / "events", CONTENT / "chronicle", CONTENT / "media",
)


def _assert_own_zone(path: Path) -> None:
    """Сторож на границе зоны.

    Разовой проверки мало: список каталогов ещё будет меняться, и однажды
    кто-то добавит в `DIRS` лонгриды — тогда `archive_stale` начнёт удалять
    файлы соседней зоны, и узнается это по пропавшему разделу. Дешевле
    падать сразу и с именем файла.
    """
    p = path.resolve()
    for zone in WRITE_ZONES:
        try:
            p.relative_to(zone.resolve())
            return
        except ValueError:
            continue
    raise PermissionError(
        "запись за пределы зоны content: %s (CLAUDE.md §4)" % path)


def write_json(path: Path, data) -> bool:
    """Записать, если содержимое изменилось. Возвращает True при записи."""
    _assert_own_zone(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def read_json(path: Path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


# ------------------------------------------------------------------ источники


def _iter_docx(folder: Path):
    for p in sorted(folder.rglob("*.docx")):
        if p.name.startswith("~$") or p.name.startswith("."):
            continue
        yield p


def scan_events(registry: IdRegistry, reports: List[str]) -> Dict[str, List[dict]]:
    """Пройти «Карточки по событиям» и закрепить id за всеми 36 заранее.

    Делается до хроники: тогда `card` в ленте резолвится даже если сама
    карточка ещё не импортирована — в индексе она стоит как `stub`.
    """
    base = IN / "Хроника конфликта" / "Карточки по событиям"
    out: Dict[str, List[dict]] = {}
    if not base.is_dir():
        return out
    for folder in sorted(base.iterdir()):
        if not folder.is_dir():
            continue
        docs = [p for p in _iter_docx(folder)]
        if not docs:
            reports.append("карточка события без docx: %s" % folder.name)
            continue
        doc_path = docs[0]
        no_doc, title_doc = entity_event.split_no(doc_path.stem)
        no_dir, title_dir = entity_event.split_no(folder.name)
        no = no_doc or no_dir
        if no_doc and no_dir and no_doc != no_dir:
            reports.append(
                "номер карточки расходится: папка «%s» → %s, файл «%s» → %s; "
                "взят номер из файла" % (folder.name, no_dir, doc_path.name, no_doc))
        src_rel = str(doc_path.relative_to(IN))
        eid = registry.resolve("event", src_rel, title_doc or title_dir,
                               slug_hint=title_dir or title_doc)
        rec = {"id": eid, "no": no, "title": title_doc or title_dir,
               "path": doc_path, "folder": folder}
        out.setdefault(no, []).append(rec)
        # на номер из имени папки тоже отзываемся: лента ссылается по нему
        if no_dir and no_dir != no:
            out.setdefault(no_dir, []).append(rec)
    return out


def sources_for(kind: str, only: Optional[str], pilot: bool) -> List[Path]:
    if pilot:
        return [IN / rel for rel in PILOT.get(kind, []) if (IN / rel).exists()]
    roots = {
        "party": IN / "Партии",
        "state": IN / "Территория",
        "person": IN / "Личности",
        "event": IN / "Хроника конфликта" / "Карточки по событиям",
    }
    root = roots.get(kind)
    if root is None or not root.is_dir():
        return []
    paths = list(_iter_docx(root))
    if only:
        needle = fold(only)
        paths = [p for p in paths if needle in fold(str(p.relative_to(IN)))]
    return paths


# ------------------------------------------------------------------ прогон


class Stats:
    def __init__(self):
        self.new = 0
        self.changed = 0
        self.same = 0
        self.conflicts: List[str] = []
        self.legacy: List[str] = []


def import_unit(kind: str, path: Path, ctx: Ctx, stats: Stats,
                manifest: dict, notes_acc: dict) -> Optional[dict]:
    rel = str(path.relative_to(IN))
    ctx.src_rel = rel
    ctx.fallback_title = path.stem
    ctx.no = None
    ctx.ns = None
    ctx.group = None
    ctx.slug_hint = None
    ctx.camp = None

    parts = path.relative_to(IN).parts
    if kind == "state":
        ctx.ns = "territory"
        ctx.group = parts[1] if len(parts) > 1 else None
        ctx.camp = entity_state.camp_of(ctx.group)
        ctx.no, _ = entity_event.split_no(path.stem)
    elif kind == "event":
        ctx.ns = "chronicle"
        no, title = entity_event.split_no(path.stem)
        ctx.no = no
        _, folder_title = entity_event.split_no(path.parent.name)
        ctx.slug_hint = folder_title or title
    elif kind == "party":
        ctx.ns = "party"
        ctx.group = parts[1] if len(parts) > 1 else None
    elif kind == "person":
        ctx.ns = "person"

    # Медиа-скоуп — папка docx. В плоских группах («Территория/Красные» — 21
    # единица в одной папке) сужаем его номером справки, иначе нечёткое
    # сопоставление утащит картинки соседей.
    siblings = sum(1 for _ in path.parent.glob("*.docx"))
    ctx.scope = MediaScope(path.parent, ctx.no if siblings > 1 else None)

    doc = Document(str(path))
    if not doc.tables:
        ctx.reports.append("в файле нет таблиц: %s" % rel)
        return None
    merged = merge_tables(doc)
    if merged is not None:
        ctx.reports.append("справка разбита на %d таблицы, склеены в одну: %s"
                           % (len(doc.tables), rel))
        doc.tables = [merged]

    builder = {
        "party": entity_party.build,
        "state": entity_state.build,
        "person": entity_person.build,
        "event": entity_event.build,
    }[kind]

    # camp для партий и персон берём из уже выверенных индексов, а не выдумываем
    data = builder(doc, ctx)
    eid = data["id"]
    if kind == "person" and ctx.camp is None:
        assign_person_camp(data, ctx)
    elif kind == "party" and ctx.camp is None:
        camp = lookup_camp(kind, eid)
        if camp:
            data["camp"] = camp
            if not data.get("venn_groups"):
                data["venn_groups"] = [camp]

    apply_media_manifest(data)
    if kind == "state":
        # Связь со слоем карт. Ставится по реестру `maps`, а не руками:
        # полигоны прибывают её прогонами.
        tid = geo_links(ctx.reports, ctx.geo_failures).get(eid)
        if tid:
            data["territory_id"] = tid
    _collect_notes(kind, eid, data, notes_acc)

    outdir = DIRS[kind]
    gen_path = outdir / ("%s.gen.json" % eid)
    patch_path = outdir / ("%s.patch.json" % eid)
    merged_path = outdir / ("%s.json" % eid)

    old_gen = read_json(gen_path)
    patch = read_json(patch_path)

    if merged_path.exists() and old_gen is None:
        # файл существует, но прогонов ещё не было: это ручной черновик из M0.
        # Ничего не теряем — кладём копию в архив и пишем в отчёт.
        archive = SRC / "legacy" / kind / ("%s.json" % eid)
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_text(merged_path.read_text(encoding="utf-8"), encoding="utf-8")
        stats.legacy.append("%s/%s → content-src/legacy/%s/%s.json"
                            % (kind, eid, kind, eid))

    conflicts = changed_keys(old_gen, data) & patch_keys(patch)
    if conflicts:
        stats.conflicts.append("%s/%s: %s" % (kind, eid, ", ".join(sorted(conflicts))))

    write_json(gen_path, data)
    merged = deep_merge(data, patch)
    # Флаг рядом с текстом вопроса: текст читает человек, флаг — счётчик
    # и фильтр. Считается ПОСЛЕ слияния: `open_question_ru` приходит патчем,
    # то есть рукой, и в машинном слепке его ещё нет.
    if merged.get("open_question_ru"):
        fl = list(merged.get("flags") or [])
        if "open-question" not in fl:
            fl.append("open-question")
            merged["flags"] = fl
    wrote = write_json(merged_path, merged)

    if old_gen is None:
        stats.new += 1
    elif old_gen != data:
        stats.changed += 1
    else:
        stats.same += 1

    manifest.setdefault("units", {})[("%s/%s" % (kind, eid))] = {
        "src": rel,
        "sha256": doc.file_sha256,
        "parser": docxlib.PARSER_VERSION,
    }
    if ctx.scope.fuzzy:
        ctx.reports.append("%s/%s: имена сопоставлены нечётко (docx короче файла): %s"
                           % (kind, eid, ", ".join(ctx.scope.fuzzy)))
    unused = [p.name for p in ctx.scope.unused()
              if p.suffix.lower() not in (".docx", ".mp4")]
    if unused:
        ctx.reports.append("%s/%s: файлы в папке без аннотации: %s"
                           % (kind, eid, ", ".join(unused[:8])))
    # В индекс идёт СЛИЯНИЕ, а не машинный слепок: ручные правки из
    # `<id>.patch.json` (лагерь партии, координаты Венна) обязаны попасть
    # в плитку, иначе патч виден в карточке и не виден в списке.
    return merged


def _collect_notes(kind: str, eid: str, data: dict, acc: dict):
    """Колонка ПРИМЕЧАНИЕ — инструкции верстальщику, в контент они не идут."""
    rows = []
    for m in data.get("media", []):
        if m.get("note_ru"):
            rows.append({"n": m["n"], "src_name": m.get("src_name"),
                         "note_ru": m["note_ru"],
                         "directives": m.get("directives", []),
                         "duplicate_of": m.get("duplicate_of")})
    if rows:
        acc.setdefault(kind, {})[eid] = rows


def archive_stale(kind: str, imported: set, stats: Stats):
    """Убрать в архив черновики M0, которые не проходят по схеме.

    Признак — отсутствие поля `schema` при отсутствии `.gen.json` рядом:
    значит, файл написан руками до того, как схема появилась. Оставлять его
    нельзя: он не проходит `content:check` и подсовывает разделу другую форму
    данных. Запись в индексе становится `stub`, и карточка собирается из неё —
    ровно тот сценарий деградации, ради которого stub-fallback и сделан.
    """
    folder = DIRS[kind]
    if not folder.is_dir():
        return
    for path in sorted(folder.glob("*.json")):
        name = path.name
        if name.startswith("_") or name.endswith(".gen.json") or name.endswith(".patch.json"):
            continue
        eid = name[:-5]
        if eid in imported or (folder / ("%s.gen.json" % eid)).exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            # Битый json в своём каталоге — не повод пройти мимо: файл
            # останется на диске, а в индексе его не будет.
            stats.legacy.append("%s/%s: не разобран (%s), оставлен как есть"
                                % (kind, name, type(exc).__name__))
            continue
        if isinstance(data, dict) and data.get("schema") == 1:
            continue
        archive = SRC / "legacy" / kind / name
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        path.unlink()
        stats.legacy.append("%s/%s → content-src/legacy/%s/%s (справка ещё не импортирована, "
                            "запись индекса помечена stub)" % (kind, eid, kind, name))


_GEO_CACHE: Optional[dict] = None


def geo_links(reports: List[str], failures: List[str]) -> dict:
    """`state_id` → id записи реестра карт, но только там, где есть полигон.

    Реестр `public/content/geo/_index.json` ведёт зона `maps`. Связь ставится
    автоматически, а не патчами: полигоны прибывают её прогонами, и ручной
    список пришлось бы догонять каждый раз — а не догнав, мы получили бы ровно
    то, что уже случилось: шесть готовых полигонов, ноль ссылок на них,
    и два зелёных прогона при пустом экране.

    §5 запрещает заводить `territory_id` «на будущее», поэтому берём только
    записи с непустым `polygon`: нет геометрии — нет и ссылки, UI покажет
    заглушку.

    Вход НЕОБЯЗАТЕЛЬНЫЙ по последствиям (без него карточка просто без карты),
    но пропажа файла — не норма: он лежит в том же репозитории. Поэтому мягко
    читаем и громко жалуемся.
    """
    global _GEO_CACHE
    if _GEO_CACHE is not None:
        return _GEO_CACHE
    path = CONTENT / "geo" / "_index.json"
    if not path.exists():
        msg = ("нет реестра карт %s — ни одна справка не получит territory_id, "
               "карты не покажутся" % path.relative_to(ROOT))
        reports.append(msg)
        failures.append(msg)
        _GEO_CACHE = {}
        return _GEO_CACHE
    data = read_json(path) or {}
    out = {}
    for rec in data.get("items", []):
        if not rec.get("polygon"):
            continue
        sid = rec.get("state_id") or rec.get("id")
        if sid:
            out[sid] = rec["id"]
    reports.append("реестр карт: геометрия у %d записей из %d"
                   % (len(out), len(data.get("items", []))))
    _GEO_CACHE = out
    return _GEO_CACHE


def write_pending_report(misses: dict, reports: List[str]) -> None:
    """Развести «ждём музея» и «не доделали сами».

    В одном числе «не разрезолвлено 597» смешаны две разные вещи: упоминания,
    которые нельзя связать без ответа заказчика, и наша недоработка словаря.
    Пока они слиты, непонятно ни сколько связности заблокировано снаружи,
    ни что чинить после ответа.

    Ключ таблицы — номер пункта письма, чтобы счётчик и письмо читались вместе.
    """
    import re as _re

    rules = [(title,
              [_re.compile(p, _re.I) for p in spec["include"]],
              [_re.compile(p, _re.I) for p in spec.get("exclude", [])])
             for title, spec in aliases_manual.PENDING_MUSEUM.items()]
    pending = {r[0]: [] for r in rules}
    ours = []
    for phrase, n in misses.items():
        for title, inc, exc in rules:
            if any(p.search(phrase) for p in inc) \
                    and not any(p.search(phrase) for p in exc):
                pending[title].append((n, phrase))
                break
        else:
            ours.append((n, phrase))

    p_uniq = sum(len(v) for v in pending.values())
    p_hits = sum(n for v in pending.values() for n, _ in v)
    o_hits = sum(n for n, _ in ours)

    # `misses` считает НЕУДАЧНЫЕ ОБРАЩЕНИЯ к словарю, а одно упоминание
    # опрашивается дважды — при отрисовке текста и при сборе `related`.
    # Для доли это неважно, а как абсолютное число оно вдвое завышено.
    # Поэтому рядом печатаем то, что реально видит посетитель: сколько
    # упоминаний осталось жирным курсивом в готовых файлах.
    visible = 0
    for folder in ("persons", "parties", "states", "events"):
        d = CONTENT / folder
        if not d.is_dir():
            continue
        for f in d.glob("*.json"):
            if f.name.startswith("_") or ".gen." in f.name or ".patch." in f.name:
                continue
            txt = f.read_text(encoding="utf-8")
            visible += len(re.findall(r"\*\*\*[^*]+\*\*\*", txt))
    for year_file in (CONTENT / "chronicle").glob("19*.json"):
        visible += len(re.findall(r"\*\*\*[^*]+\*\*\*",
                                  year_file.read_text(encoding="utf-8")))

    lines = ["# Чего ждём от музея — в упоминаниях", "",
             "Считается прогоном импорта. Разделено, потому что в общем счётчике",
             "«не разрезолвлено» смешаны две разные вещи: заблокированное",
             "заказчиком и наша недоработка словаря алиасов.", "",
             "| | фраз | упоминаний |", "|---|---:|---:|",
             "| **ждёт музея** | %d | %d |" % (p_uniq, p_hits),
             "| наша недоработка | %d | %d |" % (len(ours), o_hits), "",
             "На экране остаётся жирным курсивом **%d** упоминаний: одно"
             % visible,
             "упоминание опрашивается словарём дважды — при отрисовке текста",
             "и при сборе `related`, поэтому счётчик обращений выше вдвое.", ""]
    for title, rows in sorted(pending.items()):
        if not rows:
            continue
        rows.sort(reverse=True)
        lines.append("## %s — %d упоминаний" % (title, sum(n for n, _ in rows)))
        lines.append("")
        lines += ["- %s — %d" % (ph, n) for n, ph in rows[:12]]
        if len(rows) > 12:
            lines.append("- …ещё %d фраз" % (len(rows) - 12))
        lines.append("")
    lines += ["## Наша недоработка — верх очереди", ""]
    ours.sort(reverse=True)
    lines += ["- %s — %d" % (ph, n) for n, ph in ours[:15]]
    (SRC / "_pending-museum.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    reports.append("не разрезолвлено: на экране %d упоминаний курсивом; "
                   "по обращениям к словарю ждут музея %d %% (%d из %d). "
                   "Разбор → content-src/_pending-museum.md"
                   % (visible, round(100 * p_hits / max(p_hits + o_hits, 1)),
                      p_hits, p_hits + o_hits))


def check_source_trace(reports: List[str]) -> None:
    """Свежесть снимков, снятых с файлов ЧУЖИХ зон.

    Часть данных мы не вычисляем, а забираем: координаты чипов Венна
    считает зона `design` у себя в лаборатории, мы держим снимок.
    Снимок незаметно устаревает — соседняя зона вправе пересчитать в любой
    момент и не обязана нам сообщать.

    Это НЕ гейт. Расхождение половину времени означает не дефект,
    а «источник ушёл вперёд, мы ещё не забрали»: вечно красная проверка
    не отличается от выключенной. Поэтому строка в отчёте — она отвечает
    на вопрос «мои данные свежие?» в момент, когда он возникает.

    До этого механизмом оповещения был оркестратор: за один день координаты
    применялись дважды, и оба раза о новой версии узнавали из переписки,
    а не из прогона.
    """
    import hashlib

    data = read_json(SRC / "_source-trace.json") or {}
    for rel_path, rec in sorted((data.get("sources") or {}).items()):
        path = ROOT / rel_path
        if not path.exists():
            # Две причины, и вторая вероятнее: своя ветка отстала от main.
            # Первый же прогон дал именно её, а сообщение винило соседа —
            # мелочь, но ровно та, из-за которой правило начинают
            # игнорировать.
            reports.append("след источника: %s не найден. Либо ветка отстала "
                           "от main (проверить: git log origin/<ветка>..origin/main), "
                           "либо зона %s убрала лабораторию. Снимок в %s "
                           "остаётся рабочим в обоих случаях"
                           % (rel_path, rec.get("zone", "?"), rec.get("used_by", "?")))
            continue
        live = hashlib.sha256(path.read_bytes()).hexdigest()
        if live == rec.get("sha256"):
            continue
        reports.append(
            "⚠ след источника: %s ИЗМЕНИЛСЯ у зоны %s — снимок от %s (%s…), "
            "живой файл (%s…). Забрать новую версию: %s"
            % (rel_path, rec.get("zone", "?"), rec.get("taken", "?"),
               (rec.get("sha256") or "")[:8], live[:8], rec.get("used_by", "?")))


CAMP_ROWS: List[dict] = []


def assign_person_camp(data: dict, ctx: "Ctx") -> None:
    """Проставить лагерь личности по регалиям.

    Поля «лагерь» в справках личностей нет — заказчик его не заводил, а
    `people-data.js` для этого не источник: там 17 человек и три значения,
    куда всё небелое и некрасное свалено в `green` (Авксентьев — лидер
    эсеров — «зелёный», Пилсудский — глава Польши — тоже).

    Разбор регалий даёт 68 из 70; двое спорных остаются `null` — пустой
    фильтр честнее неправильного. Итог помечается `camp_source` и
    перебивается вручную через `<id>.patch.json`.
    """
    verdict = camps.classify(data.get("regalia_ru") or [], data.get("summary_ru"))
    camp = verdict["camp"]
    source = "regalia"
    legacy = lookup_camp("person", data["id"])

    if camp is None and legacy:
        camp, source = legacy, "people-data"

    if camp:
        data["camp"] = camp
        data["side"] = camp
        data["camp_source"] = source

    CAMP_ROWS.append({
        "id": data["id"],
        "camp": camp or "",
        "source": source if camp else "",
        "legacy": legacy or "",
        "scores": verdict["scores"],
        "first_regalia": (data.get("regalia_ru") or [""])[0],
    })
    if legacy and camp and legacy != camp:
        ctx.reports.append(
            "лагерь person/%s: по регалиям «%s», в people-data.js «%s» — "
            "взяты регалии" % (data["id"], camp, legacy))
    elif not camp:
        ctx.reports.append(
            "лагерь person/%s не определён: %s — размечать руками через patch"
            % (data["id"], {k: v for k, v in verdict["scores"].items() if v}))


KIND_RU = {"person": "личность", "party": "партия",
           "state": "гособразование", "event": "карточка события"}

TZ_LIMIT = 3000


def visible_len(s: str) -> int:
    """Длина ТЕКСТА, а не строки: markdown-разметка не считается.

    Норма ТЗ про то, сколько читает посетитель. Ссылка
    `[меньшевикам](#/party/mensheviks)` весит 38 знаков при 12 видимых,
    и после роста связности до 82 % сырая длина распухла так, что 42 справки
    числились нарушителями, укладываясь в норму. Считать по строке — значит
    просить заказчика сократить текст, которого он не писал.
    """
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s or "")
    s = re.sub(r"\*{1,3}([^*]*)\*{1,3}", r"\1", s)
    return len(s)


def write_tz_report(by_kind: Dict[str, List[dict]]) -> None:
    """Таблица превышений нормы ТЗ — готовый блок для письма музею.

    Резать текст заказчика самовольно нельзя, но норма ТЗ — его же, и выбор
    между «менять норму» и «сокращать тексты» за ним. Наше дело — точные
    цифры по каждой справке.
    """
    rows = []
    band = 0
    for kind, ents in by_kind.items():
        for e in ents:
            n = visible_len(e.get("summary_ru"))
            if n > TZ_LIMIT:
                rows.append((n - TZ_LIMIT, n, kind, e["id"],
                             e.get("title_ru") or e["id"]))
            elif n > 2500:
                band += 1
    if not rows:
        return
    rows.sort(reverse=True)

    def plural(n, one, few, many):
        m10, m100 = n % 10, n % 100
        if m10 == 1 and m100 != 11:
            return one
        if 2 <= m10 <= 4 and not (12 <= m100 <= 14):
            return few
        return many

    total = sum(len(v) for v in by_kind.values())
    out = ["# Превышение нормы ТЗ по объёму справки", "",
           "Норма ТЗ — **%d знаков** основного текста. Считаются видимые знаки:"
           % TZ_LIMIT,
           "markdown-разметка ссылок в объём не входит, посетитель её не видит.",
           "",
           "Превышают норму: **%d %s из %d**. Ещё %d в диапазоне 2500–3000 —"
           % (len(rows), plural(len(rows), "справка", "справки", "справок"),
              total, band),
           "к ним вопросов нет, но запас невелик.", "",
           "| + сверх нормы | знаков | вид | id | название |",
           "|---:|---:|---|---|---|"]
    for over, n, kind, eid, title in rows:
        out.append("| +%d | %d | %s | `%s` | %s |"
                   % (over, n, KIND_RU.get(kind, kind), eid, title[:60]))
    out += ["",
            "Резать текст заказчика самовольно мы не будем. Норма ТЗ — его же:",
            "либо норма меняется, либо тексты сокращает автор."]
    (SRC / "_tz-limit.md").write_text("\n".join(out) + "\n", encoding="utf-8")


def write_camp_report() -> None:
    if not CAMP_ROWS:
        return
    head = "id;camp;source;people_data_js;first_regalia;" + ";".join(camps.CAMPS)
    lines = [head]
    for r in sorted(CAMP_ROWS, key=lambda x: (x["camp"], x["id"])):
        sc = ";".join(str(r["scores"].get(c, 0)) for c in camps.CAMPS)
        lines.append("%s;%s;%s;%s;%s;%s" % (
            r["id"], r["camp"], r["source"], r["legacy"],
            r["first_regalia"].replace(";", ",")[:80], sc))
    (SRC / "_camps-persons.csv").write_text("\n".join(lines) + "\n", encoding="utf-8")


_MEDIA_MANIFEST: Optional[dict] = None


def media_manifest() -> dict:
    """`content-src/_media-manifest.json` — что собрал `media:build`.

    Читаем манифест, а не смотрим на диск: производные лежат в `.gitignore`,
    и на машине без `../IN/` их нет вовсе. Смотрели бы на диск — поле `tiers`
    в справках то появлялось бы, то исчезало от машины к машине, и каждый
    прогон импорта давал бы разный git diff.
    """
    global _MEDIA_MANIFEST
    if _MEDIA_MANIFEST is None:
        data = read_json(SRC / "_media-manifest.json") or {}
        _MEDIA_MANIFEST = data.get("entries") or {}
    return _MEDIA_MANIFEST


def apply_media_manifest(data: dict) -> None:
    """Проставить `files` и `tiers` по манифесту сборки производных.

    `files` — все производные записи: у двусторонней купюры их две
    (`…/05` и `…/05p2`). `file` остаётся первой из них, чтобы не ломать
    потребителей, которым хватает одной картинки.
    """
    man = media_manifest()
    for m in data.get("media") or []:
        base = m.get("file")
        if not base or not m.get("src_file"):
            continue
        n_parts = len(m.get("parts") or []) or 1
        bases = [base] + ["%sp%d" % (base, k) for k in range(2, n_parts + 1)]
        m["files"] = bases
        # Тиры общие на запись: берём пересечение по всем частям, иначе
        # потребитель запросит тир, которого у второй стороны купюры нет.
        tiers: Optional[list] = None
        for b in bases:
            got = (man.get(b) or {}).get("tiers") or []
            tiers = got[:] if tiers is None else [t for t in tiers if t in got]
        m["tiers"] = tiers or []


def merge_tables(doc):
    """Склеить справку, разложенную по нескольким таблицам, в одну.

    `ДЕНИКИН А.И..docx` — единственный такой файл из 198: шапка, блок имени
    и блок биографии с фотографиями лежат в трёх отдельных таблицах одной
    ширины. Адаптеры читают первую таблицу, и без склейки от справки остаётся
    одна шапка — ни дат, ни регалий, ни пяти фотографий, которые на диске есть.

    Возвращает None, если склеивать нечего или ширины таблиц разошлись
    (тогда это не разорванная справка, а что-то другое — трогать нельзя).
    """
    if len(doc.tables) < 2:
        return None
    widths = {t.n_cols for t in doc.tables}
    if len(widths) != 1:
        return None
    first = doc.tables[0]
    rows = list(first.rows)
    for t in doc.tables[1:]:
        rows.extend(t.rows)
    return Table(rows, first.grid)


_CAMP_CACHE: Dict[str, Dict[str, str]] = {}


def lookup_camp(kind: str, eid: str) -> Optional[str]:
    key = {"party": "parties", "state": "states"}.get(kind)
    if key is None and kind == "person":
        if "person" not in _CAMP_CACHE:
            # Запасной источник лагеря — подборка design-pass. Он НЕОБЯЗАТЕЛЕН:
            # основной разбор идёт по регалиям (camps.py, 68 из 70), а этот файл
            # принадлежит зоне ui и уже переезжал (`people-data.js` →
            # `persons-data.js`). Отсутствие файла не должно ронять импорт:
            # один переименованный чужой файл убивал все 70 персон разом.
            table = {}
            for name in ("public/expo/people-data.js", "public/expo/persons-data.js"):
                path = ROOT / name
                if not path.exists():
                    continue
                js = path.read_text("utf-8")
                for chunk in re.split(r"\{\s*id:\s*'", js)[1:]:
                    pid = chunk.split("'", 1)[0]
                    m = re.search(r"side:\s*'([a-z-]+)'", chunk)
                    if m:
                        table.setdefault(pid, m.group(1))
            _CAMP_CACHE["person"] = table
        return _CAMP_CACHE["person"].get(eid)
    if key is None:
        return None
    if kind not in _CAMP_CACHE:
        idx = read_json(CONTENT / key / "_index.json") or {}
        _CAMP_CACHE[kind] = {i["id"]: i.get("camp") for i in idx.get("items", [])}
    return _CAMP_CACHE[kind].get(eid)


# ------------------------------------------------------------------ индексы


def _sort_key(title: Optional[str]) -> Optional[str]:
    return spravka.sort_key(title) if title else None


def rebuild_index(kind: str, entities: List[dict], registry: IdRegistry,
                  reports: List[str]):
    """Обновить `_index.json`, сохранив всё, что вели руками.

    Индекс обязан быть самодостаточным: зона `ui` рендерит плитку из него,
    а `party-card.js` при 404 собирает карточку из записи индекса.

    Импорт НЕ трогает кураторские поля — координаты Венна, справочник лагерей,
    фон диаграммы. Они пришли из зоны ui/design, и переписать их значит
    сломать раскладку.
    """
    outdir = DIRS[kind]
    path = outdir / "_index.json"
    idx = read_json(path) or {}
    idx["schema"] = 1
    idx["kind"] = kind
    if kind == "person" and not idx.get("camps"):
        # Словарь лагерей для фильтра. У партий и территорий он кураторский
        # и пришёл из M0, у личностей раздела не было вовсе — заводим тот же,
        # чтобы фильтр по лагерям читал одну и ту же таблицу везде.
        idx["camps"] = [{"id": c, "title_ru": t} for c, t in (
            ("red", "Красные"),
            ("white", "Белые"),
            ("rev-dem", "Революционная демократия"),
            ("national", "Национальные движения"),
            ("green", "Зелёные"),
        )]
    items = idx.get("items") or []
    by_id = {it["id"]: it for it in items if "id" in it}
    order = [it["id"] for it in items if "id" in it]

    # Раньше сюда досевались все закреплённые id — на случай, если словарь
    # алиасов сошлётся на ещё не импортированную справку. Досев убран:
    # ссылок на такие записи нет ни одной, а UI считает разделы по длине
    # `items` и рисует плитку на каждый элемент. Заглушки давали завышенные
    # счётчики и карточки-призраки, открывающиеся в пустоту.
    #
    # Индекс описывает то, что UI может показать. Нет файла справки — нет
    # и записи; id при этом остаётся закреплённым в `_ids.json` (реестр
    # append-only), так что при поставке справки запись вернётся с тем же id.

    for ent in entities:
        eid = ent["id"]
        rec = by_id.get(eid, {"id": eid})
        # Заголовок индекса — подпись плитки, её ведут руками и она короткая
        # («РСФСР»). В docx лежит полное официальное название («Российская
        # Социалистическая Федеративная Советская Республика») — им плитку не
        # подписывают. Заполняем, только если своего заголовка ещё нет.
        if not rec.get("title_ru"):
            rec["title_ru"] = ent.get("title_ru")
        if ent.get("title_ru") and ent["title_ru"] != rec["title_ru"]:
            rec["title_full_ru"] = ent["title_ru"]
        if ent.get("abbr_ru"):
            rec["abbr_ru"] = ent["abbr_ru"]
        # Лагерь ПЕРЕЗАПИСЫВАЕТСЯ из справки, а не сохраняется от M0.
        # Раньше стояло «поставить, если в индексе пусто», и кураторское
        # значение переживало пересчёт: у Авксентьева в справке `rev-dem`
        # по регалиям, а в индексе оставался `green` из подборки design-pass,
        # где всё небелое и некрасное свалено в один лагерь. Плитка красилась
        # зелёным, карточка называла революционную демократию — и ни одна
        # сторона не жаловалась. Нашёл гейт сверки, а не глаз.
        if ent.get("camp"):
            rec["camp"] = ent["camp"]
        # Поля, которые ведёт человек или соседняя зона, а плитка обязана
        # знать. Протаскивание в индекс — ОТДЕЛЬНЫЙ шаг, о котором ничто
        # не напоминает: три из них я завела и не протащила в тот же день,
        # когда закрывала ровно этот класс. Ловится гейтом сверки
        # (scripts/validate-content.mjs), а не памятью автора.
        for f in ("territory_id", "map_id", "map_status", "open_question_ru"):
            if ent.get(f) is not None:
                rec[f] = ent[f]
            else:
                rec.pop(f, None)
        if ent.get("title_chip_ru"):
            # Короткая подпись чипа. Полное название остаётся в `title_ru`
            # и в карточке — на диаграмме оно физически не помещается.
            rec["title_chip_ru"] = ent["title_chip_ru"]
        if ent.get("venn_groups"):
            # Раскладку диаграммы строит зона design по индексу, а не по
            # карточкам: тянуть 33 файла ради координат чипа она не будет.
            rec["venn_groups"] = ent["venn_groups"]
        # Координаты чипа. ПЕРЕЗАПИСЫВАЕМ, а не дополняем: у 15 записей
        # стояла прежняя раскладка под ~15 чипов, и оставить её значит
        # поставить часть чипов по старой геометрии, а часть по новой.
        # `xy_locked` — единственное, что защищает позицию: она поставлена
        # руками, и генератор её не трогает.
        if not rec.get("xy_locked"):
            for k in ("x", "y"):
                if ent.get(k) is not None:
                    rec[k] = ent[k]
        dates = ent.get("dates") or {}
        if dates.get("display_ru"):
            # В плитку идёт одна строка. У «Большевиков» в «Годах деятельности»
            # шесть строк с перечнем переименований партии — это текст карточки,
            # а не подпись плитки.
            rec["dates_display_ru"] = dates["display_ru"].split("\n")[0].strip()
        # Плитке нужна ЛЮБАЯ картинка с производными, а не обязательно первая
        # по порядку. У Милюкова не прислан `_01`, но в карточке ещё четыре
        # фотографии — при жёсткой привязке к slot=lead плитка оставалась
        # пустой при непустой карточке. Порядок в самой карточке при этом
        # не меняется: отсутствующая аннотация остаётся аннотацией №1.
        lead = next((m for m in ent.get("media", [])
                     if m.get("slot") == "lead" and m.get("file") and m.get("tiers")),
                    None)
        if lead is None:
            lead = next((m for m in ent.get("media", [])
                         if m.get("file") and m.get("tiers")), None)
        if lead:
            rec["lead_media"] = lead.get("file")
            rec["lead_w"] = lead.get("w")
            rec["lead_h"] = lead.get("h")
            # Без списка собранных тиров `mediaUrl()` в зоне ui честно
            # возвращает null: достроить имя файла по шаблону нельзя — у мелких
            # сканов тиров меньше трёх, апскейла мы не делаем. Индекс обязан
            # быть самодостаточным, иначе плитка остаётся заглушкой при
            # собранных и отдающихся по http производных.
            rec["lead_tiers"] = lead.get("tiers") or []
        else:
            # Ни одной картинки с производными — ключей быть не должно вовсе.
            # `lead_media: null` UI отличить от «поля нет» не обязан, и такая
            # запись уезжает в отрисовку миниатюры с пустым путём.
            for k in ("lead_media", "lead_w", "lead_h", "lead_tiers"):
                rec.pop(k, None)
        # Сортировка — по тому, что написано на плитке. Иначе «РСФСР» едет
        # в списке на «российская социалистическая…», а глазом это не сходится.
        # Ключ сортировки списка. У ЛИЧНОСТЕЙ берём ключ справки: он считан
        # от фамилии, а подпись плитки у трёх записей досталась от M0
        # с инициалами («В. И. ЛЕНИН»), и по ней Колчак встаёт перед
        # Авксентьевым — список перестаёт быть алфавитным. Зона `ui` уже
        # обходила это регуляркой, срезающей инициалы; обход теперь не нужен.
        # У остальных видов сортируем по подписи плитки: посетитель ищет
        # глазами то, что написано, а «ЗСФСР» по полному названию уехало бы
        # на «Ф».
        if kind == "person" and ent.get("sort_key_ru"):
            rec["sort_key_ru"] = ent["sort_key_ru"]
        else:
            rec["sort_key_ru"] = _sort_key(rec.get("title_ru")) or ent.get("sort_key_ru")
        rec["has_card"] = True
        rec.pop("stub", None)
        by_id[eid] = rec
        if eid not in order:
            order.append(eid)

    # Записи, для которых файла ещё нет, помечаем stub — валидатор их пропустит.
    # Пересчитываем всегда: значение с прошлого прогона может быть протухшим
    # (справку убрали в архив, а `has_card: true` в индексе остался).
    imported = {e["id"] for e in entities}
    dropped = []
    for eid, rec in list(by_id.items()):
        if eid in imported or (outdir / ("%s.json" % eid)).exists():
            rec["has_card"] = True
            rec.pop("stub", None)
            continue
        # Карточки нет и не будет: справку не прислали либо запись осталась
        # от снятого дубля транслитерации. Держать её в индексе — значит
        # завышать счётчик раздела и открывать плитку в пустоту.
        del by_id[eid]
        dropped.append("%s «%s»" % (eid, (rec.get("title_ru") or "")[:40]))

    if dropped:
        reports.append("из индекса %s убраны записи без карточки (%d): %s"
                       % (kind, len(dropped), "; ".join(sorted(dropped))))

    idx["items"] = [by_id[i] for i in order if i in by_id]
    if write_json(path, idx):
        reports.append("индекс обновлён: %s" % path.relative_to(ROOT))


def reserve_event_index(events_by_no: Dict[str, List[dict]], reports: List[str]):
    """Завести в индексе событий все 36 карточек как stub.

    Иначе `chronicle.card` ссылался бы в пустоту и валидатор падал бы на
    ленте, которая сама по себе в порядке.
    """
    seen = {}
    for lst in events_by_no.values():
        for rec in lst:
            seen[rec["id"]] = rec
    path = DIRS["event"] / "_index.json"
    idx = read_json(path) or {}
    idx["schema"] = 1
    idx["kind"] = "event"
    by_id = {it["id"]: it for it in (idx.get("items") or []) if "id" in it}
    order = [it["id"] for it in (idx.get("items") or []) if "id" in it]
    for eid, rec in sorted(seen.items(), key=lambda kv: kv[1]["no"] or ""):
        it = by_id.get(eid, {"id": eid})
        it.setdefault("title_ru", rec["title"])
        it["no"] = rec["no"]
        if (DIRS["event"] / ("%s.json" % eid)).exists():
            it["has_card"] = True
            it.pop("stub", None)
        else:
            it["has_card"] = False
            it["stub"] = True
        by_id[eid] = it
        if eid not in order:
            order.append(eid)
    idx["items"] = [by_id[i] for i in order]
    if write_json(path, idx):
        reports.append("индекс событий обновлён: %d карточек" % len(by_id))


def rebuild_chronicle_index(years: List[int], reports: List[str]):
    path = DIRS["chronicle"] / "_index.json"
    idx = read_json(path) or {}
    idx["schema"] = 1
    idx["kind"] = "chronicle"
    years_rec = {y["year"]: y for y in (idx.get("years") or [])}
    for year in years:
        data = read_json(DIRS["chronicle"] / ("%d.json" % year)) or {}
        items = data.get("items", [])
        years_rec[year] = {
            "year": year,
            "file": "%d.json" % year,
            "count": len(items),
            "pol": sum(1 for i in items if i["track"] in ("pol", "both")),
            "mil": sum(1 for i in items if i["track"] in ("mil", "both")),
            "cards": sum(1 for i in items if i.get("card")),
        }
    idx["years"] = [years_rec[y] for y in sorted(years_rec)]
    if write_json(path, idx):
        reports.append("индекс хроники обновлён")


# ------------------------------------------------------------------ отчёты


def write_dates_report(rows: List[dict]):
    """Отчёт по датам. Просматривается глазами — это ворота вехи.

    Кроме нераспарсенного сюда попадают расхождения порядка: неточные даты
    («Конец марта», «Март–апрель») заказчик ставит в конце месячного блока,
    и сортировка по дате переставила бы их вверх. Порядок вывода — `row`.
    """
    out = ["year;row;raw;from;to;precision;style;status"]
    for r in rows:
        out.append(";".join(str(x) for x in (
            r["year"], r["row"], r["raw"].replace(";", ","), r["from"] or "",
            r["to"] or "", r["precision"], r["style"], r["status"])))
    (SRC / "_dates-report.csv").write_text("\n".join(out) + "\n", encoding="utf-8")


def write_import_report(stats: Stats, reports: List[str], counts: Dict[str, int]):
    lines = ["# Отчёт импорта", "",
             "Парсер: `%s`" % docxlib.PARSER_VERSION, ""]
    lines.append("## Итог прогона")
    lines.append("")
    lines.append("| Показатель | Значение |")
    lines.append("|---|---|")
    lines.append("| новых | %d |" % stats.new)
    lines.append("| изменённых | %d |" % stats.changed)
    lines.append("| без изменений | %d |" % stats.same)
    lines.append("| конфликтов с патчем | %d |" % len(stats.conflicts))
    for kind, n in sorted(counts.items()):
        lines.append("| %s | %s |" % (kind, n))
    lines.append("")
    if stats.conflicts:
        lines += ["## Конфликты с ручными патчами", "",
                  "Импорт изменил поле, которое перекрыто `.patch.json`. "
                  "Значит, заказчик поправил ровно то место, что правили руками — "
                  "патч надо пересмотреть.", ""]
        lines += ["- `%s`" % c for c in stats.conflicts] + [""]
    write_camp_report()

    if stats.legacy:
        lines += ["## Черновики M0, убранные в архив", "",
                  "Файлы существовали до первого прогона импорта. Копии сохранены, "
                  "ручные правки переносить в `.patch.json`.", ""]
        lines += ["- %s" % c for c in stats.legacy] + [""]
    if reports:
        lines += ["## Аномалии", "",
                  "Аномалии не роняют прогон. Разбираются глазами.", ""]
        lines += ["- %s" % r for r in reports] + [""]
    (ROOT / "content-src" / "_import-report.md").write_text(
        "\n".join(lines), encoding="utf-8")


# ------------------------------------------------------------------ алиасы


def seed_aliases(paths: List[Path], registry: IdRegistry) -> None:
    """Сид словаря алиасов из разметки заказчика, с поправкой на склонение.

    Существующий `_aliases.json` НЕ перезаписывается: он ведётся руками,
    автомат только дописывает недостающее. Сопоставление — `ruforms`:
    точное сравнение строк ловит хорошо если половину, потому что заказчик
    пометил упоминания прямо в тексте, а русский склоняется.

    Берём только однозначные совпадения. Фраза, похожая сразу на две
    сущности («Краснова» — персона `krasnov` или партия `reds-general`),
    уходит в `_aliases-todo.csv` с обоими кандидатами: неверная ссылка хуже
    отсутствующей, она уводит посетителя не туда, а неразрезолвленное
    упоминание просто остаётся жирным курсивом.
    """
    from collections import Counter

    counter: Counter = Counter()
    for p in paths:
        try:
            doc = Document(str(p))
        except Exception as exc:  # noqa: BLE001
            print("  не открылся %s: %s" % (p.name, exc))
            continue
        for t in doc.tables:
            for row in t:
                for c in row.cells:
                    for phrase in richtext.mentions(c.paras):
                        counter[phrase.strip()] += 1

    def load_index(folder):
        return read_json(CONTENT / folder / "_index.json")

    def load_card(folder, eid):
        return read_json(CONTENT / folder / ("%s.json" % eid))

    targets = ruforms.build_targets(load_index, load_card)
    existing = richtext.Aliases()

    # Кураторские решения перекрывают автомат: спорные пары и сущности,
    # названные в тексте иначе, чем в проекте (разбор — aliases_manual).
    by_key = {ruforms.key(ph): tgt for ph, tgt in aliases_manual.BY_KEY.items()}
    deny = {ruforms.key(ph) for ph in aliases_manual.DENY}

    auto: Dict[str, str] = {}
    todo = []
    ambiguous = []
    for phrase, n in counter.most_common():
        if not phrase or len(phrase) < 3 or phrase in existing.map:
            continue
        k = ruforms.key(phrase)
        if phrase in aliases_manual.EXACT:
            auto[phrase] = aliases_manual.EXACT[phrase]
            continue
        if k in deny:
            todo.append((n, phrase, "снято вручную: слишком общая фраза"))
            continue
        if k in by_key:
            auto[phrase] = by_key[k]
            continue
        cands = targets.get(k)
        if not cands:
            todo.append((n, phrase, ""))
        elif len(cands) == 1:
            auto[phrase] = next(iter(cands))
        else:
            ambiguous.append((n, phrase, sorted(cands)))
            todo.append((n, phrase, " | ".join(sorted(cands))))

    path = richtext.ALIASES
    data = read_json(path) or {
        "schema": 1,
        "_note": ("Словарь «фраза → сущность». Ключ — фраза как в тексте, "
                  "значение — «kind:id». Автомат дописывает однозначные "
                  "совпадения (scripts/import/ruforms.py), спорные и "
                  "ненайденные уходят в _aliases-todo.csv."),
    }
    merged = dict(data.get("map") or {})
    added = {k: v for k, v in auto.items() if k not in merged}
    manual_hits = sum(1 for k in added if k in aliases_manual.EXACT
                      or ruforms.key(k) in by_key)
    merged.update(added)
    data["map"] = dict(sorted(merged.items()))
    write_json(path, data)
    print("  алиасов дописано: %d (из них по кураторским правилам %d), всего %d"
          % (len(added), manual_hits, len(merged)))
    if ambiguous:
        print("  неоднозначных, оставлены человеку: %d" % len(ambiguous))
        for n, ph, cands in ambiguous[:6]:
            print("     %-34s → %s" % (ph[:34], ", ".join(cands)))

    lines = ["count;phrase;candidates"]
    lines += ["%d;%s;%s" % (n, ph.replace(";", ","), c) for n, ph, c in todo]
    (SRC / "_aliases-todo.csv").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("  неразрезолвленных фраз: %d → content-src/_aliases-todo.csv" % len(todo))


# ------------------------------------------------------------------ main


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Импорт справок заказчика docx → json")
    ap.add_argument("--pilot", action="store_true",
                    help="пилот вехи M1b: 3 партии, 3 территории, 3 личности, 1917 год")
    ap.add_argument("--kind", action="append", default=[],
                    choices=["party", "state", "person", "event", "chronicle"])
    ap.add_argument("--only", help="подстрока пути для отбора файлов")
    ap.add_argument("--year", action="append", type=int, default=[],
                    help="годы хроники")
    ap.add_argument("--seed-aliases", action="store_true",
                    help="досеять словарь алиасов из разметки заказчика")
    args = ap.parse_args(argv)

    if not IN.is_dir():
        print("нет каталога источников: %s" % IN, file=sys.stderr)
        return 2

    kinds = args.kind or (["party", "state", "person", "chronicle"] if args.pilot
                          else ["party", "state", "person", "event", "chronicle"])

    SRC.mkdir(parents=True, exist_ok=True)
    registry = IdRegistry()
    aliases = richtext.Aliases()
    reports: List[str] = []
    stats = Stats()
    manifest = read_json(SRC / "_manifest.json") or {"schema": 1}
    manifest["parser"] = docxlib.PARSER_VERSION
    notes_acc: Dict[str, dict] = {}

    ctx = Ctx(registry, aliases, reports)
    ctx.events_by_no = scan_events(registry, reports)

    if args.seed_aliases:
        pool = []
        for kind in ("party", "state", "person", "event"):
            pool += sources_for(kind, args.only, False)
        pool += sorted((IN / "Хроника конфликта").glob("19*.docx"))
        print("сид алиасов по %d файлам…" % len(pool))
        seed_aliases(pool, registry)
        registry.save()
        return 0

    counts: Dict[str, int] = {}
    by_kind: Dict[str, List[dict]] = {}

    failures: List[str] = []
    ctx.geo_failures = failures

    for kind in [k for k in kinds if k != "chronicle"]:
        paths = sources_for(kind, args.only, args.pilot)
        built = []
        for path in paths:
            try:
                data = import_unit(kind, path, ctx, stats, manifest, notes_acc)
            except Exception as exc:  # noqa: BLE001
                msg = "СБОЙ на %s: %s: %s" % (path.relative_to(IN),
                                              type(exc).__name__, exc)
                reports.append(msg)
                failures.append(msg)
                continue
            if data:
                built.append(data)
        by_kind[kind] = built
        counts[kind] = "%d/%d" % (len(built), len(paths))
        # Источник есть, а на выходе пусто — это сбой, а не «нечего импортировать».
        # Именно так выглядел переезд people-data.js: прогон отчитался
        # «person 0», вернул успех и оставил на диске файлы прошлого прогона.
        if paths and not built:
            failures.append("%s: источников %d, импортировано 0 — раздел "
                            "не обновлён, на диске данные прошлого прогона"
                            % (kind, len(paths)))
        if built:
            archive_stale(kind, {e["id"] for e in built}, stats)
            rebuild_index(kind, built, registry, reports)

    reserve_event_index(ctx.events_by_no, reports)
    check_source_trace(reports)
    write_tz_report(by_kind)

    date_rows: List[dict] = []
    years_done: List[int] = []
    if "chronicle" in kinds:
        years = args.year or ([1917] if args.pilot else [1917, 1918, 1919, 1920, 1921, 1922])
        for year in years:
            path = IN / "Хроника конфликта" / ("%d.docx" % year)
            if not path.exists():
                # Не «нечего импортировать», а пропавший источник: год
                # запрошен явно. Переименуют папку хроники — молча уцелеют
                # файлы прошлого прогона, и заметят это на приёмке.
                msg = "нет файла хроники: %s" % path.name
                reports.append(msg)
                failures.append(msg)
                continue
            ctx.src_rel = str(path.relative_to(IN))
            ctx.scope = None
            ctx.no = None
            ctx.ns = "chronicle"
            ctx.group = None
            doc = Document(str(path))
            data = entity_chronicle.build(doc, ctx, year)
            out = DIRS["chronicle"] / ("%d.json" % year)
            old = read_json(out)
            write_json(out, data)
            if old is None:
                stats.new += 1
            elif old != data:
                stats.changed += 1
            else:
                stats.same += 1
            manifest.setdefault("units", {})["chronicle/%d" % year] = {
                "src": ctx.src_rel, "sha256": doc.file_sha256,
                "parser": docxlib.PARSER_VERSION,
            }
            years_done.append(year)
            counts["chronicle-%d" % year] = len(data["items"])
            prev = None
            for item in data["items"]:
                d = item["date"]
                status = "ok"
                if d["precision"] == "unknown":
                    status = "НЕ РАЗОБРАНО"
                elif prev and d["from"] and d["from"] < prev:
                    status = "порядок: дата раньше предыдущей (неточная дата — так у заказчика)"
                if d["from"]:
                    prev = d["from"]
                date_rows.append({
                    "year": year, "row": item["row"], "raw": d.get("raw") or "",
                    "from": d.get("from"), "to": d.get("to"),
                    "precision": d["precision"], "style": d.get("style", "single"),
                    "status": status,
                })
        if years_done:
            rebuild_chronicle_index(years_done, reports)

    if date_rows:
        write_dates_report(date_rows)
    for kind, payload in notes_acc.items():
        write_json(DIRS[kind] / "_notes.json",
                   {"schema": 1,
                    "_note": "Колонка ПРИМЕЧАНИЕ из docx — инструкции верстальщику "
                             "и медиа-конвейеру, не контент раздела.",
                    "items": payload})

    reports.extend(registry.notes)
    if aliases.misses:
        write_pending_report(aliases.misses, reports)
    registry.save()
    write_json(SRC / "_manifest.json", manifest)
    write_import_report(stats, reports, counts)

    print("новых %d · изменённых %d · без изменений %d · конфликтов с патчем %d"
          % (stats.new, stats.changed, stats.same, len(stats.conflicts)))
    for kind, n in sorted(counts.items()):
        print("  %-16s %s" % (kind, n))
    if reports:
        print("аномалии (%d) → content-src/_import-report.md" % len(reports))

    # Сбой обязан быть громким. Раньше он уходил строкой в файл отчёта,
    # прогон печатал «person 0» и возвращал успех — и переезд одного чужого
    # файла молча выбил 70 персон из семидесяти. Отчёт, который выглядит
    # правдоподобно, опаснее упавшего прогона.
    if failures:
        print("\n%s\nСБОЕВ: %d — раздел(ы) НЕ обновлены\n%s"
              % ("!" * 60, len(failures), "!" * 60), file=sys.stderr)
        for msg in failures[:10]:
            print("  " + msg, file=sys.stderr)
        if len(failures) > 10:
            print("  … ещё %d, все в content-src/_import-report.md"
                  % (len(failures) - 10), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
