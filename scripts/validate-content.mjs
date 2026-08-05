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

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
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
const CHIP_MAX = 34;   // знаков ≈ 340 px в 21 Cent, замеры зоны design
const chipLabels = new Map();
const referencedCards = new Set();

// Формы редакторских пометок, встречающиеся в справках заказчика.
// «Стоит отметить, что…» — обычная проза, поэтому «отметить» ловится только
// в связке с «цифрой N»: иначе первое же вводное слово даст ложную тревогу
// (проверено на «Дашнакцутюн»).
const EDITORIAL_NOTE = new RegExp([
  'отметить[^.]{0,60}цифр',
  'см\\.\\s*литератур',
  'нужно подобрать',
  'подрезать (?:поля|бел)',
  'обрезать поля',
  'дизайнерам\\s*:',
  'разместить обе стороны',
  'добавлено в последний момент',
].join('|'), 'i');

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

/**
 * База предупреждений — `content-src/_warnings-baseline.json`.
 *
 * Список, который всегда одинаков, перестают читать. Тот же эффект, что
 * у вечно красного гейта из §8: сто пятьдесят одна строка два дня подряд
 * приучает искать новое глазами и по памяти вместо механики. Формулировку
 * принесла зона `maps`: «проверка, красная всегда, не отличается
 * от выключенной» — роняй на ПРИРОСТЕ, а не на факте.
 *
 * База хранит не одно число, а разбивку ПО ПРИЧИНАМ: 94 непоставленных
 * заказчиком файла и 53 превышения нормы ТЗ — разные вещи. Первые уйдут,
 * когда музей ответит; вторые могут остаться навсегда. Свалив их в одно
 * число, потом не разберёшь, что рассосалось само, а что мы приняли.
 */
const BASELINE = join(ROOT, 'content-src', '_warnings-baseline.json');
const updateBaseline = process.argv.includes('--update-baseline');

/** Предупреждение → причина. Порядок важен: первое совпадение выигрывает. */
const REASONS = [
  ['media-missing', /без файла на диске/, 'заказчик не поставил файл'],
  ['tz-limit', /норма ТЗ/, 'справка длиннее нормы ТЗ'],
  ['no-camp', /нет camp/, 'лагерь не определён'],
  ['media-unbuilt', /производные не собраны/, 'не прогнан media:build'],
  ['parser-drift', /меньше текста/, 'парсер разошёлся с pandoc'],
  ['schema', /schema: 1/, 'нет поля schema'],
  ['placeholder', /placeholder/, 'временная иллюстрация'],
  ['other', /.*/, 'прочее'],
];

function reasonOf(msg) {
  for (const [key, rx] of REASONS) if (rx.test(msg)) return key;
  return 'other';
}

const errors = [];
const warnings = [];
const quiet = process.argv.includes('--quiet');

const err = (where, msg) => errors.push(`${where}: ${msg}`);
// Пара `where`/`msg` хранится рядом со склеенной строкой: по ней строится
// устойчивое имя предупреждения для базы долга. Склеенная строка годится
// человеку, но не ключу — в ней числа, которые меняются при каждой правке.
const warnPairs = [];
const warn = (where, msg) => {
  warnings.push(`${where}: ${msg}`);
  warnPairs.push({ where, msg });
};

/**
 * Устойчивое имя предупреждения: причина, файл, форма сообщения.
 *
 * Числа из сообщения вычищаются — длина справки меняется при любой правке
 * текста, и ключ на её основе уезжал бы каждый раз, показывая обмен там,
 * где его нет. Исключение — номер аннотации `n=N`: он различает записи
 * внутри одного файла и от правок не зависит.
 */
