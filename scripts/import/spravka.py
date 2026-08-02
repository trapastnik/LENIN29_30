"""Разбор таблицы справки — общий слой над `docxlib` для всех видов сущностей.

Формы таблиц у заказчика разные, но раскладка колонок одна и та же и читается
из строки заголовка:

    Партии       [span2]Русский | Примечание           RU-зона = колонки 0–1
    Территория   [span2]Русский | Английский           RU-зона = колонки 0–1
    Личности     РУССКАЯ ВЕРСИЯ | АНГЛИЙСКАЯ | ПРИМЕЧ  RU-зона = колонка 0
    Обзорные     Русский | Примечание                  RU-зона = колонка 0

Отсюда правило: границы зон берутся из шапки по смещениям в сетке с учётом
`gridSpan`, а не по числу ячеек в строке. Внутри RU-зоны две ячейки — это
«подпись | значение», одна — сплошной контент.
"""

from __future__ import annotations

import re
from typing import List, Optional

from docxlib import Cell, Row, Table, fold, label_of, norm_space_multiline

# Инвентарный номер музея. Хранится ОТДЕЛЬНО от аннотации и от пояснительного
# хвоста: выводится отдельной строкой мелким кеглем — музейное требование.
INV_RE = re.compile(
    r"(?:ГМПИР|ГАРФ|РГАКФД|РГВА|РГИА|РГАСПИ|ЦГАКФФД|ЦГА\s?КФФД)"
    r"(?:[.,]?\s*Ф\.\s*[IVXLC]+(?:\s*ВС)?\s*[-–]\s*[\w/№.]+)?"
)

# Имя файла картинки в тексте ячейки: «БОЛЬШЕВИКИ_01», «01 РСФСР_01»,
# «ЛЕНИН В.И._03.jpg», «Григорьев Н.А._02.jpg».
MEDIA_NAME_RE = re.compile(
    r"^[0-9A-Za-zА-Яа-яЁё][^\n]{0,70}?[_ ]\d{1,2}\s*(?:\.(?:jpe?g|png|tiff?|webp))?$",
    re.IGNORECASE)


class Zones:
    """Границы колонок в сетке таблицы: где RU, где EN, где ПРИМЕЧАНИЕ."""

    def __init__(self, n_cols: int, en_at: Optional[int], note_at: Optional[int]):
        self.n_cols = n_cols
        self.en_at = en_at
        self.note_at = note_at

    @property
    def ru_width(self) -> int:
        ends = [x for x in (self.en_at, self.note_at) if x is not None]
        return min(ends) if ends else self.n_cols

    def zone_of(self, offset: int) -> str:
        if self.note_at is not None and offset >= self.note_at:
            return "note"
        if self.en_at is not None and offset >= self.en_at:
            return "en"
        return "ru"


def detect_zones(table: Table) -> Zones:
    """Прочитать шапку. Нет шапки — считаем, что вся таблица русская."""
    n_cols = table.n_cols or (len(table[0].cells) if len(table) else 1)
    en_at = note_at = None
    if len(table):
        offset = 0
        for cell in table[0].cells:
            key = label_of(cell.text)
            if key == "lang_en" and en_at is None:
                en_at = offset
            elif key == "note" and note_at is None:
                note_at = offset
            offset += cell.grid_span
    if en_at is None and note_at is None and n_cols == 2:
        # Карточки событий идут без шапки: две колонки — это RU и EN.
        # Обзорные справки партий тоже двухколоночные, но у них шапка есть,
        # и вторая колонка там опознаётся как ПРИМЕЧАНИЕ.
        en_at = 1
    elif en_at is None and note_at is None and n_cols >= 3 and len(table):
        # Шапки нет, а колонок больше двух («65 Выступление Чехословацкого
        # корпуса», «63 Кронштадтское восстание»). Границу русской зоны
        # показывает объединение в первой строке: заголовок справки всегда
        # растянут ровно на неё. Без этого правая колонка считается русской,
        # и заголовком справки становится инструкция верстальщику.
        head = table[0].cells[0].grid_span if table[0].cells else 1
        if 1 <= head < n_cols:
            en_at = head
    return Zones(n_cols, en_at, note_at)


class SpravkaRow:
    """Строка справки, разложенная по зонам."""

    __slots__ = ("index", "ru", "en", "note", "label")

    def __init__(self, index: int, ru: List[Cell], en: Optional[Cell],
                 note: Optional[Cell]):
        self.index = index
        self.ru = ru
        self.en = en
        self.note = note
        self.label = label_of(ru[0].text) if len(ru) > 1 else None

    @property
    def value(self) -> Optional[Cell]:
        """Ячейка со значением: вторая в RU-зоне при подписи, иначе первая."""
        if not self.ru:
            return None
        if len(self.ru) > 1 and self.label:
            return self.ru[1]
        return self.ru[0] if len(self.ru) == 1 else self.ru[-1]

    @property
    def text(self) -> str:
        v = self.value
        return v.text if v is not None else ""

    @property
    def is_labelled(self) -> bool:
        return self.label is not None and len(self.ru) > 1

    @property
    def note_text(self) -> str:
        return norm_space_multiline(self.note.text) if self.note is not None else ""


