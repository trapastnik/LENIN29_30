# Контент

Весь контент живёт в `public/content/` и копируется в `dist/content/` при билде. Редактируется напрямую в файлах JSON (admin-UI — в плане на Phase C).

## Разделы ТЗ МТК 29

| Раздел | Путь | Состояние | Страница |
|---|---|---|---|
| 1 · Хроника событий | `public/content/timeline/` | ❌ не начато | — (будет в `/expo/`) |
| 2 · Политические партии | `public/content/parties/` | 🔶 20 записей (3 с текстом) | [parties.html](/parties.html) |
| 3 · Государственные образования | `public/content/states/` | 🔶 24 записи (1 с текстом) | [states.html](/states.html) |
| 4 · Персоналии | `public/expo/people-data.js` | 🔶 подборка из design pass | [/expo/people.html](/expo/people.html) |

## Партии (Раздел 2)

### Файл `_index.json`
- `camps[]` — 5 лагерей (red / rev-dem / white / green / national)
- `venn_background` — PNG blob'ов без подписей, фон диаграммы
- `venn_headers[]` — позиции заголовков групп на Венне (в процентах viewBox)
- `items[]` — 20 партий с координатами `x/y` на Венне и `camp` для группировки

### Карточки
`public/content/parties/<id>.json`:
```json
{
  "id": "bolsheviks",
  "title_ru": "Большевики · РКП(б)",
  "title_full_ru": "Российская коммунистическая партия (большевиков)",
  "abbr_ru": "РКП(б)",
  "camp": "red",
  "dates": { "from": "1912", "to": "1925" },
  "summary_ru": "…",
  "leaders_ru": [...],
  "related": { "persons": [...], "states": [...] }
}
```

### С полным текстом сейчас
- bolsheviks.json
- srs.json
- cadets.json

Остальные 17 — stub: при fetch провале `<party-card>` показывает «Карточка в подготовке» с данными из индекса (title, camp).

## Гос-образования (Раздел 3)

### Файл `_index.json`
- `camps[]` — 4 лагеря (red / white / rev-dem / intervention)
- `items[]` — 24 образования с `abbr_ru`, `camp`, опциональным `map_id`

### Карточка
`public/content/states/<id>.json` — см. [architecture.md](architecture.md#схемы-данных). Важно: поле `map_id` связывает с живой картой в `public/content/maps/<map_id>/`.

### С полным текстом сейчас
- komuch.json — и с живой картой (Восточный фронт 1918-19)

Остальные 23 — stub-карточки с текстом «в подготовке» + данные из индекса.

## Карты (`public/content/maps/`)

Одна живая, 14 stub. Каждая папка:
- `map.json` — описание, viewBox, список слоёв
- `layers.svg` — многослойный SVG (только у komuch)
- `background.jpg` — растровый фон (только у komuch)
- `thumb.jpg` — превью 320×180 (только у komuch)
- `analytic.md` — аналитическая справка под картой (опционально)

Пайплайн производства новых карт — см. [maps-pipeline.md](maps-pipeline.md).

## Персоналии

Сейчас живут внутри `public/expo/people-data.js` как массив объектов React-страницы. В плане — мигрировать в `public/content/persons/<id>.json` для единообразия со схемами партий/гос-образований.

## Как добавить новую карточку

Партия:
1. Добавить запись в `public/content/parties/_index.json` (id, title_ru, camp, venn_groups, x, y).
2. Опционально создать `public/content/parties/<id>.json` с полным текстом.
3. Сохранить — `/parties.html` подхватит сразу (в dev).

Гос-образование:
1. Добавить в `public/content/states/_index.json` (id, title_ru, camp, abbr_ru, опц. map_id).
2. Опционально создать `public/content/states/<id>.json`.
3. Готово.

Если привязывается к карте — сначала прогнать новую карту через pipeline (см. [maps-pipeline.md](maps-pipeline.md)), затем указать `map_id` в state-карточке.
