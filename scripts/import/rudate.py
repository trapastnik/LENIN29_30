"""Русские даты хроники → сортируемые ключи.

Парсер написан на безопасный отказ. В хронике 296 различных форм записи:
`24–26 октября`, `Конец октября – начало ноября`, `15 (28) января`,
`26–1 ноября`, `Ноябрь`, `Ноябрь – январь 1919 г.`.

⚠️ При неудаче — `precision: "unknown"` и сортировка падает на номер строки:
таблицы заказчика хронологически упорядочены, так что порядок сохраняется.
Событие не имеет права потеряться из-за нераспарсенной даты.

Даты хранятся как подписи календаря, а не как абсолютные моменты: до февраля
1918 г. заказчик пишет по юлианскому стилю. Где указаны оба стиля
(`15 (28) января`) — сохраняем оба: основной в `from`/`to`, второй в `alt`.
"""

from __future__ import annotations

import calendar
import re
from typing import Optional

MONTHS_GEN = {
    "января": 1, "февраля": 2, "марта": 3, "апреля": 4, "мая": 5, "июня": 6,
    "июля": 7, "августа": 8, "сентября": 9, "октября": 10, "ноября": 11,
    "декабря": 12,
}
MONTHS_NOM = {
    "январь": 1, "февраль": 2, "март": 3, "апрель": 4, "май": 5, "июнь": 6,
    "июль": 7, "август": 8, "сентябрь": 9, "октябрь": 10, "ноябрь": 11,
    "декабрь": 12,
}
MONTHS = dict(MONTHS_GEN)
MONTHS.update(MONTHS_NOM)

# «Конец/начало/середина» → декада. Границы по ТЗ: 21–31 / 1–10 / 11–20.
DECADE = {
    "начало": (1, 10),
    "середина": (11, 20),
    "конец": (21, 31),
}

_DASH = re.compile(r"[‐-―−-]")
_YEAR = re.compile(r"\b(1[89]\d{2})\b")


