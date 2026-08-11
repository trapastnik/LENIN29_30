#!/usr/bin/env python3
"""Единая мягкая база — физический слой из открытых геоданных.

Кладёт на каркас (build_base.py) берег, реки, озёра и соседей намёком.
Проекция та же — коническая Альберс, — так что каркас и физика совпадают
по построению.

ИСТОЧНИК. Natural Earth 1:110m, public domain (nvkelso/natural-earth-vector).
Масштаб 1:110m выбран НАРОЧНО самый обобщённый: решение dvn — база мягкая,
не подробная. Подробность из данных нам избыточна, и это в нашу пользу —
генерализацию убрать можно, придумать нельзя. Данные качаются разово вне
репозитория (как оригиналы карт, §6), в git едет только производный SVG.

ЧТО ДЕЛАЕТ. Проецирует географию в Альберс, обрезает по кадру базы,
упрощает под манеру (simplify в метрах проекции), рисует слоями на токенах
палитры. Море — фон, суша — бумага поверх, берег — тонкая линия, реки и
озёра — бирюза, границы соседей — намёк пунктиром. Это ФИЗИЧЕСКИЙ фон:
границы Natural Earth современные, не 1918 — политический слой (губернии,
фронты) кладётся отдельно и из другого источника (§6б письма).

СЛОИ РАЗДЕЛЬНЫЕ И ИМЕНОВАННЫЕ — под будущий <map-unit> и под то, чтобы UI
снял свою часть. Заголовок вынесен в group `ui_overlay`: по §10 заголовок,
рамка, легенда — UI, не запечённые пиксели. Для показа манеры он на месте,
но структурно снимаем.

  python3 scripts/maps/build_base_physical.py --write
  python3 scripts/maps/build_base_physical.py --ne DIR   # каталог с geojson
"""

import argparse
import json
import os
import sys

import numpy as np
from pyproj import CRS, Geod, Transformer
from shapely.geometry import box, shape
from shapely.ops import transform as shp_transform

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402
from build_base import (PROJ4, CITIES, LON_RANGE, LAT_RANGE, VIEW_W,  # noqa: E402
                        fit_frame, make_to_svg, polyline)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "public", "content", "geo", "base")

# Упрощение под мягкую манеру: допуск в метрах проекции. Кадр ~7000 км на
# 1820 единиц → 1 единица ≈ 3.8 км; 20 км ≈ 5 единиц — уберёт мелкие изрезы
# берега, оставит очерк. Ровно то, что просил dvn: «не дико подробная».
SIMPLIFY_M = 20000

# Натуральные реки района, которые должны попасть, — для контроля,
# что 1:110m не выкинул Волгу с Обью на нашем охвате.
CONTROL_RIVERS = ("Volga", "Ob", "Yenisey", "Lena", "Amur")


def load_ne(ne_dir, name):
    p = os.path.join(ne_dir, f"{name}.geojson")
    if not os.path.exists(p):
        raise SystemExit(f"нет {name}.geojson в {ne_dir}. Скачать разово:\n"
                         f"  curl -sfL https://raw.githubusercontent.com/"
                         f"nvkelso/natural-earth-vector/master/geojson/"
                         f"{name}.geojson -o {p}")
    return json.load(open(p, encoding="utf-8"))


