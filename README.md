# МТК 29 — «Россия в Гражданской войне»

Интерактивная экспозиция на сенсорный 4K-киоск для Государственного музея В.И. Ленина. Является частью парного проекта МТК 29/30 — интерактив + 8-минутный ролик.

**Статус:** ранний прототип. Рабочая карта Восточного фронта 1918-1919 (Комуч), раздел партий с Венн-диаграммой, раздел государственных образований с drill-down в группы по ТЗ, импортированная кинематографичная главная сцена со столом коменданта / картой фронтов / потоком документов.

## Быстрый старт

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # → dist/
npm run preview      # http://127.0.0.1:4173 — раздача dist/
```

Документация:
- [docs/architecture.md](docs/architecture.md) — стек, структура, принципы
- [docs/content.md](docs/content.md) — как устроен контент-каталог
- [docs/maps-pipeline.md](docs/maps-pipeline.md) — pipeline производства карт (map_v6 → наш batch)
- [docs/deploy.md](docs/deploy.md) — деплой на сервер киоска

## Структура

```
mtk29/
├── index.html                  # / → redirect на /expo/
├── parties.html                # Раздел 2 · Политические партии (Венн/Список)
├── states.html                 # Раздел 3 · Государственные образования (Группы/Сетка)
├── sections.html               # Каталог 4 разделов (старый «лендинг»)
├── demo.html                   # Изолированный стенд <map-unit>
│
├── public/                     # копируется в dist/ как есть
│   ├── expo/                   # импорт Claude Design pass-2 — сцена A/B/C + TopBar + Vernier
│   │   ├── index.html          # React + Babel in-browser: DirectionA/B/C
│   │   ├── people.html         # Раздел 4 · Персоналіи
│   │   ├── shared.jsx          # TopBar, Vernier, DecorFrame, Stamp, QuoteCard
│   │   ├── direction-a.jsx     # Стол коменданта
│   │   ├── direction-b.jsx     # Карта фронтов
│   │   ├── direction-c.jsx     # Поток документов
│   │   ├── data.js             # 1918-1922 события
│   │   ├── people-data.js      # Биографии персон
│   │   ├── assets/, uploads/
│   ├── content/                # каталог контента (JSON + медиа)
│   │   ├── maps/komuch/        # живая карта — layers.svg + background.jpg + thumb
│   │   ├── maps/<14 остальных>/ — stub map.json
│   │   ├── parties/            # партии: карточки + _index.json + venn-bg.png
│   │   ├── states/             # гос-образования: карточки + _index.json
│   │   └── newsreels/, photos/ — плейсхолдеры под будущий контент
│   └── decor/, fonts/
│
├── src/                        # клиентский SPA (vanilla ESM + Web Components)
│   ├── components/
│   │   ├── map-unit.js         # потомок map_v6/viewer.html — pan/zoom/wipe/fade
│   │   ├── party-card.js       # карточка партии
│   │   ├── state-card.js       # карточка гос-образования + встроенный <map-unit>
│   │   ├── venn-selector.js    # Венн-диаграмма на PNG-фоне
│   │   └── camp-filter.js      # горизонтальный фильтр по лагерям
│   ├── pages/
│   │   └── collection-page.js  # общий рендерер сеток (parties/states)
│   ├── data/
│   │   └── loader.js           # fetch + in-memory LRU
│   ├── utils/                  # pan-zoom, clip-wipe, fade, svg-loader
│   └── styles/                 # tokens.css, base.css, pages.css
│
├── scripts/
│   ├── trace_venn_blobs.py     # cv2 → SVG path трейсинг blob'ов (для Венна)
│   ├── export_venn_svg.mjs     # экспорт Венна в SVG для Figma
│   └── trace_venn_debug.py     # дамп HSV-масок для отладки
│
└── vite.config.js
```

## Ключевые решения

- **Рантайм:** vanilla ES-modules + Custom Elements (Web Components) для наших разделов + React+Babel-in-browser для импортированного design pass.
- **Карты:** каждая карта — многослойный SVG (6 слоёв: фон, границы, стрелки красных, стрелки розовых, фронты синие/зелёные, реки). Компонент `<map-unit>` умеет toggle слоёв с анимациями (fade / wipe via clip-path), pan+zoom+pinch.
- **Контент:** JSON + медиа в `public/content/`. Индексы (`_index.json`) — списки с связями; отдельные файлы на каждую сущность.
- **SPA-навигация:** главный `/expo/` держит iframe-оверлеи для Партий/Гос-образований/Персоналий. Первый клик — загрузка, дальше мгновенно. Back-link внутри iframe шлёт `postMessage('mtk29:close-section')` → закрывает overlay без перезагрузки.
- **Расширяемые схемы:** required-поля минимальны (`id`, `kind`); неизвестные поля не ломают валидацию.
- **Язык:** RU сейчас; поля с суффиксом `_ru/_en` заложены под будущее двуязычие.

## Развитие: архитектурный план

Полный план — у меня в `[…]/velvet-tinkering-chipmunk.md` (утверждён, 6 фаз, Claude Design проходы перед каждой фазой). Ссылка на него в корне репо при необходимости.

## Ссылки

- Репо: https://github.com/trapastnik/LENIN29_30
- Сервер: http://212.113.117.186:8091/ (nginx на ostrov)
