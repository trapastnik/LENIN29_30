// ┌──────────────────────────────────────────────────────────────────────┐
// │  Карточки блоков для Lenin Centre Design System.                     │
// │  node scripts/design/build-ds-blocks.mjs [--check]                    │
// └──────────────────────────────────────────────────────────────────────┘
//
// ИЗВЛЕКАЕТ из brand.html, а не пересказывает его.
//
// Довод — сегодняшний, дважды подтверждённый: ручной перенос даёт брак
// примерно в половине случаев (девять неверных hex из восемнадцати при
// переносе полутонов наверх). Здесь переносить пришлось бы разметку
// семи блоков и их CSS — заведомо больше восемнадцати позиций.
//
// Поэтому блок, подпись и правила берутся из каталога дословно. Разошлись
// — значит кто-то правил каталог, и --check роняет прогон: карточка
// наверху обязана показывать то же, что образец у нас, иначе мы заводим
// второй источник ровно там, где чиним первый.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { resolve_ } from './lib/color.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const p = (...s) => resolve(ROOT, ...s);

const SRC    = p('brand.html');
const TOKENS = p('src/design/tokens.json');
const OUT    = p('src/design-lab/2026-08-04-design-system-sync/preview');

const html = readFileSync(SRC, 'utf8');
const { tokens } = JSON.parse(readFileSync(TOKENS, 'utf8'));
const check = process.argv.includes('--check');

const PAGE = resolve_('page-bg', tokens);
const INK  = resolve_('paper-white', tokens);

// ── извлечение ─────────────────────────────────────────────────────────────

/** Все правила каталога, чей селектор начинается с одного из префиксов.
 *
 *  Обход по скобкам, а не регуляркой. Первая версия была регуляркой
 *  `([^{}@]+)\{([^{}]*)\}` и молча потеряла девять правил из двадцати
 *  шести: она спотыкалась об @media и о правила после него. Причём
 *  потеряла ТИХО — карточки собрались, отчёт напечатал «8/8», а .d-card
 *  остался без правил. Поймала отдельная сверка «каждый класс разметки
 *  имеет правило», без неё уехало бы наверх восемь пустых блоков. */
function rulesFor(prefixes) {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const out = [];
  const wanted = (sel) =>
    prefixes.some((pre) => sel.split(',').some((s) => s.trim().replace(/^&/, '').startsWith(pre)));

  const walk = (css, wrap = null) => {
    let i = 0, head = '';
    while (i < css.length) {
      const ch = css[i];
      if (ch === '{') {
        // найти парную закрывающую
        let d = 1, j = i + 1;
        while (j < css.length && d > 0) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
        const body = css.slice(i + 1, j - 1);
        const sel = head.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
        if (sel.startsWith('@')) {
          if (!/^@(font-face|keyframes|import|charset)/i.test(sel)) walk(body, sel);
        } else if (sel && wanted(sel)) {
          const rule = `${sel} {${body.replace(/\n\s+/g, '\n  ')}}`;
          out.push(wrap ? `${wrap} {\n  ${rule.replace(/\n/g, '\n  ')}\n}` : rule);
        }
        head = ''; i = j;
      } else { head += ch; i++; }
    }
  };
  walk(styles);
  return out;
}

