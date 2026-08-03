"""Лагерь для 13 партий, импортированных сверх кураторских двадцати.

Почему таблица, а не эвристика. Разбор регалий, который закрыл 68 личностей
из 70, на партиях работает плохо: у партии нет строки регалий, а в тексте
справки решает этнический определитель в названии («казахская», «еврейская»,
«армянская»). Классификатор оставил без ответа Бунд, Поалей Цион и УСДРП
и утащил в революционную демократию Белорусскую громаду и Грузинскую СДП —
партии, которые в разделе стоят среди национальных. Тринадцать записей —
ровно тот объём, где явная таблица честнее подгонки правил.

Лагерь партии тянет за собой `venn_groups`, поэтому он проставляется
не машинным слепком, а через `<id>.patch.json` — правку руками, которую
импорт не затирает. Координаты `x`/`y` тут НЕ выдаются: раскладку диаграммы
ведёт зона ui, и партия без координат просто не встаёт на диаграмму, зато
попадает в фильтр по лагерям.

Запуск:  python3 scripts/import/seed_party_camps.py
         python3 scripts/import/run_import.py --kind party
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTIES = ROOT / "public" / "content" / "parties"

# id → (лагерь, обоснование)
CAMPS = {
    "alash": (
        "national", "казахская партия, правительство Алашской автономии; "
        "совпадает с person/bukeykhanov"),
    "dashnaktsutyun": (
        "national", "армянская партия, правящая в Республике Армения"),
    "musavat": (
        "national", "азербайджанская партия, правящая в АДР"),
    "bund": (
        "national", "еврейская социал-демократическая партия"),
    "poaley-tsion": (
        "national", "еврейская социал-демократическая партия сионистского толка"),
    "belorusskaya-sotsialisticheskaya-gromada": (
        "national", "первая белорусская национальная партия, автономия Белоруссии"),
    "latyshskiy-krestyanskiy-soyuz": (
        "national", "ведущая сила Латвийской Республики; совпадает с person/ulmanis"),
    "ukrainskaya-sotsial-demokraticheskaya-ra": (
        "national", "партия Директории УНР; совпадает с person/petlyura"),
    "basmachestvo": (
        "green", "вооружённое повстанческое движение Средней Азии; "
        "совпадает с person/ibragim-bek"),
    "sibirskoe-oblastnichestvo": (
        "rev-dem", "дало Временное Сибирское правительство; "
        "совпадает с person/vologodskiy и person/derber"),

    # ── Три спорных. Взято по разделу, где партия стоит на витрине,
    #    а не по идеологии. Переключается правкой одной строки в патче.
    "gruzinskaya-sotsial-demokraticheskaya-pa": (
        "national", "СПОРНО: правящая партия Грузинской Демократической "
        "Республики → national, но по идеологии меньшевики → rev-dem, "
        "и person/zhordaniya размечен как rev-dem"),
    "sotsial-demokraticheskaya-partiya-finlya": (
        "national", "СПОРНО: финская партия → national, но в 1918 году "
        "возглавила Финляндскую Социалистическую Рабочую Республику → red"),
    "borotbisty": (
        "national", "СПОРНО: украинская национал-коммунистическая партия → "
        "national, но в 1920 году влилась в КП(б)У → red"),
}


def main() -> int:
    written = skipped = 0
    for eid, (camp, why) in sorted(CAMPS.items()):
        card = PARTIES / ("%s.json" % eid)
        if not card.exists():
            print("  ! нет справки %s — пропущено" % eid)
            continue
        path = PARTIES / ("%s.patch.json" % eid)
        patch = {}
        if path.exists():
            patch = json.loads(path.read_text(encoding="utf-8"))
            if patch.get("camp"):
                skipped += 1
                continue
        patch["schema"] = 1
        patch["camp"] = camp
        patch.setdefault("venn_groups", [camp])
        path.write_text(json.dumps(patch, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
        written += 1
        mark = "СПОРНО " if why.startswith("СПОРНО") else ""
        print("  %-42s %-9s %s%s" % (eid, camp, mark, why.replace("СПОРНО: ", "")))
    print("патчей записано: %d, уже размечено ранее: %d" % (written, skipped))
    print("дальше: python3 scripts/import/run_import.py --kind party")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
