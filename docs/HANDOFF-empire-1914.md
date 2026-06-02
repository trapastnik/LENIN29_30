# Empire-1914 viewer — handoff в новый чат

## Контекст проекта

- Проект: **МТК 29 — Россия в Гражданской войне** (интерактивная инсталляция для Музея Ленина).
- Прототип `empire-1914` — это **просмотровщик/калибровщик SVG-карт**: смотрим многослойную векторную карту Российской империи 1914 г. как подложку, накладываем сверху картографические артефакты по периоду 1918–1922 (фронты, стрелки, границы) и подгоняем их к подложке с помощью контрольных точек.
- Прототип НЕ финальное место для контента — это **инструмент препроцессинга**: для МТК 29 итоговые карты собираются в `public/content/maps/<имя>/layers.svg` после калибровки.

## Где код

- **Репо**: GitHub `trapastnik/LENIN29_30`
- **Рабочая директория**: `/Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29/`
- **Файл просмотровщика**: `public/prototypes/empire-1914/index.html` — один большой self-contained файл (~2500+ строк), весь функционал inline (style + script).
- **Ветка**: `feature/swappable-background` (отделена от `main`)
- **Стэйдж/прод**: на `main` после merge — пока туда ничего из этой работы не уходило.

## Текущее состояние ветки

Последний коммит ветки `feature/swappable-background`:
- **`644ddee mv: HANDOFF.md из public/ в docs/`** (1 июня 2026)
- Перед этим: `ba67176 калибровка по точкам (affine + TPS) + автомэтч + city-tagger`
- Базовый: `554df2d viewer v3: сменная подложка + per-layer custom + перекраска map_v6 + поиск`

На `main`:
- **`3949639 nginx: закрыть .git и служебные файлы`** (1 июня 2026, выкачено)
- **`9963e2f pin-gate отключён: API сохранён как no-op`** (1 июня 2026, выкачено)

