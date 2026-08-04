#!/usr/bin/env node
// Где порядок подключения стилей решает исход — список, а не счётчик.
//
// ЗАЧЕМ. Vite переносит свои `<link rel=stylesheet>` в конец `<head>`.
// В исходнике инлайновый `<style>` стоит ПОСЛЕ подключения pages.css
// и выигрывает; в собранном dist он оказывается ДО него и при равной
// специфичности проигрывает. Зона `ui` дважды написала переопределения,
// уверенная в обратном, и один раз потеряла уже проверенную правку:
// экран групп молча вернулся с 606px к 455, когда `design` переработала
// pages.css. Ни один гейт этого не поймал — смерть переопределения
// не видна ничем (CLAUDE.md §13).
//
// ЧЕГО ЭТОТ СКРИПТ НЕ ДЕЛАЕТ. Он не доказывает поломку. Совпадение
// селектора и свойства с обеих сторон — это не дефект сам по себе:
// база плюс переопределение выглядят ровно так же, и часто это норма.
// Доказать статически, что автор хотел победить, нельзя.
//
// ЧТО ОН ДЕЛАЕТ. Даёт короткий список мест, где исход зависит от порядка,
// с номерами строк по обе стороны. Такой список читается глазами за
// минуту, а счётчик «12 мест» не читается никем.
//
// Проверяется собранный dist/, а не исходники: порядок в `<head>` —
// свойство сборки, в исходнике его нет.
//
//   node scripts/check-css-order.mjs            — отчёт
//   node scripts/check-css-order.mjs --update-baseline
//
// Падает НА ПРИРОСТЕ к baseline, а не на самом наличии совпадений:
// известные места уже разобраны, а вечно красный гейт учит его
// пропускать (CLAUDE.md §13, тот же механизм, что у brand:lint).

import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const BASELINE = path.join(ROOT, 'scripts', 'check-css-order.baseline.json');

// ── разбор CSS ─────────────────────────────────────────────────────────────
// Свой мини-парсер, а не библиотека: нужно немного — селекторы, свойства
// и номера строк, — а лишняя зависимость в офлайн-проекте стоит дороже.

/** Вырезает комментарии, сохраняя переводы строк: номера строк не должны уехать. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** Группирующие at-правила: внутри снова лежат обычные правила. */
const NESTING_AT = /^@(media|supports|layer|container|scope)\b/i;

/**
 * Разбирает блок CSS в плоский список правил.
 * Возвращает [{ selector, props:Set, line, at }] — at это цепочка условий,
 * в которых правило лежит: `@media (min-width: 2400px)` и т.п.
 */
function parseRules(css, lineOffset = 0, atChain = []) {
  const out = [];
  let i = 0;
  let prelude = '';
  let preludeStart = 0;
  let line = 1;

  const lineOf = (idx) => lineOffset + line + countNL(css.slice(preludeStart, idx)) - 1;
  const countNL = (s) => (s.match(/\n/g) || []).length;

  while (i < css.length) {
    const ch = css[i];

    if (ch === '\n') { line++; i++; if (!prelude.trim()) preludeStart = i; continue; }

    if (ch === '{') {
      const body = readBlock(css, i);
      if (body == null) break;
      const text = prelude.trim();
      const startLine = lineOffset + line - countNL(prelude);

      if (text.startsWith('@')) {
        if (NESTING_AT.test(text)) {
          out.push(...parseRules(body.inner, startLine + countNL(prelude), [...atChain, text]));
        }
        // @font-face, @keyframes и прочее не участвуют в каскаде селекторов
      } else if (text) {
        const props = declaredProps(body.inner);
        // Селекторы через запятую — независимые правила с общим телом
        for (const sel of splitSelectors(text)) {
          out.push({ selector: sel, props, line: startLine, at: atChain.join(' › ') });
        }
      }

      line += countNL(css.slice(i, body.end));
      i = body.end;
      prelude = '';
      preludeStart = i;
      continue;
    }

    prelude += ch;
    i++;
  }
  return out;
}

/** Читает сбалансированный блок от позиции открывающей скобки. */
function readBlock(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") { i = skipString(css, i); continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { inner: css.slice(open + 1, i), end: i + 1 };
    }
  }
  return null;
}

function skipString(css, start) {
  const q = css[start];
  for (let i = start + 1; i < css.length; i++) {
    if (css[i] === '\\') { i++; continue; }
    if (css[i] === q) return i;
  }
  return css.length;
}

/**
 * Свойства верхнего уровня блока со значениями (вложенные правила пропускаем).
 * Значения нужны, чтобы отличить настоящий спор от пустого: `margin: 0`
 * с обеих сторон формально конфликтует, а по существу нет. Без этого
 * baseline забился бы безвредными совпадениями и перестал читаться —
 * ровно так, как §13 описывает про вечно красный гейт.
 */
