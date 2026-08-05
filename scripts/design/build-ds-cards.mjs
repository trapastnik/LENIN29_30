// ┌──────────────────────────────────────────────────────────────────────┐
// │  Карточки палитры для Lenin Centre Design System.                    │
// │  node scripts/design/build-ds-cards.mjs [--check]                     │
// └──────────────────────────────────────────────────────────────────────┘
//
// ЗАЧЕМ ЭТО СКРИПТ, А НЕ ТРИ РУЧНЫХ ФАЙЛА
//
// Дизайн-система — ОБРАЗЕЦ. Из неё выбирают цвет, и то, чего образец
// не говорит, воспроизводится у каждого, кто оттуда выбрал. Проверено
// на себе дважды за двое суток:
//
//   · карточка `touch-target` учила порогу 48 — число прожило три месяца
//     в линтере, потому что было списано оттуда;
//   · та же карточка была НАБРАНА с контрастом 1.08 — и ровно это число
//     я потом получила у себя, выбирая цвет из палитры, где не сказано,
//     на каком фоне им можно писать.
//
// Поэтому карточки собираются из tokens.json тем же кодом, что и артефакты
// проекта (lib/color.mjs). Руками их править нельзя: разойдутся числа —
// и разойдутся именно там, где мы чиним источник неверных чисел.
//
// И поэтому карточка НЕ УТВЕРЖДАЕТ, а ПОКАЗЫВАЕТ: каждый цвет набран
// словом на светлой и на тёмной плашке. У --camp-white на светлой плашке
// не видно ничего. Это убедительнее любой подписи.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { resolve_, legibility, contrast, HEX_RE, TH } from './lib/color.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const p = (...s) => resolve(ROOT, ...s);

const SRC = p('src/design/tokens.json');
const OUT = p('src/design-lab/2026-08-04-design-system-sync/preview');

const { tokens } = JSON.parse(readFileSync(SRC, 'utf8'));
const check = process.argv.includes('--check');

// ── поверхности, на которых показываем ─────────────────────────────────────
const LIGHT = resolve_('paper-white', tokens);
const DARK  = resolve_('page-bg-deep', tokens);

// Фон самой карточки — ТРЕТЬЯ поверхность, и это не украшение: пока страница
// была графитом, тёмная плашка сливалась с ней и сравнение читалось как
// «одна плашка и текст рядом». Обе плашки обязаны быть видны как плашки.
const PAGE = resolve_('page-bg', tokens);

// Карточка про контраст обязана сама проходить по контрасту. Ровно этого
// не сделала прежняя touch-target: она учила порогу тач-цели и была набрана
// с контрастом 1.08. Проверяем здесь, чтобы не повторить в третий раз.
{
  const c = contrast(LIGHT, PAGE);
  if (c < TH.text) {
    console.error(`\n  ✗ текст карточки на её же фоне даёт ${c.toFixed(2)} < ${TH.text}\n`);
    process.exit(1);
  }
}

// Обводка метки. Порог 3.0 — это WCAG про НЕтекстовый контраст (1.4.11):
// граница фигуры обязана отделяться от фона, иначе светлая заливка
// на светлом фоне исчезает при исправном бейдже читаемости.
const RING_ON_LIGHT = resolve_('ink-faint', tokens);
const RING_ON_DARK  = resolve_('telegrey-4', tokens);

for (const [ring, surf, where] of [
  [RING_ON_LIGHT, LIGHT, 'светлой'],
  [RING_ON_DARK, DARK, 'тёмной'],
]) {
  const c = contrast(ring, surf);
  if (c < TH.large) {
    console.error(`\n  ✗ обводка метки на ${where} плашке даёт ${c.toFixed(2)} < ${TH.large}\n`);
    process.exit(1);
  }
}

// ── разметка ───────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n2 = (x) => x.toFixed(2);

/** Словесный вердикт. Отвечает ПРО ТЕКСТ — и говорит об этом прямо,
 *  потому что тот же цвет метки-заливки живёт по другому порогу. */
function verdict(L) {
  if (!L) return 'не плоский цвет — контраст не считается';
  const nm = { light: 'на светлом', dark: 'на тёмном', both: 'на любом фоне', none: null };
  if (L.on === 'both') return 'текстом на любом фоне';
  if (L.on !== 'none') return `текстом только ${nm[L.on]}`;
  if (L.onLarge === 'both') return 'только крупным кеглем, на любом фоне';
  if (L.onLarge !== 'none') return `только крупным кеглем, ${nm[L.onLarge]}`;
  return 'текстом нигде — только заливкой';
}

function tile(hex, bg, ring, value, ok) {
  const mark = ok ? '✓' : '✗';
  return `<div class="tile" style="background:${bg}">
        <span class="spec" style="color:${hex}">Аа</span>
        <span class="mark" style="background:${hex};border-color:${ring}"></span>
        <span class="num ${ok ? 'ok' : 'no'}">${n2(value)}&nbsp;${mark}</span>
      </div>`;
}

