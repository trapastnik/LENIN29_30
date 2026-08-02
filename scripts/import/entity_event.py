"""Адаптер «Карточки по событиям» — 36 справок.

Форма простейшая: две колонки без шапки, строки идут заголовок · дата ·
основной текст · медиа.

Номер карточки берётся из ИМЕНИ DOCX, а не из имени папки. Проверено:
папка `53 Перекопско-Чонгарская операция` содержит файл
`54 Перекопско-Чонгарская операция.docx`. Настоящего дубля номера 53 нет —
есть опечатка в имени папки. Расхождение уходит в отчёт импорта, чтобы
заказчик подтвердил.

Номера 01–71 — метаданные `src.no`/`src.ns`, а не идентификатор: у «Территории»
и «Хроники» независимые пространства имён, и номера 7, 8, 20, 22–23, 26–28,
30–37, 40–47, 49–53, 55 заняты в обоих.
"""

from __future__ import annotations

import re
from typing import List

import richtext
import rudate
import spravka
from docxlib import classify_en

KIND = "event"

_NO = re.compile(r"^(\d{1,2})[\s._-]+(.*)$")
_YEAR_IN = re.compile(r"\b(19\d{2})\b")


def build(doc, ctx) -> dict:
    table = doc.tables[0]
    zones = spravka.resolve_zones(table)
    rows = spravka.rows_of(table, zones)
    _, content, media_rows = spravka.classify(rows, ctx.scope)

    title_ru = re.sub(r"\s+", " ", content[0].text).strip() if content else ctx.fallback_title

    eid = ctx.resolve_id(KIND, title_ru, slug_hint=ctx.slug_hint)
    self_target = "%s:%s" % (KIND, eid)
    flags: List[str] = []

    date_row = content[1] if len(content) > 1 else None
    date_raw = re.sub(r"\s+", " ", date_row.text).strip() if date_row else ""
    date = _date(date_raw)
    if date["precision"] == "unknown" and date_raw:
        flags.append("dates-unknown")

    body_rows = content[2:] if len(content) > 2 else []
    paras = [p for r in body_rows for p in (r.value.paras if r.value else [])]
    summary_ru = richtext.render(paras, ctx.aliases, self_target)

    en_cells = [r.en for r in rows if r.en is not None]
    en_text = "\n".join(c.text for c in en_cells).strip()
    en_status = classify_en(summary_ru, en_text)

    data = {
        "schema": 1,
        "id": eid,
        "kind": KIND,
        "camp": None,
        "title_ru": title_ru,
        "title_en": None,
        "sort_key_ru": spravka.sort_key(title_ru),
        "dates": date,
        "date": date,
        "summary_ru": summary_ru or None,
        "summary_en": None,
        "en_status": en_status,
        "chronicle_refs": [],
        "media": [],
        "related": {},
        "src": ctx.src_block(doc),
        "flags": flags,
    }

    data["media"] = spravka.build_media(
        media_rows, ctx.scope, ctx.aliases, self_target,
        "media/events/%s" % eid, flags, ctx.reports)
    data["related"] = richtext.related_from(paras, ctx.aliases, self_target)

    if en_status == "copy_of_ru":
        flags.append("en-copy")
    if summary_ru and len(summary_ru) > 3000:
        flags.append("over-tz-limit")
    return data


def _date(raw: str) -> dict:
    """Дата карточки: та же грамматика, что в хронике, но год написан явно."""
    if not raw:
        return {"raw": None, "display_ru": None, "from": None, "to": None,
                "precision": "unknown", "style": "single"}
    m = _YEAR_IN.search(raw)
    year = int(m.group(1)) if m else 1918
    stripped = re.sub(r"\s*\b19\d{2}\b\s*(?:гг?\.)?", " ", raw)
    parsed = rudate.parse(stripped, year)
    parsed["raw"] = raw
    parsed["display_ru"] = raw
    return parsed


def split_no(name: str):
    """«24 Открытие и разгон Учредительного собрания» → («24», остаток)."""
    m = _NO.match((name or "").strip())
    if not m:
        return None, (name or "").strip()
    return m.group(1).zfill(2), m.group(2).strip()
