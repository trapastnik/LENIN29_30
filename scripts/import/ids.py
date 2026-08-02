"""Реестр идентификаторов — `content-src/_ids.json`, append-only.

Импортёр НИКОГДА не переназначает существующий id. Если переназначит —
переимпорт осиротит уже наполненный контент, привязанные карты и ссылки
`related`, а карта Комуча привязана к id жёстко.

Связь «докс → id» держится в поле `src` (путь относительно `IN/new/МТК №29`).
Файл переименовали — правится `src` в реестре, id остаётся прежним.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, Optional

REGISTRY = Path(__file__).resolve().parents[2] / "content-src" / "_ids.json"

KINDS = ("person", "party", "state", "event", "chronicle", "longread")

# ГОСТ-подобная транслитерация под слаги. Порядок важен: многобуквенные первыми.
_TRANSLIT = [
    ("щ", "sch"), ("ш", "sh"), ("ч", "ch"), ("ц", "ts"), ("ж", "zh"),
    ("ю", "yu"), ("я", "ya"), ("ё", "e"), ("э", "e"), ("ы", "y"),
    ("х", "kh"), ("ъ", ""), ("ь", ""),
    ("а", "a"), ("б", "b"), ("в", "v"), ("г", "g"), ("д", "d"), ("е", "e"),
    ("з", "z"), ("и", "i"), ("й", "y"), ("к", "k"), ("л", "l"), ("м", "m"),
    ("н", "n"), ("о", "o"), ("п", "p"), ("р", "r"), ("с", "s"), ("т", "t"),
    ("у", "u"), ("ф", "f"),
]


def _norm_match(s: str) -> str:
    """Ключ сопоставления названий: ё→е, без кавычек, скобок и лишних пробелов.

    Заголовки индексов часто собраны через « · » («Временное Всероссийское
    правительство · Уфимская директория») — разбираем такие на части в местах
    вызова, здесь только нормализация одной строки.
    """
    s = (s or "").lower().replace("ё", "е").replace("\xa0", " ")
    s = re.sub(r"[«»\"'()]", " ", s)
    s = re.sub(r"[\s\-–—]+", " ", s)
    return s.strip(" .,")


def _strip_parens(s: str) -> str:
    """Снять уточнения в скобках, включая вложенные.

    «Туркестанская Советская Федеративная Республика (с сентября 1920 г. –
    Туркестанская (автономная) Социалистическая Советская Республика)» —
    скобки вложены, и один проход `\\([^)]*\\)` рвёт строку по первой же
    закрывающей, оставляя хвост от внешней пары.
    """
    prev = None
    out = s or ""
    while prev != out:
        prev = out
        out = re.sub(r"\([^()]*\)", " ", out)
    return out


def slugify(text: str, maxlen: int = 40) -> str:
    s = (text or "").lower().replace("ё", "е")
    s = s.replace(" ", " ")
    for cyr, lat in _TRANSLIT:
        s = s.replace(cyr, lat)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    # Ведущий номер справки — метаданные (`src.no`), а не часть имени:
    # «63 Кронштадтское восстание» → `kronshtadtskoe-vosstanie`, не `63-…`.
    s = re.sub(r"^\d+-", "", s)
    if len(s) > maxlen:
        s = s[:maxlen].rstrip("-")
    return s or "item"


class IdRegistry:
    """append-only реестр. Пишется только через `save()` после `commit`."""

    def __init__(self, path: Path = REGISTRY):
        self.path = Path(path)
        if self.path.exists():
            self.data = json.loads(self.path.read_text(encoding="utf-8"))
        else:
            self.data = {"schema": 1, "kinds": {k: {} for k in KINDS}}
        self.data.setdefault("kinds", {})
        for k in KINDS:
            self.data["kinds"].setdefault(k, {})
        self.dirty = False
        self.notes = []  # предупреждения для отчёта импорта

    # ------------------------------------------------------------ чтение

    def bucket(self, kind: str) -> Dict[str, dict]:
        if kind not in KINDS:
            raise KeyError("неизвестный вид сущности: %s" % kind)
        return self.data["kinds"][kind]

    def by_src(self, kind: str, src: str) -> Optional[str]:
        for eid, rec in self.bucket(kind).items():
            if rec.get("src") == src:
                return eid
        return None

    def all_ids(self) -> Dict[str, str]:
        """id → kind, по всем видам. Для валидатора и разрешения ссылок."""
        out = {}
        for kind in KINDS:
            for eid in self.bucket(kind):
                out[eid] = kind
        return out

    # ------------------------------------------------------------ запись

    def resolve(self, kind: str, src: str, title_ru: str,
                slug_hint: Optional[str] = None,
                match_on: Optional[list] = None) -> str:
        """Найти или выдать id. Существующий id никогда не меняется.

        Порядок поиска — от надёжного к рискованному:
          1. по `src` — файл уже импортировали, id закреплён;
          2. по названию/аббревиатуре против записей БЕЗ `src` — это наследие
             индексов M0 (`bolsheviks`, `srs`, `rsfsr`, `komuch`), где id
             сложился исторически и слагом из заголовка не воспроизводится
             («Большевики» → `bolsheviki`, а занят `bolsheviks`);
          3. по слагу — то же наследие, но там, где слаг совпадает (`lenin`);
          4. новый id.
        Привязки 2 и 3 уходят в отчёт: их обязан проверить человек.
        """
        bucket = self.bucket(kind)

        eid = self.by_src(kind, src)
        if eid:
            # заголовок мог поправиться — это не повод трогать id
            if title_ru and bucket[eid].get("title_ru") != title_ru:
                bucket[eid]["title_ru"] = title_ru
                self.dirty = True
            return eid

        eid = self._match_free(kind, src, title_ru, match_on)
        if eid:
            return eid

        base = slugify(slug_hint or title_ru)
        taken = set(self.all_ids())

        if base in bucket and not bucket[base].get("src"):
            bucket[base]["src"] = src
            if title_ru:
                bucket[base].setdefault("title_ru", title_ru)
            self.dirty = True
            self.notes.append(
                "привязка по слагу: %s/%s ← %s (проверить глазами)" % (kind, base, src))
            return base

        eid = base
        n = 2
        while eid in taken:
            eid = "%s-%d" % (base, n)
            n += 1
        if eid != base:
            self.notes.append(
                "слаг занят, выдан %s/%s для %s" % (kind, eid, src))
        bucket[eid] = {"title_ru": title_ru, "src": src}
        self.dirty = True
        return eid

    def _match_free(self, kind: str, src: str, title_ru: str,
                    match_on: Optional[list]) -> Optional[str]:
        """Привязать по названию/аббревиатуре к свободной записи наследия."""
        raw = [x for x in ([title_ru] + list(match_on or [])) if x]
        # Уточнение в скобках — не часть имени: «Правительство Юга России
        # (до 6 августа 1920 г. – Southern Russia Government)» и
        # «Правительство Юга России» — одна и та же единица.
        raw += [_strip_parens(x) for x in list(raw)]
        cands = [_norm_match(x) for x in raw]
        cands = [c for c in cands if c]
        if not cands:
            return None
        bucket = self.bucket(kind)
        for eid, rec in bucket.items():
            if rec.get("src"):
                continue
            known = {_norm_match(x) for x in rec.get("match", []) if x}
            known.add(_norm_match(rec.get("title_ru") or ""))
            known.discard("")
            if known & set(cands):
                rec["src"] = src
                if title_ru:
                    rec["title_ru"] = title_ru
                self.dirty = True
                self.notes.append(
                    "привязка по названию: %s/%s ← %s (проверить глазами)"
                    % (kind, eid, src))
                return eid
        return None

    def reserve(self, kind: str, eid: str, title_ru: str = "",
                src: Optional[str] = None, origin: str = "",
                match: Optional[list] = None) -> str:
        """Занести заранее известный id (наследие индексов). Не перетирает."""
        bucket = self.bucket(kind)
        extra = [x for x in (match or []) if x]
        if eid in bucket:
            rec = bucket[eid]
            if src and not rec.get("src"):
                rec["src"] = src
                self.dirty = True
            if title_ru and not rec.get("title_ru"):
                rec["title_ru"] = title_ru
                self.dirty = True
            if extra:
                have = rec.setdefault("match", [])
                for x in extra:
                    if x not in have:
                        have.append(x)
                        self.dirty = True
            return eid
        rec = {"title_ru": title_ru}
        if extra:
            rec["match"] = extra
        if src:
            rec["src"] = src
        if origin:
            rec["origin"] = origin
        bucket[eid] = rec
        self.dirty = True
        return eid

    def save(self) -> bool:
        if not self.dirty:
            return False
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = dict(self.data)
        payload["kinds"] = {k: dict(sorted(self.data["kinds"][k].items()))
                            for k in KINDS}
        self.path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8")
        self.dirty = False
        return True
