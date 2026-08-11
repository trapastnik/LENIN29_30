#!/usr/bin/env python3
"""Единая мягкая база — физический каркас в собственной проекции.

ЗАЧЕМ ЗАНОВО. Решение dvn 2026-08-11: два координатных мира проекта —
артефакт «обвели два источника в две сетки», а не разные проекции. Строим
ОДНУ базу в одной системе и векторизуем в неё всё. Правовая чистота: листы
заказчика сделаны для другого проекта, используем как есть нельзя — значит
рисуем начисто, и раз начисто, то сразу в общей системе (дешевле, чем
плодить сетки и потом сводить).

ПРОЕКЦИЯ — КОНИЧЕСКАЯ АЛЬБЕРС, РАВНОВЕЛИКАЯ. Замер на 18 городах по всей
стране: искажение длины Москва–Владивосток −0.5 %, соотношение кадра ~1.94.
Три конических (Альберс, равнопромежуточная, Ламберт) на этом охвате дают
почти одно и то же — выбор решает СВОЙСТВО, а не точность: для политической
карты, где показываем, кто какой территорией владел, честна ПЛОЩАДЬ, а её
сохраняет Альберс. Аффинного на всю страну мало (4 якоря 0.25 px → с Пермью
и Вяткой 8.6 px): проекцию считаем формулой, не подгонкой.

МАНЕРА — МЯГКАЯ, НЕ ПОДРОБНАЯ (решение dvn 2026-08-11). Референс — акварельные
карты СССР: бежевая бумага, бирюзовое море, обобщённый берег, границы намёком.
«Совершенно не должна быть дико подробной». Это снимает старый затык: подробный
регионный лист не садился на грубую базу; теперь мы держим ОБЕ стороны на
мягком уровне, и рассогласование исчезает по построению.

ЧТО ДЕЛАЕТ ЭТОТ ФАЙЛ СЕЙЧАС. Только КАРКАС: проекцию, градусную сетку, опорные
города, рамку — в манере проекта, на токенах палитры. Берег, реки и соседи —
следующим шагом из открытых геоданных (Natural Earth, public domain): их
подложит build_base_physical.py, когда данные приедут. Каркас показывает
проекцию и манеру, не дожидаясь берега.

  python3 scripts/maps/build_base.py --write
"""

import argparse
import os
import sys

import numpy as np
from pyproj import CRS, Geod, Transformer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "public", "content", "geo", "base")

# ── Проекция ────────────────────────────────────────────────────────────
# Стандартные параллели в трети/двух третях широтного охвата страны;
# центр — середина габарита. Зафиксированы: воспроизводимость важнее подгонки.
PROJ4 = ("+proj=aea +lat_1=50 +lat_2=65 +lat_0=55.1 +lon_0=81.1 "
         "+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs")

# Опорные города — те же, на которых замерена проекция. Широта, долгота.
CITIES = {
    "Петроград": (59.94, 30.31), "Москва": (55.75, 37.62),
    "Архангельск": (64.54, 40.52), "Мурманск": (68.97, 33.08),
    "Ростов-на-Дону": (47.23, 39.72), "Царицын": (48.71, 44.51),
    "Симбирск": (54.32, 48.39), "Екатеринбург": (56.84, 60.60),
    "Омск": (54.99, 73.37), "Красноярск": (56.01, 92.87),
    "Иркутск": (52.29, 104.30), "Чита": (52.03, 113.50),
    "Владивосток": (43.12, 131.89), "Ташкент": (41.31, 69.28),
    "Тифлис": (41.72, 44.79), "Киев": (50.45, 30.52),
}

# Градусная сетка: меридианы и параллели, шаг в градусах.
LON_RANGE = range(30, 141, 10)
LAT_RANGE = range(40, 71, 5)

PAD_KM = 350          # поле вокруг крайних городов, км
VIEW_W = 1820.0       # ширина viewBox; высота — по соотношению проекции


def project():
    t = Transformer.from_crs("EPSG:4326", CRS.from_proj4(PROJ4), always_xy=True)
    return t


def fit_frame(t):
    """Габарит кадра в метрах проекции — по городам плюс поле. Справа поле
    шире: Владивосток у самого края, и его подпись уходит за рамку при
    симметричном поле."""
    xs, ys = [], []
    for lat, lon in CITIES.values():
        x, y = t.transform(lon, lat)
        xs.append(x); ys.append(y)
    pad = PAD_KM * 1000
    return min(xs) - pad, min(ys) - pad, max(xs) + pad * 2.4, max(ys) + pad


def make_to_svg(frame):
    """Метры проекции → координаты SVG. Y инвертируется: на карте север вверх,
    в проекции y растёт вверх, в SVG вниз."""
    x0, y0, x1, y1 = frame
    scale = VIEW_W / (x1 - x0)
    view_h = (y1 - y0) * scale

    def to_svg(x, y):
        return (x - x0) * scale, (y1 - y) * scale
    return to_svg, view_h, scale


