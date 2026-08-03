"""Разовый посев реестра id уже занятыми идентификаторами.

Идемпотентен: `reserve()` не перетирает существующие записи, так что повторный
прогон безопасен. Источники — то, что уже наполнено и на что уже ссылаются:

  public/content/parties/_index.json   20 партий
  public/content/states/_index.json    24 гособразования (в т.ч. `komuch`,
                                       к нему привязана единственная готовая карта)
  public/expo/*-data.js                17 персон сцены

⚠️ Подборка персон принадлежит зоне `ui` и уже переезжала:
`people-data.js` → `persons-data.js`, причём старого файла больше нет.
Поэтому источник **необязательный**: перебираем оба имени, ни одного нет —
пропускаем с сообщением. Жёсткое чтение одного имени роняло весь посев
`FileNotFoundError`, и падало оно там, куда не смотрят: реестр уже наполнен,
семьдесят импортированных персон давно перекрыли семнадцать из подборки,
и запускают этот скрипт раз в полгода.

Запуск:  python3 scripts/import/seed_ids.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ids import IdRegistry  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


def _match_keys(item: dict) -> list:
    """Названия, по которым импорт узнает эту запись в docx заказчика.

    Заголовки в индексах собраны по-разному: где-то аббревиатура («РСФСР»),
    где-то полное имя, где-то две формы через « · ». Разбираем на части —
    в docx встретится любая из них.
    """
    out = []
    for field in ("title_ru", "abbr_ru"):
        val = item.get(field)
        if isinstance(val, str):
            out.extend(p.strip() for p in val.split("·"))
        elif isinstance(val, list):
            out.extend(val)
    return [x for x in (s.strip() for s in out if s) if x]


def main() -> int:
    reg = IdRegistry()
    added = 0

    for kind, rel in (("party", "public/content/parties/_index.json"),
                      ("state", "public/content/states/_index.json")):
        idx = json.loads((ROOT / rel).read_text("utf-8"))
        for it in idx.get("items", []):
            before = it["id"] in reg.bucket(kind)
            reg.reserve(kind, it["id"], it.get("title_ru", ""),
                        origin=Path(rel).parent.name + "/_index.json",
                        match=_match_keys(it))
            added += 0 if before else 1

    # Подборка персон сцены: { id: 'lenin', … ru: { sur: 'Ленин (Ульянов)' … } }
    # Файл принадлежит зоне ui и уже переезжал — перебираем оба имени.
    people_path = next(
        (p for p in (ROOT / "public/expo/people-data.js",
                     ROOT / "public/expo/persons-data.js") if p.exists()), None)
    if people_path is None:
        print("  подборки персон сцены нет (public/expo/*-data.js) — "
              "пропущено; id персон давно закреплены импортом")
    else:
        for chunk in re.split(r"\{\s*id:\s*'", people_path.read_text("utf-8"))[1:]:
            eid = chunk.split("'", 1)[0]
            if not re.fullmatch(r"[a-z0-9-]+", eid):
                continue
            m = re.search(r"ru:\s*\{[^}]*?sur:\s*'([^']*)'", chunk, re.S)
            before = eid in reg.bucket("person")
            reg.reserve("person", eid, m.group(1) if m else "",
                        origin="expo/" + people_path.name)
            added += 0 if before else 1

    changed = reg.save()
    total = sum(len(reg.bucket(k)) for k in ("person", "party", "state"))
    print("посеяно новых: %d; всего в реестре: %d; файл %s"
          % (added, total, "перезаписан" if changed else "без изменений"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
