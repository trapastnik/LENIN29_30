"""Весь текст docx одной строкой — для кросс-чека парсера с pandoc.

Прямой разбор `word/document.xml` мощнее pandoc (гиперлинки, подсветка,
объединённые ячейки), но именно поэтому его некому проверить. Сравнение
объёма извлечённого текста с независимым инструментом ловит класс ошибок
«обход дерева молча пропустил ветку».

Запуск:  python3 scripts/import/docx_text.py <файл.docx>
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from docxlib import Document  # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print("нужен путь к docx", file=sys.stderr)
        return 2
    sys.stdout.write(Document(sys.argv[1]).all_text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
