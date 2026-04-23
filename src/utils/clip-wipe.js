// Wipe-анимация стрелок через SVG clip-path. Из map_v6/viewer.html:3464-3568.

const NS = 'http://www.w3.org/2000/svg';

export function ensureWipeClip(svgEl, layerId) {
  const clipId = 'wipe-' + layerId;
  if (svgEl.querySelector('#' + CSS.escape(clipId))) return clipId;

  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(NS, 'defs');
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  const cp = document.createElementNS(NS, 'clipPath');
  cp.setAttribute('id', clipId);
  cp.setAttribute('clipPathUnits', 'objectBoundingBox');
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '1');
  rect.setAttribute('height', '1');
  cp.appendChild(rect);
  defs.appendChild(cp);
  return clipId;
}

export function wipeLayer(svgEl, layerEl, layerId, show, { duration = 1200, onDone } = {}) {
  const clipId = ensureWipeClip(svgEl, layerId);
  const rect = svgEl.querySelector('#' + CSS.escape(clipId) + ' rect');
  if (!rect) {
    layerEl.setAttribute('visibility', show ? 'visible' : 'hidden');
    return () => {};
  }

  layerEl.setAttribute('visibility', 'visible');
  layerEl.setAttribute('clip-path', `url(#${clipId})`);

  const start = performance.now();
  let cancelled = false;

  const step = now => {
    if (cancelled) return;
    let t = Math.min((now - start) / duration, 1);
    t = 1 - Math.pow(1 - t, 3);
    const w = show ? t : 1 - t;
    rect.setAttribute('width', String(Math.max(0.001, w)));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      if (!show) layerEl.setAttribute('visibility', 'hidden');
      layerEl.removeAttribute('clip-path');
      rect.setAttribute('width', '1');
      if (onDone) onDone();
    }
  };
  requestAnimationFrame(step);

  return () => {
    cancelled = true;
    layerEl.removeAttribute('clip-path');
    rect.setAttribute('width', '1');
    if (!show) layerEl.setAttribute('visibility', 'hidden');
  };
}
