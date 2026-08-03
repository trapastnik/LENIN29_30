"""Временные изображения к лонгриду «Симбирск» из Госкаталога.

    python3 scripts/simbirsk/fetch_goskatalog.py            показать план, ничего не качая
    python3 scripts/simbirsk/fetch_goskatalog.py --run      выполнить
    python3 scripts/simbirsk/fetch_goskatalog.py --run --force   перекачать уже собранное

ЧТО ЭТО И ЧЕМ ОНО НЕ ЯВЛЯЕТСЯ. Заказчик поставил к лонгриду 0 изображений:
в docx только 13 ссылок на Госкаталог и 21 строка «нужно подобрать». Пока идёт
официальный запрос на оригиналы, раздел живёт с превью из витрины каталога.
Превью — 800 px по длинной стороне, наш тир lg — 2400×1500, апскейла конвейер
не делает: как заглушка годится, как финал нет. Поэтому каждая такая картинка
жёстко помечена `placeholder: true`, а UI обязан нарисовать поверх неё плашку
«Временное изображение». Без пометки превью визуально неотличимо от
поставленного музеем файла, и на приёмке его засчитают за готовое — при том
что права на него не выкуплены.

ВЫКАЧИВАНИЕ РАЗРЕШЕНО ОТДЕЛЬНО. Задание зоны (docs/launch/m1e-simbirsk.md)
запрещало ходить по этим ссылкам. Решение изменено 2026-08-03 владельцем
проекта: превью ставим как временные, официальные файлы запрашиваются
параллельно у держателя. Держатель обеих проверенных позиций — ОГАУК
«Ленинский мемориал», то есть фонд самого заказчика.

КАК СЕБЯ ВЕСТИ С ЧУЖИМ СЕРВЕРОМ. Это витрина государственного каталога,
а не наш CDN. Обход строго последовательный, с паузой, без параллелизма,
12 уникальных позиций — не поток. Имя музея берётся один раз и кэшируется.
Уже собранное не перекачивается без --force.

ЧТО ОТКУДА БЕРЁТСЯ:

    muzfo-rest/rest/exhibits/<id>                    реквизиты предмета
    muzfo-rest/rest/museums/<museumId>               имя держателя
    muzfo-imaginator/rest/images/original/<imageId>  изображение

⚠️ Последний эндпоинт берёт id ИЗОБРАЖЕНИЯ из exhibits.images[], а НЕ id
предмета из ссылки заказчика. Подстановка id предмета — ловушка: на девяти
позициях из двенадцати она возвращала 200 и картинку, а на трёх падала с 400
и 404. Хуже того, картинка приходила ДРУГАЯ: у позиции 67744736 по id предмета
приезжало 800×368, по явному id изображения — 582×800. То есть тихо
подставлялся не тот файл. Берём images[0].id и записываем, сколько изображений
у предмета всего: где их два, это лицо и оборот, и какое из них нужно —
вопрос к музею, а не к нам.

Результат — content-src/simbirsk-placeholders.json. Это ВТОРОЙ машинный вход
импортёра: import_simbirsk.py читает его и подмешивает в .gen.json. Ручной
файл по-прежнему один, simbirsk.patch.json, и генераторы в него не пишут.
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

SRC_JSON = ROOT / "public" / "content" / "longreads" / "simbirsk.json"
OUT_DIR = ROOT / "public" / "longread" / "placeholders"
OUT_RECORD = ROOT / "content-src" / "simbirsk-placeholders.json"

API_EXHIBIT = "https://goskatalog.ru/muzfo-rest/rest/exhibits/%s"
API_MUSEUM = "https://goskatalog.ru/muzfo-rest/rest/museums/%s"
API_IMAGE = "https://goskatalog.ru/muzfo-imaginator/rest/images/original/%s"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0 Safari/537.36")

# Те же тиры и то же качество, что у медиа-конвейера зоны content
# (scripts/media/build_media.py). Совпадение не косметическое: когда приедет
# оригинал, он встанет на место заглушки без правок в вёрстке.
TIERS = [("lg", 2400, 1500), ("sm", 1280, 900), ("xs", 560, 560)]
QUALITY = 82
METHOD = 6

PAUSE = 3.0
TIMEOUT = 30

GK_ID_RE = re.compile(r"[?&]id=(\d+)")


def gk_id(url: str | None) -> str | None:
    m = GK_ID_RE.search(url or "")
    return m.group(1) if m else None


def file_base(gk: str) -> str:
    """Путь к производной — ВЫВОДИТСЯ из id, а не хранится копией.

    Отсчёт от public/content/, как у всей медиа проекта: иначе медиа-конвейер
    зоны content однажды подставит сюда свой путь в своей системе координат,
    и слот уедет в никуда. Ведущий «../» честный — заглушки лежат
    в public/longread/, вне каталога зоны content.
    """
    return "../longread/placeholders/%s" % gk


def targets() -> list[dict]:
    """Уникальные позиции каталога из канона лонгрида.

    Уникальные, а не все ссылки: открытка Тухачевского стоит и в разделе 3,
    и в разделе 8 — качать её дважды незачем.
    """
    data = json.loads(SRC_JSON.read_text(encoding="utf-8"))
    seen: dict[str, dict] = {}
    for sec in data["sections"]:
        for m in sec["media"]:
            i = gk_id(m.get("source_url"))
            if not i:
                continue
            slot = "%s.%s" % (sec["n"], m["n"])
            if i in seen:
                seen[i]["slots"].append(slot)
            else:
                seen[i] = {"gk": i, "slots": [slot],
                           "caption": m.get("caption_ru") or ""}
    return list(seen.values())


def get(url: str, as_json: bool = True):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "application/json" if as_json else "image/jpeg,image/*",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        raw = resp.read()
    return json.loads(raw.decode("utf-8")) if as_json else raw


def fit(w: int, h: int, box_w: int, box_h: int) -> tuple[int, int]:
    """Вписать в рамку, сохранив пропорции. НИКОГДА не увеличивать.

    Для заглушек это главное правило: превью 800 px, растянутое до тира lg,
    выглядит как брак печати и обесценивает всю страницу.
    """
    scale = min(box_w / w, box_h / h, 1.0)
    return max(1, int(round(w * scale))), max(1, int(round(h * scale)))


def to_webp(raw: bytes, base: Path) -> tuple[list[str], int, int]:
    from io import BytesIO
    from PIL import Image, ImageOps

    with Image.open(BytesIO(raw)) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        w, h = im.size
        tiers, done = [], set()
        for tier, bw, bh in TIERS:
            tw, th = fit(w, h, bw, bh)
            if (tw, th) in done:
                # Совпало с тиром покрупнее — второй такой же файл не нужен.
                # У превью 800 px так схлопываются lg и sm.
                continue
            done.add((tw, th))
            tiers.append(tier)
            frame = im if (tw, th) == (w, h) else im.resize((tw, th), Image.LANCZOS)
            out = base.with_name("%s-%s.webp" % (base.name, tier))
            out.parent.mkdir(parents=True, exist_ok=True)
            frame.save(out, "WEBP", quality=QUALITY, method=METHOD)
    return tiers, w, h


def main() -> int:
    argv = sys.argv[1:]
    run = "--run" in argv
    force = "--force" in argv

    items = targets()
    record = {}
    if OUT_RECORD.exists():
        record = json.loads(OUT_RECORD.read_text(encoding="utf-8")).get("items", {})
        # Выводимые поля пересчитываем на каждом прогоне. Иначе смена
        # конвенции путей потребовала бы перекачивать 12 картинок ради
        # правки строки — это витрина госкаталога, туда не ходят зря.
        for key, entry in record.items():
            entry["file"] = file_base(key)

    todo = [t for t in items if force or t["gk"] not in record]

    print("Госкаталог: позиций в лонгриде %d, уже собрано %d, к загрузке %d"
          % (len(items), len(items) - len(todo), len(todo)))
    print("Запросов будет ~%d, пауза %.1f с, строго по очереди.\n"
          % (len(todo) * 2 + 1, PAUSE))

    if not run:
        for t in items:
            mark = "есть" if t["gk"] in record and not force else "качать"
            print("  [%s] %s  разделы %s  %s"
                  % (mark, t["gk"], ",".join(t["slots"]), t["caption"][:52]))
        print("\nЭто план. Ничего не загружено и не записано.")
        print("Выполнить: python3 scripts/simbirsk/fetch_goskatalog.py --run")
        return 0

    museums: dict[str, str] = {}
    failed = []

    for n, t in enumerate(todo, 1):
        i = t["gk"]
        print("[%d/%d] %s …" % (n, len(todo), i), end=" ", flush=True)
        try:
            meta = get(API_EXHIBIT % i)
            time.sleep(PAUSE)

            mid = str(meta.get("museumId") or "")
            if mid and mid not in museums:
                museums[mid] = (get(API_MUSEUM % mid) or {}).get("name") or ""
                time.sleep(PAUSE)

            images = meta.get("images") or []
            if not images:
                raise ValueError("у предмета нет изображений в каталоге")
            image_id = str(images[0].get("id") or images[0].get("code") or "")
            if not image_id:
                raise ValueError("у первого изображения нет id")

            raw = get(API_IMAGE % image_id, as_json=False)
            tiers, w, h = to_webp(raw, OUT_DIR / i)

            record[i] = {
                "gk_no": str(meta.get("regNumber") or "") or None,
                "kp_no": (meta.get("gikNumber") or "").strip() or None,
                "inv_no": (meta.get("invNumber") or "").strip() or None,
                "holder_ru": museums.get(mid) or None,
                "name_ru": (meta.get("name") or "").strip() or None,
                "dims_ru": (meta.get("dimStr") or "").strip() or None,
                "period_ru": (meta.get("periodStr") or "").strip() or None,
                "file": file_base(i),
                "w": w, "h": h, "tiers": tiers,
                "image_id": image_id,
                "image_file": images[0].get("fileName"),
                # Сколько изображений у предмета всего. Два — обычно лицо
                # и оборот; какое из них нужно в лонгриде, решает музей.
                "images_count": len(images),
                "source_url": "https://goskatalog.ru/portal/#/collections?id=%s" % i,
            }
            print("%dx%d, тиры %s, КП %s%s"
                  % (w, h, "+".join(tiers), record[i]["kp_no"] or "—",
                     ", изображений %d" % len(images) if len(images) > 1 else ""))
        except (urllib.error.URLError, OSError, ValueError) as exc:
            print("ОШИБКА %s: %s" % (type(exc).__name__, exc))
            failed.append(i)
        time.sleep(PAUSE)

    OUT_RECORD.parent.mkdir(parents=True, exist_ok=True)
    OUT_RECORD.write_text(
        json.dumps({"schema": 1,
                    "note": ("Временные изображения из Госкаталога. Машинный файл, "
                             "второй вход import_simbirsk.py. Руками не править — "
                             "перезапиши прогоном fetch_goskatalog.py --run."),
                    "items": dict(sorted(record.items()))},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")

    print("\nЗаписано: %s (%d позиций)"
          % (OUT_RECORD.relative_to(ROOT), len(record)))
    print("Файлы:    %s" % OUT_DIR.relative_to(ROOT))
    if failed:
        print("Не получилось: %s" % ", ".join(failed))
    print("\nДальше: python3 scripts/simbirsk/import_simbirsk.py")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
