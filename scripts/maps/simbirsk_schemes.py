#!/usr/bin/env python3
"""Две карты-схемы Симбирска: июль 1918 и сентябрь 1918.

ЗАЧЕМ СКРИПТ, А НЕ РИСОВАНИЕ РУКАМИ. Готовых изображений заказчик не дал:
в докладной обе схемы помечены «см. литература» и отсылают к книге
Колесникова 1927 г. с 11 схемами, сканов которой у нас нет. Значит схемы
строятся по тексту справки, а раз так — положение каждого пункта должно
быть проверяемым, а не нарисованным на глаз.

КАК ПРИВЯЗЫВАЕМСЯ. §10 предписывает операционным картам якоря
(город → координата), а не матрицы: матрица умирает при замене подложки,
якоря переживают. Здесь якорями служат четыре города, которые есть
и на карте `povolzhye-1918-1919`, и в справочнике координат: Казань,
Симбирск, Самара, Сызрань. По ним считается аффинное преобразование
широта/долгота → система координат поволжской карты.

Точность проверена: на четырёх якорях СКО 0.25 px при ширине кадра 302,
то есть локально проекция аффинна и подгонка не натянута. Брать якоря
по всей карте нельзя — с Пермью и Вяткой СКО уходит до 8.6 px:
на таком охвате проекция уже кривая.

ОТКУДА ГЕОГРАФИЯ. Реки, Волга и административные границы берутся из
`povolzhye-1918-1919/layers.svg` как есть, без перерисовки: у схем должна
быть та же картографическая манера, что у остальных карт проекта. Кадр
задаётся своим viewBox — браузер обрежет сам, геометрия не портится.

ЧЕГО СКРИПТ НЕ ДЕЛАЕТ. Рамка, заголовок, легенда и таймлайн — это UI
(§10), в слои не запекаются.

  python3 scripts/maps/simbirsk_schemes.py --check   # только проверка привязки
  python3 scripts/maps/simbirsk_schemes.py --write
"""

import argparse
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_MAP = os.path.join(ROOT, "public", "content", "maps",
                       "povolzhye-1918-1919", "layers.svg")
OUT_ROOT = os.path.join(ROOT, "public", "content", "maps")

# Якоря привязки: город → (широта, долгота). Только те, что есть на
# поволжской карте кружком города и попадают в район операций.
ANCHORS = {
    "Казань":   (55.79, 49.11),
    "Симбирск": (54.32, 48.39),
    "Самара":   (53.20, 50.15),
    "Сызрань":  (53.16, 48.47),
}

# Пункты, названные в справке. Ставятся по координатам через привязку.
PLACES = {
    "Симбирск":            (54.32, 48.39),
    "Сызрань":             (53.16, 48.47),
    "Ставрополь-на-Волге": (53.52, 49.42),
    "Мелекесс":            (54.24, 49.56),
    "Сенгилей":            (53.96, 48.78),
    "Инза":                (53.85, 46.35),
    "Алатырь":             (54.84, 46.58),
    "Буинск":              (54.97, 48.29),
    "Курмыш":              (55.44, 46.06),
    "Тагай":               (54.42, 47.32),
    "Бряндино":            (54.35, 49.00),
    "Казань":              (55.79, 49.11),
    "Свияжск":             (55.77, 48.66),
    "Самара":              (53.20, 50.15),
}

SCHEMES = [
    {
        "id": "simbirsk-july-1918",
        "title_ru": "Бои за Симбирск. Июль 1918 г.",
        "period": {"from": "1918-07", "to": "1918-07"},
        "pad": 6,
        "places": ["Сызрань", "Ставрополь-на-Волге", "Мелекесс", "Сенгилей",
                   "Симбирск", "Самара"],
        # Наступление Народной армии по двум направлениям — из справки:
        # главный удар Каппеля с юга из Сызрани, вспомогательный с востока
        # от Мелекесса (чехословаки полковника Степанова).
        "arrows": [
            {"id": "arrows_kappel", "label_ru": "Главный удар: отряд В. О. Каппеля от Сызрани",
             "from": "Сызрань", "to": "Симбирск", "bend": 0.18, "cls": "cls-12"},
            {"id": "arrows_stepanov", "label_ru": "Отряд полковника Степанова от Мелекесса",
             "from": "Мелекесс", "to": "Симбирск", "bend": -0.14, "cls": "cls-12"},
            {"id": "arrows_stavropol", "label_ru": "Занятие Ставрополя-на-Волге, 13 июля",
             "from": "Сызрань", "to": "Ставрополь-на-Волге", "bend": 0.10, "cls": "cls-12"},
        ],
    },
    {
        "id": "simbirsk-september-1918",
        "title_ru": "Симбирская операция. Сентябрь 1918 г.",
        "period": {"from": "1918-09", "to": "1918-09"},
        "pad": 6,
        "places": ["Инза", "Алатырь", "Курмыш", "Буинск", "Тагай", "Симбирск",
                   "Сенгилей", "Бряндино", "Казань", "Свияжск"],
        # Наступление 1-й армии с запада; штаб Тухачевского в Инзе,
        # Железная дивизия Гая выходит к городу 11 сентября.
        "arrows": [
            {"id": "arrows_gai", "label_ru": "Железная дивизия Г. Д. Гая, 9–11 сентября",
             "from": "Инза", "to": "Симбирск", "bend": -0.12, "cls": "cls-9"},
            {"id": "arrows_north", "label_ru": "Наступление с севера, Буинск",
             "from": "Буинск", "to": "Симбирск", "bend": 0.12, "cls": "cls-9"},
            {"id": "arrows_bryandino", "label_ru": "Окружение отряда Каппеля у Бряндино, 28 сентября",
             "from": "Симбирск", "to": "Бряндино", "bend": -0.16, "cls": "cls-9"},
        ],
    },
]


