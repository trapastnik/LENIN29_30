#!/usr/bin/env python3
"""Convert hybrid SVG into map-unit-compatible layers.svg.

Key transformations:
- Rename <g id="..."> to match map.json contract (arrows_red/blue/green/pink, front_*, etc.)
- Split the monolithic `front-lines` group into three date-based groups:
    front_aug1918  — cls-7 (black solid front), cls-14 / cls-15 / cls-16 (blue companion lines)
    front_nov1918  — cls-10 (thin green line), cls-13 (black dashed), cls-18 (pink front)
    front_feb1919  — cls-11 (red compound dashed), cls-21 / cls-22 (final dark-blue)
- Keep the brand-incompatible decorative-frame group present but with id="frame_decor".
- Drop the legend-internal demo arrowheads from the consolidated arrow groups
  (legend stays as its own group).
"""
import re
from pathlib import Path

SRC = Path("/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.hybrid.svg")
DST = Path("/Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29/public/content/maps/povolzhye-1918-1919/layers.svg")

src = SRC.read_text()

# ---- Class → new layer id ----------------------------------------------------
class_layer = {
    # background paper
    "cls-0":  "background_paper",
    # territory polygons
    "cls-1":  "territories",
    "cls-2":  "territories",
    # admin borders
    "cls-3":  "admin_borders",
    "cls-4":  "admin_borders",
    "cls-5":  "admin_borders",
    # rivers
    "cls-6":  "rivers",
    # FRONT LINES — split by date
    "cls-7":  "front_aug1918",      # black solid line
    "cls-14": "front_aug1918",      # light blue companion
    "cls-15": "front_aug1918",      # dark blue solid (legend demo also)
    "cls-16": "front_aug1918",      # dark blue arrowhead
    "cls-10": "front_nov1918",      # thin green line of front (NOT siberian arrows)
    "cls-13": "front_nov1918",      # black dashed
    "cls-18": "front_nov1918",      # pink front
    "cls-11": "front_feb1919",      # red compound dashed
    "cls-21": "front_feb1919",      # final dark blue
    "cls-22": "front_feb1919",      # dark blue arrowhead
    # STRIKES
    "cls-9":  "arrows_red",
    "cls-23": "arrows_red",
    "cls-26": "arrows_red",
    "cls-28": "arrows_red",  # tick marks left as arrows_red
    "cls-8":  "arrows_blue",
    "cls-12": "arrows_blue",
    "cls-24": "arrows_blue",
    "cls-27": "arrows_blue",
    "cls-25": "arrows_green",       # siberian arrows
    "cls-19": "arrows_pink",        # izhevsk pink
    "cls-20": "arrows_pink",        # izhevsk arrowhead
    # text
    "cls-30": "labels_rivers",       # blue text (rivers + some army labels — distinguish later)
    "cls-31": "legend",
    "cls-32": "labels_armies",
    "cls-33": "labels_cities",       # default; title detected by content
    "cls-34": "legend",
    # decorative frame
    "cls-17": "frame_decor",
    # map frame
    "cls-29": "map_frame",
}

# Layer order (rendering bottom-up)
LAYER_ORDER = [
    "background_paper",
    "frame_decor",
    "territories",
    "admin_borders",
    "rivers",
    "front_aug1918",
    "front_nov1918",
    "front_feb1919",
    "arrows_red",
    "arrows_blue",
    "arrows_green",
    "arrows_pink",
    "city_dots",
    "labels_rivers",
    "labels_cities",
    "labels_armies",
    "title",
    "map_frame",
    "legend",
]

RIVER_WORDS = {"Волга", "Чусовая", "Тура", "Урал", "Белая", "Кама", "Вятка", "Ура", "Уфа"}

def first_x(line):
    m = re.search(r'\bx="(-?\d+(?:\.\d+)?)"', line)
    if m: return float(m.group(1))
    m = re.search(r'\bcx="(-?\d+(?:\.\d+)?)"', line)
    if m: return float(m.group(1))
    m = re.search(r'transform="translate\((-?\d+(?:\.\d+)?)', line)
    if m: return float(m.group(1))
    m = re.search(r'transform="matrix\([^)]*?\s(-?\d+(?:\.\d+)?)\s+-?\d+(?:\.\d+)?\)"', line)
    if m: return float(m.group(1))
    m = re.search(r'\bd="[mM]\s*(-?\d+(?:\.\d+)?)', line)
    if m: return float(m.group(1))
    m = re.search(r'points="(-?\d+(?:\.\d+)?)', line)
    if m: return float(m.group(1))
    return None

# ---- Parse hybrid -----------------------------------------------------------
lines = src.splitlines()
# Find header (up to and including </defs>)
defs_end = None
for i, l in enumerate(lines):
    if "</defs>" in l:
        defs_end = i
        break
header = "\n".join(lines[: defs_end + 1])

# Walk body, skip existing <g> tags (we'll regroup)
body = []
for l in lines[defs_end + 1 : -1]:
    s = l.strip()
    if s.startswith("<g ") or s.startswith("</g>") or not s:
        continue
    body.append(l)

groups = {k: [] for k in LAYER_ORDER}

for ln in body:
    m = re.search(r'class="(cls-\d+)"', ln)
    if not m:
        continue
    c = m.group(1)
    is_text = "<text" in ln
    is_circle = "<circle" in ln
    x = first_x(ln)

    layer = class_layer.get(c, "background_paper")

    # Special: city dots are cls-33 circles
    if is_circle and c == "cls-33":
        layer = "city_dots"

    # Title detection
    if is_text and "Военные действия" in ln:
        layer = "title"
    elif is_text and c == "cls-33":
        # legend if right of x=213
        if x is not None and x >= 213:
            layer = "legend"
        else:
            layer = "labels_cities"
    elif is_text and c == "cls-30":
        # River vs army label
        wm = re.search(r">([^<]+)</text>", ln)
        word = (wm.group(1).strip().split()[0] if wm else "")
        if word in RIVER_WORDS:
            layer = "labels_rivers"
        else:
            layer = "labels_armies"

    # Anything in legend zone that isn't text → legend (demo arrows)
    if not is_text and x is not None and x >= 213:
        if c == "cls-17":
            layer = "frame_decor"
        elif c == "cls-29":
            layer = "map_frame"
        else:
            layer = "legend"

    groups[layer].append(ln)

# ---- Emit -------------------------------------------------------------------
out = [header, ""]
for lid in LAYER_ORDER:
    items = groups[lid]
    if not items:
        continue
    out.append(f'  <g id="{lid}">')
    for it in items:
        out.append("  " + it.lstrip())
    out.append("  </g>")
out.append("</svg>")

DST.write_text("\n".join(out) + "\n")
print(f"Wrote {DST}")
print("Layer counts:")
for lid in LAYER_ORDER:
    n = len(groups[lid])
    if n:
        print(f"  {lid:20s} {n}")