/** Разметка и подпись одного блока каталога. */
function block(anchor) {
  const re = new RegExp(`<figure class="block-demo" id="${anchor}">([\\s\\S]*?)</figure>`);
  const m = html.match(re);
  if (!m) return null;
  const inner = m[1];
  const cap = inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
  const markup = inner.replace(/<figcaption>[\s\S]*?<\/figcaption>/, '').trim();
  return { markup, caption: cap ? cap[1].trim() : '' };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** :root с ровно теми токенами, которые карточка использует.
 *
 *  Карточка обязана быть САМОДОСТАТОЧНОЙ. Наверху набор токенов другой
 *  и меняется без нас: --sh-1 там нет вовсе, а он взят БЕЗ ЗАПАСА —
 *  невалидный var() гасит объявление целиком, и тень пропала бы молча.
 *
 *  Заодно снимается спор про шкалу: наши отступы и радиусы вдвое крупнее
 *  верхних, и подставлять их в общий файл нельзя (решение оркестратора
 *  2026-08-05 — документировать, не унифицировать). Локальный :root
 *  делает блок верным в НАШЕЙ системе, ничего не навязывая соседям. */
function rootFor(css) {
  const used = new Set([...css.matchAll(/var\(\s*--([a-z0-9-]+)/g)].map((m) => m[1]));
  const lines = [];
  for (const name of [...used].sort()) {
    if (!tokens[name]) continue;
    lines.push(`    --${name}: ${resolve_(name, tokens)};`);
  }
  return lines.length
    ? `  /* Значения киоска МТК 29. Шкала здесь ВДВОЕ крупнее базовой\n` +
      `     шкалы дизайн-системы — см. карточку Spacing scale. */\n` +
      `  :root {\n${lines.join('\n')}\n  }\n`
    : '';
}

const SHELL = (title, group, css, body, caption, anchor) => `<!-- @dsCard group="${group}" -->
<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="../colors_and_type.css">
<style>
  html,body{margin:0;background:${PAGE};color:${INK};font-family:var(--font-body,Georgia,serif);}
  .wrap{padding:20px 22px;}
  h1{font-family:var(--font-mono);font-size:12px;letter-spacing:.24em;text-transform:uppercase;
     color:var(--brass);margin:0 0 14px;}
  .cap{font-family:var(--font-mono);font-size:11px;line-height:1.65;opacity:.85;
       max-width:74ch;margin:16px 0 0;}
  .cap b{color:var(--brass);}
  .cap code{color:var(--brass);}
  .src{font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
       opacity:.45;margin-top:12px;}
${rootFor(css)}${css}
</style></head><body><div class="wrap">
  <h1>${esc(title)}</h1>
  ${body}
  <p class="cap">${caption}</p>
  <p class="src">Извлечено из brand.html${anchor ? ` · ${anchor}` : ''} — не править руками</p>
</div></body></html>
`;

// ── семь блоков ────────────────────────────────────────────────────────────
const D_CSS = rulesFor(['.d-']).map((r) => '  ' + r.replace(/\n/g, '\n  ')).join('\n');

const BLOCKS = [
  ['c-spravka-card',   'Карточка справки',      'Components'],
  ['c-venn-chip',      'Чип диаграммы Венна',   'Components'],
  ['c-territory-cell', 'Ячейка территории',     'Components'],
  ['c-chronicle-row',  'Строка хроники',        'Components'],
  ['c-longread-block', 'Блок лонгрида',         'Components'],
  ['c-map-legend',     'Легенда карты',         'Components'],
  ['c-states',         'Состояния',             'Components'],
];

const cards = {};
const missing = [];
for (const [anchor, title, group] of BLOCKS) {
  const b = block(anchor);
  if (!b) { missing.push(anchor); continue; }
  cards[`block-${anchor.replace(/^c-/, '')}.html`] =
    SHELL(title, group, D_CSS, b.markup, b.caption, anchor);
}

// ── восьмой: связанные справки, отдельный раздел каталога ──────────────────
{
  const sec = html.match(/<section class="cat-section" id="c-related">([\s\S]*?)<\/section>/);
  if (!sec) missing.push('c-related');
  else {
    const fig = sec[1].match(/<figure class="block-demo">([\s\S]*?)<\/figure>/);
    const markup = fig ? fig[1].replace(/<figcaption>[\s\S]*?<\/figcaption>/, '')
                              .replace(/<span class="tag-rec">[\s\S]*?<\/span>/, '').trim() : '';
    const caption = fig?.[1].match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1].trim() ?? '';
    const relCss = rulesFor(['.rel-', '.d-']).map((r) => '  ' + r.replace(/\n/g, '\n  ')).join('\n');
    cards['block-related.html'] = SHELL(
      'Связанные справки', 'Components', relCss, markup, caption, 'c-related');
  }
}

// ── каждый класс разметки обязан получить правило ──────────────────────────
//
// Без этой сверки первая версия экстрактора уехала бы наверх с восемью
// пустыми блоками при бодром отчёте «8/8»: правила терялись, разметка
// оставалась, и карточка рисовала неформатированный текст. Отчёт был
// правдоподобным — считал файлы, а не то, работают ли они.
// Роняет ТОЛЬКО потерю: правило есть в каталоге, но не доехало в карточку.
// Класс, у которого правил нет и в каталоге, — не сбой переноса, а факт
// про каталог; он печатается и не роняет. Узкое падение, громкий отчёт:
// широкое падение здесь сделало бы гейт красным на честной семантике.
const lost = [], semantic = [];
for (const [file, out] of Object.entries(cards)) {
  const [css, body] = out.split('</style>');
  const used = new Set();
  for (const m of (body ?? '').matchAll(/class="([^"]+)"/g))
    m[1].split(/\s+/).forEach((c) => { if (/^(d|rel)-/.test(c)) used.add(c); });
  for (const c of used) {
    if (new RegExp(`\\.${c}\\b`).test(css)) continue;
    (new RegExp(`\\.${c}\\b[^{]*\\{`).test(html) ? lost : semantic).push(`${file}: .${c}`);
  }
}
if (lost.length) {
  console.error('\n  ✗ правило есть в brand.html, но не доехало в карточку:');
  for (const n of lost) console.error('      ' + n);
  console.error('    Блок отрисуется голым при бодром отчёте. Чинить экстрактор.\n');
  process.exit(1);
}
if (semantic.length) {
  console.log(`  ℹ классов без правил и в каталоге: ${semantic.length}` +
              ` — ${semantic.map((s) => s.split(': ')[1]).join(' ')}`);
  console.log('    Это семантические крючки, не потеря переноса.');
}

// ── запись ─────────────────────────────────────────────────────────────────
if (missing.length) {
  console.error(`\n  ✗ в brand.html не найдены блоки: ${missing.join(', ')}` +
                `\n    Якорь переименован или блок удалён — карточка наверху осиротеет.\n`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
let diverged = 0;
for (const [file, out] of Object.entries(cards)) {
  const dest = resolve(OUT, file);
  let prev = null;
  try { prev = readFileSync(dest, 'utf8'); } catch { /* впервые */ }
  const same = prev === out;
  if (check) { console.log(`  ${same ? '=' : '≠'} ${relative(ROOT, dest)}`); if (!same) diverged++; continue; }
  writeFileSync(dest, out);
  console.log(`  ${same ? '=' : '→'} ${relative(ROOT, dest)}`);
}

if (check && diverged) {
  console.error(`\n  ✗ карточки блоков разошлись с brand.html: ${diverged}.` +
                `\n    Собрать: node scripts/design/build-ds-blocks.mjs\n`);
  process.exit(1);
}

const n = Object.keys(cards).length;
console.log(`\n  Блоков ${n}/${BLOCKS.length + 1}, правил .d-*/.rel-* перенесено ${rulesFor(['.d-', '.rel-']).length}.\n`);