def fit_anchors():
    """Аффинное (долгота, широта) → координаты поволжской карты."""
    svg = open(SRC_MAP, encoding="utf-8").read()

    def group(gid):
        i = svg.find(f'id="{gid}"')
        return svg[i:svg.find("</g>", i)] if i >= 0 else ""

    dots = [(float(a), float(b)) for a, b in re.findall(
        r'<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"', group("city_dots"))]
    labels = {}
    for m in re.finditer(
            r'<text[^>]*transform="translate\(([^)]*)\)"[^>]*>([^<]*)</text>',
            group("labels_cities")):
        x, y = [float(v) for v in m.group(1).replace(",", " ").split()]
        # Подпись смещена от кружка — берём ближайший кружок.
        labels[m.group(2).strip()] = min(
            dots, key=lambda p: (p[0] - x) ** 2 + (p[1] - y) ** 2)

    A, B, names = [], [], []
    for name, (lat, lon) in ANCHORS.items():
        if name not in labels:
            raise SystemExit(f"якорь «{name}» не найден на поволжской карте")
        A.append([lon, lat, 1.0])
        B.append(list(labels[name]))
        names.append(name)
    A, B = np.array(A), np.array(B)
    sol, *_ = np.linalg.lstsq(A, B, rcond=None)
    res = np.linalg.norm(A @ sol - B, axis=1)
    return sol, dict(zip(names, res))


def project(sol, lat, lon):
    return tuple(np.array([lon, lat, 1.0]) @ sol)


def arc(p0, p1, bend):
    """Дуга между точками — стрелка наступления, а не прямая линия."""
    (x0, y0), (x1, y1) = p0, p1
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    cx, cy = mx - dy * bend, my + dx * bend
    return f"M{x0:.2f},{y0:.2f} Q{cx:.2f},{cy:.2f} {x1:.2f},{y1:.2f}"