def _norm(s: str) -> str:
    s = (s or "").replace("\xa0", " ").replace(" ", " ")
    s = _DASH.sub("–", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


class _Point:
    """Один конец диапазона: день / месяц / декада / год — что удалось узнать."""

    __slots__ = ("day", "month", "decade", "year")

    def __init__(self, day=None, month=None, decade=None, year=None):
        self.day = day
        self.month = month
        self.decade = decade
        self.year = year

    @property
    def empty(self) -> bool:
        return self.day is None and self.month is None and self.decade is None


def _parse_point(text: str) -> Optional[_Point]:
    """Разобрать один конец диапазона. None — не распознано."""
    t = _norm(text).lower().rstrip(" .")
    if not t:
        return None

    year = None
    ym = _YEAR.search(t)
    if ym:
        year = int(ym.group(1))
        t = _norm(_YEAR.sub("", t).replace(" г.", " ").replace(" г", " ")).rstrip(" .")

    p = _Point(year=year)

    # «конец октября», «начало ноября», «середина февраля»
    m = re.match(r"^(начало|середина|конец)\s+(\S+)$", t)
    if m and m.group(2) in MONTHS:
        p.decade = m.group(1)
        p.month = MONTHS[m.group(2)]
        return p
    # «конец» без месяца — месяц придёт от соседнего конца диапазона
    if t in DECADE:
        p.decade = t
        return p

    # «24 октября» / «24» (месяц от соседа)
    m = re.match(r"^(\d{1,2})(?:\s+(\S+))?$", t)
    if m:
        day = int(m.group(1))
        if not 1 <= day <= 31:
            return None
        mon = m.group(2)
        if mon is not None:
            if mon not in MONTHS:
                return None
            p.month = MONTHS[mon]
        p.day = day
        return p

    # «октябрь» / «октября»
    if t in MONTHS:
        p.month = MONTHS[t]
        return p

    return None


def _span(p: _Point, year: int):
    """Точка → (дата начала, дата конца) в пределах её известности."""
    y = p.year or year
    mon = p.month
    if mon is None:
        return None
    last = calendar.monthrange(y, mon)[1]
    if p.decade:
        lo, hi = DECADE[p.decade]
        return (y, mon, min(lo, last)), (y, mon, min(hi, last))
    if p.day is not None:
        d = min(p.day, last)
        return (y, mon, d), (y, mon, d)
    return (y, mon, 1), (y, mon, last)


def _iso(t) -> str:
    return "%04d-%02d-%02d" % t


def _precision(points) -> str:
    if any(p.decade for p in points):
        return "decade"
    if all(p.day is not None for p in points):
        return "day"
    return "month"


def _split_parts(t: str):
    """Разбить на два конца диапазона по тире. `14 августа– 12 сентября` тоже."""
    parts = [x.strip() for x in t.split("–")]
    parts = [x for x in parts if x]
    return parts


def parse(raw: str, year: int) -> dict:
    """Разобрать ячейку даты. `year` — год из имени файла хроники.

    Возвращает всегда, даже при провале: `precision: "unknown"`.
    """
    src = _norm(raw)
    out = {
        "raw": src,
        "display_ru": src,
        "from": None,
        "to": None,
        "precision": "unknown",
        "style": "single",
    }
    if not src:
        return out

    # display: год дописываем, только если его нет в исходной записи
    if not _YEAR.search(src):
        out["display_ru"] = "%s %d г." % (src, year)

    # --- двойная дата: «15 (28) января», «23 ноября (6 декабря)», «18(31) декабря»
    alt_raw = None
    m = re.match(r"^(.*?)\s*\(\s*([^)]*?)\s*\)\s*(.*)$", src)
    if m:
        head, inner, tail = m.group(1), m.group(2), m.group(3)
        if _parse_point(inner) is not None or _parse_point(inner + " " + tail) is not None:
            # основной стиль — то, что вне скобок
            primary = _norm(head + " " + tail)
            alt_raw = _norm(inner + " " + tail) if tail else inner
            src_main = primary
            out["style"] = "dual"
        else:
            src_main = src
    else:
        src_main = src

    main = _resolve(src_main, year)
    if main is None:
        return out
    out.update(main)

    if alt_raw:
        alt = _resolve(alt_raw, year)
        if alt:
            out["alt"] = {"from": alt["from"], "to": alt["to"], "raw": alt_raw}
        else:
            out["style"] = "single"
    return out


def _resolve(text: str, year: int):
    parts = _split_parts(text)
    if not parts:
        return None
    points = []
    for chunk in parts[:2]:
        p = _parse_point(chunk)
        if p is None:
            return None
        points.append(p)
    if not points:
        return None

    # месяц у одного конца — достраиваем второму
    if len(points) == 2:
        a, b = points
        if a.month is None and b.month is not None:
            a.month = b.month
        if b.month is None and a.month is not None:
            b.month = a.month
    if any(p.month is None for p in points):
        return None

    a = points[0]
    b = points[-1]

    # «26–1 ноября»: первый день больше второго в одном месяце — значит первый
    # относится к предыдущему месяцу.
    ya = a.year or year
    yb = b.year or year
    if (len(points) == 2 and a.month == b.month and ya == yb
            and a.day is not None and b.day is not None and a.day > b.day):
        a.month -= 1
        if a.month == 0:
            a.month = 12
            ya -= 1
            a.year = ya

    sa = _span(a, ya)
    sb = _span(b, yb)
    if sa is None or sb is None:
        return None
    start = sa[0]
    end = sb[1]

    # диапазон, перевалившийся через Новый год: «Ноябрь – январь» без явного года
    if end < start and b.year is None:
        end = (end[0] + 1, end[1], end[2])

    if end < start:
        return None

    return {
        "from": _iso(start),
        "to": _iso(end),
        "precision": _precision(points),
    }


def sort_key(date: dict, row: int) -> str:
    """Ключ сортировки. Нераспарсенная дата не теряется — падает на номер строки.

    Строка вида `1917-10-24#0007`, чтобы порядок был лексикографическим и
    стабильным внутри одного дня.
    """
    base = (date or {}).get("from")
    if not base:
        return "9999-99-99#%04d" % row
    return "%s#%04d" % (base, row)
