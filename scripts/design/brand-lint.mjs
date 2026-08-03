#!/usr/bin/env node
// Линтер дизайн-кода МТК 29. Зависимостей нет.
//
//   node scripts/design/brand-lint.mjs           — ошибки валят прогон
//   node scripts/design/brand-lint.mjs --warn     — всё как предупреждения, код 0
//   node scripts/design/brand-lint.mjs --json     — машинный отчёт (его читает brand.html)
//   node scripts/design/brand-lint.mjs --list     — все нарушения построчно, без свёртки
//   node scripts/design/brand-lint.mjs --update-baseline — записать текущие счётчики в долг
//
// Почему это вообще есть (CLAUDE.md §13): регламент без механической проверки
// не работает. Правило про курсив на Nolde было записано в трёх документах —
// и всё равно накопилось два с половиной десятка нарушений. Правило должно
// быть либо в линтере, либо его нет.
//
// Модель долга. Нарушения не перечисляются построчно в исключениях: номера
// строк плывут от любой правки, и файл исключений превращается в помойку.
// Вместо этого в brand-lint.baseline.json лежит СЧЁТЧИК на пару (правило, файл).
// Стало больше — прогон падает. Стало меньше — линтер требует опустить планку.
// Так долг может только уменьшаться.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const rel = (f) => relative(ROOT, f).split('\\').join('/');

const BASELINE_FILE = resolve(HERE, 'brand-lint.baseline.json');
const TOKENS_FILE   = resolve(ROOT, 'src/design/tokens.json');

const argv = process.argv.slice(2);
const MODE = {
  warn:   argv.includes('--warn'),
  json:   argv.includes('--json'),
  list:   argv.includes('--list'),
  update: argv.includes('--update-baseline'),
};

// ── что сканируем ──────────────────────────────────────────────────────────
// Не сканируем: чужие зоны на заморозке, приёмники импорта, генерируемое.
const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.git',
  'public/prototypes',      // R&D-стенды, заморожены (CLAUDE.md §4); :hover там легален
  'public/expo/uploads',    // импортированные ассеты design-pass
  'public/content',         // контент, владеет зона content
  'public/fonts',
  'public/decor',
  'src/design-lab',         // приёмник экспортов Claude Design, адаптируется отдельно
  'docs',
  'public/expo/build',      // скомпилированный JSX (scripts/expo/build-jsx.mjs).
                            // Коммитится, но это КОПИЯ соседних .jsx — считая и то
                            // и другое, линтер удваивал долг: одна правка курсива
                            // в shared.jsx роняла счётчик на 2. Правят исходник.
  'scripts/design',         // сам линтер и генератор: их исходники содержат
                            // образцы запрещённых конструкций как строки и регэкспы
]);
const SKIP_FILES = new Set([
  'public/expo/brand-tokens.js',  // генерируется из tokens.json
  'src/styles/tokens.css',        // генерируется из tokens.json
  'calendar.html',                // R&D-стенд на заморозке (CLAUDE.md §4)
]);
const EXT = new Set(['.css', '.js', '.jsx', '.html', '.mjs']);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const r = rel(full);
    if (SKIP_DIRS.has(r) || entry.startsWith('.')) continue;
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (EXT.has(extname(entry)) && !SKIP_FILES.has(r)) acc.push(full);
  }
  return acc;
}

// ── утилиты разбора ────────────────────────────────────────────────────────

/** Затирает содержимое комментариев пробелами: длина и переводы строк целы,
 *  поэтому номера строк и смещения остаются верными. */
function maskComments(text) {
  const keepWs = (m) => m.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, keepWs)
    .replace(/<!--[\s\S]*?-->/g, keepWs);
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text[i] === '\n') line++;
  return line;
}

function lineText(text, index) {
  const a = text.lastIndexOf('\n', index) + 1;
  let b = text.indexOf('\n', index);
  if (b < 0) b = text.length;
  return text.slice(a, b).trim().slice(0, 160);
}

/** Текст ближайшего охватывающего блока { … } — CSS-правило или объектный
 *  литерал в JSX. Нужен, чтобы понять, какой шрифт стоит рядом с курсивом. */