def build(scheme, sol, src_svg):
    pts = {n: project(sol, *PLACES[n]) for n in scheme["places"]}
    xs = [p[0] for p in pts.values()]
    ys = [p[1] for p in pts.values()]
    pad = scheme["pad"]
    vx, vy = min(xs) - pad, min(ys) - pad
    vw, vh = max(xs) - vx + pad, max(ys) - vy + pad
    view_box = f"{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}"

    def copy_group(gid):
        i = src_svg.find(f'id="{gid}"')
        if i < 0:
            return ""
        start = src_svg.rfind("<g", 0, i)
        end = src_svg.find("</g>", i) + 4
        return src_svg[start:end]

    parts = [copy_group(g) for g in ("rivers", "admin_borders")]

    # МАСШТАБ ОФОРМЛЕНИЯ. Геометрия и стили поволжской карты рассчитаны
    # на кадр шириной 302, а у схемы кадр ~31 — то есть в десять раз мельче.
    # Координаты при этом те же, поэтому толщина линий, кегль и радиусы
    # в пользовательских единицах остаются прежними и выглядят в десять раз
    # толще: первый прогон дал подписи в треть карты и стрелки-брёвна.
    # Поэтому всё, что задано в единицах, домножается на k.
    k = vw / 302.0

    m = re.search(r"<style[^>]*>.*?</style>", src_svg, re.S)
    style = m.group(0) if m else ""
    style = re.sub(r"stroke-width: *([\d.]+)",
                   lambda mm: f"stroke-width:{float(mm.group(1)) * k:.4f}", style)
    style = re.sub(r"stroke-dasharray: *([\d.,]+)",
                   lambda mm: "stroke-dasharray:" + ",".join(
                       f"{float(v) * k:.4f}" for v in mm.group(1).split(",")), style)

    # Наконечники стрелок — маркеры, а не запечённые треугольники: так они
    # переживают смену толщины линии и не ломают анимацию wipe.
    defs = ['<defs>']
    for cls, color in (("cls-9", "#FF0000"), ("cls-12", "#0000FF")):
        defs.append(
            f'  <marker id="head-{cls}" viewBox="0 0 10 10" refX="8" refY="5" '
            f'markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{color}"/></marker>')
    defs.append("</defs>")

    # Бумажная подложка: без неё под схемой видно шахматку «карта не
    # загружена». Цвет — тот же, что у поволжской карты (.cls-0).
    paper = (f'<g id="background_paper">\n'
             f'  <rect class="cls-0" x="{vx:.1f}" y="{vy:.1f}" '
             f'width="{vw:.1f}" height="{vh:.1f}"/>\n</g>')

    dots = ['<g id="city_dots">']
    labs = ['<g id="labels_cities">']
    for n, (x, y) in pts.items():
        r = (1.1 if n == "Симбирск" else 0.8) * k
        dots.append(f'  <circle class="cls-33" cx="{x:.2f}" cy="{y:.2f}" '
                    f'r="{r:.3f}"/>')
        labs.append(f'  <text class="cls-33" x="{x + 1.6 * k:.2f}" '
                    f'y="{y - 1.2 * k:.2f}" '
                    f'font-family="\'TimesNewRomanPSMT\'" '
                    f'font-size="{3.333 * k:.3f}px">{n}</text>')
    dots.append("</g>")
    labs.append("</g>")

    arrows = []
    for a in scheme["arrows"]:
        p0, p1 = pts[a["from"]], pts[a["to"]]
        arrows.append(f'<g id="{a["id"]}">\n'
                      f'  <path class="{a["cls"]}" d="{arc(p0, p1, a["bend"])}" '
                      f'marker-end="url(#head-{a["cls"]})"/>\n'
                      f'</g>')

    body = "\n".join([style, "\n".join(defs), paper] + parts
                     + ["\n".join(dots), "\n".join(labs)] + arrows)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">\n'
           f'  <!-- {scheme["title_ru"]} -->\n'
           f'  <!-- Сгенерировано scripts/maps/simbirsk_schemes.py — руками\n'
           f'       не править, следующий прогон затрёт. Реки и границы\n'
           f'       скопированы из povolzhye-1918-1919 без перерисовки:\n'
           f'       у схем та же картографическая манера. Пункты поставлены\n'
           f'       по координатам через привязку на якорях (§10). -->\n'
           f'{body}\n</svg>\n')

    layers = [
        {"id": "background_paper", "label_ru": "Фон (бежевая бумага)",
         "kind": "vector", "default": True},
        {"id": "rivers", "label_ru": "Реки", "kind": "vector", "default": True},
        {"id": "admin_borders", "label_ru": "Административные границы",
         "kind": "vector", "default": True},
        {"id": "city_dots", "label_ru": "Точки городов", "kind": "vector",
         "default": True},
        {"id": "labels_cities", "label_ru": "Подписи городов", "kind": "vector",
         "default": True},
    ] + [{"id": a["id"], "label_ru": a["label_ru"], "kind": "vector",
          "default": True, "anim": "wipe"} for a in scheme["arrows"]]

    meta = {
        "id": scheme["id"], "kind": "map",
        "title_ru": scheme["title_ru"], "title_en": "",
        "period": scheme["period"],
        "viewBox": view_box,
        "layers": layers,
        "svg": "layers.svg",
        "source_ru": "Построено по тексту справки «Симбирск 1918–1919 гг.»; "
                     "готовых изображений заказчик не дал, в докладной обе "
                     "схемы помечены «см. литература».",
        "notes_ru": "Пункты поставлены по координатам через привязку на "
                    "якорях к карте povolzhye-1918-1919 (Казань, Симбирск, "
                    "Самара, Сызрань), СКО 0.25 px при ширине кадра 302. "
                    "Реки и границы скопированы оттуда же. Рамка, заголовок "
                    "и легенда — UI, в слои не запекались (§10).",
    }
    return svg, meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    sol, res = fit_anchors()
    print("привязка на якорях, аффинное (долгота, широта) → поволжская карта")
    for n, r in sorted(res.items(), key=lambda t: -t[1]):
        print(f"   {n:10} невязка {r:5.2f} px")
    print(f"   СКО {np.mean(list(res.values())):.2f} px, "
          f"макс {max(res.values()):.2f} px")

    if not os.path.exists(SRC_MAP):
        print(f"simbirsk_schemes: нет исходной карты {SRC_MAP} — привязка\n"
              f"  на якорях берёт геометрию оттуда", file=sys.stderr)
        return 2
    src = open(SRC_MAP, encoding="utf-8").read()
    print()
    fail_if_empty(len(SCHEMES), "схем в таблице SCHEMES")
    for sc in SCHEMES:
        svg, meta = build(sc, sol, src)
        print(f"{sc['id']:28} viewBox {meta['viewBox']:24} "
              f"слоёв {len(meta['layers'])}, пунктов {len(sc['places'])}")
        if args.write:
            d = os.path.join(OUT_ROOT, sc["id"])
            os.makedirs(d, exist_ok=True)
            open(owned_write(os.path.join(d, "layers.svg")), "w",
                 encoding="utf-8").write(svg)
            with open(owned_write(os.path.join(d, "map.json")), "w",
                      encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
                f.write("\n")
    if not args.write:
        print("\n(dry-run, ничего не записано)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
