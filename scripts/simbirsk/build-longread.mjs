#!/usr/bin/env node
// Сборка рантайма лонгрида:
//
//     src/components/longread-*.js  →  public/longread/longread-runtime.js
//
//     node scripts/simbirsk/build-longread.mjs           собрать
//     node scripts/simbirsk/build-longread.mjs --check    сверить, не собирая
//
// ЗАЧЕМ ЭТОТ ШАГ ВООБЩЕ ЕСТЬ. Компоненты обязаны доехать до киоска
// КЛАССИЧЕСКИМ скриптом: под file:///opt/mtk29/dist/ (так запускается киоск)
// Chromium блокирует внешние module-скрипты и fetch, а обычный <script src>
// исполняет. Проверено на Chrome 14x: классический — да, module — нет.
//
// Но vite не эмитит файл, на который ссылается классический <script src>:
// он печатает «can't be bundled without type="module"» и оставляет путь как
// есть. В dist/ файла не окажется, страница молча останется без компонентов.
// Verbatim в сборку копируется только public/**, поэтому собранный рантайм
// кладём туда.
//
// Каталог — public/longread/, а НЕ public/content/longreads/, где он лежал
// сначала. Причина не косметическая: public/content/** по §4 принадлежит зоне
// content, и код внутри её каталога рано или поздно затрётся прогоном импорта.
// Данные лонгрида при этом остаются у content — там им и место.
//
// Та же схема, что у tokens.css и public/expo/build/*.js: исходник и артефакт
// оба коммитятся, сборка на сервере не зависит от прогона генератора. И та же
// расплата: ПРАВКА .js БЕЗ ПЕРЕСБОРКИ В СТРАНИЦУ НЕ ПОПАДЁТ — ничего не упадёт,
// просто будет работать старая версия. Ловится этим же скриптом с --check.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = join(ROOT, 'src', 'components');
const OUT = join(ROOT, 'public', 'longread', 'longread-runtime.js');

// Порядок важен: longread-section обращается к window.LongreadMedia на разборе
// списка иллюстраций, а longread-view — к обоим. Сортировка по имени случайно
// даёт правильный порядок, но полагаться на случайность не будем.
const ORDER = ['longread-media.js', 'longread-section.js', 'longread-view.js'];

const found = readdirSync(SRC_DIR)
  .filter((f) => /^longread-.*\.js$/.test(f))
  .sort();

const missing = found.filter((f) => !ORDER.includes(f));
if (missing.length) {
  console.error(`build-longread: ${missing.join(', ')} не перечислены в ORDER — `
    + 'добавь их туда, иначе порядок инициализации будет случайным.');
  process.exit(2);
}

const parts = ORDER.filter((f) => existsSync(join(SRC_DIR, f)));

const header = `/* ┌────────────────────────────────────────────────────────────────┐
   │  ФАЙЛ СГЕНЕРИРОВАН. РУЧНЫЕ ПРАВКИ БУДУТ ЗАТЁРТЫ.               │
   │  Источник:  src/components/longread-*.js                       │
   │  Генератор: node scripts/simbirsk/build-longread.mjs           │
   └────────────────────────────────────────────────────────────────┘

   Классический скрипт, не модуль: киоск работает с file://, где внешние
   module-скрипты блокируются CORS. Правил src/components/longread-*.js —
   прогони генератор и закоммить и исходник, и этот файл.  CLAUDE.md §5.

   Собрано из: ${parts.join(', ')} */

`;

const body = parts
  .map((f) => {
    const text = readFileSync(join(SRC_DIR, f), 'utf8').replace(/\s*$/, '');
    return `/* ── ${f} ${'─'.repeat(Math.max(0, 62 - f.length))} */\n${text}\n`;
  })
  .join('\n');

const next = header + body;
const rel = relative(ROOT, OUT);

// Синтаксис проверяем ЗДЕСЬ, а не в браузере. Рантайм подключается обычным
// <script>: при ошибке разбора он просто не исполняется — кастомные элементы
// не регистрируются, страница остаётся с пустым <longread-view>, и в консоль
// при этом ничего не попадает. Один backtick, случайно набранный в CSS-комментарии
// внутри шаблонной строки, уже стоил такого молчаливого отказа.
for (const f of parts) {
  try {
    execFileSync(process.execPath, ['--check', join(SRC_DIR, f)], { stdio: 'pipe' });
  } catch (e) {
    console.error(`build-longread: ${f} не разбирается как JS.\n`);
    console.error(`${e.stderr ?? ''}`.trim());
    process.exit(2);
  }
}

if (process.argv.includes('--check')) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  if (now === next) {
    console.log(`longread:check — ${rel} совпадает с src/components/longread-*.js`);
    process.exit(0);
  }
  console.error(`longread:check — ${rel} ${now === null ? 'отсутствует' : 'устарел'}.`);
  console.error('Страница подключает именно его, так что правка компонентов');
  console.error('в киоск не доехала. Почини: node scripts/simbirsk/build-longread.mjs');
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, next);
console.log(`build-longread: ${parts.length} файлов → ${rel} `
  + `(${(next.length / 1024).toFixed(1)} КБ)`);
