#!/usr/bin/env python3
"""Сборка полигонов территорий в КАРТЫ — шаг, которого не хватало.

ЗАЧЕМ. Полигон и карта — разные примитивы. `<map-unit map-id>` адресует
собранную карту в content/maps/, а полигон это контур в системе координат
base. Второе первым не адресуется, и потому шесть собранных полигонов
не показывались: рисовать их было НЕ НА ЧЕМ.

Причина глубже непроставленного territory_id: `base.svg` в реестре — null,
то есть базы как артефакта не существует. Систему координат я зафиксировала
раньше базы намеренно, чтобы полигоны можно было собирать не дожидаясь
отрисовки; это сработало. Но шаг «положить их на холст» остался несделанным,
и об этом я не сказала — вот это и было упущением.

ЧТО СОБИРАЕТ. Три карты, а не одну, и это важно сказать вслух:

  territories                   4 территории на ОБЩЕЙ базе — у них полигоны
                                в одном viewBox 0 0 1820 1180 и складываются
                                без преобразований;
  allies-entente-presence       geometry_kind: presence, своя проекция;
  czechoslovak-corps-corridor   geometry_kind: corridor, своя проекция.

Две последние с базой сложить НЕЛЬЗЯ: они не в её координатах. «Собрали 6,
показываются 4» — ровно тот класс дефектов, из которого проект не выходил
двое суток, поэтому счётчик в отчёте печатается со знаменателем.

ИМЕНА СЛОЁВ РАВНЫ territory_id. Это не косметика: карточка должна выводить
initial_layers из того, что у неё уже есть, не зная моих внутренних имён.
У многофазных территорий дополнительно слои <territory_id>-<n> — они и есть
таймлайн, который по §10 должен быть UI, а не запечёнными пикселями.

БАЗА ВРЕМЕННАЯ И ОБЯЗАНА ТАК ВЫГЛЯДЕТЬ. Растр 1820×1180 апскейлится
на 4K в 1.88 раза и мылит. По §2 затычка не должна выглядеть готовой,
поэтому подпись слоя прямо говорит, что основа временная, и то же лежит
в map.json полем notice_ru. Приедет подробный источник — подложка меняется,
layers.svg не трогается.

  python3 scripts/maps/build_territory_maps.py --check
  python3 scripts/maps/build_territory_maps.py --write
"""

import argparse
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import owned_write, fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GEO = os.path.join(ROOT, "public", "content", "geo")
INDEX = os.path.join(GEO, "_index.json")
MAPS = os.path.join(ROOT, "public", "content", "maps")

SHARED = "territories"
NOTICE = ("Временная основа: клиентский ОБРАЗЕЦ базовой карты, растр. "
          "На 4K заметно мягче вектора. Ждём подробный источник от музея — "
          "подложка заменится, контуры территорий останутся теми же.")
BASE_LABEL = "Временная основа (растр, ждём подробный источник)"

# Роль цвета по лагерю — словарь группы map, как требует R10.
CAMP_ROLE = {
    "red": "map-red", "white": "map-white", "national": "map-national",
    "rev-dem": "map-rev-dem", "uprising": "map-uprising",
    "intervention": "map-intervention",
}


def polygons_of(rel):
    """Содержимое <g> из файла полигона — как есть, без перерисовки."""
    path = os.path.join(ROOT, "public", rel)
    if not os.path.exists(path):
        return None
    svg = open(path, encoding="utf-8").read()
    m = re.search(r'<g[^>]*class="territory"[^>]*>(.*?)</g>', svg, re.S)
    if m:
        return m.group(1).strip()
    # presence и corridor устроены иначе — там несколько групп верхнего уровня
    body = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", svg, flags=re.S)
    return body.strip()


def view_box_of(rel):
    path = os.path.join(ROOT, "public", rel)
    svg = open(path, encoding="utf-8").read()
    m = re.search(r'viewBox="([^"]+)"', svg)
    return m.group(1) if m else None


