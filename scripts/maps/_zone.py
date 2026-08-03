#!/usr/bin/env python3
"""Общие сторожа для скриптов зоны maps.

Разбор зоны content от 2026-08-04: класс дефектов «зелёное и неверное» —
результат выглядит правдоподобно, а работа не сделана. Не падает, не краснеет,
и потому не ловится нигде, кроме приёмки. Три сторожа против него.
"""

import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Что зона maps имеет право писать (CLAUDE.md §4). Пути от корня репозитория.
OWNED = (
    "public/content/maps/",
    "public/content/geo/",
    "public/prototypes/empire-1914/",
    "src/components/map-unit.js",
    "src/components/base-map.js",
    "src/utils/",
    "scripts/maps/",
    "demo.html",
    "demo-povolzhye.html",
    "docs/maps-pipeline.md",
    "docs/HANDOFF-empire-1914.md",
    "docs/map-unit-api.md",
)


def owned_write(path):
    """Проверка перед записью: путь принадлежит зоне maps.

    Разовой проверки «я пишу только своё» мало: допишет кто-нибудь каталог
    в список выходов, и прогон начнёт затирать файлы соседа. Сторож стоит
    в самой записи, поэтому переживёт правку списка.
    """
    rel = os.path.relpath(os.path.abspath(path), ROOT)
    if rel.startswith(".."):
        raise PermissionError(
            f"запись за пределы репозитория: {path}\n"
            f"CLAUDE.md §4 — зона maps пишет только в свои каталоги")
    if not any(rel == o.rstrip("/") or rel.startswith(o) for o in OWNED):
        raise PermissionError(
            f"запись вне зоны maps: {rel}\n"
            f"CLAUDE.md §4 — заявка оркестратору, а не правка. "
            f"Свои каталоги: {', '.join(OWNED[:4])}…")
    return path


def read_foreign(path, default=None):
    """Чтение ЧУЖОГО файла: есть — берём, нет — работаем без него.

    Оба бага зоны content были ровно этим: скрипт читал файл зоны ui,
    та его переименовала, имея полное право. Чужой файл в лоб не читается.
    """
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return f.read()


def fail_if_empty(count, what, hint=""):
    """Пустой вход — ошибка, а не «нечего делать».

    Зелёный гейт на пустом входе хуже пропущенного дефекта: он отключает
    все остальные проверки разом. У content валидатор написал «Ошибок нет»
    на исчезнувшем разделе и вернул 0.
    """
    if count:
        return
    print(f"пустой вход: {what} — 0. Это ошибка, а не «нечего делать»: "
          f"зелёный прогон на пустом входе отключает проверку целиком."
          + (f"\n{hint}" if hint else ""), file=sys.stderr)
    sys.exit(2)
