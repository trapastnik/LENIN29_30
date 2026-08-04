#!/usr/bin/env python3
"""Геометрия присутствия — записи, у которых территории как контура нет.

ЗАЧЕМ. Союзная интервенция это не территория, а множество точек с датами
и разными участниками: Мурманск, Архангельск, Владивосток, Севастополь,
Одесса, Баку, Батум, Северный Сахалин. Одним контуром это не описывается
ни на один момент времени — Мурманск и Владивосток никогда не были связной
областью. Поэтому запись получает geometry_kind: "presence", а поле polygon
продолжает указывать на файл геометрии, только внутри него точки, а не
контур: UI проверяет одно поле «есть геометрия — рисуем» и покажет точки,
а не заглушку «карты нет».

ИСТОЧНИК ПРАВДЫ — РЕЕСТР, А НЕ SVG. Координаты хранятся в градусах прямо
в geo/_index.json, а svg из них выводится. Так сделано потому, что точки
уходят за охват base (1820×1180 покрывает не весь Дальний Восток), и потому
что базу мы, скорее всего, будем менять на подробную: широта и долгота это
переживут, пиксели умрут вместе с базой.

ПРОЕКЦИЯ SVG. Равнопромежуточная (x = долгота, y = минус широта), кадр
по охвату точек. Это схема высадок, а не карта: точность проекции здесь
не несёт смысла, а обратимость — несёт. Когда появится подробная база,
покрывающая Дальний Восток, файл перегенерируется в её систему координат
без правки данных.

ЧЕГО СКРИПТ НЕ ДЕЛАЕТ. Цвет по участнику не задаёт: шесть стран это
переиспользуемая роль, значит токены зоны design, а не значения карты.
До ответа design точки нейтральные, участники различаются подписью.

  python3 scripts/maps/build_presence.py --check
  python3 scripts/maps/build_presence.py --write
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX = os.path.join(ROOT, "public", "content", "geo", "_index.json")
OUT_DIR = os.path.join(ROOT, "public", "content", "geo", "presence")

# Шесть участников — по флагам на листе заказчика. Греки в тексте справки
# занимают Одессу и Херсон вместе с французами, но флага у них на листе нет:
# вопрос в письме музею, поэтому место седьмого оставлено, а сам он не заведён.
ACTORS = [
    {"id": "gb", "title_ru": "Великобритания"},
    {"id": "fr", "title_ru": "Франция"},
    {"id": "us", "title_ru": "США"},
    {"id": "jp", "title_ru": "Япония"},
    {"id": "it", "title_ru": "Италия"},
    {"id": "ro", "title_ru": "Румыния"},
]

# Даты — только те, что даёт справка 64. Где справка молчит, стоит null,
# и это видно в реестре, а не додумано здесь.
SITES = [
    {"id": "murmansk", "title_ru": "Мурманск", "lat": 68.97, "lon": 33.07,
     "kind": "landing", "actors": ["gb"], "from": "1918-03-06", "to": None,
     "note_ru": "Британский десант по соглашению с местным Советом. 30 июня Мурманский краевой совет отказался исполнять требование СНК об удалении войск Антанты."},
    {"id": "arkhangelsk", "title_ru": "Архангельск", "lat": 64.54, "lon": 40.54,
     "kind": "landing", "actors": ["gb", "fr", "us"], "from": "1918", "to": None,
     "note_ru": "В справке подписью к фотографии: французские солдаты в Архангельске, 1918 г."},
    {"id": "vladivostok", "title_ru": "Владивосток", "lat": 43.12, "lon": 131.89,
     "kind": "landing", "actors": ["jp", "gb", "us"],
     "from": "1918-04-05", "to": "1922-10",
     "note_ru": "Начало интервенции на Дальнем Востоке. Японские части эвакуировались осенью 1922 г."},
    {"id": "sevastopol", "title_ru": "Севастополь", "lat": 44.62, "lon": 33.53,
     "kind": "landing", "actors": ["gb", "fr"], "from": "1918", "to": "1919-04"},
    {"id": "odessa", "title_ru": "Одесса", "lat": 46.48, "lon": 30.73,
     "kind": "occupation", "actors": ["fr"], "from": "1918", "to": "1919-04",
     "note_ru": "В тексте справки Одессу и Херсон занимают французы И ГРЕКИ; греческого флага на листе нет — вопрос заказчику."},
    {"id": "kherson", "title_ru": "Херсон", "lat": 46.64, "lon": 32.62,
     "kind": "occupation", "actors": ["fr"], "from": "1918", "to": "1919-04"},
    {"id": "baku", "title_ru": "Баку", "lat": 40.41, "lon": 49.87,
     "kind": "occupation", "actors": ["gb"], "from": "1918", "to": "1919"},
    {"id": "erivan", "title_ru": "Эривань", "lat": 40.18, "lon": 44.51,
     "kind": "occupation", "actors": ["gb"], "from": "1918", "to": "1919"},
    {"id": "batum", "title_ru": "Батум", "lat": 41.64, "lon": 41.64,
     "kind": "occupation", "actors": ["gb"], "from": "1918", "to": "1920",
     "note_ru": "Оставлен последним из Закавказья — летом 1920 г."},
    {"id": "severny-sakhalin", "title_ru": "Северный Сахалин",
     "lat": 52.00, "lon": 142.80, "kind": "occupation", "actors": ["jp"],
     "from": "1920", "to": "1925"},
]

ZONES = [
    {"id": "transcaucasia", "title_ru": "Закавказье", "actors": ["gb"],
     "polygon": None, "from": "1918", "to": "1919",
     "note_ru": "Основную часть покинули во второй половине 1919 г."},
    {"id": "transcaspia", "title_ru": "Закаспийская область", "actors": ["gb"],
     "polygon": None, "from": "1918", "to": "1919",
     "note_ru": "Под давлением британцев распущено Закаспийское временное правительство."},
    {"id": "primorye-zabaikalye", "title_ru": "Приморье и Забайкалье",
     "actors": ["jp"], "polygon": None, "from": "1918", "to": "1920",
     "note_ru": "Поддержка атамана Г. М. Семёнова. Забайкалье оставлено летом 1920 г."},
    {"id": "south-ukraine", "title_ru": "Юг Украины", "actors": ["fr"],
     "polygon": None, "from": "1918", "to": "1919"},
    {"id": "siberia", "title_ru": "Сибирь", "actors": ["us"],
     "polygon": None, "from": None, "to": None,
     "note_ru": "Справка называет присутствие американцев без датировки."},
]

TARGET = "allies-entente"
PAD = 4.0          # градусов вокруг охвата точек
UNITS_PER_DEG = 10  # масштаб равнопромежуточной проекции в единицы svg


def build_svg(sites):
    lons = [s["lon"] for s in sites]
    lats = [s["lat"] for s in sites]
    x0, x1 = min(lons) - PAD, max(lons) + PAD
    y0, y1 = -(max(lats) + PAD), -(min(lats) - PAD)
    w, h = (x1 - x0) * UNITS_PER_DEG, (y1 - y0) * UNITS_PER_DEG
    view_box = f"0 0 {w:.1f} {h:.1f}"

    def xy(s):
        return ((s["lon"] - x0) * UNITS_PER_DEG,
                (-s["lat"] - y0) * UNITS_PER_DEG)

    dots, labs = ['<g id="sites">'], ['<g id="labels_sites">']
    for s in sites:
        x, y = xy(s)
        dots.append(f'  <circle id="site-{s["id"]}" cx="{x:.1f}" cy="{y:.1f}" '
                    f'r="4" data-actors="{",".join(s["actors"])}"/>')
        labs.append(f'  <text x="{x + 6:.1f}" y="{y - 5:.1f}" '
                    f'font-size="12">{s["title_ru"]}</text>')
    dots.append("</g>")
    labs.append("</g>")

    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">\n'
            f'  <!-- Союзная интервенция: точки присутствия. -->\n'
            f'  <!-- Сгенерировано scripts/maps/build_presence.py из полей\n'
            f'       sites в public/content/geo/_index.json — руками не править.\n'
            f'       Источник правды — реестр, координаты там в градусах.\n'
            f'       Проекция равнопромежуточная (x = долгота, y = минус\n'
            f'       широта), {UNITS_PER_DEG} единиц на градус. Это схема\n'
            f'       высадок, а не карта: точность проекции смысла не несёт,\n'
            f'       обратимость несёт. Появится подробная база с Дальним\n'
            f'       Востоком — файл перегенерируется в её координаты без\n'
            f'       правки данных.\n'
            f'       Цвет по участнику не задан: шесть стран это\n'
            f'       переиспользуемая роль, то есть токены зоны design. -->\n'
            + "\n".join(dots) + "\n" + "\n".join(labs) + "\n</svg>\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    doc = json.load(open(INDEX, encoding="utf-8"))
    item = next((i for i in doc["items"] if i["id"] == TARGET), None)
    if item is None:
        print(f"build_presence: записи «{TARGET}» нет в реестре", file=sys.stderr)
        return 2

    known = {a["id"] for a in ACTORS}
    bad = sorted({a for s in SITES + ZONES for a in s["actors"]} - known)
    if bad:
        print(f"build_presence: неизвестные участники: {', '.join(bad)}",
              file=sys.stderr)
        return 1

    fail_if_empty(len(SITES), "точек присутствия в таблице SITES")
    svg = build_svg(SITES)
    rel = f"content/geo/presence/{TARGET}.svg"
    print(f"участников {len(ACTORS)}, точек {len(SITES)}, зон {len(ZONES)}")
    print(f"без даты начала: "
          f"{sum(1 for s in SITES if not s['from'])}, "
          f"без даты конца: {sum(1 for s in SITES if not s['to'])}")
    print(f"viewBox {svg.split('viewBox=')[1].split(chr(34))[1]}")

    if args.write:
        os.makedirs(OUT_DIR, exist_ok=True)
        with open(owned_write(os.path.join(OUT_DIR, f"{TARGET}.svg")), "w",
                  encoding="utf-8") as f:
            f.write(svg)
        item["geometry_kind"] = "presence"
        item["polygon"] = rel
        item["actors"] = ACTORS
        item["sites"] = SITES
        item["zones"] = ZONES
        with open(owned_write(INDEX), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"записано: {rel} и поля записи «{TARGET}»")
    else:
        print("(dry-run, ничего не записано)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