def make_base_jpg(doc, dest, dry):
    """Веб-производная клиентского ОБРАЗЦА, а не побайтовая копия (§7)."""
    ref = doc["base"]["reference_raster"]
    src = os.path.join(ROOT, doc["src_roots"][ref["src_root"]], ref["src_file"])
    if not os.path.exists(src):
        return None, f"нет исходной базы: {ref['src_file'][:40]}"
    if dry:
        return src, None
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions",
                        "82", src, "--out", owned_write(dest)],
                       capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(dest):
        return None, f"пережатие не удалось: {r.stderr.strip()[:60]}"
    return dest, None


def build(doc, dry):
    """Возвращает (карты, ошибки). Карта = (id, meta, svg_text)."""
    vb_base = doc["base"]["viewBox"]
    out, errors = [], []

    shared_layers, shared_groups = [], []
    standalone = []
    # Показанные территории считаются ЯВНО. Первая версия выводила их
    # по признаку «в id слоя нет дефиса» — и потеряла russian-state-kolchak
    # с vremennoe-pravitelstvo-rossiyskaya-respu, у которых дефисы в самом
    # territory_id. Счётчик соврал в безопасную сторону, но соврал.
    shown = set()

    for it in doc["items"]:
        if not it.get("polygon"):
            continue
        kind = it.get("geometry_kind", "area")
        role = CAMP_ROLE.get(it.get("camp"))
        if role is None:
            errors.append(f"{it['id']}: неизвестный лагерь «{it.get('camp')}»")
            continue

        if kind == "area":
            # Представительный контур — тот, что в polygon записи (последний
            # по времени срез). Имя слоя РАВНО territory_id.
            body = polygons_of(it["polygon"])
            if body is None:
                errors.append(f"{it['id']}: polygon указывает в пустоту")
                continue
            # Заливка ИЗ РОЛИ, а не значением: цвет живёт в палитре (R10).
            # Первый прогон дал чёрный силуэт — map.json красит только плашку
            # в панели, геометрию он не трогает, и группа наследовала
            # дефолтный fill. Видно только глазами: замер сообщал
            # «visible» и «bbox есть», то есть был прав и бесполезен.
            fill = f' fill="var(--{role})" fill-opacity="0.55"'
            shared_groups.append(f'  <g id="{it["id"]}"{fill}>\n{body}\n  </g>')
            shown.add(it["id"])
            shared_layers.append({
                "id": it["id"], "label_ru": it["title_ru"],
                "kind": "vector", "default": True, "color": role,
            })
            # Фазы — отдельными слоями, выключены: это таймлайн для UI.
            for ph in it.get("phases", []):
                if not ph.get("polygon"):
                    continue
                pb = polygons_of(ph["polygon"])
                if pb is None:
                    errors.append(f"{it['id']} фаза {ph['n']}: polygon в пустоту")
                    continue
                lid = f'{it["id"]}-{ph["n"]}'
                shared_groups.append(f'  <g id="{lid}"{fill}>\n{pb}\n  </g>')
                shared_layers.append({
                    "id": lid,
                    "label_ru": f'{it["title_ru"]} — {ph["label_ru"]}',
                    "kind": "vector", "default": False, "anim": "fade",
                    "color": role,
                })
        else:
            # presence и corridor — своя проекция, отдельная карта.
            body = polygons_of(it["polygon"])
            if body is None:
                errors.append(f"{it['id']}: polygon указывает в пустоту")
                continue
            vb = view_box_of(it["polygon"])
            gids = re.findall(r'<g[^>]*\bid="([^"]+)"', body)
            standalone.append((f'{it["id"]}-{kind}', it, vb, body, gids, role))
            shown.add(it["id"])

    if shared_groups:
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_base}">\n'
               f'  <!-- Территории на общей базе. Сгенерировано\n'
               f'       scripts/maps/build_territory_maps.py из полигонов\n'
               f'       public/content/geo/polygons/ — руками не править.\n'
               f'       Имена групп РАВНЫ territory_id, чтобы карточка выводила\n'
               f'       initial_layers из того, что у неё уже есть. Группы\n'
               f'       <id>-<n> — временные срезы, по §10 это таймлайн UI. -->\n'
               + "\n".join(shared_groups) + "\n</svg>\n")
        meta = {
            "id": SHARED, "kind": "map",
            "title_ru": "Территории гособразований на базовой карте",
            "title_en": "", "viewBox": vb_base,
            "background_raster": "background.jpg",
            "preserve_aspect": "none",
            "notice_ru": NOTICE,
            "layers": [{"id": "background", "label_ru": BASE_LABEL,
                        "kind": "raster", "default": True}] + shared_layers,
            "svg": "layers.svg",
            "source_ru": "Контуры — обводка листов заказчика, привязка подобием "
                         "к ОБРАЗЦУ базовой карты. Основа — сам ОБРАЗЕЦ, "
                         "пережатый под показ.",
            "notes_ru": "Основа ВРЕМЕННАЯ и обязана так выглядеть (§2): растр "
                        "1820×1180 апскейлится на 4K в 1.88 раза. Подпись слоя "
                        "и notice_ru про это говорят прямо. Приедет подробный "
                        "источник — меняется подложка, layers.svg не трогается.",
        }
        out.append((SHARED, meta, svg))

    for mid, it, vb, body, gids, role in standalone:
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">\n'
               f'  <!-- {it["title_ru"]}. Сгенерировано\n'
               f'       scripts/maps/build_territory_maps.py.\n'
               f'       geometry_kind {it.get("geometry_kind")}: своя проекция,\n'
               f'       с базой не складывается. -->\n{body}\n</svg>\n')
        meta = {
            "id": mid, "kind": "map", "title_ru": it["title_ru"], "title_en": "",
            "viewBox": vb, "svg": "layers.svg",
            "layers": [{"id": g, "label_ru": g, "kind": "vector",
                        "default": True, "color": role} for g in gids],
            "source_ru": f'Геометрия из реестра, geometry_kind '
                         f'{it.get("geometry_kind")}.',
            "notes_ru": "Своя система координат, не координаты base: сложить "
                        "с базовой картой нельзя, поэтому отдельная карта.",
        }
        out.append((mid, meta, svg))

    return out, errors, shown


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    doc = json.load(open(INDEX, encoding="utf-8"))
    with_geom = [i for i in doc["items"] if i.get("polygon")]
    fail_if_empty(len(with_geom), "записей реестра с геометрией")

    maps, errors, shown = build(doc, dry=not args.write)

    print(f"карт собрано: {len(maps)}")
    for mid, meta, _ in maps:
        v = [l for l in meta["layers"] if l["kind"] == "vector"]
        print(f"   {mid:30} viewBox {meta['viewBox']:18} слоёв {len(v)}")
    print()
    print(f"территорий показывается: {len(shown)}/{len(with_geom)}")
    if len(shown) != len(with_geom):
        miss = sorted({i['id'] for i in with_geom} - shown)
        print(f"   НЕ показываются: {', '.join(miss)}")
    for e in errors:
        print(f"   ✗ {e}", file=sys.stderr)

    if args.write:
        base_dst = os.path.join(MAPS, SHARED, "background.jpg")
        _, err = make_base_jpg(doc, base_dst, dry=False)
        if err:
            print(f"   ✗ {err}", file=sys.stderr)
            return 1
        for mid, meta, svg in maps:
            d = os.path.join(MAPS, mid)
            os.makedirs(d, exist_ok=True)
            open(owned_write(os.path.join(d, "layers.svg")), "w",
                 encoding="utf-8").write(svg)
            with open(owned_write(os.path.join(d, "map.json")), "w",
                      encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
                f.write("\n")
        print(f"\nзаписано: {len(maps)} карт, основа "
              f"{os.path.getsize(base_dst)} байт")
    else:
        print("\n(dry-run, ничего не записано)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
