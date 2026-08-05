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
    scroll-margin-top: calc(140px * var(--ui-scale, 1));   /* шапка sticky — иначе якорь уезжает под неё */
  }

  .sheet {
    background: var(--paper);
    color: var(--ink);
    padding: calc(56px * var(--ui-scale, 1)) calc(72px * var(--ui-scale, 1)) calc(48px * var(--ui-scale, 1));
    border: calc(1px * var(--ui-scale, 1)) solid var(--rule);
    border-top: calc(6px * var(--ui-scale, 1)) solid var(--accent-alt);
  }

  header { margin-bottom: calc(34px * var(--ui-scale, 1)); }

  .num {
    font-family: var(--font-display);
    font-size: calc(92px * var(--ui-scale, 1));
    font-weight: 900;
    line-height: 0.8;
    color: var(--accent-alt);
    letter-spacing: -0.04em;
  }
  h2 {
    margin: calc(14px * var(--ui-scale, 1)) 0 0;
    /* Nolde. Курсив на нём запрещён — файла начертания нет, браузер
       синтезирует наклон, и на 46 px это видно как дефект засечек. §8 */
    font-family: var(--font-display);
    font-style: normal;
    font-size: calc(46px * var(--ui-scale, 1));
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
  }
  .lede {
    margin: calc(18px * var(--ui-scale, 1)) 0 0;
    /* 21 Cent — курсивное начертание у него есть, подключено в fonts.css */
    font-family: var(--font-body);
    font-style: italic;
    font-size: calc(27px * var(--ui-scale, 1));
    line-height: 1.4;
    color: var(--ink-soft);
    max-width: 46em;
  }

  .body p {
    margin: 0 0 calc(26px * var(--ui-scale, 1));
    font-family: var(--font-body);
    font-size: calc(25px * var(--ui-scale, 1));
    line-height: 1.62;
    color: var(--ink);
    max-width: 42em;      /* мера строки: длиннее с полутора метров не читается */
  }
  .body p:last-child { margin-bottom: 0; }

  /* ── ожидаемые иллюстрации ─────────────────────────────────────────────
     Заказчик не поставил 21 иллюстрацию, и в источнике они перечислены
     строками «Нужно подобрать: …». До сих пор эти строки лежали в данных
     и не рисовались — раздел про город без единого вида города выглядел
     ЗАКОНЧЕННЫМ, то есть замыслом, а не дыркой.

     §2: затычка не должна выглядеть готовой, приёмка обязана отличать
     недоделку от поставки. Отсюда пунктир и явный счёт: посетителю это
     читается спокойно («подбирается»), приёмке — однозначно.

     Пунктир, а не рамка: сплошная рамка выглядит как оформленный блок,
     то есть как решение. Пунктир читается как незаполненное место. */
  .wanted {
    margin: calc(34px * var(--ui-scale, 1)) 0 0;
    padding: calc(24px * var(--ui-scale, 1)) calc(28px * var(--ui-scale, 1));
    border: calc(2px * var(--ui-scale, 1)) dashed var(--ink-faint);
  }
  .wanted-title {
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: calc(14px * var(--ui-scale, 1));
  }
  .wanted ul {
    margin: 0;
    padding-left: calc(22px * var(--ui-scale, 1));
  }
  .wanted li {
    font-family: var(--font-body);
    font-size: calc(21px * var(--ui-scale, 1));
    line-height: 1.45;
    color: var(--ink-soft);
    margin-bottom: calc(6px * var(--ui-scale, 1));
  }
  .wanted li:last-child { margin-bottom: 0; }

  /* ── связи ─────────────────────────────────────────────────────────── */
  .refs { margin-top: calc(44px * var(--ui-scale, 1)); padding-top: calc(28px * var(--ui-scale, 1)); border-top: calc(1px * var(--ui-scale, 1)) solid var(--rule); }
  .refs-title {
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: calc(20px * var(--ui-scale, 1));
  }
  /* Сетка, а не flex-wrap: у плашек разная длина подписи, и во flex каждая
     сжимается по своему содержимому — колонки не выстраиваются, ряды идут
     лесенкой. Равные колонки читаются как список, а не как россыпь. */
  .chips {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(calc(320px * var(--ui-scale, 1)), 1fr));
    gap: calc(16px * var(--ui-scale, 1));
  }

  a.chip {
    --camp-color: var(--accent-alt);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: calc(6px * var(--ui-scale, 1));
    min-height: var(--touch-hit, 120px);
    padding: calc(18px * var(--ui-scale, 1)) calc(26px * var(--ui-scale, 1));
    text-decoration: none;
    color: var(--ink);
    background: var(--paper-pure);
    border: calc(1px * var(--ui-scale, 1)) solid var(--rule);
    border-left: calc(8px * var(--ui-scale, 1)) solid var(--camp-color);
    transition: transform .12s, background .12s;
  }
  /* Только :active. Тач-палец не наводится, :hover в киоске запрещён (§8). */
  a.chip:active { transform: translateX(calc(3px * var(--ui-scale, 1))); background: var(--paper); }

  .chip .kind {
    font-family: var(--font-mono);
    font-size: calc(13px * var(--ui-scale, 1));
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .chip .name {
    font-family: var(--font-body);
    font-size: calc(22px * var(--ui-scale, 1));
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
  <div class="wanted" hidden>
    <div class="wanted-title"></div>
    <ul></ul>
  </div>
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
      this._renderWanted($('.wanted'), s.media_wanted_ru || []);
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

    /**
     * Заявки «нужно подобрать» — место под иллюстрацию, которой ещё нет.
     *
     * Рисуется ИМЕННО ПОТОМУ, что иллюстрации нет: пустая секция читалась бы
     * как задуманная, и приёмка не отличила бы недоделку от поставки (§2).
     * Пропадёт сама, когда заказчик поставит изображения и строки уйдут
     * из источника, — отдельной уборки не потребует.
     */
    _renderWanted(block, list) {
      if (!list.length) { block.hidden = true; return; }
      block.hidden = false;

      var n = list.length;
      var word = (n % 10 === 1 && n % 100 !== 11) ? 'иллюстрация'
        : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'иллюстрации'
        : 'иллюстраций';
      block.querySelector('.wanted-title').textContent =
        'Подбирается ' + n + ' ' + word;

      var ul = block.querySelector('ul');
      list.forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
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
