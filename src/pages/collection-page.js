// Общий рендерер для страниц-коллекций: сетка карточек + фильтр по лагерю + модалка.
// Используется parties.html и states.html.

import { fetchJSON } from '../data/loader.js';
import '../components/camp-filter.js';

export class CollectionPage {
  constructor({ kind, indexUrl, cardTag, idAttr }) {
    this.kind = kind;           // 'parties' | 'states'
    this.indexUrl = indexUrl;
    this.cardTag = cardTag;     // 'party-card' | 'state-card'
    this.idAttr = idAttr;       // 'party-id' | 'state-id'
    this.activeCamp = null;
    this.items = [];
    this.camps = [];
  }

  async init(root) {
    const idx = await fetchJSON(this.indexUrl);
    this.items = idx.items || [];
    this.camps = idx.camps || [];

    root.innerHTML = `
      <div id="filter-wrap"></div>
      <div id="grid"></div>
      <div id="modal" class="modal hidden" aria-hidden="true">
        <div class="modal-backdrop"></div>
        <div class="modal-sheet">
          <button class="modal-close" aria-label="Закрыть">×</button>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    const filterWrap = root.querySelector('#filter-wrap');
    const filter = document.createElement('camp-filter');
    filter.setAttribute('camps', JSON.stringify(this.camps));
    filter.setAttribute('active', '');
    filter.addEventListener('camp-change', e => {
      this.activeCamp = e.detail.camp;
      this._renderGrid(root.querySelector('#grid'));
    });
    filterWrap.appendChild(filter);

    this._renderGrid(root.querySelector('#grid'));

    const modal = root.querySelector('#modal');
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');
    const closeModal = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      const body = modal.querySelector('#modal-body');
      body.innerHTML = '';
    };
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  _renderGrid(gridEl) {
    const list = this.activeCamp
      ? this.items.filter(i => i.camp === this.activeCamp)
      : this.items;

    gridEl.innerHTML = '';
    for (const item of list) {
      const card = document.createElement(this.cardTag);
      card.setAttribute('stub', JSON.stringify(item));
      card.setAttribute(this.idAttr, item.id);
      card.addEventListener('click', () => this._openModal(item));
      gridEl.appendChild(card);
    }
  }

  _openModal(item) {
    const modal = document.querySelector('#modal');
    const body = modal.querySelector('#modal-body');
    body.innerHTML = '';
    const card = document.createElement(this.cardTag);
    card.setAttribute('stub', JSON.stringify(item));
    card.setAttribute(this.idAttr, item.id);
    card.setAttribute('expanded', '');
    body.appendChild(card);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}
