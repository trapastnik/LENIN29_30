"""Координаты чипов диаграммы Венна для 33 партий.

Раскладку считает зона `design` (`src/design-lab/2026-08-04-venn/`): пять
суперэллипсов, восхождение со случайными рестартами и жёсткое требование —
существуют ровно шесть парных областей из `venn_groups`, ни одной лишней
и ни одной тройной. Результат: 33 чипа из 33, штраф 0, минимальное
расстояние центров 118.6 px при требовании 64.

Здесь только перенос значений в контент. Координаты — проценты кадра.

Прежние координаты стояли у 15 записей из 33 — остаток кураторской
раскладки под ~15 чипов. Они НЕ подходят: геометрия построена заново,
блобы стоят иначе. Поэтому значения перезаписываются, а не дополняются.

`xy_locked: true` защищает ручную позицию от перезаписи — сейчас такой
пометки нет ни у кого, но правило соблюдается.

Снимок значений держится в этом файле, а не читается из `design-lab`
на каждом прогоне: каталог принадлежит зоне `design`, и её право
переименовать его или убрать лабораторию после сдачи. Файл на месте —
берём из него и сверяем со снимком; нет — работаем по снимку.

Запуск:  python3 scripts/import/seed_venn_xy.py
         python3 scripts/import/run_import.py --kind party
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTIES = ROOT / "public" / "content" / "parties"
SOURCE = ROOT / "src" / "design-lab" / "2026-08-04-venn" / "venn-coords-for-content.json"

# id → (x, y), проценты кадра. Снимок из venn-coords-for-content.json зоны `design`.
XY = {
    "alash": (73.021, 63.519),
    "alekseev-org": (86.979, 42.037),
    "anarchists": (10.938, 86.852),
    "basmachestvo": (26.354, 78.704),
    "belorusskaya-sotsialisticheskaya-gromada": (40.312, 53.333),
    "bolsheviks": (6.979, 47.963),
    "borotbisty": (18.021, 71.667),
    "bund": (53.698, 53.333),
    "cadets": (86.979, 35.926),
    "committee-salvation": (34.479, 35.185),
    "dashnaktsutyun": (62.187, 75.556),
    "greens-general": (10.938, 92.963),
    "gruzinskaya-sotsial-demokraticheskaya-pa": (40.312, 47.222),
    "latyshskiy-krestyanskiy-soyuz": (62.187, 81.667),
    "left-srs": (24.479, 29.074),
    "mensheviks": (50.052, 22.963),
    "musavat": (62.187, 63.333),
    "muslim-socialists": (18.021, 65.556),
    "narodnie-socialists": (50.052, 16.852),
    "national-center": (86.979, 54.259),
    "national-movements": (62.187, 57.222),
    "poaley-tsion": (53.698, 47.222),
    "reds-general": (6.979, 54.074),
    "revdem-general": (34.479, 16.852),
    "right-center": (86.979, 48.148),
    "sibirskoe-oblastnichestvo": (34.479, 22.963),
    "sotsial-demokraticheskaya-partiya-finlya": (18.021, 59.444),
    "srs": (50.052, 29.074),
    "ukrainskaya-sotsial-demokraticheskaya-ra": (62.187, 69.444),
    "union-constituent": (34.479, 29.074),
    "union-defence": (76.562, 23.704),
    "union-renewal": (76.562, 17.593),
    "whites-general": (86.979, 29.815),
}


def load() -> dict:
    """Живой файл `design` в приоритете; нет его — работаем по снимку."""
    if not SOURCE.exists():
        print("  %s нет — беру снимок из скрипта" % SOURCE.name)
        return dict(XY)
    raw = json.loads(SOURCE.read_text(encoding="utf-8"))
    chips = raw.get("chips") if isinstance(raw, dict) else None
    if chips is None:
        print("  формат %s не распознан — беру снимок" % SOURCE.name)
        return dict(XY)
    live = {k: (round(float(v["x"]), 3), round(float(v["y"]), 3))
            for k, v in chips.items()}
    drift = {k for k in set(live) & set(XY) if live[k] != XY[k]}
    if drift or set(live) != set(XY):
        print("  ⚠ снимок разошёлся с %s: %d записей — беру живой файл"
              % (SOURCE.name, len(drift) + len(set(live) ^ set(XY))))
    return live


def main() -> int:
    xy = load()
    written = skipped = locked = 0
    missing = []
    for eid, (x, y) in sorted(xy.items()):
        card = PARTIES / ("%s.json" % eid)
        if not card.exists():
            missing.append(eid)
            continue
        if json.loads(card.read_text(encoding="utf-8")).get("xy_locked"):
            locked += 1
            continue
        path = PARTIES / ("%s.patch.json" % eid)
        patch = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        if patch.get("x") == x and patch.get("y") == y:
            skipped += 1
            continue
        patch["schema"] = 1
        patch["x"], patch["y"] = x, y
        path.write_text(json.dumps(patch, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
        written += 1
    print("координат записано: %d, уже стояли: %d, закреплено руками: %d"
          % (written, skipped, locked))
    if missing:
        print("  ! нет справок: %s" % ", ".join(missing))
        return 1
    print("дальше: python3 scripts/import/run_import.py --kind party")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
