#!/usr/bin/env python3
"""Сверка map.json ↔ layers.svg по всем картам public/content/maps/.

Ловит рассинхрон в обе стороны:
  · группа в layers.svg, которой нет в layers[] map.json — слой отрисован,
    но в панель не попадает: его нельзя ни включить, ни выключить, и
    выглядит это как «слой намертво впаян в карту»;
  · запись в map.json без группы в layers.svg — в панели висит галка,
    которая ничего не переключает;
  · дубли id внутри map.json;
  · растровый слой без background_raster и наоборот.

Ничего из этого не падает в консоли — карта просто ведёт себя не так,
как написано в её же паспорте (CLAUDE.md §13).

Раньше под этим именем лежал отладчик спаривания наконечников стрелок из
сессии векторизации: он читал /tmp/hybrid_svg.py и файл из ~/Downloads,
то есть не работал ни у кого, кроме одной машины в один день. Гейт в
docs/launch/m1d-maps.md всё это время ссылался на него, ожидая именно
сверку слоёв.

Выход: 0 — чисто, 1 — есть рассинхрон.
"""

import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MAPS = os.path.join(ROOT, "public", "content", "maps")

# Верхнеуровневые <g id="..."> — именно они соответствуют слоям. Вложенные
# id (пути, клипы, маркеры) слоями не считаются.
G_ID = re.compile(r'<g\b[^>]*\bid="([^"]+)"')

problems = 0
checked = 0

if not os.path.isdir(MAPS):
    print("check_orphans: нет public/content/maps/", file=sys.stderr)
    sys.exit(1)

for map_id in sorted(os.listdir(MAPS)):
    map_dir = os.path.join(MAPS, map_id)
    map_json = os.path.join(map_dir, "map.json")
    if not os.path.isdir(map_dir) or not os.path.exists(map_json):
        continue

    with open(map_json, encoding="utf-8") as f:
        meta = json.load(f)

    layers = meta.get("layers", [])
    declared = [l["id"] for l in layers]
    raster_ids = {l["id"] for l in layers if l.get("kind") == "raster"}
    vector_ids = [i for i in declared if i not in raster_ids]

    svg_name = meta.get("svg", "layers.svg")
    svg_path = os.path.join(map_dir, svg_name)

    bad = []

    dupes = {i for i in declared if declared.count(i) > 1}
    if dupes:
        bad.append(f"дубли id в map.json: {', '.join(sorted(dupes))}")

    if not os.path.exists(svg_path):
        bad.append(f"нет {svg_name}, объявленного в map.json")
    else:
        with open(svg_path, encoding="utf-8") as f:
            groups = set(G_ID.findall(f.read()))

        orphan_svg = groups - set(declared)
        orphan_json = set(vector_ids) - groups
        if orphan_svg:
            bad.append("группы в " + svg_name + " без записи в map.json — "
                       "слой не попадает в панель: " + ", ".join(sorted(orphan_svg)))
        if orphan_json:
            bad.append("записи в map.json без группы в " + svg_name + " — "
                       "галка ничего не переключает: " + ", ".join(sorted(orphan_json)))

    raster_file = meta.get("background_raster")
    if raster_ids and not raster_file:
        bad.append(f"растровый слой {', '.join(sorted(raster_ids))} есть, "
                   "а background_raster в map.json не задан")
    if raster_file:
        if not raster_ids:
            bad.append(f"background_raster={raster_file} задан, "
                       "но растрового слоя в layers[] нет")
        elif not os.path.exists(os.path.join(map_dir, raster_file)):
            bad.append(f"background_raster={raster_file} не найден на диске")

    checked += 1
    if bad:
        problems += len(bad)
        print(f"✗ {map_id}")
        for b in bad:
            print(f"    {b}")
    else:
        on = sum(1 for l in layers if l.get("default"))
        print(f"✓ {map_id}: {len(layers)} слоёв, {on} включено по умолчанию")

print()
if problems:
    print(f"check_orphans: {problems} рассинхронов в {checked} картах")
    sys.exit(1)
print(f"check_orphans: чисто — {checked} карт(ы)")
