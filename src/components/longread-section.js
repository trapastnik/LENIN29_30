// <longread-section> — один из 11 разделов лонгрида: заголовок, лид, текст,
// иллюстрации (если поставлены) и плашки связей с уже импортированными справками.
//
// КЛАССИЧЕСКИЙ СКРИПТ, НЕ МОДУЛЬ — см. шапку longread-media.js.
//
// Колонка светлая (--paper) на тёмном брендовом фоне страницы: 16 тысяч знаков
// читаются с бумаги, а не с железа-серого. Латунь на бумаге не годится —
// светлое по светлому нечитаемо, поэтому акцент здесь красный (--accent-alt),
// а латунь остаётся тёмным элементам: шапке и оглавлению.

(function () {
  'use strict';

  // Лагерь → токен цвета. Список закрытый и это не перестраховка: в схеме
  // контента лагерей восемь, а токенов --camp-* семь — для «uprising» цвета
  // в tokens.json нет (значился в задании m1a, в палитру не доехал).
  // Собранная на лету ссылка на несуществующий токен --camp-uprising молча
  // дала бы пустую строку и невидимую полосу, поэтому неизвестный лагерь
  // честно уходит на общий акцент.
  var CAMP_TOKEN = {
    red: 'var(--camp-red)',
    white: 'var(--camp-white)',
    'rev-dem': 'var(--camp-rev-dem)',
    green: 'var(--camp-green)',
    national: 'var(--camp-national)',
    intervention: 'var(--camp-intervention)',
  };

  var BUCKET_TITLE = {
    persons: 'Личности',
    parties: 'Партии',
    states: 'Государственные образования',
    events: 'События',
  };

  var TEMPLATE = `
<style>
  :host {
    display: block;
    scroll-margin-top: 140px;   /* шапка sticky — иначе якорь уезжает под неё */
  }

  .sheet {
    background: var(--paper);
    color: var(--ink);
    padding: 56px 72px 48px;
    border: 1px solid var(--rule);
    border-top: 6px solid var(--accent-alt);
  }

  header { margin-bottom: 34px; }

  .num {
    font-family: var(--font-display);
    font-size: 92px;
    font-weight: 900;
    line-height: 0.8;
    color: var(--accent-alt);
    letter-spacing: -0.04em;
  }
  h2 {
    margin: 14px 0 0;
    /* Nolde. Курсив на нём запрещён — файла начертания нет, браузер
       синтезирует наклон, и на 46 px это видно как дефект засечек. §8 */
    font-family: var(--font-display);
    font-style: normal;
    font-size: 46px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
  }
  .lede {
    margin: 18px 0 0;
    /* 21 Cent — курсивное начертание у него есть, подключено в fonts.css */
    font-family: var(--font-body);
    font-style: italic;
    font-size: 27px;
    line-height: 1.4;
    color: var(--ink-soft);
    max-width: 46em;
  }

  .body p {
    margin: 0 0 26px;
    font-family: var(--font-body);
    font-size: 25px;
    line-height: 1.62;
    color: var(--ink);
    max-width: 42em;      /* мера строки: длиннее с полутора метров не читается */
  }
  .body p:last-child { margin-bottom: 0; }

  /* ── связи ─────────────────────────────────────────────────────────── */
  .refs { margin-top: 44px; padding-top: 28px; border-top: 1px solid var(--rule); }
  .refs-title {
    font-family: var(--font-mono);
    font-size: 15px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: 20px;
  }
  /* Сетка, а не flex-wrap: у плашек разная длина подписи, и во flex каждая
     сжимается по своему содержимому — колонки не выстраиваются, ряды идут
     лесенкой. Равные колонки читаются как список, а не как россыпь. */
  .chips {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  a.chip {
    --camp-color: var(--accent-alt);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-height: var(--touch-hit, 120px);
    padding: 18px 26px;
    text-decoration: none;
    color: var(--ink);
    background: var(--paper-pure);
    border: 1px solid var(--rule);
    border-left: 8px solid var(--camp-color);
    transition: transform .12s, background .12s;
  }
  /* Только :active. Тач-палец не наводится, :hover в киоске запрещён (§8). */
  a.chip:active { transform: translateX(3px); background: var(--paper); }

  .chip .kind {
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .chip .name {
    font-family: var(--font-body);
    font-size: 22px;
    line-height: 1.2;
  }
</style>
<section class="sheet">
  <header>
    <div class="num"></div>
    <h2></h2>
    <p class="lede"></p>
  </header>
  <div class="body"></div>
  <div class="media"></div>
  <div class="refs">
    <div class="refs-title">Смотрите также</div>
    <div class="chips"></div>
  </div>
</section>`;

  class LongreadSection extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = null;
      this._labels = {};
    }

    /** @param {{section: object, labels: object}} value */
    set data(value) {
      this._data = value && value.section;
      this._labels = (value && value.labels) || {};
      this._render();
    }

    _render() {
      var s = this._data;
      if (!s) return;

      this.shadowRoot.innerHTML = TEMPLATE;
      var $ = this.shadowRoot.querySelector.bind(this.shadowRoot);

      this.id = 'sec-' + s.id;
      $('.num').textContent = String(s.n).padStart(2, '0');
      $('h2').textContent = s.title_ru;

      var lede = $('.lede');
      lede.textContent = s.lede_ru || '';
      lede.hidden = !s.lede_ru;

      var body = $('.body');
      (s.paragraphs_ru || []).forEach(function (text) {
        var p = document.createElement('p');
        p.textContent = text;
        body.appendChild(p);
      });

      this._renderMedia($('.media'), s.media || []);
      this._renderRefs($('.refs'), $('.chips'), s.refs || {});
    }

    _renderMedia(host, list) {
      var renderable = list.filter(window.LongreadMedia.isRenderable);
      // Ни одного файла — контейнер вообще не участвует в потоке.
      // Никаких «фото будет позже»: секция должна выглядеть законченной.
      if (!renderable.length) { host.hidden = true; return; }
      renderable.forEach(function (m) {
        var el = document.createElement('longread-media');
        el.data = m;
        host.appendChild(el);
      });
    }

    _renderRefs(block, chips, refs) {
      var labels = this._labels;
      var order = ['persons', 'parties', 'states', 'events'];
      var total = 0;

      order.forEach(function (bucket) {
        (refs[bucket] || []).forEach(function (id) {
          var meta = labels[id];
          if (!meta) return;   // подписи нет — плашка была бы немой
          total += 1;

          var a = document.createElement('a');
          a.className = 'chip';
          a.href = window.MTK_URL(meta.href);
          var token = CAMP_TOKEN[meta.camp];
          if (token) a.style.setProperty('--camp-color', token);

          var kind = document.createElement('span');
          kind.className = 'kind';
          kind.textContent = BUCKET_TITLE[bucket];
          var name = document.createElement('span');
          name.className = 'name';
          name.textContent = meta.title_ru;

          a.appendChild(kind);
          a.appendChild(name);
          chips.appendChild(a);
        });
      });

      block.hidden = total === 0;
    }
  }

  window.LongreadSection = LongreadSection;
  customElements.define('longread-section', LongreadSection);
})();
