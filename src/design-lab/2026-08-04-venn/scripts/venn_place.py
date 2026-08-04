"""Расстановка чипов Венна с УЧЁТОМ ПОДПИСИ.

Прошлая версия считала чип точкой. Он не точка: якорь — левый край,
подпись растёт вправо и не переносится (`white-space: nowrap`), ширины
от 72 px («Бунд») до 453 px («Украинская социал-демократическая рабочая
партия»). Отсюда три дефекта, найденные зоной ui на живой странице:
три подписи ушли за правый край кадра, восемь пар перекрылись,
а «Мусават» встал на кромку блоба — эрозия защищала якорь, тогда как
тело чипа уносило визуальный центр наружу.

Модель здесь такая же, как в DOM:
  чип        = прямоугольник [x, x+w] × [y-H/2, y+H/2]
  точка      = «дот» в (x + DOT_OFF, y), он и обязан лежать в своей области
  хит-зона   = сам прямоугольник, растянутый по вертикали до HIT

Из этого следует правило столкновений, которого не было раньше:
два чипа мешают друг другу, только если их диапазоны по X пересекаются
И центры ближе HIT по вертикали. Разнесённые по горизонтали чипы
не конфликтуют вовсе — точечная метрика этого видеть не могла.
"""
import json, math, itertools
import numpy as np
from scipy import ndimage

W, H, HIT, GRID = 1920, 1080, 64, 4
CHIP_H  = 28        # высота чипа: dot 10 / текст 16×1.2 + padding 4×2
DOT_OFF = 11        # padding 6 + половина дота
MARGIN  = 24        # поле кадра
GAP_X   = 28        # горизонтальный зазор между соседними колонками
NAMES = ["red", "rev-dem", "white", "green", "national"]
S = "/private/tmp/claude-501/-Users-dvn-Desktop-WWWWW-BMK-29-30-mtk29-design/7193210b-3b83-48b5-82ab-c5ee566dc10a/scratchpad/"

P = json.load(open(S + "venn_blobs.json"))
PARTIES = json.load(open(S + "parties.json"))
WIDTH = {r["id"]: r["w"] for r in json.load(open(S + "widths.json"))}
for p in PARTIES:
    p["w"] = WIDTH[p["id"]]

singles, pairs = {n: [] for n in NAMES}, {}
for p in PARTIES:
    g = tuple(sorted(p["g"]))
    (singles[g[0]].append(p) if len(g) == 1 else pairs.setdefault(g, []).append(p))

xs, ys = np.meshgrid(np.arange(0, W, GRID) + GRID/2, np.arange(0, H, GRID) + GRID/2)

def mask(p):
    dx, dy = xs - p[0], ys - p[1]
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

def erode(m, r):
    k = max(1, int(r/GRID))
    e = ndimage.binary_erosion(m, np.ones((2*k+1, 2*k+1)))
    return e if e.sum() else m

SLACK = 2   # запас РАССТАНОВКИ против округления координат в проценты

def conflicts(a, b, slack=0):
    """Мешают ли друг другу два поставленных чипа.

    РАССТАВЛЯЕМ С ЗАПАСОМ (slack=SLACK), ПРОВЕРЯЕМ ПО ТРЕБОВАНИЮ (slack=0).

    Порог здесь — само требование (HIT, GAP_X), БЕЗ SLACK. Запас живёт
    в шаге расстановки, и только там.

    Смешивать их нельзя, я на этом уже попалась: подняв и шаг, и порог
    до HIT + SLACK, я их сократила. Точные координаты давали 66 < 66 —
    ложь, а округлённые 65.999 < 66 — истину, и раскладка «конфликтовала»
    сама с собой. Плюс порог стал строже на 2 px по всем осям, и две
    области перестали помещаться: 21 чип из 33 вместо 33."""
    (ax, ay, aw), (bx, by, bw) = a, b
    overlap_x = (ax < bx + bw + GAP_X + slack) and (bx < ax + aw + GAP_X + slack)
    return overlap_x and abs(ay - by) < HIT + slack

def place(items, mask_pts, taken):
    """Колонками: порядок чтения сверху вниз, ширина колонки — по самой
    длинной подписи в ней, чтобы соседняя не наезжала."""
    pts = set(map(tuple, np.stack([xs[mask_pts], ys[mask_pts]], 1).astype(int)))
    if not pts: return None
    def dot_inside(x, y):
        dx, dy = x + DOT_OFF, y
        return any(abs(dx-px) <= GRID and abs(dy-py) <= GRID for px, py in pts)

    xs_r = sorted({p[0] for p in pts}); ys_r = sorted({p[1] for p in pts})
    for ncol in range(1, len(items) + 1):
        nrow = math.ceil(len(items) / ncol)
        base = [items[i*nrow:(i+1)*nrow] for i in range(ncol)]
        if any(not c for c in base): continue
        # Широкая колонка должна стоять ЛЕВЕЕ: у правого края кадра длинной
        # подписи некуда расти, а порядок чтения внутри колонки при этом цел.
        orders = [base]
        wide_first = sorted(base, key=lambda c: -max(i["w"] for i in c))
        if wide_first != base: orders.append(wide_first)

        for cols in orders:
            widths = [max(i["w"] for i in c) for c in cols]
            offs, acc = [], 0
            for wcol in widths:
                offs.append(acc); acc += wcol + GAP_X + SLACK   # запас и по X тоже
            span = acc - GAP_X - SLACK
            for x0 in xs_r[::2]:
                if x0 + span > W - MARGIN: continue
                for y0 in ys_r[::2]:
                    if y0 - CHIP_H/2 < MARGIN or y0 + (nrow-1)*HIT + CHIP_H/2 > H - MARGIN: continue
                    out, ok = [], True
                    for ci, col in enumerate(cols):
                        for it in col:
                            x, y = x0 + offs[ci], y0 + col.index(it)*(HIT + SLACK)
                            box = (x, y, it["w"])
                            if not dot_inside(x, y) or any(conflicts(box, t, SLACK) for t in taken + out):
                                ok = False; break
                            out.append(box)
                        if not ok: break
                    if ok:
                        flat = [i for c in cols for i in c]
                        # Самопроверка на выходе, а не после. Если раскладка,
                        # которую функция считает корректной, ей же и не
                        # проходит — виновата функция, и это видно сразу,
                        # без гадания по итоговому json.
                        assert len(out) == len(flat) == len(items), \
                            f"чипов {len(items)}, прямоугольников {len(out)}, элементов {len(flat)}"
                        for i, (bx, by, bw) in enumerate(out):
                            assert dot_inside(bx, by), f"дот вне области: {flat[i]['t']}"
                        for a, b in itertools.combinations(out, 2):
                            assert not conflicts(a, b, SLACK), f"пересечение внутри области: {a} × {b}"
                        return list(zip(out, flat))
    return None

