// ┌──────────────────────────────────────────────────────────────────────┐
// │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.                     │
// │  Источник:  src/design/tokens.json
// │  Генератор: node scripts/design/build-tokens.mjs                     │
// └──────────────────────────────────────────────────────────────────────┘
//
// Заменяет прежний public/expo/theme.js. Подключается ОБЫЧНЫМ <script> до
// любого jsx — сцена /expo/ работает без сборщика, модулей здесь быть не может.

(function () {
  'use strict';

  // Все токены с разрешёнными значениями: MTK_TOKENS['brass'] === '#D2B773'.
  var TOKENS = {
    "ink-black": "#000000",
    "paper-white": "#F7F9EF",
    "paper-pure": "#FFFFFF",
    "brass": "#D2B773",
    "signal-red": "#A02128",
    "slate-blue": "#5D6970",
    "slate-window": "#9DA3A6",
    "iron-grey": "#555D61",
    "graphite": "#435059",
    "telegrey-4": "#CFD0CF",
    "page-bg": "#555D61",
    "page-bg-deep": "#435059",
    "paper": "#F7F9EF",
    "accent": "#D2B773",
    "accent-alt": "#A02128",
    "ink": "#000000",
    "ink-on-dark": "#F7F9EF",
    "ink-soft": "#2a2f33",
    "ink-faint": "#6c737a",
    "rule": "rgba(255,255,255,0.12)",
    "camp-red": "#A02128",
    "camp-red-deep": "#6a0f14",
    "camp-white": "#CFD0CF",
    "camp-rev-dem": "#8C4A99",
    "camp-green": "#5A8E55",
    "camp-national": "#D2B773",
    "camp-intervention": "#2F4A6B",
    "camp-uprising": "#2A8079",
    "camp-red-ink": "#A02128",
    "camp-white-ink": "#555D61",
    "camp-rev-dem-ink": "#8C4A99",
    "camp-green-ink": "#4D7948",
    "camp-national-ink": "#7E6E45",
    "camp-intervention-ink": "#2F4A6B",
    "camp-uprising-ink": "#287A73",
    "font-display": "\"Nolde\", \"Playfair Display\", Georgia, serif",
    "font-body": "\"21 Cent\", \"PT Serif\", Georgia, serif",
    "font-accent": "\"20 Kopeek\", \"21 Cent\", Georgia, serif",
    "font-mono": "\"20 Kopeek\", \"JetBrains Mono\", \"Courier New\", monospace",
    "font-stamp": "\"20 Kopeek\", \"Special Elite\", monospace",
    "touch-hit": "120px",
    "fs-body": "32px",
    "brand-skew": "-15deg",
    "scroll-thumb": "#D2B773",
    "scroll-thumb-active": "#b88e3a",
    "scroll-track": "rgba(0,0,0,0.45)",
    "scroll-width": "14px",
    "layer-background": "transparent",
    "layer-borders-dark": "#1a1a1a",
    "layer-arrows-red": "#A02128",
    "layer-arrows-pink": "#cc0066",
    "layer-front-blue": "#0033cc",
    "layer-front-green": "#006600",
    "layer-rivers-cyan": "#5ba8a0",
    "warm-ink": "#000000",
    "warm-brass": "#D2B773",
    "warm-red": "#A02128",
    "warm-white": "#CFD0CF",
    "warm-ink-soft": "#2a1f16",
    "warm-ink-faint": "#7a6650",
    "warm-paper-light": "#efe4cd",
    "warm-paper": "#e6d6b5",
    "warm-paper-warm": "#d9c398",
    "warm-paper-dark": "#a8875a",
    "warm-wood": "#3a2517",
    "warm-wood-light": "#5a3a22",
    "warm-red-deep": "#6b0d0d",
    "warm-ochre": "#c18f3c",
    "warm-gold": "#d4af3a",
    "warm-green-map": "#6b7f4a",
    "warm-blue-map": "#4a6178",
    "people-ink": "#000000",
    "people-brass": "#D2B773",
    "people-red-deep": "#A02128",
    "people-bg": "#120803",
    "people-bg-deep": "#0a0502",
    "people-paper": "#e8d4a8",
    "people-paper-lit": "#f2e1b4",
    "people-paper-dim": "#c8b488",
    "people-ink-soft": "#3a2010",
    "people-ink-fade": "#6a4a20",
    "people-ochre": "#c88a40",
    "side-red-color": "#b23028",
    "side-red-accent": "#d94a36",
    "side-red-flag": "#a01818",
    "side-white-color": "#2a3d5e",
    "side-white-accent": "#4a6290",
    "side-white-flag": "#1a2238",
    "side-green-color": "#4d5a28",
    "side-green-accent": "#6a7a3a",
    "side-green-flag": "#3a4418",
  };

  // Метаданные для brand.html: каталог рисует свотчи циклом по этим данным,
  // а не описывает палитру вторым списком.
  var META = {
    "ink-black": {"group":"brand","css":true,"note":"RAL 9005 «Чёрный янтарь»"},
    "paper-white": {"group":"brand","css":true,"note":"RAL 9010 «Чистый белый» (тёплый)"},
    "paper-pure": {"group":"brand","css":true,"note":"чистый белый для мультимедиа"},
    "brass": {"group":"brand","css":true,"note":"RAL 1002 «Латунь» — акцент, заголовки"},
    "signal-red": {"group":"brand","css":true,"note":"RAL 3001 «Сигнальный красный»"},
    "slate-blue": {"group":"brand","css":true,"note":"RAL 7031 «Сине-серый» — 2 этаж"},
    "slate-window": {"group":"brand","css":true,"note":"RAL 7040 «Серое окно» — вторичный фон"},
    "iron-grey": {"group":"brand","css":true,"note":"RAL 7011 «Железо-серый» — 3 этаж (наш)"},
    "graphite": {"group":"brand","css":true,"note":"«Графитовый» для тёмных мультимедиа-полей"},
    "telegrey-4": {"group":"brand","css":true,"note":"RAL 7047 «Телегрей 4»"},
    "page-bg": {"group":"semantic","css":true,"note":"фон наших страниц-разделов"},
    "page-bg-deep": {"group":"semantic","css":true,"note":"тёмные панели, venn-board"},
    "paper": {"group":"semantic","css":true,"note":"карточки на светлом"},
    "accent": {"group":"semantic","css":true,"note":"ведущий акцент"},
    "accent-alt": {"group":"semantic","css":true,"note":"вторичный акцент"},
    "ink": {"group":"semantic","css":true,"note":"текст на светлом"},
    "ink-on-dark": {"group":"semantic","css":true,"note":"текст на тёмном"},
    "ink-soft": {"group":"semantic","css":true,"note":"полутон на светлом"},
    "ink-faint": {"group":"semantic","css":true,"note":"тонкая мета на светлом"},
    "rule": {"group":"semantic","css":true,"note":"тонкая линия разделителя"},
    "camp-red": {"group":"camp","css":true,"note":"Красные ← сигнальный красный"},
    "camp-red-deep": {"group":"camp","css":true},
    "camp-white": {"group":"camp","css":true,"note":"Белые ← Телегрей 4"},
    "camp-rev-dem": {"group":"camp","css":true,"note":"пурпур (вне бренд-палитры, идентифицирует лагерь)"},
    "camp-green": {"group":"camp","css":true,"note":"оливковый"},
    "camp-national": {"group":"camp","css":true,"note":"Национальные ← латунь"},
    "camp-intervention": {"group":"camp","css":true,"note":"грозовой синий"},
    "camp-uprising": {"group":"camp","css":true,"note":"Восстания (вне бренд-палитры, идентифицирует лагерь) — 22 записи в данных, токена не было"},
    "camp-red-ink": {"group":"camp-ink","css":true,"note":"7.20 — затемнять нечего"},
    "camp-white-ink": {"group":"camp-ink","css":true,"note":"RAL 7011: та же серая семья, 6.32 вместо 1.45"},
    "camp-rev-dem-ink": {"group":"camp-ink","css":true,"note":"5.56 — затемнять нечего"},
    "camp-green-ink": {"group":"camp-ink","css":true,"note":"3.63 → 4.77"},
    "camp-national-ink": {"group":"camp-ink","css":true,"note":"1.84 → 4.70"},
    "camp-intervention-ink": {"group":"camp-ink","css":true,"note":"8.54 — затемнять нечего"},
    "camp-uprising-ink": {"group":"camp-ink","css":true,"note":"4.43 → 4.79"},
    "font-display": {"group":"font","css":true,"note":"заголовки, крупные цифры, буквицы. КУРСИВ ЗАПРЕЩЁН"},
    "font-body": {"group":"font","css":true,"note":"основной длинный текст, параграфы"},
    "font-accent": {"group":"font","css":true,"note":"короткие надписи, кнопки, метки с «косой чертой»"},
    "font-mono": {"group":"font","css":true,"note":"акцентные капс-надписи"},
    "font-stamp": {"group":"font","css":true,"note":"штампы, телеграммы. Special Elite в проект не загружается"},
    "touch-hit": {"group":"metric","css":true,"note":"минимальная тач-цель"},
    "fs-body": {"group":"metric","css":true},
    "brand-skew": {"group":"metric","css":true,"note":"угол наклонных полос — 75° от вертикали"},
    "scroll-thumb": {"group":"scroll","css":true},
    "scroll-thumb-active": {"group":"scroll","css":true},
    "scroll-track": {"group":"scroll","css":true},
    "scroll-width": {"group":"scroll","css":true},
    "layer-background": {"group":"layer","css":true},
    "layer-borders-dark": {"group":"layer","css":true},
    "layer-arrows-red": {"group":"layer","css":true},
    "layer-arrows-pink": {"group":"layer","css":true},
    "layer-front-blue": {"group":"layer","css":true},
    "layer-front-green": {"group":"layer","css":true},
    "layer-rivers-cyan": {"group":"layer","css":true},
    "warm-ink": {"group":"warm","css":false,"deprecated":true},
    "warm-brass": {"group":"warm","css":false,"deprecated":true},
    "warm-red": {"group":"warm","css":false,"deprecated":true},
    "warm-white": {"group":"warm","css":false,"deprecated":true},
    "warm-ink-soft": {"group":"warm","css":false,"note":"тёплая умбра — длинный текст на бумаге","deprecated":true},
    "warm-ink-faint": {"group":"warm","css":false,"note":"мета на бумаге","deprecated":true},
    "warm-paper-light": {"group":"warm","css":false,"deprecated":true},
    "warm-paper": {"group":"warm","css":false,"note":"КОНФЛИКТ: одноимённый бренд-токен paper = #F7F9EF","deprecated":true},
    "warm-paper-warm": {"group":"warm","css":false,"deprecated":true},
    "warm-paper-dark": {"group":"warm","css":false,"deprecated":true},
    "warm-wood": {"group":"warm","css":false,"deprecated":true},
    "warm-wood-light": {"group":"warm","css":false,"deprecated":true},
    "warm-red-deep": {"group":"warm","css":false,"deprecated":true},
    "warm-ochre": {"group":"warm","css":false,"deprecated":true},
    "warm-gold": {"group":"warm","css":false,"deprecated":true},
    "warm-green-map": {"group":"warm","css":false,"deprecated":true},
    "warm-blue-map": {"group":"warm","css":false,"deprecated":true},
    "people-ink": {"group":"people","css":false,"deprecated":true},
    "people-brass": {"group":"people","css":false,"deprecated":true},
    "people-red-deep": {"group":"people","css":false,"note":"лагерь «Красные»","deprecated":true},
    "people-bg": {"group":"people","css":false,"note":"тёмное сукно стола","deprecated":true},
    "people-bg-deep": {"group":"people","css":false,"deprecated":true},
    "people-paper": {"group":"people","css":false,"note":"КОНФЛИКТ: третье значение для имени paper","deprecated":true},
    "people-paper-lit": {"group":"people","css":false,"deprecated":true},
    "people-paper-dim": {"group":"people","css":false,"deprecated":true},
    "people-ink-soft": {"group":"people","css":false,"deprecated":true},
    "people-ink-fade": {"group":"people","css":false,"deprecated":true},
    "people-ochre": {"group":"people","css":false,"deprecated":true},
    "side-red-color": {"group":"side","css":false,"note":"≠ --camp-red #A02128","deprecated":true},
    "side-red-accent": {"group":"side","css":false,"deprecated":true},
    "side-red-flag": {"group":"side","css":false,"deprecated":true},
    "side-white-color": {"group":"side","css":false,"note":"≠ --camp-white #CFD0CF","deprecated":true},
    "side-white-accent": {"group":"side","css":false,"deprecated":true},
    "side-white-flag": {"group":"side","css":false,"deprecated":true},
    "side-green-color": {"group":"side","css":false,"note":"≠ --camp-green #5A8E55","deprecated":true},
    "side-green-accent": {"group":"side","css":false,"deprecated":true},
    "side-green-flag": {"group":"side","css":false,"deprecated":true},
  };

  var GROUPS = [
    {"id":"brand","title":"Бренд-палитра RAL","css":true,"tokens":["ink-black","paper-white","paper-pure","brass","signal-red","slate-blue","slate-window","iron-grey","graphite","telegrey-4"],"comment":"Стр. 5–6 гайдбука. Значения не меняются никогда — это RAL."},
    {"id":"semantic","title":"Семантические токены","css":true,"tokens":["page-bg","page-bg-deep","paper","accent","accent-alt","ink","ink-on-dark","ink-soft","ink-faint","rule"],"comment":"Что каким бренд-цветом красим. Меняется здесь, а не в компонентах."},
    {"id":"camp","title":"Палитра лагерей","css":true,"tokens":["camp-red","camp-red-deep","camp-white","camp-rev-dem","camp-green","camp-national","camp-intervention","camp-uprising"],"comment":"Выровнено с брендом там, где это возможно."},
    {"id":"camp-ink","title":"Палитра лагерей — начертание","css":true,"tokens":["camp-red-ink","camp-white-ink","camp-rev-dem-ink","camp-green-ink","camp-national-ink","camp-intervention-ink","camp-uprising-ink"],"comment":"Цвет лагеря опознаёт территорию заливкой, но как ТЕКСТ на светлом читается не всякий: --camp-white даёт 1.45, --camp-national 1.84 при пороге WCAG 4.5. На тач-столе с 70 см это нечитаемо. Правило вызова простое: заливка — --camp-x, текст — --camp-x-ink. Там, где заливка и так проходит порог, -ink ссылается на неё же, поэтому на месте вызова выбирать не нужно."},
    {"id":"font","title":"Шрифты","css":true,"tokens":["font-display","font-body","font-accent","font-mono","font-stamp"],"comment":"docs/brand/Fonts-requirements.docx. Курсив на Nolde запрещён — файла начертания нет."},
    {"id":"metric","title":"Метрики","css":true,"tokens":["touch-hit","fs-body","brand-skew"]},
    {"id":"scroll","title":"Скроллбары","css":true,"tokens":["scroll-thumb","scroll-thumb-active","scroll-track","scroll-width"],"comment":"На тач-столе скроллбар должен быть виден — иначе не понять, что блок скроллится."},
    {"id":"layer","title":"Слои карт","css":true,"tokens":["layer-background","layer-borders-dark","layer-arrows-red","layer-arrows-pink","layer-front-blue","layer-front-green","layer-rivers-cyan"],"comment":"Совпадают с HSV-парами из map_v6.ipynb."},
    {"id":"warm","title":"Тёплая палитра design-pass-1 (public/expo/shared.jsx)","css":false,"tokens":["warm-ink","warm-brass","warm-red","warm-white","warm-ink-soft","warm-ink-faint","warm-paper-light","warm-paper","warm-paper-warm","warm-paper-dark","warm-wood","warm-wood-light","warm-red-deep","warm-ochre","warm-gold","warm-green-map","warm-blue-map"],"deprecated":true,"comment":"ВТОРАЯ ПАЛИТРА. Те же имена, что у бренда, другие значения: paper #e6d6b5 вместо RAL #F7F9EF, inkSoft #2a1f16 вместо #2a2f33. Внесена сюда как есть, чтобы шаги 1–2 прошли без визуальных изменений. Удаляется на шаге 3 вместе со снятием направлений A/B/C зоной ui."},
    {"id":"people","title":"Палитра карточки персоналии (public/expo/people-ui.jsx)","css":false,"tokens":["people-ink","people-brass","people-red-deep","people-bg","people-bg-deep","people-paper","people-paper-lit","people-paper-dim","people-ink-soft","people-ink-fade","people-ochre"],"deprecated":true,"comment":"Третья копия палитры. Удаляется на шаге 3 по согласованию с зоной ui."},
    {"id":"side","title":"SIDE_META — цвета лагерей в разделе «Персоналии»","css":false,"tokens":["side-red-color","side-red-accent","side-red-flag","side-white-color","side-white-accent","side-white-flag","side-green-color","side-green-accent","side-green-flag"],"deprecated":true,"comment":"Четвёртый набор цветов лагерей: ни один не совпадает с --camp-*. «Красные» здесь #b23028, в бренде RAL 3001 #A02128. Сводится к --camp-* на шаге 3."},
  ];

  // Совместимость: ровно то, что раньше собирал public/expo/theme.js.
  var BRAND_THEME = {
    "inkBlack": "#000000",
    "paperWhite": "#F7F9EF",
    "paperPure": "#FFFFFF",
    "brass": "#D2B773",
    "signalRed": "#A02128",
    "slateBlue": "#5D6970",
    "slateWindow": "#9DA3A6",
    "ironGrey": "#555D61",
    "graphite": "#435059",
    "telegrey4": "#CFD0CF",
    "ink": "#000000",
    "paper": "#F7F9EF",
    "accent": "#D2B773",
    "accentAlt": "#A02128",
    "pageBg": "#555D61",
    "pageBgDeep": "#435059",
    "inkOnDark": "#F7F9EF",
    "rule": "rgba(255,255,255,0.12)",
    "camp": {
      "red": "#A02128",
      "redDeep": "#6a0f14",
      "white": "#CFD0CF",
      "revDem": "#8C4A99",
      "green": "#5A8E55",
      "national": "#D2B773",
      "intervention": "#2F4A6B"
    }
  };

  // Совместимость с theme.js.
  var BRAND_FONTS = {
    "display": "\"Nolde\", \"Playfair Display\", Georgia, serif",
    "body": "\"21 Cent\", \"PT Serif\", Georgia, serif",
    "accent": "\"20 Kopeek\", \"21 Cent\", Georgia, serif",
    "mono": "\"20 Kopeek\", \"JetBrains Mono\", \"Courier New\", monospace",
    "stamp": "\"20 Kopeek\", \"Special Elite\", monospace"
  };

  // Тёплый слой для public/expo/shared.jsx. Ключи 1:1 с прежним локальным `theme`, поэтому direction-*.jsx не меняются. Удаляется на шаге 3.
  // DEPRECATED — снимается на шаге 3.
  var MTK_THEME = {
    "ink": "#000000",
    "brass": "#D2B773",
    "red": "#A02128",
    "white": "#CFD0CF",
    "inkSoft": "#2a1f16",
    "inkFaint": "#7a6650",
    "paperLight": "#efe4cd",
    "paper": "#e6d6b5",
    "paperWarm": "#d9c398",
    "paperDark": "#a8875a",
    "wood": "#3a2517",
    "woodLight": "#5a3a22",
    "redDeep": "#6b0d0d",
    "ochre": "#c18f3c",
    "gold": "#d4af3a",
    "greenMap": "#6b7f4a",
    "blueMap": "#4a6178"
  };

  // Набор шрифтов в форме, которую ожидает shared.jsx (есть алиас rus).
  var MTK_FONTS = {
    "display": "\"Nolde\", \"Playfair Display\", Georgia, serif",
    "body": "\"21 Cent\", \"PT Serif\", Georgia, serif",
    "mono": "\"20 Kopeek\", \"JetBrains Mono\", \"Courier New\", monospace",
    "stamp": "\"20 Kopeek\", \"Special Elite\", monospace",
    "rus": "\"21 Cent\", \"PT Serif\", Georgia, serif"
  };

  // Палитра карточки персоналии. Ключи 1:1 с прежним локальным `theme` в people-ui.jsx.
  // DEPRECATED — снимается на шаге 3.
  var MTK_PEOPLE_THEME = {
    "ink": "#000000",
    "brass": "#D2B773",
    "redDeep": "#A02128",
    "bg": "#120803",
    "bgDeep": "#0a0502",
    "paper": "#e8d4a8",
    "paperLit": "#f2e1b4",
    "paperDim": "#c8b488",
    "inkSoft": "#3a2010",
    "inkFade": "#6a4a20",
    "ochre": "#c88a40"
  };

  var MTK_PEOPLE_FONTS = {
    "display": "\"Nolde\", \"Playfair Display\", Georgia, serif",
    "body": "\"21 Cent\", \"PT Serif\", Georgia, serif",
    "stamp": "\"20 Kopeek\", \"Special Elite\", monospace",
    "mono": "\"20 Kopeek\", \"JetBrains Mono\", \"Courier New\", monospace"
  };

  // SIDE_META из people-ui.jsx. Цвета вне бренд-палитры; на шаге 3 сводятся к --camp-*.
  // DEPRECATED — снимается на шаге 3.
  var MTK_SIDE_META = {
    "red": {
      "ru": "Красные",
      "en": "Reds",
      "color": "#b23028",
      "accent": "#d94a36",
      "flag": "#a01818"
    },
    "white": {
      "ru": "Белые",
      "en": "Whites",
      "color": "#2a3d5e",
      "accent": "#4a6290",
      "flag": "#1a2238"
    },
    "green": {
      "ru": "Третья сила",
      "en": "Third force",
      "color": "#4d5a28",
      "accent": "#6a7a3a",
      "flag": "#3a4418"
    }
  };

  window.MTK_TOKENS     = TOKENS;
  window.MTK_TOKEN_META = META;
  window.MTK_GROUPS     = GROUPS;
  window.BRAND_THEME   = BRAND_THEME;
  window.BRAND_FONTS   = BRAND_FONTS;
  window.MTK_THEME     = MTK_THEME;
  window.MTK_FONTS     = MTK_FONTS;
  window.MTK_PEOPLE_THEME = MTK_PEOPLE_THEME;
  window.MTK_PEOPLE_FONTS = MTK_PEOPLE_FONTS;
  window.MTK_SIDE_META = MTK_SIDE_META;
})();
