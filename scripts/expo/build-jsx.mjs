#!/usr/bin/env node
// Предкомпиляция JSX сцены /expo/ — замена Babel-in-browser.
//
// Зачем. Киоск запускается офлайн (см. CLAUDE.md §1), а сцена тянула React,
// ReactDOM и @babel/standalone с unpkg.com. Плюс Babel компилировал ~180 КБ JSX
// при каждом старте — секунды белого экрана.
//
// Как. Исходники .jsx лежат рядом со сценой и остаются исходниками; результат
// компиляции кладётся в public/expo/build/*.js и КОММИТИТСЯ — по той же логике,
// что и tokens.css (CLAUDE.md §5): сборка идёт на сервере и не должна зависеть
// от прогона генератора.
//
// Компилятор — esbuild из node_modules (транзитивная зависимость vite,
// отдельная установка не нужна). Классический JSX-рантайм: React.createElement,
// потому что React подключён как UMD-глобал, а не как модуль.
//
// Важно: выход — КЛАССИЧЕСКИЕ скрипты, не модули. Файлы сцены обмениваются
// значениями через window (shared.jsx делает Object.assign(window, …)), и
// оборачивание в модуль или IIFE это сломает.
//
//   node scripts/expo/build-jsx.mjs           — собрать
//   node scripts/expo/build-jsx.mjs --check   — проверить актуальность (ворота)
//
// Правишь .jsx — прогони скрипт и закоммить и исходник, и build/.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXPO = path.join(ROOT, 'public', 'expo');
const OUT = path.join(EXPO, 'build');

// Исходники в порядке подключения. Порядок здесь не влияет на компиляцию,
// но держим его тем же, что в HTML, — чтобы список читался как манифест.
const SOURCES = [
  'shared.jsx',
  'main-screen.jsx',
  'boot-expo.jsx',
  'rich-text.jsx',
  'ui-scale.jsx',
  'people-ui.jsx',
  'boot-people.jsx',
  'chronicle-ui.jsx',
  'boot-chronicle.jsx',
];

// direction-a/b/c.jsx здесь намеренно нет. Это заготовки design-pass —
// «стол коменданта», «карта фронтов», «поток документов», между которыми
// переключался посетитель. По ТЗ выбора направления на главной нет, экран
// собирается из таймлайна и плиток разделов, поэтому направления сняты
// с загрузки: 133 КБ мёртвого JS на киоск возить незачем.
// Исходники оставлены на месте — удалять чужую отрисовку не наше решение.

// Что за чем подключается на каждой странице. Нужно для проверки коллизий:
// у классических <script> общая на страницу лексическая область, поэтому
// одинаковое top-level имя в двух файлах — SyntaxError, и увидишь ты его
// только в браузере. Раньше это пряталось: Babel опускал const до var.
const PAGES = {
  'index.html':     ['shared.jsx', 'main-screen.jsx', 'boot-expo.jsx'],
  'people.html':    ['rich-text.jsx', 'ui-scale.jsx', 'people-ui.jsx', 'boot-people.jsx'],
  'chronicle.html': ['rich-text.jsx', 'ui-scale.jsx', 'chronicle-ui.jsx', 'boot-chronicle.jsx'],
};

// Локальные копии React. Держим здесь, чтобы скрипт падал с внятным текстом,
// если vendor/ потеряют при мерже, а не молча собирал нерабочую сцену.
const VENDOR = [
  'vendor/react-18.3.1.production.min.js',
  'vendor/react-dom-18.3.1.production.min.js',
];

// Целевой браузер — Chromium киоска. Даунлевелить до ES5 незачем и вредно:
// лишний код и лишнее время парсинга.
const TARGET = 'chrome110';

function banner(src) {
  return [
    '// ВНИМАНИЕ: файл сгенерирован. Не редактировать.',
    `// Источник: public/expo/${src}`,
    '// Пересобрать: node scripts/expo/build-jsx.mjs',
    '',
  ].join('\n');
}

async function compile(src) {
  const code = await readFile(path.join(EXPO, src), 'utf8');
  const res = await transform(code, {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: TARGET,
    format: undefined, // классический скрипт: без обёрток и без exports
    sourcemap: false,
    minify: false,
    logLevel: 'silent',
  });
  return banner(src) + res.code;
}

function outName(src) {
  return src.replace(/\.jsx$/, '.js');
}

async function missingVendor() {
  const missing = [];
  for (const rel of VENDOR) {
    try {
      await access(path.join(EXPO, rel));
    } catch {
      missing.push(rel);
    }
  }
  return missing;
}

// Компилируем страницу как один скрипт: движок ругнётся ровно на то же, на что
// ругнулся бы браузер при загрузке второго <script> с тем же top-level именем.
// Код не исполняется — только компилируется.
function assertNoCollisions(pages, compiled) {
  const errors = [];
  for (const [page, srcs] of Object.entries(pages)) {
    const joined = srcs.map((s) => compiled.get(s)).join('\n;\n');
    try {
      new vm.Script(joined, { filename: page });
    } catch (err) {
      errors.push(`${page}: ${err.message}  (файлы: ${srcs.join(', ')})`);
    }
  }
  if (errors.length) {
    console.error('✗ конфликт имён верхнего уровня между скриптами страницы:');
    for (const e of errors) console.error(`    ${e}`);
    console.error('  Переименуй одно из имён — у скриптов страницы общая область видимости.');
    process.exit(1);
  }
}

async function main() {
  const check = process.argv.includes('--check');

  const missing = await missingVendor();
  if (missing.length) {
    console.error('✗ нет локальных копий React:');
    for (const m of missing) console.error(`    public/expo/${m}`);
    console.error('  Сцена без них не запустится офлайн.');
    process.exit(1);
  }

  if (!check) await mkdir(OUT, { recursive: true });

  const built = new Map();
  for (const src of SOURCES) built.set(src, await compile(src));

  assertNoCollisions(PAGES, built);

  const stale = [];
  for (const src of SOURCES) {
    const compiled = built.get(src);
    const dest = path.join(OUT, outName(src));

    if (check) {
      let current = null;
      try {
        current = await readFile(dest, 'utf8');
      } catch {}
      if (current !== compiled) stale.push(`build/${outName(src)}`);
    } else {
      await writeFile(dest, compiled, 'utf8');
      console.log(`  ${src} → build/${outName(src)}  ${(compiled.length / 1024).toFixed(1)} КБ`);
    }
  }

  if (check) {
    if (stale.length) {
      console.error('✗ предкомпиляция /expo/ устарела:');
      for (const s of stale) console.error(`    public/expo/${s}`);
      console.error('  Прогони: node scripts/expo/build-jsx.mjs');
      process.exit(1);
    }
    console.log('✓ предкомпиляция /expo/ актуальна');
  } else {
    console.log(`✓ собрано ${SOURCES.length} файлов в public/expo/build/`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
