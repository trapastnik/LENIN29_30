#!/usr/bin/env python3
"""Геометрия-коридор — записи, «территория» которых это линия, а не область.

ЗАЧЕМ. У Чехословацкого корпуса территории в обычном смысле нет: к маю 1918
эшелоны корпуса растянулись по железной дороге от Пензы до Владивостока,
и выступление шло вдоль магистрали. Полигон здесь неверен по существу,
а не по исполнению — как и у союзной интервенции, только там точки,
а тут линия. Поэтому geometry_kind: "corridor".

ДВА ПОРЯДКА, И ОНИ НЕ СОВПАДАЮТ — это главное в модели.
  · географический: n, с запада на восток вдоль дороги;
  · хронологический: даты взятия пунктов.
Пенза на западном конце взята 29 мая, а Мариинск в Сибири уже к 27 мая,
Владивосток — только 29 июня. То есть выступление шло НЕ волной вдоль
магистрали, а почти одновременно по всей длине: 25–27 мая столкновения
начались «на значительной части территории страны». Карта, показывающая
это волной с запада, соврёт — поэтому порядок и хронология хранятся
раздельно, а не выводятся одно из другого.

  python3 scripts/maps/build_corridor.py --check
  python3 scripts/maps/build_corridor.py --write
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX = os.path.join(ROOT, "public", "content", "geo", "_index.json")
OUT_DIR = os.path.join(ROOT, "public", "content", "geo", "corridor")

TARGET = "czechoslovak-corps"

ACTORS = [{"id": "csk", "title_ru": "Чехословацкий корпус"}]

LINE_RU = "Транссибирская железная дорога, Пенза — Владивосток"

# n — с запада на восток. Даты и командиры — из справки 65, дословно по фактам.
# Где справка даёт «к 27 мая» без точного дня, стоит 1918-05-27 с оговоркой.
WAYPOINTS = [
    {"id": "penza", "title_ru": "Пенза", "lat": 53.20, "lon": 45.00, "n": 1,
     "from": "1918-05-29", "commander_ru": "С. Чечек",
     "note_ru": "Овладели после кровопролитного боя, длившегося почти сутки. Западный конец магистрали — и при этом ОДИН ИЗ ПОСЛЕДНИХ по времени."},
    {"id": "samara", "title_ru": "Самара", "lat": 53.20, "lon": 50.15, "n": 2,
     "from": "1918-06-08", "commander_ru": "С. Чечек",
     "note_ru": "4–5 июня разбили советские части у города, 8 июня заняли и обеспечили переправу через Волгу. В тот же день здесь организован Комуч."},
    {"id": "chelyabinsk", "title_ru": "Челябинск", "lat": 55.16, "lon": 61.40, "n": 3,
     "from": "1918-05-27", "commander_ru": "С. Н. Войцеховский",
     "note_ru": "Здесь же 14 мая произошёл Челябинский инцидент, с которого началось всё выступление, и 20 мая съезд делегатов решил оружие не сдавать."},
    {"id": "kurgan", "title_ru": "Курган", "lat": 55.44, "lon": 65.34, "n": 4,
     "from": "1918-05-27", "note_ru": "Город по Транссибу, открывший дорогу на Омск."},
    {"id": "petropavlovsk", "title_ru": "Петропавловск", "lat": 54.87, "lon": 69.15,
     "n": 5, "from": "1918-05-27",
     "note_ru": "Город по Транссибу, открывший дорогу на Омск."},
    {"id": "omsk", "title_ru": "Омск", "lat": 54.99, "lon": 73.37, "n": 6,
     "from": None, "note_ru": "Справка не даёт даты взятия — сказано лишь, что взятие Кургана и Петропавловска «открыло дорогу на Омск». 30 июня здесь образовано Временное Сибирское правительство. Дата оставлена null намеренно."},
    {"id": "novonikolaevsk", "title_ru": "Новониколаевск", "lat": 55.03, "lon": 82.92,
     "n": 7, "from": "1918-05-27"},
    {"id": "tomsk", "title_ru": "Томск", "lat": 56.50, "lon": 84.97, "n": 8,
     "from": "1918-05", "note_ru": "«В конце мая» — точного дня справка не даёт."},
    {"id": "mariinsk", "title_ru": "Мариинск", "lat": 56.21, "lon": 87.75, "n": 9,
     "from": "1918-05-27", "commander_ru": "Р. Гайда",
     "note_ru": "Один из ПЕРВЫХ по времени, при этом глубоко в Сибири — наглядно, что выступление не шло волной с запада."},
    {"id": "kansk", "title_ru": "Канск", "lat": 56.20, "lon": 95.71, "n": 10,
     "from": "1918-05-27"},
    {"id": "nizhneudinsk", "title_ru": "Нижнеудинск", "lat": 54.90, "lon": 99.03,
     "n": 11, "from": "1918-05-27"},
    {"id": "vladivostok", "title_ru": "Владивосток", "lat": 43.12, "lon": 131.89,
     "n": 12, "from": "1918-06-29",
     "note_ru": "Переворот, произведённый частями ЧСК. Восточный конец магистрали и последний по времени — именно сюда корпус и направлялся для отправки во Францию."},
]

PAD = 4.0
UNITS_PER_DEG = 10


def build_svg(wps):
    ordered = sorted(wps, key=lambda w: w["n"])
    lons = [w["lon"] for w in ordered]
    lats = [w["lat"] for w in ordered]
    x0 = min(lons) - PAD
    y0 = -(max(lats) + PAD)
    w = (max(lons) + PAD - x0) * UNITS_PER_DEG
    h = (-(min(lats) - PAD) - y0) * UNITS_PER_DEG

    def xy(p):
        return ((p["lon"] - x0) * UNITS_PER_DEG, (-p["lat"] - y0) * UNITS_PER_DEG)

    pts = [xy(p) for p in ordered]
    line = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

    dots, labs = ['<g id="waypoints">'], ['<g id="labels_waypoints">']
    for p, (x, y) in zip(ordered, pts):
        dots.append(f'  <circle id="wp-{p["id"]}" cx="{x:.1f}" cy="{y:.1f}" '
                    f'r="4" data-n="{p["n"]}" data-from="{p.get("from") or ""}"/>')
        labs.append(f'  <text x="{x + 6:.1f}" y="{y - 5:.1f}" '
                    f'font-size="12">{p["title_ru"]}</text>')
    dots.append("</g>")
    labs.append("</g>")

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}">\n'
            f'  <!-- Чехословацкий корпус: коридор вдоль Транссиба. -->\n'
            f'  <!-- Сгенерировано scripts/maps/build_corridor.py из полей\n'
            f'       corridor.waypoints в public/content/geo/_index.json —\n'
            f'       руками не править. Источник правды — реестр, координаты\n'
            f'       там в градусах.\n'
            f'       Ломаная соединяет точки в ГЕОГРАФИЧЕСКОМ порядке (n),\n'
            f'       с запада на восток. Хронология в data-from и НЕ совпадает\n'
            f'       с ним: Пенза на западном конце взята 29 мая, Мариинск\n'
            f'       в Сибири — к 27 мая. Анимировать по n значит показать\n'
            f'       волну с запада, которой не было. -->\n'
            f'  <g id="corridor_line">\n'
            f'    <polyline points="{line}" fill="none"/>\n'
            f'  </g>\n'
            + "\n".join(dots) + "\n" + "\n".join(labs) + "\n</svg>\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    doc = json.load(open(INDEX, encoding="utf-8"))
    item = next((i for i in doc["items"] if i["id"] == TARGET), None)
    if item is None:
        print(f"build_corridor: записи «{TARGET}» нет в реестре", file=sys.stderr)
        return 2

    fail_if_empty(len(WAYPOINTS), "точек коридора в таблице WAYPOINTS")

    ns = [w["n"] for w in WAYPOINTS]
    if sorted(ns) != list(range(1, len(ns) + 1)):
        print(f"build_corridor: n должны быть 1..{len(ns)} без пропусков "
              f"и дублей, получено {sorted(ns)}", file=sys.stderr)
        return 1

    # Долгота обязана расти вместе с n: n — порядок вдоль дороги с запада
    # на восток, и если он расходится с географией, то либо перепутаны
    # номера, либо координата. Молча такое не ловится.
    bad = [(a["title_ru"], b["title_ru"])
           for a, b in zip(sorted(WAYPOINTS, key=lambda w: w["n"]),
                           sorted(WAYPOINTS, key=lambda w: w["n"])[1:])
           if b["lon"] < a["lon"]]
    if bad:
        print("build_corridor: порядок n расходится с географией — "
              + "; ".join(f"{a} → {b}" for a, b in bad), file=sys.stderr)
        return 1

    svg = build_svg(WAYPOINTS)
    rel = f"content/geo/corridor/{TARGET}.svg"

    dated = [w for w in WAYPOINTS if w.get("from")]
    chrono = sorted(dated, key=lambda w: w["from"])
    print(f"точек {len(WAYPOINTS)}, с датой {len(dated)}/{len(WAYPOINTS)}")
    print(f"порядок вдоль дороги: "
          f"{' → '.join(w['title_ru'] for w in sorted(WAYPOINTS, key=lambda w: w['n'])[:4])} …")
    print(f"порядок по времени:   "
          f"{' → '.join(w['title_ru'] for w in chrono[:4])} …")
    print("два порядка не совпадают — это факт справки, а не ошибка данных")

    if args.write:
        os.makedirs(OUT_DIR, exist_ok=True)
        with open(owned_write(os.path.join(OUT_DIR, f"{TARGET}.svg")), "w",
                  encoding="utf-8") as f:
            f.write(svg)
        item["geometry_kind"] = "corridor"
        item["polygon"] = rel
        item["actors"] = ACTORS
        item["corridor"] = {
            "line_ru": LINE_RU,
            "note_ru": "Порядок n — географический, с запада на восток. "
                       "Хронологию задают даты, и она с n не совпадает: "
                       "выступление шло почти одновременно по всей длине "
                       "магистрали, а не волной. Анимация по n покажет волну, "
                       "которой не было.",
            "waypoints": sorted(WAYPOINTS, key=lambda w: w["n"]),
        }
        with open(owned_write(INDEX), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"записано: {rel} и поля записи «{TARGET}»")
    else:
        print("(dry-run, ничего не записано)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
