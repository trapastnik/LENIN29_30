"""`venn_groups` — принадлежность партии сразу нескольким лагерям.

Диаграмма Венна рисует пересечения, а не пять непересекающихся мешков.
Пока у каждой партии `venn_groups` состоял из одного лагеря, диаграмма была
картинкой: «Союз защиты Родины и свободы» сидел в революционной демократии,
хотя создан эсером Савинковым по поручению Добровольческой армии и визуально
стоит ровно между ней и белыми.

**Каждое пересечение подтверждено цитатой из справки заказчика**, а не общей
эрудицией. Где текст молчит — партия остаётся в одном лагере: пустое
пересечение честнее выдуманного, а раскладку по нему будет строить зона
`design`, и лишняя связь развалит ей сетку.

Порядок значим: `venn_groups[0]` совпадает с `camp` — это основной лагерь,
по нему партия попадает в фильтр и красится. Остальные — притяжение.

Запуск:  python3 scripts/import/seed_venn_groups.py
         python3 scripts/import/run_import.py --kind party
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTIES = ROOT / "public" / "content" / "parties"

# id → (лагеря, цитата-обоснование из справки заказчика)
GROUPS = {
    "union-defence": (
        ["rev-dem", "white"],
        "создана Б. В. Савинковым по поручению верховного руководителя "
        "Добровольческой армии М. В. Алексеева"),
    "union-renewal": (
        ["rev-dem", "white"],
        "в его основу легли представители кадетов, народных социалистов, эсеров"),
    "left-srs": (
        ["red", "rev-dem"],
        "оформилась, выделившись из Партии социалистов-революционеров; "
        "большевики заключили с левыми эсерами правительственный блок, "
        "их представители вошли в состав СНК"),
    "borotbisty": (
        ["national", "red"],
        "совместно с КП(б)У боротьбисты участвовали в вооружённых выступлениях "
        "против Директории УНР"),
    "bund": (
        ["national", "rev-dem"],
        "в 1898 году вошла в РСДРП в качестве автономной части"),
    "poaley-tsion": (
        ["national", "rev-dem"],
        "сблизилась с левыми меньшевиками-интернационалистами и вступила "
        "с ними в блок"),
    "gruzinskaya-sotsial-demokraticheskaya-pa": (
        ["national", "rev-dem"],
        "играли важную роль в проведении курса меньшевистско-эсеровского блока"),
    "muslim-socialists": (
        ["national", "red"],
        "совместно с Центральным комиссариатом по делам мусульман провели "
        "Конференцию мусульманских рабочих России"),
    "sotsial-demokraticheskaya-partiya-finlya": (
        ["national", "red"],
        "радикальные члены СДПФ формировали рабочие (красные) гвардии, "
        "захватили власть на юге страны, над Сеймом подняли красный флаг"),
    "belorusskaya-sotsialisticheskaya-gromada": (
        ["national", "rev-dem"],
        "действуя совместно с эсерами, РСДРП, Бундом"),
    "alash": (
        ["national", "white"],
        "отряды алашевцев входили в состав войск белых — в том числе "
        "формирований А. В. Колчака"),
    "basmachestvo": (
        ["green", "national"],
        "военно-политическое и религиозное движение, появление которого "
        "связано с ростом национального самосознания народов региона"),
}


def main() -> int:
    changed = same = 0
    for eid, (groups, why) in sorted(GROUPS.items()):
        card = PARTIES / ("%s.json" % eid)
        if not card.exists():
            print("  ! нет справки %s — пропущено" % eid)
            continue
        camp = json.loads(card.read_text(encoding="utf-8")).get("camp")
        if camp and groups and groups[0] != camp:
            print("  ! %s: venn_groups[0]=%s, а camp=%s — расходятся, пропущено"
                  % (eid, groups[0], camp))
            continue

        path = PARTIES / ("%s.patch.json" % eid)
        patch = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        if patch.get("venn_groups") == groups:
            same += 1
            continue
        patch["schema"] = 1
        patch["venn_groups"] = groups
        path.write_text(json.dumps(patch, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
        changed += 1
        print("  %-42s %-22s %s" % (eid, " + ".join(groups), why[:70]))

    print("патчей записано: %d, уже размечено: %d" % (changed, same))
    print("дальше: python3 scripts/import/run_import.py --kind party")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
