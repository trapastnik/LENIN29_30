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

  /** Есть ли что показывать. Без файла слот не рисуется вообще. */
  function isRenderable(m) {
    return !!(m && m.file);
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
