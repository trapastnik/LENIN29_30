#!/usr/bin/env node
// Генератор дизайн-токенов МТК 29.
//
//   node scripts/design/build-tokens.mjs           — записать артефакты
//   node scripts/design/build-tokens.mjs --check    — только проверить, что
//       артефакты в репозитории совпадают с src/design/tokens.json (код 1, если нет)
//
// Источник: src/design/tokens.json — единственный.
// Артефакты (оба КОММИТЯТСЯ — сборка идёт на сервере и не гоняет генератор):
//   src/styles/tokens.css        — CSS-переменные + ручной хвост tokens-tail.css
//   public/expo/brand-tokens.js  — window.MTK_TOKENS и совместимые бандлы
//
// Зависимостей нет: чистый Node.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const p = (...s) => resolve(ROOT, ...s);

const SRC       = p('src/design/tokens.json');
const TAIL      = p('scripts/design/tokens-tail.css');
const OUT_CSS   = p('src/styles/tokens.css');
const OUT_JS    = p('public/expo/brand-tokens.js');
const OUT_FONTS = p('src/styles/fonts.css');
const OUT_SCENE = p('public/expo/brand-tokens.css');

const BANNER_CSS = (src) => `/* ┌──────────────────────────────────────────────────────────────────────┐
   │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.                     │
   │  Источник:  ${src}
   │  Генератор: node scripts/design/build-tokens.mjs                     │
   │  Хвост (.brand-scroll) — scripts/design/tokens-tail.css              │
   └──────────────────────────────────────────────────────────────────────┘ */`;

const BANNER_JS = (src) => `// ┌──────────────────────────────────────────────────────────────────────┐
// │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.                     │
// │  Источник:  ${src}
// │  Генератор: node scripts/design/build-tokens.mjs                     │
// └──────────────────────────────────────────────────────────────────────┘
//
// Заменяет прежний public/expo/theme.js. Подключается ОБЫЧНЫМ <script> до
// любого jsx — сцена /expo/ работает без сборщика, модулей здесь быть не может.`;

// ── разбор значений и читаемость — общий модуль ────────────────────────────
// Формула контраста и разрешение {ref}/mix() живут в lib/color.mjs: тем же
// кодом считаются карточки палитры, уходящие в дизайн-систему. Своя копия
// формулы разъехалась бы молча — ровно там, где мы чиним источник чисел.
import {
  REF_RE, MIX_RE, HEX_RE, fail, hexToRgb, mixHex,
  resolve_, SURFACES, srgbLum, contrast, TH, legibility,
} from './lib/color.mjs';

/** Значение для CSS: ссылка остаётся var(--x), чтобы связь была видна в devtools. */
function cssValue(name, tokens) {
  const v = String(tokens[name].value);
  const ref = v.match(REF_RE);
  if (ref) return { out: `var(--${ref[1]})`, note: null };
  const mix = v.match(MIX_RE);
  if (mix) return { out: resolve_(name, tokens), note: v };
  return { out: v, note: null };
}

/** Рекурсивно разрешает {ref} внутри карты бандла. */
function resolveMap(node, tokens, path = 'bundle') {
  if (typeof node === 'string') {
    const ref = node.match(REF_RE);
    if (ref) {
      if (!tokens[ref[1]]) fail(`${path}: ссылка на несуществующий токен {${ref[1]}}`);
      return resolve_(ref[1], tokens);
    }
    if (HEX_RE.test(node))
      fail(`${path}: сырой hex «${node}» в бандле. Заведи токен и сошлись на него — иначе это вторая палитра.`);
    return node;
  }
  if (Array.isArray(node)) return node.map((n, i) => resolveMap(n, tokens, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, resolveMap(v, tokens, `${path}.${k}`)]),
    );
  }
  return node;
}

// ── чтение и валидация источника ───────────────────────────────────────────
const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const { groups, tokens, bundles } = raw;

if (raw.schema !== 1) fail(`неизвестная версия схемы: ${raw.schema}`);

const groupById = new Map(groups.map(g => [g.id, g]));
for (const [name, t] of Object.entries(tokens)) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(`имя токена «${name}» не в kebab-case`);
  if (!groupById.has(t.group)) fail(`токен «${name}»: неизвестная группа «${t.group}»`);
  if (t.value == null || t.value === '') fail(`токен «${name}» без значения`);
}

