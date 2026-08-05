#!/usr/bin/env node
// Тач-цели: меряем ПОПАДАНИЕ, а не стили.
//
// ЗАЧЕМ. Пороги §1 (основная навигация ≥120, управляющие ≥64) — приёмочный
// параметр, и до сих пор он проверялся глазами. Линтер `design` смотрит
// объявленные стили; попадание пальцем не мерил никто. А стили и попадание
// расходятся в обе стороны: у зоны `simbirsk` кнопка с честным min-height 64
// имела зону нажатия 65 px при норме 120, а `.back-link` в pages.css выглядит
// как 56 px, но добирает зону невидимым ::before до 240. По computed-стилям
// не виден ни первый случай, ни второй.
//
// РЕЖИМ — канон §5, и он печатается в шапке отчёта дословно:
//   Chrome --headless=new через Bash (НЕ панель браузера),
//   --window-size=1920,1080 --force-device-scale-factor=2,
//   собранный dist через npm run kiosk:serve.
// Панель браузера не годится: там document.visibilityState === 'hidden',
// шаги рендеринга не выполняются, ResizeObserver и rAF не доставляются
// вовсе — механизмы, завязанные на кадры, в ней непроверяемы.
//
//   node scripts/check-touch-targets.mjs
//   node scripts/check-touch-targets.mjs --update-baseline
//   node scripts/check-touch-targets.mjs --all      # печатать и законные
//
// Падает НА ПРИРОСТЕ к baseline: известные отклонения записаны там
// с причиной, красным становится только новое (CLAUDE.md §13).

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'scripts', 'check-touch-targets.baseline.json');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Свой статик-сервер на своём порту — по умолчанию. Полагаться на чужой,
// поднятый заранее, нельзя: он может умереть посреди прогона, и тогда часть
// сцен померится, а часть отдаст chrome-error. Один раз так и вышло: две
// сцены прошли, пять получили страницу ошибки. MTK_BASE_URL переопределяет —
// для отладки на уже запущенном сервере.
const ВНЕШНИЙ = process.env.MTK_BASE_URL || null;
const ПОРТ_СТАТИКИ = 8100 + (process.pid % 600);
const BASE = ВНЕШНИЙ || `http://127.0.0.1:${ПОРТ_СТАТИКИ}`;
const PORT = 9222 + (process.pid % 700);

// Сцены. Раздел показывает не всё сразу: у states.html карточки живут
// за экраном групп, у parties.html список за диаграммой. Меряя только то,
// что открылось само, мы не увидим большую часть целей.
const SCENES = [
  { имя: 'диаграмма Венна',   url: '/parties.html',           подготовка: null },
  { имя: 'список партий',     url: '/parties.html',           подготовка: 'список' },
  { имя: 'экран групп',       url: '/states.html',            подготовка: null },
  { имя: 'сетка территорий',  url: '/states.html',            подготовка: 'группа' },
  { имя: 'персоналии',        url: '/expo/people.html',       подготовка: null },
  { имя: 'хроника',           url: '/expo/chronicle.html',    подготовка: null },
  { имя: 'главная',           url: '/expo/index.html',        подготовка: null },
];

