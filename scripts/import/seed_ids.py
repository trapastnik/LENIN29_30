"""Разовый посев реестра id уже занятыми идентификаторами.

Идемпотентен: `reserve()` не перетирает существующие записи, так что повторный
прогон безопасен. Источники — то, что уже наполнено и на что уже ссылаются:

  public/content/parties/_index.json   20 партий
  public/content/states/_index.json    24 гособразования (в т.ч. `komuch`,
                                       к нему привязана единственная готовая карта)
  public/expo/people-data.js           17 персон сцены

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

    # people-data.js: { id: 'lenin', … ru: { name: 'Владимир Ильич', sur: 'Ленин (Ульянов)' … } }
    people_js = (ROOT / "public/expo/people-data.js").read_text("utf-8")
    chunks = re.split(r"\{\s*id:\s*'", people_js)[1:]
    for chunk in chunks:
        eid = chunk.split("'", 1)[0]
        if not re.fullmatch(r"[a-z0-9-]+", eid):
            continue
        m = re.search(r"ru:\s*\{[^}]*?sur:\s*'([^']*)'", chunk, re.S)
        title = m.group(1) if m else ""
        before = eid in reg.bucket("person")
        reg.reserve("person", eid, title, origin="expo/people-data.js")
        added += 0 if before else 1

    changed = reg.save()
    total = sum(len(reg.bucket(k)) for k in ("person", "party", "state"))
    print("посеяно новых: %d; всего в реестре: %d; файл %s"
          % (added, total, "перезаписан" if changed else "без изменений"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
