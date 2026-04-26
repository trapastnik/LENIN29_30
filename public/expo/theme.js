// Единые бренд-токены Ленин-центра (см. docs/brand/Lenin-guideline-2026.pdf,
// src/styles/tokens.css, brand.html). НЕ менять значения произвольно — они
// унаследованы из официального гайдбука 10.04.2026 и должны быть едины во
// всех экранах: parties.html, states.html, brand.html, /expo/index.html,
// /expo/people.html.
//
// Для не-бренд значений (тёплое дерево «стола», виньетки, акценты лагерей и
// т.п.) — используем локальные расширения в каждом jsx-файле, поверх этого.

(function () {
  // ── Бренд-палитра RAL (стр. 5–6 PDF) ─────────────────────────────
  const BRAND = {
    inkBlack:    '#000000',  // RAL 9005 «Чёрный янтарь»
    paperWhite:  '#F7F9EF',  // RAL 9010 «Чистый белый» (тёплый, для интерьера)
    paperPure:   '#FFFFFF',  // для мультимедиа (стр. 6)
    brass:       '#D2B773',  // RAL 1002 «Латунь песочно-жёлтый»
    signalRed:   '#A02128',  // RAL 3001 «Сигнальный красный»
    slateBlue:   '#5D6970',  // RAL 7031 «Сине-серый» (второй этаж)
    slateWindow: '#9DA3A6',  // RAL 7040 «Серое окно»
    ironGrey:    '#555D61',  // RAL 7011 «Железо-серый» (третий этаж — наш)
    graphite:    '#435059',  // мультимедиа-графит (стр. 6)
    telegrey4:   '#CFD0CF',  // RAL 7047 «Телегрей 4» (проекционные плоскости)
  };

  // ── Семантические алиасы ─────────────────────────────────────────
  const SEMANTIC = {
    ink:           BRAND.inkBlack,
    paper:         BRAND.paperWhite,
    paperPure:     BRAND.paperPure,
    accent:        BRAND.brass,
    accentAlt:     BRAND.signalRed,
    pageBg:        BRAND.ironGrey,
    pageBgDeep:    BRAND.graphite,
    inkOnDark:     BRAND.paperWhite,
    rule:          'rgba(255,255,255,0.12)',
  };

  // ── Шрифты (стр. 7 PDF + docs/brand/Fonts-requirements.docx) ─────
  // Назначение:
  //   Nolde     — заголовки, крупные цифры, буквицы
  //   21 Cent   — длинные тексты, параграфы, body
  //   20 Kopeek — короткие надписи, акценты, кнопки, метки
  const FONTS = {
    display: "'Nolde', 'Playfair Display', Georgia, serif",
    body:    "'21 Cent', 'PT Serif', Georgia, serif",
    accent:  "'20 Kopeek', '21 Cent', Georgia, serif",
    mono:    "'20 Kopeek', 'JetBrains Mono', 'Courier New', monospace",
    stamp:   "'20 Kopeek', 'Special Elite', monospace",
  };

  // Палитра лагерей (выровнено с брендом где возможно, см. tokens.css)
  const CAMPS = {
    red:          BRAND.signalRed,         // Красные ← сигнальный красный RAL 3001
    redDeep:      '#6a0f14',
    white:        BRAND.telegrey4,         // Белые ← Телегрей 4 RAL 7047
    revDem:       '#8C4A99',               // вне бренд-палитры (идентифицирует лагерь)
    green:        '#5A8E55',
    national:     BRAND.brass,             // Национальные ← Латунь
    intervention: '#2F4A6B',
  };

  window.BRAND_THEME = Object.assign({}, BRAND, SEMANTIC, { camp: CAMPS });
  window.BRAND_FONTS = FONTS;
})();