const PROBE = (подготовка) => `(async () => {
  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  // ── ловушка 1: elementFromPoint не спускается в shadow DOM ────────────
  function deepFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }

  // ── ловушка 2: el.contains() НЕ проходит сквозь границу shadow DOM ────
  // Хост никогда не «содержит» свой внутренний элемент, поэтому наивная
  // проверка помечает перехватом каждую party-card и state-card. В первом
  // прогоне это дало двадцать несуществующих дефектов. Поднимаемся вверх,
  // перепрыгивая с shadow root на его host.
  function попали(el, g) {
    let cur = g;
    while (cur) {
      if (cur === el) return true;
      if (cur.parentElement) { cur = cur.parentElement; continue; }
      const root = cur.getRootNode();
      cur = (root && root.host) ? root.host : null;
    }
    return false;
  }

  const подг = ${JSON.stringify(подготовка)};
  let подготовкаОтчёт = 'не требовалась';
  if (подг === 'список') {
    const b = [...document.querySelectorAll('button')].find(x => /Список|List/.test(x.textContent));
    if (b) { b.click(); подготовкаОтчёт = 'нажат «Список»'; await pause(900); }
    else подготовкаОтчёт = 'НЕ УДАЛАСЬ: кнопка «Список» не найдена';
  } else if (подг === 'группа') {
    const b = [...document.querySelectorAll('button, [role=button]')]
      .find(x => /Красные|Белые|Зелёные|Национальные|Интервен|Революционная/i.test(x.textContent));
    if (b) { b.click(); подготовкаОтчёт = 'открыта «' + b.textContent.replace(/\\s+/g,' ').trim().slice(0,26) + '»'; await pause(1400); }
    else подготовкаОтчёт = 'НЕ УДАЛАСЬ: плитка группы не найдена';
  }

  // Кто на самом деле прокручивается. У разделов документ не прокручивается
  // вовсе (main с overflow hidden), скроллер — внутренний контейнер.
  function найтиСкроллер() {
    const кандидаты = [];
    const обход = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) обход(el.shadowRoot);
        if (!/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
        if (el.scrollHeight - el.clientHeight < 4) continue;
        кандидаты.push(el);
      }
    };
    обход(document);
    const d = document.scrollingElement;
    if (d && d.scrollHeight - d.clientHeight >= 4) кандидаты.unshift(d);
    return кандидаты[0] || null;
  }

  const скроллер = найтиСкроллер();
  const ход = скроллер ? скроллер.scrollHeight - скроллер.clientHeight : 0;

  // ── ловушка 3: три положения прокрутки не покрывают список ────────────
  // При ходе 3203 px между «началом» и «серединой» остаётся полоса, в которую
  // цель не попадает ни разу, — и она ложно окажется недоступной. В первом
  // прогоне так «пропали» 24 карточки персон. Шагаем на 0.8 окна.
  const шаг = Math.max(1, Math.round(innerHeight * 0.8));
  const позиции = ход < 4 ? [0] : (() => {
    const out = [];
    for (let y = 0, i = 0; i < 40; i++, y += шаг) { out.push(Math.min(y, ход)); if (y >= ход) break; }
    return out;
  })();

  const СЕЛЕКТОР = 'button, a[href], [role="button"], .chip, .card, input, select, state-card, party-card';

  function собрать() {
    const acc = [];
    const обход = (root, путь) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) обход(el.shadowRoot, (путь ? путь + ' › ' : '') + el.tagName.toLowerCase());
        if (!el.matches(СЕЛЕКТОР)) continue;
        const b = el.getBoundingClientRect();
        if (b.width < 1 || b.height < 1) continue;
        acc.push({ el, путь: путь || 'страница', box: b });
      }
    };
    обход(document, '');
    return acc;
  }

  const подпись = (el) => ((el.getAttribute('aria-label') || el.textContent || '')
      .replace(/\\s+/g, ' ').trim().slice(0, 40)) || ('<' + el.tagName.toLowerCase() + '>');

  // Пороги §1. Чипы Венна — записанное исключение: меряем, но не судим.
  function порог(el, путь) {
    if (el.classList.contains('chip') && /venn/.test(путь)) return { need: null, роль: 'чип Венна' };
    if (el.classList.contains('back-link')) return { need: 120, роль: 'основная навигация' };
    if (/^(STATE-CARD|PARTY-CARD)$/.test(el.tagName)) return { need: 64, роль: 'карточка справки' };
    return { need: 64, роль: 'управляющий' };
  }

  // ── ловушка 4: ключ сводки ────────────────────────────────────────────
  // Ни подпись, ни порядковый номер не годятся. Подпись схлопнет 33 карточки
  // с пустым текстом и одинаковым боксом в одну строку (отчёт покажет 12
  // целей вместо 43). Порядковый номер разъедется там, где состав DOM меняется
  // при прокрутке — у персон и хроники отрисовка ленивая, и один и тот же
  // индекс в двух положениях указывает на РАЗНЫЕ карточки, отчего «лучшее
  // состояние» склеивается из кусков двух целей. Ключ — сама ссылка на узел.
  const итог = new Map();

  function замерить(el, путь, box) {
    const th = порог(el, путь);
    const cx = box.left + box.width / 2;
    const вКадреX = cx >= 0 && cx <= innerWidth;
    const точки = [box.top + 2, box.top + box.height / 2, box.bottom - 2].map(py => {
      if (!вКадреX || py < 0 || py > innerHeight) return 'вне';
      return попали(el, deepFromPoint(cx, py)) ? 'да' : 'перехват';
    });

    let up = 0, down = 0;
    const cy = box.top + box.height / 2;
    if (вКадреX && cy >= 0 && cy <= innerHeight) {
      const ok = (py) => py >= 0 && py <= innerHeight && попали(el, deepFromPoint(cx, py));
      while (up < 600 && ok(cy - up - 1)) up++;
      while (down < 600 && ok(cy + down + 1)) down++;
    }
    // +1 — сам центр: шаги считаются ОТ него, иначе 64 px дают 63
    // и каждая цель ложно оказывается на пиксель ниже нормы.
    const хит = (up + down) ? up + down + 1 : 0;
    const оценка = (точки.every(t => t === 'да') ? 4 : 0)
                 + (точки[1] === 'да' ? 2 : 0)
                 + (точки.includes('да') ? 1 : 0);
    return {
      подпись: подпись(el), путь, роль: th.роль, порог: th.need,
      бокс: [Math.round(box.width), Math.round(box.height)],
      хит, точки, оценка,
    };
  }

  const запомнить = (el, зам) => {
    const было = итог.get(el);
    if (!было || зам.оценка > было.оценка || (зам.оценка === было.оценка && зам.хит > было.хит)) итог.set(el, зам);
  };

  for (const y of позиции) {
    if (скроллер) { скроллер.scrollTop = y; await pause(300); }
    for (const { el, путь, box } of собрать()) запомнить(el, замерить(el, путь, box));
  }

  // ── ловушка 5: дискретные положения — тоже выборка ────────────────────
  // Шаг в 0.8 окна покрывает список, но цель может каждый раз останавливаться
  // под закреплённой шапкой и ни в одном положении не оказаться свободной.
  // В хронике так «пропали» две кнопки «Справка →», которые на деле
  // доступны — надо лишь прокрутить к ним. Доводим каждую спорную цель
  // до центра кадра и меряем ещё раз: это ровно то, что делает посетитель.
  const спорные = [...итог.entries()].filter(([, з]) => з.точки[1] !== 'да');
  for (const [el] of спорные) {
    try { el.scrollIntoView({ block: 'center' }); } catch { continue; }
    await pause(260);
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) continue;
    запомнить(el, замерить(el, итог.get(el).путь, b));
  }

  return JSON.stringify({
    цели: [...итог.values()],
    // Адрес и признак служебной страницы Chrome. Без этого гейт мерит
    // экран «не удалось открыть» как обычную сцену: там есть кнопки
    // Reload и Details, целей больше нуля, и проверка на пустой вход
    // молчит. Один раз так и вышло — три кнопки страницы ошибки уехали
    // в baseline как известные дефекты «главной».
    адрес: location.href,
    страницаОшибки: !!document.querySelector('#main-frame-error, .error-code')
                    || /chrome-error/.test(location.protocol),
    режим: {
      css: [innerWidth, innerHeight], dpr: devicePixelRatio,
      физически: [innerWidth * devicePixelRatio, innerHeight * devicePixelRatio],
      uiScale: getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim(),
      шрифты: document.fonts.status, видимость: document.visibilityState,
      подготовка: подготовкаОтчёт,
      скроллер: скроллер ? (скроллер.id || скроллер.className || скроллер.tagName) : 'нет прокрутки',
      ход, положений: позиции.length,
    },
  });
})()`;

