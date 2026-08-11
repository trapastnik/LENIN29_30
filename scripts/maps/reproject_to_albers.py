#!/usr/bin/env python3
"""Пересадка полигонов из пиксельного пространства ОБРАЗЦА в кадр Альберс.

ЗАЧЕМ. Полигоны территорий трассированы на ОБРАЗЦЕ заказчика (viewBox
0 0 1820 1180 — пиксели картинки, НЕ проекция). Единая мягкая база теперь
живёт в конической Альберс (viewBox 0 0 1820 954.1, см. build_base.py).
Решение dvn 2026-08-11: старая система уходит, полигоны пересчитываются.

КАК. Образец — чистая перерисовка исторической «Карты Россіи», сам по себе
коническая проекция, близкая к нашему Альберсу. Связь образец-px → кадр-px
над охватом страны оказывается ЛИНЕЙНОЙ: аффин по 15 городам-якорям даёт
СКО 3.8 px, max 21 px (leave-one-out 3.96 / 21.0). Полином 2-й степени
переобучается (LOO 11 / 49) — отвергнут. Гомография и подобие не лучше
аффина. Модель — АФФИН, зафиксирована по LOO.

ЯКОРЯ — БЕЗ ГЛАЗА. Города на образце помечены малиновыми точками
(~192,48,24). Детектор по цвету даёт центроиды, бутстрап-аффин по 5
бесспорным изолированным точкам предсказывает остальные, снап к ближайшему
блобу < 28 px. Пиксель точки — машинный, не кликнутый. Царицына на образце
красной точкой нет (15/16 сопоставлено) — на якорях не сказывается.

ОФЛАЙН. Растр образца — в ../IN (вне репозитория, как оригиналы карт §6).
Аффин и якоря кэшируются в public/content/geo/base/obrazec-georef.json —
пересадка воспроизводима без ../IN. --fit пересчитывает кэш из растра.

  /usr/bin/python3 scripts/maps/reproject_to_albers.py            # сухой прогон в /tmp
  /usr/bin/python3 scripts/maps/reproject_to_albers.py --write    # в репозиторий
  /usr/bin/python3 scripts/maps/reproject_to_albers.py --fit      # пересчитать кэш из растра
"""
import argparse
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_base as bb  # noqa: E402
from _zone import owned_write  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GEO = os.path.join(ROOT, "public", "content", "geo")
CACHE = os.path.join(GEO, "base", "obrazec-georef.json")
RASTER = os.path.join(
    ROOT, "..", "IN", "02-maps-src", "Все карты (сборка)",
    "ТЗ Карты общие - вся страна — ТЗ Базовая карта — "
    "ОБРАЗЕЦ - БАЗОВАЯ КАРТА РОССИИ.jpg")

# Бесспорные изолированные точки — образец-px «на глаз» из обзора, только
# для бутстрапа: снап к цветному блобу уточняет до центроида.
SEEDS = {"Мурманск": (515, 235), "Архангельск": (505, 337),
         "Омск": (660, 740), "Ташкент": (495, 995),
         "Владивосток": (1560, 930)}

RSFSR = [f"polygons/rsfsr-{n}.svg" for n in (1, 2, 3, 4)]


def city_frame():
    """Кадр-px 16 городов через ту же проекцию, что строит базу."""
    t = bb.project()
    to_svg, view_h, _ = bb.make_to_svg(bb.fit_frame(t))
    return {n: np.array(to_svg(*t.transform(lo, la)))
            for n, (la, lo) in bb.CITIES.items()}, view_h


