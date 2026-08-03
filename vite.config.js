// vite config — статический SPA на Vanilla JS + Web Components.
// content/, expo/, decor/ лежат в public/ и автоматически копируются в dist/.
// Добавляем все HTML-страницы как roll-up inputs.

import { defineConfig } from 'vite';

// Vite вешает crossorigin на каждый свой <link rel=stylesheet> и <script type=module>.
// Под file:// этот атрибут включает проверку CORS для непрозрачного origin, и стиль
// МОЛЧА не применяется — киоск открывается вообще без оформления, без ошибки
// в консоли. По http всё в порядке, поэтому на stage дефект не виден.
// Проверено в настоящем Chrome, file://, две одинаковые страницы:
//   <link rel=stylesheet href>              → rgb(1, 2, 3)     применился
//   <link rel=stylesheet crossorigin href>  → rgba(0, 0, 0, 0) НЕТ
// Отключаемой опции у vite нет — снимаем атрибут после сборки html.
// Безопасно: внешних ресурсов в киоске нет вовсе (CLAUDE.md §1).
const stripCrossorigin = {
  name: 'mtk-strip-crossorigin',
  enforce: 'post',
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(?=[\s>])/g, '');
  },
};

export default defineConfig({
  root: '.',
  plugins: [stripCrossorigin],
  // Относительные пути к ассетам. По умолчанию vite подставляет абсолютные
  // `/assets/…`, а киоск запускается как file:///opt/mtk29/dist/… — там
  // `/assets/…` резолвится в file:///assets/… и не находится (CLAUDE.md §1).
  // Ломались все собранные страницы разом, кроме тех, что лежат в public/.
  base: './',
  server: {
    host: '127.0.0.1',
    // Порт берётся из PORT, иначе 5173. Зон шесть, у каждой свой worktree,
    // и жёстко прибитый порт означал, что второй запущенный dev-сервер молча
    // уезжает на 5174 — а всё, что ждёт его на заданном порту, упирается
    // в ERR_CONNECTION_REFUSED.
    port: Number(process.env.PORT) || 5173,
    fs: { allow: ['.'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    target: 'es2022', // top-level await используется в page-scripts
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main:     'index.html',       // redirect → /expo/
        demo:     'demo.html',        // demo <map-unit>
        povolzhye: 'demo-povolzhye.html', // Поволжье 1918–1919 (зона maps)
        parties:  'parties.html',     // Раздел 2 · Партии (Венн + Список)
        states:   'states.html',      // Раздел 3 · Гос-образования (Группы + Сетка)
        brand:    'brand.html',       // Каталог визуальных примитивов (бренд-система)
        // calendar: 'calendar.html' — СНЯТ СО СБОРКИ 2026-08-03, файл на месте.
        // R&D-стенд: перекидной календарь 1917—1924 живым DOM в 3D. В ТЗ его нет,
        // посетитель его не увидит, и он заморожен (§4). При этом он держал
        // paths:check красным одной строкой `/expo/pin-gate.js` — а постоянно
        // красный гейт учит его пропускать. Вернуть в сборку = раскомментировать
        // строку и починить абсолютный путь. Учёт — в §4 «Заморожено».
        simbirsk: 'simbirsk.html',    // Раздел 5 · Лонгрид «Симбирскъ 1918–1919»
        project:  'project.html',     // Лендинг ресурсов проекта 29/30 (карта 1914, фирстиль)
      },
    },
  },
  publicDir: 'public',
});
