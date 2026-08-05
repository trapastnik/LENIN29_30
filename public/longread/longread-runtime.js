/* ┌────────────────────────────────────────────────────────────────┐
   │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.               │
   │  Источник:  src/components/longread-*.js                       │
   │  Генератор: node scripts/simbirsk/build-longread.mjs           │
   └────────────────────────────────────────────────────────────────┘

   Классический скрипт, не модуль: киоск работает с file://, где внешние
   module-скрипты блокируются CORS. Правил src/components/longread-*.js —
   прогони генератор и закоммить и исходник, и этот файл.  CLAUDE.md §5.

   Собрано из: longread-media.js, longread-section.js, longread-view.js */

/* ── longread-media.js ───────────────────────────────────────────── */
// <longread-media> — слот иллюстрации лонгрида.
//
// КЛАССИЧЕСКИЙ СКРИПТ, НЕ МОДУЛЬ. Киоск запускается с file://, где внешние
// module-скрипты блокируются CORS, а классические исполняются. Отсюда IIFE
// и отсутствие import/export во всех longread-*.js.  CLAUDE.md §5.
//
// Главное про этот компонент: в исходнике заказчика НЕТ НИ ОДНОГО файла
// изображения — только 13 ссылок на госкаталог и 21 заявка «нужно подобрать».
// Поэтому пустой слот здесь — норма, а не сбой, и ведёт он себя соответственно:
// без файла компонент не рисует НИЧЕГО. Ни рамки, ни «фото будет позже», ни
// серого прямоугольника. Раздел без иллюстраций обязан выглядеть законченным,
// а не сломанным, — заглушка ровно этому и мешает.
//
// Аннотация при этом не теряется: она лежит в json и в
// content-src/simbirsk-media-wanted.md, откуда её забирает заказчик.

