"""Адаптер «Хроника конфликта» — 6 файлов по году, 396 событий.

Колонки: «Политические события | Дата | Военные события».

Поле `track` трёхзначное, не булево: 212 строк только политических,
153 только военных, 31 заполнена в обеих колонках (итого по колонкам —
243 политических и 184 военных).

19 строк несут в колонке даты голый месяц («Ноябрь»). Из них делаются
sticky-заголовки и якоря скролла — `kind: "month-marker"`. Важно: пустых
среди них нет, каждая всё равно несёт событие, поэтому маркер это ПРИЗНАК
строки, а не отдельная запись-разделитель.

Мост к карточкам событий заказчик проставил явной командой прямо в тексте:
«Переход к справке 24 Открытие и разгон Учредительного собрания», ~77 вхождений.
Команда — указание движку, а не контент: из текста она вырезается и уезжает
в поле `card`.
"""

from __future__ import annotations

import re
from typing import List, Optional

import richtext
import rudate
import spravka
from docxlib import Para, label_of

KIND = "chronicle"

JUMP_RE = re.compile(r"^\s*Переход\s+к\s+справке\s+(\d{1,2})[\s.:]*(.*)$", re.I)
_BARE_MONTH = re.compile(
    r"^(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)$",
    re.I)


def build(doc, ctx, year: int) -> dict:
    table = doc.tables[0]
    items: List[dict] = []
    row_no = 0

    for i, row in enumerate(table):
        cells = row.cells
        if len(cells) < 3:
            ctx.reports.append("хроника %d: строка %d с %d ячейками — пропущена"
                               % (year, i, len(cells)))
            continue
        pol_cell, date_cell, mil_cell = cells[0], cells[1], cells[2]
        if i == 0 and label_of(date_cell.text) is None and "дата" in date_cell.text.strip().lower():
            continue
        if i == 0 and date_cell.text.strip().lower().startswith("дата"):
            continue

        row_no += 1
        eid = "ch-%d-%03d" % (year, row_no)
        self_target = "chronicle:%s" % eid

        date_raw = re.sub(r"\s+", " ", date_cell.text.replace("\xa0", " ")).strip()
        date = rudate.parse(date_raw, year)

        pol_paras, pol_jump = _strip_jump(pol_cell.paras)
        mil_paras, mil_jump = _strip_jump(mil_cell.paras)

        pol_ru = richtext.render(pol_paras, ctx.aliases, self_target) or None
        mil_ru = richtext.render(mil_paras, ctx.aliases, self_target) or None

        if pol_ru and mil_ru:
            track = "both"
        elif mil_ru:
            track = "mil"
        else:
            track = "pol"

        # Переход хранится ПО КОЛОНКАМ, а не один на строку. Строка 103
        # года 1918 несёт два: №33 «Красный террор» в политической колонке
        # и №34 «Наступление Восточного фронта» в военной. При `pol or mil`
        # второй отбрасывался молча — и карточка №34 не имела на себя
        # ни одной ссылки во всей хронике при том, что команда в докс есть.
        # Такая строка одна из 76, и найти её удалось только обратной
        # проверкой «на что существующее никто не ссылается».
        cards = {}
        hints = []
        for col, jump in (("pol", pol_jump), ("mil", mil_jump)):
            if not jump:
                continue
            found = ctx.resolve_card(jump[0], jump[1])
            if found:
                cards[col] = found
            else:
                hints.append("%s %s" % jump)
        card = cards.get("pol") or cards.get("mil")
        card_hint = "; ".join(hints) or None

        flags = []
        if date["precision"] == "unknown":
            flags.append("dates-unknown")

        entry = {
            "id": eid,
            "year": year,
            "row": row_no,
            "sort": rudate.sort_key(date, row_no),
            "kind": "event",
            "date": date,
            "track": track,
            "pol_ru": pol_ru,
            "mil_ru": mil_ru,
            "pol_en": None,
            "mil_en": None,
            "card": card,
            "card_pol": cards.get("pol"),
            "card_mil": cards.get("mil"),
            "refs": richtext.related_from(pol_paras + mil_paras, ctx.aliases, self_target),
            "weight": 3 if card else (2 if track == "both" else 1),
        }
        if _BARE_MONTH.match(date_raw):
            entry["kind"] = "month-marker"
            entry["month_label_ru"] = date_raw
        if card_hint:
            entry["card_hint"] = card_hint
        if flags:
            entry["flags"] = flags
        items.append(entry)

    return {
        "schema": 1,
        "year": year,
        "src": ctx.src_block(doc),
        "items": items,
    }


def _strip_jump(paras: List[Para]):
    """Вынуть команду перехода из абзацев. → (абзацы без команды, (номер, заголовок))."""
    kept: List[Para] = []
    jump: Optional[tuple] = None
    for p in paras:
        m = JUMP_RE.match(p.text.strip())
        if m:
            jump = (m.group(1).zfill(2), m.group(2).strip())
            continue
        kept.append(p)
    return kept, jump
