// <camp-filter> — горизонтальный ряд флагов лагерей.
// Событие 'camp-change' с detail: { camp: 'red' | 'white' | … | null (все) }

const TEMPLATE = `
<style>
  :host {
    display: block;
    width: 100%;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(210, 183, 115, 0.4);
    border-radius: 40px;
  }
  button {
    padding: 14px 24px;
    min-width: 140px;
    min-height: 56px;
    font-family: var(--font-mono);
    font-size: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border: none;
    border-radius: 30px;
    background: transparent;
    color: var(--paper-white, #f7f9ef);
    cursor: pointer;
    transition: all .18s;
  }
  button:active { background: rgba(210, 183, 115, 0.18); }
  button.active {
    background: var(--brass, #D2B773);
    color: var(--iron-grey, #555D61);
  }
  button .swatch {
    display: inline-block;
    width: 12px; height: 12px;
    border-radius: 50%;
    margin-right: 10px;
    vertical-align: middle;
    background: var(--dot, #888);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
  }
</style>
<div class="bar" role="tablist"></div>
`;

export class CampFilter extends HTMLElement {
  static get observedAttributes() { return ['camps', 'active']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._bar = this.shadowRoot.querySelector('.bar');
    this._camps = [];
    this._active = null;
  }

  connectedCallback() { this._render(); }

  attributeChangedCallback(name) {
    if (name === 'camps') {
      try { this._camps = JSON.parse(this.getAttribute('camps')) || []; }
      catch { this._camps = []; }
    }
    if (name === 'active') {
      const v = this.getAttribute('active');
      this._active = v === '' || v === null ? null : v;
    }
    this._render();
  }

  _render() {
    this._bar.innerHTML = '';

    const all = document.createElement('button');
    all.textContent = 'Все';
    all.classList.toggle('active', this._active === null);
    all.addEventListener('click', () => this._select(null));
    this._bar.appendChild(all);

    for (const c of this._camps) {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.dataset.camp = c.id;
      b.classList.toggle('active', this._active === c.id);
      const color = `var(--camp-${c.id.replace(/_/g, '-')}, #888)`;
      b.innerHTML = `<span class="swatch" style="--dot: ${color}"></span>${c.title_ru}`;
      b.addEventListener('click', () => this._select(c.id));
      this._bar.appendChild(b);
    }
  }

  _select(campId) {
    this._active = campId;
    this.setAttribute('active', campId ?? '');
    this.dispatchEvent(new CustomEvent('camp-change', {
      detail: { camp: campId }, bubbles: true, composed: true,
    }));
    this._render();
  }
}

customElements.define('camp-filter', CampFilter);
