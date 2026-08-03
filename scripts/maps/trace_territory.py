#!/usr/bin/env python3
"""Трассировка полигонов территорий с листов заказчика в систему координат base.

Пайплайн 1 из CLAUDE.md §10 — «HSV-маска + potrace для одиночной цветной
заливки». potrace на машине нет и ставить его не обязательно: в проекте уже
есть путь через cv2.findContours (scripts/trace_venn_blobs.py), им и идём.
Порог берётся не по HSV, а по расстоянию в BGR до измеренного цвета заливки:
заливки плоские, а jpeg-артефакты дают ореол, который HSV-диапазон ловит
хуже, чем допуск на канал.

ЧТО ДЕЛАЕТ. Для каждого среза со spec:
  1. маска по цвету заливки внутри рамки листа;
  2. компоненты, отбор по min_area и правилам include_at / exclude_at;
  3. контуры, сглаживание approxPolyDP;
  4. перевод в координаты base матрицей phases[].transform.M;
  5. запись public/content/geo/polygons/<id>-<n>.svg и полей polygon в реестре.

ПОЧЕМУ ЦВЕТ РУКАМИ. Заказчик красит по лагерю, а не по государству: на листе
РСФСР ф1 тем же цветом залита Туркестанская СФР. Автоматика не отличит,
поэтому spec ведётся руками в scripts/maps/trace_spec.json.

  python3 scripts/maps/trace_territory.py --dry-run     # что получится
  python3 scripts/maps/trace_territory.py --write       # записать полигоны
  python3 scripts/maps/trace_territory.py --overlays DIR
"""

import argparse
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX = os.path.join(ROOT, "public", "content", "geo", "_index.json")
SPEC = os.path.join(os.path.dirname(__file__), "trace_spec.json")
OUT_DIR = os.path.join(ROOT, "public", "content", "geo", "polygons")

sys.path.insert(0, os.path.dirname(__file__))
from register_sheets import find_map_frame  # noqa: E402


def hex_bgr(s):
    s = s.lstrip("#")
    r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
    return np.array([b, g, r], dtype=np.int16)


def trace(sheet, spec):
    """Контуры заливки в координатах рамки листа."""
    target = hex_bgr(spec["fill"])
    tol = int(spec.get("tol", 30))
    dist = np.abs(sheet.astype(np.int16) - target).max(axis=2)
    mask = (dist <= tol).astype(np.uint8) * 255

    # Заливки на листах перебиты подписями, точками городов и штриховкой.
    # Закрываем разрывы, иначе одна территория распадается на десятки кусков.
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)

    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    min_area = int(spec.get("min_area", 400))
    keep = []
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            continue
        keep.append(i)

    def label_at(pt):
        x, y = int(pt[0]), int(pt[1])
        if 0 <= y < lab.shape[0] and 0 <= x < lab.shape[1]:
            return int(lab[y, x])
        return 0

    inc = spec.get("include_at")
    if inc:
        want = {label_at(p) for p in inc} - {0}
        keep = [i for i in keep if i in want]
    for p in spec.get("exclude_at", []):
        bad = label_at(p)
        if bad:
            keep = [i for i in keep if i != bad]

    polys = []
    for i in keep:
        comp = (lab == i).astype(np.uint8) * 255
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) < min_area:
                continue
            eps = 0.0015 * cv2.arcLength(c, True)
            polys.append(cv2.approxPolyDP(c, eps, True).reshape(-1, 2))
    return polys, mask


def to_base(pts, M, frame_off):
    """Из координат рамки листа в координаты base."""
    p = pts.astype(np.float32) + np.array(frame_off, dtype=np.float32)
    M = np.array(M, dtype=np.float32)
    return cv2.transform(p.reshape(-1, 1, 2), M).reshape(-1, 2)


