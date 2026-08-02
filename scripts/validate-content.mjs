#!/usr/bin/env node
/**
 * Валидатор контента — `npm run content:check`, обязателен перед мержем.
 *
 * Падает на ошибках, предупреждает на нормах ТЗ. Регламент без механической
 * проверки не работает: правило либо в линтере, либо его нет.
 *
 * Зависимостей нет намеренно. Киоск офлайновый, package.json ведёт оркестратор,
 * и тащить ajv ради восьми правил — лишний повод сломать сборку на сервере.
 *
 * Запуск:  node scripts/validate-content.mjs [--quiet]
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'public', 'content');
const IN = join(ROOT, '..', 'IN', 'new', 'МТК №29');

const KINDS = [
  { kind: 'person', dir: 'persons' },
  { kind: 'party', dir: 'parties' },
  { kind: 'state', dir: 'states' },
  { kind: 'event', dir: 'events' },
];

const TZ_SUMMARY_MAX = 3000;

const errors = [];
const warnings = [];
const quiet = process.argv.includes('--quiet');

const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(rel(path), `не читается как json — ${e.message}`);
    return null;
  }
}

const rel = (p) => p.startsWith(ROOT) ? p.slice(ROOT.length + 1) : p;

// ---------------------------------------------------------------- сбор

/** id → вид, по всем индексам. Ссылки резолвятся против индекса, а не файлов:
 *  запись может быть stub-ом, файла ещё нет, а ссылаться на неё уже можно. */
const index = new Map();
const indexRecords = new Map();

for (const { kind, dir } of KINDS) {
  const path = join(CONTENT, dir, '_index.json');
  if (!existsSync(path)) continue;
  const idx = readJSON(path);
  if (!idx) continue;
  if (idx.schema !== 1) warn(rel(path), 'нет поля schema: 1');
  for (const item of idx.items || []) {
    if (!item.id) { err(rel(path), 'запись индекса без id'); continue; }
    if (index.has(item.id) && index.get(item.id) !== kind) {
      err(rel(path), `id «${item.id}» уже занят видом ${index.get(item.id)}`);
    }
    index.set(item.id, kind);
    indexRecords.set(item.id, { item, kind, dir, path });
  }
}

const PLURAL = {
  persons: 'person', parties: 'party', states: 'state',
  events: 'event', longreads: 'longread',
};

// ---------------------------------------------------------------- кросс-чек

/**
 * Сверка нашего парсера с pandoc по объёму извлечённого текста.
 *
 * Прямой разбор `word/document.xml` умеет больше pandoc — гиперссылки,
 * подсветку, объединённые ячейки — и ровно поэтому его некому проверить.
 * Независимый инструмент ловит класс ошибок «обход дерева молча пропустил
 * ветку»: расхождение больше 2 % значит, что парсер что-то потерял.
 *
 * Тихо пропускается там, где нечем проверять: на сервере сборки нет ни
 * `../IN/`, ни pandoc, и падать из-за этого деплой не должен.
 */
const CROSSCHECK_TOLERANCE = 0.02;
const crosscheckOff = process.argv.includes('--no-crosscheck');
let pandocOK = null;

function havePandoc() {
  if (pandocOK === null) {
    pandocOK = spawnSync('pandoc', ['--version'], { encoding: 'utf8' }).status === 0;
  }
  return pandocOK;
}

let crosschecked = 0;

/**
 * Убрать из вывода pandoc подстановки встроенных картинок.
 *
 * Word хранит у иллюстрации исходный путь, и pandoc печатает его как текст:
 * `[X:\Интерактивная карта Гражданской войны 1917 - 1922\…\1280px-Red_flag.svg.png]`.
 * Это не контент, наш парсер такое игнорирует намеренно — но в подсчёте знаков
 * путь весит до 9 %, и сверка начинает обвинять парсер в потере текста.
 */
function stripImagePlaceholders(s) {
  return (s || '').replace(/\[[^\]\n]*\.(?:png|jpe?g|svg|tiff?|gif|bmp|emf|wmf)[^\]\n]*\]/gi, ' ');
}

