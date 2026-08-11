"""Обратный индекс: кто ссылается на справку.

Прямые связи в проекте есть с первого дня — они лежат в тексте справки
разрешённой ссылкой. Обратных не было: 3020 разрешённых связей вели
в одну сторону, и с карточки Ленина нельзя было узнать, что на него
ссылаются сто тридцать четыре других справки. На киоске посетителю
больше негде посмотреть — внешнего поиска нет.

Форма согласована с оркестратором 2026-08-05. Три решения и доводы,
чтобы следующий не переигрывал их заново:

**Отдельный файл, а не поле в справке.** Обратные связи меняются, когда
меняется ЧУЖАЯ справка. Лежи они в карточке — правка текста большевиков
переписывала бы десятки чужих `.gen.json`, в которых никто ничего
не менял, и диф показывал бы правку там, где её не было. Трёхфайловая
модель (§9 CLAUDE.md) держится на читаемом дифе.

**Потолок 8 и порядок по силе связи.** Потолок задевает 43 сущности
из 146 (29 %); при 6 — уже 42 %. Порядок — по числу упоминаний
в тексте источника, не по алфавиту: сигнал есть у трети связей
(478 из 1451 имеют силу > 1), и у Колчака первым идёт «Российское
Государство» с одиннадцатью упоминаниями, а не случайное имя на «А».

**Хроника — числом, не кнопками.** У РСФСР 58 строк хроники, у больше-
виков 34: кнопками они вытеснили бы справки из блока. Два поля вместо
одного, потому что механизма два и они непересекающиеся:
`chronicle_mentions` — строка упоминает сущность в тексте (персоны,
партии, гособразования); `chronicle_jumps` — строка ведёт кнопкой
на карточку события (только события). Одно поле с разным смыслом
по виду записи — та самая двусмысленность, из которой через месяц
получается неверная подпись.

**Ключа нет, если показывать нечего.** Не пустой массив, а отсутствие:
пустой блок «связанные справки: —» читается как поломка движка.
Потребителю правило одно — нет ключа, нет блока.

⚠️ **Событие не бывает целью ссылки.** В тексте справок нет ни одной
ссылки вида `#/event/…`, и `related` на события не ссылается ни разу
(проверено по всем 198). События достижимы только кнопкой из хроники,
поэтому у всех 36 в блоке будет одна строка «открывается из N строк
хроники» и ни одной кнопки. Это факт данных, а не недоделка: заказчик
в тексте события не упоминает.

Запуск:
    python3 scripts/import/backlinks.py            # собрать
    python3 scripts/import/backlinks.py --check    # ворота: файл свежий?

`--check` пересчитывает по СПРАВКАМ и сравнивает с тем, что закоммичено,
а не выход генератора с выходом того же генератора: последнее доказывает
детерминированность, а не правильность (§13, сверка с самим собой).
Пустой вход — ошибка, а не «расхождений нет».
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "public" / "content"
OUT = CONTENT / "_backlinks.json"

# Каталог раздела → сегмент маршрута. Маршрут в единственном числе
# (`#/person/lenin`), каталог во множественном — это разные строки,
# и путать их нельзя: потребитель строит href по `kind`.
SECTIONS = {"persons": "person", "parties": "party",
            "states": "state", "events": "event"}
ORDER = {"person": 0, "party": 1, "state": 2, "event": 3}

CAP = 8
YEARS = range(1917, 1923)

LINK = re.compile(r"\]\(#/([a-z]+)/([^)]+)\)")


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def load_cards() -> Dict[str, dict]:
    """Слитые справки с диска: `<id>.json` без `.gen`/`.patch`/`_index`."""
    cards: Dict[str, dict] = {}
    for folder, kind in SECTIONS.items():
        for path in sorted((CONTENT / folder).glob("*.json")):
            name = path.name
            if name.startswith("_") or ".gen." in name or ".patch." in name:
                continue
            data = read_json(path)
            if not data or not data.get("id"):
                continue
            data["_kind"] = kind
            cards[data["id"]] = data
    return cards


def collect(cards: Dict[str, dict]) -> Dict[str, dict]:
    """Входящие связи: справка → справка, плюс два счётчика хроники."""
    out: Dict[str, Dict[str, int]] = {}
    refs: Dict[str, List[tuple]] = {}
    mentions: Dict[str, int] = {}
    jumps: Dict[str, int] = {}

    for src_id, card in cards.items():
        # Сила связи — сколько раз источник упомянул цель в тексте.
        # `related` добавляет цель с силой 1, если в тексте её не было:
        # это кураторское «связано», и оно слабее упоминания.
        #
        # ⚠️ `related` учитывается в ОБЕ стороны намеренно, хотя даёт всего
        # 11 связей сверх текста на все 198 справок. Учти его только
        # во входящих — получим пару, где на карточке B видно «A ссылается
        # на нас», а на карточке A этого нет. Асимметрия в самих данных,
        # чинить её потребителю нечем.
        strength: Dict[str, int] = {}
        for match in LINK.finditer(card.get("summary_ru") or ""):
            target = match.group(2)
            if target in cards:
                strength[target] = strength.get(target, 0) + 1
        for group in (card.get("related") or {}).values():
            for target in (group or []):
                if target in cards:
                    strength.setdefault(target, 1)
        strength.pop(src_id, None)
        out[src_id] = strength
        for target, n in strength.items():
            refs.setdefault(target, []).append((n, src_id))

    for year in YEARS:
        data = read_json(CONTENT / "chronicle" / ("%d.json" % year))
        if not data:
            continue
        for row in data.get("items") or []:
            seen = set()
            for group in (row.get("refs") or {}).values():
                for target in (group or []):
                    tid = target if isinstance(target, str) else (target or {}).get("id")
                    if tid in cards:
                        seen.add(tid)
            for tid in seen:
                mentions[tid] = mentions.get(tid, 0) + 1
            for field in ("card_pol", "card_mil"):
                tid = row.get(field)
                if tid and tid in cards:
                    jumps[tid] = jumps.get(tid, 0) + 1

    def entry(other: str, **extra) -> dict:
        rec = {"id": other,
               "kind": cards[other]["_kind"],
               "title_ru": cards[other].get("title_ru") or other}
        rec.update(extra)
        return rec

    def order_key(other: str, weight: int):
        # Сила ↓, затем вид (персоны → партии → гособразования → события),
        # затем заголовок. Стабилен между прогонами.
        return (-weight, ORDER[cards[other]["_kind"]],
                cards[other].get("title_ru") or "", other)

    items: Dict[str, dict] = {}
    for target in sorted(cards):
        rec: Dict[str, object] = {}
        outgoing = out.get(target) or {}
        incoming = {sid: n for n, sid in (refs.get(target) or [])}
        # Взаимные — отдельной группой, а не в обеих сразу. Иначе 119
        # карточек из 198 показали бы одну и ту же кнопку дважды подряд
        # (максимум 7 повторов на карточке): отношение и правда разное,
        # но кнопка выглядит одинаково, и это читается как поломка.
        both = sorted(set(outgoing) & set(incoming),
                      key=lambda o: order_key(o, outgoing[o] + incoming[o]))
        if both:
            rec["mutual"] = [entry(o, n_out=outgoing[o], n_in=incoming[o])
                             for o in both]
        # ⚠️ У исходящих потолка НЕТ, и это не забывчивость. У них есть
        # видимый эталон — сам текст справки: посетитель видит подсвеченные
        # термины и обязан найти их внизу. Урежь до восьми — десять подсветок
        # останутся без кнопки, и это заметно. У входящих эталона нет вовсе,
        # там потолок незаметен. Замер: потолок на `out` экономит 6 КБ
        # из 129 — то есть решает вид, а не вес.
        only_out = sorted((o for o in outgoing if o not in incoming),
                          key=lambda o: order_key(o, outgoing[o]))
        if only_out:
            rec["out"] = [entry(o, n=outgoing[o]) for o in only_out]
        only_in = sorted((s for s in incoming if s not in outgoing),
                         key=lambda s: order_key(s, incoming[s]))
        if only_in:
            rec["refs"] = [entry(s, n=incoming[s]) for s in only_in[:CAP]]
            if len(only_in) > CAP:
                rec["more"] = len(only_in) - CAP
        if mentions.get(target):
            rec["chronicle_mentions"] = mentions[target]
        if jumps.get(target):
            rec["chronicle_jumps"] = jumps[target]
        # Показывать нечего — ключа нет вовсе.
        if rec:
            items[target] = rec
    return items


def build() -> dict:
    cards = load_cards()
    # Пустой вход — ошибка, а не «связей нет». Переименуют каталог раздела,
    # и молчаливый ноль уедет в сборку под видом честного результата.
    if not cards:
        raise SystemExit("backlinks: справок не найдено в %s — "
                         "проверь каталоги разделов" % CONTENT)
    items = collect(cards)
    return {
        "schema": 1,
        "_note": ("Связи справки в обе стороны. Генерируется "
                  "`scripts/import/backlinks.py`, руками не правится. "
                  "Ключа нет — строки не рисуется. `kind` — сегмент маршрута "
                  "(`#/person/lenin`), не каталог. Группы не пересекаются: "
                  "`out` — только исходящие, `refs` — только входящие, "
                  "`mutual` — взаимные, с силой в обе стороны "
                  "(`n_out` отсюда, `n_in` сюда). Потолок `cap` действует "
                  "ТОЛЬКО на `refs`: у исходящих есть видимый эталон — "
                  "подсвеченные термины в тексте справки, и урезать их "
                  "значит оставить подсветку без кнопки."),
        "cap": CAP,
        "items": items,
    }, cards


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    payload, cards = build()
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"

    items = payload["items"]
    with_refs = sum(1 for v in items.values() if v.get("refs"))
    with_out = sum(1 for v in items.values() if v.get("out"))
    with_mutual = sum(1 for v in items.values() if v.get("mutual"))
    capped = sum(1 for v in items.values() if v.get("more"))
    only_chron = sum(1 for v in items.values()
                     if not (v.get("refs") or v.get("out") or v.get("mutual")))

    if "--check" in argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else None
        if current is None:
            print("backlinks: нет %s — прогони "
                  "python3 scripts/import/backlinks.py" % OUT.relative_to(ROOT),
                  file=sys.stderr)
            return 1
        if current != text:
            print("backlinks: %s разошёлся со справками — файл несвежий.\n"
                  "  Пересобрать: python3 scripts/import/backlinks.py"
                  % OUT.relative_to(ROOT), file=sys.stderr)
            return 1
        print("backlinks: свежий — %d записей из %d справок"
              % (len(items), len(cards)))
        return 0

    OUT.write_text(text, encoding="utf-8")
    print("backlinks → %s" % OUT.relative_to(ROOT))
    print("  блок будет у %d справок из %d, без блока %d"
          % (len(items), len(cards), len(cards) - len(items)))
    print("  строки: исходящих %d · входящих %d · взаимных %d · "
          "только хроника %d" % (with_out, with_refs, with_mutual, only_chron))
    print("  потолок %d сработал у %d (только на входящих)" % (CAP, capped))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
