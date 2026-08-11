#!/usr/bin/env node
// Глубокие ссылки: проверяем, что карточка ОТРИСОВАНА, а не что хэш прочитан.
//
// ЗАЧЕМ ИМЕННО ТАК. Мой первый замер смотрел на класс модалки и атрибут
// `party-id` — и был зелёным. Оркестратор проверил содержимое и увидел ноль
// `rt-ref`, то есть пустую карточку. Проверка выглядела исчерпывающей и ею
// не была: «модалка открылась» и «посетитель видит справку» — разные факты,
// и второй виден только по содержимому.
//
// Поэтому здесь три уровня, и красным становится любой:
//   1. модалка раскрыта;
//   2. карточка апгрейднута как кастомный элемент (иначе атрибуты стоят,
//      а connectedCallback не сработал и содержимое не грузилось);
//   3. в её shadow root есть текст справки — абзацы и `rt-ref`.
//
// Плюс отрицательный случай: битый id обязан дать видимую плашку, а не
// молчание. Молчаливая ссылка — та же мёртвая кнопка, только без кнопки.
//
// Режим — канон §5: Chrome --headless=new через Bash, окно 1920×1080 плюс
// --force-device-scale-factor=2, собранный dist. Своя статика на своём порту:
// полагаться на чужую нельзя, она умирает посреди прогона.
//
//   node scripts/check-deep-links.mjs

import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ПОРТ_СТАТИКИ = 8700 + (process.pid % 400);
const BASE = process.env.MTK_BASE_URL || `http://127.0.0.1:${ПОРТ_СТАТИКИ}`;
const ПРОФИЛЬ = (process.env.TMPDIR || '/tmp') + 'mtk29-deeplinks-' + process.pid;
const PORT = 9600 + (process.pid % 300);

const СТРАНИЦЫ = [
  { url: '/parties.html', индекс: 'parties/_index.json' },
  { url: '/states.html',  индекс: 'states/_index.json' },
];

const ПРОБА = `(() => {
  // Модалок в документе может быть НЕ ОДНА: states.html держит свою
  // (#state-modal), а CollectionPage вставляет ещё одну со своим id внутрь
  // скрытой сетки. Берём ту, где реально лежит карточка, — иначе меряем
  // не тот узел. Это тот же двойной id, что чинится в самой странице,
  // но проверка обязана быть устойчивой к нему независимо.
  const модалки = [...document.querySelectorAll('.modal')];
  const modal = модалки.find((m) => m.querySelector('party-card, state-card')) || модалки[0] || null;
  // ВНИМАНИЕ: видимость — по ФАКТИЧЕСКОМУ display, а не по классу.
  // На states.html модалка несёт класс hidden и при этом показана:
  // правило .hidden с display none important там проигрывает более
  // специфичному правилу на id. Проверяя класс, я объявил рабочую ссылку
  // сломанной и убрал её из раздела — та же ошибка, что до этого
  // с «модалка открылась» вместо «карточка отрисована», только уровнем
  // ниже. Класс говорит о намерении, computed — о том, что видит посетитель.
  const видна = !!modal && getComputedStyle(modal).display !== 'none';
  const карточка = modal && modal.querySelector('party-card, state-card');
  const sr = карточка && карточка.shadowRoot;
  const плашка = document.getElementById('deep-link-missing');
  return JSON.stringify({
    хэш: location.hash || '',
    открыта: видна,
    классМодалки: modal ? modal.className : null,
    id: карточка ? (карточка.getAttribute('party-id') || карточка.getAttribute('state-id')) : null,
    апгрейд: карточка ? !/^HTML(Unknown)?Element$/.test(карточка.constructor.name) : false,
    абзацев: sr ? sr.querySelectorAll('p').length : 0,
    rtRef: sr ? sr.querySelectorAll('.rt-ref').length : 0,
    плашка: плашка ? плашка.textContent.trim().slice(0, 40) : null,
    поверхЦентра: (() => {
      const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return e ? String(e.id || e.className || e.tagName).slice(0, 40) : null;
    })(),
  });
})()`;

async function cdp(ws, method, params = {}) {
  const id = cdp._id = (cdp._id || 0) + 1;
  return new Promise((res, rej) => {
    const on = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return;
      ws.removeEventListener('message', on); m.error ? rej(new Error(m.error.message)) : res(m.result); };
    ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method, params }));
  });
}

