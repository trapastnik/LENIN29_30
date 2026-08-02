// vite config — статический SPA на Vanilla JS + Web Components.
// content/, expo/, decor/ лежат в public/ и автоматически копируются в dist/.
// Добавляем все HTML-страницы как roll-up inputs.

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
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
        sections: 'sections.html',    // Старый каталог 4 разделов
        brand:    'brand.html',       // Каталог визуальных примитивов (бренд-система)
        calendar: 'calendar.html',    // R&D · live-DOM на 3D — перекидной календарь 1917—1924
        project:  'project.html',     // Лендинг ресурсов проекта 29/30 (карта 1914, фирстиль)
      },
    },
  },
  publicDir: 'public',
});