def svg(polys_base, view_box, title):
    d = []
    for p in polys_base:
        pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in p)
        d.append(f'    <polygon points="{pts}"/>')
    body = "\n".join(d)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">\n'
            f'  <!-- {title} -->\n'
            f'  <!-- Координаты в системе base из public/content/geo/_index.json.\n'
            f'       Сгенерировано scripts/maps/trace_territory.py — руками не править,\n'
            f'       следующий прогон затрёт. Правка идёт в scripts/maps/trace_spec.json. -->\n'
            f'  <g class="territory">\n{body}\n  </g>\n</svg>\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="записать svg и реестр")
    ap.add_argument("--dry-run", action="store_true", help="только отчёт")
    ap.add_argument("--overlays", metavar="DIR")
    args = ap.parse_args()
    if not args.write:
        args.dry_run = True

    doc = json.load(open(INDEX, encoding="utf-8"))
    spec_all = json.load(open(SPEC, encoding="utf-8"))["sheets"]
    roots = doc["src_roots"]
    view_box = doc["base"]["viewBox"]
    if args.overlays:
        os.makedirs(args.overlays, exist_ok=True)

    rows = []
    for it in doc["items"]:
        for ph in it.get("phases", []):
            key = f"{it['id']}/{ph['n']}"
            sp = spec_all.get(key)
            if sp is None:
                continue
            if "skip" in sp:
                rows.append((key, "пропуск", sp["skip"][:60], 0, 0))
                continue
            if not ph.get("transform"):
                rows.append((key, "нет привязки", "transform: null", 0, 0))
                continue

            img = cv2.imread(os.path.join(ROOT, roots[ph["src_root"]], ph["src_file"]))
            fr = find_map_frame(img) or (0, int(img.shape[0] * 0.10),
                                         img.shape[1], img.shape[0])
            x1, y1, x2, y2 = fr
            sheet = img[y1:y2, x1:x2]

            polys, mask = trace(sheet, sp)
            if not polys:
                rows.append((key, "пусто", "маска ничего не дала", 0, 0))
                continue

            base_polys = [to_base(p, ph["transform"]["M"], (x1, y1)) for p in polys]
            pts = sum(len(p) for p in base_polys)
            area_pct = 100.0 * (mask > 0).sum() / mask.size
            rows.append((key, "ок", f"{len(polys)} контур(ов)", pts, area_pct))

            if args.overlays:
                vis = sheet.copy()
                cv2.drawContours(vis, [p.reshape(-1, 1, 2) for p in polys],
                                 -1, (0, 255, 0), 2)
                cv2.imwrite(os.path.join(args.overlays,
                                         f"{key.replace('/', '-')}.png"), vis)

            if args.write:
                os.makedirs(OUT_DIR, exist_ok=True)
                name = f"{it['id']}-{ph['n']}.svg"
                with open(os.path.join(OUT_DIR, name), "w", encoding="utf-8") as f:
                    f.write(svg(base_polys, view_box,
                                f"{it['title_ru']} — {ph['label_ru']}"))
                ph["polygon"] = f"content/geo/polygons/{name}"

        # Контракт: «геометрия есть» UI должен читать одним полем, иначе
        # запись с полигонами по фазам и polygon: null на уровне записи
        # покажется заглушкой. Кладём сюда последний по времени срез —
        # финальный контур территории; разбивку по времени даёт phases.
        if args.write:
            done = [p["polygon"] for p in it.get("phases", []) if p.get("polygon")]
            if done:
                it["polygon"] = done[-1]

    if args.write:
        with open(INDEX, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print(f"{'срез':46} {'статус':12} что  точек  доля листа")
    for key, st, what, pts, pct in rows:
        tail = f"  {pts:>5}  {pct:5.1f}%" if pts else ""
        print(f"{key[:46]:46} {st:12} {what}{tail}")
    print()
    ok = sum(1 for r in rows if r[1] == "ок")
    print(f"трассировано {ok} из {len(rows)}"
          + ("" if args.write else "  (dry-run, ничего не записано)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