function declaredProps(body) {
  const props = new Map();
  const take = (chunk) => {
    const m = chunk.match(/^\s*([-a-z0-9_]+)\s*:([\s\S]*)$/i);
    if (!m) return;
    // Последнее объявление в блоке побеждает — перезаписываем.
    props.set(m[1].toLowerCase(), m[2].replace(/\s+/g, ' ').trim().replace(/\s*!important$/i, ''));
  };
  let depth = 0, buf = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' || c === "'") { const e = skipString(body, i); buf += body.slice(i, e + 1); i = e; continue; }
    if (c === '{') { depth++; buf = ''; continue; }
    if (c === '}') { depth--; buf = ''; continue; }
    if (depth > 0) continue;
    if (c === ';') { take(buf); buf = ''; continue; }
    buf += c;
  }
  take(buf);
  return props;
}

/** Делит `a, b > c` на селекторы, не разрубая запятые внутри :is()/[]. */
function splitSelectors(text) {
  const parts = [];
  let depth = 0, buf = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += c;
  }
  parts.push(buf);
  return parts.map(norm).filter(Boolean);
}

/** Нормализация для сравнения: схлопнуть пробелы, выровнять комбинаторы. */
function norm(sel) {
  return sel.replace(/\s+/g, ' ').replace(/\s*([>+~])\s*/g, ' $1 ').trim();
}

/** Специфичность (id, class/attr/pseudo-class, element/pseudo-element). */
function specificity(sel) {
  let s = sel.replace(/\\./g, '');
  const a = (s.match(/#[-\w]+/g) || []).length;
  const b = (s.match(/\.[-\w]+/g) || []).length
          + (s.match(/\[[^\]]*\]/g) || []).length
          + (s.match(/:(?!:)(?!not\b|is\b|where\b)[-\w]+/g) || []).length;
  const c = (s.match(/(^|[\s>+~])([a-z][-\w]*)/gi) || []).length
          + (s.match(/::[-\w]+/g) || []).length;
  return [a, b, c];
}

const cmpSpec = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);
const specStr = (s) => s.join(',');

// ── разбор HTML ────────────────────────────────────────────────────────────

const lineAt = (text, idx) => text.slice(0, idx).split('\n').length;

