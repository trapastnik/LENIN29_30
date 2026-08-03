#!/usr/bin/env python3
"""Проверка реестра территорий public/content/geo/_index.json.

Зачем механически, а не «внимательно посмотреть»: реестр — контракт между
зонами. `content` подставляет territory_id в 59 справок, `ui` по polygon
решает, рисовать карту или заглушку. Ошибка здесь всплывает не здесь, а
повторным прогоном импорта (CLAUDE.md §13: правило без проверки не работает).

Что ловится:
  1. Схема          — public/content/geo/geo-index.schema.json.
  2. Append-only    — сверка с версией файла в git HEAD: id не исчезают
                      и не переименовываются. Это единственная гарантия,
                      ради которой реестр вообще заведён раньше полигонов.
  3. Связь с content — каждому государству ровно одна запись и наоборот,
                      camp совпадает. Пропускается, если states/ ещё не
                      влит в эту ветку.
  4. territory_id   — если справка уже ссылается, ссылка ведёт в реестр.
  5. Исходники      — src_file существует на диске.
  6. Полигоны       — заявленный polygon не висит в пустоту.

Выход: 0 — чисто, 1 — есть нарушения.
"""

import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX = os.path.join(ROOT, "public", "content", "geo", "_index.json")
SCHEMA = os.path.join(ROOT, "public", "content", "geo", "geo-index.schema.json")
STATES = os.path.join(ROOT, "public", "content", "states")

errors = []
warnings = []
notes = []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# --- 0. файл на месте -------------------------------------------------------

if not os.path.exists(INDEX):
    print("check_geo_index: нет public/content/geo/_index.json", file=sys.stderr)
    sys.exit(1)

doc = load(INDEX)
items = doc.get("items", [])


# --- 1. схема ---------------------------------------------------------------

try:
    import jsonschema
except ImportError:
    jsonschema = None
    notes.append("jsonschema не установлен — проверка по схеме пропущена, "
                 "остальные проверки отработали")

if jsonschema is not None:
    validator = jsonschema.Draft7Validator(load(SCHEMA))
    for e in sorted(validator.iter_errors(doc), key=lambda e: list(e.path)):
        where = "/".join(str(p) for p in e.path) or "<корень>"
        fail(f"схема: {where}: {e.message}")


# --- 2. append-only ---------------------------------------------------------

ids = [i["id"] for i in items]
dupes = {i for i in ids if ids.count(i) > 1}
if dupes:
    fail(f"append-only: id не уникальны: {', '.join(sorted(dupes))}")

try:
    prev_raw = subprocess.run(
        ["git", "show", "HEAD:public/content/geo/_index.json"],
        cwd=ROOT, capture_output=True, text=True, check=False,
    )
    if prev_raw.returncode == 0:
        prev_ids = {i["id"] for i in json.loads(prev_raw.stdout).get("items", [])}
        gone = prev_ids - set(ids)
        if gone:
            fail("append-only: id пропали из реестра — переназначать нельзя, "
                 "иначе переимпорт осиротит привязанные карточки: "
                 + ", ".join(sorted(gone)))
    else:
        notes.append("реестра в HEAD ещё нет — сверка append-only пропущена "
                     "(первый коммит файла)")
except Exception as e:  # git недоступен — не повод падать
    notes.append(f"сверка append-only пропущена: {e}")


# --- 3. связь с зоной content ----------------------------------------------

states_index = os.path.join(STATES, "_index.json")
if os.path.exists(states_index):
    state_items = load(states_index).get("items", [])
    state_camp = {}
    stubs = set()
    for s in state_items:
        card = os.path.join(STATES, f"{s['id']}.json")
        has_card = os.path.exists(card)
        camp = s.get("camp")
        if camp is None and has_card:
            camp = load(card).get("camp")
        state_camp[s["id"]] = camp
        # Заглушка без файла справки территории иметь не может: у неё нет
        # источника, из которого территория взялась бы. Требовать для неё
        # запись в реестре — значит заводить territory_id «на будущее» (§5).
        if s.get("stub") and not has_card:
            stubs.add(s["id"])

    missing = set(state_camp) - set(ids) - stubs
    extra = set(ids) - set(state_camp)
    if missing:
        fail(f"нет записи в реестре для государств: {', '.join(sorted(missing))}")
    if extra:
        fail("в реестре есть записи без государства — «на будущее» заводить "
             "нельзя (§5): " + ", ".join(sorted(extra)))
    if stubs:
        warn(f"{len(stubs)} записей в states/_index.json — заглушки без справки, "
             "территории им не заводились: " + ", ".join(sorted(stubs)))

    for it in items:
        want = state_camp.get(it["id"])
        if want is not None and it.get("camp") != want:
            fail(f"{it['id']}: camp «{it.get('camp')}» расходится со справкой «{want}»")

    # 4. territory_id в справках ведёт в реестр
    for sid in sorted(state_camp):
        card = os.path.join(STATES, f"{sid}.json")
        if not os.path.exists(card):
            continue
        tid = load(card).get("territory_id")
        if tid is not None and tid not in ids:
            fail(f"states/{sid}.json: territory_id «{tid}» не найден в реестре")
else:
    notes.append("public/content/states/ нет в этой ветке — сверка со справками "
                 "пропущена, прогнать после мержа content")


# --- 5. исходники на диске --------------------------------------------------

roots = doc.get("src_roots", {})
for it in items:
    for p in it.get("phases", []):
        key, rel = p.get("src_root"), p.get("src_file")
        if not (key and rel):
            continue
        base = roots.get(key)
        if base is None:
            fail(f"{it['id']} фаза {p['n']}: неизвестный src_root «{key}»")
            continue
        if not os.path.exists(os.path.join(ROOT, base, rel)):
            warn(f"{it['id']} фаза {p['n']}: исходник не найден — {base}/{rel}")


# --- 6. заявленные полигоны -------------------------------------------------

def check_polygon(owner, value):
    if value is None:
        return
    path = value.split("#", 1)[0]
    if path.startswith("/"):
        fail(f"{owner}: ведущий слэш в polygon «{value}» — под file:// не "
             "резолвится (§5)")
        return
    if not os.path.exists(os.path.join(ROOT, "public", path)):
        fail(f"{owner}: polygon указывает в пустоту — public/{path}")


for it in items:
    check_polygon(it["id"], it.get("polygon"))
    for p in it.get("phases", []):
        check_polygon(f"{it['id']} фаза {p['n']}", p.get("polygon"))

    # Инвариант контракта: если геометрия есть хоть у одной фазы, она обязана
    # быть видна и на уровне записи. Иначе UI, проверяющий одно поле polygon,
    # покажет заглушку при наличии карты — и это не упадёт, просто соврёт.
    if any(p.get("polygon") for p in it.get("phases", [])) and not it.get("polygon"):
        fail(f"{it['id']}: у фаз есть полигоны, а polygon записи null — "
             "UI покажет заглушку при наличии геометрии")


# --- отчёт ------------------------------------------------------------------

with_geom = sum(1 for i in items if i.get("polygon"))
with_src = sum(1 for i in items if i.get("phases"))
phases = sum(len(i.get("phases", [])) for i in items)

print(f"реестр: {len(items)} территорий, "
      f"{with_src} с картографией заказчика ({phases} фаз), "
      f"{with_geom} с построенным полигоном")

for n in notes:
    print(f"  · {n}")
for w in warnings:
    print(f"  ! {w}")
for e in errors:
    print(f"  ✗ {e}")

if errors:
    print(f"\ncheck_geo_index: {len(errors)} нарушений")
    sys.exit(1)
print("check_geo_index: чисто")