Feature-ветка НЕ смерджена в main и не задеплоена. Прод (http://212.113.117.186:8091/) живёт на main с PIN-gate отключённым и закрытыми служебными файлами.

## Что закоммичено в `554df2d`

- Сменная подложка (можно подгрузить любую SVG как фон)
- Per-layer toggle для слоёв подложки (категоризация Гидрография / Адм. ед. / Границы / Транспорт / Подписи)
- Овералей-группы (map_v6 + custom через file-pick + drag-drop)
- Per-layer toggle внутри пользовательских overlay'ев
- Перекраска чёрных потрейс-выходов map_v6 в swatch-цвета
- Поиск по подписям подложки (категоризованный, с pulse-маркером + рамкой)
- `localStorage` под ключом `map-viewer-state-v3`

## Что ДОБАВЛЕНО локально (нужно закоммитить перед редактором)

### 1. Калибровка по контрольным точкам
- `mode: 'simple' | 'points'` в `group.calib`
- Affine LSQ (3+ точек, exact с 3, RMSE на 4+)
- Solve3x3 + общий solveLinearSystem (Gaussian elim)
- Toggle «Простая / По точкам» в калибр-панели
- Точки рендерятся как оранжевые кружки (overlay) + синие рамки (bg) + пунктир-связка
- Drag/wheel в points-mode работают на матрице

### 2. Захват точек вручную
- «+ Точка вручную» → банер «клик на overlay» → клик → банер «клик на background» → клик → пара добавлена
- Esc отменяет

### 3. Авто-сопоставление по именам
- «⚡ Авто по именам»
- Fuzzy-match (Levenshtein ≤ 20% длины имени)
- RANSAC (800 итераций, threshold 2.5% bg width)
- Метка `⚡` в списке точек, RMSE в summary

### 4. Snap-to-marker (категориально)
- `isMarkerLayerId()` — детектит `_Mark`, `city_dots`, `-dots`, и т. п.
- `deriveMarkerLayerId()` — для text-слоя возвращает соответствующий marker-слой:
  - `*._Text → *._Mark` (1914)
  - `labels_cities → city_dots` (povolzhye-style, underscore)
  - `labels-cities → city-dots` (vectorized-style, hyphen)
- `normId()` нормализует hyphen ↔ underscore для cross-style сравнений
- Snap из **anchor подписи** (`ctm.e, ctm.f` — точка transform), радиус `h × 1.5`
- На bg-стороне фильтр строгий (только snapped — отсекает реки)
- На overlay-стороне фильтр мягкий (по имени слоя — отсекаются `river|sea|army`)

### 5. TPS warp (Thin-Plate Spline)
- `fitTPS(points)` — линейная система (N+3)×(N+3), решается general Gauss
- `evalTPS(tps, u, v)` — оценка warp-функции в точке
- `bakeTPS(g)` — «запекает» warp в координаты:
  - Дедупликация overlay-точек (одинаковые ox/oy → singular K)
  - Walk все leaf-shapes (path/text/circle/rect/line/polyline/polygon)
  - Для path: getPointAtLength sampling → polyline
  - Для text: warp anchor (e, f), сохранить scale/rotate
  - Для остальных: warp x, y или corner координаты
  - Strip все `transform` атрибуты, group transform → identity
- `undoTPS(g)` — восстанавливает customSvg из бэкапа, refit affine
- Кнопка «🌀 TPS warp» / «↩ Откатить TPS» в калибр-панели

### 6. 🏙 City-tagger (ручной разметчик городов)
- Кнопка «🏙 Отметить город» в points-mode панели
- Клик на overlay → popup рядом с курсором с input + autocomplete suggestions
- Suggestions = entries из `searchIndex` с категорией `Столица | Ген.-губерн. | Губерния | Город`
- ↑/↓ навигация, Enter — выбрать, Esc — отмена
- При выборе: создаётся control-point с overlay-coords (точный клик) + bg-coords (snap'нутый dot или bbox-центр подписи)
- Метка `🏙` в списке точек
- Sequential mode: после Enter сразу начинается следующий тэг

### 7. Hide-able base-группы
- × на любом target-чипе (включая map_v6, не только custom)
- `hideBaseGroup(id)` — скрывает (persistent через `g.hidden`)
- `unhideBaseGroup(id)` — возвращает + перемонтирует enabled overlays
- Кнопка «↻ map_v6» появляется под file-pick если есть скрытые

### 8. UX-фиксы
- Длинные имена custom-групп обрезаются ellipsis (max-width 180px на label)
- × всегда виден на чипе
- Esc cancels capture mode AND closes city-tag popup
- Persistence: state-v3, реset на reload — точки/matrix/fit/mode переходят к default (simple), сохраняются только tx/ty/scale/opacity/strokeMul

## Что НЕ закоммичено (всё выше + старые остатки)

Файл `index.html` сейчас содержит **strokeMul** в calibDefault и в `applyStrokeMultiplier` — этот код добавлен в какой-то более ранней сессии (per-layer stroke multiplier), сейчас функционал не критичен, но в коммит должен попасть.

## Тестирование

### Локальный dev-server
```bash
cd /Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29 && npm run dev
# или через Claude Preview tool (preview_start name="mtk29")
```

URL: `http://127.0.0.1:5173/prototypes/empire-1914/index.html`

### Сброс состояния
В консоли браузера:
```js
localStorage.removeItem('map-viewer-state-v3'); location.reload();
```

### Тест-файлы
- `public/content/maps/povolzhye-1918-1919/layers.svg` — рабочая povolzhye-карта (underscore-стиль)
- `/Users/dvn/Downloads/vectorized_019e5f74-*.layered.svg` — vectorized-стиль (hyphen-имена, генерируется в соседнем чате)

### Калибровка-флоу для проверки
1. Подгрузить overlay (file-pick или drag-drop)
2. Выключить декоративные слои overlay'а (`title`, `legend`, `frame_decor`, `map_frame`, `background_paper`)
3. Кликнуть на target-чип группы → войти в edit-режим
4. Переключиться на «По точкам»
5. Либо «⚡ Авто», либо «🏙 Отметить город» (вручную точнее)
6. Когда 5–7+ точек → «🌀 TPS warp»

## Архитектурные конвенции

### SVG-структура viewer'а
```
<svg id="rootSvg" viewBox="0 0 W H">
  <g id="bg-content">
    ...содержимое подложки...
  </g>
  <g id="overlay-root">
    <g data-group="map_v6" transform="matrix(...) или identity после TPS">
      <g data-overlay="borders_dark">...</g>
      <g data-overlay="front_blue">...</g>
      ...
    </g>
    <g data-group="custom-N" transform="...">
      <!-- содержимое custom SVG с data-overlay-layer метками -->
    </g>
  </g>
  <g id="calib-markers">
    <!-- оранжевые/синие маркеры control-точек -->
  </g>
</svg>
```

### Координатные системы
- **overlay-local** — координаты в нативном viewBox загруженного SVG (до калибровки)
- **world** — координаты в viewBox подложки (= rootSvg viewBox)
- Transform на `[data-group]` маппит overlay-local → world

### Chromium quirk
`element.getCTM()` НЕ возвращает viewBox-координаты как обещает spec — возвращает почти-pixel-координаты. Workaround:
```js
const rootInv = rootSvg.getScreenCTM().inverse();
const matrixInWorld = rootInv.multiply(element.getScreenCTM());
```
Это даёт настоящую матрицу element-local → rootSvg-viewBox.

### localStorage state-v3 schema
```js
{
  bg: { id, name, source: 'preset'|'custom', file?, svgText?, layerVis: [{id, v}] } | null,
  groups: [{
    id, label, color,
    calib: { tx, ty, scale, opacity, strokeMul },  // только simple-mode params
    enabled: [overlay-id, ...],
    isCustom: bool,
    customSvg?: string,  // если custom и < 3MB
    hidden?: bool,
  }],
  editTarget: VIEW_TARGET | group-id,
}
```

## Следующая фаза — РЕДАКТОР ЛИНИЙ/СТРЕЛОК

Пользователь хочет встроенный векторный редактор для:
- Drag-to-move целиком
- Bend (двигать точки path'а)
- Partial drag (часть линии)
- Менять тип стрелки (head shape)
- Менять стиль (цвет, dash, толщина)
- **Группировка по типу события** — каждая правка тэгается «событием» (наступление РККА сентябрь 1918, линия фронта декабрь 1918, и т. п.), элементы попадают в `<g data-event="...">`

### Что не решено

1. **Где хранится edited overlay?**
   - В DOM текущей overlay-группы (mutable)
   - В отдельной редактируемой копии (immutable original)
   - В отдельных файлах per event (как map_v6 — front_aug1918.svg)

2. **События — глобальные или per-overlay?**

3. **Редактор работает с координатами до или после TPS warp?**

4. **Каталог пресетов стилей** — хардкод или JSON-конфиг?

5. **Каталог типов стрелок** — SVG `<marker>` definitions, заранее.

### Предложенная разбивка по фазам

- **MVP (2–3 дня)**: click-select + drag-to-move + palette стилей + event-picker + видимость per event
- **Phase 2 (+3 дня)**: anchor-точки на path, drag для bend, insert/delete
- **Phase 3 (+3 дня)**: bezier handles, multi-select, каталог типов стрелок, export per event
- **Phase 4 (опционально)**: snap-to-grid, rotate/scale, undo/redo

### От пользователя ждём перед началом MVP

- Список **первичных событий** для пресетов (5–8 шт., например: «РККА наступление», «Белые наступление», «Линия фронта», «Ж/д удар», «Прорыв линии», ...)
- Список **первичных стилей стрелок** (3–5 типов: обычная, двойная, открытая, dash, dotted)
- Эстетическая референс-карта (например, `povolzhye-1918-1919/layers.svg`) — оттуда можно подсмотреть какие цвета, типы линий

## Полезные команды

```bash
# Запуск dev-сервера
cd /Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29 && npm run dev

# Сборка прод
npm run build

# Деплой на ostrov stage (только из main)
git push origin main
ssh ostrov 'cd /root/mtk29-src && git pull --ff-only && npm install && npm run build && rsync -a --delete --exclude=nginx.conf dist/ /var/www/mtk29/ && docker exec mtk29-web nginx -s reload'

# Текущие URL
# Локально: http://127.0.0.1:5173/prototypes/empire-1914/index.html
# Stage (после деплоя main): http://212.113.117.186:8091/prototypes/empire-1914/
```

## Стиль работы

- Язык общения: **русский**
- Без эмодзи в коде/документах (если пользователь не просит)
- Mac-ориентированный workflow (Cmd+R, system Python `/usr/bin/python3`)
- Pre-commit hooks игнорировать НЕЛЬЗЯ
- Деплой только через `git push` + `ssh ostrov` (не `rsync` напрямую)
- Не коммитить чужие незакоммиченные изменения (`README.md`, `docs/`, `public/expo/*`)

## Решения, которые НЕ обсуждены, но могут возникнуть

- Экспорт warped overlay в файл (кнопка «Сохранить SVG»)
- Drag-to-adjust для уже расставленных control-точек
- Множественные подложки (переключение между 1914 / 1862 / 1900 / ...)
- Слайдер времени, который меняет visible слои (для МТК 29 timeline)
- Поделиться калибровкой через URL (encode points + matrix в hash)
