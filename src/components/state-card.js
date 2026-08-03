// <state-card> — карточка государственного образования.
// Отличие от <party-card>: в expanded-режиме встраивает <map-unit> с картой территории.

import { fetchJSON } from '../data/loader.js';
import { t, onLangChange } from '../data/i18n.js';
import './map-unit.js';

const TEMPLATE = `
<style>
  :host {
    display: block;
    position: relative;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid rgba(168, 135, 90, 0.5);
    border-radius: 6px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    overflow: hidden;
    font-family: var(--font-body);
    cursor: pointer;
    transition: transform .16s, box-shadow .16s;
  }
  :host([expanded]) { cursor: default; }
  :host(:not([expanded]):active) {
    transform: translateY(1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .camp-stripe { height: 10px; background: var(--camp-color, #888); }
  header { padding: 20px 24px 14px; }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px; font-style: italic; font-weight: 700;
    line-height: 1.15; color: var(--ink);
  }
  .abbr {
    margin-top: 6px;
    font-family: var(--font-mono);
    font-size: 16px;
    letter-spacing: 0.18em;
    /* Текст по светлой карточке — начертательный токен: --camp-white как
       текст давал контраст 1.45. Заливки (полоса, рамка) остаются на
       --camp-color. */
    color: var(--camp-ink, var(--camp-color, #888));
    font-weight: 700;
    text-transform: uppercase;
  }
  .meta {
    margin-top: 8px;
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .body {
    padding: 0 24px 20px;
    font-size: 18px; line-height: 1.5;
    color: var(--ink-soft);
  }
  :host(:not([expanded])) .body {
    max-height: 140px; overflow: hidden; position: relative;
  }
  :host(:not([expanded])) .body::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, var(--paper));
  }
  .body p { margin: 0 0 12px; }

  .map-wrap {
    position: relative;
    height: 520px;
    margin: 0 20px 20px;
    border: 1px solid rgba(168, 135, 90, 0.4);
    border-radius: 4px;
    overflow: hidden;
    background: #2a1f16;
  }
  :host(:not([expanded])) .map-wrap { display: none; }
  :host([expanded]) map-unit { width: 100%; height: 100%; }

  .no-map {
    padding: 20px 24px;
    margin: 0 20px 20px;
    background: rgba(168, 135, 90, 0.15);
    border: 1px dashed rgba(168, 135, 90, 0.5);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 14px;
    letter-spacing: 0.08em;
    color: var(--ink-faint);
    text-align: center;
  }
  :host(:not([expanded])) .no-map { display: none; }

  .loading { padding: 40px; text-align: center; color: var(--ink-faint); font-family: var(--font-mono); }
</style>
<div id="root" class="loading"></div>
`;

export class StateCard extends HTMLElement {

  // Интерфейсные подписи двуязычны, содержание справки — нет (CLAUDE.md §9).
  // Перерисовываемся сами: страница не знает, какие компоненты на ней живут.
  connectedCallback() {
    // Шаблон компонента вычисляется один раз при загрузке модуля, поэтому
    // подпись загрузки ставим здесь — иначе она заморозила бы язык.
    if (this._root && this._root.classList.contains('loading') && !this._root.textContent) {
      this._root.textContent = t('Загрузка…', 'Loading…');
    }
    if (this._unLang) return;
    this._unLang = onLangChange(() => this._render());
  }
  disconnectedCallback() {
    if (this._unLang) { this._unLang(); this._unLang = null; }
  }

  static get observedAttributes() { return ['state-id', 'expanded', 'stub']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._root = this.shadowRoot.getElementById('root');
    this._data = null;
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'stub' && newV) {
      try { this._stub = JSON.parse(newV); } catch { this._stub = null; }
      if (!this._data) this._render();
    }
    if (name === 'state-id' && newV) this._load(newV);
    if (name === 'expanded') this._render();
  }

  async _load(id) {
    try {
      this._data = await fetchJSON(MTK_URL(`content/states/${id}.json`));
    } catch {
      this._data = {
        ...(this._stub || {}),
        id,
        title_ru: (this._stub && this._stub.title_ru) || id,
        camp: (this._stub && this._stub.camp) || 'red',
        summary_ru: t('Карточка в подготовке.', 'Dossier in preparation.'),
        _placeholder: true,
      };
    }
    this._render();
  }

  _render() {
    const d = this._data;
    if (!d) return;
    const campVar = `var(--camp-${(d.camp || 'red').replace(/_/g, '-')}, #888)`;
    this.style.setProperty('--camp-color', campVar);
    this.style.setProperty('--camp-ink',
      `var(--camp-${(d.camp || 'red').replace(/_/g, '-')}-ink, ${campVar})`);

    const dates = d.dates
      ? (d.dates.from || '') + (d.dates.to ? ' — ' + d.dates.to : '')
      : '';

    const paras = (d.summary_ru || '').split(/\n\n+/).map(p => `<p>${p}</p>`).join('');
    const hasMap = !!d.map_id;
    const layers = (d.initial_layers || []).join(',');

    this._root.classList.remove('loading');
    this._root.innerHTML = `
      <div class="camp-stripe"></div>
      <header>
        <h2>${d.title_ru}</h2>
        ${d.abbr_ru ? `<div class="abbr">${d.abbr_ru}</div>` : ''}
        <div class="meta">${dates || '&nbsp;'}</div>
      </header>
      <div class="body">${paras}</div>
      ${hasMap
        ? `<div class="map-wrap"><map-unit map-id="${d.map_id}"${layers ? ` initial-layers="${layers}"` : ''} show-panel="true"></map-unit></div>`
        : `<div class="no-map">${t('Карта территории в производстве. Доступна только для Комуч (пример технологии).', 'Territory map in production. Available for Komuch only (technology sample).')}</div>`}
    `;
  }
}

customElements.define('state-card', StateCard);
