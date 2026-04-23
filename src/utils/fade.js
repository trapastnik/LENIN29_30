// Fade-анимация видимости слоя SVG. Из map_v6/viewer.html:3507-3528.

export function fadeLayer(el, show, { duration = 500, onDone } = {}) {
  el.setAttribute('visibility', 'visible');
  el.style.opacity = show ? '0' : '1';
  void el.getBoundingClientRect();
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = show ? '1' : '0';

  let cancelled = false;
  const end = () => {
    el.removeEventListener('transitionend', end);
    if (!show) el.setAttribute('visibility', 'hidden');
    el.style.transition = '';
    if (!cancelled && onDone) onDone();
  };
  el.addEventListener('transitionend', end);

  return () => {
    cancelled = true;
    el.removeEventListener('transitionend', end);
    el.style.transition = '';
    el.style.opacity = show ? '1' : '0';
    if (!show) el.setAttribute('visibility', 'hidden');
  };
}