function warnKey(reason, where, msg) {
  const n = /\bn=(\d+)/.exec(msg);
  const shape = msg.replace(/\d+/g, '#');
  return `${reason} | ${where} | ${shape}${n ? ` | n=${n[1]}` : ''}`;
}

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
  // Корня исходников нет — это сервер или свежий клон, там их и не должно
  // быть. А вот корень есть, а файла в нём нет — оборванная ссылка: справку
  // нечем переимпортировать, и кросс-чек по ней молча перестаёт работать.
  // Различение подсказала зона `maps`: у неё переезд каталога «Все карты
  // (сборка)» в IN/02-maps-src осиротил 10 ссылок из 25 при зелёном прогоне.
  if (!src || !existsSync(IN)) return;
  const docx = join(IN, src);
  if (!existsSync(docx)) {
    err(where, `src.file указывает на «${src}», а файла в ../IN/ нет — `
      + 'справку нечем переимпортировать, исходник переехал или переименован');
    return;
  }
  if (!havePandoc()) return;

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

// -------------------------------------------- сверка индекса и справки

/**
 * Индекс и справка обязаны говорить одно и то же.
 *
 * За двое суток класс «связь есть в одном файле и нет в другом» дал пять
 * случаев: карта Комуча, шесть полигонов, карточка события №34, схемы
 * Симбирска, `territory_id`. У всех общее — **обе стороны зелёные**:
 * у владельца данных битых ссылок нет, потому что ссылок нет вовсе,
 * а у потребителя `null` — валидное «пока нет».
 *
 * Проверка «сверить все общие поля» не годится: `title_ru` расходится
 * законно у 110 записей из 198 (в индексе подпись плитки «КАМЕНЕВ»,
 * в справке полное имя «С. С. КАМЕНЕВ»), и такой гейт был бы красным
 * с рождения — то есть выключенным. Поэтому поля разведены по трём классам.
 */

/** A. Обязаны совпадать значением. Расхождение — ошибка. */
const AGREE_FIELDS = [
  'camp', 'venn_groups', 'x', 'y', 'title_chip_ru', 'abbr_ru',
  'territory_id', 'map_id', 'map_status', 'open_question_ru',
  // Только у личностей: индекс берёт ключ из справки, где он считан
  // от фамилии. У остальных видов ключ выводится из подписи плитки —
  // «ЗСФСР» по полному названию уехало бы на «Ф», а посетитель ищет
  // глазами то, что написано.
  { field: 'sort_key_ru', kinds: ['person'] },
];

const agreeField = (f) => (typeof f === 'string' ? f : f.field);
const agreeApplies = (f, kind) => (typeof f === 'string' || !f.kinds
  || f.kinds.includes(kind));

/** C. Исключено намеренно. Печатается каждый прогон — исключение, о котором
 *  знает только комментарий в генераторе, однажды «починят по правилу». */
const EXCLUDED_FIELDS = [
  { field: 'title_ru',
    why: 'подпись плитки против полного имени, решение M0' },
];

/** Пусто — это `undefined`, `null`, пустая строка и пустой массив.
 *  Справка пишет `abbr_ru: []`, индекс поле опускает — это одно и то же
 *  «аббревиатуры нет», и считать их расхождением значит выдать 48 ложных
 *  тревог и приучить пропускать настоящие. */
const isEmpty = (v) => v === undefined || v === null || v === ''
  || (Array.isArray(v) && v.length === 0);

const eq = (a, b) => {
  if (isEmpty(a) || isEmpty(b)) return isEmpty(a) && isEmpty(b);
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => eq(v, b[i]));
  }
  return a === b;
};

const shown = (v) => Array.isArray(v) ? `[${v.join(', ')}]`
  : (v === undefined ? '(поля нет)' : (v === null ? 'null' : `«${v}»`));

const agreeStats = Object.fromEntries(AGREE_FIELDS.map((f) => [agreeField(f), [0, 0]]));
const excludedStats = Object.fromEntries(EXCLUDED_FIELDS.map((e) => [e.field, 0]));
let derivedChecked = 0;

