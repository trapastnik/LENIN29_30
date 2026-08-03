"""Разбор venn-bg.png: какие области реально существуют на картинке.

Блобы полупрозрачные и наложены друг на друга, поэтому «какие группы
покрывают пиксель» восстанавливается не по имени цвета, а по тому,
насколько пиксель ушёл от фона в сторону каждого из пяти базовых цветов.
Считаем в линейном RGB и решаем задачу наименьших квадратов на смеси.
"""
import numpy as np
from PIL import Image

W = 1660
img = Image.open("public/content/parties/venn-bg.png").convert("RGB")
img = img.resize((W, int(img.height * W / img.width)), Image.LANCZOS)
a = np.asarray(img).astype(float) / 255.0
H = a.shape[0]

bg = np.array([0.145, 0.153, 0.165])          # тёмный фон сцены

# Базовые цвета блобов, снятые с однотонных участков картинки.
GROUPS = {
    "red":      (0.52, 0.11, 0.09),
    "rev-dem":  (0.36, 0.13, 0.44),
    "white":    (0.72, 0.72, 0.74),
    "green":    (0.09, 0.34, 0.16),
    "national": (0.72, 0.55, 0.05),
}
names = list(GROUPS)
C = np.stack([np.array(GROUPS[n]) - bg for n in names])      # (5,3) направления

D = a.reshape(-1, 3) - bg                                     # (N,3) отклонение
# неотрицательный МНК на 5 коэффициентов, грубо но устойчиво: проекция + отсечка
G = C @ C.T + np.eye(5) * 1e-3
coef = np.linalg.solve(G, (C @ D.T))                          # (5,N)
coef = np.clip(coef, 0, None).T.reshape(H, W, 5)

mask = coef > 0.33                                            # покрыт ли группой
total = H * W

print(f"размер {W}x{H}\n")
print("ПЛОЩАДЬ ОДИНОЧНЫХ ОБЛАСТЕЙ (% кадра)")
for i, n in enumerate(names):
    print(f"  {n:<10}{mask[:,:,i].sum()/total*100:6.2f}")

print("\nПЕРЕСЕЧЕНИЯ — есть ли место под чипы")
need = {("red","rev-dem"):1, ("rev-dem","white"):2, ("national","red"):3,
        ("national","white"):1, ("green","national"):1, ("national","rev-dem"):4}
rows = []
for i in range(5):
    for j in range(i+1, 5):
        both = (mask[:,:,i] & mask[:,:,j]).sum()
        pct = both/total*100
        pair = (names[i], names[j])
        k = need.get(pair, need.get((pair[1], pair[0]), 0))
        rows.append((k, pct, names[i], names[j], both))
for k, pct, n1, n2, px in sorted(rows, key=lambda r: -r[0]):
    flag = ""
    if k and px < 3000:
        flag = "  ✗ НЕТ ОБЛАСТИ, а нужно " + str(k)
    elif k:
        flag = f"  нужно {k}"
    print(f"  {n1:<10}∩ {n2:<10}{pct:6.2f}%  {px:8d} px{flag}")
