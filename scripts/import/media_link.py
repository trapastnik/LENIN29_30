"""Имя картинки из docx → файл на диске.

Заказчик пишет имя в тексте ячейки, а на диске оно живёт с другими
разделителями и регистром:

    docx  `01 РСФСР_01`        диск  `01 РСФСР 01.jpg`
    docx  `Эсеры_01.jpg`       диск  `ЭСЕРЫ_01.jpg`
    docx  `ЛЕНИН В.И._03.jpg`  диск  `ЛЕНИН В.И._03.JpG`

Плюс одна аннотация иногда покрывает несколько файлов:
`01 РСФСР_05` → `01 РСФСР 05 1.jpg` + `01 РСФСР 05 2.jpg` (две стороны купюры).

Правило скоупа: **единица справки = docx-файл, а не папка**, медиа-скоуп —
папка этого docx. Так покрываются и плоские группы («Красные»), и подпапки
на единицу («Белые»).

Размеры читаются из заголовков файлов без внешних зависимостей: у 44 % фонда
длинная сторона < 1600 px, и лайтбокс не должен апскейлить — ему нужен натив.
"""

from __future__ import annotations

import re
import struct
from pathlib import Path
from typing import Dict, List, Optional, Tuple

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".gif", ".svg", ".webp", ".bmp"}
VIDEO_EXT = {".mp4", ".webm", ".mov"}

_SEP = re.compile(r"[ _\-—–.]+")
_EXT_WORD = re.compile(r"\s(jpe?g|png|tiff?|gif|svg|webp|bmp|mp4|webm|mov)$")
# расширение, приклеенное к номеру без разделителя: `КАППЕЛЬ В.О._01jpg`
_EXT_GLUED = re.compile(r"(\d)(jpe?g|png|tiff?|gif|svg|webp|bmp|mp4|webm|mov)$")


def normkey(name: str) -> str:
    """Ключ сопоставления: регистр, разделители и расширение не значимы.

    Расширение срезается ПОСЛЕ схлопывания разделителей, а не по точке в конце:
    заказчик пишет и `_01.jpg.` (точка после расширения), и `_04 jpg`
    (через пробел), и `А.П. _05.jpg.` — по одной лишь `\\.jpg$` такие имена
    не сходятся с файлом на диске, хотя файл лежит рядом.
    """
    s = (name or "").strip().lower().replace("ё", "е").replace("\xa0", " ")
    s = _SEP.sub(" ", s).strip()
    while True:
        cut = _EXT_WORD.sub("", s)
        cut = _EXT_GLUED.sub(r"\1", cut).strip()
        if cut == s:
            return s
        s = cut


_TAIL_NUM = re.compile(r"^(.*?)\s(\d{1,3})$")
# хвост многочастной аннотации: « 1», «а», « 2», «б»
_PART_TAIL = re.compile(r"\s?(\d{1,2}|[a-zа-я])")
# номер со слипшейся буквенной частью: `03а`
_NUM_LETTER = re.compile(r"^(\d{1,3})([a-zа-я])$")


def parse_key(key: str, prefix: Optional[str] = None):
    """Ключ → (основа, номер аннотации, номер части).

    Заказчик и файловая система расходятся по всем трём кускам сразу:

        подпись `42 Эстонская Республика_02`
        диск    `42 Эстонская 02 1.jpg`, `42 Эстонская 02 2.jpg`

    Здесь `02` — номер аннотации, а `1`/`2` — части одной иллюстрации
    (две стороны купюры, разворот). Наивный «последний числовой токен —
    это номер» принимает часть за номер и разводит пару по разным
    аннотациям, поэтому номер и часть разбираются раздельно.
    """
    toks = [t for t in (key or "").split() if t]
    if toks and (toks[0] == prefix or (prefix is None and re.fullmatch(r"\d{1,3}", toks[0]))):
        toks = toks[1:]

    part = None
    num = None

    if toks:
        m = _NUM_LETTER.match(toks[-1])
        if m:
            num, part = m.group(1).lstrip("0") or "0", m.group(2)
            toks = toks[:-1]
    if num is None and len(toks) >= 2 and \
            re.fullmatch(r"\d{1,3}", toks[-1]) and re.fullmatch(r"\d{1,3}", toks[-2]):
        part = toks[-1]
        num = toks[-2].lstrip("0") or "0"
        toks = toks[:-2]
    elif num is None and len(toks) >= 2 and \
            re.fullmatch(r"[a-zа-я]", toks[-1]) and re.fullmatch(r"\d{1,3}", toks[-2]):
        part = toks[-1]
        num = toks[-2].lstrip("0") or "0"
        toks = toks[:-2]
    elif num is None and toks and re.fullmatch(r"\d{1,3}", toks[-1]):
        num = toks[-1].lstrip("0") or "0"
        toks = toks[:-1]

    return tuple(toks), num, part