def polyline(pts, cls, extra=""):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'  <polyline points="{d}" fill="none" {extra}/>'


def build():
    t = project()
    frame = fit_frame(t)
    to_svg, view_h, scale = make_to_svg(frame)

    # Замер для отчёта: искажение на контрольной дистанции.
    g = Geod(ellps="WGS84")
    (mla, mlo), (vla, vlo) = CITIES["Москва"], CITIES["Владивосток"]
    _, _, geod = g.inv(mlo, mla, vlo, vla)
    mx, my = t.transform(mlo, mla); vx, vy = t.transform(vlo, vla)
    proj_d = ((mx - vx) ** 2 + (my - vy) ** 2) ** 0.5
    dist_err = 100 * (proj_d - geod) / geod

    parts = []

    # Меридианы и параллели — плавные ломаные (проекция гнёт прямые).
    grid = ['<g id="graticule">']
    for lon in LON_RANGE:
        pts = [to_svg(*t.transform(lon, lat)) for lat in np.linspace(38, 72, 60)]
        grid.append(polyline(pts, "grid", 'stroke="var(--map-border)" '
                             'stroke-width="0.6" opacity="0.35"'))
    for lat in LAT_RANGE:
        pts = [to_svg(*t.transform(lon, lat)) for lon in np.linspace(28, 143, 90)]
        grid.append(polyline(pts, "grid", 'stroke="var(--map-border)" '
                             'stroke-width="0.6" opacity="0.35"'))
    grid.append("</g>")
    parts.append("\n".join(grid))

    # Города — точка плюс подпись справа. Манера: Times, тёмная точка.
    dots = ['<g id="cities">']
    labs = ['<g id="city_labels">']
    for name, (lat, lon) in CITIES.items():
        x, y = to_svg(*t.transform(lon, lat))
        dots.append(f'  <circle cx="{x:.1f}" cy="{y:.1f}" r="4" '
                    f'fill="var(--map-city)"/>')
        labs.append(f'  <text x="{x + 8:.1f}" y="{y - 6:.1f}" '
                    f'font-family="Times New Roman, serif" font-size="17" '
                    f'fill="var(--map-label)">{name}</text>')
    dots.append("</g>"); labs.append("</g>")
    parts.append("\n".join(dots)); parts.append("\n".join(labs))

    # Заголовок литерами — как на референсе.
    title = (f'<g id="title">\n'
             f'  <text x="40" y="70" font-family="Times New Roman, serif" '
             f'font-size="46" letter-spacing="6" fill="var(--map-label)">'
             f'Р О С С И Я</text>\n</g>')
    parts.append(title)

    # Бумажная подложка — весь кадр. Море появится с берегом, поверх бумаги.
    paper = (f'<rect id="paper" x="0" y="0" width="{VIEW_W:.0f}" '
             f'height="{view_h:.1f}" fill="var(--map-paper)"/>')

    # Рамка — латунь, как на картах проекта.
    frame_rect = (f'<rect id="frame" x="3" y="3" width="{VIEW_W - 6:.0f}" '
                  f'height="{view_h - 6:.1f}" fill="none" '
                  f'stroke="var(--map-frame)" stroke-width="4"/>')

    body = "\n".join([paper] + parts + [frame_rect])
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" '
           f'viewBox="0 0 {VIEW_W:.0f} {view_h:.1f}">\n'
           f'  <!-- Единая мягкая база · каркас · Альберс равновеликая · '
           f'искажение {dist_err:+.1f}% -->\n{body}\n</svg>\n')
    return svg, view_h, dist_err


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    svg, view_h, dist_err = build()
    print(f"проекция: Альберс равновеликая (aea), lat_1=50 lat_2=65 lon_0=81.1")
    print(f"кадр: viewBox 0 0 {VIEW_W:.0f} {view_h:.1f}, "
          f"соотношение {VIEW_W / view_h:.2f}")
    print(f"искажение длины Москва–Владивосток: {dist_err:+.2f}%")
    print(f"городов: {len(CITIES)}, меридианов {len(LON_RANGE)}, "
          f"параллелей {len(LAT_RANGE)}")
    print("берег/реки/соседи: НЕ в этом каркасе — следующим шагом из Natural Earth")

    if args.write:
        owned_write(os.path.join(OUT_DIR, "base-frame.svg"))
        os.makedirs(OUT_DIR, exist_ok=True)
        with open(os.path.join(OUT_DIR, "base-frame.svg"), "w",
                  encoding="utf-8") as f:
            f.write(svg)
        print(f"записано: public/content/geo/base/base-frame.svg")
    else:
        print("(сухой прогон; --write чтобы записать)")


if __name__ == "__main__":
    main()
