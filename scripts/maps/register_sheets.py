#!/usr/bin/env python3
"""Привязка листов территорий к базовой карте заказчика.

ЗАЧЕМ. По CLAUDE.md §10 модель такая: одна векторная география, территории —
полигоны на ней. Чтобы полигон с листа заказчика попал в общую систему
координат, нужно знать, каким куском базы этот лист является.

ПОЧЕМУ ЭТО ДЁШЕВО. Проверено наложением: лист территории — буквальный кроп
клиентского ОБРАЗЦА базовой карты, с точностью до масштаба и смещения.
Береговая линия, реки, Байкал, Камчатка и граница с Монголией совпадают.
Значит привязка — подобие (масштаб + сдвиг), а не проективный варп
и не калибровка на якорях. Якоря нужны операционным картам, срисованным
с атласных листов другого масштаба, — это другой пайплайн.

ВАЖНО, ЧТО БАЗА ИМЕННО КЛИЕНТСКАЯ. В public/prototypes/empire-1914/ лежит
качественный вектор Российской империи 1914 г., но у него коническая сетка
и другой охват — territории на него пришлось бы варпить. Он остаётся тем,
чем задуман: инструментом калибровки операционных карт.

КАК. Canny по обоим изображениям, затем matchTemplate по сетке масштабов.
Абсолютное значение корреляции невысокое (заливки на листах разные, кромок
много) — поэтому решение принимается не по порогу, а по наложению: скрипт
пишет overlay-картинки, красным на них линии базы поверх листа.

  python3 scripts/maps/register_sheets.py                # все листы, отчёт
  python3 scripts/maps/register_sheets.py --overlays DIR  # ещё и картинки
  python3 scripts/maps/register_sheets.py --json          # машинный вывод
"""

import argparse
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX = os.path.join(ROOT, "public", "content", "geo", "_index.json")


def load_index():
    with open(INDEX, encoding="utf-8") as f:
        return json.load(f)


