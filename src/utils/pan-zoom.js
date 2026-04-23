// Pan/zoom/pinch для контейнера с transform. Наследник map_v6/viewer.html:3580-3629.
// Использует PointerEvents → работает мышью и пальцем единообразно.

export function attachPanZoom(viewport, container, opts = {}) {
  const minScale = opts.minScale ?? 0.1;
  const maxScale = opts.maxScale ?? 20;
  const onChange = opts.onChange ?? (() => {});

  let scale = 1, tx = 0, ty = 0;
  const pointers = new Map();
  let pinchStart = null;

  function apply() {
    container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    onChange({ scale, tx, ty });
  }

  function reset(fitWidth, fitHeight) {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    scale = Math.min(vw / fitWidth, vh / fitHeight) * 0.95;
    tx = (vw - fitWidth * scale) / 2;
    ty = (vh - fitHeight * scale) / 2;
    apply();
  }

  function zoomAt(px, py, factor) {
    const newScale = Math.max(minScale, Math.min(maxScale, scale * factor));
    tx = px - (px - tx) * (newScale / scale);
    ty = py - (py - ty) * (newScale / scale);
    scale = newScale;
    apply();
  }

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
  }, { passive: false });

  viewport.addEventListener('pointerdown', e => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchStart = { dist: Math.hypot(dx, dy), scale };
    }
  });

  viewport.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      tx += e.clientX - prev.x;
      ty += e.clientY - prev.y;
      apply();
    } else if (pointers.size === 2 && pinchStart) {
      const pts = [...pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const r = viewport.getBoundingClientRect();
      const cx = (pts[0].x + pts[1].x) / 2 - r.left;
      const cy = (pts[0].y + pts[1].y) / 2 - r.top;
      const targetScale = pinchStart.scale * (dist / pinchStart.dist);
      const factor = targetScale / scale;
      zoomAt(cx, cy, factor);
    }
  });

  const release = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('pointerleave', release);

  return {
    reset,
    get state() { return { scale, tx, ty }; },
    setState(s) { scale = s.scale; tx = s.tx; ty = s.ty; apply(); },
  };
}
