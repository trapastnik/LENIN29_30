"""Runs → markdown со ссылками на другие справки.

Главная находка по материалам: граф связей уже размечен заказчиком. Жирный
курсив (`w:b` + `w:i` в одном `rPr`) = упоминание другой сущности —
4804 фрагмента, 1568 уникальных фраз в 205 файлах.

Ссылки кладутся markdown-ссылкой прямо в текст, а не отдельным массивом со
смещениями: смещения ломаются при первой же ручной правке в `.patch.json`.

    "…лидеры [эсеров](#/party/srs) А. Р. Гоц, [В. М. Зензинов](#/person/zenzinov)…"

Неразрезолвленное упоминание остаётся `***жирным курсивом***` без ссылки —
деградация визуально незаметна, раздел не ломается.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from docxlib import Para, Run, fold

ALIASES = Path(__file__).resolve().parents[2] / "content-src" / "_aliases.json"

_ESCAPE = re.compile(r"([\\*\[\]`])")
_WS = re.compile(r"^(\s*)(.*?)(\s*)$", re.S)


def escape_md(s: str) -> str:
    return _ESCAPE.sub(r"\\\1", s)


class Aliases:
    """Словарь «фраза → сущность». Ручной: русский склоняется.

    `большевиков` / `большевиками` / `большевики` — три формы одной сущности,
    морфологию тут не разводим. Сид генерируется автоматически (см.
    `seed_aliases.py`), дальше правится руками.
    """

    def __init__(self, path: Path = ALIASES):
        self.path = Path(path)
        self.map: Dict[str, str] = {}
        self.misses: Dict[str, int] = {}
        if self.path.exists():
            data = json.loads(self.path.read_text(encoding="utf-8"))
            for phrase, target in (data.get("map") or {}).items():
                if target:
                    self.map[fold(phrase)] = target

    def lookup(self, phrase: str) -> Optional[str]:
        key = fold(phrase)
        hit = self.map.get(key)
        if hit:
            return hit
        # хвостовая пунктуация и инициалы внутри фразы уже сняты fold();
        # пробуем без ведущих инициалов: «А. В. Колчака» → «колчака»
        stripped = re.sub(r"^(?:[А-ЯЁ]\.\s*)+", "", phrase).strip()
        if stripped and stripped != phrase:
            hit = self.map.get(fold(stripped))
            if hit:
                return hit
        if key:
            self.misses[key] = self.misses.get(key, 0) + 1
        return None

    @staticmethod
    def href(target: str) -> Optional[str]:
        """`party:bolsheviks` → `#/party/bolsheviks`."""
        if not target or ":" not in target:
            return None
        kind, eid = target.split(":", 1)
        if not kind or not eid:
            return None
        return "#/%s/%s" % (kind, eid)


_PUNCT_ONLY = re.compile(r"^[\W\d_]+$", re.UNICODE)


def _wrap(text: str, marker: str) -> str:
    """Обернуть, вынеся краевые пробелы наружу: `** текст **` в markdown не работает."""
    m = _WS.match(text)
    lead, core, tail = m.group(1), m.group(2), m.group(3)
    if not core:
        return text
    if _PUNCT_ONLY.match(core):
        # Заказчик регулярно оставляет ёлочку внутри выделения, а слово снаружи:
        # получается `*«*[меньшевикам](…)*»*` — курсив на одной кавычке.
        # Смысла в таком выделении нет, а в вёрстке это лишний шум.
        return text
    return "%s%s%s%s%s" % (lead, marker, core, marker, tail)


def render_run(run: Run, aliases: Optional[Aliases], self_target: Optional[str]) -> str:
    text = escape_md(run.text)
    if not run.text.strip():
        return run.text

    if run.url:
        return "[%s](%s)" % (text.strip(), run.url) + ("" if text == text.rstrip() else " ")

    if run.is_entity_ref:
        target = aliases.lookup(run.text) if aliases else None
        if target and target != self_target:
            href = Aliases.href(target)
            if href:
                m = _WS.match(text)
                return "%s[%s](%s)%s" % (m.group(1), m.group(2), href, m.group(3))
        # не разрезолвлено (или ссылка на самого себя) — оставляем акцент без ссылки
        return _wrap(text, "***")

    if run.bold:
        return _wrap(text, "**")
    if run.italic:
        return _wrap(text, "*")
    return text


def render(paras: Iterable[Para], aliases: Optional[Aliases] = None,
           self_target: Optional[str] = None) -> str:
    """Абзацы → markdown. Пустые абзацы схлопываются в разделитель."""
    out: List[str] = []
    for p in paras:
        chunk = "".join(render_run(r, aliases, self_target) for r in p.runs)
        chunk = chunk.replace("\xa0", " ").rstrip()
        out.append(chunk.strip())
    # убрать пустые абзацы по краям и схлопнуть подряд идущие
    cleaned: List[str] = []
    for chunk in out:
        if not chunk:
            continue
        cleaned.append(chunk)
    return "\n\n".join(cleaned)


def mentions(paras: Iterable[Para]) -> List[str]:
    """Все фразы, размеченные жирным курсивом, — сырьё для словаря алиасов."""
    found: List[str] = []
    for p in paras:
        for r in p.runs:
            if r.is_entity_ref:
                phrase = r.text.strip()
                if len(phrase) > 1:
                    found.append(phrase)
    return found


def related_from(paras: Iterable[Para], aliases: Aliases,
                 self_target: Optional[str] = None) -> Dict[str, List[str]]:
    """Разрезолвленные упоминания → блок `related` (persons/parties/states/events)."""
    buckets: Dict[str, List[str]] = {}
    plural = {"person": "persons", "party": "parties", "state": "states",
              "event": "events", "chronicle": "chronicle", "longread": "longreads"}
    for p in paras:
        for r in p.runs:
            if not r.is_entity_ref:
                continue
            target = aliases.lookup(r.text)
            if not target or target == self_target:
                continue
            kind, eid = target.split(":", 1)
            key = plural.get(kind, kind)
            lst = buckets.setdefault(key, [])
            if eid not in lst:
                lst.append(eid)
    return buckets