def edges(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    g = cv2.GaussianBlur(g, (3, 3), 0)
    return cv2.Canny(g, 40, 120)


def find_map_frame(img):
    """Прямоугольник рамки карты на листе заказчика.

    Порогом по «доле тёмных пикселей в строке» не берётся: у листов сверху
    заголовок, у «Северной области» и ВСЮР справа таймлайн срезов, а обрез
    самого листа даёт линии длиннее рамки. Поэтому ищем именно ЛИНИИ —
    морфологией с длинным ядром, — и собираем из них прямоугольник.
    """
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = g.shape
    bw = (g < 140).astype(np.uint8) * 255

    kh = cv2.getStructuringElement(cv2.MORPH_RECT, (max(30, w // 6), 1))
    kv = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(30, h // 6)))
    hor = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kh)
    ver = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kv)

    # Строки/столбцы, где линия реально длинная — не менее половины стороны.
    hs = [y for y in range(h) if hor[y].sum() / 255 > 0.50 * w]
    vs = [x for x in range(w) if ver[:, x].sum() / 255 > 0.50 * h]
    if not hs or not vs:
        return None

    def groups(idx, gap=4):
        out, cur = [], [idx[0]]
        for v in idx[1:]:
            if v - cur[-1] <= gap:
                cur.append(v)
            else:
                out.append(cur)
                cur = [v]
        out.append(cur)
        return [int(np.mean(gr)) for gr in out]

    ys, xs = groups(hs), groups(vs)
    # Рамка карты — самый большой прямоугольник, который не есть весь лист.
    best = None
    for i in range(len(xs)):
        for j in range(i + 1, len(xs)):
            for a in range(len(ys)):
                for b in range(a + 1, len(ys)):
                    x1, x2, y1, y2 = xs[i], xs[j], ys[a], ys[b]
                    aw, ah = x2 - x1, y2 - y1
                    if aw < 0.3 * w or ah < 0.3 * h:
                        continue
                    if aw * ah > 0.97 * w * h:
                        continue
                    if best is None or aw * ah > best[0]:
                        best = (aw * ah, (x1 + 1, y1 + 1, x2, y2))
    return best[1] if best else None


MIN_INLIERS = 25
MIN_INLIER_RATIO = 0.35
MAX_ROTATION_DEG = 1.0


def register(base_kp, base_desc, sheet_bgr):
    """Подобие лист → база через SIFT + RANSAC.

    Свипом масштаба это не решается: TM_CCOEFF_NORMED несравним между
    размерами шаблона, мелкий шаблон всегда выигрывает, и поиск сходится
    в вырожденное окно 150×120 у любого листа. SIFT инвариантен к масштабу,
    поэтому масштаб не перебирается, а оценивается.

    Возвращает dict с матрицей, масштабом, поворотом и долей инлайеров.
    Поворот — проверочная величина: листы заказчика не повёрнуты, поэтому
    отклонение больше градуса означает, что RANSAC поймал ложную модель.
    """
    sift = cv2.SIFT_create(nfeatures=8000, contrastThreshold=0.02)
    gs = cv2.cvtColor(sheet_bgr, cv2.COLOR_BGR2GRAY)
    ks, ds = sift.detectAndCompute(gs, None)
    if ds is None or len(ks) < 8:
        return {"error": "мало кейпоинтов на листе"}

    good = [a for a, b in cv2.BFMatcher().knnMatch(ds, base_desc, k=2)
            if a.distance < 0.75 * b.distance]
    if len(good) < 8:
        return {"error": f"мало сопоставлений ({len(good)})"}

    src = np.float32([ks[g.queryIdx].pt for g in good]).reshape(-1, 1, 2)
    dst = np.float32([base_kp[g.trainIdx].pt for g in good]).reshape(-1, 1, 2)
    M, inl = cv2.estimateAffinePartial2D(
        src, dst, method=cv2.RANSAC, ransacReprojThreshold=3.0, maxIters=10000)
    if M is None or inl is None:
        return {"error": "RANSAC не сошёлся"}

    n = int(inl.sum())
    ratio = n / len(good)
    scale = float(np.hypot(M[0, 0], M[1, 0]))
    rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))

    h, w = sheet_bgr.shape[:2]
    corners = cv2.transform(
        np.float32([[0, 0], [w, 0], [w, h], [0, h]]).reshape(-1, 1, 2), M
    ).reshape(-1, 2)

    res = {
        "matches": len(good), "inliers": n, "inlier_ratio": round(ratio, 3),
        "scale": round(scale, 4), "rotation_deg": round(rot, 2),
        "M": [[round(float(v), 6) for v in row] for row in M],
        "base_window": [round(float(corners[0][0]), 1), round(float(corners[0][1]), 1),
                        round(float(corners[2][0] - corners[0][0]), 1),
                        round(float(corners[2][1] - corners[0][1]), 1)],
    }
    if scale <= 1e-6:
        res["error"] = "вырожденный масштаб"
    elif n < MIN_INLIERS or ratio < MIN_INLIER_RATIO:
        res["error"] = f"мало инлайеров ({n}, {ratio:.0%})"
    elif abs(rot) > MAX_ROTATION_DEG:
        res["error"] = f"поворот {rot:+.1f}° — ложная модель"
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--overlays", metavar="DIR", help="куда писать картинки наложения")
    ap.add_argument("--json", action="store_true", help="машинный вывод")
    ap.add_argument("--only", metavar="ID", help="один territory_id")
    args = ap.parse_args()

    doc = load_index()
    roots = doc.get("src_roots", {})
    base_ref = (doc.get("base") or {}).get("reference_raster")
    if not base_ref:
        print("register_sheets: в geo/_index.json нет base.reference_raster —"
              " канонический лист не объявлен", file=sys.stderr)
        return 2

    base_path = os.path.join(ROOT, roots[base_ref["src_root"]], base_ref["src_file"])
    base = cv2.imread(base_path)
    if base is None:
        print(f"register_sheets: не читается база {base_path}", file=sys.stderr)
        return 2

    if args.overlays:
        os.makedirs(args.overlays, exist_ok=True)

    sift = cv2.SIFT_create(nfeatures=8000, contrastThreshold=0.02)
    base_kp, base_desc = sift.detectAndCompute(
        cv2.cvtColor(base, cv2.COLOR_BGR2GRAY), None)

    out = []
    for it in doc["items"]:
        if args.only and it["id"] != args.only:
            continue
        for ph in it.get("phases", []):
            rel = ph.get("src_file")
            if not rel:
                continue
            p = os.path.join(ROOT, roots[ph["src_root"]], rel)
            sheet_full = cv2.imread(p)
            if sheet_full is None:
                out.append({"id": it["id"], "n": ph["n"], "error": "не читается"})
                continue

            fr = find_map_frame(sheet_full)
            if not fr:
                # У части листов рамки нет — карта уходит в обрез. Берём лист
                # целиком, отрезав верхнюю полосу с заголовком: SIFT лишний
                # текст переживает, а вот отсутствие карты — нет.
                h0, w0 = sheet_full.shape[:2]
                fr = (0, int(h0 * 0.10), w0, h0)
            x1, y1, x2, y2 = fr
            sheet = sheet_full[y1:y2, x1:x2]

            rec = {"id": it["id"], "n": ph["n"], "frame": [x1, y1, x2, y2]}
            rec.update(register(base_kp, base_desc, sheet))
            out.append(rec)

            if args.overlays and "M" in rec:
                bx, by, bwid, bhei = rec["base_window"]
                x, y = int(max(0, bx)), int(max(0, by))
                crop = base[y:y + int(bhei), x:x + int(bwid)]
                if crop.size:
                    crop = cv2.resize(crop, (sheet.shape[1], sheet.shape[0]))
                    ov = sheet.copy()
                    ov[edges(crop) > 0] = (0, 0, 255)
                    tag = "ok" if "error" not in rec else "BAD"
                    cv2.imwrite(os.path.join(
                        args.overlays, f"{tag}-{it['id']}-{ph['n']}.png"), ov)

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0

    ok = [r for r in out if "error" not in r]
    bad = [r for r in out if "error" in r]
    print(f"листов обработано: {len(out)}, привязано: {len(ok)}, не привязано: {len(bad)}")
    print()
    print(f"{'территория':38} {'ф':>2} {'инл':>9} {'масшт':>6} {'пов':>6}  окно в базе")
    for r in sorted(out, key=lambda r: (r["id"], r["n"])):
        head = f"{r['id'][:38]:38} {r['n']:>2}"
        if "inliers" not in r:
            print(f"{head}  ✗ {r['error']}")
            continue
        inl = f"{r['inliers']}/{r['matches']}"
        mark = "  " if "error" not in r else " ✗"
        line = (f"{head} {inl:>9} {r['scale']:>6.3f} "
                f"{r['rotation_deg']:>+6.2f}  {r['base_window']}")
        print(line + mark)
        if "error" in r:
            print(f"{'':41} └─ {r['error']}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
