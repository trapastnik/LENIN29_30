"""Расстановка 33 чипов по найденной геометрии + SVG-превью."""
import json, math, itertools
import numpy as np

W, H, HIT, GRID = 1920, 1080, 64, 4
NAMES = ["red", "rev-dem", "white", "green", "national"]
S = "/private/tmp/claude-501/-Users-dvn-Desktop-WWWWW-BMK-29-30-mtk29-design/7193210b-3b83-48b5-82ab-c5ee566dc10a/scratchpad/"

P = json.load(open(S + "venn_blobs.json"))
PARTIES = json.load(open(S + "parties.json"))

singles, pairs = {n: [] for n in NAMES}, {}
for p in PARTIES:
    g = tuple(sorted(p["g"]))
    (singles[g[0]].append(p) if len(g) == 1 else pairs.setdefault(g, []).append(p))

xs, ys = np.meshgrid(np.arange(0, W, GRID) + GRID/2, np.arange(0, H, GRID) + GRID/2)

def mask(p, gx=xs, gy=ys):
    dx, dy = gx - p[0], gy - p[1]
    c, s = math.cos(-p[4]), math.sin(-p[4])
    x, y = dx*c - dy*s, dx*s + dy*c
    th = np.arctan2(y, x)
    m = 1.0 + 0.11*np.sin(3*th + p[5]) + 0.06*np.sin(5*th - p[5]*1.7)
    return (x/(p[2]*m))**2 + (y/(p[3]*m))**2 <= 1.0

M = {n: mask(P[n]) for n in NAMES}
def region(combo):
    m = np.ones_like(M[NAMES[0]])
    for n in NAMES: m = m & (M[n] if n in combo else ~M[n])
    return m

# Отступ от края области, чтобы чип не свисал: эрозия на радиус чипа.
from scipy import ndimage  # noqa
def erode(m, r):
    k = int(r/GRID)
    return ndimage.binary_erosion(m, np.ones((2*k+1, 2*k+1))) if k else m

# Расстановка КОЛОНКАМИ, а не максимальным разбросом.
#
# Так раскладывал куратор: в старом индексе rev-dem стоит двумя колонками
# (x 24.1 и 43.1), white — двумя (54 и 82.9), внутри колонки шаг по y 4–8 %.
# Это композиция, которой нет в данных: диаграмма читается списком сверху
# вниз, а не обшаривается глазами. Разброс «подальше друг от друга» даёт
# большее расстояние, но теряет порядок чтения — и на 33 чипах это дороже.
COL_GAP, ROW_GAP = HIT * 1.9, HIT * 1.25

def place(m, n, taken):
    cand = np.stack([xs[m], ys[m]], 1)
    if not len(cand) or n == 0: return []
    x0, x1 = cand[:,0].min(), cand[:,0].max()
    y0, y1 = cand[:,1].min(), cand[:,1].max()
    inside = set(map(tuple, cand.astype(int)))
    def ok(px, py):
        if not any(abs(px-cx) <= GRID and abs(py-cy) <= GRID
                   for cx, cy in inside if abs(px-cx) <= GRID):
            return False
        return all(math.dist((px,py), q) >= HIT for q in taken)

    best = None
    for ncol in range(1, n + 1):                      # сколько колонок пробуем
        nrow = math.ceil(n / ncol)
        if (ncol-1)*COL_GAP > (x1-x0) or (nrow-1)*ROW_GAP > (y1-y0): continue
        for ox in np.linspace(x0, x1 - (ncol-1)*COL_GAP, 9):
            for oy in np.linspace(y0, y1 - (nrow-1)*ROW_GAP, 9):
                pts = []
                for c in range(ncol):
                    for r in range(nrow):
                        if len(pts) >= n: break
                        px, py = ox + c*COL_GAP, oy + r*ROW_GAP
                        if ok(px, py): pts.append((px, py))
                if len(pts) == n:
                    # предпочитаем меньше колонок и вертикальную компактность
                    cost = ncol * 1000 + (max(p[1] for p in pts) - min(p[1] for p in pts))
                    if best is None or cost < best[0]: best = (cost, pts)
        if best: break
    if best: return best[1]

    # решётка не села — падаем на прежний жадный разброс
    picked = []
    c2 = cand.copy()
    while len(picked) < n and len(c2):
        ref = picked + taken
        d = (np.min([np.hypot(c2[:,0]-q[0], c2[:,1]-q[1]) for q in ref], 0) if ref
             else -np.hypot(c2[:,0]-c2[:,0].mean(), c2[:,1]-c2[:,1].mean()))
        i = int(d.argmax())
        if ref and d[i] < HIT: break
        picked.append((float(c2[i,0]), float(c2[i,1])))
        c2 = np.delete(c2, i, 0)
    return picked

