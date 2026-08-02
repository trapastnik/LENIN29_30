#!/usr/bin/env python3
"""Reorganize the vectorized historical map SVG into semantic <g> layers."""
import re
from pathlib import Path

SRC = Path("/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.svg")
DST = Path("/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.layered.svg")

text = SRC.read_text()
lines = text.splitlines()

# Header: <svg ...>, comment, <style>
header_end = None
style_end = None
for i, l in enumerate(lines):
    if "</style>" in l:
        style_end = i
        break
header = "\n".join(lines[: style_end + 1])

# Body elements: from after </style> to before </svg>
body = lines[style_end + 1 : -1]
# Find the closing tag (last line is </svg>)
assert lines[-1].strip() == "</svg>", f"Last line: {lines[-1]}"

# Helper to extract class
def cls(line: str) -> str:
    m = re.search(r'class="(cls-\d+)"', line)
    return m.group(1) if m else ""

def first_coord(line: str):
    """Return (x, y) of first coord in d= attribute, or x/cx for rect/circle/text."""
    # rect
    m = re.search(r'\bx="([\-\d.]+)"\s+y="([\-\d.]+)"', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'\bcx="([\-\d.]+)"\s+cy="([\-\d.]+)"', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'transform="translate\(([\-\d.]+)[ ,]+([\-\d.]+)\)"', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'transform="matrix\([^)]*\s([\-\d.]+)\s+([\-\d.]+)\)"', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'\bd="[mM]\s*(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'points="(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)', line)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None

# Manual line-by-line categorization based on prior analysis.
# Each entry: (layer_id, line_text)
layers_order = [
    "bg",
    "decorative-frame",
    "territories",
    "admin-borders",
    "rivers",
    "front-lines",
    "rkka-strikes",
    "whites-strikes",
    "siberian-army",
    "izhevsk-rebellion",
    "city-dots",
    "labels-cities",
    "labels-rivers",
    "labels-armies",
    "title",
    "map-frame",
    "legend",
]

groups = {k: [] for k in layers_order}

# Class → default layer (overridden by position for legend)
class_layer = {
    "cls-0": "bg",
    "cls-1": "territories",
    "cls-2": "territories",
    "cls-3": "admin-borders",
    "cls-4": "admin-borders",
    "cls-5": "admin-borders",
    "cls-6": "rivers",
    "cls-7": "front-lines",
    "cls-8": "whites-strikes",
    "cls-9": "rkka-strikes",
    "cls-10": "siberian-army",
    "cls-11": "front-lines",
    "cls-12": "whites-strikes",
    "cls-13": "front-lines",
    "cls-14": "front-lines",
    "cls-15": "front-lines",
    "cls-16": "front-lines",
    "cls-17": "decorative-frame",
    "cls-18": "front-lines",
    "cls-19": "izhevsk-rebellion",
    "cls-20": "izhevsk-rebellion",
    "cls-21": "front-lines",
    "cls-22": "front-lines",
    "cls-23": "rkka-strikes",
    "cls-24": "whites-strikes",
    "cls-25": "siberian-army",
    "cls-26": "rkka-strikes",
    "cls-27": "whites-strikes",
    "cls-28": "rkka-strikes",
    "cls-29": "map-frame",
    "cls-30": "labels-rivers",      # adjusted by content
    "cls-31": "legend",
    "cls-32": "labels-armies",
    "cls-33": "labels-cities",      # adjusted by content
    "cls-34": "legend",
}

# Known river names for cls-30
RIVER_WORDS = {"Волга", "Чусовая", "Тура", "Урал", "Белая", "Кама", "Вятка", "Ура", "Уфа"}

# Determine layer for each body element
for ln in body:
    s = ln.strip()
    if not s:
        continue
    c = cls(ln)
    if not c:
        # comments etc — skip into bg
        groups["bg"].append(ln)
        continue
    x, y = first_coord(ln)
    layer = class_layer.get(c, "bg")

    is_text = "<text" in s
    is_circle = "<circle" in s

    # Legend region: x >= 213 (anything visually inside the right legend area)
    in_legend_area = (x is not None and x >= 213)

    # Title detection
    if is_text and c == "cls-33" and "Военные действия" in s:
        layer = "title"
    elif is_text and c == "cls-33":
        if in_legend_area:
            layer = "legend"
        else:
            layer = "labels-cities"
    elif is_text and c == "cls-30":
        # Could be river label or army/territory label
        # Check content
        m = re.search(r">([^<]+)</text>", s)
        word = m.group(1).strip() if m else ""
        first_word = word.split()[0] if word else ""
        if first_word in RIVER_WORDS:
            layer = "labels-rivers"
        else:
            layer = "labels-armies"
    elif is_text and c == "cls-32":
        layer = "labels-armies"
    elif is_circle and c == "cls-33":
        layer = "city-dots"
    elif in_legend_area and not is_text:
        # Non-text paths in legend zone: small demo strokes/arrowheads (lines 265-288)
        # Keep cls-17 in decorative-frame even though it's at x>=213
        if c == "cls-17":
            layer = "decorative-frame"
        elif c == "cls-29":
            layer = "map-frame"
        else:
            layer = "legend"

    groups[layer].append(ln)

# Build output
out = [header]
out.append("")
for lid in layers_order:
    items = groups[lid]
    if not items:
        continue
    out.append(f'  <g id="{lid}">')
    for it in items:
        out.append("  " + it.lstrip())  # bump indent by 2
    out.append("  </g>")
out.append("</svg>")

DST.write_text("\n".join(out) + "\n")
print(f"Wrote {DST}")
print()
print("Layer counts:")
for lid in layers_order:
    print(f"  {lid:20s} {len(groups[lid])}")
