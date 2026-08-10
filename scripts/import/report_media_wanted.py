"""Список изображений, упомянутых в материалах заказчика, но не приложенных.

Источник приложения к письму музею (пункт 5). Собирается **из данных**,
а не из базы предупреждений — и это принципиально.

⚠️ **Базу предупреждений брать сюда нельзя.** Её ключи нормализованы:
`warnKey` в `validate-content.mjs` заменяет все числа на `#`, чтобы имя
предупреждения не уезжало при каждой правке текста. Для базы это верно,
для письма — губительно: «Бакинская операция_01/02/03» превращается
в три одинаковых «Бакинская операция_#», и музей не может понять, какие
именно файлы у него просят. Первая версия приложения так и уехала:
94 позиции из 94 без номеров, у 21 справки из 29 подписи стали
неразличимы.

Класс известный: **данные, годные для одной задачи, негодны для другой**,
и по виду это не отличить — список выглядит полным и осмысленным.

Запуск:  python3 scripts/import/report_media_wanted.py
Выход:   content-src/_media-wanted.md
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "public" / "content"
OUT = ROOT / "content-src" / "_media-wanted.md"

SECTIONS = (
    ("events", "События"),
    ("persons", "Личности"),
    ("parties", "Политические партии"),
    ("states", "Государственные образования"),
)


def main() -> int:
    blocks = []
    total = 0
    for folder, human in SECTIONS:
        rows = []
        for path in sorted((CONTENT / folder).glob("*.json")):
            name = path.name
            if name.startswith("_") or ".gen." in name or ".patch." in name:
                continue
            data = json.loads(path.read_text(encoding="utf-8"))
            wanted = []
            for m in (data.get("media") or []):
                # Слот наполнен, если есть что показать: файл, внешний
                # источник или карта. Иначе аннотация описывает изображение,
                # которого у нас нет.
                if m.get("src_file") or m.get("source_url") or m.get("map_id"):
                    continue
                label = (m.get("src_name") or m.get("caption_ru") or "").strip()
                wanted.append((m.get("n"), label))
            if wanted:
                rows.append((data.get("title_ru") or data["id"], data["id"], wanted))
                total += len(wanted)
        if rows:
            blocks.append((human, rows))

    if not total:
        # Пустой выход — сбой, а не «всё приложено»: список ведёт в письмо,
        # и молчаливый ноль означал бы, что мы ничего не просим.
        print("не найдено ни одной непоставленной аннотации — проверь данные,"
              " обычно их 94")
        return 1

    lines = [
        "# Изображения, упомянутые в материалах, но не приложенные",
        "",
        "Приложение к пункту 5 запроса. Позиций: %d, справок: %d."
        % (total, sum(len(rows) for _, rows in blocks)),
        "",
        "Подписи — **дословно ваши аннотации** из присланных материалов,",
        "вместе с номерами: по ним видно, какой именно файл отсутствует.",
        "В скобках — номер позиции внутри справки.",
        "",
        "⚠️ Собирается `scripts/import/report_media_wanted.py` из данных.",
        "Не из базы предупреждений: там номера заменены на `#`, и список",
        "выходит неразличимым.",
        "",
    ]
    for human, rows in blocks:
        lines.append("## %s" % human)
        lines.append("")
        for title, eid, wanted in rows:
            lines.append("**%s** — %d изобр.  \n`%s`" % (title, len(wanted), eid))
            for n, label in wanted:
                lines.append("- (%s) %s" % (n, label or "— подпись не указана"))
            lines.append("")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("→ %s" % OUT.relative_to(ROOT))
    print("позиций: %d, справок: %d" % (total, sum(len(r) for _, r in blocks)))
    for human, rows in blocks:
        print("  %-30s справок %2d, позиций %d"
              % (human, len(rows), sum(len(w) for _, _, w in rows)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
