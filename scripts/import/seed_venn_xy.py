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
SOURCE = ROOT / "src" / "design-lab" / "2026-08-04-venn" / "venn-chips.json"

# id → (x, y), проценты кадра. Снимок из venn-chips.json зоны `design`.
XY = {
    "alash": (70.10, 54.35),
    "alekseev-org": (88.91, 33.89),
    "anarchists": (14.56, 84.63),
    "basmachestvo": (26.35, 79.26),
    "belorusskaya-sotsialisticheskaya-gromada": (40.86, 46.11),
    "bolsheviks": (8.49, 46.99),
    "borotbisty": (13.44, 67.04),
    "bund": (40.86, 53.52),
    "cadets": (88.91, 26.48),
    "committee-salvation": (42.49, 23.84),
    "dashnaktsutyun": (50.41, 72.22),
    "greens-general": (14.56, 92.04),
    "gruzinskaya-sotsial-demokraticheskaya-pa": (47.20, 46.11),
    "latyshskiy-krestyanskiy-soyuz": (50.41, 79.63),
    "left-srs": (24.48, 31.76),
    "mensheviks": (36.16, 31.25),
    "musavat": (56.74, 64.81),
    "muslim-socialists": (19.77, 67.04),
    "narodnie-socialists": (42.49, 31.25),
    "national-center": (88.91, 48.70),
    "national-movements": (50.41, 64.81),
    "poaley-tsion": (47.20, 53.52),
    "reds-general": (8.49, 54.40),
    "revdem-general": (36.16, 16.44),
    "right-center": (88.91, 41.30),
    "sibirskoe-oblastnichestvo": (42.49, 16.44),
    "sotsial-demokraticheskaya-partiya-finlya": (19.77, 59.63),
    "srs": (36.16, 38.66),
    "ukrainskaya-sotsial-demokraticheskaya-ra": (56.74, 72.22),
    "union-constituent": (36.16, 23.84),
    "union-defence": (74.48, 36.25),
    "union-renewal": (74.48, 28.84),
    "whites-general": (88.91, 19.07),
}


def load() -> dict:
    """Живой файл `design` в приоритете; нет его — работаем по снимку."""
    if not SOURCE.exists():
        print("  %s нет — беру снимок из скрипта" % SOURCE.name)
        return dict(XY)
    live = {c["id"]: (round(float(c["x"]), 2), round(float(c["y"]), 2))
            for c in json.loads(SOURCE.read_text(encoding="utf-8"))}
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