// Разрешаем всё разом — здесь же ловятся циклы и битые ссылки.
const resolved = Object.fromEntries(
  Object.keys(tokens).map(name => [name, resolve_(name, tokens)]),
);

// ── CSS ────────────────────────────────────────────────────────────────────
function buildCss() {
  const L = [];
  L.push(BANNER_CSS(relative(ROOT, SRC)));
  L.push('');
  L.push(':root {');

  for (const g of groups) {
    if (g.css === false) continue;
    const names = Object.keys(tokens).filter(n => tokens[n].group === g.id);
    if (!names.length) continue;

    L.push(`  /* ── ${g.title} ${'─'.repeat(Math.max(2, 58 - g.title.length))} */`);
    for (const c of [].concat(g.comment ?? [])) L.push(`  /* ${c} */`);

    const pad = Math.max(...names.map(n => n.length)) + 4;
    for (const name of names) {
      const { out, note } = cssValue(name, tokens);
      const decl = `  --${name}:`.padEnd(pad + 5) + ` ${out};`;
      const comment = [tokens[name].note, note && `= ${note}`].filter(Boolean).join(' · ');
      L.push(comment ? `${decl.padEnd(58)} /* ${comment} */` : decl);
    }
    L.push('');
  }

  // хвост от последней группы
  while (L.at(-1) === '') L.pop();
  L.push('}');
  L.push('');
  L.push(readFileSync(TAIL, 'utf8').trimEnd());
  L.push('');
  return L.join('\n');
}

// ── @font-face ─────────────────────────────────────────────────────────────
// Один реестр, два файла: они лежат на разной глубине и путь к public/fonts/
// у них разный. src/styles/ обрабатывает vite, public/expo/ — нет.
function buildFontFaces(prefix) {
  const L = [];
  for (const f of raw.fontFaces.faces) {
    const src = f.src.map(([file, fmt]) => `url('${prefix}${file}') format('${fmt}')`);
    L.push('@font-face {');
    L.push(`  font-family: '${f.family}';`);
    L.push(`  font-weight: ${f.weight};`);
    L.push(`  font-style: ${f.style};`);
    L.push('  font-display: swap;');
    L.push(`  src: ${src.join(',\n       ')};`);
    L.push('}');
  }
  return L.join('\n');
}

function buildFontsCss() {
  return [
    BANNER_CSS(relative(ROOT, SRC)),
    '',
    ...[].concat(raw.fontFaces.comment).map(c => (c ? `/* ${c} */` : '')),
    '',
    buildFontFaces('/fonts/'),
    '',
  ].join('\n');
}

// CSS для сцены /expo/: те же @font-face и те же :root-переменные, но пути
// относительные. Подключается страницами сцены ОДНОЙ строкой — они не могут
// сослаться на src/styles/, потому что в dist/ этого каталога нет.
function buildSceneCss() {
  const tokensBlock = buildCss()
    .split('\n')
    .slice(BANNER_CSS('x').split('\n').length + 1)   // отрезаем баннер, свой ниже
    .join('\n');
  return [
    BANNER_CSS(relative(ROOT, SRC)),
    '',
    '/* Для страниц public/expo/**. В dist/ каталога src/styles/ не существует:',
    '   /expo/ лежит в public/, vite копирует его как есть и ссылки не правит.',
    '   Поэтому здесь и @font-face, и :root — одним файлом с путями «../fonts/». */',
    '',
    buildFontFaces('../fonts/'),
    '',
    tokensBlock,
    '',
    '/* ── Пин --ui-scale здесь БОЛЬШЕ НЕ СТОИТ, и это намеренно ─────────────',
    '',
    '   До 2026-08-04 файл заканчивался строкой `:root { --ui-scale: 1 }`.',
    '   Она защищала от четырёхкратного размера: главная масштабирует свой',
    '   canvas 1920 → 3840 сама, и ×2 поверх ×2 дали бы ×4.',
    '',
    '   Основание было верным ровно для одной страницы из трёх. Canvas есть',
    '   только у index.html; people.html и chronicle.html прокручиваются',
    '   и своего масштабирования не имеют — пин оставлял их на 4K вдвое',
    '   мельче. Одна и та же кнопка «к экспозиции» давала 240 физических',
    '   пикселей на главной и 120 внутри раздела.',
    '',
    '   Пин переехал в index.html, к тому canvas, от которого защищает.',
    '   Заводить его обратно сюда нельзя: этот файл грузят все страницы',
    '   сцены, а canvas — не у всех. */',
  ].join('\n');
}

