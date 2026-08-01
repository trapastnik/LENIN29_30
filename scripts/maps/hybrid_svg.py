#!/usr/bin/env python3
"""Hybrid pass: replace inline arrowhead polygons with SVG <marker> references.

Strategy:
1. Parse all strike-stroke paths (cls-9/23/26 red, cls-8/12/24 blue, cls-25 green,
   cls-19 magenta) and compute their start+end cursor positions.
2. Parse all arrowhead-fill polygons (cls-28 red, cls-27 blue, cls-20 magenta)
   and use their first coordinate as the tip position.
3. Pair each arrowhead to the nearest matching-color stroke endpoint within 3 units.
4. Remove the arrowhead polygon and add marker-end (or marker-start) to its paired stroke.
5. Inject <defs> with 4 marker definitions (red/blue/green/magenta).
"""
import re
import math
from pathlib import Path

SRC = Path("/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.layered.svg")
DST = Path("/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.hybrid.svg")

src = SRC.read_text()

# --- Path d= endpoint parser ---------------------------------------------------
TOK_RE = re.compile(r'[a-zA-Z]|-?\d+(?:\.\d+)?(?:[eE][\-+]?\d+)?')

def parse_d(d):
    """Return (start_xy, end_xy) of an SVG path d attribute, plus the last segment
    direction (dx, dy) at the end (for marker orientation sanity)."""
    toks = TOK_RE.findall(d)
    i = 0
    x = y = 0.0
    sx = sy = 0.0
    start = None
    last_cmd = None
    prev_xy = (0.0, 0.0)
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
        else:
            # implicit repeat
            cmd = last_cmd
            if cmd == 'm':
                cmd = 'l'
            elif cmd == 'M':
                cmd = 'L'
        # number reader
        def n():
            nonlocal i
            v = float(toks[i]); i += 1
            return v
        prev_xy = (x, y)
        if cmd == 'M':
            x, y = n(), n()
            sx, sy = x, y
            if start is None:
                start = (x, y)
        elif cmd == 'm':
            x += n(); y += n()
            sx, sy = x, y
            if start is None:
                start = (x, y)
        elif cmd == 'L':
            x, y = n(), n()
        elif cmd == 'l':
            x += n(); y += n()
        elif cmd == 'H':
            x = n()
        elif cmd == 'h':
            x += n()
        elif cmd == 'V':
            y = n()
        elif cmd == 'v':
            y += n()
        elif cmd == 'C':
            n(); n(); n(); n(); x, y = n(), n()
        elif cmd == 'c':
            n(); n(); n(); n(); x += n(); y += n()
        elif cmd == 'S':
            n(); n(); x, y = n(), n()
        elif cmd == 's':
            n(); n(); x += n(); y += n()
        elif cmd == 'Q':
            n(); n(); x, y = n(), n()
        elif cmd == 'q':
            n(); n(); x += n(); y += n()
        elif cmd == 'T':
            x, y = n(), n()
        elif cmd == 't':
            x += n(); y += n()
        elif cmd == 'A':
            n(); n(); n(); n(); n(); x, y = n(), n()
        elif cmd == 'a':
            n(); n(); n(); n(); n(); x += n(); y += n()
        elif cmd in ('Z', 'z'):
            x, y = sx, sy
        else:
            break
        last_cmd = cmd
    return start or (0.0, 0.0), (x, y), prev_xy

# --- Parse SVG body ------------------------------------------------------------
# Capture every element line (one per line in our file). We'll keep the original
# lines and surgically modify them.

lines = src.splitlines()

class_to_marker = {
    'cls-9': 'arrow-red',
    'cls-23': 'arrow-red',
    'cls-26': 'arrow-red',
    'cls-8': 'arrow-blue',
    'cls-12': 'arrow-blue',
    'cls-24': 'arrow-blue',
    'cls-25': 'arrow-green',
    'cls-19': 'arrow-magenta',
}
arrowhead_to_marker = {
    'cls-28': 'arrow-red',
    'cls-27': 'arrow-blue',
    'cls-20': 'arrow-magenta',
}
# Green has no separate arrowhead fill class in the original SVG.

stroke_paths = []      # list of (line_idx, cls, marker, start, end)
arrowhead_paths = []   # list of (line_idx, cls, marker, tip)

for idx, ln in enumerate(lines):
    m = re.search(r'<path class="(cls-\d+)" d="([^"]+)"', ln)
    if not m:
        continue
    c, d = m.group(1), m.group(2)
    try:
        start, end, prev = parse_d(d)
    except Exception:
        continue
    if c in class_to_marker:
        stroke_paths.append((idx, c, class_to_marker[c], start, end))
    elif c in arrowhead_to_marker:
        # tip = first coord of d (the `m X Y` start)
        arrowhead_paths.append((idx, c, arrowhead_to_marker[c], start))

print(f"Stroke paths: {len(stroke_paths)}")
print(f"Arrowhead polygons: {len(arrowhead_paths)}")

# --- Pair arrowheads to strokes -----------------------------------------------
# For each arrowhead, find nearest same-color stroke endpoint within MAX_DIST.
MAX_DIST = 3.5
def dist(a, b):
    return math.hypot(a[0]-b[0], a[1]-b[1])

paired_strokes = {}     # stroke_idx -> set of {'end', 'start'}
removed_arrowheads = set()

for a_idx, a_cls, a_marker, a_tip in arrowhead_paths:
    best = None
    best_dist = MAX_DIST
    best_which = None
    for s_idx, s_cls, s_marker, s_start, s_end in stroke_paths:
        if s_marker != a_marker:
            continue
        taken = paired_strokes.get(s_idx, set())
        if 'end' not in taken:
            d_end = dist(a_tip, s_end)
            if d_end < best_dist:
                best_dist = d_end; best = s_idx; best_which = 'end'
        if 'start' not in taken:
            d_start = dist(a_tip, s_start)
            if d_start < best_dist:
                best_dist = d_start; best = s_idx; best_which = 'start'
    if best is not None:
        paired_strokes.setdefault(best, set()).add(best_which)
        removed_arrowheads.add(a_idx)

print(f"Paired: {len(paired_strokes)}  (orphan arrowheads: {len(arrowhead_paths) - len(removed_arrowheads)})")

# --- Build output --------------------------------------------------------------
out_lines = []
inserted_defs = False
for idx, ln in enumerate(lines):
    # Inject <defs> right after </style>
    if not inserted_defs and '</style>' in ln:
        out_lines.append(ln)
        out_lines.append("""  <defs>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#FF0000"/>
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#0000FF"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#006600"/>
    </marker>
    <marker id="arrow-magenta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#FF0099"/>
    </marker>
  </defs>""")
        inserted_defs = True
        continue

    # Drop paired arrowhead polygon
    if idx in removed_arrowheads:
        continue

    # Add marker-end/start to paired strokes
    if idx in paired_strokes:
        which_set = paired_strokes[idx]
        m = re.search(r'class="(cls-\d+)"', ln)
        marker_id = class_to_marker[m.group(1)]
        attrs = []
        if 'end' in which_set:
            attrs.append(f'marker-end="url(#{marker_id})"')
        if 'start' in which_set:
            attrs.append(f'marker-start="url(#{marker_id})"')
        ln = re.sub(r'(\s*/>)$', ' ' + ' '.join(attrs) + r'\1', ln)

    out_lines.append(ln)

DST.write_text("\n".join(out_lines) + "\n")
print(f"Wrote {DST}")
