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

import camps  # noqa: E402
import docxlib  # noqa: E402
import entity_chronicle  # noqa: E402
import entity_event  # noqa: E402
import entity_party  # noqa: E402
import entity_person  # noqa: E402
import entity_state  # noqa: E402
import richtext  # noqa: E402
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


def write_json(path: Path, data) -> bool:
    """Записать, если содержимое изменилось. Возвращает True при записи."""
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
        except Exception:  # noqa: BLE001
            continue
        if isinstance(data, dict) and data.get("schema") == 1:
            continue
        archive = SRC / "legacy" / kind / name
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        path.unlink()
        stats.legacy.append("%s/%s → content-src/legacy/%s/%s (справка ещё не импортирована, "
                            "запись индекса помечена stub)" % (kind, eid, kind, name))


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
            js = (ROOT / "public/expo/people-data.js").read_text("utf-8")
            table = {}
            for chunk in re.split(r"\{\s*id:\s*'", js)[1:]:
                pid = chunk.split("'", 1)[0]
                m = re.search(r"side:\s*'([a-z-]+)'", chunk)
                if m:
                    table[pid] = m.group(1)
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
        if ent.get("camp") and not rec.get("camp"):
            rec["camp"] = ent["camp"]
        dates = ent.get("dates") or {}
        if dates.get("display_ru"):
            # В плитку идёт одна строка. У «Большевиков» в «Годах деятельности»
            # шесть строк с перечнем переименований партии — это текст карточки,
            # а не подпись плитки.
            rec["dates_display_ru"] = dates["display_ru"].split("\n")[0].strip()
        lead = next((m for m in ent.get("media", []) if m.get("slot") == "lead"), None)
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
        # Сортировка — по тому, что написано на плитке. Иначе «РСФСР» едет
        # в списке на «российская социалистическая…», а глазом это не сходится.
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
        lines.append("| %s | %d |" % (kind, n))
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
    """Сид словаря алиасов из разметки заказчика.

    Существующий `_aliases.json` НЕ перезаписывается: он ведётся руками.
    Русский склоняется, `большевиков` / `большевиками` / `большевики` —
    три формы одной сущности, и морфологию тут не разводят. Автомат кладёт
    очевидные совпадения с заголовками, остальное уезжает в
    `_aliases-todo.csv` по убыванию частоты — оттуда и добираются руками.
    """
    from collections import Counter

    counter: Counter = Counter()
    for p in paths:
        try:
            doc = Document(str(p))
        except Exception as exc:  # noqa: BLE001
            print("  не открылся %s: %s" % (p.name, exc))
            continue
        cells = [c for t in doc.tables for row in t for c in row.cells]
        for c in cells:
            for phrase in richtext.mentions(c.paras):
                counter[phrase.strip()] += 1

    existing = richtext.Aliases()
    auto: Dict[str, str] = {}
    titles = {}
    for kind in ("person", "party", "state", "event"):
        for eid, rec in registry.bucket(kind).items():
            t = fold(rec.get("title_ru") or "")
            if t:
                titles.setdefault(t, "%s:%s" % (kind, eid))

    todo = []
    for phrase, n in counter.most_common():
        key = fold(phrase)
        if not key or len(key) < 3:
            continue
        if key in existing.map:
            continue
        hit = titles.get(key)
        if hit:
            auto[phrase] = hit
        else:
            todo.append((n, phrase))

    path = richtext.ALIASES
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        merged = dict(data.get("map") or {})
        added = {k: v for k, v in auto.items() if k not in merged}
        merged.update(added)
        data["map"] = dict(sorted(merged.items()))
        write_json(path, data)
        print("  алиасов дописано автоматически: %d (файл вёлся руками, не перезаписан)"
              % len(added))
    else:
        write_json(path, {
            "schema": 1,
            "_note": ("Словарь «фраза → сущность». Ведётся РУКАМИ: русский "
                      "склоняется, одной сущности соответствует несколько форм. "
                      "Ключ — фраза как в тексте, значение — «kind:id». "
                      "Реалистичная цель — 350–400 записей ≈ 80 % упоминаний."),
            "map": dict(sorted(auto.items())),
        })
        print("  создан %s, автоматом легло %d" % (path.name, len(auto)))

    lines = ["count;phrase"]
    lines += ["%d;%s" % (n, ph.replace(";", ",")) for n, ph in todo]
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

    for kind in [k for k in kinds if k != "chronicle"]:
        paths = sources_for(kind, args.only, args.pilot)
        built = []
        for path in paths:
            try:
                data = import_unit(kind, path, ctx, stats, manifest, notes_acc)
            except Exception as exc:  # noqa: BLE001
                reports.append("СБОЙ на %s: %s: %s"
                               % (path.relative_to(IN), type(exc).__name__, exc))
                continue
            if data:
                built.append(data)
        by_kind[kind] = built
        counts[kind] = len(built)
        if built:
            archive_stale(kind, {e["id"] for e in built}, stats)
            rebuild_index(kind, built, registry, reports)

    reserve_event_index(ctx.events_by_no, reports)

    date_rows: List[dict] = []
    years_done: List[int] = []
    if "chronicle" in kinds:
        years = args.year or ([1917] if args.pilot else [1917, 1918, 1919, 1920, 1921, 1922])
        for year in years:
            path = IN / "Хроника конфликта" / ("%d.docx" % year)
            if not path.exists():
                reports.append("нет файла хроники: %s" % path.name)
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
        top = sorted(aliases.misses.items(), key=lambda kv: -kv[1])[:12]
        reports.append("не разрезолвлено упоминаний: %d уникальных; чаще всего — %s"
                       % (len(aliases.misses),
                          ", ".join("%s (%d)" % (p, n) for p, n in top)))
    registry.save()
    write_json(SRC / "_manifest.json", manifest)
    write_import_report(stats, reports, counts)

    print("новых %d · изменённых %d · без изменений %d · конфликтов с патчем %d"
          % (stats.new, stats.changed, stats.same, len(stats.conflicts)))
    for kind, n in sorted(counts.items()):
        print("  %-16s %d" % (kind, n))
    if reports:
        print("аномалии (%d) → content-src/_import-report.md" % len(reports))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
