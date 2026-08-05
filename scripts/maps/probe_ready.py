#!/usr/bin/env python3
"""Проба готовности `<map-unit>`: печатает размер ДО и ПОСЛЕ reset().

ЗАЧЕМ. Видимый размер карте даёт `panZoom.reset()`, и зовётся он только
из `ResizeObserver`. Замер, снятый раньше, показывает карту в натуральную
величину `viewBox` при масштабе 1 — и это врёт в обе стороны: у `komuch`
получается 1500×1000, то есть больше окна, у схемы Симбирска 31×33.
Ни одно не похоже на «ещё не готово», оба похожи на дефект вёрстки.

Зона `simbirsk` на этом едва не отправила ложную регрессию, а я на своём
первом прогоне НЕ ПОЙМАЛ окно вовсе: опрос каждые 4 мс пришёл уже после
доставки наблюдателя и показал готовый трансформ, то есть «проблемы нет».
Поэтому проба ловит окно мутационным наблюдателем: его микрозадача идёт
после синхронного блока `load()` и до первой доставки `ResizeObserver`.

ЧТО ДЕЛАЕТ ЭТА ПРОБА, ЧЕГО НЕ ДЕЛАЕТ ГЕЙТ. Она не проверяет карту —
она показывает, ЧТО УВИДИТ проверяющий, пришедший рано. Держится в зоне
как контрольный пример для любого нового обходчика страниц: тач-цели,
контраст, размеры.

Проба, не поймавшая окно, ОБЯЗАНА сказать это и вернуть 1: одинаковые
«рано» и «поздно» читаются как «всё в порядке», а означают, что мерить
она не умеет.

  python3 scripts/maps/probe_ready.py            # карта komuch
  python3 scripts/maps/probe_ready.py --map-id simbirsk-july-1918
  python3 scripts/maps/probe_ready.py --self-test   # обязана вернуть 1

Флаг `--self-test` снимает «рано» заведомо поздно и тем показывает красное
на требование. Правило зоны: проверка, которую ни разу не видели красной,
ничем не отличается от `exit 0`. Здесь это не формальность — мой первый
прогон пропустил окно и напечатал успокоительный результат, и красное
на требование ровно от этого и страхует.
"""

import argparse
import html
import os
import re
import socket
import subprocess
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _zone import fail_if_empty  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DIST = os.path.join(ROOT, "dist")
CHROME = ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium")

PAGE = """<!doctype html><meta charset="utf-8"><title>probe</title>
<script src="base.js"></script>
<style>html,body{margin:0}#w{width:900px;height:700px}map-unit{width:100%;height:100%}</style>
<div id="w"><map-unit map-id="__MAP__"></map-unit></div>
<pre id="out"></pre>
<script type="module" src="./__ASSET__"></script>
<script type="module">
const el = document.querySelector('map-unit');
const out = [];
const dump = () => document.getElementById('out').textContent = out.join('\\n');
window.onerror = (e) => { out.push('ОШИБКА: ' + e); dump(); };
const snap = (tag) => {
  const sr = el.shadowRoot;
  if (!sr) { out.push(tag + '|нет shadowRoot|-'); return dump(); }
  const svg = sr.querySelector('svg'), box = sr.querySelector('#container');
  const r = svg && svg.getBoundingClientRect();
  const tr = box ? (getComputedStyle(box).transform || 'none') : 'нет узла';
  out.push(`${tag}|${svg ? r.width.toFixed(1) + 'x' + r.height.toFixed(1) : 'нет svg'}|${tr}`);
  dump();
};
// Ждём теневое дерево, затем ловим вставку svg мутационным наблюдателем:
// таймаут здесь не годится — на быстрой машине он приходит после reset().
const wait = setInterval(() => {
  const box = el.shadowRoot && el.shadowRoot.querySelector('#container');
  if (!box) return;
  clearInterval(wait);
  new MutationObserver((m, o) => {
    if (!box.querySelector('svg')) return;
    o.disconnect();
    if (!__LATE__) snap('РАНО');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (__LATE__) snap('РАНО');
      snap('ПОЗДНО');
    }));
  }).observe(box, { childList: true });
}, 2);
</script>
"""


