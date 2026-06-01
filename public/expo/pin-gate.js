// PIN-gate отключён — все разделы открыты без ввода кода.
// Оригинал в git history. Чтобы вернуть: git checkout HEAD~1 -- public/expo/pin-gate.js
//
// API сохранён, чтобы вызывающие места (expo/index.html, parties.html, states.html, brand.html)
// продолжали работать без правок.

(function () {
  window.MTK_PIN = {
    require: function (callback) {
      if (typeof callback === 'function') callback();
    },
    guardPage: function () {
      // no-op: страница доступна сразу
    },
    isUnlocked: function () { return true; },
  };
})();
