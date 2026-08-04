// <state-card> — карточка государственного образования.
// Отличие от <party-card>: в expanded-режиме встраивает <map-unit> с картой территории.

import { fetchJSON } from '../data/loader.js';
import { t, onLangChange } from '../data/i18n.js';
import { richParagraphs, escapeHtml } from '../data/rich-text.js';
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
    if (name === 'state-id' && newV) {
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
    // Пока справка не загружена, рисуем из stub: заголовок, даты и лагерь
    // в нём есть, а тело справки плитке и не нужно — оно обрезано стилями.
    const d = this._data || this._stub;
    if (!d) return;
    const full = !!this._data;
    const campVar = `var(--camp-${(d.camp || 'red').replace(/_/g, '-')}, #888)`;
    this.style.setProperty('--camp-color', campVar);
    this.style.setProperty('--camp-ink',
      `var(--camp-${(d.camp || 'red').replace(/_/g, '-')}-ink, ${campVar})`);

    // Строку заказчика («Конец октября – начало ноября») цифрами не передать,
    // поэтому display_ru важнее собранного from—to (docs/content.md).
    const dates = (d.dates && d.dates.display_ru)
      || d.dates_display_ru
      || (d.dates ? (d.dates.from || '') + (d.dates.to ? ' — ' + d.dates.to : '') : '');

    // abbr_ru — массив: аббревиатур бывает несколько («РСДРП(б)», «РКП(б)»).
    // Прямая подстановка давала бы их через запятую без пробела.
    const abbr = Array.isArray(d.abbr_ru) ? d.abbr_ru.join(' · ') : (d.abbr_ru || '');
    // Разметку разбираем, а не печатаем: без этого в тексте видны
    // «[большевиков](#/party/bolsheviks)» — на 2026-08-04 таких ссылок
    // было 1197 в 91 справке из 92. Заодно экранируем: до сих пор текст
    // справки уходил в innerHTML сырым.
    const paras = richParagraphs(d.summary_ru);
    // map_id живёт ТОЛЬКО в _index.json: в самой справке его нет. Раньше
    // hasMap считался по загруженной справке и потому был всегда false —
    // карта Комуча, единственная собранная, не монтировалась никогда,
    // а на её месте стояло «карта в производстве».
    //
    // ⚠️ Полигоны территорий сюда пока не приходят, и это не одно и то же,
    // что карта. Сверено 2026-08-04: в geo/_index.json шесть записей
    // с геометрией (РСФСР, Колчак, СССР, Российская Республика, Антанта,
    // Чехословацкий корпус), в states/_index.json map_id по-прежнему один —
    // komuch, а territory_id во всех 59 справках null. Связь при этом уже
    // есть, но обратная: запись реестра несёт state_id.
    // Подключать их как map-id нельзя — полигон это контур в общей системе
    // координат (content/geo/polygons/*.svg), а map-id адресует собранную
    // карту со слоями в content/maps/. Нужен отдельный путь: база плюс
    // полигон слоем. Пока его нет, шесть собранных полигонов на экран
    // не попадают ничем.
    const mapId = d.map_id || (this._stub && this._stub.map_id) || null;
    const hasMap = !!mapId;
    const layers = (d.initial_layers || []).join(',');

    this._root.classList.remove('loading');
    this._root.innerHTML = `
      <div class="camp-stripe"></div>
      <header>
        <h2>${escapeHtml(d.title_ru)}</h2>
        ${abbr ? `<div class="abbr">${escapeHtml(abbr)}</div>` : ''}
        <div class="meta">${dates ? escapeHtml(dates) : '&nbsp;'}</div>
      </header>
      <div class="body">${paras}</div>
      ${hasMap && full
        ? `<div class="map-wrap"><map-unit map-id="${mapId}"${layers ? ` initial-layers="${layers}"` : ''} show-panel="true"></map-unit></div>`
        : `<div class="no-map">${t('Карта территории не подготовлена', 'Territory map not prepared')}</div>`}
    `;
  }
}

customElements.define('state-card', StateCard);
