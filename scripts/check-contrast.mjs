#!/usr/bin/env node
// Контраст текста — по ФАКТИЧЕСКОМУ пикселю, а не по разбору CSS.
//
// ЗАЧЕМ ИМЕННО ПИКСЕЛЬ. Прежняя версия жила внутри check-touch-targets и
// считала фон разбором CSS-градиента: брала самую тёмную стоп-точку
// многослойного полупрозрачного фона. У карточек персон это дало «контраст
// 1.2 на rgb(120,80,20)», тёмный угол — которого НЕТ. Реальный пиксель под
// подписью rgb(204,184,140), светлая бумага, контраст ~3.08. Идея «худшей
// точки» верна (текст может лежать на любой), но предсказание по CSS берёт
// тёмную точку и там, где её под текстом физически нет, и композитит слои
// неправильно. Разбор CSS достоверен только для сплошного непрозрачного
// background-color; градиент, картинка, полупрозрачные слои — предсказание.
//
// Поэтому фон берём с отрисованного кадра: Page.captureScreenshot региона
// под текстом, среди пикселей отделяем фон от букв (буквы ≈ цвет текста)
// и меряем контраст против фактического фона. Это тот же закон, что у всех
// наших мерок: elementFromPoint вместо стилей, dist вместо dev, замер после
// fonts.ready — мерить ОТРИСОВАННОЕ, а не предсказанное.
//
// РЕЖИМ — канон §5: Chrome --headless=new через Bash, окно 1920×1080 плюс
// --force-device-scale-factor=2, собранный dist. Печатается в шапке отчёта.
//
//   node scripts/check-contrast.mjs
//   node scripts/check-contrast.mjs --update-baseline
//   node scripts/check-contrast.mjs --self-test   # проверить, что гейт краснеет
//
// Падает НА ПРИРОСТЕ к baseline (CLAUDE.md §13).

import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'scripts', 'check-contrast.baseline.json');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ВНЕШНИЙ = process.env.MTK_BASE_URL || null;
const ПОРТ_СТАТИКИ = 8200 + (process.pid % 500);
const BASE = ВНЕШНИЙ || `http://127.0.0.1:${ПОРТ_СТАТИКИ}`;
const ПРОФИЛЬ = (process.env.TMPDIR || '/tmp') + 'mtk29-contrast-' + process.pid;
const PORT = 9200 + (process.pid % 700);
const САМОПРОВЕРКА = process.argv.includes('--self-test');

// Те же сцены, что у тач-целей: раздел показывает не всё сразу.
const SCENES = [
  { имя: 'диаграмма Венна',   url: '/parties.html',        подготовка: null },
  { имя: 'список партий',     url: '/parties.html',        подготовка: 'список' },
  { имя: 'экран групп',       url: '/states.html',         подготовка: null },
  { имя: 'сетка территорий',  url: '/states.html',         подготовка: 'группа' },
  { имя: 'персоналии',        url: '/expo/people.html',    подготовка: null },
  { имя: 'хроника',           url: '/expo/chronicle.html', подготовка: null },
  { имя: 'главная',           url: '/expo/index.html',     подготовка: null },
  { имя: 'Симбирск',          url: '/simbirsk.html',       подготовка: null },
  { имя: 'Симбирск · оглавление', url: '/simbirsk.html',   подготовка: 'оглавление' },
];

