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
    background: repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 0 0 / calc(20px * var(--ui-scale, 1)) calc(20px * var(--ui-scale, 1));
    color: var(--ink);
    font-family: var(--font-body);
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
    position: absolute; bottom: var(--sp-2, 16px); left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex; gap: calc(14px * var(--ui-scale, 1)); flex-wrap: wrap; align-items: center;
    padding: calc(12px * var(--ui-scale, 1)) calc(18px * var(--ui-scale, 1));
    background: rgba(30, 20, 10, 0.88);
    color: var(--paper-light);
    border: 1px solid var(--brass);
    border-radius: var(--r-md, 8px);
    /* Кегль 14: у шкалы --fs-* нет ступени ниже 16, а панель плотная —
       двадцать строк при ширине 280. Заявка в design на ступень ниже 16
       передана; до неё значение через --ui-scale, как остальные метрики. */
    font-size: calc(14px * var(--ui-scale, 1));
    user-select: none;
    max-width: 90%;
  }
  #panel.hidden { display: none; }
  /* Боковая панель справа — опт-ин через атрибут panel-side="right" на хосте. */
  :host([panel-side="right"]) #panel {
    top: var(--sp-2, 16px); right: var(--sp-2, 16px); bottom: var(--sp-2, 16px); left: auto;
    transform: none;
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
    gap: calc(6px * var(--ui-scale, 1));
    padding: calc(12px * var(--ui-scale, 1)) calc(14px * var(--ui-scale, 1));
    max-width: calc(280px * var(--ui-scale, 1));
    max-height: calc(100% - var(--sp-4, 32px));
    overflow-y: auto;
    font-size: calc(13px * var(--ui-scale, 1));
  }
  /* Тач-цель управляющего элемента. 64 — порог из §1 для элементов
     ВНУТРИ разделов (основная навигация ≥120). Пишется через --ui-scale,
     как во всём проекте: states.html:33 задаёт ровно так же.
     Замерено на киоске при ×2: было 26 CSS = 52 физических px, пальцем
     не берётся. Двадцать строк по 64 требуют 1280 при видимых 887,
     то есть панель прокручивается — прокрутка здесь была и раньше
     (overflow-y: auto). Обмен согласован: ненажимаемая цель бесполезна,
     а прокрутка — известное действие. */
  :host([panel-side="right"]) #panel .layer-row {
    min-height: calc(64px * var(--ui-scale, 1));
  }
  :host([panel-side="right"]) #panel > div {
    /* «btns»-контейнер из _buildPanel: возвращаем его в нормальный поток
       (там стоит margin-left:auto для центральной раскладки). */
    margin-left: 0 !important;
    margin-top: calc(10px * var(--ui-scale, 1));
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: calc(10px * var(--ui-scale, 1));
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .layer-row {
    display: flex; align-items: center; gap: calc(6px * var(--ui-scale, 1));
    cursor: pointer; white-space: nowrap;
    min-height: calc(64px * var(--ui-scale, 1));
  }
  .layer-row input[type="checkbox"] {
    appearance: none; -webkit-appearance: none;
    /* Сам квадратик — не тач-цель: строка это <label>, и попадание идёт
       по всей её высоте. Размер поднят с 18 до 24 только для видимости
       на 4K, порог держит строка. */
    width: calc(24px * var(--ui-scale, 1));
    height: calc(24px * var(--ui-scale, 1));
    border: 1.5px solid var(--paper-warm);
    border-radius: var(--r-sm, 4px);
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
  }
  .layer-row input[type="checkbox"]:checked {
    background: var(--accent);
    border-color: var(--accent);
  }
  .layer-row input[type="checkbox"]:checked::after {
    content: '✓';
    color: #1a1008;
    font-weight: bold;
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: calc(12px * var(--ui-scale, 1));
  }
  .swatch {
    width: calc(14px * var(--ui-scale, 1)); height: calc(14px * var(--ui-scale, 1)); border-radius: var(--r-sm, 4px);
    border: 1px solid rgba(255,255,255,0.2);
    flex-shrink: 0;
  }
  /* Растровому слою цвет линии не соответствует — у него нет линии.
     Косая штриховка читается как «это подложка», а не как цвет. */
  .swatch-raster {
    background: repeating-linear-gradient(
      45deg, transparent 0 calc(3px * var(--ui-scale, 1)), var(--paper-warm) calc(3px * var(--ui-scale, 1)) calc(6px * var(--ui-scale, 1)));
  }
  /* Цвет не задан. Пустая плашка честнее серой: серая читается как
     «слой серого цвета», пустая — как «цвет неизвестен». */
  .swatch-none {
    background: none;
    border-style: dashed;
  }
  button.ctrl {
    padding: calc(6px * var(--ui-scale, 1)) calc(12px * var(--ui-scale, 1));
    font-size: calc(12px * var(--ui-scale, 1));
    background: rgba(250, 240, 210, 0.12);
    color: var(--paper-light);
    border: 1px solid var(--paper-warm);
    border-radius: var(--r-sm, 4px);
    cursor: pointer;
    /* Было min-height: auto, то есть 28 CSS = 56 физических при ×2. */
    min-height: calc(64px * var(--ui-scale, 1));
    min-width: calc(64px * var(--ui-scale, 1));
  }
  button.ctrl:active { background: rgba(250, 240, 210, 0.28); }
  /* Прозрачность всего векторного слоя поверх растра. Управляется
     через CSS-переменную --vector-opacity на хосте (по умолчанию 1). */
  #container svg > g.layer-vector { opacity: var(--vector-opacity, 1); }
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
    this._timers = new Set();
    this._loadingId = null;
  }

  connectedCallback() {
    const id = this.getAttribute('map-id');
    if (id && this._shouldLoad(id)) this.load(id);
  }

  /**
   * Защита от двойной загрузки. Замерено: если `map-id` стоит в разметке
   * до вставки элемента — а именно так его и собирает `state-card.js`
   * через innerHTML, — то `attributeChangedCallback` и `connectedCallback`
   * вызывают `load()` дважды: 2 загрузки, 4 запроса вместо 2.
   *
   * Работа при этом делается вся: второй прогон перетирает первый, поэтому
   * снаружи не видно ничего, кроме удвоенного трафика и удвоенной сборки
   * DOM. На каждой открытой карточке территории.
   *
   * Смена `map-id` на живом элементе продолжает работать — это часть API:
   * сравнивается именно id, а не факт загрузки.
   */
  _shouldLoad(id) {
    if (this._loadingId === id) return false;
    this._loadingId = id;
    return true;
  }

  /**
   * Снятие элемента с DOM. Появился по вопросу зоны ui про сброс раздела
   * по простою — и оказалось, что его не было вовсе.
   *
   * ЧТО ЖИВЁТ ДОЛЬШЕ ЭЛЕМЕНТА, если не убрать руками:
   *   · ResizeObserver — активный наблюдатель держит ссылку на viewport,
   *     который уже снят. Слушатели этой проблемы не создают: все они висят
   *     на узлах внутри своего shadow DOM и умирают вместе с ним, а observer
   *     живёт в браузере отдельно;
   *   · requestAnimationFrame-циклы анимаций wipe/fade — clip-wipe планирует
   *     следующий кадр сам, поэтому цикл докручивает свои 1200 мс по снятому
   *     узлу;
   *   · цепочка setTimeout из «Все вкл/выкл» — до 20 слоёв по 100 мс, то есть
   *     ещё две секунды обращений к снятому элементу.
   *
   * Каждое по отдельности ограничено по времени и почти незаметно. Но §1
   * требует ОДИН НЕПРЕРЫВНЫЙ СЕАНС, а утечки видны через час: если раздел
   * с картой открывают и закрывают сотню раз, наблюдатели накапливаются.
   */
  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    for (const cancel of this._cancelers.values()) cancel();
    this._cancelers.clear();
    for (const t of this._timers) clearTimeout(t);
    this._timers.clear();
    this._panZoom = null;
    // Сброс, чтобы повторная вставка того же элемента снова загрузила карту.
    this._loadingId = null;
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'map-id' && newV && this._shouldLoad(newV)) this.load(newV);
    if (name === 'show-panel') this._panel.classList.toggle('hidden', newV !== 'true');
  }

  async load(mapId) {
    // Без ведущего слэша и через MTK_URL: киоск запускается как
    // file:///opt/mtk29/dist/index.html, где `/content/…` резолвится в корень
    // файловой системы. Карта не находится, ошибки в консоли нет — на stage
    // по http тот же путь работает, поэтому глазами дефект не ловится
    // нигде, кроме приёмки. См. CLAUDE.md §5 и public/base.js.
    //
    // Отсюда же берут префикс map.json, layers.svg и растр — место одно.
    // Страница, встраивающая <map-unit>, обязана подключить base.js первым
    // скриптом в <head>.
    const base = MTK_URL(`content/maps/${mapId}/`);
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
      // preserveAspectRatio:
      //   "none"            — растягивает растр точно по viewBox (для vectorize-карт
      //                       где aspect векторного контента совпадает с растровым)
      //   "xMidYMid meet"   — letterbox, сохраняет пропорции растра (для AI-карт,
      //                       где векторный viewBox может быть квадратным)
      // Берём из manifest.preserve_aspect, по умолчанию letterbox (безопасный).
      const par = meta.preserve_aspect || 'xMidYMid meet';
      img.setAttribute('preserveAspectRatio', par);
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
      // Класс для CSS-переменной --vector-opacity. Растровые слои
      // (kind:"raster") остаются полностью непрозрачными — фейдится
      // только vector-overlay поверх архивного растра.
      el.classList.add(l.kind === 'raster' ? 'layer-raster' : 'layer-vector');
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

      // ЦВЕТ ПЛАШКИ — ПО РОЛИ ИЗ ПАСПОРТА КАРТЫ.
      //
      // Раньше цвет брался из токена `--layer-<id>`, а такие токены есть
      // только для семи слоёв карты komuch. У Поволжья слоёв 19, и 17 плашек
      // из 20 рисовались серым по умолчанию: легенда не показывала, какой
      // линией управляет галка.
      //
      // Договор зоны design (правило R10 линтера): слой в map.json пишет
      // ИМЯ РОЛИ из группы `map` словаря токенов, а не значение цвета.
      // Значение живёт в палитре, поэтому плашка и линия не могут разойтись:
      // расходиться нечему. Роли назначает scripts/maps/layer_colors.py.
      //
      // Роль семантическая, а не колориметрическая: синие стрелки Поволжья
      // это удары Русской армии, то есть роль map-white при синей линии.
      //
      // `--layer-*` остаётся приоритетным там, где он есть, — это роль-цвета,
      // общие всем картам. Своего значения по умолчанию здесь нет намеренно:
      // нет роли — плашка рисуется контуром, и это читается как «цвет
      // не задан», а не как «слой серого цвета».
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      if (l.kind === 'raster') {
        swatch.classList.add('swatch-raster');
      } else {
        const legacy = `--layer-${l.id.replace(/_/g, '-')}`;
        const fromLegacy = getComputedStyle(this).getPropertyValue(legacy).trim();
        if (fromLegacy) swatch.style.background = fromLegacy;
        else if (l.color) swatch.style.background = `var(--${l.color})`;
        else swatch.classList.add('swatch-none');
      }

      const name = document.createElement('span');
      name.textContent = l.label_ru;

      row.append(cb, swatch, name);
      this._panel.appendChild(row);
    }

    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = 'calc(6px * var(--ui-scale, 1))';
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
      // Таймеры запоминаются, чтобы disconnectedCallback их снял: у 20 слоёв
      // цепочка тянется две секунды, и всё это время она обращается к узлам
      // снятого элемента.
      const t = setTimeout(() => {
        this._timers.delete(t);
        cb.checked = on;
        // Никак не привязано к layer id → используем индекс meta.layers
        const layer = this._meta?.layers[i];
        if (layer) this.setLayer(layer.id, on);
      }, i * 100);
      this._timers.add(t);
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