def rows_of(table: Table, zones: Zones, skip_header: bool = True) -> List[SpravkaRow]:
    out: List[SpravkaRow] = []
    for i, row in enumerate(table):
        if skip_header and i == 0 and _is_header(row):
            continue
        ru: List[Cell] = []
        en = note = None
        offset = 0
        for cell in row.cells:
            zone = zones.zone_of(offset)
            if zone == "ru":
                ru.append(cell)
            elif zone == "en" and en is None:
                en = cell
            elif zone == "note" and note is None:
                note = cell
            offset += cell.grid_span
        if not ru:
            continue
        out.append(SpravkaRow(i, ru, en, note))
    return out


def resolve_zones(table: Table) -> Zones:
    """Зоны по шапке + поправка по содержимому колонки.

    Шапке нельзя верить на слово. В «Территории» третья колонка озаглавлена
    «Английский», а лежат в ней инструкции верстальщику: «Обрезать поля»,
    «Разместить обе стороны купюры на одной странице», «Использовалась
    в СВЕРДЛОВ» — последнее вообще указание на дубликат изображения между
    справками, и терять его нельзя.

    Отличаем примечание от скопированного русского по объёму: копия русского
    сопоставима с русской колонкой, инструкция верстальщику — в разы короче.
    """
    zones = detect_zones(table)
    if zones.en_at is None or zones.note_at is not None:
        return zones

    ru_len = en_len = 0
    for i, row in enumerate(table):
        if i == 0 and _is_header(row):
            continue
        offset = 0
        for cell in row.cells:
            zone = zones.zone_of(offset)
            if zone == "ru":
                ru_len += len(cell.text)
            elif zone == "en":
                en_len += len(cell.text)
            offset += cell.grid_span

    if en_len and ru_len and cyrillic_ratio_of(table, zones) > 0.3:
        if en_len < ru_len * 0.25:
            return Zones(zones.n_cols, None, zones.en_at)
    return zones


def cyrillic_ratio_of(table: Table, zones: Zones) -> float:
    from docxlib import cyrillic_ratio

    chunks = []
    for i, row in enumerate(table):
        if i == 0 and _is_header(row):
            continue
        offset = 0
        for cell in row.cells:
            if zones.zone_of(offset) == "en":
                chunks.append(cell.text)
            offset += cell.grid_span
    return cyrillic_ratio("\n".join(chunks))


def _is_header(row: Row) -> bool:
    keys = {label_of(c.text) for c in row.cells}
    return bool(keys & {"lang_ru", "lang_en", "note"})


# ------------------------------------------------------------- медиа-строки


def media_signals(row: SpravkaRow, scope) -> dict:
    """Три сигнала медиа-строки. Любые два — срабатывание.

    Одного сигнала мало: «Ф.» встречается в тексте биографий, подсветкой
    заказчик метил и не только имена файлов, а маска имени ловит строки вида
    «1918 – 1920 гг.» в справках без подписей полей.
    """
    cell = row.value
    if cell is None:
        return {"mask": False, "highlight": False, "inv": False, "ondisk": False}
    lines = cell.lines
    first = lines[0] if lines else ""
    highlight = bool(cell.paras and cell.paras[0].highlights)
    mask = bool(MEDIA_NAME_RE.match(first.strip()))
    rest = "\n".join(lines[1:])
    inv = bool(INV_RE.search(rest))
    ondisk = bool(scope.resolve(first, mark=False)) if (scope is not None and first) else False
    return {"mask": mask, "highlight": highlight, "inv": inv, "ondisk": ondisk}


def is_media_row(row: SpravkaRow, scope) -> bool:
    s = media_signals(row, scope)
    if row.is_labelled:
        return False
    score = sum(1 for k in ("mask", "highlight", "inv", "ondisk") if s[k])
    if s["mask"] and score >= 2:
        return True
    # имя написано не по маске, но подсветка + инвентарный номер не врут
    if s["highlight"] and s["inv"]:
        return True
    if s["ondisk"] and (s["highlight"] or s["inv"]):
        return True
    return False


def split_caption(text: str):
    """Хвост медиа-ячейки → (аннотация, инв. номер, пояснение).

    Слепив их в один абзац, получишь простыню под фото; в нынешнем
    `people-data.js` именно так и сделано, и это не образец.
    """
    text = (text or "").strip()
    if not text:
        return None, None, None
    m = INV_RE.search(text)
    if not m:
        return _tidy(text), None, None
    caption = _tidy(text[:m.start()])
    inv = _tidy(m.group(0))
    extra = _tidy(text[m.end():])
    return caption or None, inv or None, extra or None


_EDGE = re.compile(r"^[\s.,;:–—-]+|[\s,;:–—-]+$")


def _tidy(s: str) -> str:
    s = norm_space_multiline(s or "")
    s = "\n".join(_EDGE.sub("", ln) for ln in s.split("\n"))
    return "\n".join(ln for ln in (x.strip() for x in s.split("\n")) if ln).strip()