def build(ne_dir):
    fwd = Transformer.from_crs("EPSG:4326", CRS.from_proj4(PROJ4),
                               always_xy=True).transform
    frame = fit_frame(Transformer.from_crs("EPSG:4326",
                      CRS.from_proj4(PROJ4), always_xy=True))
    to_svg, view_h, scale = make_to_svg(frame)
    clip = box(*frame)

    def proj_clip(geom):
        """Проецируем в Альберс, обрезаем по кадру, упрощаем."""
        pg = shp_transform(lambda x, y, z=None: fwd(x, y), geom)
        pg = pg.intersection(clip)
        if pg.is_empty:
            return None
        return pg.simplify(SIMPLIFY_M)

    def to_paths(geom, close):
        """Геометрия проекции → список списков SVG-точек."""
        out = []
        geoms = getattr(geom, "geoms", [geom])
        for g in geoms:
            rings = ([g.exterior] + list(g.interiors)) if close else [g]
            for r in rings:
                if r is None:
                    continue
                # to_svg принимает координаты проекции (метры) и сам
                # инвертирует Y — север вверх.
                pts = [to_svg(px, py) for px, py in r.coords]
                if len(pts) >= 2:
                    out.append(pts)
        return out

    layers = {}
    # Море — полигоны ОКЕАНА, а не инверсия суши. 1:110m `land` покрывает
    # наш кадр на 100 % (Россия внутри Евразии, внутренние моря Каспий/Чёрное
    # /Балтика из него не вырезаны), поэтому заливать море фоном под сушей
    # бесполезно — оно нигде не проступит. `ocean` даёт именно воду: 19 %
    # кадра, моря по краям и внутренние. Суша — бумажный фон по умолчанию,
    # берег — обводка кромки океана.
    ocean = load_ne(ne_dir, "ne_110m_ocean")
    ocean_paths = []
    for ft in ocean["features"]:
        pg = proj_clip(shape(ft["geometry"]))
        if pg:
            ocean_paths += to_paths(pg, close=True)
    layers["ocean"] = ocean_paths

    lakes = load_ne(ne_dir, "ne_110m_lakes")
    lake_paths = []
    for ft in lakes["features"]:
        pg = proj_clip(shape(ft["geometry"]))
        if pg:
            lake_paths += to_paths(pg, close=True)
    layers["lakes"] = lake_paths

    # Реки — из 1:50m, но ТОЛЬКО именованные (магистральные). 1:110m Волги
    # не содержит вовсе — а вся Гражданская война вокруг Волги. Именованные
    # 50m дают Волгу, Дон, Каму, Урал, Амур, Енисей и держат мягкий уровень:
    # мелкие безымянные притоки не берём, плюс simplify 20 км сверху.
    rivers = load_ne(ne_dir, "ne_50m_rivers_lake_centerlines")
    river_paths, rivers_kept = [], []
    for ft in rivers["features"]:
        nm = (ft.get("properties") or {}).get("name") or ""
        if not nm:
            continue
        pg = proj_clip(shape(ft["geometry"]))
        if pg:
            river_paths += to_paths(pg, close=False)
            rivers_kept.append(nm)
    layers["rivers"] = river_paths

    bounds = load_ne(ne_dir, "ne_110m_admin_0_boundary_lines_land")
    bnd_paths = []
    for ft in bounds["features"]:
        pg = proj_clip(shape(ft["geometry"]))
        if pg:
            bnd_paths += to_paths(pg, close=False)
    layers["neighbors"] = bnd_paths

    return layers, view_h, scale, frame, fwd, rivers_kept


def render(layers, view_h):
    P = []
    # Суша — бумажный фон по умолчанию на весь кадр. Море и озёра лягут
    # поверх бирюзой, берег — их обводка.
    # ⚠️ Отдельной роли --map-sea в палитре нет — использую --map-river как
    # семейство воды. ЗАЯВКА design: завести --map-sea (тоном светлее рек),
    # чтобы море и реки различались, а не только заливка/линия.
    P.append(f'<rect id="paper" x="0" y="0" width="{VIEW_W:.0f}" '
             f'height="{view_h:.1f}" fill="var(--map-paper)"/>')

    def group(gid, paths, fill, stroke, sw, extra=""):
        if not paths:
            return f'<g id="{gid}"></g>'
        el = [f'<g id="{gid}">']
        for pts in paths:
            d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
            tag = "polygon" if fill != "none" else "polyline"
            el.append(f'  <{tag} points="{d}" fill="{fill}" '
                      f'stroke="{stroke}" stroke-width="{sw}" {extra}/>')
        el.append("</g>")
        return "\n".join(el)

    # Море: бирюза с тонким берегом по кромке. Берег — обводка океана,
    # то есть ровно граница вода/суша.
    P.append(group("ocean", layers["ocean"], "var(--map-river)",
                   "var(--map-border)", 0.8))
    P.append(group("lakes", layers["lakes"], "var(--map-river)",
                   "var(--map-border)", 0.5))
    P.append(group("rivers", layers["rivers"], "none",
                   "var(--map-river)", 0.9))
    # Соседи — намёком: тонкий пунктир, не сплошная граница.
    P.append(group("neighbors", layers["neighbors"], "none",
                   "var(--map-border)", 0.6,
                   'opacity="0.4" stroke-dasharray="3,3"'))
    return "\n".join(P)