def find_chrome():
    for p in CHROME:
        if os.path.exists(p):
            return p
    raise SystemExit("не найден Chrome — проба не может быть выполнена")


def find_asset():
    """Имя собранного чанка компонента берём из demo.html, а не гадаем:
    хеш в имени меняется на каждой сборке."""
    demo = os.path.join(DIST, "demo.html")
    if not os.path.exists(demo):
        raise SystemExit("нет dist/demo.html — сначала `npm run build`")
    m = re.search(r'src="\./(assets/map-unit-[^"]+\.js)"',
                  open(demo, encoding="utf-8").read())
    if not m:
        raise SystemExit("в dist/demo.html не найден чанк map-unit")
    return m.group(1)


class Quiet(SimpleHTTPRequestHandler):
    """Лог доступа гасится подклассом, а не присваиванием в partial:
    там атрибут ложится на сам partial и обработчик его не видит —
    прогон печатал шесть строк журнала посреди отчёта."""

    def log_message(self, *a):
        pass


def serve(port):
    handler = partial(Quiet, directory=DIST)
    srv = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map-id", default="komuch")
    ap.add_argument("--self-test", action="store_true",
                    help="снять РАНО заведомо поздно: проба обязана вернуть 1")
    args = ap.parse_args()

    chrome = find_chrome()
    asset = find_asset()
    fail_if_empty(len(os.listdir(DIST)), "файлов в dist", "прогони `npm run build`")

    # Проба живёт в dist: чанк компонента подключается относительным путём,
    # то есть страница обязана быть того же происхождения. dist — артефакт
    # сборки, файл убирается после прогона.
    probe = os.path.join(DIST, "_probe-ready.html")
    with open(probe, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("__MAP__", args.map_id)
                .replace("__ASSET__", asset)
                .replace("__LATE__", "true" if args.self_test else "false"))

    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    srv = serve(port)
    try:
        dom = subprocess.run(
            [chrome, "--headless", "--disable-gpu", "--hide-scrollbars",
             "--force-device-scale-factor=1", "--window-size=1400,1000",
             "--virtual-time-budget=8000", "--dump-dom",
             f"http://127.0.0.1:{port}/_probe-ready.html"],
            capture_output=True, text=True, timeout=90).stdout
    finally:
        srv.shutdown()
        os.remove(probe)

    m = re.search(r'<pre id="out">(.*?)</pre>', dom, re.S)
    rows = [r.split("|") for r in html.unescape(m.group(1)).strip().splitlines()] if m else []
    fail_if_empty(len(rows), "замеров пробы",
                  "страница не отработала — смотри ОШИБКА в выводе Chrome")

    print(f"проба готовности <map-unit>: карта {args.map_id}, "
          f"окно 1400×1000, DPR 1, headless, собранный dist"
          + ("   [--self-test: РАНО снимается поздно, ждём код 1]"
             if args.self_test else ""))
    for row in rows:
        if len(row) != 3:
            print(f"   {row}")
            continue
        tag, size, tr = row
        print(f"   {tag:8} svg {size:>13}   transform {tr[:34]}")

    got = {r[0]: (r[1], r[2]) for r in rows if len(r) == 3}
    if "РАНО" not in got or "ПОЗДНО" not in got:
        print("проба не сняла оба состояния — мерить она не умеет")
        return 1
    if got["РАНО"] == got["ПОЗДНО"]:
        # Ровно то, что случилось у меня на первом прогоне. Молча вернуть 0
        # здесь значит соврать: одинаковые числа читаются как «окна нет».
        print("окно НЕ ПОЙМАНО: рано и поздно совпали. Это не значит, что "
              "окна нет — значит, наблюдатель пришёл после reset()")
        return 1
    print(f"окно поймано: до reset() карта {got['РАНО'][0]} при transform "
          f"{got['РАНО'][1]}, после — {got['ПОЗДНО'][0]}")
    print("   признак готовности для обходчиков: transform у #container != none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
