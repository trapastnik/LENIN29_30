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

/**
 * Длина ТЕКСТА, а не строки: разметка не считается.
 *
 * Норма ТЗ про то, сколько читает посетитель. В `summary_ru` лежит markdown:
 * ссылка `[меньшевикам](#/party/mensheviks)` весит 38 знаков при 12 видимых,
 * и после того как связность выросла с 55 % до 82 %, сырая длина распухла
 * настолько, что 42 справки числились нарушителями нормы, укладываясь в неё
 * на самом деле. У «Туркестанского фронта» — 3681 знак строки против 2123
 * видимых. Считать по строке значит просить заказчика сократить текст,
 * которого он не писал.
 */
function visibleLength(s) {
  return (s || '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // ссылка → её текст
    .replace(/\*{1,3}([^*]*)\*{1,3}/g, '$1')   // выделения
    .length;
}

// Производные лежат в .gitignore и собираются только там, где есть ../IN/.
// На сервере и в свежем клоне каталога media/ нет вовсе — требовать там
// файлы тиров значит красить ворота в красный на пустом месте. Поэтому
// наличие файлов проверяем, только если сборка вообще прогонялась.
const mediaBuilt = existsSync(join(CONTENT, 'media'));

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
  // Пропавший индекс — ошибка, а не «нечего проверять». Иначе гейт на
  // исчезнувшем разделе отвечает «Ошибок нет», и это выглядит правдоподобно.
  if (!existsSync(path)) {
    err(rel(path), `индекса раздела «${kind}» нет — раздел не отрисуется`);
    continue;
  }
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

// Справочник лагерей — объединение блоков `camps` из всех индексов.
// Проверять `venn_groups` по нему, а не по списку в коде: лагеря заводит
// индекс, и жёсткий список тут разошёлся бы с данными молча.
const campVocabulary = new Set();
for (const { dir } of KINDS) {
  const idx = readJSON(join(CONTENT, dir, '_index.json'));
  for (const c of (idx && idx.camps) || []) {
    if (c && c.id) campVocabulary.add(c.id);
  }
}

// Лонгриды живут без `_index.json` — их по одному на раздел. Но ссылаться
// на них можно (`related.longreads`), поэтому id заводятся в общую таблицу
// разрешения так же, как записи индексов.
const LONGREADS = join(CONTENT, 'longreads');
if (existsSync(LONGREADS)) {
  for (const file of readdirSync(LONGREADS)) {
    if (!file.endsWith('.json') || file.startsWith('_')) continue;
    if (file.endsWith('.gen.json') || file.endsWith('.patch.json')) continue;
    const id = basename(file, '.json');
    if (index.has(id) && index.get(id) !== 'longread') {
      err(rel(join(LONGREADS, file)), `id «${id}» уже занят видом ${index.get(id)}`);
    }
    index.set(id, 'longread');
  }
}

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
  if (!existsSync(folder)) {
    err(rel(folder), `каталога раздела «${kind}» нет — проверять нечего, `
      + 'и это не повод считать проверку пройденной');
    continue;
  }

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
    const len = visibleLength(data.summary_ru);
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
    if (kind === 'party' && data.venn_groups) {
      const g = data.venn_groups;
      if (!Array.isArray(g)) {
        err(where, 'venn_groups должен быть массивом, а не одним лагерем');
      } else {
        // Порядок значим: первый лагерь — основной, по нему запись попадает
        // в фильтр и красится. Разъедется с `camp` — партия будет одного
        // цвета в списке и другого на диаграмме.
        if (data.camp && g[0] !== data.camp) {
          err(where, `venn_groups[0] = «${g[0]}», а camp = «${data.camp}» — `
            + 'на диаграмме и в фильтре партия окажется в разных лагерях');
        }
        if (new Set(g).size !== g.length) {
          err(where, 'venn_groups содержит повтор');
        }
        for (const c of g) {
          if (!campVocabulary.has(c)) {
            err(where, `venn_groups: «${c}» нет в справочнике лагерей индекса`);
          }
        }
      }
    }
  }
}

// Временные иллюстрации — превью с Госкаталога, скачанные, пока заказчик
// не поставил файлы. Считаем и печатаем громко, но НЕ роняем: заглушки обязаны
// спокойно жить, пока идёт запрос, а вечно красный гейт учит себя игнорировать.
const placeholders = [];