def _stem_compatible(a, b) -> bool:
    """Одна основа — начало другой (по токенам), либо расходятся на опечатку.

    Подпись бывает полнее имени файла (`эстонская республика` ↔ `эстонская`)
    и наоборот. Скоуп уже сужен папкой и номером справки, так что чужая
    картинка сюда не заедет.
    """
    if not a or not b:
        return False
    n = min(len(a), len(b))
    if a[:n] == b[:n]:
        return True
    if len(a) == len(b):
        diff = [(x, y) for x, y in zip(a, b) if x != y]
        if len(diff) == 1:
            x, y = diff[0]
            # опечатка в инициале: `ТРОЦКИЙ Л.Б._01` при справке `ТРОЦКИЙ Л.Д.`
            if len(x) <= 2 and len(y) <= 2:
                return True
            if _one_edit_apart(x, y):
                return True
    return False


class MediaScope:
    """Индекс файлов одной папки-скоупа.

    `prefix` — номер справки («01», «34»). В группах вроде «Территория/Красные»
    в одной папке лежат 21 единица, и без отсечки по номеру нечёткое
    сопоставление начнёт таскать картинки соседей.
    """

    def __init__(self, folder: Path, prefix: Optional[str] = None):
        self.folder = Path(folder)
        self.prefix = (prefix or "").strip() or None
        self.by_key: Dict[str, List[Path]] = {}
        self.used: set = set()
        self.fuzzy: List[str] = []
        self.pinned = False
        if not self.folder.is_dir():
            return
        # Скоуп «пришпилен», если все отобранные файлы заведомо принадлежат
        # одной справке: либо отсечка по номеру уже сделала это, либо в папке
        # ровно один docx. Только тогда допустим последний рубеж сопоставления
        # по одному номеру аннотации.
        self.pinned = bool(self.prefix) or \
            len([f for f in self.folder.glob("*.docx") if not f.name.startswith("~")]) == 1
        for f in sorted(self.folder.iterdir()):
            if not f.is_file() or f.name.startswith("."):
                continue
            if f.suffix.lower() not in IMAGE_EXT | VIDEO_EXT:
                continue
            if self.prefix and not self._in_prefix(f.name):
                continue
            self.by_key.setdefault(normkey(f.name), []).append(f)

    def _in_prefix(self, name: str) -> bool:
        key = normkey(name)
        return key == self.prefix or key.startswith(self.prefix + " ")

    @property
    def files(self) -> List[Path]:
        out = []
        for lst in self.by_key.values():
            out.extend(lst)
        return sorted(out)

    def resolve(self, name: str, mark: bool = True) -> List[Path]:
        """Найти файл(ы) по имени из docx. Пустой список — не нашлось.

        `mark=False` — зондирование: определяя, медийная ли это строка,
        распознаватель спрашивает скоуп «а есть ли такой файл?», и такой
        вопрос не должен считаться расходом файла. Иначе к моменту реальной
        выборки занятым числится всё подряд.
        """
        key = normkey(name)
        if not key:
            return []
        if key in self.by_key:
            hits = list(self.by_key[key])
        else:
            # Многочастная аннотация — одна подпись на несколько файлов:
            #   `01 рсфср 05`  → `01 рсфср 05 1`, `… 05 2`   (две стороны купюры)
            #   `петлюра с в 03` → `… 03а`, `… 03б`          (буквенные части)
            hits = []
            for k, lst in self.by_key.items():
                if not k.startswith(key):
                    continue
                if _PART_TAIL.fullmatch(k[len(key):]):
                    hits.extend(lst)
            hits.sort()
        if not hits:
            hits = self._fuzzy(key)
        if mark:
            for h in hits:
                self.used.add(h)
        return hits

    def _fuzzy(self, key: str) -> List[Path]:
        """Подпись и имя файла разошлись — сводим по разобранным кускам.

        Совпасть обязан номер аннотации, а основы — быть совместимыми
        (одна начало другой либо опечатка в один знак). Скоуп уже сужен
        папкой справки и префиксом номера, поэтому чужая картинка сюда
        не заедет даже при мягком сравнении основ.
        """
        stem, num, _part = parse_key(key, self.prefix)
        if num is None:
            return []
        best: List[Path] = []
        for k, lst in self.by_key.items():
            kstem, knum, _kpart = parse_key(k, self.prefix)
            if knum != num:
                continue
            if _stem_compatible(kstem, stem):
                best.extend(lst)
        if not best and self.pinned:
            # Основа разошлась целиком — аббревиатура вместо названия
            # (`31 ПЮР 01` при подписи «31 Правительство Юга России_01»)
            # или перестановка букв («Паолей» / «Поалей»). Скоуп пришпилен
            # к одной справке, поэтому номера аннотации достаточно.
            for k, lst in self.by_key.items():
                kstem, knum, _kpart = parse_key(k, self.prefix)
                if knum != num or not kstem:
                    continue
                # Занятый файл не переиспользуем. Подпись «Алаш _01» у
                # Букейханова относится к снимку, которого в поставке нет,
                # и по одному номеру утащила бы портрет из первой позиции —
                # на витрине это выглядит как одно фото дважды.
                if any(p in self.used for p in lst):
                    continue
                best.extend(lst)
        if best and key not in self.fuzzy:
            self.fuzzy.append(key)
        return sorted(best)

    def unused(self) -> List[Path]:
        return [f for f in self.files if f not in self.used]


