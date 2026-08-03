#!/usr/bin/env node
// Ловит абсолютные пути к ресурсам в СОБРАННОМ dist/.
//
// Зачем именно dist, а не исходники: часть абсолютных путей vite переписывает
// сам (url() в CSS), и проверка по исходникам выдаёт ложные срабатывания —
// например, все 17 путей в src/styles/fonts.css совершенно исправны в сборке.
// Артефакт — единственный источник правды о том, что доедет до киоска.
//
// Почему это вообще проверяется механически: под file:///opt/mtk29/dist/
// путь `/content/x.json` резолвится в корень файловой системы и не находится.
// Раздел оказывается пустым БЕЗ ошибки в консоли — глазами на stage по http
// дефект не виден вообще. См. CLAUDE.md §5 «Пути к ресурсам».

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const EXT = new Set(['.html', '.js', '.jsx', '.css', '.json']);
const RE = /['"`(]\/(content|expo|decor|fonts|assets)\//g;

// base.js описывает сам этот дефект в комментариях и содержит его образцы.
const SKIP = new Set(['base.js']);

if (!existsSync(DIST)) {
  console.error('check-paths: нет dist/ — сначала `npm run build`');
  process.exit(2);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(DIST)) {
  const rel = relative(DIST, file);
  if (SKIP.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(RE)) {
      hits.push({ rel, line: i + 1, frag: m[0].slice(1) });
    }
  }
}

// ── crossorigin — тот же класс дефекта: убивает стили только под file:// ──
// Vite вешает атрибут сам; под file:// он включает проверку CORS для
// непрозрачного origin, и стиль МОЛЧА не применяется. Снимает плагин
// в vite.config.js — проверка на случай, если плагин уберут или обойдут.
const cors = [];
for (const file of walk(DIST)) {
  if (!file.endsWith('.html')) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/<(link|script)[^>]*\scrossorigin[\s>]/.test(lines[i])) {
      cors.push({ rel: relative(DIST, file), line: i + 1 });
    }
  }
}

if (cors.length) {
  console.error(`check-paths: crossorigin в ${cors.length} местах.`);
  console.error('Под file:// (киоск) стиль молча не применяется — страница без оформления.\n');
  for (const c of cors) console.error(`  ${c.rel}:${c.line}`);
  console.error('\nПочинка: плагин mtk-strip-crossorigin в vite.config.js.');
  process.exit(1);
}

if (hits.length === 0) {
  console.log('check-paths: чисто — абсолютных путей и crossorigin в dist/ нет');
  process.exit(0);
}

const byFile = new Map();
for (const h of hits) {
  if (!byFile.has(h.rel)) byFile.set(h.rel, []);
  byFile.get(h.rel).push(h);
}

console.error(`check-paths: ${hits.length} абсолютных путей в ${byFile.size} файлах.`);
console.error('Под file:// (киоск) они резолвятся в корень ФС — раздел будет пустым.\n');
for (const [rel, list] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
  console.error(`  ${rel}  (${list.length})`);
  for (const h of list.slice(0, 4)) console.error(`      :${h.line}  ${h.frag}`);
  if (list.length > 4) console.error(`      … ещё ${list.length - 4}`);
}
console.error('\nПочинка: убрать ведущий слэш и обернуть в MTK_URL(),');
console.error('подключив base.js первым скриптом. CLAUDE.md §5 «Пути к ресурсам».');
process.exit(1);