function row(name) {
  const t = tokens[name];
  const hex = resolve_(name, tokens);
  const L = legibility(name, tokens);
  const flat = HEX_RE.test(hex);
  const pair = tokens[`${name}-ink`] ? `${name}-ink` : null;

  const tiles = flat
    ? tile(hex, LIGHT, RING_ON_LIGHT, L.light, L.light >= TH.text) +
      tile(hex, DARK, RING_ON_DARK, L.dark, L.dark >= TH.text)
    : `<div class="tile wide" style="background:${DARK}"><span class="spec" style="color:${hex}">Аа</span></div>`;

  const pairLine = pair
    ? `<div class="pair">для текста на светлом — <code>--${esc(pair)}</code>
         <span class="pn">${n2(legibility(pair, tokens).light)}</span></div>`
    : '';

  return `<div class="row">
      <div class="id"><code>--${esc(name)}</code><span class="hex">${esc(hex)}</span></div>
      <div class="tiles">${tiles}</div>
      <div class="say">${esc(verdict(L))}${pairLine}
        ${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}</div>
    </div>`;
}

const CSS = `
  html,body{margin:0;background:${PAGE};color:${LIGHT};font-family:var(--font-mono,monospace);}
  .wrap{padding:18px 20px;}
  h1{font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--brass,#D2B773);margin:0 0 4px;}
  .lede{font-size:11px;line-height:1.6;opacity:.8;margin:0 0 16px;max-width:70ch;}
  .lede b{color:var(--brass,#D2B773);}
  .row{display:flex;align-items:flex-start;gap:16px;padding:10px 0;border-top:1px solid rgba(255,255,255,.10);}
  .id{width:210px;flex:none;}
  .id code{font-size:12px;color:var(--brass,#D2B773);}
  .hex{display:block;font-size:10px;opacity:.55;letter-spacing:.10em;margin-top:3px;}
  .tiles{display:flex;gap:8px;flex:none;}
  .tile{width:104px;padding:8px 10px;border-radius:4px;display:flex;align-items:center;gap:8px;}
  .tile.wide{width:216px;}
  .spec{font-size:15px;font-family:var(--font-body,Georgia,serif);line-height:1;}
  .mark{width:11px;height:11px;border-radius:50%;border-width:1px;border-style:solid;flex:none;}
  .num{margin-left:auto;font-size:10px;letter-spacing:.04em;}
  .num.ok{color:#1E5B2A;}
  .tile[style*="${DARK}"] .num.ok{color:#8FD79E;}
  .num.no{color:#8C1B21;}
  .tile[style*="${DARK}"] .num.no{color:#F0A0A4;}
  .say{font-size:11px;line-height:1.55;flex:1;min-width:190px;}
  .pair{margin-top:4px;opacity:.75;}
  .pair code{color:var(--brass,#D2B773);}
  .pn{opacity:.7;}
  .note{margin-top:5px;opacity:.5;font-size:10px;line-height:1.5;}
  .warn{margin-top:16px;border-left:3px solid var(--signal-red,#A02128);padding:2px 0 2px 11px;
        font-size:11px;line-height:1.6;max-width:74ch;}
  .warn b{color:var(--brass,#D2B773);}
`;

function card(title, lede, names, warn) {
  return `<!-- @dsCard group="Colors" -->
<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="../colors_and_type.css">
<style>${CSS}</style></head><body><div class="wrap">
  <h1>${esc(title)}</h1>
  <p class="lede">${lede}</p>
  ${names.map(row).join('\n  ')}
  <p class="warn">${warn}</p>
</div></body></html>
`;
}

// ── чем отвечает бейдж, а чем нет — повторяется на всех трёх карточках ─────
const WARN_FILL = `<b>Числа отвечают про ТЕКСТ, а не про заливку.</b>
  Цветная метка, точка, полоска, граница живут по другому порогу —
  <b>3.0</b> вместо 4.5 (WCAG 1.4.11), и меряются против своего фона,
  а не против этих двух. Перенести цвет с текста на заливку —
  не решение: точка «Белых» на светлой пилюле дала <b>1.39</b> при
  исправном бейдже. Метке нужна обводка, и обводка ставится
  <b>всем</b> меткам, а не только светлым: выборочное правило
  вёрстка не воспроизведёт.`;

const byGroup = (g) => Object.keys(tokens).filter((k) => tokens[k].group === g);

