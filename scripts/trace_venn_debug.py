"""Dump HSV-masks of each blob to /tmp/venn-debug/{camp}.png for visual inspection."""
import cv2, numpy as np, os

SRC = '/Users/dvn/Desktop/WWWWW/BMK/29-30/design-pass-2/project/uploads/Screenshot 2026-04-23 at 01.14.18.png'
OUT = '/tmp/venn-debug'
os.makedirs(OUT, exist_ok=True)

RANGES = {
    'red':      [((0,   90,  60), (10,  255, 230)),
                 ((170, 90,  60), (179, 255, 230))],
    'rev-dem':  [((130, 40,  40), (160, 255, 220))],
    'white':    [((0,   0,   80), (179, 28,  180))],
    'green':    [((36,  35,  40), (85,  255, 200))],
    'national': [((14,  70,  70), (32,  255, 230))],
}

img = cv2.imread(SRC)
h, w = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
print('Size:', w, 'x', h)

for camp, ranges in RANGES.items():
    m = np.zeros((h, w), dtype=np.uint8)
    for lo, hi in ranges:
        m = cv2.bitwise_or(m, cv2.inRange(hsv, np.array(lo, np.uint8), np.array(hi, np.uint8)))
    # overlay: show mask as red over original
    overlay = img.copy()
    overlay[m > 0] = [0, 0, 255]
    out = cv2.addWeighted(img, 0.5, overlay, 0.5, 0)
    cv2.imwrite(f'{OUT}/{camp}-mask.png', m)
    cv2.imwrite(f'{OUT}/{camp}-overlay.png', out)
    area = int(np.count_nonzero(m))
    ys, xs = np.where(m > 0)
    if len(xs):
        print(f'  {camp}: area={area}  xrange=[{xs.min()}..{xs.max()}] yrange=[{ys.min()}..{ys.max()}]')
    else:
        print(f'  {camp}: EMPTY')
print('dumped to', OUT)