def _one_edit_apart(a: str, b: str) -> bool:
    """Строки различаются не больше чем на одну замену/вставку/удаление.

    Достаточно для опечаток в инициалах; полноценный Левенштейн тут не нужен
    и вреден — он начал бы склеивать разные фамилии.
    """
    if a == b:
        return False
    la, lb = len(a), len(b)
    if abs(la - lb) > 1 or min(la, lb) < 4:
        return False
    if la == lb:
        return sum(1 for x, y in zip(a, b) if x != y) == 1
    if la > lb:
        a, b, la, lb = b, a, lb, la
    i = 0
    while i < la and a[i] == b[i]:
        i += 1
    return a[i:] == b[i + 1:]


# ------------------------------------------------------------- размеры


def image_size(path: Path) -> Optional[Tuple[int, int]]:
    """(ширина, высота) из заголовка файла. None — формат не разобран."""
    suf = path.suffix.lower()
    try:
        with open(path, "rb") as fh:
            head = fh.read(32)
            if suf == ".png" or head[:8] == b"\x89PNG\r\n\x1a\n":
                fh.seek(16)
                w, h = struct.unpack(">II", fh.read(8))
                return int(w), int(h)
            if suf in (".jpg", ".jpeg") or head[:2] == b"\xff\xd8":
                return _jpeg_size(fh)
            if suf in (".tif", ".tiff") or head[:2] in (b"II", b"MM"):
                return _tiff_size(fh)
            if suf == ".gif" or head[:3] == b"GIF":
                fh.seek(6)
                w, h = struct.unpack("<HH", fh.read(4))
                return int(w), int(h)
            if suf == ".webp" or head[:4] == b"RIFF":
                return _webp_size(fh)
            if suf == ".svg":
                return _svg_size(path)
    except Exception:
        return None
    return None


def _jpeg_size(fh) -> Optional[Tuple[int, int]]:
    fh.seek(2)
    while True:
        b = fh.read(1)
        if not b:
            return None
        if b != b"\xff":
            continue
        marker = fh.read(1)
        while marker == b"\xff":
            marker = fh.read(1)
        if not marker:
            return None
        m = marker[0]
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            continue
        ln = fh.read(2)
        if len(ln) < 2:
            return None
        length = struct.unpack(">H", ln)[0]
        # SOF0..SOF15, кроме DHT(C4)/JPG(C8)/DAC(CC)
        if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
            data = fh.read(5)
            if len(data) < 5:
                return None
            h, w = struct.unpack(">HH", data[1:5])
            return int(w), int(h)
        fh.seek(length - 2, 1)


def _tiff_size(fh) -> Optional[Tuple[int, int]]:
    fh.seek(0)
    bom = fh.read(2)
    endian = "<" if bom == b"II" else ">"
    fh.seek(4)
    offset = struct.unpack(endian + "I", fh.read(4))[0]
    fh.seek(offset)
    count = struct.unpack(endian + "H", fh.read(2))[0]
    w = h = None
    for _ in range(count):
        entry = fh.read(12)
        if len(entry) < 12:
            break
        tag, typ = struct.unpack(endian + "HH", entry[:4])
        if tag in (256, 257):
            if typ == 3:
                val = struct.unpack(endian + "H", entry[8:10])[0]
            else:
                val = struct.unpack(endian + "I", entry[8:12])[0]
            if tag == 256:
                w = int(val)
            else:
                h = int(val)
    if w and h:
        return w, h
    return None


def _webp_size(fh) -> Optional[Tuple[int, int]]:
    fh.seek(12)
    chunk = fh.read(4)
    if chunk == b"VP8X":
        fh.seek(24)
        d = fh.read(6)
        w = int.from_bytes(d[0:3], "little") + 1
        h = int.from_bytes(d[3:6], "little") + 1
        return w, h
    if chunk == b"VP8 ":
        fh.seek(26)
        w, h = struct.unpack("<HH", fh.read(4))
        return w & 0x3FFF, h & 0x3FFF
    if chunk == b"VP8L":
        fh.seek(21)
        b = fh.read(4)
        n = int.from_bytes(b, "little")
        return (n & 0x3FFF) + 1, ((n >> 14) & 0x3FFF) + 1
    return None


def _svg_size(path: Path) -> Optional[Tuple[int, int]]:
    head = path.read_text(encoding="utf-8", errors="ignore")[:4000]
    m = re.search(r'viewBox\s*=\s*"[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"', head)
    if m:
        return int(float(m.group(1))), int(float(m.group(2)))
    mw = re.search(r'\swidth\s*=\s*"([\d.]+)', head)
    mh = re.search(r'\sheight\s*=\s*"([\d.]+)', head)
    if mw and mh:
        return int(float(mw.group(1))), int(float(mh.group(1)))
    return None