const CARDS = {
  'colors-camps.html': card(
    'Цвета лагерей',
    `Семь лагерей и парные чернила к ним. <b>Цвет лагеря — заливка;</b>
     как текст на карточке годятся не все, поэтому у каждого есть пара
     <code>--camp-*-ink</code> той же семьи. Плашки ниже — не иллюстрация,
     а проверка: где слово не видно, там им писать нельзя.`,
    [...byGroup('camp'), ...byGroup('camp-ink')],
    WARN_FILL,
  ),
  'colors-primary.html': card(
    'Основная палитра',
    `Бренд-палитра по RAL из <b>Lenin-guideline-2026</b>. Единственный
     источник — <code>src/design/tokens.json</code>, всё остальное
     генерируется. «Своих» цветов не бывает: нужен новый — заявка в зону
     <code>design</code>, а не локальная константа.`,
    byGroup('brand'),
    WARN_FILL,
  ),
  'colors-surfaces.html': card(
    'Поверхности и полутона',
    `Семантические роли и производные полутона. Полутон — не «свой» цвет,
     а формула от бренд-цвета: <code>mix(paper-white, brass, 8%)</code>,
     считает генератор. <b>Имя не говорит о фоне:</b>
     <code>--ink-3</code> читается как «цвет текста», а он цвет текста
     для светлого — на тёмной панели даёт 1.29.`,
    [...byGroup('semantic'), ...byGroup('halftone')],
    WARN_FILL,
  ),
};

// ── сверка общего colors_and_type.css с tokens.json ────────────────────────
//
// Этот файл в дизайн-системе написан руками и его читают все карточки.
// Три месяца он расходился с проектом молча — сверять было нечем, и оттуда
// в линтер уехал порог 48. Теперь расхождение роняет прогон.
//
// ЦВЕТ роняет прогон: это единственное, где расхождение бьёт молча —
// одинаковое имя, разный оттенок, и никто не заметит. МЕТРИКА печатается,
// но не роняет: там расхождение осознанное и решается не здесь (разбор
// ниже). Молча исключать нельзя ни то, ни другое — невидимый пропуск
// читается как «сверено всё».
const SHARED = p('src/design-lab/2026-08-04-design-system-sync/colors_and_type.css');

function auditShared() {
  let css;
  try { css = readFileSync(SHARED, 'utf8'); } catch { return null; }
  // Кавычки в шрифтовых стеках — не расхождение: '20 Kopeek' и "20 Kopeek"
  // это одно значение, генератор просто печатает двойные.
  const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, '').replace(/,0\./g, ',.').replace(/'/g, '"');
  const deref = (v) => {
    const m = v.match(/^var\(--([a-z0-9-]+)\)$/);
    return m ? resolve_(m[1], tokens) : v;
  };
  const isColor = (v) => HEX_RE.test(v) || /^rgba?\(/i.test(v);
  const out = { checked: 0, color: [], metric: [] };
  for (const m of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    const [, name, val] = m;
    if (!tokens[name]) continue;
    out.checked++;
    const ours = resolve_(name, tokens);
    if (norm(deref(val.trim())) === norm(ours)) continue;
    (isColor(ours) ? out.color : out.metric).push({ name, up: val.trim(), ours });
  }
  return out;
}

const audit = auditShared();
if (audit?.color.length) {
  console.error(`\n  ✗ colors_and_type.css разошёлся с tokens.json по ЦВЕТУ — ${audit.color.length} шт.:`);
  for (const b of audit.color) console.error(`      --${b.name}: наверху ${b.up}, у нас ${b.ours}`);
  console.error('');
  process.exit(1);
}

// ── запись ─────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
let diverged = 0;
for (const [file, html] of Object.entries(CARDS)) {
  const dest = resolve(OUT, file);
  let prev = null;
  try { prev = readFileSync(dest, 'utf8'); } catch { /* нет файла — впервые */ }
  const same = prev === html;
  if (check) {
    console.log(`  ${same ? '=' : '≠'} ${relative(ROOT, dest)}`);
    if (!same) diverged++;
    continue;
  }
  writeFileSync(dest, html);
  console.log(`  ${same ? '=' : '→'} ${relative(ROOT, dest)}`);
}

const total = Object.keys(CARDS).length;
const shown = Object.values(CARDS).reduce((n, h) => n + (h.match(/class="row"/g) ?? []).length, 0);

if (check && diverged) {
  console.error(`\n  ✗ карточки разошлись с tokens.json: ${diverged} из ${total}.` +
                `\n    Собрать: node scripts/design/build-ds-cards.mjs\n`);
  process.exit(1);
}
console.log(`\n  Карточек ${total}/${total}, токенов показано ${shown}.`);
if (audit) {
  console.log(`  colors_and_type.css: сверено ${audit.checked} общих имён, по цвету расхождений нет.`);
  if (audit.metric.length) {
    console.log(`\n  ⚠ Метрики расходятся — ${audit.metric.length} шт. Прогон НЕ падает:`);
    for (const b of audit.metric) console.log(`      --${b.name}: наверху ${b.up}, у нас ${b.ours}`);
    console.log('    Наша шкала отступов ровно вдвое крупнее — киоск, а не экран.');
    console.log('    Одно имя с разным значением по двум сторонам: решать не здесь.');
  }
}
console.log('');
