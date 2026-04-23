// <map-unit> — переиспользуемый просмотровщик многослойной SVG-карты.
// Наследник map_v6/viewer.html. Ключевое отличие: растровый фон подключается
// отдельным <image>, не base64 → карта легче в разы и лениво догружается.

import { attachPanZoom } from '../utils/pan-zoom.js';
import { wipeLayer, ensureWipeClip } from '../utils/clip-wipe.js';
import { fadeLayer } from '../utils/fade.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const TEMPLATE = `
<style>
  :host {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    background: repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 0 0 / 20px 20px;
    color: var(--ink, #2a1f16);
    font-family: var(--font-body, Georgia, serif);
  }
  #viewport {
    position: absolute; inset: 0;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
  }
  #viewport.dragging { cursor: grabbing; }
  #container { transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  #panel {
    position: absolute; bottom: 16px; left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
    padding: 12px 18px;
    background: rgba(30, 20, 10, 0.88);
    color: var(--paper-light, #efe4cd);
    border: 1px solid var(--brass, #8e6a2a);
    border-radius: 10px;
    font-size: 14px;
    user-select: none;
    max-width: 90%;
  }
  #panel.hidden { display: none; }
  .layer-row {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer; white-space: nowrap;
    min-height: 32px;
  }
  .layer-row input[type="checkbox"] {
    appearance: none; -webkit-appearance: none;
    width: 18px; height: 18px;
    border: 1.5px solid var(--paper-warm, #d9c398);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
  }
  .layer-row input[type="checkbox"]:checked {
    background: var(--ochre, #c18f3c);
    border-color: var(--ochre, #c18f3c);
  }
  .layer-row input[type="checkbox"]:checked::after {
    content: '✓';
    color: #1a1008;
    font-weight: bold;
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
  }
  .swatch {
    width: 14px; height: 14px; border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.2);
    flex-shrink: 0;
  }
  button.ctrl {
    padding: 6px 12px;
    font-size: 12px;
    background: rgba(250, 240, 210, 0.12);
    color: var(--paper-light, #efe4cd);
    border: 1px solid var(--paper-warm, #d9c398);
    border-radius: 5px;
    cursor: pointer;
    min-width: auto; min-height: auto;
  }
  button.ctrl:active { background: rgba(250, 240, 210, 0.28); }
</style>
<div id="viewport">
  <div id="container"></div>
</div>
<div id="panel" class="hidden"></div>
`;

const ARROW_LAYERS = new Set(['arrows_red', 'arrows_pink']);

export class MapUnit extends HTMLElement {
  static get observedAttributes() {
    return ['map-id', 'show-panel', 'initial-layers'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._viewport = this.shadowRoot.getElementById('viewport');
    this._container = this.shadowRoot.getElementById('container');
    this._panel = this.shadowRoot.getElementById('panel');
    this._meta = null;
    this._svgEl = null;
    this._panZoom = null;
    this._cancelers = new Map();
  }

  connectedCallback() {
    const id = this.getAttribute('map-id');
    if (id) this.load(id);
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'map-id' && newV) this.load(newV);
    if (name === 'show-panel') this._panel.classList.toggle('hidden', newV !== 'true');
  }

  async load(mapId) {
    const base = `/content/maps/${mapId}/`;
    const meta = await (await fetch(base + 'map.json')).json();
    const svgText = await (await fetch(base + meta.svg)).text();

    this._container.innerHTML = svgText;
    const svgEl = this._container.querySelector('svg');
    if (!svgEl) throw new Error(`map ${mapId}: svg root not found`);
    this._svgEl = svgEl;
    this._meta = meta;

    // Убеждаемся, что background-группа содержит <image>, а не inline-base64.
    // Т.к. мы вычистили <g id="background"> при экспорте, добавляем её обратно
    // с внешним растром.
    const bgLayer = meta.layers.find(l => l.kind === 'raster');
    if (bgLayer && !svgEl.querySelector(`#${CSS.escape(bgLayer.id)}`)) {
      const [, , w, h] = meta.viewBox.split(/\s+/).map(Number);
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('id', bgLayer.id);
      g.setAttribute('visibility', bgLayer.default ? 'visible' : 'hidden');
      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttribute('width', String(w));
      img.setAttribute('height', String(h));
      img.setAttributeNS(XLINK_NS, 'xlink:href', base + meta.background_raster);
      img.setAttribute('href', base + meta.background_raster);
      g.appendChild(img);
      svgEl.insertBefore(g, svgEl.firstChild);
    }

    // Установим visibility по initial-layers или по default
    const initialAttr = this.getAttribute('initial-layers');
    const initial = initialAttr
      ? new Set(initialAttr.split(',').map(s => s.trim()).filter(Boolean))
      : new Set(meta.layers.filter(l => l.default).map(l => l.id));

    for (const l of meta.layers) {
      const el = svgEl.querySelector(`#${CSS.escape(l.id)}`);
      if (!el) continue;
      el.setAttribute('visibility', initial.has(l.id) ? 'visible' : 'hidden');
    }

    // Подготавливаем clip-пути для wipe-слоёв.
    for (const l of meta.layers) {
      if (l.anim === 'wipe' || ARROW_LAYERS.has(l.id)) {
        ensureWipeClip(svgEl, l.id);
      }
    }

    // Pan/zoom
    const [, , vw, vh] = meta.viewBox.split(/\s+/).map(Number);
    if (this._panZoom) this._panZoom = null;
    this._panZoom = attachPanZoom(this._viewport, this._container, {});
    svgEl.setAttribute('width', String(vw));
    svgEl.setAttribute('height', String(vh));

    // ResizeObserver: первый reset — когда viewport уже получил финальный размер.
    // Затем reset на любой ресайз, только если пользователь не выполнял pan/zoom сам
    // (держим флаг: userInteracted).
    let userInteracted = false;
    this._viewport.addEventListener('pointerdown', () => { userInteracted = true; }, { once: true });
    this._viewport.addEventListener('wheel',       () => { userInteracted = true; }, { once: true });

    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      if (!userInteracted) this._panZoom.reset(vw, vh);
    });
    this._resizeObserver.observe(this._viewport);

    // Панель слоёв
    this._buildPanel(meta, initial);
    this._panel.classList.toggle('hidden', this.getAttribute('show-panel') !== 'true');
  }

  _buildPanel(meta, initial) {
    this._panel.innerHTML = '';
    for (const l of meta.layers) {
      const row = document.createElement('label');
      row.className = 'layer-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = initial.has(l.id);
      cb.addEventListener('change', () => this.setLayer(l.id, cb.checked));

      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = l.kind === 'raster'
        ? 'linear-gradient(135deg, #aaa, #666)'
        : `var(--layer-${l.id.replace(/_/g, '-')}, #888)`;

      const name = document.createElement('span');
      name.textContent = l.label_ru;

      row.append(cb, swatch, name);
      this._panel.appendChild(row);
    }

    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '6px';
    btns.style.marginLeft = 'auto';
    for (const [label, fn] of [
      ['Все вкл',  () => this._toggleAll(true)],
      ['Все выкл', () => this._toggleAll(false)],
      ['Сброс',    () => this._panZoom?.reset(...this._meta.viewBox.split(/\s+/).slice(2).map(Number))],
    ]) {
      const b = document.createElement('button');
      b.className = 'ctrl';
      b.textContent = label;
      b.addEventListener('click', fn);
      btns.appendChild(b);
    }
    this._panel.appendChild(btns);
  }

  _toggleAll(on) {
    this._panel.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
      setTimeout(() => {
        cb.checked = on;
        const row = cb.closest('.layer-row');
        const nameEl = row.querySelector('span:last-child');
        // Никак не привязано к layer id → используем индекс meta.layers
        const layer = this._meta.layers[i];
        if (layer) this.setLayer(layer.id, on);
      }, i * 100);
    });
  }

  setLayer(id, show) {
    const layer = this._meta?.layers.find(l => l.id === id);
    const el = this._svgEl?.querySelector(`#${CSS.escape(id)}`);
    if (!layer || !el) return;

    // Отмена предыдущей анимации
    const prev = this._cancelers.get(id);
    if (prev) { prev(); this._cancelers.delete(id); }

    const anim = layer.anim || (ARROW_LAYERS.has(id) ? 'wipe' : 'fade');
    if (anim === 'wipe') {
      const cancel = wipeLayer(this._svgEl, el, id, show, { duration: 1200 });
      this._cancelers.set(id, cancel);
    } else {
      const dur = id === 'background' ? 800 : 500;
      const cancel = fadeLayer(el, show, { duration: dur });
      this._cancelers.set(id, cancel);
    }

    this.dispatchEvent(new CustomEvent('layer-toggled', {
      detail: { id, show }, bubbles: true, composed: true,
    }));
  }

  resetView() {
    if (!this._meta || !this._panZoom) return;
    const [, , w, h] = this._meta.viewBox.split(/\s+/).map(Number);
    this._panZoom.reset(w, h);
  }
}

customElements.define('map-unit', MapUnit);