function crossCheckIndexCard(where, card, item, kind) {
  for (const spec of AGREE_FIELDS) {
    if (!agreeApplies(spec, kind)) continue;
    const f = agreeField(spec);
    const a = card[f];
    const b = item[f];
    if (isEmpty(a) && isEmpty(b)) continue;
    agreeStats[f][1] += 1;
    if (eq(a, b)) { agreeStats[f][0] += 1; continue; }
    err(where, `${f}: в справке ${shown(a)}, в индексе ${shown(b)} — `
      + 'плитка и карточка покажут разное');
  }
  for (const { field } of EXCLUDED_FIELDS) {
    if (card[field] !== undefined && item[field] !== undefined
        && !eq(card[field], item[field])) excludedStats[field] += 1;
  }

  // B. Производные: в индексе есть, в справке нет — потому что вычисляются.
  // Сверяется ПРАВИЛО вывода, а не равенство.
  derivedChecked += 1;
  const lead = (card.media || []).find((m) => m.slot === 'lead' && m.file && (m.tiers || []).length)
    || (card.media || []).find((m) => m.file && (m.tiers || []).length);
  if (lead) {
    if (item.lead_media !== lead.file) {
      err(where, `lead_media в индексе ${shown(item.lead_media)}, а первая `
        + `картинка с производными — ${shown(lead.file)}`);
    }
    if (!eq(item.lead_tiers, lead.tiers)) {
      err(where, `lead_tiers в индексе ${shown(item.lead_tiers)}, `
        + `у картинки ${shown(lead.tiers)}`);
    }
  } else if (item.lead_media !== undefined) {
    err(where, 'в индексе есть lead_media, а в справке нет ни одной картинки '
      + 'с собранными производными');
  }
  const disp = card.dates && card.dates.display_ru;
  if (disp && item.dates_display_ru !== undefined) {
    const firstLine = String(disp).split('\n')[0].trim();
    if (item.dates_display_ru !== firstLine) {
      err(where, `dates_display_ru в индексе ${shown(item.dates_display_ru)}, `
        + `а первая строка дат справки — ${shown(firstLine)}`);
    }
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
    } else {
      crossCheckIndexCard(where, data, indexRecords.get(id).item, kind);
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
    // ── подпись чипа диаграммы
    // Порог 34 знака ≈ 340 px в 21 Cent по замерам design. Длиннее — чип
    // не помещается в блоб, и перестановкой это не чинится: блоб стоит
    // у кромки кадра, а подпись растёт вправо.
    if (kind === 'party') {
      const chip = data.title_chip_ru;
      const shown = chip || data.title_ru || '';
      if (chip && chip.length > CHIP_MAX) {
        err(where, `title_chip_ru ${chip.length} знаков, порог ${CHIP_MAX} — `
          + 'подпись не поместится в блоб диаграммы');
      }
      if (!chip && (data.title_ru || '').length > CHIP_MAX) {
        warn(where, `title_ru ${data.title_ru.length} знаков и нет `
          + `title_chip_ru — на диаграмме подпись выйдет за кромку кадра`);
      }
      const key = shown.toLowerCase();
      if (chipLabels.has(key) && chipLabels.get(key) !== data.id) {
        err(where, `подпись чипа «${shown}» уже занята записью `
          + `«${chipLabels.get(key)}» — на диаграмме их будет не различить`);
      }
      chipLabels.set(key, data.id);
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
      // Слот наполнен, если у него есть ЧТО показать. Источников содержимого
      // три, и файл — только один из них:
      //   `src_file`   — поставка заказчика;
      //   `source_url` — внешний источник (Госкаталог), файла не будет вовсе;
      //   `map_id`     — карта-схема, отрисовывается `<map-unit>`.
      // Третий добавлен по заявке зоны `simbirsk` 2026-08-05: две схемы
      // Симбирска собраны и отрисованы (41 и 49 узлов SVG в теневом дереве,
      // замерено на живом `dist`), а правило звало их пропажей — оно знало
      // про файлы и не знало про карты.
      if (!m.source_url && !m.map_id) {
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
    // ── редакторская пометка в видимом поле
    // Колонка ПРИМЕЧАНИЕ в докс — инструкции верстальщику, и их место
    // в `_notes.json`, а не в подписи под экспонатом. Проходят они молча:
    // пометка выглядит как данные, ни один прогон на ней не краснеет.
    // Формы, которые встречаются: «Отметить … цифрой 1», «(см. литература
    // последний лист)», «Нужно подобрать …», «Подрезать поля».
    for (const f of ['caption_ru', 'extra_ru', 'inv_ru']) {
      const v = m[f];
      if (v && EDITORIAL_NOTE.test(v)) {
        err(where, `media n=${m.n}: в ${f} редакторская пометка — `
          + `«${v.match(EDITORIAL_NOTE)[0]}». Её место в _notes.json, `
          + 'иначе посетитель прочитает указание верстальщику');
      }
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
      for (const f of ['card', 'card_pol', 'card_mil']) {
        const v = it[f];
        if (v && index.get(v) !== 'event') {
          err(where, `${it.id}: ${f} = «${v}» не найден в индексе событий`);
        }
        if (v) referencedCards.add(v);
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

// Обратная половина по карточкам событий: карточка есть, а хроника на неё
// не ссылается — переход к ней недостижим. Так потерялась карточка №34:
// строка 1918 года несла ДВА перехода, по одному на колонку, а поле было
// одно, и второй отбрасывался молча. Одна строка из 76.
for (const [id, { kind }] of indexRecords) {
  if (kind !== 'event' || referencedCards.has(id)) continue;
  warn(`${'events'}/_index.json`, `на карточку «${id}» не ссылается ни одна `
    + 'строка хроники — перехода к ней нет');
}

// ------------------------------------------------------ связь со слоем карт

/**
 * Ссылка проверяется в ОБЕ стороны — седьмой пункт чек-листа, формулировка
 * зоны `maps`.
 *
 * Прямая половина: `territory_id` справки ведёт в существующую запись реестра
 * и у той есть полигон. Обратная: на собранную геометрию кто-то ссылается.
 *
 * Без обратной половины обе зоны показывают зелёное при пустом экране, и обе
 * правы по своей: у `maps` ни одна ссылка не битая — потому что ссылок нет
 * вовсе; у меня `territory_id: null` — валидное значение «карты нет». Именно
 * так шесть готовых полигонов не попадали на экран, и заметили это случайно.
 */
const GEO = join(CONTENT, 'geo', '_index.json');
if (existsSync(GEO)) {
  const geo = readJSON(GEO) || {};
  const byId = new Map();
  for (const r of geo.items || []) if (r && r.id) byId.set(r.id, r);

  const referenced = new Set();
  for (const [id, { item, kind, dir }] of indexRecords) {
    if (kind !== 'state') continue;
    const card = readJSON(join(CONTENT, dir, `${id}.json`));
    const tid = card && card.territory_id;
    if (!tid) continue;
    referenced.add(tid);
    const where = `${dir}/${id}.json`;
    const rec = byId.get(tid);
    if (!rec) {
      err(where, `territory_id = «${tid}», а записи с таким id нет `
        + 'в реестре карт — карточка попросит несуществующий слой');
    } else if (!rec.polygon) {
      err(where, `territory_id = «${tid}», но полигона у этой записи нет — `
        + 'ссылка заведена «на будущее», §5 это запрещает');
    }
  }

  for (const r of geo.items || []) {
    if (!r || !r.polygon || referenced.has(r.id)) continue;
    warn(rel(GEO), `у «${r.id}» есть геометрия, но ни одна справка на неё `
      + 'не ссылается — полигон собран и на экран не попадёт');
  }
}

/**
 * СОБРАННАЯ КАРТА — вторая половина того же контракта, и она отдельная.
 *
 * `territory_id` ведёт в реестр геометрии, но карточку рисует не он:
 * `state-card.js:229` читает `map_id`, `:231` — массив `initial_layers`.
 * Седьмой случай класса «обе стороны зелёные» вскрылся именно здесь —
 * три карты собраны зоной `maps`, а `map_id` стоял у одной записи из 59.
 *
 * ⚠️ Слой проверяется поимённо, потому что `initial-layers` ЗАМЕЩАЕТ
 * умолчания паспорта. Опечатка в имени не даёт ни ошибки, ни пустого
 * экрана: карта покажет то, что осталось включённым, — например, все
 * четыре территории вместо одной. Это молчаливая подмена, а не дырка.
 *
 * Обратная половина считает ссылки из ДВУХ мест — справок и медиа-слотов
 * лонгрида. Иначе схемы Симбирска, на которые ссылается только лонгрид,
 * попали бы в «карта собрана и никому не нужна» ложно.
 */
{
  const MAPS = join(CONTENT, 'maps');
  const passports = new Map();
  if (existsSync(MAPS)) {
    for (const dir of readdirSync(MAPS)) {
      const p = join(MAPS, dir, 'map.json');
      if (!existsSync(p)) continue;
      const m = readJSON(p);
      if (!m) continue;
      passports.set(m.id || dir,
        new Set((m.layers || []).map((l) => l && l.id).filter(Boolean)));
    }
  }

  const usedMaps = new Set();
  const noteMap = (mapId, where, what) => {
    if (!mapId) return;
    usedMaps.add(mapId);
    if (!passports.has(mapId)) {
      err(where, `${what} = «${mapId}», а собранной карты с таким id нет — `
        + 'карточка попросит несуществующую карту');
    }
  };

  for (const [id, { item, kind, dir }] of indexRecords) {
    if (kind !== 'state') continue;
    const card = readJSON(join(CONTENT, dir, `${id}.json`));
    if (!card) continue;
    const where = `${dir}/${id}.json`;
    noteMap(card.map_id, where, 'map_id');
    const layers = card.initial_layers || [];
    if (layers.length && !card.map_id) {
      err(where, 'initial_layers заведены, а map_id пуст — слои включать не в чем');
    }
    const known = passports.get(card.map_id);
    if (known) {
      for (const l of layers) {
        if (!known.has(l)) {
          err(where, `initial_layers: слоя «${l}» нет в карте «${card.map_id}» — `
            + 'список замещает умолчания, и карта покажет чужие территории');
        }
      }
    }
  }

  if (existsSync(LONGREADS)) {
    for (const file of readdirSync(LONGREADS)) {
      if (!file.endsWith('.json') || file.startsWith('_')) continue;
      const data = readJSON(join(LONGREADS, file));
      if (!data) continue;
      const where = rel(join(LONGREADS, file));
      const slots = [...(data.media || []),
        ...(data.sections || []).flatMap((s) => s.media || [])];
      for (const m of slots) noteMap(m && m.map_id, where, `media n=${m.n}: map_id`);
    }
  }

  // ⚠️ Страницы считаются наравне с данными. Первый прогон этой проверки
  // объявил `povolzhye-1918-1919` никому не нужной — а её показывает
  // `demo-povolzhye.html:69`, и страница входит в сборку. Считать надо
  // ВСЕ ссылки, а не те, что ожидаешь увидеть: фильтр по ожиданию
  // подтверждает ожидание. Тот же класс, что «59 карточек → 0 запросов».
  const pageRefs = new Map();
  for (const dir of [ROOT, join(ROOT, 'public', 'expo')]) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.html')) continue;
      const html = readFileSync(join(dir, file), 'utf-8');
      for (const m of html.matchAll(/map-id="([^"]+)"/g)) {
        usedMaps.add(m[1]);
        if (!pageRefs.has(m[1])) pageRefs.set(m[1], file);
      }
    }
  }

  for (const mapId of passports.keys()) {
    if (usedMaps.has(mapId)) continue;
    warn(rel(join(MAPS, mapId)), `карта «${mapId}» собрана, но на неё `
      + 'не ссылается ничто — ни справка, ни лонгрид, ни страница');
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

// Сверка индекса и справки — итог со знаменателями. Печатается всегда,
// в том числе когда всё сошлось: «сверено 0 полей» обязано быть заметно.
if (!quiet) {
  if (!derivedChecked) {
    err('сверка индекса и справок', 'не сверено ни одной записи — '
      + 'проверять нечего, и это ошибка, а не «всё хорошо»');
  }
  const line = AGREE_FIELDS.map(agreeField)
    .filter((f) => agreeStats[f][1])
    .map((f) => `${f} ${agreeStats[f][0]}/${agreeStats[f][1]}`)
    .join(' · ');
  console.log(`\nсверка индекса и справки — записей ${derivedChecked}`
    + (line ? `\n  совпадение: ${line}` : ''));
  for (const { field, why } of EXCLUDED_FIELDS) {
    console.log(`  ${field} — исключено намеренно: ${why}`
      + (excludedStats[field] ? `, расходится у ${excludedStats[field]}/${derivedChecked}` : ''));
  }
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
// ── Обратный индекс: свежесть ────────────────────────────────────────────
// `public/content/_backlinks.json` генерируется по справкам. Правка текста
// меняет связи, а закоммиченный файл остаётся прежним — и блок «связанные
// справки» показывает то, чего уже нет. Класс тот же, что у `expo:check`:
// артефакт коммитится, и без ворот несвежесть не видна ничем.
//
// Пересчёт делает ОДНА реализация — `scripts/import/backlinks.py --check`.
// Своя копия логики на JS была бы второй, и расхождение двух реализаций
// печаталось бы как расхождение данных: ложное красное учит пропускать гейт.
{
  const script = join(ROOT, 'scripts', 'import', 'backlinks.py');
  const r = spawnSync('python3', [script, '--check'], { encoding: 'utf-8' });
  if (r.error || r.status === null) {
    // Не «пропустим проверку»: молча не выполненная проверка неотличима
    // от пройденной (§13). Падаем и называем причину.
    errors.push('обратный индекс НЕ ПРОВЕРЕН — не запустился python3'
      + `: ${r.error ? r.error.message : 'сигнал ' + r.signal}`
      + '. python3 нужен и для media:build');
  } else if (r.status !== 0) {
    errors.push(((r.stderr || r.stdout || '').trim() || '')
      .split('\n').join(' ')
      || `обратный индекс: backlinks.py --check вернул ${r.status}`);
  } else if (!quiet) {
    console.log(`\n${(r.stdout || '').trim()}`);
  }
}

const byReason = {};
for (const w of warnings) {
  const k = reasonOf(w);
  byReason[k] = (byReason[k] || 0) + 1;
}

// Имена признанных предупреждений — вторая половина базы. Без них счётчик
// не видит ОБМЕНА внутри корзины: одна справка ушла из-под порога, другая
// пришла, число то же, гейт зелёный, набор другой. У `ussr` 3003 знака при
// норме 3000, и 51 справка лежит в полосе ±300 — любая правка текста двигает
// набор. Платится это не техникой: в письме музею стоит список 53 справок
// сверх нормы, и разойдись он — мы спросим музей про не те.
const currentKeys = warnPairs.map(({ where, msg }) =>
  warnKey(reasonOf(`${where}: ${msg}`), where, msg));

if (updateBaseline) {
  const payload = {
    schema: 2,
    _note: 'База предупреждений: счётчики по причинам И ИМЕНА признанных. '
      + 'Гейт падает на ПРИРОСТЕ числа и на ЛЮБОМ новом имени — список, '
      + 'который всегда одинаков, перестают читать. Обновлять осознанно: '
      + '`--update-baseline` стирает единственную метрику, по которой видно, '
      + 'кто добавил.',
    _updated: '2026-08-05',
    _why: 'До schema 2 база хранила только числа, и обмен внутри корзины '
      + 'проходил незамеченным: набор менялся при неизменном счётчике. '
      + 'Имена заведены по решению оркестратора 2026-08-05.',
    reasons: Object.fromEntries(REASONS.map(([k, , title]) => [k, title])),
    counts: byReason,
    items: [...currentKeys].sort(),
  };
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + '\n');
  console.log(`база предупреждений обновлена: ${rel(BASELINE)} `
    + `— ${payload.items.length} имён`);
}

const baseline = existsSync(BASELINE) ? (readJSON(BASELINE) || {}) : null;
const grown = [];
const appeared = [];
if (baseline && baseline.counts && !updateBaseline) {
  for (const [k, n] of Object.entries(byReason)) {
    const was = baseline.counts[k] || 0;
    if (n > was) grown.push({ k, was, now: n, title: (baseline.reasons || {})[k] || k });
  }
  if (Array.isArray(baseline.items)) {
    const known = new Set(baseline.items);
    for (const key of new Set(currentKeys)) {
      if (!known.has(key)) appeared.push(key);
    }
  }
}

if (warnings.length && !quiet) {
  console.log(`\nПредупреждения (${warnings.length}):`);
  for (const w of warnings) console.log(`  • ${w}`);
}
if (baseline && baseline.counts && !updateBaseline && !quiet) {
  const line = Object.entries(byReason)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${(baseline.reasons || {})[k] || k}: ${n}`
      + ((baseline.counts[k] || 0) !== n ? ` (было ${baseline.counts[k] || 0})` : ''))
    .join(', ');
  console.log(`\nпо причинам — ${line}`);
}

// Долг ушёл — не ошибка, но сказать надо: вместе с «появилось» это и есть
// картина обмена. Раньше на его месте было молчание.
if (baseline && Array.isArray(baseline.items) && !updateBaseline && !quiet) {
  const now = new Set(currentKeys);
  const gone = baseline.items.filter((k) => !now.has(k));
  if (gone.length) {
    console.log(`\nушло из долга: ${gone.length}`);
    for (const k of gone.slice(0, 10)) console.log(`  − ${k}`);
    if (gone.length > 10) console.log(`  … ещё ${gone.length - 10}`);
    console.log('  Принять новый набор: node scripts/validate-content.mjs '
      + '--update-baseline');
  }
}

if (grown.length || appeared.length) {
  console.log(`\n${'!'.repeat(60)}`);
}
if (grown.length) {
  console.log('ПРИРОСТ ПРЕДУПРЕЖДЕНИЙ — стало хуже, чем было:');
  for (const g of grown) {
    console.log(`  ${g.title}: ${g.was} → ${g.now}  (+${g.now - g.was})`);
  }
}
if (appeared.length) {
  // Число могло не вырасти вовсе: одно ушло, другое пришло. Именно этот
  // случай база из одних счётчиков пропускала молча.
  console.log(`НОВЫЕ ПРЕДУПРЕЖДЕНИЯ — ${appeared.length} `
    + `${label(appeared.length, 'штука', 'штуки', 'штук')}, `
    + 'которых нет в признанном долге:');
  for (const k of appeared.slice(0, 15)) console.log(`  + ${k}`);
  if (appeared.length > 15) console.log(`  … ещё ${appeared.length - 15}`);
}
if (grown.length || appeared.length) {
  console.log('Разобрать и починить. Если это осознано и принято — '
    + 'node scripts/validate-content.mjs --update-baseline');
  console.log('!'.repeat(60));
}

if (errors.length) {
  console.error(`\nОшибки (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nПровалено ${errors.length} `
    + label(errors.length, 'проверка', 'проверки', 'проверок') + '.');
}
if (errors.length || grown.length || appeared.length) {
  process.exit(1);
}
console.log('\nОшибок нет.');
