// ┌──────────────────────────────────────────────────────────────────────┐
// │  Разбор значений токенов и расчёт читаемости.                        │
// │  Общий модуль: им пользуются build-tokens.mjs (артефакты проекта)    │
// │  и build-ds-cards.mjs (карточки в дизайн-систему).                   │
// └──────────────────────────────────────────────────────────────────────┘
//
// Вынесено из build-tokens.mjs 2026-08-05. Причина: карточки палитры,
// уходящие в дизайн-систему, обязаны печатать ТЕ ЖЕ числа, что каталог.
// Со своей копией формулы они разъедутся молча — и разъедутся именно там,
// где мы чиним источник неверных чисел.

export const REF_RE = /^\{([a-z0-9-]+)\}$/;
export const MIX_RE = /^mix\(\s*\{([a-z0-9-]+)\}\s*,\s*\{([a-z0-9-]+)\}\s*,\s*([\d.]+)%\s*\)$/;
export const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function fail(msg) {
  console.error(`\n  ✗ tokens: ${msg}\n`);
  process.exit(1);
}

export function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

// Смешение в sRGB — так же, как это делает браузер для color-mix(in srgb, …).
// Держим sRGB намеренно: полутона должны совпадать с тем, что видит дизайнер
// в пипетке поверх отрендеренной страницы.
export function mixHex(a, b, pct) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const t = pct / 100;
  const ch = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`.toUpperCase();
}

/** Разрешает значение токена до конечной строки (для JS-артефакта и для mix). */
export function resolve_(name, tokens, seen = []) {
  if (seen.includes(name)) fail(`циклическая ссылка: ${[...seen, name].join(' → ')}`);
  const t = tokens[name];
  if (!t) fail(`ссылка на несуществующий токен {${name}} (из ${seen.at(-1) ?? '?'})`);
  const v = String(t.value);

  const ref = v.match(REF_RE);
  if (ref) return resolve_(ref[1], tokens, [...seen, name]);

  const mix = v.match(MIX_RE);
  if (mix) {
    const [, a, b, pct] = mix;
    const av = resolve_(a, tokens, [...seen, name]);
    const bv = resolve_(b, tokens, [...seen, name]);
    if (!HEX_RE.test(av) || !HEX_RE.test(bv))
      fail(`mix() в «${name}» требует hex с обеих сторон, получено ${av} и ${bv}`);
    return mixHex(av, bv, Number(pct));
  }

  return v;
}

// ── читаемость: на каком фоне цвет работает КАК ТЕКСТ ──────────────────────
//
// Палитра работает заливкой, а как текст — только на своём фоне, и в имени
// токена это ничем не выражено. «--ink-3» читается как «цвет текста», а он
// цвет текста ДЛЯ СВЕТЛОГО: на тёмной панели даёт контраст 1.29.
// За одни сутки я ошиблась так трижды — 1.45, 1.08, 1.29, — и ни одну
// из трёх линтер поймать не мог: фон везде стоял на предке через разметку,
// а не в том же правиле.
//
// Поэтому ответ считается ЗДЕСЬ и едет в каталог, к свотчу: выбирая цвет,
// видишь сразу, где им можно писать. Это дешевле любого правила, потому что
// работает в момент выбора, а не в момент прогона.
export const SURFACES = { light: 'paper-white', dark: 'page-bg-deep' };

export function srgbLum(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [srgbLum(a), srgbLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Два порога, а не один — иначе инструмент врёт про главный цвет проекта.
 *
 *  WCAG: обычный текст 4.5, крупный (≥24px, либо ≥19px полужирный) — 3.0.
 *  Без второго порога --brass попадает в «не читается ни на чём»: на
 *  графите он даёт 4.2. Но заголовки набраны именно брассом и именно
 *  крупно, и там 4.2 законно. Правило, объявляющее ведущий акцент
 *  негодным, перестают слушать целиком — а вместе с ним и верную часть.
 *
 *  ⚠️ Порог 3.0 отвечает и за ГРАФИКУ — метки, точки, полоски, границы
 *  (WCAG 1.4.11 non-text contrast). Это отдельный вопрос от текста, и
 *  бейдж на него НЕ отвечает: он считает цвет против поверхности, а
 *  цветная метка живёт на своём фоне. Точка «Белых» на светлой пилюле
 *  дала 1.39 при исправном бейдже — 2026-08-05, блок #c-related.
 *
 *  Возвращает {light, dark, on, onLarge} либо null, если это не цвет. */
export const TH = { text: 4.5, large: 3.0 };

export function legibility(name, tokens) {
  const v = resolve_(name, tokens);
  if (!HEX_RE.test(v)) return null;
  const out = {};
  for (const [k, surf] of Object.entries(SURFACES)) {
    out[k] = Math.round(contrast(v, resolve_(surf, tokens)) * 100) / 100;
  }
  const pick = (min) => {
    const ok = Object.keys(SURFACES).filter((k) => out[k] >= min);
    return ok.length === 2 ? 'both' : (ok[0] ?? 'none');
  };
  out.on = pick(TH.text);
  out.onLarge = pick(TH.large);
  return out;
}
