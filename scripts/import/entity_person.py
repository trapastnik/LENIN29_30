"""Адаптер «Личности» — 70 справок, 3 колонки, 9–14 строк, ПОДПИСЕЙ ПОЛЕЙ НЕТ.

Позиционные индексы тут не работают: число строк регалий плавает от справки
к справке, у части файлов нет колонки ПРИМЕЧАНИЕ. Поэтому разбор идёт от
якоря — строки с годами жизни, она есть практически всегда:

    строка 1        сокращённое ФИО     «В. И. ЛЕНИН (УЛЬЯНОВ)»
    строка 2        имя и отчество      «ВЛАДИМИР ИЛЬИЧ»
    строка 3        фамилия             «ЛЕНИН (УЛЬЯНОВ)»
    строка 4        ЯКОРЬ: годы жизни   «1870–1924», «1884(?)–1919»
    строки 5…n      регалии
    самая длинная   биография
    хвост           медиа

Всё до якоря — имена (последняя строка перед ним всегда фамилия), между якорем
и самой длинной строкой — регалии, дальше биография и медиа.
"""

from __future__ import annotations

import re
from typing import List, Optional

import richtext
import spravka
from docxlib import classify_en

KIND = "person"

# «1870–1924», «1884(?)–1919», «1878 – 1943», «1873–1952 гг.»
YEARS_RE = re.compile(
    r"^\(?(\d{4})\s*(\(\?\))?\s*[–—-]\s*(\d{4})\s*(\(\?\))?\)?\s*(?:гг?\.)?$")


def build(doc, ctx) -> dict:
    table = doc.tables[0]
    zones = spravka.resolve_zones(table)
    rows = spravka.rows_of(table, zones)
    _, content, media_rows = spravka.classify(rows, ctx.scope)

    texts = [re.sub(r"\s+", " ", r.text).strip() for r in content]

    anchor = _find_years(texts)
    flags: List[str] = []

    if anchor is None:
        # без якоря опираемся на прописные: фамилия — последняя строка
        # верхним регистром до первого длинного абзаца
        anchor = _guess_anchor(texts)
        flags.append("dates-unknown")
        names = texts[:anchor]
        years = None
    else:
        names = texts[:anchor]
        years = texts[anchor]

    short_ru = given_ru = surname_ru = None
    if len(names) >= 3:
        short_ru, given_ru, surname_ru = names[0], names[-2], names[-1]
    elif len(names) == 2:
        given_ru, surname_ru = names
    elif len(names) == 1:
        surname_ru = names[0]
    else:
        surname_ru = ctx.fallback_title
        flags.append("name-unparsed")

    rest = content[anchor + 1:] if years is not None else content[anchor:]
    body_idx = _longest(rest)
    regalia_rows = rest[:body_idx] if body_idx is not None else rest
    body_rows = rest[body_idx:] if body_idx is not None else []

    regalia_ru = [re.sub(r"\s+", " ", r.text).strip() for r in regalia_rows]
    regalia_ru = [x for x in regalia_ru if x]

    eid = ctx.resolve_id(KIND, surname_ru or ctx.fallback_title,
                         slug_hint=_slug_hint(surname_ru),
                         match_on=[x for x in (surname_ru, short_ru,
                                               _slug_hint(surname_ru)) if x])
    self_target = "%s:%s" % (KIND, eid)

    paras = [p for r in body_rows for p in (r.value.paras if r.value else [])]
    summary_ru = richtext.render(paras, ctx.aliases, self_target)

    en_cells = [r.en for r in rows if r.en is not None]
    en_text = "\n".join(c.text for c in en_cells).strip()
    en_status = classify_en(summary_ru, en_text)

    title_ru = short_ru or " ".join(x for x in (given_ru, surname_ru) if x)

    data = {
        "schema": 1,
        "id": eid,
        "kind": KIND,
        "camp": ctx.camp,
        "side": ctx.camp,
        "title_ru": title_ru,
        "title_en": None,
        "sort_key_ru": spravka.sort_key(surname_ru or title_ru),
        "short_ru": short_ru,
        "given_ru": given_ru,
        "surname_ru": surname_ru,
        "regalia_ru": regalia_ru,
        "regalia_en": [],
        "dates": _life_dates(years, flags),
        "summary_ru": summary_ru or None,
        "summary_en": None,
        "en_status": en_status,
        "media": [],
        "related": {},
        "src": ctx.src_block(doc),
        "flags": flags,
    }

    data["media"] = spravka.build_media(
        media_rows, ctx.scope, ctx.aliases, self_target,
        "media/persons/%s" % eid, flags, ctx.reports)
    data["related"] = richtext.related_from(paras, ctx.aliases, self_target)

    if en_status == "copy_of_ru":
        flags.append("en-copy")
    if summary_ru and len(summary_ru) > 3000:
        flags.append("over-tz-limit")
    return data


def _find_years(texts: List[str]) -> Optional[int]:
    for i, t in enumerate(texts):
        if len(t) < 40 and YEARS_RE.match(t):
            return i
    return None


def _guess_anchor(texts: List[str]) -> int:
    """Без строки годов: имена — короткие строки прописными в начале справки."""
    i = 0
    for i, t in enumerate(texts):
        if len(t) > 120 or (t and t != t.upper()):
            return max(i, 1)
    return max(i, 1)


def _longest(rows) -> Optional[int]:
    if not rows:
        return None
    lens = [len(r.text) for r in rows]
    best = max(range(len(rows)), key=lambda i: lens[i])
    return best if lens[best] > 200 else None


def _slug_hint(surname: Optional[str]) -> Optional[str]:
    """«ЛЕНИН (УЛЬЯНОВ)» → «ЛЕНИН». Вторая фамилия в слаг не идёт: id уже
    занят как `lenin`, и переназначить его нельзя."""
    if not surname:
        return None
    return re.split(r"[(/]", surname)[0].strip() or None


def _life_dates(years: Optional[str], flags: List[str]) -> dict:
    out = {"display_ru": years, "from": None, "to": None,
           "precision": "unknown", "raw": years}
    if not years:
        return out
    m = YEARS_RE.match(years)
    if not m:
        return out
    out["from"] = m.group(1)
    out["to"] = m.group(3)
    out["precision"] = "year"
    if m.group(2) or m.group(4):
        # «ГРИГОРЬЕВ»: год рождения со знаком вопроса — так в источнике
        flags.append("date-approx")
    return out
