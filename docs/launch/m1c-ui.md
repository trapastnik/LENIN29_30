# M1c · Офлайн-киоск — стартовое задание зоны `ui`

**Твой worktree:** `/Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29-ui`
**Твоя ветка:** `ui`
**Первым делом прочитай:** `CLAUDE.md` (§1 ограничения киоска, §4 владение, §6 git)

## Это блокер приёмки, а не технический долг

`public/expo/index.html:31-33` и `public/expo/people.html:29-31`:

```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" …>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" …>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" …>
```

А киоск по `docs/deploy.md:182-184` запускается так:

```
ExecStart=/usr/bin/chromium --kiosk --app=file:///opt/mtk29/dist/index.html
```

**Файловый протокол, без сети → пустой экран на приёмке.** Корень `/` редиректит
на `/expo/`, то есть это главный вход в экспозицию.

Две сопутствующие проблемы в тех же строках:
- Подключены **development-сборки** React и ReactDOM — они в разы тяжелее
  и медленнее production.
- **Babel-in-browser компилирует ~160 КБ JSX при каждом старте.** На киоске
  это секунды белого экрана после включения.

## Задача

**Минимальный вариант (делай его):**
1. React и ReactDOM **production** UMD положить локально в `public/expo/vendor/`.
2. JSX предкомпилировать на сборке вместо Babel-in-browser.
3. Убрать три `<script>` с unpkg из обоих файлов.

⚠️ Тонкость с `/expo/`: он специально живёт **вне** Vite-сборки — файлы
отдаются как есть, а `deploy/nginx.conf:31-35` отдаёт `.jsx` с MIME
`text/babel` и `no-cache`, потому что Babel агрессивно кеширует
скомпилированный jsx в IndexedDB. Если переводишь `/expo/` на предкомпиляцию,
эта часть nginx-конфига теряет смысл — **скажи оркестратору**, он владеет
`deploy/`.

**Правильный вариант (не сейчас):** перенос сцены на Vite целиком. Дороже,
трогает роутинг и iframe-оверлеи. Обсудить после M1.

## Что НЕ ломать

`/expo/` — не только React-сцена, там завязки, которые легко потерять:

| Механизм | Где |
|---|---|
| autoscale canvas 1920×1080 | `index.html:135-149`, `scale = Math.min(cw/1920, ch/1080)` |
| iframe-оверлеи разделов | `index.html:64-68` `SECTION_SRCS`, `postMessage('mtk29:close-section')` |
| синхронизация языка между окном и iframe | `index.html:126-133`, `localStorage['expo:lang']` + `storage`-событие |
| pin-gate | `pin-gate.js` — на `main` отключён, API сохранён как no-op |
| `window.theme` / `window.fonts` | `shared.jsx:541-547` через `Object.assign(window, …)` |

Скоро зона `design` заменит `theme.js` на генерируемый `brand-tokens.js`
и переведёт `shared.jsx` на `window.MTK_THEME`. **Ключи останутся теми же** —
`direction-*.jsx` править не придётся. Согласуй момент переключения
с `design`, чтобы не столкнуться в `shared.jsx`.

## Ворота

- Отключить сеть на Mac → `npm run build && npx serve dist` → `/expo/`
  и `/expo/people.html` рендерят сцену
- В Network ноль запросов к `unpkg.com`
- Замерить время до первого кадра до и после — должно заметно упасть
- `grep -rn "unpkg\|jsdelivr\|cdnjs" public/ src/ *.html` пуст

## Что дальше по твоей зоне (веха M2c, не сейчас)

Чтобы понимал контекст решений:

- **Направления A/B/C снимаются** — главная строится строго по ТЗ
  (таймлайн + 5 плиток разделов). Появляется слот `backdrop`: нижний слой
  сцены под готовый 4K-визуал, поверх — TopBar, таймлайн, плитки. dvn может
  отрисовать «стол» в 4K отдельно, он ставится туда картинкой.
- **200 одновременных fetch → 1 + 1 по тапу.** `collection-page.js:63-76`
  и `parties.html:127-137` создают все карточки, каждая тут же делает свой
  запрос. Правка: грузить только при атрибуте `expanded`, плитка из `stub`.
- **`loader.js`** — `MAX` 100→400, FIFO→настоящий LRU (комментарий в файле
  уже обещает LRU, код FIFO), дедупликация параллельных запросов.
- **Венн на 33 чипа** вместо 15 — ручные `%`-координаты не выдержат,
  блок «Национальные движения» получает 11–12 чипов вместо одного.
- **6 групп территорий** вместо 4 — `states.html:44-50` жёстко `repeat(2,1fr)`.
- **70 персон, 396 событий** — `content-visibility`, алфавитный указатель,
  загрузка хроники по годам.
- `parties.html:127-182` дублирует `CollectionPage` инлайном — свести к одному.

Ничего из этого в M1c не делай. Сначала киоск должен открываться офлайн.

## Чего не делать

- Не трогать `src/styles/**`, `brand.html`, `theme.js` — зона `design`.
- Не трогать `public/content/**` — зона `content`.
- Не трогать `src/components/map-unit.js` — зона `maps`.
- Не менять `vite.config.js`, `package.json`, `deploy/**` — заявка оркестратору.
- Не пушить `main`, не мержить в `main`. `git add` только поимённо.
