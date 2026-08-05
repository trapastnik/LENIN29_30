// Данные раздела «Персоналии» — из импорта зоны content.
//
// Заменил people-data.js: там лежала подборка design-pass на 17 человек,
// вбитая руками. Теперь источник — public/content/persons/, 70 справок.
// Идентификаторы импорт закрепил те же, так что переход обошёлся без
// переназначения (docs/content.md).
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
  // Производные доставляются мимо git и собираются на сервере (CLAUDE.md §7),
  // поэтому локально каталога media/ может не быть вовсе. Пустой tiers даёт
  // здесь null, а несобравшийся файл — 404 уже в браузере: потребитель обязан
  // пережить оба случая, не только первый.
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
  // Здесь стоял обход: sort_key_ru у трёх записей начинался с инициалов
  // («в. и. ленин ульянов», «а. в. колчак», «н. а. григорьев серветников»),
  // и по сырому ключу Колчак вставал перед Авксентьевым. Инициалы срезались
  // регуляркой.
  //
  // Убран 2026-08-04: зона content починила корень в 645cbd0, ключи теперь
  // однородны. Сверено на слитой ветке — записей с инициалами 0 из 70,
  // первый по алфавиту «авксентьев», пустых ключей нет.
  //
  // Держать его дальше было нельзя: правило, которое перестало срабатывать,
  // выглядит рабочим и переживёт следующую правку источника, а потом
  // проснётся и замаскирует дефект вместо того, чтобы дать ему всплыть.
  //
  // ⚠️ Если будешь проверять, не вернулись ли такие ключи, — ищи
  // РЕГИСТРОНЕЗАВИСИМО: они в нижнем регистре, и проверка на `[А-ЯЁ]`
  // даёт ноль независимо от данных. На этом за один день попались обе
  // стороны разом, и оба раза ноль выглядел убедительно. Печатай рядом
  // первую пятёрку по алфавиту: там сразу видно, кто вправду первый.
  function sortKey(it) {
    return (it.sort_key_ru || it.title_ru || it.id || '').toLowerCase();
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
      // Заглавная картинка прямо из индекса: lead_media даёт путь, lead_tiers —
      // какие производные собраны. Плитке хватает xs (560×560), lg на сетку
      // из 70 портретов возить незачем.
      //
      // Раньше здесь стоял null: тиров в индексе не было, и все миниатюры
      // оставались силуэтами. Поле появилось 2026-08-03.
      portrait: mediaUrl({ file: it.lead_media, tiers: it.lead_tiers }, 'xs'),
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
        // По алфавиту: 70 плиток в порядке импорта не ищутся глазами.
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