function checkMedia(where, data) {
  const seen = new Set();
  let unbuilt = 0;
  for (const m of data.media || []) {
    if (m.placeholder) {
      placeholders.push({ where, n: m.n, holder: m.holder_ru, gk: m.gk_no });
      if (!m.source_url) {
        warn(where, `media n=${m.n}: placeholder без source_url — `
          + 'заменить временную картинку будет нечем');
      }
    }
    if (typeof m.n !== 'number') { err(where, 'media без ключа n'); continue; }
    if (seen.has(m.n)) err(where, `media: номер n=${m.n} встречается дважды`);
    seen.add(m.n);

    if (!m.src_file) {
      // Внешний источник — не пропажа: файла в поставке нет и не будет,
      // изображение живёт в госкаталоге и подписано ссылкой.
      if (!m.source_url) {
        warn(where, `media n=${m.n}: аннотация «${m.src_name || m.caption_ru || '?'}»`
          + ' без файла на диске');
      }
      continue;
    }
    // ── каждый заявленный тир обязан существовать у КАЖДОЙ части записи:
    //    у двусторонней купюры вторая сторона живёт под своим путём (…05p2),
    //    и проверка одного `file` пропустила бы её пропажу
    const bases = m.files && m.files.length ? m.files : (m.file ? [m.file] : []);
    if (mediaBuilt) {
      for (const base of bases) {
        for (const tier of m.tiers || []) {
          const f = join(CONTENT, `${base}-${tier}.webp`);
          if (!existsSync(f)) {
            err(where, `media n=${m.n}: заявлен тир ${tier}, файла ${rel(f)} нет`);
          }
        }
      }
    }
    if ((m.parts || []).length > 1 && bases.length !== m.parts.length) {
      err(where, `media n=${m.n}: частей ${m.parts.length}, а путей производных `
        + `${bases.length} — вторая сторона потеряется`);
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
  // Записи без файла в индексе быть не должно вовсе. Раньше такие помечались
  // `stub: true` и пропускались — а UI считает раздел по длине `items` и
  // рисует плитку на каждый элемент, так что заглушки давали завышенные
  // счётчики и карточки, открывающиеся в пустоту.
  if (!existsSync(file)) {
    err(where, `нет файла справки${item.stub ? ' (помечено stub: true — так больше нельзя)' : ''}`
      + ' — запись показывает плитку-призрак и завышает счётчик раздела');
  } else if (item.stub) {
    warn(where, 'помечено stub: true, но файл справки существует');
  }
  if (!item.title_ru) err(where, 'в индексе нет title_ru — плитку нечем рисовать');
  // Индекс обязан быть самодостаточным. Достроить имя тира по шаблону нельзя:
  // апскейла нет, у мелких сканов тиров меньше трёх. Без списка `mediaUrl()`
  // возвращает null, и миниатюра остаётся заглушкой при собранных производных.
  if (item.lead_media && !(item.lead_tiers || []).length) {
    err(where, 'есть lead_media, но нет lead_tiers — миниатюра останется заглушкой');
  }
  // Пустой ключ хуже отсутствующего: UI не обязан отличать null от «поля нет»
  // и уходит рисовать миниатюру по пустому пути.
  if ('lead_media' in item && !item.lead_media) {
    err(where, 'lead_media присутствует, но пуст — ключ должен отсутствовать');
  }
  // Карточки событий лагерю не принадлежат — фильтр есть только у личностей,
  // партий и гособразований.
  if (!item.camp && kind !== 'event') {
    warn(where, 'нет camp — запись выпадает из фильтра по лагерям');
  }
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

// ---------------------------------------------------------------- лонгриды

/**
 * Лонгрид устроен иначе справки: текст разложен по секциям, медиа и ссылки
 * живут внутри них, `summary_ru` пуст. Поэтому отдельный проход, а не общий
 * цикл по KINDS.
 *
 * Главное здесь — `ref_labels`. Это денормализованный кэш подписей из наших
 * индексов: киоск запускается по `file://`, где `fetch` и XHR запрещены
 * (проверено в Chrome: без `--allow-file-access-from-files` оба падают),
 * и подтянуть индекс, чтобы подписать плашку связи, нечем. Плата за кэш —
 * он протухает от переименования в индексе, причём молча. Сверяем каждую
 * запись с индексом: тогда протухание — красный гейт, а не сюрприз приёмки.
 */
function checkRefs(where, refs, what) {
  for (const [bucket, ids] of Object.entries(refs || {})) {
    const want = PLURAL[bucket];
    if (!want) { err(where, `неизвестный раздел ${what}.${bucket}`); continue; }
    for (const ref of ids || []) {
      if (!index.has(ref)) {
        err(where, `${what}.${bucket} → «${ref}» вне индекса`);
      } else if (index.get(ref) !== want) {
        err(where, `${what}.${bucket} → «${ref}», а это ${index.get(ref)}`);
      }
    }
  }
}

if (existsSync(LONGREADS)) {
  const files = readdirSync(LONGREADS)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .filter((f) => !f.endsWith('.gen.json') && !f.endsWith('.patch.json'));

  for (const file of files) {
    const path = join(LONGREADS, file);
    const id = basename(file, '.json');
    const data = readJSON(path);
    if (!data) continue;
    checked += 1;
    const where = rel(path);

    if (data.schema !== 1) err(where, 'нет поля schema: 1');
    if (data.id !== id) err(where, `поле id = «${data.id}», а файл называется «${id}»`);
    if (data.kind !== 'longread') err(where, `kind = «${data.kind}», ожидался «longread»`);
    if (!data.title_ru) err(where, 'пустой title_ru');
    if (!['ok', 'missing', 'copy_of_ru'].includes(data.en_status)) {
      err(where, `en_status = «${data.en_status}», допустимы ok/missing/copy_of_ru`);
    }

    checkRefs(where, data.related, 'related');
    checkMedia(where, data);

    const used = new Set();
    const seenSection = new Set();
    for (const s of data.sections || []) {
      const sw = `${where} § ${s.id || s.n}`;
      if (!s.id) err(sw, 'секция без id — по нему строится якорь скролла');
      else if (seenSection.has(s.id)) err(where, `секция «${s.id}» встречается дважды`);
      else seenSection.add(s.id);
      if (!s.title_ru) err(sw, 'секция без title_ru');
      if (!(s.paragraphs_ru || []).length && !(s.media || []).length) {
        warn(sw, 'секция пуста: ни абзацев, ни медиа');
      }
      checkRefs(sw, s.refs, 'refs');
      for (const ids of Object.values(s.refs || {})) {
        for (const r of ids || []) used.add(r);
      }
      checkMedia(sw, s);
    }

    // ── кэш подписей обязан совпадать с индексом
    const labels = data.ref_labels || {};
    for (const ref of used) {
      if (!(ref in labels)) {
        err(where, `ref_labels: нет подписи для «${ref}» — плашка связи выйдет пустой`);
      }
    }
    for (const [ref, lab] of Object.entries(labels)) {
      const rec = indexRecords.get(ref);
      if (!rec) {
        err(where, `ref_labels: «${ref}» нет ни в одном индексе`);
        continue;
      }
      if (lab.kind !== rec.kind) {
        err(where, `ref_labels[${ref}].kind = «${lab.kind}», в индексе ${rec.kind}`);
      }
      if (lab.title_ru !== rec.item.title_ru) {
        err(where, `ref_labels[${ref}].title_ru протух: «${lab.title_ru}» ≠ `
          + `«${rec.item.title_ru}» в индексе — перегенерировать лонгрид`);
      }
      if ((lab.camp || null) !== (rec.item.camp || null)) {
        err(where, `ref_labels[${ref}].camp протух: «${lab.camp}» ≠ `
          + `«${rec.item.camp}» в индексе — перегенерировать лонгрид`);
      }
      if (lab.href && lab.href.startsWith('/')) {
        err(where, `ref_labels[${ref}].href начинается со слэша — `
          + 'под file:// это уедет в корень файловой системы');
      }
    }
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

if (placeholders.length) {
  const byHolder = new Map();
  for (const p of placeholders) {
    const k = p.holder || 'держатель не указан';
    byHolder.set(k, (byHolder.get(k) || 0) + 1);
  }
  const n = placeholders.length;
  console.log(`\n⚠  ВРЕМЕННЫХ ИЛЛЮСТРАЦИЙ: ${n} `
    + `${label(n, 'штука', 'штуки', 'штук')} — превью с Госкаталога вместо `
    + 'поставки заказчика.');
  for (const [holder, cnt] of [...byHolder].sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cnt}× ${holder}`);
  }
  console.log('     Официальные файлы запрошены. Гейт на этом не падает '
    + 'намеренно — заменить их надо до приёмки, а не до мержа.');
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