// ── подготовка сцены и готовность страницы ──────────────────────────────
// Собираем текстовые узлы и ждём готовности: fonts.ready (иначе меряем фон
// под запасным шрифтом другой ширины) и, где есть карта, ненулевой transform
// у #container (до ResizeObserver карта врёт о размере, текст на ней съедет).
const СБОР = (подготовка, самопроверка) => `(async () => {
  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const подг = ${JSON.stringify(подготовка)};
  let подготовкаОтчёт = 'не требовалась';
  let корень = document;

  if (подг === 'список') {
    const b = [...document.querySelectorAll('button')].find(x => /Список|List/.test(x.textContent));
    if (b) { b.click(); подготовкаОтчёт = 'нажат «Список»'; await pause(900); }
    else подготовкаОтчёт = 'НЕ УДАЛАСЬ: кнопка «Список» не найдена';
  } else if (подг === 'группа') {
    const b = [...document.querySelectorAll('.group-btn')][0];
    if (b) { b.click(); подготовкаОтчёт = 'открыта группа'; await pause(1400); }
    else подготовкаОтчёт = 'НЕ УДАЛАСЬ: плитка группы не найдена';
  } else if (подг === 'оглавление') {
    const b = document.getElementById('toc-btn');
    if (b) {
      b.click(); await pause(900);
      const lv = document.querySelector('longread-view');
      const toc = lv && lv.shadowRoot && lv.shadowRoot.querySelector('.toc');
      if (toc && !toc.hasAttribute('hidden')) { корень = toc; подготовкаОтчёт = 'оглавление, сбор сужен до него'; }
      else подготовкаОтчёт = 'НЕ УДАЛАСЬ: оглавление не раскрылось';
    } else подготовкаОтчёт = 'НЕ УДАЛАСЬ: кнопка оглавления не найдена';
  }

  // fonts.ready — обязательно: ширина и раскладка текста зависят от шрифта.
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }

  // Готовность карт: ненулевой transform у #container. Не таймаут.
  const карты = [];
  (function walk(root){ for (const el of root.querySelectorAll('*')) {
    if (el.tagName === 'MAP-UNIT') карты.push(el);
    if (el.shadowRoot) walk(el.shadowRoot);
  }})(document);
  let картыОтчёт = карты.length ? 'ждём ' + карты.length : 'карт нет';
  if (карты.length) {
    const готова = (m) => { const c = m.shadowRoot && m.shadowRoot.getElementById('container');
      if (!c) return false; const t = getComputedStyle(c).transform;
      return !!t && t !== 'none' && !/matrix\\(1,\\s*0,\\s*0,\\s*1,\\s*0,\\s*0\\)/.test(t); };
    let ж = 0; while (ж < 6000 && !карты.every(готова)) { await pause(120); ж += 120; }
    картыОтчёт = карты.every(готова) ? ('карт ' + карты.length + ', готовы') : ('НЕ ГОТОВЫ карт ' + карты.filter(готова).length + '/' + карты.length);
  }

  ${самопроверка ? `
  // САМОПРОВЕРКА: подкладываем заведомо нечитаемый текст — светло-бежевый
  // на такой же светлой плашке. Инструмент ОБЯЗАН его покраснить; если нет —
  // он сэмплит не ту область, и его молчание ничего не значит (как проба
  // maps, «не поймавшая окно, печатает успех»).
  // Цвета записаны rgb(), а не #hex, намеренно: это тестовая пара для
  // проверки инструмента, не бренд-цвет, и brand:lint не должен считать её
  // приростом сырого hex в собственном гейте.
  {
    const проба = document.createElement('div');
    проба.id = '__contrast_probe__';
    проба.textContent = 'НЕЧИТАЕМО';
    проба.style.cssText = 'position:fixed;left:40px;top:40px;z-index:99999;'
      + 'background:rgb(242,234,214);color:rgb(239,231,214);font-size:24px;padding:8px 16px;font-family:sans-serif';
    document.body.appendChild(проба);
    await pause(60);
  }` : ''}

  // Собираем узлы с СОБСТВЕННЫМ текстом (иначе один текст посчитается
  // столько раз, сколько над ним обёрток). Дедуп в Node по стилю+хинту.
  function цветХекс(cs) { return cs.color; }
  function фонХинт(el) {
    // Грубая КАТЕГОРИЯ фона для дедупа — не значение (оно врёт), а «на чём
    // примерно лежит»: сплошной цвет, градиент, картинка. Нужна, чтобы два
    // узла одного стиля, но на разном фоне (светлая карточка / тёмная шапка),
    // не схлопнулись и худший не потерялся.
    let cur = el;
    while (cur) { const cs = getComputedStyle(cur);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return /gradient/.test(cs.backgroundImage) ? 'grad' : 'img';
      const m = (cs.backgroundColor || '').match(/[\\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) return 'c' + m.slice(0,3).join('-');
      cur = cur.parentElement || (cur.getRootNode() && cur.getRootNode().host) || null;
    }
    return 'none';
  }
  function крупный(cs) { const px = parseFloat(cs.fontSize) || 16;
    const ж = (parseInt(cs.fontWeight) || 400) >= 700; return px >= 24 || (px >= 18.66 && ж); }

  const узлы = [];
  (function walk(root, путь) {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) walk(el.shadowRoot, (путь ? путь + ' › ' : '') + el.tagName.toLowerCase());
      const свой = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!свой) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      if (b.right <= 0 || b.left >= innerWidth || b.bottom <= 0 || b.top >= innerHeight) continue;
      const цвет = разбор(cs.color);
      if (!цвет || цвет.a < 0.15) continue;
      узлы.push({
        текст: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 44),
        путь: путь || 'страница',
        цвет: cs.color, кегль: Math.round(parseFloat(cs.fontSize) || 16),
        крупный: крупный(cs), хинт: фонХинт(el),
        bbox: { x: b.left, y: b.top, w: b.width, h: b.height },
      });
    }
  })(корень, '');

  function разбор(c){ const m=String(c).match(/[\\d.]+/g); if(!m) return null;
    return { r:+m[0], g:+m[1], b:+m[2], a: m.length>3 ? +m[3] : 1 }; }

  return JSON.stringify({
    узлы, подготовка: подготовкаОтчёт, карты: картыОтчёт,
    режим: { css:[innerWidth,innerHeight], dpr:devicePixelRatio, шрифты:document.fonts?document.fonts.status:'?', видимость:document.visibilityState },
    адрес: location.href,
    страницаОшибки: /chrome-error/.test(location.protocol),
  });
})()`;

