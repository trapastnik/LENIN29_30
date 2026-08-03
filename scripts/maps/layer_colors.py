#!/usr/bin/env python3
"""Роль цвета слоя в map.json — по словарю группы `map`, не значением.

ЗАЧЕМ. Плашка слоя в панели `<map-unit>` показывает, какой линией на карте
управляет галка. Цвет брался из токена `--layer-<id>`, а токены существуют
только для семи слоёв карты `komuch`. У Поволжья слоёв 19, и 17 плашек
из 20 рисовались серым `#888`: легенда не показывала ничего.

ДОГОВОР ЗОНЫ design (правило R10 линтера): слой пишет ИМЯ РОЛИ из словаря —
группа `map` в tokens.json, — а не значение цвета.

  { "id": "arrows_red", "color": "map-red" }

Тогда плашка и линия берут цвет из одного места и разойтись не могут
по устройству, а не по дисциплине.

ПЕРВАЯ ВЕРСИЯ ЭТОГО СКРИПТА ПИСАЛА ИЗВЛЕЧЁННЫЙ HEX, и R10 отверг все 41
значение — справедливо. Извлечение осталось, но не как результат, а как
ПОДСКАЗКА: скрипт достаёт фактический цвет линии из layers.svg и печатает
его рядом с назначенной ролью, чтобы расхождение «роль говорит red, линия
нарисована синим» было видно глазами при сверке таблицы.

Сама таблица ролей — РУЧНАЯ, и это правильно: роль семантическая, а не
колориметрическая. Синие стрелки Поволжья это удары Русской армии, то есть
роль `map-white` — «белые», хотя цвет синий. Автоматика по цвету назначила
бы `map-blue`, которого в словаре нет и быть не должно.

Класс для подсказки выбирается по ЧАСТОТЕ внутри группы: у слоёв фронтов
классов по три-четыре (линия, пунктир, подпись), и первый в разметке —
не обязательно тот, которым нарисована линия.

  python3 scripts/maps/layer_colors.py --check
  python3 scripts/maps/layer_colors.py --write
"""

import argparse
import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MAPS = os.path.join(ROOT, "public", "content", "maps")
TOKENS = os.path.join(ROOT, "src", "design", "tokens.json")

# Роль слоя — семантика, а не цвет. Ключ: id слоя; значение: имя из группы
# map словаря токенов. Ведётся руками, сверяется со словарём при каждом
# прогоне: пропадёт роль в tokens.json — прогон упадёт, а не запишет мусор.
ROLES = {
    "background_paper": "map-paper",
    "territories":      "map-territory",
    "admin_borders":    "map-border",
    "borders_dark":     "map-border",
    "rivers":           "map-river",
    "rivers_cyan":      "map-river",
    "city_dots":        "map-city",
    "labels_cities":    "map-label",
    "labels_rivers":    "map-label",
    "labels_armies":    "map-label",
    "labels_waypoints": "map-label",
    "title":            "map-label",
    "legend":           "map-label",
    "map_frame":        "map-frame",
    "frame_decor":      "map-decor",
    # Фронты — одна роль на все даты: различаются они датой, а не стороной.
    "front_aug1918":    "map-front",
    "front_nov1918":    "map-front",
    "front_feb1919":    "map-front",
    "front_blue":       "map-white",
    "front_green":      "map-green",
    # Стрелки — по СТОРОНЕ, а не по цвету линии. Синие стрелки Поволжья это
    # удары Русской армии и союзных войск, то есть белые.
    "arrows_red":       "map-red",
    "arrows_blue":      "map-white",
    "arrows_green":     "map-green",
    "arrows_pink":      "map-uprising",
    # Схемы Симбирска: наступление Народной армии — белые, 1-й армии — красные.
    "arrows_kappel":    "map-white",
    "arrows_stepanov":  "map-white",
    "arrows_stavropol": "map-white",
    "arrows_gai":       "map-red",
    "arrows_north":     "map-red",
    "arrows_bryandino": "map-red",
    "corridor_line":    "map-intervention",
    "waypoints":        "map-city",
}


def map_roles():
    """Имена группы map из словаря токенов — источник допустимых значений."""
    with open(TOKENS, encoding="utf-8") as f:
        t = json.load(f)["tokens"]
    return {n for n, v in t.items() if v.get("group") == "map"}

HEX = re.compile(r"(?:stroke|fill):\s*(#[0-9A-Fa-f]{3,6})")


def style_rules(svg):
    m = re.search(r"<style[^>]*>(.*?)</style>", svg, re.S)
    if not m:
        return {}
    return {mm.group(1): mm.group(2)
            for mm in re.finditer(r"\.([\w-]+)\s*\{([^}]*)\}", m.group(1))}


