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

def place(m, n, taken):
    cand = np.stack([xs[m], ys[m]], 1)
    if not len(cand): return []
    # берём самую «глубокую» точку области первой, дальше — жадно по удалённости
    picked = []
    while len(picked) < n and len(cand):
        ref = picked + taken
        if ref:
            d = np.min([np.hypot(cand[:,0]-q[0], cand[:,1]-q[1]) for q in ref], 0)
        else:
            d = np.hypot(cand[:,0]-cand[:,0].mean(), cand[:,1]-cand[:,1].mean()) * -1
        i = int(d.argmax())
        if ref and d[i] < HIT: break
        picked.append((float(cand[i,0]), float(cand[i,1])))
        cand = np.delete(cand, i, 0)
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
    for p, it in zip(pts, items):
        placed.append(dict(id=it["id"], title_ru=it["t"], camp=it["camp"],
                           venn_groups=it["g"],
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
