// Единая точка разрешения путей к ресурсам проекта.
//
// ЗАЧЕМ. Киоск запускается как file:///opt/mtk29/dist/index.html (CLAUDE.md §1).
// Под file:// путь `/content/parties/_index.json` резолвится в корень файловой
// системы, а не в корень сборки, и молча не находится — раздел просто пустой,
// без единой ошибки в консоли. На stage по http тот же путь работает, поэтому
// дефект не виден нигде, кроме приёмки.
//
// КАК. Скрипт вычисляет корень сборки из адреса самого себя, а не из
// location страницы. Это важно: страницы лежат на двух глубинах — корневые
// (`parties.html`) и сцена (`expo/index.html`), — и относительный префикс
// у них разный, а адрес base.js один и тот же.
//
// ПОДКЛЮЧЕНИЕ — первым скриптом в <head>, обычным (не module):
//   корневая страница:  <script src="base.js"></script>
//   страница в /expo/:  <script src="../base.js"></script>
//
// Обычный <script> выполняется на разборе, module-скрипты отложены, поэтому
// к моменту работы любого модуля MTK_BASE уже определён.
(function () {
  'use strict';

  var src = document.currentScript && document.currentScript.src;

  // Фолбэк на случай, если скрипт подключат не так, как описано выше
  // (async/module/динамическая вставка — тогда currentScript пуст).
  if (!src) {
    var tags = document.getElementsByTagName('script');
    for (var i = tags.length - 1; i >= 0; i--) {
      if (/(^|\/)base\.js(\?|$)/.test(tags[i].src || '')) { src = tags[i].src; break; }
    }
  }

  var root;
  if (src) {
    var u = new URL(src, document.baseURI);
    u.search = '';
    u.hash = '';
    root = u.href.replace(/base\.js$/, '');
  } else {
    // Последний рубеж: считаем, что страница лежит в корне сборки.
    root = new URL('./', location.href).href;
    if (window.console) console.warn('[MTK_BASE] base.js не найден среди <script>, корень взят от страницы:', root);
  }

  // Корень сборки, абсолютный URL, всегда со слэшем на конце.
  window.MTK_BASE = root;

  /**
   * Путь к ресурсу от корня сборки.
   * @param {string} rel — БЕЗ ведущего слэша: 'content/parties/_index.json'
   * @returns {string} абсолютный URL, пригодный и для file://, и для http://
   */
  window.MTK_URL = function (rel) {
    if (rel == null) return window.MTK_BASE;
    rel = String(rel);
    // Уже абсолютный (http, file, data, blob) — отдаём как есть.
    if (/^[a-z][a-z0-9+.-]*:/i.test(rel)) return rel;
    // Ведущий слэш — ровно тот баг, ради которого всё это писалось.
    // Не молчим: под file:// он даст пустой раздел без ошибки в консоли.
    if (rel.charAt(0) === '/') {
      if (window.console) {
        console.warn('[MTK_URL] ведущий слэш ломает киоск под file:// — убери его:', rel);
      }
      rel = rel.replace(/^\/+/, '');
    }
    return window.MTK_BASE + rel;
  };
})();