/**
 * Классификация. Правилом, а не базой: 29 повёрнутых карточек персон дают
 * перехват углом, и записывать их в baseline поимённо — значит забить её
 * законным и перестать её читать (§13 про базу, которая не читается).
 */
function разобрать(ц) {
  const центр = ц.точки[1];
  // «Вне кадра» и «перехват» — разные диагнозы, и путать их нельзя.
  // Цель, до которой доскроллили и она всё равно вне кадра, физически
  // недостижима; перехваченная — достижима глазами, но не пальцем.
  if (центр === 'вне' && !ц.точки.includes('да'))
    return { дефект: true, вид: 'не попадает в кадр даже после прокрутки к ней' };
  if (центр === 'перехват') return { дефект: true, вид: 'перехвачен ЦЕНТР цели' };
  if (центр === 'вне')
    return { дефект: false, вид: 'центр за кромкой в замеренных положениях, край доступен' };
  if (ц.порог != null && ц.хит > 0 && ц.хит < ц.порог)
    return { дефект: true, вид: `хит-зона ${ц.хит} при норме ${ц.порог}` };
  if (ц.точки.includes('перехват'))
    return { дефект: false, вид: 'перехват по краю при доступном центре — соседний элемент заходит углом' };
  if (ц.точки.includes('вне'))
    return { дефект: false, вид: 'край за кромкой кадра при доступном центре' };
  return null;
}

