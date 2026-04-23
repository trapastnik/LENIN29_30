"""
Трейсинг blob'ов со скриншота референс-Венн-диаграммы.
Выход: JSON { camp: svg_path_d } в координатах 0..100 (для viewBox 0 0 100 100).
"""
import cv2
import numpy as np
import json
import sys
import os

SRC = '/Users/dvn/Desktop/WWWWW/BMK/29-30/design-pass-2/project/uploads/Screenshot 2026-04-23 at 01.14.18.png'
OUT = '/Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29/public/content/parties/_venn_blob_paths.json'

# HSV-диапазоны для каждого blob'а — подобраны по референсу.
# cv2 HSV: H 0..179, S 0..255, V 0..255.
RANGES = {
    'red':      [((0,   90,  60), (10,  255, 230)),
                 ((170, 90,  60), (179, 255, 230))],
    'rev-dem':  [((130, 40,  40), (160, 255, 220))],
    'white':    [((0,   0,   80), (179, 28,  180))],
    'green':    [((36,  35,  40), (85,  255, 200))],
    'national': [((14,  70,  70), (32,  255, 230))],
}

def mask_from_ranges(hsv, ranges):
    m = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for lo, hi in ranges:
        m = cv2.bitwise_or(m, cv2.inRange(hsv, np.array(lo, np.uint8), np.array(hi, np.uint8)))
    return m

def smooth_mask(m, k=25):
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel, iterations=2)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN,  kernel, iterations=1)
    # Ещё gaussian blur для мягких краёв при approxPolyDP
    m = cv2.GaussianBlur(m, (9, 9), 0)
    _, m = cv2.threshold(m, 80, 255, cv2.THRESH_BINARY)
    return m

def contour_to_bezier_abs(points, w, h, tension=6.0):
    """Catmull-Rom (замкнутый) → кубические безье в абсолютных координатах 0..100
       (масштаб viewBox ` 0 0 100 100`). Форма blob'а сохраняется органичной,
       позиции header'ов и chip'ов в _index.json привязаны к реальным координатам blob'а."""
    pts = [(p[0] / w * 100.0, p[1] / h * 100.0) for p in points]
    n = len(pts)
    if n < 4:
        return ''
    d = ['M', f'{pts[0][0]:.3f}', f'{pts[0][1]:.3f}']
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        cp1x = p1[0] + (p2[0] - p0[0]) / tension
        cp1y = p1[1] + (p2[1] - p0[1]) / tension
        cp2x = p2[0] - (p3[0] - p1[0]) / tension
        cp2y = p2[1] - (p3[1] - p1[1]) / tension
        d += ['C', f'{cp1x:.3f}', f'{cp1y:.3f},', f'{cp2x:.3f}', f'{cp2y:.3f},', f'{p2[0]:.3f}', f'{p2[1]:.3f}']
    d.append('Z')
    return ' '.join(d)

def main():
    img = cv2.imread(SRC)
    if img is None:
        print(f'ERROR: cannot read {SRC}', file=sys.stderr); sys.exit(2)
    h, w = img.shape[:2]
    print(f'Screenshot: {w}x{h}')
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    out = {}
    meta = {}
    for camp, ranges in RANGES.items():
        m = mask_from_ranges(hsv, ranges)
        m = smooth_mask(m)
        area = int(np.count_nonzero(m))
        if area == 0:
            print(f'  {camp}: EMPTY mask — check HSV ranges'); continue
        contours, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        if not contours:
            print(f'  {camp}: no contours'); continue
        c = max(contours, key=cv2.contourArea)
        for eps_k in (0.004, 0.006, 0.008, 0.012, 0.018):
            eps = eps_k * cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, eps, True)
            if 16 <= len(approx) <= 38:
                c = approx
                break
        else:
            c = cv2.approxPolyDP(c, 0.004 * cv2.arcLength(c, True), True)
        pts = [tuple(p[0]) for p in c]
        d = contour_to_bezier_abs(pts, w, h)
        out[camp] = d
        # Real bbox in viewBox coords (0..100)
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        cx = (min(xs) + max(xs)) / 2.0 / w * 100
        cy = (min(ys) + max(ys)) / 2.0 / h * 100
        rx = (max(xs) - min(xs)) / 2.0 / w * 100
        ry = (max(ys) - min(ys)) / 2.0 / h * 100
        meta[camp] = { 'cx': round(cx, 2), 'cy': round(cy, 2), 'rx': round(rx, 2), 'ry': round(ry, 2) }
        print(f'  {camp}: {len(pts)} pts, area={area}, bbox cx={cx:.1f} cy={cy:.1f} rx={rx:.1f} ry={ry:.1f}')

    result = { 'paths': out, 'meta': meta }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f'wrote {OUT}')

if __name__ == '__main__':
    main()
