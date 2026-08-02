"""Низкоуровневый разбор docx через прямое чтение `word/document.xml`.

Почему не python-docx: он не возвращает текст внутри `w:hyperlink`, а в справках
заказчика ссылки есть. Почему не pandoc: его grid-table markdown непарсим надёжно —
ширины ячеек, переносы внутри ячейки и объединённые ячейки схлопываются.

`xml.etree.ElementTree` из stdlib даёт всё нужное сразу:

    текст гиперссылки       обход w:hyperlink//w:t наравне с w:r//w:t
    URL                     word/_rels/document.xml.rels по r:id
    перекрёстные ссылки     w:rPr содержит одновременно w:b и w:i
    имя файла картинки      w:highlight + первая строка ячейки
    объединённые ячейки     w:tcPr/w:gridSpan/@w:val

Главная тонкость — Word рвёт одну фразу на несколько `w:run` по границам
правок (rsid). Поэтому смежные runs с одинаковым форматированием склеиваются
ещё в `Para`: иначе анализ жирного курсива даёт мусор вроде отдельных «ов» и «)».
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from typing import Iterator, List, Optional

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

PARSER_VERSION = "1.0.0"


def q(tag: str, ns: str = W) -> str:
    return "{%s}%s" % (ns, tag)


# ---------------------------------------------------------------- run / para


class Run:
    """Отрезок текста с однородным форматированием."""

    __slots__ = ("text", "bold", "italic", "highlight", "url", "caps")

    def __init__(self, text="", bold=False, italic=False, highlight=None,
                 url=None, caps=False):
        self.text = text
        self.bold = bold
        self.italic = italic
        self.highlight = highlight
        self.url = url
        self.caps = caps

    @property
    def key(self):
        """Ключ форматирования — по нему склеиваются смежные runs."""
        return (self.bold, self.italic, self.highlight, self.url, self.caps)

    @property
    def is_entity_ref(self) -> bool:
        """Жирный курсив = разметка заказчика «здесь упомянута другая сущность»."""
        return self.bold and self.italic and bool(self.text.strip())

    def __repr__(self):
        f = "".join(c for c, on in
                    (("b", self.bold), ("i", self.italic), ("h", bool(self.highlight)),
                     ("l", bool(self.url))) if on)
        return "Run(%r%s)" % (self.text[:40], "/" + f if f else "")


class Para:
    """Абзац. Runs уже склеены по форматированию."""

    __slots__ = ("runs",)

    def __init__(self, runs: List[Run]):
        self.runs = runs

    @property
    def text(self) -> str:
        return "".join(r.text for r in self.runs)

    @property
    def highlights(self) -> List[str]:
        return [r.highlight for r in self.runs if r.highlight]

    def __repr__(self):
        return "Para(%r)" % self.text[:60]


class Cell:
    __slots__ = ("paras", "grid_span")

    def __init__(self, paras: List[Para], grid_span: int = 1):
        self.paras = paras
        self.grid_span = grid_span

    @property
    def text(self) -> str:
        """Текст ячейки; абзацы разделены \\n, хвостовые пробелы срезаны."""
        return "\n".join(p.text for p in self.paras).strip()

    @property
    def lines(self) -> List[str]:
        """Непустые строки ячейки."""
        return [ln for ln in (p.text.strip() for p in self.paras) if ln]

    @property
    def runs(self) -> Iterator[Run]:
        for p in self.paras:
            for r in p.runs:
                yield r

    @property
    def highlights(self) -> List[str]:
        return [r.highlight for r in self.runs if r.highlight]

    def __repr__(self):
        return "Cell(%r)" % self.text[:60]


class Row:
    __slots__ = ("cells",)

    def __init__(self, cells: List[Cell]):
        self.cells = cells

    def __len__(self):
        return len(self.cells)

    def __getitem__(self, i) -> Cell:
        return self.cells[i]

    @property
    def width(self) -> int:
        """Ширина строки в колонках сетки, с учётом объединений."""
        return sum(c.grid_span for c in self.cells)

    @property
    def texts(self) -> List[str]:
        return [c.text for c in self.cells]

    def __repr__(self):
        return "Row(%s)" % " | ".join(repr(c.text[:24]) for c in self.cells)


class Table:
    __slots__ = ("rows", "grid")

    def __init__(self, rows: List[Row], grid: List[int]):
        self.rows = rows
        self.grid = grid

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i) -> Row:
        return self.rows[i]

    def __iter__(self):
        return iter(self.rows)

    @property
    def n_cols(self) -> int:
        return len(self.grid)


class Document:
    """Открытый docx: таблицы, свободные абзацы, sha256 исходника."""

    def __init__(self, path):
        self.path = str(path)
        with zipfile.ZipFile(self.path) as z:
            raw = z.read("word/document.xml")
            try:
                rels_raw = z.read("word/_rels/document.xml.rels")
            except KeyError:
                rels_raw = None
        self.sha256 = hashlib.sha256(raw).hexdigest()
        self.rels = _parse_rels(rels_raw)
        self._root = ET.fromstring(raw)
        body = self._root.find(q("body"))
        self.tables: List[Table] = []
        self.paras: List[Para] = []
        for node in list(body):
            if node.tag == q("tbl"):
                self.tables.append(self._table(node))
            elif node.tag == q("p"):
                self.paras.append(_para(node, self.rels))

    @property
    def file_sha256(self) -> str:
        """sha256 всего файла — для манифеста идемпотентности."""
        h = hashlib.sha256()
        with open(self.path, "rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()

    def _table(self, tbl) -> Table:
        grid_node = tbl.find(q("tblGrid"))
        grid = []
        if grid_node is not None:
            for g in grid_node.findall(q("gridCol")):
                try:
                    grid.append(int(g.get(q("w")) or 0))
                except ValueError:
                    grid.append(0)
        rows = []
        for tr in tbl.findall(q("tr")):
            cells = []
            for tc in tr.findall(q("tc")):
                span = 1
                tcPr = tc.find(q("tcPr"))
                if tcPr is not None:
                    gs = tcPr.find(q("gridSpan"))
                    if gs is not None:
                        try:
                            span = int(gs.get(q("val")) or 1)
                        except ValueError:
                            span = 1
                cells.append(Cell([_para(p, self.rels) for p in tc.findall(q("p"))], span))
            rows.append(Row(cells))
        return Table(rows, grid)

    @property
    def all_text(self) -> str:
        """Весь текст документа — для кросс-чека с pandoc."""
        out = [p.text for p in self.paras]
        for t in self.tables:
            for row in t:
                for c in row.cells:
                    out.append(c.text)
        return "\n".join(x for x in out if x)


# ---------------------------------------------------------------- внутреннее


def _parse_rels(raw: Optional[bytes]) -> dict:
    if not raw:
        return {}
    root = ET.fromstring(raw)
    out = {}
    for rel in root.findall(q("Relationship", PKG_REL)):
        rid = rel.get("Id")
        if rid:
            out[rid] = rel.get("Target") or ""
    return out


def _run(node, url=None) -> Optional[Run]:
    """Один w:r → Run. Возвращает None, если в run нет текста."""
    rPr = node.find(q("rPr"))
    bold = italic = caps = False
    highlight = None
    if rPr is not None:
        bold = _toggle(rPr, "b")
        italic = _toggle(rPr, "i")
        caps = _toggle(rPr, "caps")
        h = rPr.find(q("highlight"))
        if h is not None:
            val = h.get(q("val"))
            if val and val != "none":
                highlight = val
    chunks = []
    for child in node:
        tag = child.tag
        if tag == q("t"):
            chunks.append(child.text or "")
        elif tag == q("tab"):
            chunks.append("\t")
        elif tag in (q("br"), q("cr")):
            chunks.append("\n")
        elif tag == q("noBreakHyphen"):
            chunks.append("‑")
        elif tag == q("softHyphen"):
            chunks.append("")
    if not chunks:
        return None
    return Run("".join(chunks), bold, italic, highlight, url, caps)


def _toggle(rPr, name: str) -> bool:
    """w:b без w:val — включено; w:val="0"/"false" — выключено."""
    node = rPr.find(q(name))
    if node is None:
        return False
    val = node.get(q("val"))
    return val not in ("0", "false", "off")


def _para(p, rels: dict) -> Para:
    raw: List[Run] = []
    for node in p:
        if node.tag == q("r"):
            r = _run(node)
            if r is not None:
                raw.append(r)
        elif node.tag == q("hyperlink"):
            rid = node.get(q("id", R))
            url = rels.get(rid) if rid else None
            anchor = node.get(q("anchor"))
            if url is None and anchor:
                url = "#" + anchor
            for sub in node.findall(q("r")):
                r = _run(sub, url=url)
                if r is not None:
                    raw.append(r)
        elif node.tag in (q("ins"), q("smartTag"), q("sdt")):
            # правки и «умные теги» прозрачны — забираем вложенные runs
            for sub in node.iter(q("r")):
                r = _run(sub)
                if r is not None:
                    raw.append(r)
    return Para(merge_runs(raw))


def merge_runs(runs: List[Run]) -> List[Run]:
    """Склеить смежные runs с одинаковым форматированием.

    Word режет фразу по границам правок, из-за чего один жирный курсив
    приезжает как «левых », «социалист», «ов». Без склейки анализ упоминаний
    даёт мусорные фрагменты вроде «)» и «а».
    """
    out: List[Run] = []
    for r in runs:
        if out and out[-1].key == r.key:
            out[-1].text += r.text
        else:
            out.append(Run(r.text, r.bold, r.italic, r.highlight, r.url, r.caps))
    return [r for r in out if r.text]


# ---------------------------------------------------------------- утилиты


_PUNCT_EDGE = re.compile(r"^[\s :；;.,\-–—]+|[\s :；;.,\-–—]+$")


def norm_space(s: str) -> str:
    """Схлопнуть пробелы, но сохранить переводы строк."""
    s = s.replace(" ", " ").replace("\t", " ")
    s = re.sub(r"[ ]{2,}", " ", s)
    return s.strip()


def fold(s: str) -> str:
    """Нормализация для сравнения: lowercase, ё→е, без пунктуации по краям."""
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace(" ", " ").replace("ё", "е").replace("Ё", "Е")
    s = _PUNCT_EDGE.sub("", s)
    return re.sub(r"\s+", " ", s).strip().lower()


# Разброс подписей полей у заказчика реальный: «Аббревиатуры» / «Аббревиатура» /
# «Сокращения» — одно и то же поле. Словарь синонимов, а не позиционные индексы.
LABELS = {
    "abbr": ["аббревиатуры", "аббревиатура", "сокращения", "сокращение",
             "аббревиатуры (сокращения)"],
    "title_full": ["полное название", "полное наименование", "официальное название",
                   "полное официальное название"],
    "title_short": ["краткое название", "короткое название", "сокращённое название",
                    "сокращенное название", "неофициальное название"],
    "aka": ["другие названия", "другое название", "иные названия",
            "альтернативные названия", "варианты названия"],
    "dates": ["период существования", "период", "годы деятельности",
              "годы существования", "время существования", "даты",
              "период деятельности"],
    "leaders": ["лидеры", "лидер", "руководители", "руководитель",
                "во главе", "главы"],
    "participants": ["участники", "состав", "в составе", "участие"],
    "symbols": ["символика", "символы", "флаг", "герб"],
    "capital": ["столица", "центр", "административный центр"],
    "note": ["примечание", "примечания", "комментарий"],
    "lang_ru": ["русский", "русская версия текста", "русский язык", "рус"],
    "lang_en": ["английский", "английская версия текста", "английский язык", "англ"],
}

_LABEL_INDEX = {}
for _key, _variants in LABELS.items():
    for _v in _variants:
        _LABEL_INDEX[fold(_v)] = _key


def label_of(text: str) -> Optional[str]:
    """Подпись поля → канонический ключ. None, если это не подпись.

    Отсечка по длине: подпись поля не бывает длиннее 40 знаков, а вот
    значением может оказаться абзац, начинающийся тем же словом.
    """
    if text is None:
        return None
    first = text.strip().split("\n")[0]
    if len(first) > 40:
        return None
    return _LABEL_INDEX.get(fold(first))


def plain(cell) -> str:
    """Ячейка → чистый текст без разметки."""
    if cell is None:
        return ""
    if isinstance(cell, Cell):
        return norm_space_multiline(cell.text)
    return norm_space_multiline(str(cell))


def norm_space_multiline(s: str) -> str:
    lines = [norm_space(ln) for ln in (s or "").split("\n")]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def cyrillic_ratio(s: str) -> float:
    letters = [c for c in (s or "") if c.isalpha()]
    if not letters:
        return 0.0
    cyr = sum(1 for c in letters if "Ѐ" <= c <= "ӿ")
    return cyr / len(letters)


def classify_en(ru: str, en: str) -> str:
    """'ok' | 'missing' | 'copy_of_ru'.

    Ни одной переведённой справки из 198 не пришло: колонка EN либо пуста,
    либо в неё скопирован русский текст. Отдать такой текст как английский —
    значит показать русский под флагом EN, и на приёмке это примут за баг движка.
    """
    en = (en or "").strip()
    if not en:
        return "missing"
    if cyrillic_ratio(en) > 0.3:
        return "copy_of_ru"
    if fold(en) == fold(ru or ""):
        return "copy_of_ru"
    return "ok"