def detect_dots(raster):
    from PIL import Image
    im = np.asarray(Image.open(raster).convert("RGB")).astype(int)
    R, G, B = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    mask = (R > 120) & ((R - G) > 50) & ((R - B) > 50)
    ys, xs = np.where(mask)
    pts = np.stack([xs, ys], 1)
    import collections
    grid = collections.defaultdict(list)
    for i, (x, y) in enumerate(pts):
        grid[(x // 8, y // 8)].append(i)
    used = np.zeros(len(pts), bool)
    blobs = []
    for i, (x, y) in enumerate(pts):
        if used[i]:
            continue
        st, comp = [i], []
        used[i] = True
        while st:
            j = st.pop()
            xj, yj = pts[j]
            comp.append((xj, yj))
            for gx in range(xj // 8 - 1, xj // 8 + 2):
                for gy in range(yj // 8 - 1, yj // 8 + 2):
                    for k in grid.get((gx, gy), []):
                        if not used[k]:
                            xk, yk = pts[k]
                            if abs(xk - xj) <= 6 and abs(yk - yj) <= 6:
                                used[k] = True
                                st.append(k)
        if len(comp) >= 6:
            blobs.append(np.array(comp).mean(0))
    return np.array(blobs)


def fit_affine(O, F):
    """образец-px O → кадр-px F, аффин 2×3 (наименьшие квадраты)."""
    A = np.c_[O, np.ones(len(O))]
    M = np.linalg.lstsq(A, F, rcond=None)[0]  # 3×2
    return M


def apply_affine(M, P):
    return np.c_[P, np.ones(len(P))] @ M


def fit_from_raster():
    cf, view_h = city_frame()
    blobs = detect_dots(RASTER)

    def nearest(px, maxd):
        d = np.hypot(blobs[:, 0] - px[0], blobs[:, 1] - px[1])
        k = d.argmin()
        return (blobs[k], float(d[k])) if d[k] <= maxd else (None, float(d[k]))

    # бутстрап-аффин кадр→образец по 5 seed
    so, sf = [], []
    for nm, ap in SEEDS.items():
        b, d = nearest(np.array(ap, float), 35)
        assert b is not None, (nm, d)
        so.append(b)
        sf.append(cf[nm])
    boot = np.linalg.lstsq(np.c_[sf, np.ones(len(sf))], np.array(so),
                           rcond=None)[0]

    anchors, O, F = {}, [], []
    for nm in bb.CITIES:
        pred = np.r_[cf[nm], 1] @ boot
        b, d = nearest(pred, 28)
        if b is not None:
            anchors[nm] = {"obrazec_px": [round(float(b[0]), 1),
                                          round(float(b[1]), 1)],
                           "frame_px": [round(float(cf[nm][0]), 1),
                                        round(float(cf[nm][1]), 1)],
                           "snap_px": round(d, 1)}
            O.append(b)
            F.append(cf[nm])
    O, F = np.array(O), np.array(F)
    M = fit_affine(O, F)
    res = np.hypot(*(apply_affine(M, O) - F).T)
    cache = {
        "note_ru": ("Аффин образец-px (1820×1180) → кадр Альберс "
                    "(1820×954.1). Якоря — малиновые точки-города образца, "
                    "снап машинный. Модель выбрана по leave-one-out: аффин "
                    "бьёт полином2/гомографию/подобие. build: "
                    "scripts/maps/reproject_to_albers.py --fit"),
        "viewBox_from": "0 0 1820 1180",
        "viewBox_to": f"0 0 1820 {view_h:.1f}",
        "affine_obrazec_to_frame": [[round(v, 8) for v in row]
                                    for row in M.T.tolist()],
        "residual_px": {"rmse": round(float(res.std()), 2),
                        "max": round(float(res.max()), 2),
                        "max_city": list(anchors)[int(res.argmax())],
                        "n_anchors": len(O)},
        "anchors": anchors,
    }
    return M, view_h, cache


def load_cache():
    c = json.load(open(CACHE, encoding="utf-8"))
    M = np.array(c["affine_obrazec_to_frame"]).T  # 3×2
    view_h = float(c["viewBox_to"].split()[-1])
    return M, view_h, c


def reproject_svg(src, M, view_h, clip=True):
    """образец-px → кадр-px по аффину; по умолчанию клип по рамке кадра.

    Клип нужен, потому что база сама обрезана рамкой (build_base_physical
    режет географию по кадру). Заполярье выше ~72° N образец рисует, наш
    кадр — нет; без клипа пересаженные вершины уходят в y<0 (за кромку,
    невидимо под viewBox, но заведомо неточная экстраполяция аффина выше
    северных якорей). Клип оставляет ровно видимый экстент, общий с базой.
    Вид не меняется — viewBox и так режет по y=0."""
    from shapely.geometry import Polygon, box
    txt = open(src, encoding="utf-8").read()
    # Идемпотентность: пересаживаем ТОЛЬКО пространство образца (высота 1180).
    # Кадр-space (уже пересажено, высота ~954) — пропускаем, иначе аффин
    # ляжет второй раз и запорет геометрию. Источник — trace_territory.py,
    # он пишет образец; повторный reproject поверх мигрированного репо — no-op.
    vb = re.search(r'viewBox="0 0 [\d.]+ ([\d.]+)"', txt)
    if vb and abs(float(vb.group(1)) - 1180) > 1:
        return None, 0, 0  # уже в кадре — пропуск
    mt = re.search(r"<!--\s*(.*?)\s*-->", txt, re.S)
    title = mt.group(1).strip() if mt else os.path.basename(src)

    frame = box(0, 0, 1820, view_h)
    rings_in = re.findall(r'points="([^"]*)"', txt)
    out = []
    for g in rings_in:
        pts = np.array([[float(a) for a in tok.split(",")] for tok in g.split()])
        poly = Polygon(apply_affine(M, pts))
        if not poly.is_valid:
            poly = poly.buffer(0)
        if clip:
            poly = poly.intersection(frame)
        if poly.is_empty:
            continue
        geoms = poly.geoms if poly.geom_type == "MultiPolygon" else [poly]
        for gp in geoms:
            if gp.area < 1:
                continue
            d = " ".join(f"{x:.1f},{y:.1f}" for x, y in gp.exterior.coords)
            out.append(f'    <polygon points="{d}"/>')

    body = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 1820 {view_h:.1f}">\n'
        f'  <!-- {title} -->\n'
        f'  <!-- Координаты — кадр Альберс (viewBox 0 0 1820 {view_h:.1f}),\n'
        f'       НЕ пиксели образца. Пересажено scripts/maps/reproject_to_albers.py\n'
        f'       (аффин по якорям-городам, СКО 3.8 px; клип по рамке кадра).\n'
        f'       Источник геометрии — trace_territory.py на образце; не править. -->\n'
        f'  <g class="territory">\n' + "\n".join(out) + "\n  </g>\n</svg>\n")
    return body, len(rings_in), len(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true",
                    help="писать в репозиторий (иначе — в /tmp scratchpad)")
    ap.add_argument("--fit", action="store_true",
                    help="пересчитать кэш георефренса из растра ../IN")
    ap.add_argument("--files", nargs="*", default=RSFSR,
                    help="полигоны относительно public/content/geo")
    ap.add_argument("--no-clip", action="store_true",
                    help="не резать по рамке кадра (оставить заполярный перелёт)")
    args = ap.parse_args()

    if args.fit or not os.path.exists(CACHE):
        M, view_h, cache = fit_from_raster()
        r = cache["residual_px"]
        print(f"георефренс: аффин по {r['n_anchors']} якорям, "
              f"СКО {r['rmse']} px, max {r['max']} px ({r['max_city']})")
        if args.write or args.fit:
            os.makedirs(os.path.dirname(CACHE), exist_ok=True)
            owned_write(CACHE)
            with open(CACHE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=1)
            print(f"кэш: public/content/geo/base/obrazec-georef.json")
    else:
        M, view_h, cache = load_cache()
        r = cache["residual_px"]
        print(f"георефренс из кэша: СКО {r['rmse']} px, max {r['max']} px")

    scratch = os.environ.get("SCRATCH", "/tmp")
    for rel in args.files:
        src = os.path.join(GEO, rel)
        body, n_in, n_out = reproject_svg(src, M, view_h, clip=not args.no_clip)
        if body is None:
            print(f"  {rel}: уже в кадре Альберс — пропуск (идемпотентность)")
            continue
        pts = np.array([[float(x), float(y)]
                        for grp in re.findall(r'points="([^"]*)"', body)
                        for tok in grp.split()
                        for x, y in [tok.split(",")]], float)
        bb_ = (pts[:, 0].min(), pts[:, 1].min(),
               pts[:, 0].max(), pts[:, 1].max())
        inb = (bb_[0] >= -0.5 and bb_[1] >= -0.5
               and bb_[2] <= 1820.5 and bb_[3] <= view_h + 0.5)
        dst = (os.path.join(GEO, rel) if args.write
               else os.path.join(scratch, os.path.basename(rel)))
        if args.write:
            owned_write(dst)
        with open(dst, "w", encoding="utf-8") as f:
            f.write(body)
        rings = f"{n_in} колец" if n_in == n_out else f"{n_in}→{n_out} колец"
        print(f"  {rel}: {rings}, bbox "
              f"[{bb_[0]:.0f},{bb_[1]:.0f} .. {bb_[2]:.0f},{bb_[3]:.0f}] "
              f"{'в кадре' if inb else 'ВЫХОД ЗА КАДР'} -> "
              f"{'репо' if args.write else os.path.basename(dst)}")


if __name__ == "__main__":
    main()
