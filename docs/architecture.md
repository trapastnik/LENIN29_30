# Архитектура

## Сеть компонентов

```
                        ┌──────────────────────────────┐
                        │  /expo/ (React + Babel inline) │
                        │  TopBar · Vernier · Stage     │
                        │                               │
                        │   DirectionA (Стол)           │
                        │   DirectionB (Фронты)         │
                        │   DirectionC (Документы)      │
                        │                               │
                        │   TopBar → onOpenSection('id')│
                        │             │                 │
                        └──────────────┼─────────────────┘
                                       ▼
                        ┌──────────────────────────────┐
                        │  Iframe-оверлей (z-index:200)  │
                        │  display: block/none           │
                        │                               │
                        │   /parties.html               │
                        │   /states.html                │
                        │   /expo/people.html           │
                        │                               │
                        │   back-link → postMessage     │
                        │   'mtk29:close-section'       │
                        └──────────────────────────────┘
                                       ▲ window.parent
                        ┌──────────────────────────────┐
                        │  /parties.html                │
                        │  Vanilla + Web Components     │
                        │                               │
                        │  <camp-filter>                │
                        │  <venn-selector>              │ ← PNG-фон + Figma-координаты
                        │  <party-card>                 │
                        │                               │
                        │  [Диаграмма | Список]         │
                        └──────────────────────────────┘

                        ┌──────────────────────────────┐
                        │  /states.html                 │
                        │                               │
                        │  Группы (drill-down по ТЗ)    │
                        │   ↓ клик                      │
                        │  Список образований           │
                        │   ↓ клик                      │
                        │  <state-card>                 │
                        │    ├─ флаг, даты, summary     │
                        │    └─ <map-unit>              │ ← живая карта
                        └──────────────────────────────┘
```

## Уровни взаимодействия

| Уровень | Технология | Зачем |
|---|---|---|
| Экспозиция /expo/ | React + in-browser Babel | Импорт design pass-2, быстрая итерация дизайна |
| Наши разделы | Vanilla JS + Web Components | Минимальный бандл, оффлайн, переиспользуемые компоненты |
| Слои карты | SVG + CSS-анимации | Прямое наследие `map_v6/viewer.html` |
| Контент | JSON + медиа | Редактируется руками, коммитится |

## Почему гибрид (React + Vanilla)

План v2 (§1) настаивал на «только Vanilla». Когда пришёл design pass как работающий React-бандл с 6 крупными React-файлами (~4000 строк) — проще интегрировать его как есть через iframe-оверлей, чем переписывать. Vanilla наши собственные разделы; React — импортированная сцена «стол коменданта». Они соединены через iframe + postMessage, не разделяют state напрямую.

Долгосрочно: вынести элементы из expo (TopBar, Vernier) в Web Components, когда финализируется дизайн — перепишем.

## Схемы данных

### Партия (`public/content/parties/<id>.json`)
```json
{
  "id": "bolsheviks",
  "kind": "party",
  "title_ru": "Большевики · РКП(б)",
  "camp": "red",
  "dates": { "from": "1912", "to": "1925" },
  "summary_ru": "…≤ 3000 знаков, markdown…",
  "leaders_ru": ["Ленин В.И.", …],
  "related": { "persons": […], "states": […] }
}
```

### Гос-образование (`public/content/states/<id>.json`)
```json
{
  "id": "komuch",
  "kind": "state",
  "title_ru": "Комитет членов Учредительного собрания",
  "abbr_ru": "Комуч",
  "camp": "rev-dem",
  "dates": { "from": "1918-06-08", "to": "1918-11-23" },
  "map_id": "komuch",                // ссылка на content/maps/<id>/
  "initial_layers": ["background", "borders_dark", "arrows_red", "front_blue", "rivers_cyan"],
  "summary_ru": "…"
}
```

### Карта (`public/content/maps/<id>/map.json`)
```json
{
  "id": "komuch",
  "title_ru": "Комуч, лето 1918",
  "viewBox": "0 0 1500 1000",
  "layers": [
    { "id": "background",   "label_ru": "Фон (растр)",           "default": true, "kind": "raster" },
    { "id": "borders_dark", "label_ru": "Границы, ж/д",          "default": true, "kind": "vector" },
    { "id": "arrows_red",   "label_ru": "Красные стрелки (РККА)", "default": true, "kind": "vector", "anim": "wipe" },
    { "id": "arrows_pink",  "label_ru": "Розовые стрелки",        "default": false, "kind": "vector", "anim": "wipe" },
    { "id": "front_blue",   "label_ru": "Синие линии фронта",     "default": true, "kind": "vector", "anim": "fade" },
    { "id": "front_green",  "label_ru": "Зелёные линии",          "default": true, "kind": "vector", "anim": "fade" },
    { "id": "rivers_cyan",  "label_ru": "Реки",                   "default": true, "kind": "vector" }
  ],
  "svg": "layers.svg",
  "background_raster": "background.jpg"
}
```

### Индексы (`_index.json`)
Списки сущностей для быстрой отрисовки сетки. Содержат camps (лагеря), items (минимум полей для плитки), дополнительные поля для режимов отображения (напр. `venn_headers`, `venn_background` для парсей).

## Компонент `<map-unit>`

Переиспользуемый просмотровщик карты. Наследован от [map_v6/viewer.html](../../map_v6/viewer.html) — pan/zoom/pinch, фильтр слоёв через чекбоксы, анимации fade (для линий фронта) и clip-path wipe (для стрелок).

API через атрибуты:
- `map-id="komuch"` — грузит `/content/maps/komuch/map.json` + `layers.svg`
- `initial-layers="background,borders_dark,arrows_red"` — какие включены на старте
- `show-panel="true|false"` — панель слоёв (по умолчанию для state-card отключена)

Главное отличие от `viewer.html`: растровый фон вынесен из base64 в `background.jpg` как отдельный `<image href="...">` внутри SVG. Это даёт экономию ~2 МБ на карту и масштабируется на 15 карт.

## Стили

`src/styles/tokens.css` — CSS-переменные: цвета лагерей (`--camp-red`, `--camp-white` и т.д.), палитра бумаги/чернил, шрифты. Значения — **плейсхолдеры**, финализируются после Claude Design pass #6.

`src/styles/base.css` — reset + touch-baseline (`touch-action: manipulation`). Проект — физический тач-киоск: `:hover` **не используется ни в CSS, ни в JS** (нет `onMouseEnter/Leave` etc.). Интерактивная обратная связь — через `.active` классы и `:active` псевдокласс.

`src/styles/pages.css` — общие стили страниц: header (sticky, `position: sticky; top: 0`), grid, modal. Класс `body.scrollable` включает прокрутку через html (`html:has(body.scrollable) { overflow: auto }`); сама body остаётся `overflow: visible`, чтобы sticky-header работал корректно. Фон-мотив рендерится как `body::before` с `position: fixed` — полосы заполняют viewport при любом scroll.

## Связь с МТК 30

Заложено, но ещё не реализовано (см. план, §6 «Мост»). Идея: каждая карта получает `sequence.json` со сценарием анимации (включение слоёв по таймингу, зум камеры, overlay-титры). Sequence можно:
- играть в UI в реальном времени (`<map-unit>.playSequence(seq)`)
- записать в WebM через `MediaRecorder`
- отрендерить headless-Chromium + ffmpeg в ProRes .mov для монтажа ролика

Один источник правды — `sequence.json` — используется и в киоске, и в производственном ролике.