// ── JS ─────────────────────────────────────────────────────────────────────
const j = (v) => JSON.stringify(v);

function buildJs() {
  const L = [];
  L.push(BANNER_JS(relative(ROOT, SRC)));
  L.push('');
  L.push('(function () {');
  L.push("  'use strict';");
  L.push('');

  // Плоская карта значений
  L.push('  // Все токены с разрешёнными значениями: MTK_TOKENS[\'brass\'] === \'#D2B773\'.');
  L.push('  var TOKENS = {');
  for (const name of Object.keys(tokens)) L.push(`    ${j(name)}: ${j(resolved[name])},`);
  L.push('  };');
  L.push('');

  // Метаданные — для brand.html: группа, подпись, deprecated
  L.push('  // Метаданные для brand.html: каталог рисует свотчи циклом по этим данным,');
  L.push('  // а не описывает палитру вторым списком.');
  L.push('  var META = {');
  for (const [name, t] of Object.entries(tokens)) {
    const g = groupById.get(t.group);
    const m = { group: t.group, css: g.css !== false };
    if (t.note) m.note = t.note;
    if (g.deprecated || t.deprecated) m.deprecated = true;
    const leg = legibility(name, tokens);
    if (leg) m.legible = leg;
    L.push(`    ${j(name)}: ${j(m)},`);
  }
  L.push('  };');
  L.push('');

  L.push('  var GROUPS = [');
  for (const g of groups) {
    const names = Object.keys(tokens).filter(n => tokens[n].group === g.id);
    const entry = { id: g.id, title: g.title, css: g.css !== false, tokens: names };
    if (g.deprecated) entry.deprecated = true;
    if (g.comment) entry.comment = [].concat(g.comment).join(' ');
    L.push(`    ${j(entry)},`);
  }
  L.push('  ];');
  L.push('');

  // Бандлы
  for (const [globalName, spec] of Object.entries(bundles)) {
    if (spec.kind === 'auto') continue;
    if (spec.kind !== 'map') fail(`бандл ${globalName}: неизвестный kind «${spec.kind}»`);
    for (const c of [].concat(spec.comment ?? [])) L.push(`  // ${c}`);
    if (spec.deprecated) L.push('  // DEPRECATED — снимается на шаге 3.');
    const value = resolveMap(spec.map, tokens, globalName);
    L.push(`  var ${globalName} = ${JSON.stringify(value, null, 2).split('\n').join('\n  ')};`);
    L.push('');
  }

  L.push('  window.MTK_TOKENS     = TOKENS;');
  L.push('  window.MTK_TOKEN_META = META;');
  L.push('  window.MTK_GROUPS     = GROUPS;');
  for (const [globalName, spec] of Object.entries(bundles)) {
    if (spec.kind === 'auto') continue;
    L.push(`  window.${globalName}${' '.repeat(Math.max(0, 13 - globalName.length))} = ${globalName};`);
  }
  L.push('})();');
  L.push('');
  return L.join('\n');
}

// ── запись / проверка ──────────────────────────────────────────────────────
const artifacts = [
  [OUT_CSS,   buildCss()],
  [OUT_JS,    buildJs()],
  [OUT_FONTS, buildFontsCss()],
  [OUT_SCENE, buildSceneCss()],
];

const check = process.argv.includes('--check');
let drift = 0;

for (const [file, next] of artifacts) {
  const rel = relative(ROOT, file);
  let current = null;
  try { current = readFileSync(file, 'utf8'); } catch {}

  if (current === next) {
    console.log(`  = ${rel}`);
    continue;
  }
  if (check) {
    console.error(`  ✗ ${rel} разошёлся с ${relative(ROOT, SRC)}`);
    drift++;
    continue;
  }
  writeFileSync(file, next, 'utf8');
  console.log(`  ${current === null ? '+' : '~'} ${rel}`);
}

if (check && drift) {
  console.error(`\n  Артефактов разошлось: ${drift}. Прогони: node scripts/design/build-tokens.mjs\n`);
  process.exit(1);
}
if (check) console.log(`\n  Токены синхронны (${Object.keys(tokens).length} шт.)\n`);
else console.log(`\n  Готово: ${Object.keys(tokens).length} токенов, ${Object.keys(bundles).length - 1} бандлов\n`);
