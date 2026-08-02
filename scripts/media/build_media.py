"""Оригиналы из `../IN/` → веб-производные в `public/content/media/`.

Оригиналы (1.6 ГБ, из них 118 TIF) в репо не попадают никогда — живут в `../IN/`.
Сюда едут только производные: WebP в трёх тирах.

    lg   2400×1500     карточка справки, лайтбокс на киоске 4K
    sm   1280×900      плитка, лента хроники
    xs    560×560      превью, миниатюра в списке

Тир — это ОГРАНИЧИВАЮЩАЯ РАМКА, а не размер: пропорции сохраняются, картинка
вписывается внутрь.

⚠️ **Апскейла нет.** У 39 % фонда длинная сторона меньше 1600 px, и растянуть
такой скан до 2400 — значит показать на киоске мыло вместо экспоната. Если
оригинал целиком влезает в рамку тира, тир получается равен нативу; а если
он совпал по размеру с уже собранным тиром покрупнее — не пишется вовсе.
Поэтому у мелких сканов тиров два, а то и один. Что собрано на самом деле,
перечислено в `tiers` каждой медиазаписи — гадать по имени файла не надо.

Многочастные аннотации (две стороны купюры, разворот) дают несколько
производных на одну запись: `05`, `05p2`, … Полный список — в поле `files`.

Что куда:
    public/content/media/<вид>/<id>/<nn>[pN]-<тир>.webp   производные (в .gitignore)
    content-src/_media-manifest.json                      что собрано (в репо)

Манифест коммитится, а производные — нет, и это не оплошность: `tiers`
в справках обязаны быть одинаковыми на любой машине, в том числе там,
где `../IN/` нет и пересобрать нечем. Манифест читает `run_import.py`.

Запуск:
    python3 scripts/media/build_media.py                 # инкрементально
    python3 scripts/media/build_media.py --only lenin
    python3 scripts/media/build_media.py --force
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[2]
IN = ROOT.parent / "IN" / "new" / "МТК №29"
CONTENT = ROOT / "public" / "content"
MEDIA = CONTENT / "media"
MANIFEST = ROOT / "content-src" / "_media-manifest.json"

BUILDER_VERSION = "1.0.0"

# (имя, ширина рамки, высота рамки)
TIERS: List[Tuple[str, int, int]] = [
    ("lg", 2400, 1500),
    ("sm", 1280, 900),
    ("xs", 560, 560),
]

QUALITY = 82          # WebP q: на сканах выше 85 растёт вес без видимой разницы
METHOD = 6            # медленнее жмёт, но заметно меньше вес

DIRS = {
    "person": "persons",
    "party": "parties",
    "state": "states",
    "event": "events",
}


# ---------------------------------------------------------------- разбор json


def entity_files() -> List[Tuple[str, Path]]:
    out = []
    for kind, folder in DIRS.items():
        d = CONTENT / folder
        if not d.is_dir():
            continue
        for p in sorted(d.glob("*.json")):
            name = p.name
            if name.startswith("_") or ".gen." in name or ".patch." in name:
                continue
            out.append((kind, p))
    return out


class Job:
    """Одна производная: откуда взять, куда положить."""

    __slots__ = ("src", "base", "where")

    def __init__(self, src: Path, base: str, where: str):
        self.src = src
        self.base = base      # `media/persons/lenin/01`, без тира и расширения
        self.where = where    # для сообщений об ошибках


def collect_jobs(only: Optional[str]) -> Tuple[List[Job], List[str]]:
    jobs: List[Job] = []
    notes: List[str] = []
    seen_base: Dict[str, str] = {}

    for kind, path in entity_files():
        data = json.loads(path.read_text(encoding="utf-8"))
        eid = data.get("id") or path.stem
        if only and only not in eid and only not in path.name:
            continue
        srcdoc = (data.get("src") or {}).get("file")
        if not srcdoc:
            continue
        folder = (IN / srcdoc).parent

        for m in data.get("media") or []:
            base = m.get("file")
            if not base or not m.get("src_file"):
                continue
            names = m.get("parts") or [m["src_file"]]
            for k, name in enumerate(names, start=1):
                b = base if k == 1 else "%sp%d" % (base, k)
                src = folder / name
                if not src.exists():
                    notes.append("%s: нет оригинала %s" % (eid, name))
                    continue
                if b in seen_base:
                    notes.append("%s: путь производной занят (%s), пропущено %s"
                                 % (eid, seen_base[b], name))
                    continue
                seen_base[b] = eid
                jobs.append(Job(src, b, "%s/%s n=%s" % (kind, eid, m.get("n"))))
    return jobs, notes


# ---------------------------------------------------------------- конвертация


def fit(w: int, h: int, box_w: int, box_h: int) -> Tuple[int, int]:
    """Вписать в рамку, сохранив пропорции. Никогда не увеличивать."""
    scale = min(box_w / w, box_h / h, 1.0)
    return max(1, int(round(w * scale))), max(1, int(round(h * scale)))


def build_one(args) -> dict:
    """Собрать все тиры одной картинки. Отдельный процесс — Pillow не потокобезопасен."""
    src_str, base, where, force = args
    from PIL import Image, ImageOps, ImageFile

    ImageFile.LOAD_TRUNCATED_IMAGES = True   # часть сканов заказчика битая с хвоста
    Image.MAX_IMAGE_PIXELS = None            # архивные TIF крупнее дефолтного лимита

    src = Path(src_str)
    res = {"base": base, "tiers": [], "where": where, "error": None,
           "w": None, "h": None, "skipped": 0, "written": 0}
    try:
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode in ("CMYK", "YCbCr", "P", "LA", "L", "1", "I;16", "I"):
                im = im.convert("RGBA" if im.mode in ("LA", "P") else "RGB")
            elif im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            w, h = im.size
            res["w"], res["h"] = w, h

            done_sizes = set()
            for tier, bw, bh in TIERS:
                tw, th = fit(w, h, bw, bh)
                if (tw, th) in done_sizes:
                    # Совпало с уже собранным тиром покрупнее — второй такой же
                    # файл под другим именем не нужен.
                    continue
                done_sizes.add((tw, th))
                out = CONTENT / ("%s-%s.webp" % (base, tier))
                res["tiers"].append(tier)
                if (not force and out.exists()
                        and out.stat().st_mtime >= src.stat().st_mtime):
                    res["skipped"] += 1
                    continue
                out.parent.mkdir(parents=True, exist_ok=True)
                frame = im if (tw, th) == (w, h) else im.resize((tw, th), Image.LANCZOS)
                tmp = out.with_suffix(".webp.part")
                frame.save(tmp, "WEBP", quality=QUALITY, method=METHOD)
                os.replace(tmp, out)
                res["written"] += 1
    except Exception as exc:  # noqa: BLE001
        res["error"] = "%s: %s" % (type(exc).__name__, exc)
    return res


# ---------------------------------------------------------------- манифест


def write_manifest(results: List[dict]) -> None:
    entries = {}
    for r in results:
        if r["error"] or not r["tiers"]:
            continue
        entries[r["base"]] = {"tiers": r["tiers"], "w": r["w"], "h": r["h"]}
    payload = {
        "schema": 1,
        "builder": BUILDER_VERSION,
        "_note": ("Что собрал `npm run media:build`. Коммитится, а сами производные — "
                  "нет: поле `tiers` в справках обязано быть одинаковым на любой "
                  "машине, включая ту, где ../IN/ нет. Читает run_import.py."),
        "tier_boxes": {name: [bw, bh] for name, bw, bh in TIERS},
        "entries": dict(sorted(entries.items())),
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Сборка веб-производных из ../IN/")
    ap.add_argument("--only", help="подстрока id или имени файла справки")
    ap.add_argument("--force", action="store_true", help="пересобрать даже свежие")
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 4) - 1))
    args = ap.parse_args(argv)

    if not IN.is_dir():
        print("нет каталога оригиналов: %s" % IN, file=sys.stderr)
        print("производные собираются только там, где лежит ../IN/", file=sys.stderr)
        return 2

    jobs, notes = collect_jobs(args.only)
    if not jobs:
        print("нечего собирать")
        return 0
    print("к сборке: %d изображений, потоков %d" % (len(jobs), args.jobs))

    payload = [(str(j.src), j.base, j.where, args.force) for j in jobs]
    results: List[dict] = []
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        for i, r in enumerate(pool.map(build_one, payload, chunksize=4), start=1):
            results.append(r)
            if i % 100 == 0:
                print("  … %d/%d" % (i, len(jobs)))

    written = sum(r["written"] for r in results)
    skipped = sum(r["skipped"] for r in results)
    errors = [r for r in results if r["error"]]
    tier_count: Dict[str, int] = {}
    for r in results:
        for t in r["tiers"]:
            tier_count[t] = tier_count.get(t, 0) + 1

    # Манифест перезаписываем только по полному прогону: частичный (--only)
    # затёр бы записи всех остальных справок.
    if not args.only:
        write_manifest(results)

    print("собрано файлов: %d, свежих пропущено: %d" % (written, skipped))
    print("тиры: %s" % ", ".join("%s %d" % (k, tier_count[k])
                                 for k, _, _ in TIERS if k in tier_count))
    only_native = sum(1 for r in results if not r["error"] and len(r["tiers"]) < len(TIERS))
    if only_native:
        print("у %d изображений тиров меньше трёх — оригинал мельче рамки, "
              "апскейла не делаем" % only_native)
    if args.only:
        print("частичный прогон: манифест НЕ переписан")
    for n in notes:
        print("  ! %s" % n)
    for r in errors:
        print("  СБОЙ %s (%s): %s" % (r["base"], r["where"], r["error"]))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