/** Источники стилей в порядке их появления в документе. */
function styleSources(html) {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>|<link\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const line = lineAt(html, m.index);
    if (m[1] != null) {
      out.push({ kind: 'inline', css: m[1], line, at: m.index, label: `инлайновый <style>` });
    } else {
      const attrs = m[2];
      if (!/rel\s*=\s*["']?stylesheet/i.test(attrs)) continue;
      const href = (attrs.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (!href || /^(https?:)?\/\//i.test(href)) continue;
      out.push({ kind: 'link', href: href.split('?')[0], line, at: m.index, label: href.split('?')[0] });
    }
  }
  return out;
}

async function walk(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// ── проверка ───────────────────────────────────────────────────────────────

async function analyzePage(file) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const sources = styleSources(html);
  if (!sources.length) return [];

  // Собираем правила по каждому источнику, сохраняя порядок в документе.
  const buckets = [];
  for (const src of sources) {
    if (src.kind === 'inline') {
      const startLine = src.line;
      buckets.push({ src, rules: parseRules(stripComments(src.css), startLine) });
    } else {
      const cssPath = path.resolve(path.dirname(file), src.href);
      try {
        await access(cssPath);
      } catch {
        continue; // битые ссылки — тема check-paths, не эта
      }
      const css = await readFile(cssPath, 'utf8');
      buckets.push({ src, rules: parseRules(stripComments(css), 1), file: path.relative(ROOT, cssPath) });
    }
  }

  // Ищем селектор, объявленный и в инлайновом блоке, и в подключённом файле,
  // с пересечением по свойствам. Без пересечения свойств правила не спорят.
  const findings = [];
  const inlines = buckets.filter((b) => b.src.kind === 'inline');
  const links = buckets.filter((b) => b.src.kind === 'link');

  for (const inl of inlines) {
    for (const lnk of links) {
      const byselector = new Map();
      for (const r of lnk.rules) {
        if (!byselector.has(r.selector)) byselector.set(r.selector, []);
        byselector.get(r.selector).push(r);
      }
      for (const ir of inl.rules) {
        const matches = byselector.get(ir.selector);
        if (!matches) continue;
        for (const lr of matches) {
          // Спорят только те свойства, где значения РАЗНЫЕ. Совпадающие
          // не спорят ни при каком порядке.
          const shared = [...ir.props.keys()]
            .filter((p) => lr.props.has(p) && lr.props.get(p) !== ir.props.get(p));
          if (!shared.length) continue;

          const spec = specificity(ir.selector);
          const cmp = cmpSpec(spec, specificity(lr.selector)); // селектор тот же → всегда 0
          // Исход при равной специфичности решает порядок в документе.
          const inlineFirst = inl.src.at < lnk.src.at;
          const winner = cmp !== 0
            ? (cmp > 0 ? 'inline' : 'link')
            : (inlineFirst ? 'link' : 'inline');

          findings.push({
            page: rel,
            selector: ir.selector,
            props: shared.sort(),
            values: shared.sort().map((p) => ({ prop: p, inline: ir.props.get(p), link: lr.props.get(p) })),
            inline: { line: ir.line, at: ir.at, headLine: inl.src.line },
            link: { file: lnk.file, line: lr.line, at: lr.at, headLine: lnk.src.line },
            spec: specStr(spec),
            winner,
          });
        }
      }
    }
  }
  return findings;
}

/**
 * Ключ для baseline. Имя ассета обязательно нормализуем: vite вешает на него
 * хеш содержимого (`pages-Cugd3nzk.css`), и без этого база протухала бы при
 * КАЖДОЙ правке pages.css — гейт краснел бы не на новом месте, а на новом
 * хеше. Такую базу перестают читать через неделю.
 */
const unhash = (p) => p.replace(/-[A-Za-z0-9_-]{8}(\.css)$/, '$1');
const keyOf = (f) => `${f.page} | ${f.selector} | ${f.props.join(',')} | ${unhash(f.link.file)}`;

/** Длинные значения (градиенты, тени) режем — список должен читаться глазами. */
const trim = (v) => (v == null ? '—' : v.length > 60 ? v.slice(0, 57) + '…' : v);

async function main() {
  const update = process.argv.includes('--update-baseline');

  try {
    await access(DIST);
  } catch {
    console.error('✗ нет dist/ — проверять нечего. Сначала: npm run build');
    process.exit(1);
  }

  const pages = (await walk(DIST)).sort();
  if (!pages.length) {
    // Пустой вход — это ошибка, а не отсутствие ошибок (CLAUDE.md §13).
    console.error('✗ в dist/ нет ни одной html-страницы — сборка пуста');
    process.exit(1);
  }

  const findings = [];
  for (const p of pages) findings.push(...(await analyzePage(p)));
  findings.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));

  let baseline = [];
  try {
    baseline = JSON.parse(await readFile(BASELINE, 'utf8')).known || [];
  } catch {}

  if (update) {
    await writeFile(BASELINE, JSON.stringify({
      note: 'Известные места, где исход спора решает порядок в <head>. Падаем на приросте.',
      updated: new Date().toISOString().slice(0, 10),
      known: findings.map(keyOf),
    }, null, 2) + '\n', 'utf8');
    console.log(`✓ baseline записан: ${findings.length} мест`);
    return;
  }

  const known = new Set(baseline);
  const fresh = findings.filter((f) => !known.has(keyOf(f)));

  console.log(`Просмотрено страниц: ${pages.length}. Мест, где порядок решает: ${findings.length}.`);

  const show = fresh.length ? fresh : findings;
  const title = fresh.length ? 'НОВЫЕ места' : 'Все места (все в baseline)';
  if (show.length) {
    console.log(`\n${title}:\n`);
    let page = null;
    for (const f of show) {
      if (f.page !== page) { page = f.page; console.log(`  ${page}`); }
      const w = f.winner === 'inline' ? 'инлайновый <style>' : f.link.file;
      console.log(`    ${f.selector}   [${f.spec}]`);
      console.log(`      инлайновый <style> строка ${f.inline.line}  (блок в <head> со строки ${f.inline.headLine})`);
      console.log(`      ${f.link.file} строка ${f.link.line}  (подключён строкой ${f.link.headLine})`);
      for (const v of f.values) {
        const win = f.winner === 'inline' ? v.inline : v.link;
        const lose = f.winner === 'inline' ? v.link : v.inline;
        console.log(`      ${v.prop}: ${trim(win)}   ← побеждает; отброшено: ${trim(lose)}`);
      }
      console.log(`      выигрывает: ${w}`);
      console.log('');
    }
  }

  if (fresh.length) {
    console.error(`✗ новых мест: ${fresh.length}. Разбери и, если это норма, зафиксируй:`);
    console.error('    node scripts/check-css-order.mjs --update-baseline');
    process.exit(1);
  }

  console.log('✓ новых мест, где порядок решает исход, нет');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
