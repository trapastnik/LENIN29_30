// <party-card> — карточка политической партии.
// Используется и как плитка в сетке, и как раскрытая карточка (атрибут expanded).

import { fetchJSON } from '../data/loader.js';
import { t, onLangChange } from '../data/i18n.js';
import { richParagraphs, escapeHtml } from '../data/rich-text.js';
import { railHTML, wireRail } from '../data/related-rail.js';

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
  /* Подсветка разметки справок. Живёт здесь, а не в src/data/rich-text.js,
     потому что --camp-ink и --camp-color ставит этот же компонент через
     setProperty: правило и свойство должны лежать вместе, иначе brand-lint
     справедливо считает их ссылками на несуществующий токен. */
  .rt-ref {
    color: var(--camp-ink, var(--camp-color, currentColor));
    border-bottom: 1px dotted var(--camp-ink, var(--camp-color, currentColor));
  }
  .rt-unresolved { color: var(--camp-ink, var(--camp-color, currentColor)); font-weight: 700; }
  .rt-em { font-weight: 600; }

  /* ── Рельс связанных справок (только в раскрытой карточке) ──────────────
     Двухколоночный layout: чтение слева, связи справа. Экран горизонтальный,
     справка до 5500 знаков — нижний блок ушёл бы под сгиб, поэтому рельс
     сбоку и на виду. Каркас: вид чипа (точка/кольцо/метка) отдаёт design
     примитивом brand.html#c-related. */
  :host([expanded]) #root:has(.related-rail) {
    display: grid;
    grid-template-columns: 1fr minmax(320px, 380px);
    grid-template-areas: "stripe stripe" "reading rail";
  }
  :host([expanded]) #root:has(.related-rail) .camp-stripe { grid-area: stripe; }
  :host([expanded]) #root:has(.related-rail) > .reading { grid-area: reading; min-width: 0; }
  .related-rail {
    grid-area: rail;
    border-left: 1px solid rgba(168, 135, 90, 0.4);
    padding: 20px 20px 24px;
    /* Свой скролл: у reds-general 37 связей, рельс сам не влезет по высоте. */
    max-height: 78vh;
    overflow-y: auto;
    align-self: stretch;
  }
  .rail-section { margin-bottom: 22px; }
  .rail-section:last-child { margin-bottom: 0; }
  .rail-section__title {
    margin: 0 0 12px;
    display: flex; align-items: baseline; gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ink-faint);
  }
  .rail-section__count {
    font-size: 11px; color: var(--ink-faint);
    border: 1px solid rgba(168, 135, 90, 0.5); border-radius: 999px;
    padding: 1px 8px;
  }
  .rail-chips { display: flex; flex-direction: column; gap: 8px; }
  .rail-chip {
    /* Управляющий элемент раздела — ≥64px (§1). Тач-цель честная. */
    min-height: 64px;
    display: flex; align-items: center; gap: 12px;
    width: 100%; text-align: left;
    padding: 8px 14px;
    background: var(--paper-light);
    border: 1px solid rgba(168, 135, 90, 0.5);
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--font-body);
    color: var(--ink-soft);
    transition: background .14s;
  }
  .rail-chip:active { background: var(--paper); }
  /* Точка-заглушка серая. Цвет лагеря и кольцо придут примитивом design. */
  .rail-chip__dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    background: var(--ink-faint);
  }
  .rail-chip__name { font-size: 15px; line-height: 1.2; }
  .rail-chip--dead {
    min-height: 64px; display: flex; align-items: center;
    padding: 8px 14px; color: var(--ink-faint); font-size: 15px;
  }