async function открыть(url) {
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
  // Ждём содержимое, а не «сколько-то секунд»: карточка грузит справку
  // отдельным запросом, и фиксированная пауза отвечает «прошло столько-то»,
  // а не «карточка готова».
  let сост = null, ждали = 0;
  while (ждали < 6000) {
    await sleep(200); ждали += 200;
    сост = JSON.parse((await cdp(ws, 'Runtime.evaluate', { expression: ПРОБА, returnByValue: true })).result.value);
    if (сост.rtRef > 0 || сост.плашка) break;
  }
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`).catch(() => {});
  return { ...сост, ждали };
}

async function main() {
  let свой = null;
  const живой = async () => { try { return (await fetch(BASE + '/parties.html')).ok; } catch { return false; } };
  if (!await живой()) {
    свой = spawn('python3', ['-m', 'http.server', String(ПОРТ_СТАТИКИ), '--bind', '127.0.0.1',
      '--directory', path.join(ROOT, 'dist')], { stdio: 'ignore' });
    for (let i = 0; i < 40; i++) { if (await живой()) break; await sleep(250); }
  }
  const стоп = () => { if (свой) { try { свой.kill(); } catch {} свой = null; } };
  process.on('exit', стоп);

  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
    '--window-size=1920,1080', '--force-device-scale-factor=2', '--no-first-run',
    '--user-data-dir=' + ПРОФИЛЬ], { stdio: 'ignore' });
  const убить = () => { try { chrome.kill(); } catch {} };
  process.on('exit', убить);
  process.on('exit', () => { try { rmSync(ПРОФИЛЬ, { recursive: true, force: true }); } catch {} });
  for (let i = 0; i < 80; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }

  console.log('режим: Chrome --headless=new через Bash, окно 1920×1080 + --force-device-scale-factor=2,');
  console.log(`       собранный dist на ${BASE}, ожидание по содержимому, не по таймауту.\n`);

  const беды = [];
  let проверено = 0;

  for (const стр of СТРАНИЦЫ) {
    const idx = JSON.parse(await readFile(path.join(ROOT, 'public', 'content', стр.индекс), 'utf8'));
    const items = (idx.items || []).filter((i) => i && i.id && !i._is_general);
    if (!items.length) { беды.push(`${стр.индекс}: в индексе нет записей — проверять нечего`); continue; }

    // Живой id: первый попавшийся, а не зашитый — иначе проверка сломается
    // от переименования одной записи и будет краснеть не по делу.
    const id = items[0].id;
    const ок = await открыть(`${стр.url}#card=${id}`);
    проверено++;
    console.log(`  ${стр.url}#card=${id}`);
    console.log(`     модалка ${ок.открыта ? 'раскрыта' : 'ЗАКРЫТА'} · апгрейд ${ок.апгрейд ? 'да' : 'НЕТ'}`
      + ` · абзацев ${ок.абзацев} · rt-ref ${ок.rtRef} · за ${ок.ждали} мс`);
    console.log(`     хэш после чтения: «${ок.хэш || 'пусто'}» · поверх центра: ${ок.поверхЦентра}`);
    if (!ок.открыта) беды.push(`${стр.url}#card=${id}: модалка не раскрылась`);
    else if (!ок.апгрейд) беды.push(`${стр.url}#card=${id}: карточка не апгрейднута — атрибуты стоят, содержимое не грузилось`);
    else if (!ок.абзацев) беды.push(`${стр.url}#card=${id}: карточка ПУСТА — открылась, но справки в ней нет`);
    if (ок.хэш) беды.push(`${стр.url}: хэш не стёрт после чтения («${ок.хэш}») — перезагрузка откроет ту же справку следующему посетителю`);

    // Отрицательный случай: битый id обязан дать видимую плашку.
    const нет = await открыть(`${стр.url}#card=zzz-net-takoy-spravki`);
    проверено++;
    console.log(`  ${стр.url}#card=zzz-net-takoy-spravki`);
    console.log(`     плашка: ${нет.плашка ? '«' + нет.плашка + '»' : 'НЕТ'} · модалка ${нет.открыта ? 'раскрыта (не должна)' : 'закрыта'}`);
    if (!нет.плашка) беды.push(`${стр.url}: битый id не даёт плашки — молчаливая ссылка неотличима от мёртвой кнопки`);
    if (нет.открыта) беды.push(`${стр.url}: битый id раскрыл модалку`);
  }

  убить(); стоп();

  console.log(`\nпроверено адресов: ${проверено}/${СТРАНИЦЫ.length * 2}`);
  if (беды.length) {
    console.error(`\n✗ глубокие ссылки не работают:`);
    for (const b of беды) console.error(`    ${b}`);
    process.exit(1);
  }
  console.log('\n✓ карточка по прямому адресу отрисовывается, битый адрес виден, хэш стирается');
}

main().catch((e) => { console.error(e); process.exit(1); });
