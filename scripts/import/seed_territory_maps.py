"""Связать справку гособразования с собранной картой: `map_id` + `initial_layers`.

Седьмой случай одного класса за трое суток, и он стоил месяца молчания:
карты собраны, слои есть, полигоны налиты — а на экран не попадает ничего,
потому что недостающее звено лежит на СТЫКЕ зон и не принадлежит никому.
`maps` собирает карту и ссылок не заводит; `content` держит справку, где
`map_id` пуст, и пустой — валидное «карты пока нет». Обе стороны зелёные.

`state-card.js:229` читает `d.map_id`, `:231` — массив `d.initial_layers`.
Это и есть путь показа; без обоих полей карточка печатает «карта территории
не подготовлена» при готовой карте.

⚠️ **`initial-layers` ЗАМЕЩАЕТ умолчания карты, а не дополняет их**
(`docs/map-unit-api.md`). У карты `territories` в умолчаниях стоят разом
РСФСР, Колчак, Временное правительство и СССР — то есть карточка РСФСР
без явного списка покажет все четыре территории сразу. Поэтому для
`territories` список обязателен и включает `background`: не впишешь —
пропадёт подложка.

**Соответствие выводится из паспортов, а не пишется таблицей.** Две
стратегии, обе проверяются по факту, и ничего не пишется вслепую:

1. в карте есть слой ровно с именем `territory_id` → это она; слои
   `[background, <territory_id>]`;
2. иначе карта, чей id начинается с `territory_id` — так устроены две
   карты в своих проекциях (`allies-entente` → `allies-entente-presence`,
   `czechoslovak-corps` → `czechoslovak-corps-corridor`). У них своя
   система координат и нет подложки, а умолчания паспорта верны целиком,
   поэтому `initial_layers` не пишем вовсе — пусть решает владелец карты.

Не нашлось ни одной — запись пропускается с печатью. Догадка здесь хуже
пропуска: неверный слой покажет чужую территорию под верной подписью,
и посетитель этого не заметит (§13, «ложное хуже пустого»).

Запуск:  python3 scripts/import/seed_territory_maps.py
         python3 scripts/import/run_import.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "public" / "content"
MAPS = CONTENT / "maps"
STATES = CONTENT / "states"


def load_maps() -> dict:
    """Паспорта собранных карт: id → {layers, has_background}."""
    out = {}
    for path in sorted(MAPS.glob("*/map.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            print("  ! не читается %s: %s" % (path.name, exc))
            continue
        layers = [l.get("id") for l in (data.get("layers") or []) if l.get("id")]
        out[data.get("id") or path.parent.name] = {
            "layers": layers,
            "background": "background" in layers,
        }
    return out


def resolve(tid: str, maps: dict):
    """(map_id, initial_layers) или (None, причина)."""
    for map_id, m in sorted(maps.items()):
        if tid in m["layers"]:
            layers = (["background"] if m["background"] else []) + [tid]
            return map_id, layers, None
    for map_id in sorted(maps):
        if map_id.startswith(tid + "-"):
            # Своя проекция: умолчания паспорта верны целиком.
            return map_id, [], None
    return None, None, ("нет карты со слоем «%s» и нет карты с id, "
                        "начинающимся на «%s-»" % (tid, tid))


def patch(eid: str, changes: dict) -> bool:
    path = STATES / ("%s.patch.json" % eid)
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    if all(data.get(k) == v for k, v in changes.items()):
        return False
    data["schema"] = 1
    data.update(changes)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")
    return True


def main() -> int:
    maps = load_maps()
    if not maps:
        # Пустой вход — сбой, а не «карт нет». Переименуют каталог, и молчаливый
        # ноль уедет в сборку под видом честного результата.
        print("карт не найдено в %s — проверь каталог" % MAPS.relative_to(ROOT))
        return 1
    print("паспортов карт: %d" % len(maps))

    targets = []
    for path in sorted(STATES.glob("*.json")):
        name = path.name
        if name.startswith("_") or ".gen." in name or ".patch." in name:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("territory_id"):
            targets.append((data["id"], data["territory_id"]))

    written = skipped = 0
    for eid, tid in targets:
        map_id, layers, why = resolve(tid, maps)
        if not map_id:
            print("  — %-42s %s" % (eid, why))
            skipped += 1
            continue
        changes = {"map_id": map_id}
        if layers:
            changes["initial_layers"] = layers
        if patch(eid, changes):
            written += 1
        print("  %-42s → %-28s %s"
              % (eid, map_id, ",".join(layers) or "(умолчания паспорта)"))

    # Счётчик со знаменателем: «6» не отличает успех от половины работы.
    print("связано %d/%d справок с territory_id, патчей записано %d, "
          "пропущено %d" % (len(targets) - skipped, len(targets), written, skipped))
    print("дальше: python3 scripts/import/run_import.py")
    return 1 if skipped else 0


if __name__ == "__main__":
    raise SystemExit(main())
