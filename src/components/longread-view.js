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
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 32px 220px;   /* хвост под пагинатор, чтобы он не закрывал текст */
  }

  /* ── титул ─────────────────────────────────────────────────────────── */
  .hero {
    padding: 64px 0 52px;
    color: var(--ink-on-dark);
  }
  .hero .kicker {
    font-family: var(--font-mono);
    font-size: 15px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--brass);
    margin-bottom: 22px;
  }
  .hero h1 {
    margin: 0;
    /* Nolde, прямое начертание: курсива у него нет (§8) */
    font-family: var(--font-display);
    font-style: normal;
    font-size: 78px;
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: -0.015em;
    color: var(--brass);
    max-width: 18em;
  }
  .hero .dates {
    margin-top: 26px;
    font-family: var(--font-mono);
    font-size: 20px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--telegrey-4);
  }
  .hero .rule {
    margin-top: 34px;
    height: 2px;
    background: var(--brass);
    opacity: 0.55;
    transform: skewX(var(--brand-skew));
  }

  .sections { display: flex; flex-direction: column; gap: 40px; }

  /* ── подвал: источники и примечания ────────────────────────────────── */
  .tail {
    margin-top: 56px;
    padding: 40px 48px;
    background: var(--page-bg-deep);
    border: 1px solid var(--rule);
    color: var(--telegrey-4);
  }
  .tail h3 {
    margin: 0 0 18px;
    font-family: var(--font-mono);
    font-size: 15px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--brass);
    font-weight: 400;
  }
  .tail ul { margin: 0 0 28px; padding-left: 24px; }
  .tail li {
    font-family: var(--font-body);
    font-size: 19px;
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .tail li:last-child { margin-bottom: 0; }
  .tail .grp:last-child ul { margin-bottom: 0; }
  /* Ссылка в подвале — это библиография, а не переход: киоск офлайн,
     нажимать там некуда. Показываем как текст, серым. */
  .tail .url {
    display: block;
    font-family: var(--font-mono);
    font-size: 15px;
    color: var(--slate-window);
    word-break: break-all;
    margin-top: 4px;
  }

  /* ── пагинатор ─────────────────────────────────────────────────────── */
  /* Колонкой, а не строкой: на 1920 колонка чтения занимает 1180 по центру,
     справа остаётся 370 — горизонтальная плашка с двумя тач-целями по 120
     не помещается и наезжает на текст. Вертикальная влезает с запасом,
     а стрелки ↑/↓ на ней читаются вернее, чем на горизонтальной. */
  .pager {
    position: fixed;
    right: 40px;
    bottom: 40px;
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px 12px;
    background: var(--page-bg-deep);
    border: 1.5px solid var(--brass);
    border-radius: 999px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  }
  .pager button {
    width: var(--touch-hit);
    height: var(--touch-hit);
    min-width: var(--touch-hit);
    min-height: var(--touch-hit);
    border-radius: 50%;
    border: 1.5px solid var(--brass);
    background: transparent;
    color: var(--brass);
    font-family: var(--font-display);
    font-size: 40px;
    line-height: 1;
    transition: background .14s, color .14s, transform .14s;
  }
  .pager button:active { background: var(--brass); color: var(--page-bg-deep); transform: scale(0.96); }
  .pager button[disabled] { opacity: 0.3; }
  .pager .counter {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 20px;
    letter-spacing: 0.16em;
    color: var(--telegrey-4);
    padding: 2px 0;
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
    width: min(1080px, calc(100vw - 96px));
    max-height: calc(100vh - 200px);
    margin-top: 160px;
    display: flex;
    flex-direction: column;
    background: var(--page-bg-deep);
    border: 1.5px solid var(--brass);
  }
  .toc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 26px 32px;
    border-bottom: 1.5px solid var(--brass);
  }
  .toc-head .t {
    font-family: var(--font-mono);
    font-size: 17px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--brass);
  }
  .toc-close {
    width: 72px; height: 72px;
    min-width: 72px; min-height: 72px;
    border-radius: 50%;
    border: 1.5px solid var(--brass);
    background: var(--signal-red);
    color: var(--paper-white);
    font-size: 34px;
    line-height: 1;
  }
  .toc-close:active { transform: scale(0.96); }

  .toc-list { overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .toc-item {
    display: flex;
    align-items: center;
    gap: 28px;
    width: 100%;
    min-height: var(--touch-hit);
    padding: 20px 32px;
    text-align: left;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--rule);
    color: var(--ink-on-dark);
  }
  .toc-item:active { background: rgba(210, 183, 115, 0.22); }
  .toc-item[aria-current='true'] { background: rgba(210, 183, 115, 0.13); }
  .toc-item .n {
    flex: 0 0 auto;
    width: 78px;
    font-family: var(--font-display);
    font-size: 44px;
    font-weight: 900;
    line-height: 1;
    color: var(--brass);
  }
  .toc-item .txt { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .toc-item .ttl {
    font-family: var(--font-body);
    font-size: 27px;
    line-height: 1.2;
  }
  .toc-item .sub {
    font-family: var(--font-body);
    font-style: italic;
    font-size: 19px;
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
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

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
