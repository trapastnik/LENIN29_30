// Данные раздела «Хроника событий» — public/content/chronicle/.
//
// 396 событий разложены по годам: 1917.json … 1922.json, плюс _index.json
// с количествами. Грузим по одному году — это и есть та самая «загрузка
// хроники по годам»: 1918-й один даёт 139 событий, тянуть все шесть лет
// разом на киоск незачем.
//
// Карточки событий (76 из 396 ссылаются на content/events/<id>.json)
// подгружаются по тапу, как справки персон.

(function () {
  'use strict';

  var INDEX_URL = 'content/chronicle/_index.json';
  var indexPromise = null;
  var yearCache = Object.create(null);
  var cardCache = Object.create(null);

  function url(rel) {
    return window.MTK_URL ? window.MTK_URL(rel) : rel;
  }

  async function getJSON(rel) {
    var res = await fetch(url(rel));
    if (!res.ok) throw new Error(rel + ': HTTP ' + res.status);
    return res.json();
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = getJSON(INDEX_URL).then(function (d) { return d.years || []; });
    }
    return indexPromise;
  }

  // Год отдаётся уже отсортированным: поле sort («1918-01-05#0004») — строковый
  // ключ, по которому и задуман порядок. Полагаться на порядок в файле нельзя,
  // а восстанавливать хронологию из display_ru («5–6 января») — тем более.
  function loadYear(year) {
    if (!yearCache[year]) {
      yearCache[year] = getJSON('content/chronicle/' + year + '.json')
        .then(function (d) {
          var items = (d.items || []).slice();
          items.sort(function (a, b) { return String(a.sort).localeCompare(String(b.sort)); });
          return items;
        })
        .catch(function (err) { delete yearCache[year]; throw err; });
    }
    return yearCache[year];
  }

  function loadCard(id) {
    if (!cardCache[id]) {
      cardCache[id] = getJSON('content/events/' + id + '.json')
        .catch(function (err) { delete cardCache[id]; throw err; });
    }
    return cardCache[id];
  }

  // ── Медиа ────────────────────────────────────────────────────────────────
  // Та же схема, что у персон: content/<file>-<tier>.webp, набор собранных
  // тиров объявлен в media[].tiers. Производные доставляются мимо git и
  // собираются на сервере, поэтому локально их может не быть — потребитель
  // обязан пережить отсутствие файла, а не только пустой tiers.
  var TIERS = ['lg', 'sm', 'xs'];

  function mediaUrl(m, want) {
    if (!m || !m.file) return null;
    var tiers = m.tiers || [];
    if (!tiers.length) return null;
    var order = want ? [want].concat(TIERS) : TIERS;
    for (var i = 0; i < order.length; i++) {
      if (tiers.indexOf(order[i]) !== -1) return url('content/' + m.file + '-' + order[i] + '.webp');
    }
    return null;
  }

  function photos(card) {
    return (card.media || []).slice()
      .sort(function (a, b) { return (a.n || 0) - (b.n || 0); })
      .map(function (m) {
        return {
          src: mediaUrl(m, 'lg'),
          w: m.w || null,
          h: m.h || null,
          ru: m.caption_ru || '',
          en: m.caption_en || '',
          inv: m.inv_ru || null,
        };
      });
  }

  window.MTK_CHRONICLE = {
    loadIndex: loadIndex,
    loadYear: loadYear,
    loadCard: loadCard,
    photos: photos,
  };
})();