(function () {
  'use strict';

  var TEMPLATE = `
<style>
  :host { display: block; margin: calc(34px * var(--ui-scale, 1)) 0; }
  :host([hidden]) { display: none; }

  figure { margin: 0; }

  /* Лайтбокс и вёрстка НЕ АПСКЕЙЛЯТ: у 44 % фонда длинная сторона < 1600 px
     (CLAUDE.md §9). Ширину ограничиваем нативом оригинала, который приезжает
     в data.w; без него — просто не растягиваем сверх колонки. Для временных
     изображений это критично вдвойне: превью госкаталога — 800 px по длинной
     стороне, растянутое до колонки оно выглядит как брак печати. */
  .frame {
    position: relative;
    max-width: 100%;
    border: calc(1px * var(--ui-scale, 1)) solid var(--rule);
    background: var(--paper-pure);
    box-shadow: 0 calc(6px * var(--ui-scale, 1)) calc(22px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.22);
  }
  img { display: block; width: 100%; height: auto; }

  /* Операционная карта на месте иллюстрации. Компонент зоны maps, тег, а не
     правка (§10).

     Высота нужна явная: у :host компонента height 100%, то есть он берёт её
     у родителя, а у родителя её нет — без этого карта схлопнется в ноль
     и «не покажется» без единой ошибки.

     Фон перебиваем на бумажный. У компонента :host залит «шахматкой» —
     она показывает прозрачность растра и уместна на стенде карт, а в статье
     читается как отладочная текстура. Внешнее правило перебивает :host
     по каскаду, компонент при этом не тронут.

     Высота подобрана под ПРОПОРЦИЮ схемы, а не на глаз. Кадр у обеих
     почти квадратный (viewBox 30.9 × 32.9), и при высоте 700 карта вписывалась
     в 624 из 1032 по ширине — 40 % колонки уходило в пустую бумагу, а вместе
     с картой мельчали подписи городов: они заданы в единицах SVG и растут
     ровно с отрисованным размером. Высота под ширину колонки убирает и то,
     и другое разом. */
  map-unit {
    display: block;
    width: 100%;
    height: calc(1000px * var(--ui-scale, 1));
    background: var(--paper-pure);
  }

  /* ── плашка временного изображения ─────────────────────────────────────
     Не украшение и не отладка. Превью из госкаталога визуально неотличимо
     от поставленного музеем файла, и без пометки на приёмке его засчитают
     за готовую иллюстрацию — а права на него не выкуплены. Поэтому плашка
     непрозрачная, поверх картинки и в самом заметном углу. */
  .stub {
    position: absolute;
    top: 0;
    left: 0;
    padding: calc(10px * var(--ui-scale, 1)) calc(18px * var(--ui-scale, 1));
    background: var(--accent-alt);
    color: var(--paper-white);
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.22em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  /* Держатель и номер по книге поступлений — по ним заказчик понимает,
     у кого и что просить. Строкой ниже подписи, тем же мелким кеглем,
     что и инвентарный номер. */
  .holder {
    margin-top: calc(6px * var(--ui-scale, 1));
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.08em;
    color: var(--accent-alt);
  }

  figcaption {
    margin-top: calc(14px * var(--ui-scale, 1));
    font-family: var(--font-body);
    font-size: calc(20px * var(--ui-scale, 1));
    line-height: 1.45;
    color: var(--ink-soft);
  }
  /* Инвентарный номер — отдельной строкой мелким кеглем. Музейное требование:
     слепив его с аннотацией, получишь абзац текста под фото. */
  .inv {
    margin-top: calc(6px * var(--ui-scale, 1));
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.12em;
    color: var(--ink-faint);
  }
</style>
<figure>
  <div class="frame">
    <img alt="">
    <div class="stub" hidden>Временное изображение</div>
  </div>
  <figcaption></figcaption>
  <div class="inv"></div>
  <div class="holder" hidden></div>
</figure>`;

  /** Есть ли что показывать: файл изображения либо операционная карта.
   *  Пустой слот не рисуется вообще — см. шапку. */
  function isRenderable(m) {
    return !!(m && (m.file || m.map_id));
  }

  class LongreadMedia extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = null;
    }

    set data(value) {
      this._data = value;
      this._render();
    }

    get data() { return this._data; }

    _render() {
      var m = this._data;

      if (!isRenderable(m)) {
        // Пусто и молча: ни разметки, ни высоты, ни места в потоке.
        this.shadowRoot.innerHTML = '';
        this.hidden = true;
        return;
      }

      this.hidden = false;
      this.shadowRoot.innerHTML = TEMPLATE;

      // Карта вместо снимка. Ставим map-id СРАЗУ в разметке, до вставки
      // в документ: так требует docs/map-unit-api.md — иначе компонент
      // грузится дважды.
      if (m.map_id) {
        var img0 = this.shadowRoot.querySelector('img');
        var unit = document.createElement('map-unit');
        unit.setAttribute('map-id', m.map_id);
        // Панель слоёв НЕ включаем. В лонгриде карта — иллюстрация, а не
        // пульт: панель из семи чекбоксов и кнопок «Все вкл / Все выкл /
        // Сброс» закрывает собой саму схему, ради которой всё и делалось.
        // Слои включены по умолчанию из map.json — этого здесь достаточно.
        img0.replaceWith(unit);
        this._finishCaption(m);
        return;
      }

      var tier = (m.tiers && m.tiers.indexOf('lg') >= 0) ? 'lg' : 'sm';
      var img = this.shadowRoot.querySelector('img');
      // file отсчитывается от public/content/ — общая конвенция проекта,
      // а не от корня сборки. Отсюда префикс. У временных изображений путь
      // начинается с «../», потому что они лежат в public/longread/;
      // «content/../longread/…» браузер нормализует сам.
      img.src = window.MTK_URL('content/' + m.file + '-' + tier + '.webp');
      img.alt = m.caption_ru || '';
      // Предел по нативу оригинала — но в логических пикселях, поэтому тоже
      // множится на --ui-scale. Без множителя картинка на киоске осталась бы
      // вдвое мельче окружающего текста: он удвоился, она нет.
      //
      // Да, на 4K превью в 800 px при этом раскладывается в 1600 и мылит.
      // Это цена ВРЕМЕННОГО изображения, а не ошибка вёрстки: выкупленный
      // оригинал приезжает тиром lg 2400×1500 и покрывает удвоение с запасом.
      // Держать картинку резкой ценой «марки» рядом с полусотенным кеглем —
      // хуже: так ломается вся полоса, а не одна иллюстрация.
      if (m.w) {
        this.shadowRoot.querySelector('.frame').style.maxWidth =
          'calc(' + m.w + 'px * var(--ui-scale, 1))';
      }

      this._finishCaption(m);
    }

    /** Подпись, инв. номер и пометки — общие и для снимка, и для карты. */
    _finishCaption(m) {
      var cap = this.shadowRoot.querySelector('figcaption');
      cap.textContent = m.caption_ru || '';
      cap.hidden = !m.caption_ru;

      var inv = this.shadowRoot.querySelector('.inv');
      inv.textContent = m.inv_ru || '';
      inv.hidden = !m.inv_ru;

      // Временное изображение: плашка поверх картинки и строка «у кого просить».
      this.shadowRoot.querySelector('.stub').hidden = !m.placeholder;

      var holder = this.shadowRoot.querySelector('.holder');
      var line = [m.holder_ru, m.kp_no].filter(Boolean).join(' · ');
      holder.textContent = line;
      // Держателя показываем только у временных: у выкупленного оригинала
      // эту роль играет инвентарный номер, и две строки подряд дублируют себя.
      holder.hidden = !(m.placeholder && line);
    }
  }

  LongreadMedia.isRenderable = isRenderable;
  window.LongreadMedia = LongreadMedia;
  customElements.define('longread-media', LongreadMedia);
})();

