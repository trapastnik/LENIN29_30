// vite config — статический SPA на Vanilla JS + Web Components.
// content/, expo/, decor/ лежат в public/ и автоматически копируются в dist/.
// Добавляем все HTML-страницы как roll-up inputs.

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: '127.0.0.1',
    port: 5173,
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
        parties:  'parties.html',     // Раздел 2 · Партии (Венн + Список)
        states:   'states.html',      // Раздел 3 · Гос-образования (Группы + Сетка)
        sections: 'sections.html',    // Старый каталог 4 разделов
        brand:    'brand.html',       // Каталог визуальных примитивов (бренд-система)
        calendar: 'calendar.html',    // R&D · live-DOM на 3D — перекидной календарь 1917—1924
      },
    },
  },
  publicDir: 'public',
});
