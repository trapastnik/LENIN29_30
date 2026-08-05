# Kiosk UI Kit — МТК 29 / Россия в Гражданской войне

Recreation of the Lenin-Centre 4K touch-table kiosk for exhibition section
**МТК 29 · "Россия в Гражданской войне" (1917–1924)**.

## What this is

A visual + interaction recreation of the kiosk shell. Designed at native
**1920 × 1080** ("половинный 4K"; the actual hardware is 3840 × 2160). Auto-scales
to fit any viewport on load.

⚠️ **Удвоение под 4K делает браузер, а не вёрстка.** Киоск запускается
окном 1920 с флагом `--force-device-scale-factor=2`: CSS-ширина остаётся
1920, всё удваивается физически. Прежняя формулировка «you just multiply
pixel sizes by 2 in production» описывала **другой** режим (CSS-ширина
3840 без флага) — и складывать их нельзя, получится ×4.

Touch-only. No hover styles anywhere. Press feedback (`:active`) only.

## Run

Open `index.html`. The kit boots into the **idle attractor**; tap to enter,
pick a section tile, browse parties, tap a card to open the detail sheet
with an archival newspaper plate.

## Components

| File | Component | Notes |
|---|---|---|
| `Button.jsx` | `Button`, `IconButton` | Outline / solid / red variants. 64 / 64 / 120 (sm / md / lg). |
| `PageHeader.jsx` | `PageHeader` | Drop-cap numeral + skewed brass diagonal + slash title + back button. |
| `CampFilter.jsx` | `CampFilter` | Segmented camp toggle. Exposes `CAMPS` enum on `window`. |
| `PartyCard.jsx` | `PartyCard` | Paper-white card with camp stripe, dates, summary, leaders. |
| `ArchivePlate.jsx` | `ArchivePlate` | Period-correct newspaper plate (pre-1918 orthography supported). |
| `Modal.jsx` | `Modal` | Dark-scrim sheet with brass-ringed close. |
| `Screens.jsx` | `IdleScreen`, `HomeScreen` | Attractor and section grid. |
| `SectionScreen.jsx` | `SectionScreen`, `PartyDetail` | Party browser + detail body. |
| `App.jsx` | `App` | Routes idle → home → section; opens `<Modal>` for detail. |
| `data.js` | `PARTIES`, `SECTIONS`, `NEWSPAPER_PRAVDA` | Demo content. |

## Visual rules followed

- All headings use `Nolde` Regular only — never italic, never another weight.
- All UPPERCASE labels carry `letter-spacing: 0.22em–0.30em` and use `20 Kopeek`.
- Body copy is `21 Cent`, 22–32px, line-height 1.45.
- Background is the canonical 105° brass + red + light-slate stripe stack
  over `--iron-grey`.
- **Touch hits — два порога: 120px основная навигация (`--touch-hit`),
  64px управляющий элемент (`--touch-min`).**
- No emoji, no decorative unicode beyond `· — / → ←`.

## ⚠️ Порог тач-цели: правка 2026-08-05

Здесь стояло «≥ 56px (chip), 64px (default), 96px (primary)», а `Button.jsx`
давал `sm: 48` и `IconButton: 56` — **при том, что его собственный
заголовочный комментарий объявлял 64/120 верно**. Код противоречил
своей же документации.

Это один дефект по **семи адресам**: `colors_and_type.css` (`--touch-min: 48`),
`preview/touch-target.html`, `preview/buttons.html` (48),
`preview/camp-filter.html` (44), `Button.jsx` (48 и 56), этот файл,
и `README.md` проекта (объявляет только 120 и запрещает всё мельче —
что запретило бы законные контролы по 64).

Число 48 не выдумано: его списали **отсюда** в линтер проекта, где оно
прожило три месяца. Поэтому чинится источник, а не одно место.

**Размер и хит-зона могут различаться.** Видимая пилюля 56 законна,
если область нажатия добирается парным `::before` до порога. Незаконно
56 без добора — «почти порог» худший случай: выглядит прилично,
а пальцем промахивается.

**Мерить попаданием, а не стилями:** `elementFromPoint` по верху, центру
и низу. Кнопка с честным `min-height: 64` давала фактические 65 при норме
120 — в computed-стилях выглядело прилично.

## Known gaps (vs. real production)

- Only one section ("Политические партии") has real data; the other five tiles
  navigate but pull from the same dataset.
- No real archival imagery — `ArchivePlate` is a typographic reconstruction, not
  a scan. Production would composite over real BMVL / RGASPI images.
- No telegram cards, map plates, or video panels yet — they exist in the
  brand catalog but are out of scope for this kit's first pass.
- Maps, timeline scrubbers, and the long-form "Брестский мир" reading flow
  are not built.
- **Лагерей семь, а не шесть:** кит не знает `--camp-uprising` (Восстания,
  22 записи в данных) — он заведён в `colors_and_type.css`, но в `CampFilter`
  не проброшен.