function enclosingBlock(text, index, maxBack = 4000) {
  let depth = 0, start = -1;
  for (let i = index; i >= Math.max(0, index - maxBack); i--) {
    if (text[i] === '}') depth++;
    else if (text[i] === '{') {
      if (depth === 0) { start = i; break; }
      depth--;
    }
  }
  if (start < 0) return text.slice(Math.max(0, index - 400), index + 400);

  depth = 0;
  let end = text.length;
  for (let i = start; i < Math.min(text.length, start + maxBack * 2); i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return text.slice(start, end);
}

// ── источник истины по токенам ─────────────────────────────────────────────
const tokensJson = JSON.parse(readFileSync(TOKENS_FILE, 'utf8'));
const groupCss = new Map(tokensJson.groups.map(g => [g.id, g.css !== false]));
/** Имена токенов, которые реально доезжают до CSS. */
const CSS_TOKENS = new Set(
  Object.entries(tokensJson.tokens)
    .filter(([, t]) => groupCss.get(t.group))
    .map(([name]) => name),
);
/** Все значения из tokens.json — hex отсюда легален где угодно (это и есть бренд). */
const TOKEN_VALUES = new Set(
  Object.values(tokensJson.tokens).map(t => String(t.value).toLowerCase()),
);

// ── постоянные исключения + долг ───────────────────────────────────────────
let baseline = { allow: [], debt: {} };
try { baseline = { allow: [], debt: {}, ...JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) }; } catch {}

/** Постоянное исключение: {rule, file, match?, why}. `file` — префикс пути. */
function isAllowed(v) {
  return baseline.allow.some(a =>
    (!a.rule || a.rule === v.rule) &&
    (!a.file || v.file === a.file || v.file.startsWith(a.file.replace(/\*$/, ''))) &&
    (!a.match || (v.match ?? '').toLowerCase().includes(a.match.toLowerCase())));
}

// ── правила ────────────────────────────────────────────────────────────────
const RULES = {
  R1: { level: 'error', title: 'сырой hex вне tokens.json и исключений' },
  R2: { level: 'error', title: 'var(--x, #hex) — fallback это скрытая вторая палитра' },
  R3: { level: 'error', title: 'курсив на Nolde / --font-display' },
  R4: { level: 'error', title: 'var(--x) для несуществующего токена' },
  R5: { level: 'error', title: ':hover в киосковом коде' },
  R6: { level: 'error', title: 'внешний CDN — киоск офлайн' },
  R7: { level: 'warn',  title: 'тач-цель меньше 48px' },
  R8: { level: 'error', title: 'артефакты разошлись с tokens.json' },
};

