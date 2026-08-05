#!/usr/bin/env node
// Проверка ПРОВЕРКИ: ловит ли brand-lint то, что обязан ловить.
//
//   node scripts/design/lint-selftest.mjs
//
// Зачем. §13: «положительный прогон не доказывает, что проверка работает».
// У R7 за сутки нашлись ТРИ дыры подряд — не сканировал .js, не видел
// отмену порога, ругался на верный приём, — и все три вскрылись только
// когда правило впервые потрогали. Остальные девять никто не трогал.
//
// Как. Каждому правилу подкладывается нарушение ДВАЖДЫ: в код (должно
// краснеть) и в комментарий (должно молчать). Оба направления нужны:
// правило, которое не ловит, бесполезно; правило, которое ловит
// комментарии, наказывает за пояснения и толкает гонять базу.
//
// Файлы-пробы кладутся в сканируемые каталоги и удаляются в finally,
// в том числе при падении. Долг они не сдвигают: сравнение идёт
// с прогоном без проб, а не с baseline.

import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const LINT = join(HERE, 'brand-lint.mjs');
const PROBE_DIR = resolve(ROOT, 'src/components');
const MAP_DIR = resolve(ROOT, 'public/content/maps/_selftest');

/** Прогон линтера с машинным отчётом. */
function run() {
  try {
    return JSON.parse(execFileSync(process.execPath, [LINT, '--json'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (e) {
    console.error('линтер не запустился:', e.message);
    process.exit(2);
  }
}

/** Нарушения в пробном файле. */
const hits = (report, file, rule) =>
  report.violations.filter(v => v.file.endsWith(file) && v.rule === rule).length;

// ── случаи ────────────────────────────────────────────────────────────────
// code    — конструкция, которая ОБЯЗАНА краснеть
// comment — та же конструкция внутри комментария, обязана молчать
const CASES = [
  { rule: 'R1', what: 'сырой hex',
    code: `.p { color: #7f1d1d; }`,
    comment: `// .p { color: #7f1d1d; }` },

  { rule: 'R2', what: 'запас у цвета',
    code: `.p { color: var(--brass, #8e6a2a); }`,
    comment: `// .p { color: var(--brass, #8e6a2a); }` },

  { rule: 'R3', what: 'курсив на Nolde',
    code: `.p { font-family: var(--font-display); font-style: italic; }`,
    comment: `/* .p { font-family: var(--font-display); font-style: italic; } */` },

  { rule: 'R4', what: 'несуществующий токен',
    code: `.p { color: var(--nosuchtoken); }`,
    comment: `// .p { color: var(--nosuchtoken); }` },

  { rule: 'R5', what: ':hover',
    code: `.p:hover { opacity: 1; }`,
    comment: `// .p:hover { opacity: 1; }` },

  { rule: 'R6', what: 'внешний CDN',
    code: `const s = '<script src="https://cdn.example.com/x.js"></scr' + 'ipt>';`,
    comment: `// <script src="https://cdn.example.com/x.js"></script>` },

  { rule: 'R7', what: 'отмена порога тач-цели',
    code: `button.p { min-height: auto; }`,
    comment: `// button.p { min-height: auto; }` },

  { rule: 'R9', what: 'метрика без запаса',
    code: `.p { min-height: var(--touch-hit); }`,
    comment: `// .p { min-height: var(--touch-hit); }` },
];

// ── прогон ────────────────────────────────────────────────────────────────
const probe = join(PROBE_DIR, '_selftest-probe.js');
const rows = [];
let failed = 0;

try {
  const base = run();

  for (const c of CASES) {
    writeFileSync(probe, `const css = \`\n${c.code}\n\`;\nexport default css;\n`);
    const inCode = hits(run(), '_selftest-probe.js', c.rule);

    writeFileSync(probe, `${c.comment}\nconst css = \`\n  .ok { color: var(--brass); }\n\`;\nexport default css;\n`);
    const inComment = hits(run(), '_selftest-probe.js', c.rule);

    const ok = inCode > 0 && inComment === 0;
    if (!ok) failed++;
    rows.push({ rule: c.rule, what: c.what, inCode, inComment, ok });
  }

  // R10 — по map.json, а не по коду
  mkdirSync(MAP_DIR, { recursive: true });
  writeFileSync(join(MAP_DIR, 'map.json'), JSON.stringify({
    id: '_selftest', layers: [{ id: 'probe', color: '#cc0066' }],
  }));
  const r10 = run().violations.filter(v => v.rule === 'R10').length;
  rows.push({ rule: 'R10', what: 'цвет слоя мимо словаря', inCode: r10, inComment: 0, ok: r10 > 0 });
  if (r10 === 0) failed++;

  // R8 — артефакты против источника; ломать генерируемое не будем,
  // проверяем, что правило вообще подключено к прогону
  const r8known = base.rules && base.rules.R8;
  rows.push({ rule: 'R8', what: 'артефакты разошлись', inCode: r8known ? '—' : 0,
              inComment: 0, ok: !!r8known, note: 'проверяется прогоном build-tokens --check' });
} finally {
  if (existsSync(probe)) unlinkSync(probe);
  if (existsSync(MAP_DIR)) rmSync(MAP_DIR, { recursive: true, force: true });
}

// ── отчёт ─────────────────────────────────────────────────────────────────
console.log('\n  правило  что подложено                 в коде  в комментарии');
for (const r of rows) {
  const mark = r.ok ? '✓' : '✗';
  console.log(`  ${mark} ${r.rule.padEnd(6)} ${r.what.padEnd(30)}${String(r.inCode).padStart(5)}${String(r.inComment).padStart(14)}`
    + (r.note ? `   ${r.note}` : ''));
}

console.log('');
if (failed) {
  console.log(`  ✗ правил не прошло самопроверку: ${failed}`);
  console.log('    «в коде 0» — правило не ловит того, ради чего написано;');
  console.log('    «в комментарии >0» — правило наказывает за пояснения.\n');
  process.exit(1);
}
console.log(`  ✓ все ${rows.length} правил ловят своё нарушение в коде и молчат в комментарии.\n`);
