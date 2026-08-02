"""Адаптер «Территория» — 59 справок в 6 группах.

Группы: Красные 21 · Национальные государства 13 · Белые 8 ·
Революционная демократия 7 · Восстания 7 · Интервенция 3.

«Белые» устроены иначе остальных: там на каждую единицу заведена подпапка.
Спецкода под них нет и не нужно. Правило одно и покрывает обе формы:
**единица справки = docx-файл, а не папка**, медиа-скоуп = папка этого файла.

`territory_id` импорт НЕ придумывает: реестр полигонов ведёт зона `maps`
(`public/content/geo/_index.json`). Нет полигона — `null`, UI показывает
заглушку. Заводить id «на будущее» нельзя.
"""

from __future__ import annotations

import re
from typing import List

import richtext
import spravka
from docxlib import classify_en
from entity_party import _dates

KIND = "state"

# Папка группы → лагерь. Единственный источник camp для территорий.
GROUP_CAMP = {
    "красные": "red",
    "белые": "white",
    "революционная демократия": "rev-dem",
    "национальные государства": "national",
    "восстания": "uprising",
    "интервенция": "intervention",
}


def build(doc, ctx) -> dict:
    table = doc.tables[0]
    zones = spravka.resolve_zones(table)
    rows = spravka.rows_of(table, zones)
    labelled, content, media_rows = spravka.classify(rows, ctx.scope)

    title_row = content[0] if content else None
    title_ru = re.sub(r"\s+", " ", title_row.text.strip()) if title_row else ctx.fallback_title

    fields = {}
    raw_fields = {}
    symbol_rows = []
    for row in labelled:
        if row.label == "symbols":
            symbol_rows.append(row)
        else:
            fields.setdefault(row.label, []).extend(spravka.split_values(row.value))
            raw_fields.setdefault(row.label, []).extend(spravka.split_lines(row.value))

    # Заголовок в docx полный («Российская Социалистическая Федеративная
    # Советская Республика»), а id исторически — по аббревиатуре (`rsfsr`).
    # Слаг берём из аббревиатуры, сопоставление — по всем известным названиям.
    abbr = fields.get("abbr", [])
    eid = ctx.resolve_id(
        KIND, title_ru,
        slug_hint=(abbr[0] if abbr else None),
        match_on=abbr + fields.get("aka", []) + fields.get("title_short", []))
    self_target = "%s:%s" % (KIND, eid)
    flags: List[str] = []

    paras = [p for r in content[1:] for p in (r.value.paras if r.value else [])]
    summary_ru = richtext.render(paras, ctx.aliases, self_target)

    en_cells = [r.en for r in rows if r.en is not None]
    en_text = "\n".join(c.text for c in en_cells).strip()
    en_status = classify_en(summary_ru, en_text)

    data = {
        "schema": 1,
        "id": eid,
        "kind": KIND,
        "camp": ctx.camp,
        "title_ru": title_ru,
        "title_en": None,
        "sort_key_ru": spravka.sort_key(title_ru),
        "abbr_ru": fields.get("abbr", []),
        "aka_ru": fields.get("aka", []) + fields.get("title_short", []),
        "aka_raw_ru": "\n".join(raw_fields.get("aka", [])) or None,
        "participants_ru": fields.get("participants", []),
        "capital_ru": (fields.get("capital") or [None])[0],
        "dates": _dates(fields.get("dates", [])),
        "summary_ru": summary_ru or None,
        "summary_en": None,
        "en_status": en_status,
        "symbols": _symbols(symbol_rows, ctx),
        "territory_id": None,
        "media": [],
        "related": {},
        "src": ctx.src_block(doc),
        "flags": flags,
    }

    data["media"] = spravka.build_media(
        media_rows, ctx.scope, ctx.aliases, self_target,
        "media/states/%s" % eid, flags, ctx.reports)
    data["related"] = richtext.related_from(paras, ctx.aliases, self_target)

    if en_status == "copy_of_ru":
        flags.append("en-copy")
    if summary_ru and len(summary_ru) > 3000:
        flags.append("over-tz-limit")
    return data


def _symbols(rows, ctx) -> List[dict]:
    """Строка «Символика»: флаг/герб. Отдельно от media[] — выводится не в галерее."""
    from media_link import image_size

    out = []
    for row in rows:
        for line in spravka.split_lines(row.value):
            hits = ctx.scope.resolve(line) if ctx.scope else []
            if not hits and ctx.scope:
                # Подпись без имени файла. Ищем по смыслу — заказчик сокращает
                # («34 Комуч флг.svg»), поэтому смотрим на основу слова.
                low = line.lower()
                stems = [s for s, keys in (("фл", ("флаг", "знамя")),
                                           ("герб", ("герб",)),
                                           ("печат", ("печат",)))
                         if any(k in low for k in keys)]
                for stem in stems:
                    hits = [f for f in ctx.scope.files if stem in f.name.lower()]
                    if hits:
                        break
                for h in hits:
                    ctx.scope.used.add(h)
            item = {"file": None, "src_file": hits[0].name if hits else None,
                    "caption_ru": line, "w": None, "h": None}
            if hits:
                size = image_size(hits[0])
                if size:
                    item["w"], item["h"] = size
            out.append(item)
    return out


def camp_of(group: str):
    return GROUP_CAMP.get((group or "").strip().lower())
