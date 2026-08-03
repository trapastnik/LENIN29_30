"""Поиск геометрии, удовлетворяющей топологии данных.

Ограничения жёсткие и проверяемые:
  · существуют РОВНО шесть парных областей из данных;
  · ни одной лишней парной и ни одной тройной;
  · у каждой области хватает площади на свои чипы при шаге HIT.
Подбор — восхождение со случайными рестартами: параметров 30, руками
такое не сходится, а перебор с явным штрафом сходится за секунды.
"""
import json, math, itertools
import numpy as np
from scipy import ndimage

W, H, HIT, GRID = 1920, 1080, 64, 8
CELL = GRID * GRID
PER_CHIP = 6200          # площадь на чип при шаге 64 (гексячейка + поля)
BASE = 9000              # минимум на область, даже если чип один

PARTIES = json.load(open("/private/tmp/claude-501/-Users-dvn-Desktop-WWWWW-BMK-29-30-mtk29-design/7193210b-3b83-48b5-82ab-c5ee566dc10a/scratchpad/parties.json"))
NAMES = ["red", "rev-dem", "white", "green", "national"]

singles, pairs = {n: [] for n in NAMES}, {}
for p in PARTIES:
    g = tuple(sorted(p["g"]))
    (singles[g[0]].append(p) if len(g) == 1 else pairs.setdefault(g, []).append(p))
REQ = set(pairs)
FORB = {tuple(sorted(c)) for c in itertools.combinations(NAMES, 2)} - REQ

xs, ys = np.meshgrid(np.arange(0, W, GRID) + GRID/2, np.arange(0, H, GRID) + GRID/2)

def mask(p):
    dx, dy = xs - p[0], ys - p[1]
    c, s = math.cos(-p[4]), math.sin(-p[4])
    x, y = dx*c - dy*s, dx*s + dy*c
    th = np.arctan2(y, x)
    m = 1.0 + 0.11*np.sin(3*th + p[5]) + 0.06*np.sin(5*th - p[5]*1.7)
    return (x/(p[2]*m))**2 + (y/(p[3]*m))**2 <= 1.0

def score(P):
    M = {n: mask(P[n]) for n in NAMES}
    pen, detail = 0.0, {}
    ER = np.ones((2*(46//GRID)+1,)*2)
    def area(combo, usable=False):
        m = np.ones_like(M[NAMES[0]])
        for n in NAMES: m = m & (M[n] if n in combo else ~M[n])
        # полезная площадь — та, что останется после отступа от края области:
        # чип не должен свисать наружу, иначе он визуально в чужой группе
        if usable: m = ndimage.binary_erosion(m, ER)
        return int(m.sum()) * CELL
    for k in REQ:
        need = BASE + PER_CHIP*len(pairs[k]); a = area(k, True); detail[k] = a
        if a < need: pen += (need - a) / 1000 * 5 + (400 if a == 0 else 0)
    for k in FORB:
        a = area(k)
        if a > 2500: pen += (a - 2500) / 400          # лишняя пара — дороже
    for c in itertools.combinations(NAMES, 3):
        a = area(tuple(sorted(c)))
        if a > 2500: pen += (a - 2500) / 300          # тройная — ещё дороже
    for n in NAMES:
        need = BASE + PER_CHIP*len(singles[n]); a = area((n,), True); detail[(n,)] = a
        if a < need: pen += (need - a) / 1000
    # Не вылезать за кадр. Радиус берём МОДУЛИРОВАННЫЙ: гармоники дают
    # до +17 %, и по «голому» rx фигура честно проходила проверку,
    # а на картинке срезалась краем.
    MARGIN, BULGE = 40, 1.17
    for n in NAMES:
        cx, cy, rx, ry = P[n][:4]
        ex, ey = rx*BULGE, ry*BULGE
        pen += max(0, MARGIN + ex - cx) + max(0, cx + ex - (W - MARGIN))
        pen += max(0, MARGIN + ey - cy) + max(0, cy + ey - (H - MARGIN))
    return pen, detail

# Старт выверен вручную под граф смежности: national — узел степени 4,
# поэтому он широкой полосой внизу; red и white ныряют в него сверху
# по краям, rev-dem пересекает середину, green висит слева ниже red.
START = {
    "red":      [430, 430, 250, 230, -0.30, 0.7],
    "rev-dem":  [960, 470, 370, 185, -0.05, 2.1],
    "white":    [1490, 420, 270, 215, 0.22, 4.0],
    "green":    [300, 860, 185, 125, 0.10, 5.2],
    "national": [980, 770, 760, 230, 0.02, 1.3],
}
STEP = np.array([70, 70, 55, 45, 0.18, 0.5])

rng = np.random.default_rng(20260804)
best = {n: list(v) for n, v in START.items()}
bs, _ = score(best)

for restart in range(10):
    cur = ({n: list(v) for n, v in START.items()} if restart == 0
           else {n: list(np.array(START[n]) + rng.normal(0, 1, 6)*STEP*0.8) for n in NAMES})
    cs, _ = score(cur)
    T = 1.0
    for it in range(2200):
        cand = {n: list(v) for n, v in cur.items()}
        n = NAMES[rng.integers(5)]
        cand[n] = list(np.array(cand[n]) + rng.normal(0, 1, 6)*STEP*T)
        cand[n][2] = max(120, cand[n][2]); cand[n][3] = max(90, cand[n][3])
        s, _ = score(cand)
        if s < cs: cur, cs = cand, s
        T = max(0.08, T*0.9975)
    if cs < bs: best, bs = cur, cs

pen, detail = score(best)
print(f"штраф {pen:.1f}  (0 = все ограничения выполнены)\n")
print("ОБЛАСТИ")
for k in sorted(REQ):
    need = BASE + PER_CHIP*len(pairs[k])
    print(f"  {' ∩ '.join(k):<24} чипов {len(pairs[k])}  {detail[k]:8d} px²  надо {need:7d}  {'ок' if detail[k]>=need else '✗'}")
for n in NAMES:
    need = BASE + PER_CHIP*len(singles[n])
    print(f"  {n:<24} чипов {len(singles[n])}  {detail[(n,)]:8d} px²  надо {need:7d}  {'ок' if detail[(n,)]>=need else '✗'}")

M = {n: mask(best[n]) for n in NAMES}
def area(c):
    m = np.ones_like(M[NAMES[0]])
    for n in NAMES: m = m & (M[n] if n in c else ~M[n])
    return int(m.sum())*CELL
extra = {k: area(k) for k in FORB if area(k) > 2500}
tri = {c: area(tuple(sorted(c))) for c in itertools.combinations(NAMES,3) if area(tuple(sorted(c))) > 2500}
print(f"\n  лишние пары: {extra or 'нет'}")
print(f"  тройные:     {tri or 'нет'}")

json.dump({n: [round(v,1) for v in best[n]] for n in NAMES},
          open("/private/tmp/claude-501/-Users-dvn-Desktop-WWWWW-BMK-29-30-mtk29-design/7193210b-3b83-48b5-82ab-c5ee566dc10a/scratchpad/venn_blobs.json","w"), indent=1)
