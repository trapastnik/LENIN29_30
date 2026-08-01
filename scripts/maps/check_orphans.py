#!/usr/bin/env python3
"""Show which arrowhead polygons did NOT get paired, so we can decide what to do."""
import re, math
from pathlib import Path

# Reuse logic
exec(open("/tmp/hybrid_svg.py").read().split("# --- Build output")[0])

print("\nOrphan arrowheads:")
for a_idx, a_cls, a_marker, a_tip in arrowhead_paths:
    if a_idx in removed_arrowheads:
        continue
    # Compute nearest same-color stroke endpoint (even if > MAX_DIST or already paired)
    best = None
    best_dist = 999
    for s_idx, s_cls, s_marker, s_start, s_end in stroke_paths:
        if s_marker != a_marker:
            continue
        for which, pt in [('end', s_end), ('start', s_start)]:
            d = math.hypot(a_tip[0]-pt[0], a_tip[1]-pt[1])
            if d < best_dist:
                best_dist = d
                best = (s_idx, s_cls, which, pt)
    print(f"  line {a_idx+1} {a_cls} tip={a_tip}")
    print(f"    nearest {a_marker} stroke: line {best[0]+1} ({best[1]}) {best[2]}={best[3]} dist={best_dist:.2f}")
    # Show the actual line content trimmed
    import linecache
    print(f"    content: {open('/Users/dvn/Downloads/vectorized_019e5f74-c080-7077-9ac7-60ead12399ab.layered.svg').read().splitlines()[a_idx].strip()[:120]}")
