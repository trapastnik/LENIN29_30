"""Подписи плиток: правка семи написаний и явная пометка кураторских.

Подпись плитки намеренно отличается от заголовка справки: на плитке
«РСФСР», в справке «Российская Социалистическая Федеративная Советская
Республика». Таких записей 110 из 198, и все они — решение человека.

**Чем это плохо было устроено.** Импорт хранил их правилом «записывать,
только если пусто» (`run_import.py`), а оно консервирует всё подряд:
и выбранное человеком, и затёкшее однажды из макета. Отличить одно
от другого было нечем. Ровно так же жил `camp` у Авксентьева — плитка
зелёная, карточка про революционную демократию, обе стороны молчат.

**Что нашлось.** У семи персон на плитке стояло дореформенное написание,
а в справке современное:

    Деникинъ · Корниловъ · Пилсудскій · Семёновъ · Троцкій ·
    Тухачевскій · Юденичъ

Дореформенная орфография в проекте есть и она намеренная — сцена хроники
печатает «Хроника событій». Но семь из семидесяти это не стиль, а остаток:
у остальных 63 написание современное.

🔒 **Решение dvn 2026-08-05: привести к современному, «как все остальные».**
Стиль оформления интерфейса при этом не трогаем — решение касается только
имён собственных на плитках. Регистр подписи (55 ПРОПИСНЫМИ, 12 обычным,
3 с инициалами) — **отдельный вопрос, dvn его не решал**; здесь он
не затрагивается, поэтому правится ровно написание, а регистр сохраняется.

**Механизм вместо разовой починки.** Скрипт заодно ставит `title_locked`
на все кураторские подписи — по образцу `xy_locked`, которым защищены
координаты чипов Венна. После этого импорт сохраняет подпись, только если
она помечена, а непомеченная пересчитывается из справки. Тогда «так решили»
отличимо от «затекло и замёрзло» механически, а не по памяти автора.

Запуск:  python3 scripts/import/seed_index_titles.py
         python3 scripts/import/run_import.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "public" / "content"
SECTIONS = ("persons", "parties", "states", "events")

# Дореформенное написание → современное. Правится ТОЛЬКО написание:
# регистр и скобочные уточнения сохраняются как есть.
SPELLING = {
    "Деникинъ": "Деникин",
    "Корниловъ": "Корнилов",
    "Пилсудскій": "Пилсудский",
    "Семёновъ": "Семёнов",
    "Троцкій": "Троцкий",
    "Тухачевскій": "Тухачевский",
    "Юденичъ": "Юденич",
}


def main() -> int:
    fixed = locked = 0
    seen = set()
    for folder in SECTIONS:
        path = CONTENT / folder / "_index.json"
        if not path.exists():
            print("  ! нет индекса %s" % folder)
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("items")
        if items is None:
            print("  ! в индексе %s нет items" % folder)
            continue
        changed = False
        for rec in items:
            title = (rec.get("title_ru") or "").strip()
            if title in SPELLING:
                rec["title_ru"] = SPELLING[title]
                seen.add(title)
                fixed += 1
                changed = True
                print("  %-10s %-24s «%s» → «%s»"
                      % (folder, rec.get("id"), title, SPELLING[title]))
            card = CONTENT / folder / ("%s.json" % rec.get("id"))
            if not card.exists():
                continue
            ent = json.loads(card.read_text(encoding="utf-8"))
            # Кураторская подпись — та, что отличается от заголовка справки.
            # Пометка ставится ПОСЛЕ правки написания: семь исправленных
            # тоже кураторские, их выбрал человек, просто заново.
            if (rec.get("title_ru") or "") != (ent.get("title_ru") or ""):
                if not rec.get("title_locked"):
                    rec["title_locked"] = True
                    locked += 1
                    changed = True
            elif rec.pop("title_locked", None) is not None:
                changed = True
        if changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8")

    # Счётчик со знаменателем: «7» не отличает полную работу от половины.
    missed = sorted(set(SPELLING) - seen)
    print("написаний исправлено: %d/%d, подписей помечено title_locked: %d"
          % (fixed, len(SPELLING), locked))
    if missed:
        # Не «нечего делать», а несделанное: строка из решения dvn не нашла
        # своей записи, и молчаливый пропуск оставил бы её на витрине.
        print("НЕ НАЙДЕНЫ в индексах: %s" % ", ".join(missed))
        return 1
    print("дальше: python3 scripts/import/run_import.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