</style>
<div id="root" class="loading"></div>
`;

export class PartyCard extends HTMLElement {

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
    if (name === 'party-id' && newV) {
      this._id = newV;
      if (this.hasAttribute('expanded')) this._loadOnce();
      else this._render();
    }
    if (name === 'expanded') {
      if (newV !== null) this._loadOnce();
      else this._render();
    }
  }

  // Загружаем справку ТОЛЬКО у раскрытой карточки. Плитка в сетке рисуется
  // из stub — записи индекса, которая для того и сделана самодостаточной.
  //
  // Раньше запрос уходил на установку id, то есть при отрисовке сетки летело
  // столько запросов, сколько карточек. Посетитель за сеанс открывает три-пять
  // из семидесяти — остальное грузилось в никуда.
  //
  // Порядок атрибутов не важен: id может прийти раньше expanded и наоборот,
  // поэтому загрузку запускает тот из них, который окажется вторым.
  _loadOnce() {
    if (this._data || this._loading || !this._id) { this._render(); return; }
    this._loading = true;
    this._load(this._id).finally(() => { this._loading = false; });
  }

  async _load(id) {
    try {
      this._data = await fetchJSON(MTK_URL(`content/parties/${id}.json`));
    } catch (e) {
      this._data = {
        ...(this._stub || {}),
        id,
        title_ru: (this._stub && this._stub.title_ru) || id,
        camp: (this._stub && this._stub.camp) || 'red',
        summary_ru: t('Карточка в подготовке.', 'Dossier in preparation.'),
        _placeholder: true,
      };
    }
    // Связи — только в раскрытой карточке. Один файл на весь раздел,
    // loader кэширует; провал связей не должен ронять саму справку.
    if (this.hasAttribute('expanded')) {
      try {
        const bl = await fetchJSON(MTK_URL('content/_backlinks.json'));
        this._backlinks = (bl.items && bl.items[id]) || null;
      } catch { this._backlinks = null; }
    }
    this._render();
  }

  _render() {
    // Пока справка не загружена, рисуем из stub: заголовок, даты и лагерь
    // в нём есть, а тело справки плитке и не нужно — оно обрезано стилями.
    const d = this._data || this._stub;
    if (!d) return;
    const full = !!this._data;
    const camp = (d.camp || 'red').replace(/_/g, '-');
    const campVar = `var(--camp-${camp}, currentColor)`;
    this.style.setProperty('--camp-color', campVar);
    // Начертательный вариант — для терминов в тексте: тело карточки светлое,
    // и заливочный --camp-white там даёт контраст 1.45 (см. state-card).
    this.style.setProperty('--camp-ink', `var(--camp-${camp}-ink, ${campVar})`);

    // Строку заказчика («Конец октября – начало ноября») цифрами не передать,
    // поэтому display_ru важнее собранного from—to (docs/content.md).
    const dates = (d.dates && d.dates.display_ru)
      || d.dates_display_ru
      || (d.dates ? (d.dates.from || '') + (d.dates.to ? ' — ' + d.dates.to : '') : '');

    // Разметку разбираем, а не печатаем: без этого в тексте видны
    // «[большевиков](#/party/bolsheviks)» — на 2026-08-04 таких ссылок
    // было 1197 в 91 справке из 92. Заодно экранируем: до сих пор текст
    // справки уходил в innerHTML сырым.
    const paras = richParagraphs(d.summary_ru);

    // Рельс связей — только раскрытая карточка с данными. В плитке
    // (не expanded) его нет: там и места нет, и грузить незачем.
    const expanded = this.hasAttribute('expanded');
    const рельс = (expanded && full && this._backlinks)
      ? railHTML(this._backlinks, t('ru', 'en') === 'en' ? 'en' : 'ru', 'parties.html')
      : '';

    const чтение = `
      <header>
        <h2>${escapeHtml(d.title_ru)}</h2>
        <div class="meta">${dates ? escapeHtml(dates) : '&nbsp;'}</div>
      </header>
      <div class="body">${paras}</div>
      ${d.leaders_ru && d.leaders_ru.length ? `<div class="leaders"><b>${t('Лидеры:', 'Leaders:')}</b>${escapeHtml(d.leaders_ru.join(' · '))}</div>` : ''}
    `;

    this._root.classList.remove('loading');
    // Обёртка .reading нужна только когда есть рельс (двухколоночный grid);
    // без него оставляем плоскую разметку — плитка не должна менять вид.
    this._root.innerHTML = рельс
      ? `<div class="camp-stripe"></div><div class="reading">${чтение}</div>${рельс}`
      : `<div class="camp-stripe"></div>${чтение}`;

    if (рельс) {
      const nav = this._root.querySelector('.related-rail');
      // onOwn: связь на этой же странице — открыть той же модалкой.
      // Просим родителя (parties.html) через событие: карточка не знает
      // про индекс и openModal, а страница знает.
      wireRail(nav, (id) => {
        this.dispatchEvent(new CustomEvent('rail-open', {
          detail: { id }, bubbles: true, composed: true,
        }));
      });
    }
  }
}

customElements.define('party-card', PartyCard);