const violations = [];
const add = (rule, file, index, text, match, extra) => violations.push({
  rule, file: rel(file), line: index == null ? 0 : lineOf(text, index),
  match, snippet: index == null ? (extra ?? '') : lineText(text, index), extra,
});

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
// Осторожно с `font-display`: в CSS это дескриптор @font-face (swap/block),
// а не наш токен --font-display. Ловим только токен, свойство fontFamily и Nolde.
const DISPLAY_HINT = /Nolde|--font-display|fonts?\s*\.\s*display|\bdisplay\s*:\s*["'][^"']*Nolde/i;
const SAFE_FONT_HINT = /21\s*Cent|20\s*Kopeek|--font-(body|accent|mono|stamp)|fonts?\.(body|accent|mono|stamp|rus)/i;

function lintFile(file) {
  const raw = readFileSync(file, 'utf8');
  const src = maskComments(raw);
  const ext = extname(file);
  const isCssLike = ext === '.css' || ext === '.html';

  // ── R6 · внешние ресурсы ────────────────────────────────────────────────
  for (const m of src.matchAll(/\b(?:src|href)\s*=\s*["']\s*(https?:)?\/\/([^"'\s/]+)/gi)) {
    add('R6', file, m.index, src, m[2]);
  }
  for (const m of src.matchAll(/url\(\s*["']?\s*(?:https?:)?\/\/([^"')\s]+)/gi)) {
    add('R6', file, m.index, src, m[1]);
  }
  for (const m of src.matchAll(/@import\s+(?:url\()?["'](https?:)?\/\//gi)) {
    add('R6', file, m.index, src, 'import');
  }

  // ── R2 · var() с запасным значением ─────────────────────────────────────
  for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,([^)]*)\)/gi)) {
    const fallback = m[2].trim();
    if (!fallback) continue;
    add('R2', file, m.index, src, `var(${m[1]}, ${fallback})`);
  }

  // ── R4 · ссылка на неизвестный токен ────────────────────────────────────
  // Локально объявленные переменные легальны (компонентная геометрия),
  // поэтому в словарь идут и все `--x:` из самого файла — включая те, что
  // ставятся из JS через element.style.setProperty('--camp-color', …).
  const localDefs = new Set([
    // и `--x: …` в CSS, и `'--x': …` ключом объекта инлайн-стиля в JSX
    ...[...src.matchAll(/(--[a-z0-9-]+)["'`]?\s*:/gi)].map(m => m[1].slice(2)),
    ...[...src.matchAll(/setProperty\(\s*["'`]--([a-z0-9-]+)/gi)].map(m => m[1]),
  ]);

  for (const m of src.matchAll(/var\(\s*--([a-z0-9-]*)/gi)) {
    const name = m[1];
    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 2);

    // Имя собирается в рантайме: var(--camp-${camp.id}). Статически не
    // разрешить, но префикс проверить можно — он должен вести в живое семейство.
    if (after.startsWith('$') || after.startsWith('{')) {
      const family = [...CSS_TOKENS].some(t => t.startsWith(name));
      if (!family) add('R4', file, m.index, src, `--${name}\${…}`,
                       'динамическое имя, но ни один токен не начинается с этого префикса');
      continue;
    }
    if (!name || CSS_TOKENS.has(name) || localDefs.has(name)) continue;
    add('R4', file, m.index, src, `--${name}`);
  }

  // ── R5 · hover ──────────────────────────────────────────────────────────
  for (const m of src.matchAll(/:hover\b/g)) add('R5', file, m.index, src, ':hover');

  // ── R1 · сырой hex ──────────────────────────────────────────────────────
  for (const m of src.matchAll(HEX)) {
    const value = m[0];
    if (![4, 7, 9].includes(value.length)) continue;          // #rgb, #rrggbb, #rrggbbaa
    const before = src.slice(Math.max(0, m.index - 24), m.index);
    if (/(href|id|for|aria-\w+|name)\s*=\s*["']?$/i.test(before)) continue;   // якорь, не цвет
    if (/(getElementById|querySelector\w*)\(\s*["']?$/i.test(before)) continue;
    if (TOKEN_VALUES.has(value.toLowerCase())) {
      // Значение бренд-цвета, но вписанное числом: связь с токеном потеряна.
      add('R1', file, m.index, src, value, 'совпадает со значением токена — замени на var()/MTK_TOKENS');
      continue;
    }
    add('R1', file, m.index, src, value);
  }

  // ── R3 · курсив на Nolde ────────────────────────────────────────────────
  const italics = [
    ...src.matchAll(/font-style\s*:\s*(italic|oblique)/gi),
    ...src.matchAll(/fontStyle\s*:\s*["'](italic|oblique)["']/gi),
    ...src.matchAll(/\bfont\s*:\s*(italic|oblique)\b/gi),
  ];
  for (const m of italics) {
    const block = enclosingBlock(src, m.index);
    // @font-face — единственное место, где `font-style: italic` объявляет
    // реальный файл начертания, а не приказывает браузеру наклонить текст.
    const decl = src.slice(Math.max(0, src.lastIndexOf('{', m.index) - 200), m.index);
    if (/@font-face\s*$/m.test(decl.split('{')[0] ?? '') || /@font-face/.test(decl)) continue;

    if (DISPLAY_HINT.test(block)) add('R3', file, m.index, src, m[0].trim());
    else if (!SAFE_FONT_HINT.test(block)) {
      add('R3', file, m.index, src, m[0].trim(), 'семейство в блоке не указано — курсив может унаследоваться от Nolde');
    }
  }

  // ── R7 · тач-цель ───────────────────────────────────────────────────────
  // Только CSS-правила на кнопочных селекторах: в inline-стилях JSX размер
  // и обработчик клика надёжно не связать, там нужен ручной смоук.
  if (isCssLike) {
    for (const m of src.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const [selector, body] = [m[1], m[2]];
      if (!/(^|[\s,>+~])(button|a)\b|\.btn|\[role=["']?button/i.test(selector)) continue;
      if (/min-(width|height)\s*:\s*var\(--touch-hit\)/i.test(body)) continue;
      for (const d of body.matchAll(/\b(min-)?(width|height)\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
        if (Number(d[3]) < 48) {
          add('R7', file, m.index + m[0].indexOf(d[0]), src,
              `${selector.trim().slice(0, 48)} { ${d[0]} }`);
        }
      }
    }
  }
}

// ── R8 · артефакты против источника ────────────────────────────────────────
function lintArtifacts() {
  try {
    execFileSync(process.execPath, [resolve(HERE, 'build-tokens.mjs'), '--check'], { stdio: 'pipe' });
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
    violations.push({
      rule: 'R8', file: 'src/design/tokens.json', line: 0,
      match: 'артефакты устарели', snippet: out.split('\n').filter(Boolean).join(' · '),
    });
  }
}

// ── прогон ─────────────────────────────────────────────────────────────────
for (const f of walk(ROOT)) lintFile(f);
lintArtifacts();

const kept = violations.filter(v => !isAllowed(v));

// счётчики по паре (правило, файл)
const counts = {};
for (const v of kept) {
  counts[v.rule] ??= {};
  counts[v.rule][v.file] = (counts[v.rule][v.file] ?? 0) + 1;
}

if (MODE.update) {
  // Порядок ключей фиксируем: пояснение вверху, иначе его никто не прочитает.
  const next = { _: baseline._, allow: baseline.allow, debt: counts };
  if (!next._) delete next._;
  writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 2) + '\n');
  const total = kept.length;
  console.log(`  Долг записан: ${total} нарушений в ${new Set(kept.map(v => v.file)).size} файлах.`);
  console.log(`  ${rel(BASELINE_FILE)}`);
  process.exit(0);
}

// сравнение с долгом
const debt = baseline.debt ?? {};
const regressions = [];   // стало больше — это новое нарушение
const improvements = [];  // стало меньше — пора опустить планку
for (const rule of new Set([...Object.keys(counts), ...Object.keys(debt)])) {
  const now = counts[rule] ?? {}, was = debt[rule] ?? {};
  for (const file of new Set([...Object.keys(now), ...Object.keys(was)])) {
    const n = now[file] ?? 0, w = was[file] ?? 0;
    if (n > w) regressions.push({ rule, file, now: n, was: w });
    else if (n < w) improvements.push({ rule, file, now: n, was: w });
  }
}

if (MODE.json) {
  console.log(JSON.stringify({
    generatedBy: 'scripts/design/brand-lint.mjs',
    rules: RULES,
    total: kept.length,
    counts, regressions, improvements,
    violations: kept,
  }, null, 2));
  process.exit(0);
}

// ── человекочитаемый отчёт ─────────────────────────────────────────────────
const RESET = '\x1b[0m', DIM = '\x1b[2m', RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m';
const paint = (s, c) => (process.stdout.isTTY ? c + s + RESET : s);

console.log('');
for (const [rule, meta] of Object.entries(RULES)) {
  const byFile = counts[rule] ?? {};
  const total = Object.values(byFile).reduce((a, b) => a + b, 0);
  const head = `  ${rule}  ${meta.title}`;
  if (!total) { console.log(paint(`${head.padEnd(64)} —`, DIM)); continue; }

  const isErr = meta.level === 'error' && !MODE.warn;
  console.log(paint(`${head.padEnd(64)} ${total}`, isErr ? RED : YEL));
  for (const [file, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) {
    const w = debt[rule]?.[file] ?? 0;
    const mark = n > w ? paint(` ← было ${w}`, RED) : paint(` (в долге)`, DIM);
    console.log(paint(`        ${String(n).padStart(4)}  ${file}${w ? mark : ''}`, DIM));
  }
}

if (MODE.list) {
  console.log('\n  ── построчно ──');
  for (const v of kept.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    console.log(`  ${v.file}:${v.line}  ${v.rule}  ${v.match}`);
    if (v.extra) console.log(paint(`      ${v.extra}`, DIM));
    if (v.snippet) console.log(paint(`      ${v.snippet}`, DIM));
  }
}

console.log('');
if (improvements.length) {
  console.log(paint('  Долг уменьшился — опусти планку: node scripts/design/brand-lint.mjs --update-baseline', GRN));
  for (const i of improvements) console.log(paint(`    ${i.rule}  ${i.file}: ${i.was} → ${i.now}`, GRN));
  console.log('');
}

if (!regressions.length) {
  console.log(paint(`  ✓ Новых нарушений нет. В долге: ${kept.length}.`, GRN));
  console.log('');
  process.exit(0);
}

console.log(paint(`  ✗ Новых нарушений: ${regressions.length}`, RED));
for (const r of regressions) {
  console.log(paint(`    ${r.rule}  ${r.file}: было ${r.was}, стало ${r.now}`, RED));
  for (const v of kept.filter(v => v.rule === r.rule && v.file === r.file).slice(0, 6)) {
    console.log(paint(`        :${v.line}  ${v.match}`, DIM));
  }
}
console.log('');
process.exit(MODE.warn ? 0 : 1);
