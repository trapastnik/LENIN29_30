// <venn-selector> — диаграмма пересекающихся 5 политических групп.
// Фон — готовая PNG-картинка blob'ов; поверх — абсолютно позиционированные
// заголовки групп и чипы партий по координатам из _index.json.
//
// API:
//   .camps      — список { id, title_ru, icon, general_id }
//   .background — URL картинки без подписей (venn-bg.png)
//   .headers    — массив { camp, x, y } — позиции заголовков групп
//   .items      — массив партий с x/y и _is_general

const ICONS = {
  star:   `<path d="M12 2l2.9 6.9L22 10l-5.3 4.6L18.2 22 12 18.3 5.8 22l1.5-7.4L2 10l7.1-1.1L12 2z" fill="currentColor"/>`,
  shield: `<path d="M12 2L4 5v7c0 5.5 3.4 9.5 8 10 4.6-.5 8-4.5 8-10V5l-8-3z" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  people: `<circle cx="9" cy="8" r="3.2" fill="currentColor"/><circle cx="15" cy="8" r="3.2" fill="currentColor"/><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M9.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  anarchy:`<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 16.5l5.5-9.5 5.5 9.5M8.5 13h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  flag:   `<path d="M5 3v18M5 4h10l2 3h5v8H10l-2-3H5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
};

const TEMPLATE = `
<style>
  :host {
    display: block;
    position: relative;
    width: 100%;
    /* Аспект точно по картинке venn-bg.png, чтобы чипы в %% align'ились с blob'ами. */
    aspect-ratio: 1672 / 941;
    max-height: 86vh;
    background: #0b0d12;
    border: 1px solid rgba(200, 182, 138, 0.2);
    border-radius: 12px;
    overflow: hidden;
    font-family: var(--font-body);
    color: #f5f0e0;
  }

  .ornament {
    position: absolute;
    top: 12px; left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 15px;
    line-height: 1.4;
    color: #c8b68a;
    text-align: center;
    max-width: 56%;
    opacity: 0.9;
    pointer-events: none;
    z-index: 3;
    text-shadow: 0 2px 8px rgba(0,0,0,0.9);
  }

  img.bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
    z-index: 1;
  }

  .stage {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .group-header {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex; flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }
  .group-icon {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    border: 1.5px solid var(--camp-color, rgba(255,255,255,0.4));
    display: grid; place-items: center;
    color: var(--camp-color);
    box-shadow: 0 0 16px rgba(0,0,0,0.6);
  }
  .group-icon svg { width: 22px; height: 22px; }
  .group-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--camp-color, #f5f0e0);
    white-space: nowrap;
    text-align: center;
    text-shadow: 0 2px 6px rgba(0,0,0,0.7);
  }
  .group-title.wrap {
    white-space: normal;
    max-width: 220px;
    line-height: 1.15;
  }
  .group-button {
    pointer-events: auto;
    cursor: pointer;
    padding: 5px 18px;
    border: 1px solid var(--camp-color, rgba(245,240,224,0.5));
    border-radius: 16px;
    background: transparent;
    color: var(--camp-color, #f5f0e0);
    font-family: var(--font-body);
    font-size: 13px;
    letter-spacing: 0.04em;
    min-height: 28px; min-width: 72px;
    user-select: none;
  }
  .group-button:active {
    background: rgba(245, 240, 224, 0.14);
  }

  .chip {
    position: absolute;
    transform: translate(0, -50%);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    pointer-events: auto;
    user-select: none;
    padding: 4px 6px;
    border-radius: 14px;
    transition: background .14s, transform .14s;
  }
  .chip:active {
    background: rgba(255, 255, 255, 0.12);
    transform: translate(1px, -50%);
  }
  .chip .dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--camp-color);
    flex-shrink: 0;
    box-shadow: 0 0 6px var(--camp-color);
  }
  .chip .name {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.2;
    color: #f5f0e0;
    white-space: nowrap;
  }

  footer {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 12px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to top, rgba(10,12,18,0.95), transparent);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    color: rgba(245, 240, 224, 0.55);
    pointer-events: none;
    z-index: 3;
  }
  footer .stats b { color: #f5f0e0; font-weight: 700; margin-right: 6px; }
  .all-btn {
    pointer-events: auto;
    cursor: pointer;
    padding: 7px 16px;
    border: 1px solid rgba(196, 154, 46, 0.7);
    border-radius: 18px;
    background: transparent;
    color: #c49a2e;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    min-height: 30px;
  }
  .all-btn:active { background: rgba(196, 154, 46, 0.2); }
</style>

<div class="ornament">Пересекающиеся области показывают возможные идеологические связи и участие партий в нескольких направлениях политической жизни.</div>
<img class="bg" alt="">
<div class="stage"></div>
<footer>
  <div class="stats"><b>Всего справок: 20</b>&nbsp;&nbsp;·&nbsp;&nbsp;Максимум 3000 знаков текста, до 5 изображений</div>
  <button class="all-btn" type="button">Все справки →</button>
</footer>
`;

export class VennSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._bg = this.shadowRoot.querySelector('img.bg');
    this._stage = this.shadowRoot.querySelector('.stage');
    this._allBtn = this.shadowRoot.querySelector('.all-btn');
    this._allBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('view-all', { bubbles: true, composed: true }));
    });
  }

  set background(url) {
    if (url) this._bg.src = url;
    else this._bg.removeAttribute('src');
  }
  set camps(v)   { this._camps = v || []; this._render(); }
  set headers(v) { this._headers = v || []; this._render(); }
  set items(v)   { this._items = v || []; this._render(); }

  _render() {
    if (!this._camps || !this._items || !this._headers) return;
    this._stage.innerHTML = '';

    for (const h of this._headers) {
      const camp = this._camps.find(c => c.id === h.camp);
      if (!camp) continue;
      const general = this._items.find(i => i.id === camp.general_id) || {
        id: camp.general_id, title_ru: camp.title_ru, camp: camp.id,
      };

      const wrap = document.createElement('div');
      wrap.className = 'group-header';
      wrap.style.left = h.x + '%';
      wrap.style.top = h.y + '%';
      wrap.style.setProperty('--camp-color', `var(--camp-${camp.id}, #888)`);

      const icon = document.createElement('div');
      icon.className = 'group-icon';
      icon.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[camp.icon] || ''}</svg>`;

      const title = document.createElement('div');
      title.className = 'group-title';
      if (camp.title_ru.length > 14) title.classList.add('wrap');
      title.textContent = camp.title_ru.toUpperCase();

      const btn = document.createElement('button');
      btn.className = 'group-button';
      btn.type = 'button';
      btn.textContent = 'Справка';
      btn.addEventListener('click', () => this._emitParty(general));

      wrap.append(icon, title, btn);
      this._stage.appendChild(wrap);
    }

    for (const it of this._items) {
      if (it._is_general || it.x == null) continue;
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.left = it.x + '%';
      chip.style.top = it.y + '%';
      chip.style.setProperty('--camp-color', `var(--camp-${it.camp}, #888)`);
      chip.innerHTML = `<span class="dot"></span><span class="name">${it.title_ru}</span>`;
      chip.addEventListener('click', () => this._emitParty(it));
      this._stage.appendChild(chip);
    }
  }

  _emitParty(item) {
    this.dispatchEvent(new CustomEvent('party-select', {
      detail: { item }, bubbles: true, composed: true,
    }));
  }
}

customElements.define('venn-selector', VennSelector);
