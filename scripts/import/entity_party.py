"""Адаптер «Партии» — 33 справки, 5 из них обзорные по лагерям.

Самый простой вид: подписи полей есть, медиа сходятся почти один к одному.
С него и начинается порядок разработки адаптеров.

Обзорные справки («Красные», «Белые», «Зелёные», «Революционная демократия»,
«Национальные движения») устроены иначе: две колонки, ни полей, ни фото.
Спецкода они не требуют — просто ни одна подпись не находится, и остаётся
заголовок плюс текст.
"""

from __future__ import annotations

import re
from typing import List

import richtext
import spravka
from docxlib import classify_en

KIND = "party"


def build(doc, ctx) -> dict:
    table = doc.tables[0]
    zones = spravka.resolve_zones(table)
    rows = spravka.rows_of(table, zones)
    labelled, content, media_rows = spravka.classify(rows, ctx.scope)

    title_row = content[0] if content else None
    title_ru = title_row.text.strip() if title_row else ctx.fallback_title
    title_ru = re.sub(r"\s+", " ", title_ru).strip()

    fields = {}
    for row in labelled:
        fields.setdefault(row.label, []).extend(spravka.split_lines(row.value))

    # id ищем ПОСЛЕ разбора полей: «Большевики» слагом даёт `bolsheviki`,
    # а исторически занят `bolsheviks` — узнать его можно только по названию
    # и аббревиатурам, сверенным с индексом.
    eid = ctx.resolve_id(KIND, title_ru, match_on=(
        fields.get("abbr", []) + fields.get("title_short", [])
        + fields.get("title_full", [])))
    self_target = "%s:%s" % (KIND, eid)
    flags: List[str] = []

    body_rows = [r for r in content[1:]]
    paras = [p for r in body_rows for p in (r.value.paras if r.value else [])]
    summary_ru = richtext.render(paras, ctx.aliases, self_target)

    en_cells = [r.en for r in rows if r.en is not None]
    en_text = "\n".join(c.text for c in en_cells).strip()
    en_status = classify_en(summary_ru, en_text)

    dates_lines = fields.get("dates", [])
    data = {
        "schema": 1,
        "id": eid,
        "kind": KIND,
        "camp": ctx.camp,
        "title_ru": title_ru,
        "title_en": None,
        "sort_key_ru": spravka.sort_key(title_ru),
        "title_full_ru": "\n".join(fields.get("title_full", [])) or None,
        "abbr_ru": fields.get("abbr", []),
        "aka_ru": fields.get("title_short", []) + fields.get("aka", []),
        "leaders_ru": fields.get("leaders", []),
        "dates": _dates(dates_lines),
        "summary_ru": summary_ru or None,
        "summary_en": None,
        "en_status": en_status,
        "venn_groups": ctx.venn_groups or ([ctx.camp] if ctx.camp else []),
        "media": [],
        "related": {},
        "src": ctx.src_block(doc),
        "flags": flags,
    }

    if not labelled and not media_rows:
        data["_is_general"] = True

    data["media"] = spravka.build_media(
        media_rows, ctx.scope, ctx.aliases, self_target,
        "media/parties/%s" % eid, flags, ctx.reports)
    data["related"] = richtext.related_from(paras, ctx.aliases, self_target)

    if en_status == "copy_of_ru":
        flags.append("en-copy")
    if summary_ru and spravka.visible_len(summary_ru) > 3000:
        flags.append("over-tz-limit")
    if data["dates"].get("precision") == "unknown" and dates_lines:
        flags.append("dates-unknown")
    return data


_YEARS = re.compile(r"(\d{4})(?:\s*(?:г\.|года)?)?\s*[–—-]\s*(\d{4}|наст)")
_YEAR1 = re.compile(r"\b(\d{4})\b")


def _dates(lines) -> dict:
    """Годы деятельности. Форма плавает: «1905 – начало 1930-х гг.»,
    «1901/1902 – середина 1920-х гг.», список периодов в несколько строк."""
    display = "\n".join(lines).strip() or None
    out = {"display_ru": display, "from": None, "to": None,
           "precision": "unknown", "raw": display}
    if not lines:
        return out
    head = lines[0]
    m = _YEARS.search(head)
    if m:
        out["from"] = m.group(1)
        out["to"] = None if m.group(2) == "наст" else m.group(2)
        out["precision"] = "year"
        return out
    years = _YEAR1.findall("\n".join(lines))
    if years:
        out["from"] = years[0]
        out["precision"] = "year"
        # «1905 – начало 1930-х гг.»: конец словами, точной второй даты нет
        if len(years) > 1 and years[-1] != years[0]:
            out["to"] = years[-1]
    return out