function crossCheckParser(where, data) {
  if (crosscheckOff) return;
  const src = data.src && data.src.file;
  if (!src || !existsSync(IN)) return;
  const docx = join(IN, src);
  if (!existsSync(docx) || !havePandoc()) return;

  const viaPandoc = spawnSync('pandoc', ['--to=plain', '--wrap=none', docx],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const viaOurs = spawnSync('python3', [join(ROOT, 'scripts/import/docx_text.py'), docx],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (viaPandoc.status !== 0 || viaOurs.status !== 0) return;

  // Считаем только буквы и цифры: pandoc рисует таблицы псевдографикой,
  // и её плюсы с чёрточками дают на порядок больше «текста», чем есть.
  const size = (s) => ((s || '').match(/[\p{L}\p{N}]/gu) || []).length;
  const a = size(viaOurs.stdout);
  const b = size(stripImagePlaceholders(viaPandoc.stdout));
  crosschecked += 1;
  if (!b) return;
  const drift = (b - a) / b;
  if (drift > CROSSCHECK_TOLERANCE) {
    warn(where, `парсер извлёк на ${(drift * 100).toFixed(1)} % меньше текста, `
      + `чем pandoc (${a} против ${b} знаков) — похоже, что-то потеряно`);
  }
}

// ---------------------------------------------------------------- справки

let checked = 0;

for (const { kind, dir } of KINDS) {
  const folder = join(CONTENT, dir);
  if (!existsSync(folder)) continue;

  const files = readdirSync(folder)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !f.startsWith('_'))
    .filter((f) => !f.endsWith('.gen.json') && !f.endsWith('.patch.json'));

  for (const file of files) {
    const path = join(folder, file);
    const id = basename(file, '.json');
    const data = readJSON(path);
    if (!data) continue;
    checked += 1;
    const where = rel(path);

    if (data.schema !== 1) err(where, 'нет поля schema: 1');
    if (data.id !== id) err(where, `поле id = «${data.id}», а файл называется «${id}»`);
    if (data.kind !== kind) err(where, `kind = «${data.kind}», ожидался «${kind}»`);
    if (!data.title_ru) err(where, 'пустой title_ru');

    // ── нет справки без записи в индексе: плитка её не покажет
    if (!indexRecords.has(id)) {
      err(where, `нет записи в ${dir}/_index.json`);
    }

    // ── английский: копия русского под флагом EN — это баг движка на приёмке
    if (!['ok', 'missing', 'copy_of_ru'].includes(data.en_status)) {
      err(where, `en_status = «${data.en_status}», допустимы ok/missing/copy_of_ru`);
    }
    if (data.en_status === 'copy_of_ru' && data.summary_en) {
      err(where, 'en_status = copy_of_ru, но summary_en не пуст — '
        + 'переключатель RU/EN покажет русский');
    }

    // ── норма ТЗ по объёму
    const len = (data.summary_ru || '').length;
    if (len > TZ_SUMMARY_MAX) {
      warn(where, `summary_ru ${len} знаков, норма ТЗ — ${TZ_SUMMARY_MAX}`);
    }

    // ── перекрёстные ссылки
    for (const [bucket, ids] of Object.entries(data.related || {})) {
      const want = PLURAL[bucket];
      if (!want) { err(where, `неизвестный раздел related.${bucket}`); continue; }
      for (const ref of ids || []) {
        if (!index.has(ref)) {
          err(where, `related.${bucket} ссылается на «${ref}», которого нет в индексе`);
        } else if (index.get(ref) !== want) {
          err(where, `related.${bucket} ссылается на «${ref}», а это ${index.get(ref)}`);
        }
      }
    }

    checkMedia(where, data);
    crossCheckParser(where, data);

    if (kind === 'person' && !data.surname_ru) {
      err(where, 'у личности не разобрана фамилия');
    }
    if (kind === 'party' && data.venn_groups && !Array.isArray(data.venn_groups)) {
      err(where, 'venn_groups должен быть массивом, а не одним лагерем');
    }
  }
}

function checkMedia(where, data) {
  const seen = new Set();
  let unbuilt = 0;
  for (const m of data.media || []) {
    if (typeof m.n !== 'number') { err(where, 'media без ключа n'); continue; }
    if (seen.has(m.n)) err(where, `media: номер n=${m.n} встречается дважды`);
    seen.add(m.n);

    if (!m.src_file) {
      warn(where, `media n=${m.n}: аннотация «${m.src_name || '?'}» без файла на диске`);
      continue;
    }
    // ── каждый заявленный тир обязан существовать
    for (const tier of m.tiers || []) {
      const f = join(CONTENT, `${m.file}-${tier}.webp`);
      if (!existsSync(f)) {
        err(where, `media n=${m.n}: заявлен тир ${tier}, файла ${rel(f)} нет`);
      }
    }
    if ((m.tiers || []).length === 0) unbuilt += 1;
    // ── лайтбокс не должен апскейлить: без натива он этого не узнает
    if (!m.w || !m.h) {
      warn(where, `media n=${m.n}: неизвестны натурные размеры оригинала`);
    }
    if (m.inv_ru && m.caption_ru && m.caption_ru.includes(m.inv_ru)) {
      err(where, `media n=${m.n}: инвентарный номер слит с аннотацией — `
        + 'он выводится отдельной строкой');
    }
  }
  if (unbuilt) {
    warn(where, `производные не собраны у ${unbuilt} из ${(data.media || []).length} `
      + 'изображений (npm run media:build)');
  }
}

// ---------------------------------------------------------------- индексы

for (const [id, { item, kind, dir, path }] of indexRecords) {
  const file = join(CONTENT, dir, `${id}.json`);
  const where = `${rel(path)} → ${id}`;
  if (!existsSync(file)) {
    if (!item.stub) {
      err(where, 'нет файла справки и не помечено stub: true');
    }
  } else if (item.stub) {
    warn(where, 'помечено stub: true, но файл справки существует');
  }
  if (!item.title_ru) err(where, 'в индексе нет title_ru — плитку нечем рисовать');
}

// ---------------------------------------------------------------- хроника

const chronDir = join(CONTENT, 'chronicle');
if (existsSync(chronDir)) {
  for (const file of readdirSync(chronDir).filter((f) => /^\d{4}\.json$/.test(f))) {
    const path = join(chronDir, file);
    const data = readJSON(path);
    if (!data) continue;
    const where = rel(path);
    if (data.schema !== 1) err(where, 'нет поля schema: 1');
    const ids = new Set();
    for (const it of data.items || []) {
      if (ids.has(it.id)) err(where, `дубль id записи ${it.id}`);
      ids.add(it.id);
      if (!['pol', 'mil', 'both'].includes(it.track)) {
        err(where, `${it.id}: track = «${it.track}», допустимы pol/mil/both`);
      }
      if (it.track === 'both' && !(it.pol_ru && it.mil_ru)) {
        err(where, `${it.id}: track = both, но одна из колонок пуста`);
      }
      if (!it.pol_ru && !it.mil_ru) err(where, `${it.id}: обе колонки пусты`);
      // ── переход в карточку обязан резолвиться, иначе кнопка ведёт в никуда
      if (it.card && index.get(it.card) !== 'event') {
        err(where, `${it.id}: card = «${it.card}» не найден в индексе событий`);
      }
      if (it.card_hint && !it.card) {
        warn(where, `${it.id}: «${it.card_hint}» не разрезолвился в карточку`);
      }
      for (const [bucket, refs] of Object.entries(it.refs || {})) {
        const want = PLURAL[bucket];
        for (const ref of refs || []) {
          if (!index.has(ref)) err(where, `${it.id}: refs.${bucket} → «${ref}» вне индекса`);
          else if (index.get(ref) !== want) {
            err(where, `${it.id}: refs.${bucket} → «${ref}», а это ${index.get(ref)}`);
          }
        }
      }
      if (it.date && it.date.precision === 'unknown') {
        warn(where, `${it.id}: дата «${it.date.raw}» не разобрана, сортировка по row`);
      }
    }
    checked += 1;
  }
}

// ---------------------------------------------------------------- вывод

const label = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

if (!quiet || errors.length) {
  console.log(`content:check — проверено файлов: ${checked}, `
    + `записей в индексах: ${indexRecords.size}`
    + (crosschecked ? `, сверено с pandoc: ${crosschecked}` : ''));
}
if (warnings.length && !quiet) {
  console.log(`\nПредупреждения (${warnings.length}):`);
  for (const w of warnings) console.log(`  • ${w}`);
}
if (errors.length) {
  console.error(`\nОшибки (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nПровалено ${errors.length} `
    + label(errors.length, 'проверка', 'проверки', 'проверок') + '.');
  process.exit(1);
}
console.log('\nОшибок нет.');