def group_text(svg, gid):
    i = svg.find(f'id="{gid}"')
    if i < 0:
        return None
    return svg[i:svg.find("</g>", i)]


def layer_color(svg, rules, gid):
    """Цвет слоя: класс, которым нарисовано больше всего элементов группы.

    Два разных устройства svg, оба живые:
      · гибриды Quiver (Поволжье, схемы Симбирска) — классы cls-* и блок
        <style>;
      · выход potrace (komuch из map_v6) — блока <style> нет вовсе, цвет
        стоит атрибутом прямо на группе: <g id="arrows_red" fill="#CC0000">.
    Первый прогон дал у komuch 0 цветов из 6 именно поэтому: искали классы
    там, где их нет.
    """
    seg = group_text(svg, gid)
    if seg is None:
        return None

    # Цвет атрибутом на самой группе — сначала, он самый явный.
    head = seg[:seg.find(">") + 1] if ">" in seg else seg
    m = (re.search(r'\bstroke="(#[0-9A-Fa-f]{3,6})"', head)
         or re.search(r'\bfill="(#[0-9A-Fa-f]{3,6})"', head))
    if m:
        return m.group(1).upper()
    counts = collections.Counter()
    for m in re.finditer(r'class="([^"]+)"', seg):
        for c in m.group(1).split():
            counts[c] += 1
    # Сначала пробуем stroke: слой — это чаще линия, чем заливка. Если
    # у самого частого класса stroke нет, берём его fill.
    for cls, _ in counts.most_common():
        decl = rules.get(cls, "")
        m = re.search(r"stroke:\s*(#[0-9A-Fa-f]{3,6})", decl)
        if m and m.group(1).lower() != "#none":
            return m.group(1).upper()
    for cls, _ in counts.most_common():
        m = HEX.search(rules.get(cls, ""))
        if m:
            return m.group(1).upper()
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    if not os.path.isdir(MAPS):
        print("layer_colors: нет public/content/maps/", file=sys.stderr)
        return 2

    maps = [d for d in sorted(os.listdir(MAPS))
            if os.path.exists(os.path.join(MAPS, d, "map.json"))]
    fail_if_empty(len(maps), "карт с map.json в public/content/maps/")

    allowed = map_roles()
    fail_if_empty(len(allowed), "имён в группе map словаря токенов")
    unknown = {r for r in ROLES.values() if r not in allowed}
    if unknown:
        print(f"layer_colors: роли не найдены в словаре токенов: "
              f"{', '.join(sorted(unknown))}\n"
              f"  есть: {', '.join(sorted(allowed))}", file=sys.stderr)
        return 1

    total = filled = missing = 0
    report = []
    for map_id in maps:
        d = os.path.join(MAPS, map_id)
        meta = json.load(open(os.path.join(d, "map.json"), encoding="utf-8"))
        svg_path = os.path.join(d, meta.get("svg", "layers.svg"))
        if not os.path.exists(svg_path):
            print(f"layer_colors: {map_id} — нет {meta.get('svg')}",
                  file=sys.stderr)
            missing += 1
            continue
        svg = open(svg_path, encoding="utf-8").read()
        rules = style_rules(svg)

        got = []
        for l in meta.get("layers", []):
            if l.get("kind") == "raster":
                # У растра линии нет — плашка рисуется собственным
                # индикатором, цвет ей не нужен.
                continue
            total += 1
            role = ROLES.get(l["id"])
            hint = layer_color(svg, rules, l["id"])   # фактический цвет линии
            if role:
                l["color"] = role
                filled += 1
                got.append((l["id"], role, hint))
            else:
                l.pop("color", None)
                missing += 1
                got.append((l["id"], None, hint))
        report.append((map_id, got))

        if args.write:
            with open(owned_write(os.path.join(d, "map.json")), "w",
                      encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
                f.write("\n")

    for map_id, got in report:
        norole = [i for i, r, _ in got if not r]
        print(f"\n{map_id}   роль назначена у {len(got) - len(norole)}/{len(got)}")
        for lid, role, hint in got:
            print(f"   {lid:20} {role or 'РОЛИ НЕТ':18} линия {hint or '—'}")
    print()
    print(f"векторных слоёв {total}, с ролью {filled}/{total}, без роли {missing}"
          + ("" if args.write else "  (dry-run, ничего не записано)"))
    print("столбец «линия» — фактический цвет из layers.svg, для сверки "
          "семантики: роль red при синей линии значит ошибку в таблице")
    # Слой без роли — не катастрофа (плашка рисуется контуром), но это ровно
    # тот случай, когда легенда молчит. Сообщаем ненулевым кодом.
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
