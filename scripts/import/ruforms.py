"""Русские словоформы: фраза из разметки заказчика → сущность.

Заказчик пометил упоминания жирным курсивом, но пометил их **в тексте**,
а русский склоняется: «большевиков», «большевиками», «большевики» —
три формы одной сущности, «Временного правительства» и «Временное
правительство» — тоже. Точное сравнение строк ловит хорошо если половину.

Полноценной морфологии тут не нужно и брать её неоткуда — офлайн-киоск,
внешних словарей нет. Достаточно трёх приёмов:

1. **Отсечь окончание.** Список падежных окончаний, длинные раньше коротких.
2. **Огрубить основу до 5 знаков.** Стеммер неизбежно режет неровно
   («КРАСНОВ» → «красн», «Краснова» → «краснов»), и точное равенство основ
   разводит одну фамилию по двум ключам. Пять знаков переживают и это.
3. **Требовать однозначности.** Совпало ровно с одной сущностью — берём;
   с несколькими — не берём вовсе. «Краснова» одинаково похожа на персону
   `krasnov` и на партию `reds-general`, и угадывать тут нельзя: неверная
   ссылка хуже отсутствующей, она уводит посетителя не туда.

⚠️ `-ов`, `-ев`, `-ин` в списке окончаний **отсутствуют намеренно**. Это
падежные окончания существительных, но они же — конец половины русских
фамилий, и «ДУТОВ» от них превращается в «дут». Разницу «большевики /
большевиков» и без них поглощает огрубление до пяти знаков.
"""

from __future__ import annotations

import collections
import re
from typing import Dict, Optional, Set, Tuple

ENDINGS = sorted({
    # прилагательные и причастия
    "ого", "его", "ому", "ему", "ыми", "ими", "ые", "ие", "ых", "их",
    "ым", "им", "ая", "яя", "ое", "ее", "ой", "ей", "ую", "юю", "ый", "ий",
    # существительные
    "иями", "ями", "ами", "ах", "ях", "ам", "ям", "ом", "ем",
    "а", "я", "ы", "и", "у", "ю", "е", "о", "ь",
}, key=len, reverse=True)

# ⚠️ `ия`, `ии`, `ию`, `ья`, `ье`, `ью` в списке отсутствуют НАМЕРЕННО.
# Они перекрываются с однобуквенными и режут разные формы одного слова
# на разную глубину: «Россия» → `росс`, а «Россией» → `росси`, и формы
# перестают сходиться. С одними однобуквенными обе дают `росси`.
# То же ломало «армия»/«армией» и держало неразрезолвленными частотные
# «Советской Россией» и «Добровольческой армией».

COARSE = 5      # до скольких знаков огрубляем основу
MIN_STEM = 3    # короче основу не режем


def stem(token: str) -> str:
    if len(token) <= MIN_STEM:
        return token
    for e in ENDINGS:
        if token.endswith(e) and len(token) - len(e) >= MIN_STEM:
            return token[:-len(e)]
    return token


def norm(s: str) -> str:
    s = (s or "").lower().replace("ё", "е").replace("\xa0", " ")
    s = re.sub(r"\([^)]*\)", " ", s)          # уточнение в скобках не различает
    s = re.sub(r"[«»\"'`,;:!?]", " ", s)
    s = re.sub(r"[–—-]", " ", s)
    return re.sub(r"\s+", " ", s).strip(" .")


def key(s: str) -> Tuple[str, ...]:
    """Фраза → огрублённый ключ сопоставления."""
    toks = [t for t in norm(s).replace(".", " . ").split() if t and t != "."]
    return tuple(stem(t)[:COARSE] for t in toks)


def surfaces(kind: str, item: dict, card: Optional[dict]) -> list:
    """Все написания, под которыми сущность может встретиться в тексте."""
    out = []
    for src in (item, card or {}):
        for f in ("title_ru", "title_full_ru"):
            if src.get(f):
                out.append(src[f])
        for f in ("abbr_ru", "aka_ru"):
            v = src.get(f)
            if isinstance(v, str):
                out.append(v)
            elif isinstance(v, list):
                out.extend(v)
    if kind == "person" and card:
        sur = card.get("surname_ru")
        if sur:
            out.append(sur)
            given = card.get("given_ru")
            if given:
                # «А. И. Деникин» — инициалы плюс фамилия, самая частая форма
                ini = " ".join(w[0] + "." for w in given.split()[:2] if w)
                out.append("%s %s" % (ini, sur))
    # Заголовки индексов собраны через « · »: «Большевики · РКП(б)»
    for s in list(out):
        if "·" in s:
            out.extend(p.strip() for p in s.split("·"))
    return [s for s in out if s and len(norm(s)) > 2]


def build_targets(load_index, load_card) -> Dict[Tuple[str, ...], Set[str]]:
    """Ключ → множество «kind:id». Множество, а не id: неоднозначность видна."""
    table: Dict[Tuple[str, ...], Set[str]] = collections.defaultdict(set)
    for kind, folder in (("person", "persons"), ("party", "parties"),
                         ("state", "states"), ("event", "events")):
        idx = load_index(folder)
        if not idx:
            continue
        for item in idx.get("items", []):
            card = load_card(folder, item["id"])
            for s in surfaces(kind, item, card):
                k = key(s)
                if k:
                    table[k].add("%s:%s" % (kind, item["id"]))
    return table