/* ── longread-section.js ─────────────────────────────────────────── */
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

/* ── longread-view.js ────────────────────────────────────────────── */
// <longread-view longread-id="simbirsk"> — сборка лонгрида целиком:
// титул, 11 разделов, оглавление и пагинатор.
//
// КЛАССИЧЕСКИЙ СКРИПТ, НЕ МОДУЛЬ — см. шапку longread-media.js.
//
// Данные НЕ загружаются: они уже лежат в window.MTK_LONGREADS, куда их кладёт
// content/longreads/<id>.data.js, подключённый обычным <script> до этого файла.
// Под file:// (а киоск запускается именно так) fetch запрещён, и раздел,
// который тянет свой json по сети, окажется пустым БЕЗ ошибки в консоли.
//
// Навигация по 11 разделам на тач-столе: вертикальному оглавлению сбоку нужно
// 11 × 120 px тач-цели = 1320 px, а экран 1080 логических. Поэтому оглавление —
// не колонка, а полноэкранный слой по кнопке, где строки полноразмерные
// и список сам прокручивается.
//
// Один непрерывный сеанс (§1): наблюдатель и слушатели снимаются
// в disconnectedCallback, ничего не копится.

(function () {
  'use strict';

  var TEMPLATE = `
<style>
  :host { display: block; }

  .wrap {
    width: 100%;
    max-width: calc(1180px * var(--ui-scale, 1));
    margin: 0 auto;
    padding: 0 calc(32px * var(--ui-scale, 1)) calc(220px * var(--ui-scale, 1));   /* хвост под пагинатор, чтобы он не закрывал текст */
  }

  /* ── титул ─────────────────────────────────────────────────────────── */
  .hero {
    padding: calc(64px * var(--ui-scale, 1)) 0 calc(52px * var(--ui-scale, 1));
    color: var(--ink-on-dark);
  }
  .hero .kicker {
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--brass);
    margin-bottom: calc(22px * var(--ui-scale, 1));
  }
  .hero h1 {
    margin: 0;
    /* Nolde, прямое начертание: курсива у него нет (§8) */
    font-family: var(--font-display);
    font-style: normal;
    font-size: calc(78px * var(--ui-scale, 1));
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: -0.015em;
    color: var(--brass);
    max-width: 18em;
  }
  .hero .dates {
    margin-top: calc(26px * var(--ui-scale, 1));
    font-family: var(--font-mono);
    font-size: calc(20px * var(--ui-scale, 1));
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--telegrey-4);
  }
  .hero .rule {
    margin-top: calc(34px * var(--ui-scale, 1));
    height: calc(2px * var(--ui-scale, 1));
    background: var(--brass);
    opacity: 0.55;
    transform: skewX(var(--brand-skew, -15deg));
  }

  .sections { display: flex; flex-direction: column; gap: calc(40px * var(--ui-scale, 1)); }

  /* ── подвал: источники и примечания ────────────────────────────────── */
  .tail {
    margin-top: calc(56px * var(--ui-scale, 1));
    padding: calc(40px * var(--ui-scale, 1)) calc(48px * var(--ui-scale, 1));
    background: var(--page-bg-deep);
    border: calc(1px * var(--ui-scale, 1)) solid var(--rule);
    color: var(--telegrey-4);
  }
  .tail h3 {
    margin: 0 0 calc(18px * var(--ui-scale, 1));
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--brass);
    font-weight: 400;
  }
  .tail ul { margin: 0 0 calc(28px * var(--ui-scale, 1)); padding-left: calc(24px * var(--ui-scale, 1)); }
  .tail li {
    font-family: var(--font-body);
    font-size: calc(19px * var(--ui-scale, 1));
    line-height: 1.5;
    margin-bottom: calc(12px * var(--ui-scale, 1));
  }
  .tail li:last-child { margin-bottom: 0; }
  .tail .grp:last-child ul { margin-bottom: 0; }
  /* Ссылка в подвале — это библиография, а не переход: киоск офлайн,
     нажимать там некуда. Показываем как текст, серым. */
  .tail .url {
    display: block;
    font-family: var(--font-mono);
    font-size: calc(15px * var(--ui-scale, 1));
    color: var(--slate-window);
    word-break: break-all;
    margin-top: calc(4px * var(--ui-scale, 1));
  }

  /* ── пагинатор ─────────────────────────────────────────────────────── */
  /* Колонкой, а не строкой: на 1920 колонка чтения занимает 1180 по центру,
     справа остаётся 370 — горизонтальная плашка с двумя тач-целями по 120
     не помещается и наезжает на текст. Вертикальная влезает с запасом,
     а стрелки ↑/↓ на ней читаются вернее, чем на горизонтальной. */
  .pager {
    position: fixed;
    right: calc(40px * var(--ui-scale, 1));
    bottom: calc(40px * var(--ui-scale, 1));
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(10px * var(--ui-scale, 1));
    padding: calc(16px * var(--ui-scale, 1)) calc(12px * var(--ui-scale, 1));
    background: var(--page-bg-deep);
    border: calc(1.5px * var(--ui-scale, 1)) solid var(--brass);
    border-radius: 999px;
    box-shadow: 0 calc(12px * var(--ui-scale, 1)) calc(40px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.55);
  }
  .pager button {
    width: var(--touch-hit, 120px);
    height: var(--touch-hit, 120px);
    min-width: var(--touch-hit, 120px);
    min-height: var(--touch-hit, 120px);
    border-radius: 50%;
    border: calc(1.5px * var(--ui-scale, 1)) solid var(--brass);
    background: transparent;
    color: var(--brass);
    font-family: var(--font-display);
    font-size: calc(40px * var(--ui-scale, 1));
    line-height: 1;
    transition: background .14s, color .14s, transform .14s;
  }
  .pager button:active { background: var(--brass); color: var(--page-bg-deep); transform: scale(0.96); }
  .pager button[disabled] { opacity: 0.3; }
  .pager .counter {
    text-align: center;
    font-family: var(--font-mono);
    font-size: calc(20px * var(--ui-scale, 1));
    letter-spacing: 0.16em;
    color: var(--telegrey-4);
    padding: calc(2px * var(--ui-scale, 1)) 0;
  }
  .pager .counter b { color: var(--brass); font-weight: 400; }

  /* ── оглавление ────────────────────────────────────────────────────── */
  .toc {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    justify-content: center;
    background: rgba(0, 0, 0, 0.86);
  }
  .toc[hidden] { display: none; }
  /* Панель начинается ПОД шапкой страницы, и это не косметика. Шапка лежит
     в light DOM с z-index 5, а лонгрид — внутри main, которому pages.css
     задаёт «body > * { z-index: 1 }». Слой оглавления заперт в этом контексте
     наложения: сколько ему ни ставь z-index, шапка всё равно рисуется поверх,
     и крестик закрытия оказывается под её кнопками. Отступ сверху убирает
     пересечение, а шапка остаётся доступной — «Разделы» закрывают повторным
     нажатием. Значение — высота .page-header (≈142) плюс воздух. */
  .toc-panel {
    width: min(calc(1080px * var(--ui-scale, 1)), calc(100vw - calc(96px * var(--ui-scale, 1))));
    max-height: calc(100vh - calc(200px * var(--ui-scale, 1)));
    margin-top: calc(160px * var(--ui-scale, 1));
    display: flex;
    flex-direction: column;
    background: var(--page-bg-deep);
    border: calc(1.5px * var(--ui-scale, 1)) solid var(--brass);
  }
  .toc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(24px * var(--ui-scale, 1));
    padding: calc(26px * var(--ui-scale, 1)) calc(32px * var(--ui-scale, 1));
    border-bottom: calc(1.5px * var(--ui-scale, 1)) solid var(--brass);
  }
  .toc-head .t {
    font-family: var(--font-mono);
    font-size: calc(17px * var(--ui-scale, 1));
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--brass);
  }
  .toc-close {
    width: calc(72px * var(--ui-scale, 1)); height: calc(72px * var(--ui-scale, 1));
    min-width: calc(72px * var(--ui-scale, 1)); min-height: calc(72px * var(--ui-scale, 1));
    border-radius: 50%;
    border: calc(1.5px * var(--ui-scale, 1)) solid var(--brass);
    background: var(--signal-red);
    color: var(--paper-white);
    font-size: calc(34px * var(--ui-scale, 1));
    line-height: 1;
  }
  /* Зона нажатия добирается до нормы §1, видимый кружок остаётся 72:
     кнопка закрытия в 120 px выглядела бы плашкой рядом с заголовком панели.
     Тот же приём, что у .back-link в pages.css и у кнопки «Разделы».
     Замерено попаданием: до этого зона была 72 при норме 120 — в стилях
     этого не видно, промах виден только пальцем. */
  .toc-close { position: relative; }
  .toc-close::before {
    content: '';
    position: absolute;
    left: 50%; top: 50%;
    width: var(--touch-hit, 120px);
    height: var(--touch-hit, 120px);
    transform: translate(-50%, -50%);
  }
  .toc-close:active { transform: scale(0.96); }

  .toc-list { overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .toc-item {
    display: flex;
    align-items: center;
    gap: calc(28px * var(--ui-scale, 1));
    width: 100%;
    min-height: var(--touch-hit, 120px);
    padding: calc(20px * var(--ui-scale, 1)) calc(32px * var(--ui-scale, 1));
    text-align: left;
    background: transparent;
    border: 0;
    border-bottom: calc(1px * var(--ui-scale, 1)) solid var(--rule);
    color: var(--ink-on-dark);
  }
  .toc-item:active { background: rgba(210, 183, 115, 0.22); }
  .toc-item[aria-current='true'] { background: rgba(210, 183, 115, 0.13); }
  .toc-item .n {
    flex: 0 0 auto;
    width: calc(78px * var(--ui-scale, 1));
    font-family: var(--font-display);
    font-size: calc(44px * var(--ui-scale, 1));
    font-weight: 900;
    line-height: 1;
    color: var(--brass);
  }
  .toc-item .txt { display: flex; flex-direction: column; gap: calc(6px * var(--ui-scale, 1)); min-width: 0; }
  .toc-item .ttl {
    font-family: var(--font-body);
    font-size: calc(27px * var(--ui-scale, 1));
    line-height: 1.2;
  }
  .toc-item .sub {
    font-family: var(--font-body);
    font-style: italic;
    font-size: calc(19px * var(--ui-scale, 1));
    line-height: 1.3;
    color: var(--slate-window);
  }
</style>

<div class="wrap">
  <div class="hero">
    <div class="kicker"></div>
    <h1></h1>
    <div class="dates"></div>
    <div class="rule"></div>
  </div>
  <div class="sections"></div>
  <div class="tail"></div>
</div>

<div class="pager">
  <button class="prev" type="button" aria-label="Предыдущий раздел">↑</button>
  <div class="counter"><b class="cur">01</b> / <span class="all">11</span></div>
  <button class="next" type="button" aria-label="Следующий раздел">↓</button>
</div>

<div class="toc" hidden>
  <div class="toc-panel">
    <div class="toc-head">
      <div class="t">Разделы</div>
      <button class="toc-close" type="button" aria-label="Закрыть оглавление">×</button>
    </div>
    <div class="toc-list"></div>
  </div>
</div>`;

  class LongreadView extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = null;
      this._sections = [];
      this._current = 0;
      this._observer = null;
      this._raf = 0;
      this._settle = 0;
      this._navLock = false;
      this._onKey = this._onKey.bind(this);
    }

    connectedCallback() {
      if (this._built) return;
      var id = this.getAttribute('longread-id');
      var store = window.MTK_LONGREADS || {};
      this._data = store[id];
      if (!this._data) {
        // Данных нет — значит .data.js не подключён или подключён после
        // компонента. Молчать нельзя: под file:// это самый вероятный отказ.
        console.error('[longread-view] нет данных «' + id + '» в window.MTK_LONGREADS — '
          + 'подключи content/longreads/' + id + '.data.js ДО компонентов');
        return;
      }
      this._build();
      this._built = true;
    }

    disconnectedCallback() {
      // Один непрерывный сеанс: за час всё, что не снято, становится утечкой.
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
      if (this._settle) { clearTimeout(this._settle); this._settle = 0; }
      document.removeEventListener('keydown', this._onKey);
    }

    /** Публично — им пользуется кнопка «Разделы» в шапке страницы. */
    openToc() { this.shadowRoot.querySelector('.toc').hidden = false; }
    closeToc() { this.shadowRoot.querySelector('.toc').hidden = true; }

    _build() {
      var self = this;
      var d = this._data;
      this.shadowRoot.innerHTML = TEMPLATE;
      var $ = this.shadowRoot.querySelector.bind(this.shadowRoot);

      $('.hero .kicker').textContent = 'Лонгрид · ' + d.sections.length + ' разделов';
      $('.hero h1').textContent = d.title_ru;
      $('.hero .dates').textContent = (d.dates && d.dates.display_ru) || '';

      // ── разделы
      var host = $('.sections');
      d.sections.forEach(function (s) {
        var el = document.createElement('longread-section');
        el.data = { section: s, labels: d.ref_labels || {} };
        host.appendChild(el);
        self._sections.push(el);
      });

      this._buildTail($('.tail'), d);
      this._buildToc($('.toc-list'), d);

      // ── пагинатор
      $('.all').textContent = String(d.sections.length).padStart(2, '0');
      $('.prev').addEventListener('click', function () { self._go(self._current - 1); });
      $('.next').addEventListener('click', function () { self._go(self._current + 1); });
      $('.toc-close').addEventListener('click', function () { self.closeToc(); });
      $('.toc').addEventListener('click', function (e) {
        if (e.target === $('.toc')) self.closeToc();   // тап по затемнению
      });
      document.addEventListener('keydown', this._onKey);

      this._watch();
      this._syncPager();
    }

    _buildTail(host, d) {
      var groups = [];
      if (d.notes_ru && d.notes_ru.length) {
        groups.push({ title: 'Примечания', items: d.notes_ru.map(function (t) {
          return { text: t, url: null };
        }) });
      }
      if (d.sources && d.sources.length) {
        groups.push({ title: 'Литература и карты', items: d.sources.map(function (s) {
          return { text: s.title_ru || '', url: s.url };
        }) });
      }
      if (!groups.length) { host.hidden = true; return; }

      groups.forEach(function (g) {
        var box = document.createElement('div');
        box.className = 'grp';
        var h = document.createElement('h3');
        h.textContent = g.title;
        var ul = document.createElement('ul');
        g.items.forEach(function (it) {
          var li = document.createElement('li');
          li.textContent = it.text;
          if (it.url) {
            var u = document.createElement('span');
            u.className = 'url';
            u.textContent = it.url;
            li.appendChild(u);
          }
          ul.appendChild(li);
        });
        box.appendChild(h);
        box.appendChild(ul);
        host.appendChild(box);
      });
    }

    _buildToc(list, d) {
      var self = this;
      d.sections.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'toc-item';
        b.dataset.i = String(i);

        var n = document.createElement('span');
        n.className = 'n';
        n.textContent = String(s.n).padStart(2, '0');

        var txt = document.createElement('span');
        txt.className = 'txt';
        var ttl = document.createElement('span');
        ttl.className = 'ttl';
        ttl.textContent = s.title_ru;
        txt.appendChild(ttl);
        if (s.lede_ru) {
          var sub = document.createElement('span');
          sub.className = 'sub';
          sub.textContent = s.lede_ru;
          txt.appendChild(sub);
        }

        b.appendChild(n);
        b.appendChild(txt);
        b.addEventListener('click', function () { self.closeToc(); self._go(i); });
        list.appendChild(b);
      });
    }

    /** Подсветка текущего раздела. IntersectionObserver, а не onscroll:
     *  обработчик скролла на 11 секциях по 16 тысяч знаков даёт заметный
     *  джанк на тач-столе, а наблюдатель считает за нас и вне главного потока. */
    _watch() {
      var self = this;
      this._observer = new IntersectionObserver(function (entries) {
        // Пока идёт переход по оглавлению или пагинатору, наблюдатель молчит.
        // Его отчёты доставляются асинхронно и описывают положение НА МОМЕНТ
        // замера: самый первый приходит уже после нажатия и рассказывает, что
        // виден раздел 1, — счётчик отщёлкивал назад на «01», хотя страница
        // уже стояла на восьмом. Замок снимается, когда переход завершён.
        if (self._navLock) return;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = self._sections.indexOf(e.target);
          if (i >= 0) { self._current = i; self._syncPager(); }
        });
      }, { rootMargin: '-45% calc(0px * var(--ui-scale, 1)) -50% calc(0px * var(--ui-scale, 1))', threshold: 0 });

      this._sections.forEach(function (el) { self._observer.observe(el); });
    }

    _go(i) {
      if (i < 0 || i >= this._sections.length) return;
      this._current = i;
      this._scrollToSection(this._sections[i]);
      this._syncPager();
    }

    /**
     * Прокрутка к разделу собственным rAF-твином.
     *
     * Почему свой твин, а не scrollIntoView({behavior:'smooth'}): плавная
     * прокрутка браузера живёт на кадрах анимации, и когда кадров нет, она
     * молча не делает НИЧЕГО — счётчик разделов при этом честно перещёлкивает,
     * то есть интерфейс врёт.
     *
     * Свой твин этим страдает ровно так же, поэтому итог здесь НЕ ЗАВИСИТ
     * от кадров. Их отсутствие — не экзотика: кадры не идут у фоновой вкладки,
     * при выключенной композиции, под удалённым рабочим столом. Причём
     * document.hidden при этом может честно говорить «видимо» — проверено:
     * visibilityState «visible», а requestAnimationFrame даёт один кадр
     * и замолкает. Отсюда два рубежа: быстрая проверка на скрытую вкладку
     * и таймер, который по истечении анимации доводит позицию до конца,
     * если кадры так и не пошли. window.scrollTo работает всегда.
     *
     * Отступ сверху берём из scroll-margin-top хоста, чтобы у якорной
     * прокрутки и у этой была одна величина, а не две разъезжающиеся.
     */
    _scrollToSection(el) {
      var self = this;
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
      if (this._settle) { clearTimeout(this._settle); this._settle = 0; }

      var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      var from = window.scrollY;
      var to = Math.max(0, Math.round(el.getBoundingClientRect().top + from - margin));
      var dist = to - from;
      var unlock = function () { self._navLock = false; };
      if (!dist) { unlock(); return; }
      this._navLock = true;

      // Длительность растёт с расстоянием, но не больше 620 мс: на киоске
      // ждать проматывания дольше — уже похоже на зависание.
      var dur = Math.min(620, 220 + Math.abs(dist) * 0.12);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0;
      // Вкладка не рисуется — кадров не будет; анимировать нечем, прыгаем.
      if (document.hidden) dur = 0;
      if (!dur) { window.scrollTo(0, to); setTimeout(unlock, 60); return; }

      var t0 = performance.now();
      var step = function (now) {
        var k = Math.min(1, (now - t0) / dur);
        var eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        window.scrollTo(0, Math.round(from + dist * eased));
        self._raf = k < 1 ? requestAnimationFrame(step) : 0;
      };
      this._raf = requestAnimationFrame(step);

      // Страховка: анимация должна была закончиться, а мы не там, куда шли —
      // значит кадров не было. Доводим позицию, чтобы счётчик разделов
      // не расходился с тем, что на экране.
      this._settle = setTimeout(function () {
        self._settle = 0;
        if (self._raf) { cancelAnimationFrame(self._raf); self._raf = 0; }
        if (Math.abs(window.scrollY - to) > 2) window.scrollTo(0, to);
        unlock();
      }, dur + 120);
    }

    _syncPager() {
      var $ = this.shadowRoot.querySelector.bind(this.shadowRoot);
      var n = this._sections.length;
      $('.cur').textContent = String(this._current + 1).padStart(2, '0');
      $('.prev').disabled = this._current === 0;
      $('.next').disabled = this._current === n - 1;

      var items = this.shadowRoot.querySelectorAll('.toc-item');
      for (var i = 0; i < items.length; i++) {
        items[i].setAttribute('aria-current', i === this._current ? 'true' : 'false');
      }
    }

    _onKey(e) {
      if (e.key === 'Escape') this.closeToc();
    }
  }

  window.LongreadView = LongreadView;
  customElements.define('longread-view', LongreadView);
})();