# ------------------------------------------------------------- примечания


_DIRECTIVES = [
    ("trim", re.compile(r"(подрез|обрез|удалить).{0,20}(пол[ея]|бел)", re.I)),
    # «на одной странице» и «на одну страницу» — одно и то же указание
    ("spread", re.compile(r"обе стороны.{0,30}одн\w*\s+страниц\w*", re.I)),
    ("duplicate_of", re.compile(r"(использов\w*|ранее)\s.{0,80}", re.I)),
]

_DUP_VAGUE = {"персоналиях", "персоналии", "справке", "справках", "справка",
              "другой справке", "тексте", "разделе", "экспозиции"}

_DUP_TARGET = re.compile(
    r"использов\w*\s+(?:ранее\s+)?(?:в\s+)?(?:справке\s+про\s+|справке\s+|)([^,.\n]+)", re.I)


def parse_note(text: str):
    """Колонка ПРИМЕЧАНИЕ → (директивы, цель дубликата).

    Там инструкции верстальщику, а не контент: «Подрезать поля», «Разместить
    обе стороны купюры на одной странице», «Использовалась в СВЕРДЛОВ»
    (последнее — указание на дубликат изображения между справками).
    """
    text = (text or "").strip()
    if not text:
        return [], None
    found = []
    for name, rx in _DIRECTIVES:
        if rx.search(text):
            found.append(name)
    target = None
    m = _DUP_TARGET.search(text)
    if m:
        target = m.group(1).strip(" .,«»\"")
        # «Использовалось ранее в персоналиях» — указание есть, адресата нет.
        # Пустая подсказка хуже отсутствующей: её пойдут искать.
        if not target or len(target) > 60 or fold(target) in _DUP_VAGUE:
            target = None
    if target is None and "duplicate_of" in found:
        found.remove("duplicate_of")
    return found, target


# ------------------------------------------------------------- прочее


def sort_key(text: str) -> str:
    """Ключ алфавитной сортировки: без кавычек, ё→е, lowercase."""
    s = fold(text or "")
    s = re.sub(r"[«»\"'()]", "", s)
    return s.strip()


def split_lines(cell: Optional[Cell]) -> List[str]:
    if cell is None:
        return []
    return [ln for ln in (x.strip() for x in cell.lines) if ln]


def split_values(cell: Optional[Cell]) -> List[str]:
    """Строки-значения без внутренних заголовков.

    В «Других названиях» РСФСР семь имён разложены по периодам: строка
    «До июля 1918 г.:» — это заголовок группы, а не название государства.
    В список он попасть не должен; полный текст сохраняется отдельно.
    """
    return [ln for ln in split_lines(cell) if not ln.endswith(":")]


# ------------------------------------------------------------- сборка


def classify(rows: List[SpravkaRow], scope):
    """Строки справки → (подписанные, сплошной контент, медиа).

    Порядок разбора: сначала выделяем медиа (сигналы надёжнее позиции),
    затем подписанные поля, остальное — сплошной контент, из которого
    первая строка обычно заголовок, а самая длинная — основной текст.
    """
    labelled: List[SpravkaRow] = []
    content: List[SpravkaRow] = []
    media: List[SpravkaRow] = []
    for row in rows:
        if is_media_row(row, scope):
            media.append(row)
        elif row.is_labelled:
            labelled.append(row)
        elif row.text.strip():
            content.append(row)
    return labelled, content, media


def build_media(media_rows: List[SpravkaRow], scope, aliases, self_target,
                base_dir: str, flags: List[str], reports=None) -> List[dict]:
    """Медиа-строки → массив media[] схемы."""
    import richtext

    out: List[dict] = []
    for i, row in enumerate(media_rows, start=1):
        cell = row.value
        lines = cell.lines if cell is not None else []
        src_name = lines[0].strip() if lines else ""
        paras = cell.paras[1:] if (cell is not None and len(cell.paras) > 1) else []
        tail = richtext.render(paras, aliases, self_target)
        caption, inv, extra = split_caption(tail)

        hits = scope.resolve(src_name) if scope is not None else []
        directives, dup = parse_note(row.note_text)

        item = {
            "n": i,
            "slot": "lead" if i == 1 else "gallery",
            "file": None,
            "src_file": hits[0].name if hits else None,
            "src_name": src_name or None,
            "caption_ru": caption,
            "caption_en": None,
            "inv_ru": inv,
            "extra_ru": extra,
            "w": None,
            "h": None,
            "tiers": [],
        }
        if len(hits) > 1:
            item["parts"] = [h.name for h in hits]
        if hits:
            from media_link import image_size
            size = image_size(hits[0])
            if size:
                item["w"], item["h"] = size
            item["file"] = "%s/%02d" % (base_dir, i)
        else:
            if "media-missing" not in flags:
                flags.append("media-missing")
            if reports is not None:
                reports.append("аннотация без файла: %r" % src_name)
        if row.note_text:
            item["note_ru"] = row.note_text
        if directives:
            item["directives"] = directives
        if dup:
            item["duplicate_of"] = dup
        out.append(item)
    return out