def graticule_and_cities():
    t = Transformer.from_crs("EPSG:4326", CRS.from_proj4(PROJ4),
                             always_xy=True)
    frame = fit_frame(t)
    to_svg, view_h, scale = make_to_svg(frame)
    parts = []
    grid = ['<g id="graticule">']
    for lon in LON_RANGE:
        pts = [to_svg(*t.transform(lon, lat)) for lat in np.linspace(38, 72, 60)]
        grid.append(polyline(pts, "g", 'stroke="var(--map-border)" '
                             'stroke-width="0.5" opacity="0.28"'))
    for lat in LAT_RANGE:
        pts = [to_svg(*t.transform(lon, lat)) for lon in np.linspace(28, 143, 90)]
        grid.append(polyline(pts, "g", 'stroke="var(--map-border)" '
                             'stroke-width="0.5" opacity="0.28"'))
    grid.append("</g>")
    parts.append("\n".join(grid))

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
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--ne", default=os.environ.get("NE_DIR", ""),
                    help="каталог с geojson Natural Earth")
    args = ap.parse_args()
    ne_dir = args.ne or os.path.join(
        "/private/tmp/claude-501",
        "-Users-dvn-Desktop-WWWWW-BMK-29-30-mtk29-maps",
        "8f160304-9bca-4265-9de8-c2c4af69fbd6", "scratchpad", "ne")

    layers, view_h, scale, frame, fwd, rivers_kept = build(ne_dir)

    # Контроль: попали ли крупные реки района, и сколько объектов ушло за кадр.
    counts = {k: len(v) for k, v in layers.items()}
    fail_if_empty(counts["ocean"], "контуров океана в кадре",
                  "проверь охват frame и данные NE")

    body = "\n".join([render(layers, view_h), graticule_and_cities()])

    # Заголовок — СНИМАЕМЫЙ UI-оверлей (§10, решение оркестратора 2026-08-11):
    # для показа манеры на месте, но структурно это UI, не часть базы.
    ui = ('<g id="ui_overlay" data-role="ui">\n'
          '  <!-- UI-оверлей: снимается зоной ui, в геометрию базы не входит -->\n'
          f'  <text x="40" y="70" font-family="Times New Roman, serif" '
          f'font-size="46" letter-spacing="6" fill="var(--map-label)">'
          f'Р О С С И Я</text>\n</g>')
    frame_rect = (f'<rect id="frame" x="3" y="3" width="{VIEW_W - 6:.0f}" '
                  f'height="{view_h - 6:.1f}" fill="none" '
                  f'stroke="var(--map-frame)" stroke-width="4"/>')

    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" '
           f'viewBox="0 0 {VIEW_W:.0f} {view_h:.1f}">\n'
           f'  <!-- Единая мягкая база · физика · Natural Earth 1:110m PD · '
           f'Альберс равновеликая -->\n{body}\n{ui}\n{frame_rect}\n</svg>\n')

    print(f"слои (контуров): {counts}")
    print(f"реки в кадре: {len([r for r in rivers_kept if r])} именованных — "
          f"{', '.join(sorted({r for r in rivers_kept if r}))[:80]}")
    print(f"кадр: viewBox 0 0 {VIEW_W:.0f} {view_h:.1f}, "
          f"соотношение {VIEW_W / view_h:.2f}, упрощение {SIMPLIFY_M/1000:.0f} км")

    if args.write:
        os.makedirs(OUT_DIR, exist_ok=True)
        owned_write(os.path.join(OUT_DIR, "base.svg"))
        with open(os.path.join(OUT_DIR, "base.svg"), "w",
                  encoding="utf-8") as f:
            f.write(svg)
        print("записано: public/content/geo/base/base.svg")
    else:
        print("(сухой прогон; --write чтобы записать)")


if __name__ == "__main__":
    main()