plan = ([(k, pairs[k]) for k in sorted(pairs, key=lambda k: -len(pairs[k]))]
        + [((n,), singles[n]) for n in sorted(NAMES, key=lambda n: len(singles[n]))])

placed, taken, fail = [], [], 0
for key, items in plan:
    m = erode(region(tuple(sorted(key))), 46)
    if m.sum() == 0: m = region(tuple(sorted(key)))
    pts = place(m, len(items), taken)
    if len(pts) < len(items):
        fail += len(items) - len(pts)
        print(f"  ✗ {' ∩ '.join(key)}: {len(pts)}/{len(items)}")
    # Кого в какую точку — решает куратор там, где он высказался.
    # Позиции уже посчитаны геометрией; кураторские x/y (15 из 33, остаток
    # раскладки под ~15 чипов) задают лишь НАЗНАЧЕНИЕ внутри области.
    # Так композиция, которую куратор держал в голове, переживает пересчёт.
    items = sorted(items, key=lambda i: (i.get("cy") if i.get("cy") is not None else 999))
    pts = sorted(pts, key=lambda p: (round(p[0]/COL_GAP), p[1]))
    anchored = [i for i in items if i.get("cx") is not None]
    rest = [i for i in items if i.get("cx") is None]
    free = list(pts); ordered = []
    for it in anchored:
        tx, ty = it["cx"]/100*W, it["cy"]/100*H
        k = min(range(len(free)), key=lambda i: math.dist(free[i], (tx, ty)))
        ordered.append((free.pop(k), it))
    ordered += list(zip(free, rest))
    for p, it in ordered:
        placed.append(dict(id=it["id"], title_ru=it["t"], camp=it["camp"],
                           venn_groups=it["g"], curated=it.get("cx") is not None,
                           x=round(p[0]/W*100, 2), y=round(p[1]/H*100, 2)))
    taken += pts

d = [math.dist((a['x']/100*W, a['y']/100*H), (b['x']/100*W, b['y']/100*H))
     for a, b in itertools.combinations(placed, 2)]
print(f"\nразмещено {len(placed)}/{len(PARTIES)}, не влезло {fail}")
print(f"минимальное расстояние центров {min(d):.1f} px  (требование {HIT})")
print(f"на киоске ×2 — {min(d)*2:.0f} px")

# ── SVG-превью ─────────────────────────────────────────────────────────────
def path(p, steps=240):
    pts = []
    for i in range(steps):
        th = 2*math.pi*i/steps
        m = 1.0 + 0.11*math.sin(3*th + p[5]) + 0.06*math.sin(5*th - p[5]*1.7)
        x, y = p[2]*m*math.cos(th), p[3]*m*math.sin(th)
        c, s = math.cos(p[4]), math.sin(p[4])
        pts.append((p[0] + x*c - y*s, p[1] + x*s + y*c))
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"

COL = {"red":"var(--camp-red)","rev-dem":"var(--camp-rev-dem)","white":"var(--camp-white)",
       "green":"var(--camp-green)","national":"var(--camp-national)"}
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="100%">']
svg.append(f'<rect width="{W}" height="{H}" fill="var(--page-bg-deep)"/>')
for n in NAMES:
    svg.append(f'<path d="{path(P[n])}" fill="{COL[n]}" fill-opacity="0.42" '
               f'stroke="{COL[n]}" stroke-width="2"/>')
for c in placed:
    x, y = c['x']/100*W, c['y']/100*H
    svg.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{HIT/2}" fill="none" '
               f'stroke="var(--brass)" stroke-opacity="0.30" stroke-width="1"/>')
    svg.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="7" fill="{COL[c["camp"]]}" '
               f'stroke="var(--paper-white)" stroke-width="1.5"/>')
svg.append('</svg>')
open(S + "venn.svg", "w").write("\n".join(svg))
json.dump(placed, open(S + "venn_chips.json", "w"), ensure_ascii=False, indent=1)
print("SVG и координаты записаны")
