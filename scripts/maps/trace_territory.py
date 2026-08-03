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
from _zone import owned_write, fail_if_empty  # noqa: E402


def hex_bgr(s):
    s = s.lstrip("#")
    r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
    return np.array([b, g, r], dtype=np.int16)


def flood_mask(sheet, spec):
    """Заливка от семени — для территорий, закрашенных БЕЛЫМ.

    Прямая маска по цвету тут не работает: белым на листе нарисованы и своя
    территория, и суша соседей, и незакрашенные области. Зато белое поле
    ограничено нарисованными тёмными линиями — берегом и границами. Поэтому
    берём «всё белое», отсекаем линии и разливаемся от точки внутри своей
    территории: барьером служит сама графика листа.

    Уязвимое место — разрыв в линии границы: заливка утечёт к соседу того же
    тона (у листа Колчака рядом заштрихованная «Северная область»). Поэтому
    линии перед заливкой утолщаются на `barrier_dilate`, а результат
    обязательно смотрится глазами.
    """
    target = hex_bgr(spec["fill"])
    tol = int(spec.get("tol", 30))
    white = (np.abs(sheet.astype(np.int16) - target).max(axis=2) <= tol)

    # РЕКИ РАССЕКАЮТ ТЕРРИТОРИЮ. Обь, Енисей, Лена и Амур идут через неё
    # насквозь, и заливка по одному белому останавливается на них: залилось
    # 16 % листа при 50 % белого. Значит реки надо сделать проходимыми.
    #
    # Но река и море одного цвета, и «всё бирюзовое проходимо» утекает
    # в океан (залилось 73 %). Различаем по толщине: море переживает эрозию,
    # тонкая река нет. Эрозия + обратная дилатация даёт море вместе с кромкой,
    # река остаётся в остатке.
    sea_c = spec.get("sea_fill")
    if sea_c:
        teal = (np.abs(sheet.astype(np.int16) - hex_bgr(sea_c)).max(axis=2)
                <= int(spec.get("sea_tol", 34)))
        er = int(spec.get("sea_erode", 4))
        ke = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (er * 2 + 1,) * 2)
        kd = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, ((er + 2) * 2 + 1,) * 2)
        sea = cv2.dilate(cv2.erode(teal.astype(np.uint8) * 255, ke), kd) > 0
        white = white | (teal & ~sea)

    # Утолщаем барьер — заклеиваем разрывы в линиях границ.
    dil = int(spec.get("barrier_dilate", 0))
    if dil > 0:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dil * 2 + 1,) * 2)
        white = cv2.dilate((~white).astype(np.uint8) * 255, k) == 0

    free = white.astype(np.uint8) * 255
    out = np.zeros((free.shape[0] + 2, free.shape[1] + 2), np.uint8)
    got = np.zeros_like(free)
    for sx, sy in spec["seed_at"]:
        if not free[int(sy), int(sx)]:
            continue
        tmp = free.copy()
        cv2.floodFill(tmp, out, (int(sx), int(sy)), 128)
        got = np.maximum(got, (tmp == 128).astype(np.uint8) * 255)

    # Реки и подписи внутри территории — тонкие вычеты, возвращаем их закрытием.
    kk = int(spec.get("close", 9))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kk, kk))
    return cv2.morphologyEx(got, cv2.MORPH_CLOSE, k, iterations=2)


def trace(sheet, spec):
    """Контуры заливки в координатах рамки листа."""
    if spec.get("mode") == "flood":
        mask = flood_mask(sheet, spec)
    else:
        target = hex_bgr(spec["fill"])
        tol = int(spec.get("tol", 30))
        dist = np.abs(sheet.astype(np.int16) - target).max(axis=2)
        mask = (dist <= tol).astype(np.uint8) * 255

        # Заливки перебиты подписями, точками городов и штриховкой. Закрываем
        # разрывы, иначе одна территория распадается на десятки кусков.
        # У flood-режима закрытие уже сделано внутри flood_mask.
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


def to_base(pts, M):
    """Из координат ОБРЕЗАННОГО ПО РАМКЕ листа в координаты base.

    Смещение рамки прибавлять НЕ НАДО, и это стоило одного тихого дефекта.
    register_sheets.py оценивает M по листу, уже обрезанному по рамке, то есть
    M переводит координаты обрезка. Прибавленный сверху (x1, y1) даёт двойной
    учёт: у листа Колчака рамка (27, 107) при масштабе 1.7 — сдвиг на 46 и 182
    пикселя базы. Полигон уезжал на юго-восток, накрывал Монголию и не доходил
    до Арктики, но сам по себе выглядел правдоподобно — ловится только
    наложением на базу.
    """
    return cv2.transform(pts.astype(np.float32).reshape(-1, 1, 2),
                         np.array(M, dtype=np.float32)).reshape(-1, 2)


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

            src_path = os.path.join(ROOT, roots[ph["src_root"]], ph["src_file"])
            # Исходники заказчика лежат вне репозитория и переезжают: за два
            # дня каталог «Все карты (сборка)» уже сменил место. cv2.imread
            # на отсутствующем файле возвращает None, и дальше падал трейсбек,
            # а строки о сломанном листе в отчёте не появлялось вовсе.
            img = cv2.imread(src_path)
            if img is None:
                rows.append((key, "ОШИБКА", f"исходник не читается: {ph['src_file'][:40]}", 0, 0))
                print(f"trace_territory: не читается {src_path}", file=sys.stderr)
                continue
            fr = find_map_frame(img) or (0, int(img.shape[0] * 0.10),
                                         img.shape[1], img.shape[0])
            x1, y1, x2, y2 = fr
            sheet = img[y1:y2, x1:x2]

            polys, mask = trace(sheet, sp)
            if not polys:
                rows.append((key, "ОШИБКА", "маска ничего не дала", 0, 0))
                print(f"trace_territory: {key} — маска пуста", file=sys.stderr)
                continue

            base_polys = [to_base(p, ph["transform"]["M"]) for p in polys]
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
                with open(owned_write(os.path.join(OUT_DIR, name)), "w",
                      encoding="utf-8") as f:
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
        with open(owned_write(INDEX), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print(f"{'срез':46} {'статус':12} что  точек  доля листа")
    for key, st, what, pts, pct in rows:
        tail = f"  {pts:>5}  {pct:5.1f}%" if pts else ""
        print(f"{key[:46]:46} {st:12} {what}{tail}")
    print()
    fail_if_empty(len(rows), "срезов со спецификацией трассировки",
                  "проверь scripts/maps/trace_spec.json и phases в реестре")

    ok = sum(1 for r in rows if r[1] == "ок")
    errors = sum(1 for r in rows if r[1] == "ОШИБКА")
    skipped = sum(1 for r in rows if r[1] == "пропуск")
    print(f"трассировано {ok}/{len(rows)}, ошибок {errors}, "
          f"пропущено по причине {skipped}"
          + ("" if args.write else "  (dry-run, ничего не записано)"))
    # Сбой на ОДНОЙ единице обязан менять код возврата: строку в отчёте
    # никто не читает, пока не заподозрит неладное, а подозревать нечего —
    # прогон отчитался успехом.
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
