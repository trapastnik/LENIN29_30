"""Открытые вопросы к музею — признак на записи, а не только в письме.

Затычка обязана выглядеть недоделанной (CLAUDE.md §2). Проверка показала,
что часть затычек описана словами в документе и **не заведена в данных**:
Милюков и Набоков размечены ровно как все остальные, Чапанная война
неотличима от 52 других гособразований без карты. Контракт, живущий только
в MD, — не контракт: приёмка увидит уверенную запись.

Два признака.

**`open_question_ru`** — сам вопрос словами, плюс флаг `open-question`.
Один на класс, а не отдельное поле под каждый случай: записей семь, природа
одна — решение спорно и ждёт музея. Текст вопроса лежит рядом со спорной
записью, а не только в письме, поэтому его видно тому, кто открыл справку.

**`map_status: "impossible"`** — карту нельзя нарисовать в принципе.
Отличается от «карты пока нет» (52 записи) тем, что ожидание бессмысленно:
у Чапанной войны нет уездных границ на 1919 год, и рисовать не по чему.
Имя по состоянию, а не по отрицанию: поля нет — карта будет или уже есть.

Запуск:  python3 scripts/import/seed_open_questions.py
         python3 scripts/import/run_import.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "public" / "content"

# (каталог, id) → вопрос, который ждёт ответа музея
OPEN = {
    ("persons", "boldyrev"): (
        "Лагерь не определён: Уфимская директория и антибольшевистские "
        "правительства Сибири. Зависит от того, считается ли директория "
        "революционной демократией."),
    ("persons", "gegechkori"): (
        "Лагерь не определён: меньшевик по идеологии, деятель Грузинской "
        "Демократической Республики по должности."),
    ("persons", "milyukov"): (
        "Лагерь `rev-dem` по Временному правительству, но партия кадетов "
        "в разделе отнесена к белым. Требует сверки с музеем."),
    ("persons", "nabokov"): (
        "То же, что у Милюкова: `rev-dem` по должности, кадеты в разделе — "
        "белые."),
    ("parties", "gruzinskaya-sotsial-demokraticheskaya-pa"): (
        "Лагерь `national` по разделу витрины (правящая партия ГДР), "
        "но по идеологии меньшевики — `rev-dem`."),
    ("parties", "sotsial-demokraticheskaya-partiya-finlya"): (
        "Лагерь `national`, но в 1918 году партия возглавила Финляндскую "
        "Социалистическую Рабочую Республику — довод за `red`."),
    ("parties", "borotbisty"): (
        "Лагерь `national`, но в 1920 году партия влилась в КП(б)У — "
        "довод за `red`."),
}

MAP_IMPOSSIBLE = {
    "chapannaya-voyna": "нет уездных границ на 1919 год — рисовать не по чему",
}


def patch(folder: str, eid: str, changes: dict) -> bool:
    card = CONTENT / folder / ("%s.json" % eid)
    if not card.exists():
        print("  ! нет справки %s/%s" % (folder, eid))
        return False
    path = CONTENT / folder / ("%s.patch.json" % eid)
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    if all(data.get(k) == v for k, v in changes.items()):
        return False
    data["schema"] = 1
    data.update(changes)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")
    return True


def main() -> int:
    n = 0
    for (folder, eid), question in sorted(OPEN.items()):
        if patch(folder, eid, {"open_question_ru": question}):
            n += 1
            print("  %-10s %-42s %s" % (folder, eid, question[:52]))
    for eid, why in sorted(MAP_IMPOSSIBLE.items()):
        if patch("states", eid, {"map_status": "impossible",
                                 "map_status_note_ru": why}):
            n += 1
            print("  %-10s %-42s карта невозможна: %s" % ("states", eid, why))
    print("патчей записано: %d" % n)
    print("дальше: python3 scripts/import/run_import.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
