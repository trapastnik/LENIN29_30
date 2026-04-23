// <party-card> — карточка политической партии.
// Используется и как плитка в сетке, и как раскрытая карточка (атрибут expanded).

import { fetchJSON } from '../data/loader.js';

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
  :host(:not([expanded]):hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0,0,0,0.45);
  }
  .camp-stripe {
    height: 10px;
    background: var(--camp-color, #888);
  }
  header {
    padding: 20px 24px 14px;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px;
    font-style: italic;
    font-weight: 700;
    line-height: 1.15;
    color: var(--ink);
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
    padding: 0 24px 24px;
    font-size: 18px;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  :host(:not([expanded])) .body {
    max-height: 160px;
    overflow: hidden;
    position: relative;
  }
  :host(:not([expanded])) .body::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: 0;
    height: 50px;
    background: linear-gradient(to bottom, transparent, var(--paper));
  }
  .body p { margin: 0 0 12px; }
  .leaders {
    padding: 14px 24px 20px;
    font-size: 14px;
    color: var(--ink-faint);
    border-top: 1px dashed rgba(168, 135, 90, 0.4);
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
  }
  .leaders b { color: var(--ink-soft); margin-right: 6px; }
  .loading {
    padding: 40px;
    text-align: center;
    color: var(--ink-faint);
    font-family: var(--font-mono);
  }
</style>
<div id="root" class="loading">Загрузка…</div>
`;

export class PartyCard extends HTMLElement {
  static get observedAttributes() { return ['party-id', 'expanded', 'stub']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._root = this.shadowRoot.getElementById('root');
    this._data = null;
    this._stub = null;
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'stub' && newV) {
      try { this._stub = JSON.parse(newV); } catch { this._stub = null; }
      if (!this._data) this._render();
    }
    if (name === 'party-id' && newV) this._load(newV);
    if (name === 'expanded') this._render();
  }

  async _load(id) {
    try {
      this._data = await fetchJSON(`/content/parties/${id}.json`);
    } catch (e) {
      this._data = {
        ...(this._stub || {}),
        id,
        title_ru: (this._stub && this._stub.title_ru) || id,
        camp: (this._stub && this._stub.camp) || 'red',
        summary_ru: 'Карточка в подготовке.',
        _placeholder: true,
      };
    }
    this._render();
  }

  _render() {
    const d = this._data;
    if (!d) return;
    const campVar = `var(--camp-${d.camp.replace(/_/g, '-')}, #888)`;
    this.style.setProperty('--camp-color', campVar);

    const dates = d.dates
      ? (d.dates.from || '') + (d.dates.to ? ' — ' + d.dates.to : '')
      : '';

    const paras = (d.summary_ru || '').split(/\n\n+/).map(p => `<p>${p}</p>`).join('');

    this._root.classList.remove('loading');
    this._root.innerHTML = `
      <div class="camp-stripe"></div>
      <header>
        <h2>${d.title_ru}</h2>
        <div class="meta">${dates || '&nbsp;'}</div>
      </header>
      <div class="body">${paras}</div>
      ${d.leaders_ru && d.leaders_ru.length ? `<div class="leaders"><b>Лидеры:</b>${d.leaders_ru.join(' · ')}</div>` : ''}
    `;
  }
}

customElements.define('party-card', PartyCard);
