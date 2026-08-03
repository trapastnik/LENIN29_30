// Данные раздела «Персоналии» — из импорта зоны content.
//
// Заменил people-data.js: там лежала подборка design-pass на 17 человек,
// вбитая руками. Теперь источник — public/content/persons/, 78 записей
// (70 со справкой + 8 заглушек). Идентификаторы импорт закрепил те же,
// так что переход обошёлся без переназначения (docs/content.md).
//
// Модуль отдаёт две формы:
//   loadIndex()     — плитки. Только _index.json, ни одной дозагрузки:
//                     индекс для того и сделан самодостаточным.
//   loadPerson(id)  — карточка. Один запрос по тапу, с памятью.
//
// Формы приведены к тем полям, которые читает people-ui.jsx.

(function () {
  'use strict';

  var INDEX_URL = 'content/persons/_index.json';
  var cache = Object.create(null);
  var indexPromise = null;

  function url(rel) {
    return window.MTK_URL ? window.MTK_URL(rel) : rel;
  }

  async function getJSON(rel) {
    var res = await fetch(url(rel));
    if (!res.ok) throw new Error(rel + ': HTTP ' + res.status);
    return res.json();
  }

  // ── Медиа ────────────────────────────────────────────────────────────────
  // Производные лежат как content/<file>-<tier>.webp; какие тиры собраны,
  // говорит сам media[].tiers (см. scripts/validate-content.mjs).
  //
  // ⚠️ Сейчас tiers пуст у всех 258 изображений: npm run media:build ещё нет,
  // public/content/media/ не существует. Поэтому здесь честный null, а UI
  // рисует силуэт-заглушку. Когда производные соберут — включится само,
  // правок в UI не потребуется.
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

  // Натурные размеры оригинала — чтобы лайтбокс не апскейлил (CLAUDE.md §9:
  // у 44 % фонда длинная сторона меньше 1600 px).
  function photo(m) {
    return {
      src: mediaUrl(m, 'lg'),
      thumb: mediaUrl(m, 'xs'),
      w: m.w || null,
      h: m.h || null,
      ru: m.caption_ru || '',
      en: m.caption_en || '',
      inv: m.inv_ru || null,
    };
  }

  // ── Плитка ───────────────────────────────────────────────────────────────
  // sort_key_ru в индексе неоднороден: у трёх записей он начинается
  // с инициалов («в. и. ленин ульянов», «а. в. колчак»), у остальных —
  // с фамилии, а у восьми заглушек его нет вовсе. По сырому ключу Колчак
  // встаёт перед Авксентьевым — список перестаёт быть алфавитным.
  // Инициалы срезаем, пустое добираем из заголовка.
  var INITIALS_RE = /^(?:[а-яёa-z]\.\s*)+/i;

  function sortKey(it) {
    var raw = it.sort_key_ru || it.title_ru || it.id || '';
    return raw.toLowerCase().replace(INITIALS_RE, '').trim() || raw.toLowerCase();
  }

  function tile(it) {
    return {
      id: it.id,
      side: it.camp || null,
      years: it.dates_display_ru || '',
      title: it.title_ru || it.id,
      titleFull: it.title_full_ru || it.title_ru || it.id,
      sortKey: sortKey(it),
      hasCard: !!it.has_card,
      stub: !!it.stub,
      // lead_media в индексе — путь без тиров; собраны они или нет, индекс
      // не сообщает, поэтому портрет плитки честно ждёт карточки.
      portrait: null,
    };
  }

  // ── Карточка ─────────────────────────────────────────────────────────────
  // people-ui.jsx читает person[lang].{name, sur, role, tag, bio, facts}.
  // Английского в импорте нет ни у кого (en_status: missing), поэтому en
  // собираем из тех же русских полей — иначе переключатель RU/EN покажет
  // пустую карточку, и это примут за поломку движка (CLAUDE.md §9).
  function detail(p, tileRec) {
    var regalia = p.regalia_ru || [];
    var media = (p.media || []).slice().sort(function (a, b) { return (a.n || 0) - (b.n || 0); });
    var lead = media.find(function (m) { return m.slot === 'lead'; }) || media[0] || null;
    var gallery = media.filter(function (m) { return m !== lead; });

    var ru = {
      name: p.given_ru || '',
      sur: p.surname_ru || p.title_ru || p.id,
      role: regalia[0] || '',
      tag: regalia.length > 1 ? regalia[1] : '',
      bio: p.summary_ru || '',
      // Регалии сверх первых двух — отдельным списком: у части персон их три.
      facts: regalia.slice(2),
    };
    var en = {
      name: p.given_en || ru.name,
      sur: p.surname_en || ru.sur,
      role: (p.regalia_en && p.regalia_en[0]) || ru.role,
      tag: (p.regalia_en && p.regalia_en[1]) || ru.tag,
      bio: p.summary_en || ru.bio,
      facts: (p.regalia_en && p.regalia_en.slice(2)) || ru.facts,
    };

    return {
      id: p.id,
      side: p.side || p.camp || (tileRec && tileRec.side) || null,
      years: (p.dates && p.dates.display_ru) || (tileRec && tileRec.years) || '',
      title: p.title_ru || (tileRec && tileRec.title) || p.id,
      portrait: lead ? mediaUrl(lead, 'lg') : null,
      photos: gallery.map(photo),
      // Английского нет — раздел показывает русский и говорит об этом честно,
      // вместо пустого экрана.
      enMissing: (p.en_status || 'missing') !== 'ok',
      ru: ru,
      en: en,
    };
  }

  // ── Публичное ────────────────────────────────────────────────────────────
  var tilesById = Object.create(null);

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = getJSON(INDEX_URL).then(function (idx) {
        var list = (idx.items || []).map(tile);
        // По алфавиту: 78 плиток в порядке импорта не ищутся глазами.
        list.sort(function (a, b) { return a.sortKey.localeCompare(b.sortKey, 'ru'); });
        list.forEach(function (t) { tilesById[t.id] = t; });
        return list;
      });
    }
    return indexPromise;
  }

  function loadPerson(id) {
    if (!cache[id]) {
      cache[id] = getJSON('content/persons/' + id + '.json')
        .then(function (p) { return detail(p, tilesById[id]); })
        .catch(function (err) {
          // Не кешируем провал: следующий тап попробует снова.
          delete cache[id];
          throw err;
        });
    }
    return cache[id];
  }

  window.MTK_PERSONS = {
    loadIndex: loadIndex,
    loadPerson: loadPerson,
    mediaUrl: mediaUrl,
  };
})();
