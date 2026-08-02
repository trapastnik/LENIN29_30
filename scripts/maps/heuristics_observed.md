# Лог сессии: vectorize-pipeline для empire-1914 калибратора

Сессия 27 мая 2026. Карта «Военные действия в Поволжье и на Урале, сент. 1918 – фев. 1919».
Источник: один vectorize-SVG (Quiver) + исторический растр 1500×1000 JPG.

**Назначение этого pipeline:** превратить Quiver-vectorize-выход в чистое сырьё (semantic `<g id>` слои + правильный OCR), которое потом загружается как overlay в `prototypes/empire-1914/index.html` калибратор для совмещения с имперской 1914 basemap.

## Стабильные правила (fingerprint → semantic)

Подтверждены на нескольких независимых Quiver-vectorize-выходах с разной нумерацией `cls-*` — **имя класса игнорируем, маппим по цвету + толщине + пунктиру**:

| Fingerprint | Семантика |
|---|---|
| `<text>` с `fill=#FF0000` или `#C61717` | `labels_armies` (армии РККА, надписи РСФСР) |
| `<text>` с `fill=#5389B0`, `#00497E`, `#002454` | `labels_rivers` (синий шрифт для рек/гос-в) |
| `<text>` с `fill=#000000` или `#202020` | `labels_cities` |
| `<path>` `fill=#F0C1BD` no stroke | `territories` (РСФСР розовая заливка) |
| `<path>` `fill=#FFEC91` no stroke | `territories` (Государство жёлтая) |
| `<path>` `fill=#FFFFFF/#F2EBD4/#EDEBE1/#F8F3CE` no stroke | `background_paper` |
| `stroke=#5389B0` тонкий, no dasharray | `rivers` |
| `stroke=#FF0000` solid | `arrows_red` |
| `stroke=#FF0000` + dasharray | `front_red` |
| `stroke=#0000CC/0000FF/0033CC` solid | `arrows_blue` |
| `stroke=#0000CC` + dasharray | `front_blue` |
| `stroke=#007F00` | `arrows_green` (Сибирская армия) |
| `stroke=#E62E8B` | `arrows_pink` (Ижевско-Воткинское) |
| `stroke=#000000` width<0.5 | `admin_borders` |
| `stroke=#000000` width≥0.5 | `railways` (часто с dasharray для жд) |

**Важно для калибратора**: empire-1914 поддерживает оба стиля имён слоёв через `normId()`:
- `labels_cities` / `city_dots` (underscore — povolzhye-style, контракт `<map-unit>`)
- `labels-cities` / `city-dots` (hyphen — vectorized-style, выход `layer_svg.py`)

## OCR-наблюдения для Quiver vectorize

Типовые ошибки на povolzhye 1500×1000:
- Кириллица с диакритикой / необычные глифы → латиница: `Воstoneй` → «Восточный», `сكتورة` → «октября)»
- Усечение слов в конце по разделителю строки: `(с ` (вместо «(с 12 октября)»)
- Дублирование/инверсия одной буквы: `Бузулуч` (Бузулук), `Ульская` (Уральская)
- Добавление лишнего окончания: `Сарапула` (Сарапул)

**На povolzhye было ~8 OCR-фиксов из ~80 текстов = 10% ошибок.** Исправлены вручную с помощью растра-эталона в `~/Downloads/ТЗ Карты общие — ...1918-1919-100.jpg`.

## Pipeline-шаги

1. **Парсинг Quiver SVG** + fingerprint mapping (см. таблицу выше)
2. **Перегруппировка** в `<g id="...">` — стандартный набор имён (см. ниже)
3. **Markers** вместо inline-наконечников: для каждого arrowhead-полигона ищем ближайший stroke-path того же цвета в радиусе `MAX_DIST=3.5` SVG-units, заменяем inline-полигон на `marker-end` reference
4. **Ручная правка OCR** с растром (Claude сверяет тексты глазами через `<text>` grep)
5. **Сборка** под `content/maps/{id}/`:
   - `layers.svg` — финальный SVG с `<g id>` группами
   - `map.json` — манифест с `viewBox`, `layers[]`, `preserve_aspect: "none"`, `background_raster`
   - `background.jpg` — растр-эталон 1:1

## Стандартный список `<g id>` (контракт)

```
background_paper, territories, admin_borders, rivers,
front_aug1918, front_nov1918, front_feb1919,    # хронологические фронты
arrows_red, arrows_blue, arrows_green, arrows_pink,
city_dots,
labels_cities, labels_rivers, labels_armies,
title, map_frame, legend, frame_decor
```

## preserveAspectRatio для растра

**vectorize-режим** (этот pipeline): `preserve_aspect: "none"` — растр и vector в одинаковом aspect (Quiver vectorize сохраняет соотношение исходного растра ±1-2%). Растягиваем растр точно по viewBox для пиксельного совпадения. Vector-overlay смещается от растра на 1-2 SVG units — это норма.

## Артефакты-файлы pipeline

- `layer_svg.py` — cls → semantic group, перегруппировка
- `hybrid_svg.py` — add markers, remove inline arrowheads
- `build_mapunit.py` — финальная сборка под map-unit (виды по датам)
- `check_orphans.py` — debug: непарные arrowheads

## TODO для будущих сессий

- [ ] Многострочный OCR: склеивать `<text>` по соседним координатам перед матчингом
- [ ] Авто-генерация словаря из легенды (легенда всегда содержит ground truth подписей)
- [ ] Когда `misc` бакет > 20% — флаг «много неклассифицированного», подсказать добавить fingerprint правило
- [ ] Передать `*.layered.svg` в калибратор empire-1914 как overlay, прогнать «авто-сопоставление по именам» — проверить какие города сматчились