# Порядок: СНАЧАЛА САМЫЕ ТЕСНЫЕ области.
#
# Раньше сортировала по суммарной ширине подписей, и «Белые» — пять чипов
# в углу кадра — вставали последними, когда соседи уже заняли место.
# Геометрия при этом позволяла: замер показал, что колонка шириной 219 px
# помещает там семь строк при нужных пяти. Мешал порядок, а не место.
#
# Теснота = полезная площадь на один чип. Кому выбирать не из чего —
# выбирает первым; просторным областям место найдётся в любом случае.
def tightness(key, items):
    m = erode(region(tuple(sorted(key))), 32)
    return (int(m.sum()) * GRID * GRID) / len(items)

plan = sorted([(k, v) for k, v in pairs.items()] + [((n,), singles[n]) for n in NAMES],
              key=lambda kv: tightness(*kv))

placed, taken, failed = [], [], []
for key, items in plan:
    items = sorted(items, key=lambda i: (i.get("cy") if i.get("cy") is not None else 999, -i["w"]))
    got = None          # ← сброс обязателен: без него провалившаяся область
                        #   переиспользовала прямоугольники предыдущей, и это
                        #   дало шесть «конфликтов», которых в раскладке не было
    for r in (46, 32, 20, 10):
        got = place(items, erode(region(tuple(sorted(key))), r), taken)
        if got: break
    if not got:
        failed.append((key, len(items))); continue
    for (x, y, w), it in got:
        placed.append(dict(id=it["id"], title_ru=it["t"], camp=it["camp"],
                           venn_groups=it["g"], curated=it.get("cx") is not None,
                           w=int(w), ex=float(x), ey=float(y), x=round(x/W*100, 3), y=round(y/H*100, 3)))
        taken.append((x, y, w))

print(f"размещено {len(placed)}/{len(PARTIES)}" + (f"  НЕ СЕЛО: {failed}" if failed else ""))

over = [c for c in placed if c["x"]/100*W + c["w"] > W - MARGIN]
print(f"подписей за правым краем: {len(over)}" + (f" — {[c['title_ru'] for c in over]}" if over else ""))
bad, badx = [], []
for a, b in itertools.combinations(placed, 2):
    r = conflicts((a["x"]/100*W, a["y"]/100*H, a["w"]), (b["x"]/100*W, b["y"]/100*H, b["w"]))
    e = conflicts((a["ex"], a["ey"], a["w"]), (b["ex"], b["ey"], b["w"]))
    if r: bad.append((a, b, e))
print(f"конфликтующих пар: {len(bad)}  (из них и в ТОЧНЫХ координатах: {sum(1 for x in bad if x[2])})")
for a, b, e in bad[:3]:
    print(f"    {a['title_ru'][:30]:<32} точно x={a['ex']:8.3f} y={a['ey']:8.3f}  окр x={a['x']/100*W:8.3f} y={a['y']/100*H:8.3f}")
    print(f"    {b['title_ru'][:30]:<32} точно x={b['ex']:8.3f} y={b['ey']:8.3f}  окр x={b['x']/100*W:8.3f} y={b['y']/100*H:8.3f}")
    print(f"      Δy точно {abs(a['ey']-b['ey']):.3f}   Δy округл {abs(a['y']-b['y'])/100*H:.3f}   и там и там конфликт: {e}\n")

def norm_dist(p, x, y):
    dx, dy = x - p[0], y - p[1]
    c, s = math.cos(-p[4]), math.sin(-p[4])
    X, Y = dx*c - dy*s, dx*s + dy*c
    th = math.atan2(Y, X)
    m = 1.0 + 0.11*math.sin(3*th + p[5]) + 0.06*math.sin(5*th - p[5]*1.7)
    return math.hypot(X/(p[2]*m), Y/(p[3]*m))

worst = []
for c in placed:
    xc, y = c["x"]/100*W + c["w"]/2, c["y"]/100*H       # ВИЗУАЛЬНЫЙ центр чипа
    for n in c["venn_groups"]:
        worst.append((norm_dist(P[n], xc, y), c["title_ru"], n))
worst.sort(reverse=True)
print("\nближе всех к кромке своего блоба (визуальный центр, 1.0 = граница):")
for d, t, n in worst[:3]:
    print(f"  {d:.3f}  {t[:44]:<46} «{n}»")

json.dump(placed, open(S + "venn_chips.json", "w"), ensure_ascii=False, indent=1)