// ── WCAG ────────────────────────────────────────────────────────────────
function яркость(r, g, b) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function контраст(a, b) {
  const L1 = яркость(a.r, a.g, a.b), L2 = яркость(b.r, b.g, b.b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
function разборNode(c) { const m = String(c).match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2] } : null; }

// ── сэмпл фона из региона скриншота ─────────────────────────────────────
// Декодируем в canvas ВНУТРИ страницы (Node без библиотек PNG не разберёт).
// Два неверных подхода я отбросила на самопроверке и первом прогоне:
//   — «пиксели далёкие от текста = фон»: при НИЗКОМ контрасте фон близок
//     к тексту, отбрасывается как буква, фоновых пикселей не остаётся —
//     чем хуже контраст, тем вероятнее пропуск, ровно наоборот нужного;
//   — «мода всех пикселей = фон»: на КРУПНОМ тексте буквы занимают больше
//     половины региона и мода даёт цвет БУКВ, фон=текст, контраст ложно 1.
// Верно — бимодально: берём топ-3 частых цвета (это буквы и фон, оба
// массивные), фон = самый ДАЛЬНИЙ из них от цвета текста. Работает во всех
// трёх случаях: крупный текст (два кластера, дальний — фон), низкий контраст
// (кластеры близки, дальний всё равно фон), настоящий провал текст=фон
// (кластеры совпали, контраст честно ~1). Квантуем по /8, чтобы антиалиас
// не дробил бакеты; в выбранном усредняем реальные пиксели.
const СЭМПЛ = (b64, T) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}';
  await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const частоты = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] < 200) continue;                          // прозрачные края региона
    const k = (d[i] >> 3) + ',' + (d[i+1] >> 3) + ',' + (d[i+2] >> 3);
    let e = частоты.get(k); if (!e) частоты.set(k, e = { n: 0, r: 0, g: 0, b: 0 });
    e.n++; e.r += d[i]; e.g += d[i+1]; e.b += d[i+2];
  }
  if (!частоты.size) return null;
  const топ = [...частоты.values()].sort((a, b) => b.n - a.n).slice(0, 3)
    .map(e => ({ r: Math.round(e.r/e.n), g: Math.round(e.g/e.n), b: Math.round(e.b/e.n), n: e.n }));
  const t = ${JSON.stringify(T)};
  const дист = (p) => Math.abs(p.r-t.r) + Math.abs(p.g-t.g) + Math.abs(p.b-t.b);
  let фон = топ[0]; for (const p of топ) if (дист(p) > дист(фон)) фон = p;
  return JSON.stringify({ r: фон.r, g: фон.g, b: фон.b, доляФона: фон.n });
})()`;

async function cdp(ws, method, params = {}) {
  const id = cdp._id = (cdp._id || 0) + 1;
  return new Promise((res, rej) => {
    const on = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return;
      ws.removeEventListener('message', on); m.error ? rej(new Error(m.error.message)) : res(m.result); };
    ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method, params }));
  });
}

async function мерить(scene, ws) {
  const { result, exceptionDetails } = await cdp(ws, 'Runtime.evaluate', {
    expression: СБОР(scene.подготовка, САМОПРОВЕРКА), awaitPromise: true, returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  const данные = JSON.parse(result.value);
  if (данные.страницаОшибки || !String(данные.адрес).startsWith(BASE)) return { пусто: `страница не открылась: ${данные.адрес}` };
  if (/НЕ УДАЛАСЬ/.test(данные.подготовка)) return { пусто: данные.подготовка };
  if (/НЕ ГОТОВЫ/.test(данные.карты)) return { пусто: данные.карты };

  // Дедуп по стилю+хинту: годы всех карточек — один замер, фон однороден.
  const виды = new Map();
  for (const у of данные.узлы) {
    const k = `${у.цвет}|${у.кегль}|${у.хинт}`;
    if (!виды.has(k)) виды.set(k, у);
  }

  const дефекты = [];
  for (const у of виды.values()) {
    const t = разборNode(у.цвет); if (!t) continue;
    // Скриншот РЕГИОНА под текстом. Обрезаем на 15% с краёв, чтобы поменьше
    // ловить соседний фон и побольше — тот, что реально под буквами.
    const b = у.bbox;
    const clip = { x: b.x + b.w * 0.02, y: b.y + b.h * 0.08,
                   width: Math.max(2, b.w * 0.96), height: Math.max(2, b.h * 0.84), scale: 1 };
    let shot;
    try { shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png', clip }); }
    catch { continue; }
    const { result: r2 } = await cdp(ws, 'Runtime.evaluate', {
      expression: СЭМПЛ(shot.data, t), awaitPromise: true, returnByValue: true,
    });
    if (!r2.value) continue;
    const фон = JSON.parse(r2.value);
    const отн = контраст(t, фон);
    const порог = у.крупный ? 3 : 4.5;
    if (отн >= порог) continue;
    дефекты.push({
      сцена: scene.имя, текст: у.текст, путь: у.путь, кегль: у.кегль,
      отношение: Math.round(отн * 100) / 100, порог,
      цвет: `rgb(${t.r}, ${t.g}, ${t.b})`, фон: `rgb(${фон.r}, ${фон.g}, ${фон.b})`,
      ключ: `${scene.имя} | ${у.текст} | rgb(${t.r},${t.g},${t.b}) | к${у.кегль}`,
    });
  }
  return { дефекты, режим: данные.режим, узлов: данные.узлы.length, видов: виды.size, самопроба: данные.узлы.some(u=>/НЕЧИТАЕМО/.test(u.текст)) };
}

async function main() {
  const обновить = process.argv.includes('--update-baseline');

  let свой = null;
  const живой = async () => { try { return (await fetch(BASE + '/parties.html')).ok; } catch { return false; } };
  const поднять = () => { свой = spawn('python3', ['-m','http.server', String(ПОРТ_СТАТИКИ), '--bind','127.0.0.1','--directory', path.join(ROOT,'dist')], { stdio:'ignore' }); };
  const стоп = () => { if (свой) { try { свой.kill(); } catch {} свой = null; } };
  if (!await живой() && !ВНЕШНИЙ) { поднять(); for (let i=0;i<40;i++){ if (await живой()) break; await sleep(250); } }
  process.on('exit', стоп);

  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
    '--window-size=1920,1080', '--force-device-scale-factor=2', '--hide-scrollbars',
    '--no-first-run', '--user-data-dir=' + ПРОФИЛЬ], { stdio: 'ignore' });
  const убить = () => { try { chrome.kill(); } catch {} };
  process.on('exit', убить);
  process.on('exit', () => { try { rmSync(ПРОФИЛЬ, { recursive: true, force: true }); } catch {} });
  for (let i=0;i<80;i++){ try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }

  console.log('режим: Chrome --headless=new через Bash, окно 1920×1080 + --force-device-scale-factor=2,');
  console.log(`       собранный dist на ${BASE}, фон — сэмпл фактического пикселя, не разбор CSS.\n`);

  let база = [];
  try { база = JSON.parse(await readFile(BASELINE, 'utf8')).known || []; } catch {}
  const известно = new Map(база.map(b => [b.ключ, b.число ?? 1]));

  const всеДефекты = [];
  const пустые = [];
  let самопробаВидна = false, самопробаПоймана = false;

  for (const scene of SCENES) {
    // Каждой сцене — свежая вкладка, статику проверяем перед ней.
    if (!await живой() && !ВНЕШНИЙ) { стоп(); поднять(); for (let i=0;i<40;i++){ if (await живой()) break; await sleep(250); } }
    let tab, ws;
    try {
      tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + scene.url)}`, { method:'PUT' })).json();
      ws = new WebSocket(tab.webSocketDebuggerUrl);
      await new Promise((r,j)=>{ ws.onopen=r; ws.onerror=j; });
      await cdp(ws, 'Page.enable');
      await cdp(ws, 'Emulation.setDeviceMetricsOverride', { width:1920, height:1080, deviceScaleFactor:2, mobile:false });
      await sleep(САМОПРОВЕРКА ? 1500 : 3000);
      const r = await мерить(scene, ws);
      ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`).catch(()=>{});
      if (r.пусто) { пустые.push(`${scene.имя}: ${r.пусто}`); continue; }
      console.log(`  ${scene.имя.padEnd(22)} узлов ${String(r.узлов).padStart(3)}, видов ${String(r.видов).padStart(3)} · шрифты ${r.режим.шрифты} · дефектов ${r.дефекты.length}`);
      всеДефекты.push(...r.дефекты);
      if (САМОПРОВЕРКА) {
        if (r.самопроба) самопробаВидна = true;
        if (r.дефекты.some(d => /НЕЧИТАЕМО/.test(d.текст))) самопробаПоймана = true;
      }
    } catch (e) { пустые.push(`${scene.имя}: ${String(e).slice(0,120)}`); try { ws && ws.close(); } catch {} }
    if (САМОПРОВЕРКА) break; // самопроверке хватает одной сцены
  }
  убить(); стоп();

  if (САМОПРОВЕРКА) {
    console.log(`\n── самопроверка ──`);
    console.log(`   подложенная нечитаемая проба видна: ${самопробаВидна ? 'да' : 'НЕТ'}`);
    console.log(`   инструмент её поймал: ${самопробаПоймана ? 'да' : 'НЕТ'}`);
    if (!самопробаВидна) { console.error('\n✗ проба не отрисовалась — самопроверка бессмысленна'); process.exit(1); }
    if (!самопробаПоймана) { console.error('\n✗ инструмент НЕ покраснел на заведомо нечитаемом тексте — он сэмплит не ту область, молчание ничего не доказывает'); process.exit(1); }
    console.log('\n✓ инструмент краснеет на нечитаемом — сэмпл фона рабочий'); return;
  }

  const счёт = new Map();
  for (const f of всеДефекты) счёт.set(f.ключ, (счёт.get(f.ключ) || 0) + 1);

  if (обновить) {
    const known = [];
    for (const [k, n] of счёт) { const o = всеДефекты.find(f => f.ключ === k);
      known.push({ ключ: k, число: n, отношение: o.отношение, порог: o.порог, цвет: o.цвет, фон: o.фон, кегль: o.кегль }); }
    await writeFile(BASELINE, JSON.stringify({ note: 'Известные дефекты контраста (пиксельный замер). Падаем на приросте.', known }, null, 2) + '\n', 'utf8');
    console.log(`\n✓ baseline записан: ${known.length} видов, ${всеДефекты.length} мест`);
    return;
  }

  console.log(`\nпроверено сцен: ${SCENES.length - пустые.length}/${SCENES.length}`);
  if (пустые.length) {
    console.error(`\n✗ сцены без замера — не отрисовались или не готовы:`);
    for (const p of пустые) console.error(`    ${p}`);
    process.exit(1);
  }

  const новые = [];
  for (const [k, n] of счёт) {
    const было = известно.get(k) || 0;
    const свои = всеДефекты.filter(f => f.ключ === k);
    if (n > было) новые.push(...свои.slice(0, n - было));
  }
  if (новые.length) {
    console.error(`\n✗ новые дефекты контраста — ${новые.length}:`);
    for (const f of новые) {
      console.error(`   ${f.сцена} · «${f.текст}»`);
      console.error(`      контраст ${f.отношение} при норме ${f.порог} · кегль ${f.кегль}px · ${f.цвет} на ${f.фон} · ${f.путь}`);
    }
    console.error('\n  Если законно — зафиксируй: node scripts/check-contrast.mjs --update-baseline');
    process.exit(1);
  }
  console.log(`\n✓ новых дефектов контраста нет (в базе ${база.length} известных)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