async function cdp(ws, method, params = {}) {
  const id = cdp._id = (cdp._id || 0) + 1;
  return new Promise((res, rej) => {
    const on = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== id) return;
      ws.removeEventListener('message', on);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function мерить(сцена) {
  const url = BASE + сцена.url;
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  await cdp(ws, 'Page.enable');
  // ⚠️ --window-size задаёт ОКНО, а не холст. В headless это молча съедает
  // 87 px высоты: при --window-size=1920,1080 вьюпорт выходит 1920×993.
  // Восемь процентов высоты — не мелочь: у диаграммы Венна на них меняется
  // весь кадр (1425×801 против 1580×888), а с ним и расстояния между целями.
  // Точный холст задаём эмуляцией, флаг окна оставляем — он влияет на то,
  // каким Chrome считает экран.
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false,
  });
  // Ждём отрисовку и — обязательно — шрифты: до fonts.ready строка нарисована
  // запасным начертанием и уже настоящей, а от ширины подписи зависят размеры.
  await sleep(3400);
  const { result, exceptionDetails } = await cdp(ws, 'Runtime.evaluate', {
    expression: PROBE(сцена.подготовка), awaitPromise: true, returnByValue: true,
  });
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`).catch(() => {});
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return JSON.parse(result.value);
}

const ключ = (сцена, ц, вид) => `${сцена} | ${ц.роль} | ${ц.подпись} | ${вид}`;

async function main() {
  const обновить = process.argv.includes('--update-baseline');
  const всё = process.argv.includes('--all');

  // Статику поднимаем сами, если её нет. Гейт, требующий заранее запущенного
  // сервера, в `npm run check` не поставишь, а именно там он и нужен.
  let свой = null;
  const живой = async () => {
    try { return (await fetch(BASE + '/expo/index.html')).ok; } catch { return false; }
  };

  if (!await живой()) {
    if (ВНЕШНИЙ) {
      console.error(`✗ ${ВНЕШНИЙ} не отвечает. Подними сервер или убери MTK_BASE_URL — тогда подниму свой.`);
      process.exit(1);
    }
    свой = spawn('python3', ['-m', 'http.server', String(ПОРТ_СТАТИКИ), '--bind', '127.0.0.1',
                             '--directory', path.join(ROOT, 'dist')], { stdio: 'ignore' });
    for (let i = 0; i < 40; i++) { if (await живой()) break; await sleep(250); }
    if (!await живой()) {
      console.error(`✗ не удалось поднять статику на ${BASE}. Проверь, что dist/ собран: npm run build`);
      try { свой.kill(); } catch {}
      process.exit(1);
    }
  }
  const стопСервер = () => { if (свой) { try { свой.kill(); } catch {} свой = null; } };
  process.on('exit', стопСервер);

  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--window-size=1920,1080', '--force-device-scale-factor=2',
    '--hide-scrollbars', '--no-first-run',
    '--user-data-dir=' + (process.env.TMPDIR || '/tmp') + 'mtk29-touch',
  ], { stdio: 'ignore' });
  const убить = () => { try { chrome.kill(); } catch {} };
  process.on('exit', убить);

  let поднялся = false;
  for (let i = 0; i < 80; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); поднялся = true; break; }
    catch { await sleep(250); }
  }
  if (!поднялся) { console.error(`✗ Chrome не поднялся. Проверь путь: ${CHROME}`); убить(); стопСервер(); process.exit(1); }

  // База хранит ЧИСЛО по каждому ключу, а не просто наличие. Три кнопки
  // «Справка» в групповых блоках Венна неотличимы по подписи и роли, и без
  // счётчика четвёртая такая же прошла бы молча — гейт видел бы знакомый
  // ключ. Тот же механизм, что пофайловые счётчики у brand:lint.
  let база = [];
  try { база = JSON.parse(await readFile(BASELINE, 'utf8')).known || []; } catch {}
  const известно = new Map(база.map(b => [b.ключ, b.число ?? 1]));

  const находки = [];
  const законные = [];
  const пустые = [];
  let целейВсего = 0, сценОК = 0;

  console.log('режим: Chrome --headless=new через Bash (НЕ панель браузера),');
  console.log('       --window-size=1920,1080 --force-device-scale-factor=2,');
  console.log(`       собранный dist через npm run kiosk:serve (${BASE}),`);
  console.log('       замер попадания — elementFromPoint по верху/центру/низу');
  console.log('       со спуском в shadow DOM, прокрутка шагом 0.8 окна.\n');

  for (const сцена of SCENES) {
    let res;
    try { res = await мерить(сцена); }
    catch (e) { console.error(`  ✗ ${сцена.имя}: ${String(e).slice(0, 140)}`); пустые.push(сцена.имя); continue; }

    const m = res.режим;
    const n = res.цели.length;
    целейВсего += n;

    // Пустой вход — ошибка, а не отсутствие ошибок (§13). Ноль целей значит,
    // что сцена не отрисовалась, а не что на ней всё хорошо. И отдельно —
    // страница ошибки Chrome: она НЕ пустая, кнопки на ней есть, поэтому
    // проверка по числу целей её пропускает.
    if (res.страницаОшибки || !String(res.адрес).startsWith(BASE)) {
      пустые.push(`${сцена.имя}: страница не открылась, адрес ${res.адрес}`);
      continue;
    }
    if (n === 0 || /НЕ УДАЛАСЬ/.test(m.подготовка)) {
      пустые.push(`${сцена.имя} (целей ${n}, подготовка: ${m.подготовка})`);
      continue;
    }
    сценОК++;

    console.log(`  ${сцена.имя.padEnd(20)} целей ${String(n).padStart(3)} · CSS ${m.css[0]}×${m.css[1]} · DPR ${m.dpr}`
      + ` → физ. ${m.физически[0]}×${m.физически[1]} · --ui-scale ${m.uiScale} · шрифты ${m.шрифты}`
      + ` · ${m.видимость} · ход ${m.ход}px в ${m.положений} положениях`);

    for (const ц of res.цели) {
      const р = разобрать(ц);
      if (!р) continue;
      const запись = { сцена: сцена.имя, ...ц, вид: р.вид, ключ: ключ(сцена.имя, ц, р.вид) };
      (р.дефект ? находки : законные).push(запись);
    }
  }
  убить();
  стопСервер();

  console.log(`\nпроверено: ${целейВсего}/${целейВсего} целей на ${сценОК}/${SCENES.length} сценах`);

  if (пустые.length) {
    console.error(`\n✗ сцены без целей — они не отрисовались, а не «прошли»:`);
    for (const p of пустые) console.error(`    ${p}`);
    process.exit(1);
  }

  // Считаем по ключу: одинаковых целей бывает несколько.
  const счёт = new Map();
  for (const f of находки) счёт.set(f.ключ, (счёт.get(f.ключ) || 0) + 1);

  if (обновить) {
    const known = [];
    for (const [k, n] of счёт) {
      const обр = находки.find(f => f.ключ === k);
      known.push({ ключ: k, причина: обр.вид, число: n, бокс: обр.бокс, хит: обр.хит });
    }
    await writeFile(BASELINE, JSON.stringify({
      note: 'Известные отклонения тач-целей: ключ, причина и ЧИСЛО таких целей. '
          + 'Падаем на приросте — и по новому ключу, и по выросшему числу.',
      known,
    }, null, 2) + '\n', 'utf8');
    console.log(`✓ baseline записан: ${known.length} видов, ${находки.length} целей`);
    return;
  }

  const новые = [];
  const старые = [];
  for (const [k, n] of счёт) {
    const было = известно.get(k) || 0;
    const свои = находки.filter(f => f.ключ === k);
    if (n > было) {
      новые.push(...свои.slice(0, n - было).map(f => ({ ...f, прирост: `${n} против ${было} в базе` })));
      старые.push(...свои.slice(n - было));
    } else {
      старые.push(...свои);
    }
  }

  const печать = (title, arr) => {
    if (!arr.length) return;
    console.log(`\n${title} — ${arr.length}:`);
    for (const f of arr) {
      console.log(`   ${f.сцена} · ${f.подпись}`);
      console.log(`      ${f.вид} · бокс ${f.бокс.join('×')} · точки ${f.точки.join('/')} · ${f.путь}`);
    }
  };

  печать('НОВЫЕ ДЕФЕКТЫ', новые);
  if (старые.length) console.log(`\nизвестных отклонений в базе: ${старые.length} (см. ${path.relative(ROOT, BASELINE)})`);
  if (всё) печать('ЗАКОННЫЕ (не дефекты)', законные);
  else if (законные.length) console.log(`законных отклонений: ${законные.length} — показать: --all`);

  if (новые.length) {
    console.error(`\n✗ новых дефектов тач-целей: ${новые.length}`);
    console.error('  Если это законное отклонение — зафиксируй с причиной:');
    console.error('    node scripts/check-touch-targets.mjs --update-baseline');
    process.exit(1);
  }
  console.log('\n✓ новых дефектов тач-целей нет');
}

main().catch((e) => { console.error(e); process.exit(1); });
