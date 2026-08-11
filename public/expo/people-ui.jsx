// Персоналии Гражданской войны — UI

// Значений здесь больше нет. Единственный источник — src/design/tokens.json,
// генератор кладёт готовые объекты в public/expo/brand-tokens.js, страница
// подключает его обычным <script> до этого файла.
//
// Запасных значений на месте нет намеренно: молчаливый фолбэк — это вторая
// палитра, которая включается при опечатке в имени. Нет токенов — падаем.
if (!window.MTK_TOKENS) {
  throw new Error('people-ui.jsx: не подключён brand-tokens.js (см. public/expo/people.html)');
}

// ⚠️ Четвёртый набор цветов лагерей: ни один не совпадает с --camp-*.
// «Красные» здесь заметно теплее и светлее бренд-RAL 3001. Помечен в
// tokens.json как deprecated, сводится к --camp-* на шаге 3.
// (Значения намеренно не приводим: сырой hex в коде — нарушение §8,
// даже в комментарии, и линтер его честно считает.)

// S() — общий помощник масштаба из ui-scale.jsx.

const SIDE_META = window.MTK_SIDE_META;

// Лагерь известен почти у всех (68 из 70), но не у всех. Без запасного
// значения meta.flag роняет всю сетку на первой же записи без camp.
const SIDE_NEUTRAL = {
  ru: 'Внѣ лагерей', en: 'Unaligned',
  color: '#5D6970',   // BRAND.slateBlue
  accent: '#9DA3A6',  // BRAND.slateWindow
  flag: '#555D61',    // BRAND.ironGrey
};
// ⚠️ MTK_SIDE_META знает только red/white/green — остаток палитры design-pass.
// В данных лагерей шесть. Подписи для недостающих держим здесь, словами
// самого content; заявка в design — дописать их в MTK_SIDE_META, тогда
// SIDE_EXTRA отомрёт сам.

const SIDE_EXTRA = {
  'rev-dem':    { ru: 'Революціонная демократія', en: 'Revolutionary democracy' },
  national:     { ru: 'Національныя движенія',    en: 'National movements' },
  uprising:     { ru: 'Повстанческія движенія',   en: 'Insurgent movements' },
  intervention: { ru: 'Интервенція',              en: 'Intervention' },
};

// Цвет лагеря — из бренд-токена --camp-<id>: в brand-tokens.css они есть
// на все шесть, выдумывать свой незачем. Читаем один раз на лагерь.
const campColorCache = {};
function campColor(side) {
  if (!side) return null;
  if (!(side in campColorCache)) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--camp-${side}`).trim();
    campColorCache[side] = v || null;
  }
  return campColorCache[side];
}

// Светлый ли фон — по яркости, а не по списку хексов: лагерей шесть,
// перечислять их руками это ровно та ловушка, из-за которой фильтры
// и разошлись с данными.
function isLight(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
}

// Список фильтров строим из самих записей. Жёсткий перечень уже разошёлся
// с данными: content добавил rev-dem (14 персон) и national (9), и эти 23
// перестали отбираться чем-либо, кроме «Всѣ», — без ошибки, просто их не видно.
const CAMP_ORDER = ['red', 'white', 'rev-dem', 'green', 'national', 'uprising', 'intervention'];

function campFilters(people) {
  const seen = [...new Set(people.map(p => p.side).filter(Boolean))];
  seen.sort((a, b) => {
    const ia = CAMP_ORDER.indexOf(a), ib = CAMP_ORDER.indexOf(b);
    const na = ia < 0 ? 99 : ia, nb = ib < 0 ? 99 : ib;
    return na !== nb ? na - nb : a.localeCompare(b);
  });
  const out = [{ id: 'all', ru: 'Всѣ', en: 'All', count: people.length, brand: '#D2B773' }];
  for (const id of seen) {
    const meta = sideMeta(id);
    out.push({ id, ru: meta.ru, en: meta.en, brand: meta.color,
               count: people.filter(p => p.side === id).length });
  }
  const noneCount = people.filter(p => !p.side).length;
  if (noneCount) out.push({ id: 'none', ru: SIDE_NEUTRAL.ru, en: SIDE_NEUTRAL.en,
                            brand: SIDE_NEUTRAL.accent, count: noneCount });
  return out.filter(f => f.count > 0);
}

function sideMeta(side) {
  if (side && SIDE_META[side]) return SIDE_META[side];
  if (side && SIDE_EXTRA[side]) {
    const c = campColor(side) || SIDE_NEUTRAL.color;
    return { ...SIDE_EXTRA[side], color: c, accent: c, flag: c };
  }
  return SIDE_NEUTRAL;
}

// richText() приходит из rich-text.jsx — та же разметка в хронике,
// держать две копии рендерера нельзя.



// Официальная палитра RAL — для бренд-акцентов (флаг лагеря, page-header, pill).
const BRAND = window.BRAND_THEME;

// ⚠️ Тёплая «материальная» палитра карточки (старая бумага, виньетка) — тоже
// deprecated: paper здесь #e8d4a8, третье значение для одного имени.
const theme = window.MTK_PEOPLE_THEME;

const fonts = window.MTK_PEOPLE_FONTS;

// Плоская карта токенов: BRAND_COLORS ниже собирается из неё, чтобы каталог
// цветов в панели «Стиль» не был очередной копией палитры.
const T = window.MTK_TOKENS;

// Бренд-фоны (только из RAL-палитры по PDF-гайду; см. project_style_layers).
// Названия и значения соответствуют brand.html секциям 1, 6, 17.
const BG_VARIANTS = {
  iron: {
    ru: 'Железо-серый', en: 'Iron grey',
    desc: 'RAL 7011 · «третий этаж»',
    style: { background: '#555D61' },
  },
  graphite: {
    ru: 'Графит', en: 'Graphite',
    desc: '#435059 · мультимедиа',
    style: { background: '#435059' },
  },
  slate: {
    ru: 'Сине-серый', en: 'Slate blue',
    desc: 'RAL 7031 · «второй этаж»',
    style: { background: '#5D6970' },
  },
  black: {
    ru: 'Чёрный янтарь', en: 'Ink black',
    desc: 'RAL 9005',
    style: { background: '#000000' },
  },
  // «Подложка из косых линий» по brand.html секции 6 (страница 4 PDF)
  stripes: {
    ru: 'Бренд-полосы', en: 'Brand stripes',
    desc: 'iron-grey + параллелограммы 105°',
    style: {
      background: [
        'linear-gradient(105deg, transparent 0, transparent 72%, #A02128 72%, #A02128 86%, transparent 86.2%)',
        'linear-gradient(105deg, transparent 0, transparent 2%, rgba(157,163,166,0.18) 2%, rgba(157,163,166,0.18) 14%, transparent 14.2%)',
        'linear-gradient(105deg, transparent 0, transparent 62%, #D2B773 62%, #D2B773 62.2%, transparent 62.4%)',
        'linear-gradient(105deg, transparent 0, transparent 89%, rgba(210,183,115,0.55) 89%, rgba(210,183,115,0.55) 89.15%, transparent 89.35%)',
        '#555D61',
      ].join(','),
      backgroundAttachment: 'fixed',
    },
  },
  // «Большая композиция стр. 8 PDF» — slate-blue + красные параллелограммы
  parallelograms: {
    ru: 'Параллелограммы', en: 'Parallelograms',
    desc: 'slate-blue + красные плашки',
    style: {
      background: [
        'linear-gradient(105deg, transparent 0, transparent 18%, #A02128 18%, #A02128 38%, transparent 38.2%)',
        'linear-gradient(105deg, transparent 0, transparent 56%, rgba(0,0,0,0.18) 56%, rgba(0,0,0,0.18) 70%, transparent 70.2%)',
        'linear-gradient(105deg, transparent 0, transparent 80%, #D2B773 80%, #D2B773 80.18%, transparent 80.4%)',
        '#5D6970',
      ].join(','),
      backgroundAttachment: 'fixed',
    },
  },
  // Светлый бумажный фон — paper-white RAL 9001 (brand.html секция 1)
  paper: {
    ru: 'Бумага', en: 'Paper',
    desc: 'RAL 9001 paper-white',
    style: { background: '#F7F9EF' },
  },
  // Светлый с косыми полосами — paper-white + бренд-параллелограммы
  paperStripes: {
    ru: 'Бумага+полосы', en: 'Paper stripes',
    desc: 'paper-white + параллелограммы',
    style: {
      background: [
        'linear-gradient(105deg, transparent 0, transparent 72%, #A02128 72%, #A02128 86%, transparent 86.2%)',
        'linear-gradient(105deg, transparent 0, transparent 2%, rgba(85,93,97,0.18) 2%, rgba(85,93,97,0.18) 14%, transparent 14.2%)',
        'linear-gradient(105deg, transparent 0, transparent 62%, #D2B773 62%, #D2B773 62.2%, transparent 62.4%)',
        'linear-gradient(105deg, transparent 0, transparent 89%, rgba(67,80,89,0.55) 89%, rgba(67,80,89,0.55) 89.15%, transparent 89.35%)',
        '#F7F9EF',
      ].join(','),
      backgroundAttachment: 'fixed',
    },
  },
};

// Все бренд-цвета RAL (см. brand.html). Используются в TEXT_BG/TEXT_INK
// для тонкой настройки текстовой подложки и цвета шрифта в PersonDetail.
// Подписи — местные (в панели нужны короткие, «Светло-сер.» вместо RAL 7040),
// а hex приезжает из токенов. Порядок сохранён — он определяет порядок свотчей.
const BRAND_COLORS = Object.fromEntries([
  ['inkBlack',    'ink-black',    'Чёрный',      'Black'],
  ['graphite',    'graphite',     'Графит',      'Graphite'],
  ['ironGrey',    'iron-grey',    'Железо',      'Iron grey'],
  ['slateBlue',   'slate-blue',   'Сине-серый',  'Slate blue'],
  ['slateWindow', 'slate-window', 'Светло-сер.', 'Slate window'],
  ['telegrey4',   'telegrey-4',   'Теле-серый',  'Telegrey 4'],
  ['paperWhite',  'paper-white',  'Бумага',      'Paper'],
  ['brass',       'brass',        'Латунь',      'Brass'],
  ['signalRed',   'signal-red',   'Красный',     'Signal red'],
].map(([key, token, ru, en]) => [key, { ru, en, hex: T[token] }]));

// Подложка под текстом справа. transparent — наследовать фон фрейма (как было).
const TEXT_BG_VARIANTS = {
  transparent: { ru: 'Без подложки', en: 'No backing', bg: 'transparent', swatch: 'transparent' },
  ...Object.fromEntries(Object.entries(BRAND_COLORS).map(([k, v]) => [
    k, { ru: v.ru, en: v.en, bg: v.hex, swatch: v.hex },
  ])),
};

// Цвет основного текста справа (био + факты). По умолчанию — paper-white.
const TEXT_INK_VARIANTS = Object.fromEntries(Object.entries(BRAND_COLORS).map(([k, v]) => [
  k, { ru: v.ru, en: v.en, ink: v.hex, swatch: v.hex },
]));

// Фрейм большой карточки (внешний контейнер PersonDetail) + цвет overlay.
// По умолчанию — слегка прозрачный graphite вместо мрачного чёрного.
const FRAME_VARIANTS = {
  graphiteSoft: { ru: 'Графит (soft)', en: 'Graphite (soft)',
    bg: 'rgba(67,80,89,0.78)', overlay: 'rgba(0,0,0,0.66)', swatch: '#435059' },
  ironSoft:     { ru: 'Железо (soft)', en: 'Iron (soft)',
    bg: 'rgba(85,93,97,0.78)', overlay: 'rgba(0,0,0,0.66)', swatch: '#555D61' },
  slateSoft:    { ru: 'Сине-сер. (soft)', en: 'Slate (soft)',
    bg: 'rgba(93,105,112,0.78)', overlay: 'rgba(0,0,0,0.66)', swatch: '#5D6970' },
  blackDeep:    { ru: 'Чёрный',     en: 'Black',
    bg: 'rgba(0,0,0,0.65)', overlay: 'rgba(0,0,0,0.78)', swatch: '#000000' },
  graphite:     { ru: 'Графит',     en: 'Graphite',
    bg: '#435059', overlay: 'rgba(0,0,0,0.74)', swatch: '#435059' },
  ironGrey:     { ru: 'Железо',     en: 'Iron grey',
    bg: '#555D61', overlay: 'rgba(0,0,0,0.74)', swatch: '#555D61' },
  slateBlue:    { ru: 'Сине-серый', en: 'Slate blue',
    bg: '#5D6970', overlay: 'rgba(0,0,0,0.74)', swatch: '#5D6970' },
  paperWhite:   { ru: 'Бумага',     en: 'Paper',
    bg: '#F7F9EF', overlay: 'rgba(67,80,89,0.74)', swatch: '#F7F9EF' },
  brass:        { ru: 'Латунь',     en: 'Brass',
    bg: '#D2B773', overlay: 'rgba(0,0,0,0.66)', swatch: '#D2B773' },
};

function bgForVariant(variant) {
  const v = BG_VARIANTS[variant] || BG_VARIANTS.iron;
  return v.style;
}

// Панель «◇ Стиль» удалена 2026-08-04. Была инструментом дизайн-пасса:
// переключала варианты шапки, фона списка и большой карточки прямо на
// странице. На стенде это дефект, а не удобство — position fixed,
// zIndex 250 выше модалки и лайтбокса, то есть специально недостижима
// для перекрытия. Киоск живёт ОДНИМ непрерывным сеансом (§1): посетитель,
// случайно перекрасивший раздел, ломает его всем следующим до перезапуска,
// а сброса в панели не было.
//
// Исходник цел и лежит НЕ в этом репозитории — в дизайн-системе проекта
// на claude.ai, `variants/tweaks-panel.jsx`. Оттуда же родом соседние
// direction-a/b/c.jsx (там они variant-A…E.jsx), так что пустоты рядом
// с ними — не следы удаления половины чего-то.
//
// Зона design вернёт панель, когда та будет показывать замеренный контраст
// рядом со свотчем: выбор «на глаз» дал три ошибки за день — 1.45, 1.08,
// 1.29 при норме 4.5. Варианты ниже остаются, панель выбора — нет.

// Бренд-варианты цвета большой карточки (PersonDetail) — только из RAL
const CARD_VARIANTS = {
  paper:    { ru: 'Бумага',    en: 'Paper',     bg: '#F7F9EF', ink: '#000000', accent: '#A02128', muted: 'rgba(0,0,0,0.55)', rule: 'rgba(0,0,0,0.18)' },
  black:    { ru: 'Чёрный',    en: 'Black',     bg: '#000000', ink: '#F7F9EF', accent: '#D2B773', muted: 'rgba(247,249,239,0.62)', rule: 'rgba(210,183,115,0.35)' },
  graphite: { ru: 'Графит',    en: 'Graphite',  bg: '#435059', ink: '#F7F9EF', accent: '#D2B773', muted: 'rgba(247,249,239,0.62)', rule: 'rgba(210,183,115,0.35)' },
  slate:    { ru: 'Сине-серый',en: 'Slate',     bg: '#5D6970', ink: '#F7F9EF', accent: '#D2B773', muted: 'rgba(247,249,239,0.62)', rule: 'rgba(210,183,115,0.35)' },
  ironGrey: { ru: 'Железо',    en: 'Iron grey', bg: '#555D61', ink: '#F7F9EF', accent: '#D2B773', muted: 'rgba(247,249,239,0.62)', rule: 'rgba(210,183,115,0.35)' },
};

// Бренд-варианты цвета SHAPKA — только из RAL
const HEADER_VARIANTS = {
  black:    { ru: 'Чёрный',    en: 'Black',     bg: 'rgba(0,0,0,0.94)',         border: 'rgba(210,183,115,0.35)' },
  graphite: { ru: 'Графит',    en: 'Graphite',  bg: 'rgba(67,80,89,0.96)',      border: 'rgba(210,183,115,0.35)' },
  ironGrey: { ru: 'Железо',    en: 'Iron grey', bg: 'rgba(85,93,97,0.96)',      border: 'rgba(210,183,115,0.35)' },
  slate:    { ru: 'Сине-серый',en: 'Slate',     bg: 'rgba(93,105,112,0.96)',    border: 'rgba(210,183,115,0.35)' },
  paper:    { ru: 'Бумага',    en: 'Paper',     bg: 'rgba(247,249,239,0.97)',   border: 'rgba(0,0,0,0.4)',       inkOnLight: true },
};

function paperFill() {
  return {
    background: [
      'radial-gradient(ellipse 70% 60% at 30% 30%, rgba(255,245,210,.6) 0%, transparent 55%)',
      'radial-gradient(ellipse 80% 60% at 80% 80%, rgba(120,80,20,.18) 0%, transparent 60%)',
      `repeating-linear-gradient(97deg, rgba(120,80,30,.05) 0 1px, transparent 1px 3px)`,
      `linear-gradient(180deg, ${theme.paperLit} 0%, ${theme.paper} 60%, ${theme.paperDim} 100%)`,
    ].join(','),
  };
}

// Силуэтный портрет — SVG заглушка, различается по стороне
function Silhouette({ side, size = 240, accent }) {
  const meta = sideMeta(side);
  return (
    <svg viewBox="0 0 100 140" style={{ width: size, height: size * 1.4 }}>
      <defs>
        <radialGradient id={`bg-${side}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#8a6a3c"/>
          <stop offset="60%" stopColor="#4a2e14"/>
          <stop offset="100%" stopColor="#1a0d05"/>
        </radialGradient>
        <linearGradient id={`sil-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a0d05"/>
          <stop offset="100%" stopColor="#2a1a0a"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="140" fill={`url(#bg-${side})`}/>
      {/* зерно */}
      <rect x="0" y="0" width="100" height="140" fill="url(#noise)" opacity=".15"/>
      {/* силуэт плеч и головы */}
      <path d="M 20 140 Q 20 95 34 88 Q 40 86 42 80 Q 36 76 36 62 Q 36 44 50 44 Q 64 44 64 62 Q 64 76 58 80 Q 60 86 66 88 Q 80 95 80 140 Z"
        fill={`url(#sil-${side})`}/>
      {/* значок стороны — на плече */}
      <circle cx="72" cy="108" r="6" fill={meta.flag} opacity=".85"/>
      <circle cx="72" cy="108" r="6" fill="none" stroke="#f0dcae" strokeOpacity=".3" strokeWidth=".6"/>
      {/* виньетка */}
      <rect x="0" y="0" width="100" height="140" fill="url(#vign)" opacity=".7"/>
      <defs>
        <radialGradient id="vign" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity=".7"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

// Сторона-плашка (флажок)
function SideFlag({ side, lang }) {
  const meta = sideMeta(side);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: S(8),
      padding: S('4px 10px 4px 6px'),
      background: meta.flag, color: '#f0dcae',
      fontFamily: fonts.mono, fontSize: S(11),
      letterSpacing: '0.22em', textTransform: 'uppercase',
      clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)',
      paddingRight: S(18),
    }}>
      <span style={{ width: S(10), height: S(10), background: '#f0dcae', opacity: .85 }}/>
      {meta[lang]}
    </div>
  );
}

// Карточка-миниатюра персоналии
function PersonCard({ person, lang, onOpen, delay, flash }) {
  const meta = sideMeta(person.side);
  const [portraitFailed, setPortraitFailed] = React.useState(false);
  return (
    <button onClick={onOpen || undefined} disabled={!onOpen} style={{
      // Заглушка без справки не кликается: файла <id>.json у неё нет,
      // тап давал бы 404 и пустую модалку.
      opacity: onOpen ? 1 : 0.55,
      cursor: onOpen ? 'pointer' : 'default',
      position: 'relative',
      // isolate: каждая карточка в своём stacking-context — соседи не
      // съедают её клик, даже когда transform-rotate их слегка пересекает
      isolation: 'isolate', zIndex: 1,
      width: '100%', textAlign: 'left', border: 'none',
      padding: 0, background: 'transparent',
      // Угол ротации уменьшен вдвое (raw `_rot` теперь делим), чтобы
      // соседние карточки в гриде не перекрывали друг друга в углах
      transform: `rotate(${(person._rot || 0) * 0.5}deg)`,
      animation: `fadeUp 600ms ${delay}ms both`,
      // Цель прыжка по алфавиту: обводка держится секунду и гаснет.
      outline: flash ? `3px solid ${theme.brass}` : 'none',
      outlineOffset: 4,
      transition: 'outline-color 240ms ease',
    }}
    >
      <div style={{
        ...paperFill(),
        border: `1px solid ${theme.inkFade}`,
        padding: S(10),
        boxShadow: '0 10px 22px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.3)',
        position: 'relative',
      }}>
        {/* уголок-сторона */}
        <div style={{
          position: 'absolute', top: -1, right: -1,
          width: 0, height: 0,
          borderTop: `34px solid ${meta.flag}`,
          borderLeft: '34px solid transparent',
        }}/>
        {/* портрет */}
        <div style={{
          width: '100%', aspectRatio: '1/1.25',
          overflow: 'hidden', position: 'relative',
          background: '#F7F9EF',
          border: `1px solid ${theme.inkSoft}`,
          marginBottom: S(10),
        }}>
          {person.portrait && !portraitFailed ? (
            <img src={person.portrait} alt="" loading="lazy"
              // Производные собираются на сервере и мимо git, поэтому файла
              // может не быть даже при заполненном lead_tiers. Битая иконка
              // на киоске читается как поломка раздела — откатываемся
              // на тот же силуэт, что и при отсутствующем портрете.
              onError={() => setPortraitFailed(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                display: 'block', filter: 'sepia(0.18) contrast(1.05)',
              }}/>
          ) : (
            <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"
              style={{ width: '100%', height: '100%', display: 'block' }}>
              {/* Светлый плейсхолдер: bg = paper-white → telegrey4 → slate-window,
                  силуэт iron-grey, плечо slate-blue. */}
              <defs>
                <radialGradient id={`pbg-${person.id}`} cx="50%" cy="35%" r="80%">
                  <stop offset="0%" stopColor="#F7F9EF"/>
                  <stop offset="60%" stopColor="#CFD0CF"/>
                  <stop offset="100%" stopColor="#9DA3A6"/>
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="100" height="125" fill={`url(#pbg-${person.id})`}/>
              <path d="M 15 125 Q 15 82 32 74 Q 40 72 42 66 Q 34 62 34 47 Q 34 28 50 28 Q 66 28 66 47 Q 66 62 58 66 Q 60 72 68 74 Q 85 82 85 125 Z"
                fill="#555D61"/>
              <path d="M 15 125 L 15 110 Q 50 95 85 110 L 85 125 Z"
                fill="#5D6970"/>
            </svg>
          )}
          {/* грейн */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(91deg, rgba(0,0,0,.08) 0 1px, transparent 1px 3px)',
          }}/>
          {/* Годы — плашкой, а не текстом поверх фото. Замер контраста нашёл
              1.27 при норме 4.5: светло-бежевые годы на светлой кромке
              фото-заглушки, textShadow не спасал. Фон под текстом
              непредсказуем — там будет реальное фото, — поэтому не подбираем
              цвет текста, а даём равномерную тёмную подложку: светлый текст
              на ней читается на любом фоне.
              Фон именно у контейнера текста, а не соседней виньеткой: так
              и глазом плашка, и замер контраста видит настоящий фон
              (сосед-виньетку он бы не учёл — смотрит цепочку предков).
              rgba, не «свой цвет» в обход §8 — как грейн и textShadow выше. */}
          <div style={{
            position: 'absolute', bottom: S(6), left: S(8),
            padding: S('2px 6px'), borderRadius: S(3),
            background: 'rgba(0,0,0,.72)',
            fontFamily: fonts.mono, fontSize: S(10), color: '#f6ead0', letterSpacing: '0.15em',
          }}>{person.years}</div>
        </div>

        {/* Имя. В индексе нет отдельных given/surname — только title_ru
            («В. И. ЛЕНИН (УЛЬЯНОВ)»), и это правильно: плитка рисуется
            без единой дозагрузки. Регалии показывает уже справка. */}
        <div style={{
          fontFamily: fonts.display,
          fontSize: S(22), lineHeight: 1.05, color: theme.ink, marginTop: S(2),
        }}>{person.title}</div>
        <div style={{
          marginTop: S(8), fontFamily: fonts.mono, fontSize: S(10), letterSpacing: '0.2em',
          color: meta.color, textTransform: 'uppercase',
        }}>{meta[lang]}</div>
        {person.stub && (
          <div style={{
            marginTop: S(6), fontFamily: fonts.mono, fontSize: S(10),
            letterSpacing: '0.15em', color: theme.inkFade, textTransform: 'uppercase',
          }}>{lang === 'ru' ? 'справки пока нѣтъ' : 'no dossier yet'}</div>
        )}
      </div>
    </button>
  );
}


// Кадр галереи. Производные (content/<file>-<tier>.webp) ещё не собраны:
// npm run media:build отсутствует, tiers пуст у всех 258 изображений.
// Поэтому src может быть null — и тогда нужен внятный прямоугольник,
// а не сломанная иконка картинки. Появятся производные — включится само.
function PhotoFrame({ photo, lang }) {
  if (photo && photo.src) {
    return (
      <img src={photo.src} alt="" loading="lazy" style={{
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
        display: 'block', filter: 'sepia(0.12) contrast(1.04)',
      }}/>
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: S(10),
      background: 'linear-gradient(160deg, #435059 0%, #2a2f33 100%)',
      fontFamily: fonts.mono, fontSize: S(9), lineHeight: 1.5,
      letterSpacing: '0.16em', color: '#9DA3A6', textTransform: 'uppercase',
    }}>
      {lang === 'ru' ? 'изображеніе не собрано' : 'image not built'}
    </div>
  );
}

// Лайтбокс — фото на весь экран по тапу в галерее
function PhotoLightbox({ photo, lang, onClose, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(2,1,0,.96)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 200ms ease',
    }} onClick={onClose}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: S('40px 80px 20px'), minHeight: 0,
      }}>
        <img src={photo.src} alt="" style={{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
          filter: 'sepia(0.08) contrast(1.04)',
          boxShadow: '0 30px 80px rgba(0,0,0,.9)',
        }} onClick={e => e.stopPropagation()}/>
      </div>
      <div style={{
        padding: S('14px 80px 32px'),
        fontFamily: fonts.body, fontSize: S(16), lineHeight: 1.5,
        color: theme.paperLit, textAlign: 'center', maxWidth: S(1100), margin: '0 auto',
      }} onClick={e => e.stopPropagation()}>{photo[lang]}</div>

      {/* кнопки */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
        position: 'absolute', top: S(24), right: S(24),
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: S(56), height: S(56),
        fontFamily: fonts.mono, fontSize: S(22),
      }}>×</button>
      {hasPrev && <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
        position: 'absolute', left: S(16), top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: S(56), height: S(56),
        fontFamily: fonts.mono, fontSize: S(22),
      }}>‹</button>}
      {hasNext && <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
        position: 'absolute', right: S(16), top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: S(56), height: S(56),
        fontFamily: fonts.mono, fontSize: S(22),
      }}>›</button>}
    </div>
  );
}

// Модальная карточка с подробностями
function PersonDetail({ person, lang, onClose, lightboxIdx, setLightboxIdx, cardCfg, textBgCfg, textInkCfg, frameCfg }) {
  const card = cardCfg || CARD_VARIANTS.paper;
  const textBg = (textBgCfg && textBgCfg.bg) || 'transparent';
  const textInk = (textInkCfg && textInkCfg.ink) || '#F7F9EF';
  const hasTextBg = textBg !== 'transparent';
  const frame = frameCfg || FRAME_VARIANTS.graphiteSoft;
  const d = person[lang];
  const meta = sideMeta(person.side);
  const photos = person.photos || [];

  // Режим раскладки правой колонки:
  //   'flow'    — текст и фото-галерея в одном скроллящемся блоке (как было)
  //   'gallery' — текст скроллится сверху, фото-полоса прибита снизу
  const [viewMode, setViewMode] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleViewMode') || 'flow'; } catch { return 'flow'; }
  });
  // Тот же откат, что и на плитке: несобравшаяся производная не должна
  // выглядеть как сломанная карточка.
  const [leadFailed, setLeadFailed] = React.useState(false);
  React.useEffect(() => { setLeadFailed(false); }, [person.id]);
  React.useEffect(() => { try { localStorage.setItem('expo:peopleViewMode', viewMode); } catch {} }, [viewMode]);

  if (!person) return null;
  return (
    <div style={{
      // fixed — модалка приколочена к viewport iframe и не зависит
      // от scrollTop фонового списка персоналий ни при каких условиях.
      position: 'fixed', inset: 0,
      background: frame.overlay,
      backdropFilter: 'blur(10px) saturate(0.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(0.6)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 250ms ease',
      padding: S(40),
      overscrollBehavior: 'contain',
    }}
    onClick={onClose}
    >
      <div className="person-detail-card" style={{
        width: S(1280), maxWidth: '100%', height: '90vh',
        display: 'grid', gridTemplateColumns: `${S(380)} 1fr`,
        gap: S(28), position: 'relative',
        padding: S(22), background: frame.bg,
        border: `1px solid #D2B773`,                  // BRAND.brass
        boxShadow: '0 0 0 1px rgba(0,0,0,.6), 0 30px 90px rgba(0,0,0,.85), 0 0 60px rgba(210,183,115,.18)',
        animation: 'popIn 400ms cubic-bezier(.2,.7,.3,1.1)',
      }}
      onClick={e => e.stopPropagation()}
      >
        {/* левая — портрет + имя + флаг (фиксированная, не скроллится).
             Цвет — из CARD_VARIANTS (бренд RAL). */}
        <div style={{
          background: card.bg,
          border: `1px solid ${card.rule}`,
          padding: S(18),
          boxShadow: '0 20px 50px rgba(0,0,0,.8)',
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          color: card.ink,
        }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1.3', overflow: 'hidden', background: '#F7F9EF', flexShrink: 0 }}>
            {person.portrait && !leadFailed ? (
              <img src={person.portrait} alt=""
                onError={() => setLeadFailed(true)}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                  display: 'block', filter: 'sepia(0.15) contrast(1.04)',
                }}/>
            ) : (
              <>
                <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
                  {/* Светлый placeholder (бренд: paper-white → telegrey4 → slate-window). */}
                  <defs>
                    <radialGradient id={`mbg-${person.id}`} cx="50%" cy="35%" r="80%">
                      <stop offset="0%" stopColor="#F7F9EF"/>
                      <stop offset="60%" stopColor="#CFD0CF"/>
                      <stop offset="100%" stopColor="#9DA3A6"/>
                    </radialGradient>
                  </defs>
                  <rect width="100" height="130" fill={`url(#mbg-${person.id})`}/>
                  <path d="M 15 130 Q 15 85 32 77 Q 40 74 42 68 Q 34 64 34 48 Q 34 28 50 28 Q 66 28 66 48 Q 66 64 58 68 Q 60 74 68 77 Q 85 85 85 130 Z"
                    fill="#555D61"/>
                  <path d="M 15 130 L 15 113 Q 50 96 85 113 L 85 130 Z"
                    fill="#5D6970"/>
                </svg>
                <div style={{
                  position: 'absolute', top: S(10), left: S(10),
                  fontFamily: fonts.mono, fontSize: S(10), color: '#435059',
                  letterSpacing: '0.2em', textShadow: '0 1px 2px rgba(247,249,239,0.6)',
                }}>
                  {lang === 'ru' ? '[фотография отсутствует]' : '[photograph missing]'}
                </div>
              </>
            )}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(91deg, rgba(0,0,0,.1) 0 1px, transparent 1px 3px)',
            }}/>
          </div>
          <div style={{ marginTop: S(14), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <SideFlag side={person.side} lang={lang}/>
            <div style={{ fontFamily: fonts.mono, fontSize: S(11), color: card.muted, letterSpacing: '0.15em' }}>
              {person.years}
            </div>
          </div>
          <div style={{
            marginTop: S(14), fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.25em',
            color: card.muted, textTransform: 'uppercase',
          }}>{d.name}</div>
          <div style={{
            fontFamily: fonts.display,
            fontSize: S(38), lineHeight: 0.95, color: card.ink, marginTop: S(2),
            letterSpacing: '-0.01em',
          }}>{d.sur}</div>
          <div style={{
            marginTop: S(10), fontFamily: fonts.stamp, fontSize: S(13),
            color: card.accent, letterSpacing: '0.06em',
          }}>· {d.tag}</div>
          <div style={{ flex: 1 }}/>

          {/* Переключатель режима показа — только если есть фото */}
          {photos.length > 0 && (
            <div style={{
              marginTop: S(18), display: 'flex', flexDirection: 'column', gap: S(6),
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: S(9), letterSpacing: '0.32em',
                color: card.muted, textTransform: 'uppercase',
              }}>
                {lang === 'ru' ? 'Раскладка' : 'Layout'}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                border: `1px solid ${card.rule}`,
              }}>
                {[
                  { id: 'flow',    ru: 'Подряд',  en: 'Flow' },
                  { id: 'gallery', ru: 'Галерея', en: 'Gallery' },
                ].map(m => {
                  const active = viewMode === m.id;
                  return (
                    <button key={m.id} onClick={() => setViewMode(m.id)} style={{
                      padding: S('10px 8px'),
                      fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      background: active ? card.ink : 'transparent',
                      color: active ? card.bg : card.ink,
                      border: 'none', cursor: 'pointer',
                    }}>{m[lang]}</button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={onClose} style={{
            marginTop: S(14), background: 'transparent',
            border: `1px solid ${card.rule}`,
            color: card.ink, padding: S('12px 22px'),
            fontFamily: fonts.mono, fontSize: S(12),
            letterSpacing: '0.3em', textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {lang === 'ru' ? '← назад' : '← back'}
          </button>
        </div>

        {/* правая — режим 'flow' (всё в одной скролл-области) или
                       'gallery' (текст скроллится, фото-полоса прибита снизу) */}
        <div style={{
          display: 'grid',
          gridTemplateRows: viewMode === 'gallery' && photos.length > 0 ? '1fr auto' : '1fr',
          gap: S(16), minHeight: 0, overflow: 'hidden',
        }}>
          <div className="brand-scroll" style={{
            color: textInk,
            background: textBg,
            paddingTop: hasTextBg ? 16 : 4,
            paddingRight: hasTextBg ? 18 : 18,
            paddingLeft: hasTextBg ? 18 : 0,
            paddingBottom: hasTextBg ? 18 : 0,
            border: hasTextBg ? `1px solid rgba(0,0,0,0.18)` : 'none',
            overflowY: 'auto', overflowX: 'hidden', minHeight: 0,
            overscrollBehavior: 'contain',
          }}>
            <div style={{
              fontFamily: fonts.mono, fontSize: S(12), letterSpacing: '0.3em',
              color: meta.accent, textTransform: 'uppercase',
            }}>{d.role}</div>

            <div style={{
              marginTop: S(22), fontFamily: fonts.body, fontSize: S(18),
              color: textInk, lineHeight: 1.6, maxWidth: S(720),
              textWrap: 'pretty',
            }}>
              {(d.bio || '').split(/\n\s*\n/).map((p, i) => (
                <p key={i} style={{ margin: i === 0 ? '0 0 0.85em' : '0.85em 0' }}>{richText(p, meta.accent)}</p>
              ))}
            </div>

            {d.facts && d.facts.length > 0 && (
              <div style={{
                marginTop: S(28), display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: S('10px 28px'), maxWidth: S(720),
              }}>
                {d.facts.map((f, i) => (
                  <div key={i} style={{
                    fontFamily: fonts.mono, fontSize: S(13),
                    color: textInk, lineHeight: 1.4,
                    paddingLeft: S(14), position: 'relative',
                    borderLeft: `2px solid ${meta.accent}`,
                    paddingTop: S(2), paddingBottom: S(2),
                  }}>{f}</div>
                ))}
              </div>
            )}

            {/* Фото-сетка во flow-режиме (полная, с подписями под каждым) */}
            {viewMode === 'flow' && photos.length > 0 && (
              <div style={{ marginTop: S(36) }}>
                <div style={{
                  fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.3em',
                  color: theme.ochre, textTransform: 'uppercase', marginBottom: S(14),
                }}>
                  {lang === 'ru' ? 'Фотодокументы и предметы — нажмите для увеличения' : 'Photographs and objects — tap to enlarge'}
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${S(200)}, 1fr))`,
                  gap: S(18), maxWidth: S(820),
                }}>
                  {photos.map((ph, i) => (
                    <figure key={i} style={{ margin: 0 }}>
                      <button onClick={ph.src ? () => setLightboxIdx(i) : undefined} disabled={!ph.src} style={{
                      // Без производной открывать нечего — лайтбокс дал бы пустой экран.
                      cursor: ph.src ? 'pointer' : 'default',
                        display: 'block', width: '100%', padding: 0, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                      }}>
                        <div style={{
                          width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                          background: '#1a0d05',
                          border: `1px solid ${theme.inkSoft}`,
                        }}>
                          <PhotoFrame photo={ph} lang={lang}/>
                        </div>
                      </button>
                      <figcaption style={{
                        marginTop: S(8), fontFamily: fonts.body, fontSize: S(12),
                        color: theme.paperDim, lineHeight: 1.4,
                      }}>{ph[lang]}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Прибитая фото-полоса в gallery-режиме */}
          {viewMode === 'gallery' && photos.length > 0 && (
            <div style={{
              borderTop: `1px solid ${theme.inkFade}55`,
              paddingTop: S(14),
              minHeight: 0,
            }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: S(10), letterSpacing: '0.3em',
                color: theme.ochre, textTransform: 'uppercase', marginBottom: S(10),
              }}>
                {lang === 'ru' ? 'Фотодокументы — нажмите для увеличения' : 'Photographs — tap to enlarge'}
              </div>
              <div style={{
                display: 'grid',
                // Фиксированный шаг под максимум 5 фото — если фото меньше,
                // они занимают левую часть, не растягиваются на всю ширину
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: S(12),
              }}>
                {photos.map((ph, i) => (
                  <figure key={i} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <button onClick={ph.src ? () => setLightboxIdx(i) : undefined} disabled={!ph.src} style={{
                      // Без производной открывать нечего — лайтбокс дал бы пустой экран.
                      cursor: ph.src ? 'pointer' : 'default',
                      display: 'block', width: '100%', padding: 0, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                    }} title={ph[lang]}>
                      <div style={{
                        width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                        background: '#1a0d05',
                        border: `1px solid ${theme.inkSoft}`,
                      }}>
                        <PhotoFrame photo={ph} lang={lang}/>
                      </div>
                    </button>
                    <figcaption style={{
                      marginTop: S(6), fontFamily: fonts.body, fontSize: S(11),
                      color: theme.paperDim, lineHeight: 1.35,
                      // обрезаем до 3 строк — полная подпись доступна в лайтбоксе
                      display: '-webkit-box', WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3, overflow: 'hidden',
                    }}>{ph[lang]}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxIdx !== null && photos[lightboxIdx] && (
        <PhotoLightbox
          photo={photos[lightboxIdx]}
          lang={lang}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIdx(i => Math.min(photos.length - 1, i + 1))}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < photos.length - 1}
        />
      )}
    </div>
  );
}

function PersonalitiesApp() {
  const [lang, setLang] = React.useState(() => {
    try { return localStorage.getItem('expo:lang') || 'ru'; } catch { return 'ru'; }
  });
  const [filter, setFilter] = React.useState('all');
  const [openId, setOpenId] = React.useState(null);
  const [lightboxIdx, setLightboxIdx] = React.useState(null);
  const [bgVariant, setBgVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleBg') || 'iron'; } catch { return 'iron'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleBg', bgVariant); } catch {} }, [bgVariant]);

  const [headerVariant, setHeaderVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleHeader') || 'black'; } catch { return 'black'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleHeader', headerVariant); } catch {} }, [headerVariant]);
  const headerCfg = HEADER_VARIANTS[headerVariant] || HEADER_VARIANTS.black;
  const headerInk = headerCfg.inkOnLight ? '#000' : '#F7F9EF';
  const headerInkDim = headerCfg.inkOnLight ? 'rgba(0,0,0,0.55)' : 'rgba(247,249,239,0.62)';

  const [cardVariant, setCardVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleCard') || 'paper'; } catch { return 'paper'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleCard', cardVariant); } catch {} }, [cardVariant]);
  const cardCfg = CARD_VARIANTS[cardVariant] || CARD_VARIANTS.paper;

  const [textBgVariant, setTextBgVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleTextBg') || 'transparent'; } catch { return 'transparent'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleTextBg', textBgVariant); } catch {} }, [textBgVariant]);
  const textBgCfg = TEXT_BG_VARIANTS[textBgVariant] || TEXT_BG_VARIANTS.transparent;

  const [textInkVariant, setTextInkVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleTextInk') || 'paperWhite'; } catch { return 'paperWhite'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleTextInk', textInkVariant); } catch {} }, [textInkVariant]);
  const textInkCfg = TEXT_INK_VARIANTS[textInkVariant] || TEXT_INK_VARIANTS.paperWhite;

  const [frameVariant, setFrameVariant] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleFrame') || 'graphiteSoft'; } catch { return 'graphiteSoft'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleFrame', frameVariant); } catch {} }, [frameVariant]);
  const frameCfg = FRAME_VARIANTS[frameVariant] || FRAME_VARIANTS.graphiteSoft;

  React.useEffect(() => { try { localStorage.setItem('expo:lang', lang); } catch {} }, [lang]);

  // Sync языка с родителем-экспозицией и другими открытыми iframes.
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'expo:lang' && e.newValue && e.newValue !== lang) setLang(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [lang]);

  // Когда родитель снова открывает наш раздел — сбрасываем drill-down (открытую карточку),
  // чтобы пользователь видел сам список, а не последнюю карточку.
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data === 'mtk29:section-opened') { setOpenId(null); setLightboxIdx(null); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Esc и стрелки — ниже, после загрузки справки: обработчику нужно знать,
  // сколько у открытой персоны фотографий.

  // При смене персоны — лайтбокс закрываем
  React.useEffect(() => { if (!openId) setLightboxIdx(null); }, [openId]);

  // ── Данные ───────────────────────────────────────────────────────────────
  // Плитки — из одного _index.json, справка — по тапу. Раньше здесь лежал
  // window.People: 17 человек, вбитых руками в people-data.js. Теперь 78
  // записей импорта, и грузить их все разом незачем — индекс самодостаточен.
  const [people, setPeople] = React.useState([]);
  const [indexError, setIndexError] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    window.MTK_PERSONS.loadIndex().then(list => {
      if (!alive) return;
      // псевдослучайный наклон, стабильный по позиции
      setPeople(list.map((p, i) => ({
        ...p,
        _rot: [-2.5, 1.8, -1, 2.2, -1.5, .9, -2.1, 1.4, -.8, 2.5, -1.9, 1.1, -2.2, .7, -1.3, 2][i % 16],
      })));
    }).catch(err => { if (alive) setIndexError(err); });
    return () => { alive = false; };
  }, []);

  // Справка подгружается по тапу и остаётся в памяти модуля.
  const [opened, setOpened] = React.useState(null);
  const [openError, setOpenError] = React.useState(null);
  React.useEffect(() => {
    if (!openId) { setOpened(null); setOpenError(null); return; }
    let alive = true;
    setOpenError(null);
    window.MTK_PERSONS.loadPerson(openId)
      .then(p => { if (alive) setOpened({ ...p, _rot: 0 }); })
      .catch(err => { if (alive) { setOpened(null); setOpenError(err); } });
    return () => { alive = false; };
  }, [openId]);

  const shown = filter === 'all'
    ? people
    : filter === 'none'
      ? people.filter(p => !p.side)
      : people.filter(p => p.side === filter);

  // ── Алфавитный указатель ─────────────────────────────────────────────────
  // 70 плиток без него листаются вслепую: посетитель ищет фамилию глазами
  // по всей сетке, а на 4K это ещё и физически дальше — до нижнего края
  // экрана полметра. Буквы берём из того, что реально показано: при фильтре
  // по лагерю их становится меньше, и пустых кнопок быть не должно.
  const scrollRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const headerRef = React.useRef(null);

  const letters = React.useMemo(() => {
    const seen = new Map();
    shown.forEach((p, i) => {
      const ch = (p.sortKey || p.title || '').charAt(0).toUpperCase();
      if (ch && !seen.has(ch)) seen.set(ch, i);
    });
    return [...seen.entries()]
      .map(([ch, i]) => [ch, i, shown[i].id])
      .sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }, [shown]);

  // Подсветка цели прыжка. Без неё указатель выглядит сломанным: при семи
  // колонках первые буквы попадают в верхний ряд, экран не двигается, и тап
  // по «Б» внешне ничем не отличается от нажатия на мёртвую кнопку.
  const [flashId, setFlashId] = React.useState(null);
  const flashTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(flashTimer.current), []);

  const jumpToLetter = React.useCallback((firstIndex, id) => {
    setFlashId(id);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1100);
    const scroller = scrollRef.current, grid = gridRef.current;
    if (!scroller || !grid) return;
    const tile = grid.children[firstIndex];
    if (!tile) return;
    // scrollIntoView увёл бы плитку под липкую шапку — считаем сами.
    const headH = headerRef.current ? headerRef.current.offsetHeight : 0;
    // Прокручиваем мгновенно, а не behavior:'smooth'. Плавную анимацию
    // браузер выключает при prefers-reduced-motion и замораживает, когда
    // вкладка не на переднем плане, — и тогда указатель просто не работает,
    // без всякой ошибки. Проверено: smooth здесь не сдвинул ничего, прямая
    // запись scrollTop сработала. Прыжок на киоске к тому же честнее:
    // посетителю не надо ждать, пока доедет.
    scroller.scrollTop = Math.max(0, tile.offsetTop - headH - 20);
  }, []);

  // Esc: сначала закрывает лайтбокс, затем модалку. Стрелки — навигация по фото.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else if (openId) setOpenId(null);
      } else if (lightboxIdx !== null) {
        const photos = (opened && opened.photos) || [];
        if (e.key === 'ArrowLeft' && lightboxIdx > 0) setLightboxIdx(i => i - 1);
        else if (e.key === 'ArrowRight' && lightboxIdx < photos.length - 1) setLightboxIdx(i => i + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, openId, opened]);

  return (
    <div ref={scrollRef} className="brand-scroll" style={{
      position: 'absolute', inset: 0,
      ...bgForVariant(bgVariant),
      overflow: opened ? 'hidden' : 'auto',
      // тач-стол: scroll-chain не должен уносить открытую карточку
      overscrollBehavior: 'contain',
      color: theme.paper,
      paddingBottom: S(80),
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: rotate(0deg) translateY(22px); } }
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.92); } }

        /* видимый скроллбар на тач-столе — пользователь должен понимать, что блок скроллится */
        .brand-scroll {
          scrollbar-width: auto;
          scrollbar-color: ${theme.brass} rgba(0,0,0,0.45);
        }
        .brand-scroll::-webkit-scrollbar { width: 14px; height: 14px; }
        .brand-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.45);
          border-left: 1px solid ${theme.inkFade};
        }
        .brand-scroll::-webkit-scrollbar-thumb {
          background: ${theme.brass};
          border: 3px solid rgba(0,0,0,0.45);
          border-radius: 8px;
          min-height: 60px;
        }
        .brand-scroll::-webkit-scrollbar-thumb:active { background: ${theme.ochre}; }
      `}</style>

      {/* HEADER (TOP BAR + FILTERS) — единый sticky-блок,
           не двигается при скролле списка. Цвет — из BRAND-палитры,
           переключатель ниже фильтров. */}
      <div ref={headerRef} style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: headerCfg.bg,
        backdropFilter: 'blur(6px) saturate(0.9)',
        WebkitBackdropFilter: 'blur(6px) saturate(0.9)',
        boxShadow: '0 2px 0 rgba(0,0,0,0.4), 0 14px 24px rgba(0,0,0,0.45)',
        borderBottom: `1px solid ${headerCfg.border}`,
      }}>
      <div style={{
        padding: S('24px 40px 18px'),
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: S(24),
      }}>
        <div>
          <div style={{
            fontFamily: fonts.mono, fontSize: S(12), letterSpacing: '0.35em',
            color: '#D2B773', textTransform: 'uppercase',  // BRAND.brass — RAL 1002
          }}>
            {lang === 'ru' ? 'Музей В.И. Ленина · Гражданская война' : 'Lenin Museum · Russian Civil War'}
          </div>
          <div style={{
            fontFamily: fonts.display,
            fontSize: S(52), lineHeight: 1, color: headerInk, marginTop: S(6),
            letterSpacing: '-0.01em',
          }}>{lang === 'ru' ? 'Персоналіи. 1917—1922' : 'People. 1917—1922'}</div>
        </div>

        <div style={{ display: 'flex', gap: S(14), alignItems: 'center' }}>
          <a href="index.html" style={{
            // «к экспозиции» — основная навигация, ≥120 px (§1).
            minHeight: S('var(--touch-hit, 120px)'), padding: S('0 24px'),
            display: 'inline-flex', alignItems: 'center',
            fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.25em',
            color: headerInkDim, textDecoration: 'none',
            border: `1px solid ${headerInkDim}`,
            textTransform: 'uppercase',
          }}
            onClick={e => {
              if (window.parent !== window) {
                e.preventDefault();
                window.parent.postMessage('mtk29:close-section', '*');
              }
            }}
          >
            ← {lang === 'ru' ? 'къ экспозиціи' : 'to the exhibit'}
          </a>
          <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} style={{
            // Переключатель языка — основная навигация, ≥120 px (§1).
            minWidth: S(120), minHeight: S('var(--touch-hit, 120px)'), padding: S('0 24px'),
            fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.25em',
            color: headerInk, background: 'transparent',
            border: `1px solid #D2B773`,  // BRAND.brass border
            textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
      </div>

      {/* FILTERS — внутри того же sticky-блока, прибиты к шапке.
           Цвета лагерей — bg signalRed/telegrey4/brass из BRAND. */}
      <div style={{
        padding: S('0 40px 18px'), display: 'flex', gap: S(10), flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Пятая кнопка — для записей без лагеря: импорт берёт camp из справки,
            и у части персон его нет. Без неё они не отбираются ничем, кроме
            «Всѣ», и выглядят потерянными. Кнопки с нулём не показываем,
            поэтому когда content проставит лагерь всем, она исчезнет сама. */}
        {campFilters(people).map(f => {
          const active = filter === f.id;
          const activeText = isLight(f.brand) ? '#000' : '#F7F9EF';
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              // Фильтр лагеря — управляющий элемент раздела, ≥64 px (§1).
              minHeight: S(64), padding: S('0 20px'),
              fontFamily: fonts.mono, fontSize: S(12), letterSpacing: '0.2em',
              background: active ? f.brand : 'transparent',
              color: active ? activeText : headerInkDim,
              border: `1px solid ${active ? f.brand : headerInkDim}`,
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: S(8),
            }}>
              {f[lang]}
              <span style={{ fontSize: S(10), opacity: .7 }}>· {f.count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }}/>
        <div style={{
          fontFamily: fonts.mono, fontSize: S(11), letterSpacing: '0.2em',
          color: headerInkDim, textTransform: 'uppercase',
        }}>
          {lang === 'ru' ? 'Нажмите карточку — откроется справка' : 'Tap a card — opens a dossier'}
        </div>
      </div>

      {/* УКАЗАТЕЛЬ. Буквы русские при любом языке интерфейса: фамилии
          приходят из контента и остаются русскими — латинский указатель
          к ним не привёл бы никуда. */}
      {letters.length > 1 && (
        <div style={{
          padding: S('0 40px 16px'), display: 'flex', gap: S(4), flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {letters.map(([ch, firstIndex, firstId]) => (
            <button key={ch} onClick={() => jumpToLetter(firstIndex, firstId)} style={{
              // Управляющий элемент раздела — ≥64 px (§1).
              minWidth: S(64), minHeight: S(64),
              fontFamily: fonts.display, fontSize: S(22), lineHeight: 1,
              color: headerInk, background: 'transparent',
              border: `1px solid ${headerInkDim}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{ch}</button>
          ))}
        </div>
      )}

      </div>

      {/* GRID */}
      <div ref={gridRef} style={{
        padding: S('28px 40px 120px'),
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${S(220)}, 1fr))`,
        gap: S('28px 22px'),
        maxWidth: S(1800), margin: '0 auto',
      }}>
        {shown.map((p, i) => (
          <PersonCard key={p.id} person={p} lang={lang} flash={p.id === flashId}
            // Анимацию въезда лесенкой держим короткой: при 78 плитках
            // прежние 45 мс на карточку растягивали появление на 3,5 с.
            delay={Math.min(i, 12) * 45}
            onOpen={p.stub ? null : () => setOpenId(p.id)}/>
        ))}
      </div>

      {indexError && (
        <div style={{
          padding: S('40px'), fontFamily: fonts.mono, fontSize: S(14),
          color: theme.brass, letterSpacing: '0.1em',
        }}>
          {lang === 'ru' ? 'Не удалось загрузить списокъ персоналій: ' : 'Could not load the list of people: '}
          {String(indexError.message || indexError)}
        </div>
      )}

      {/* Справка едет по сети — без этого тап по карточке выглядит мёртвым. */}
      {openId && !opened && !openError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,6,3,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fonts.mono, fontSize: S(13), letterSpacing: '0.3em',
          color: theme.brass, textTransform: 'uppercase',
        }} onClick={() => setOpenId(null)}>
          {lang === 'ru' ? 'загружаемъ справку…' : 'loading dossier…'}
        </div>
      )}
      {openId && openError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,6,3,0.82)',
          display: 'flex', flexDirection: 'column', gap: S(18),
          alignItems: 'center', justifyContent: 'center',
          fontFamily: fonts.mono, fontSize: S(13), letterSpacing: '0.2em',
          color: theme.brass, textAlign: 'center', padding: S(40),
        }} onClick={() => setOpenId(null)}>
          <div>{lang === 'ru' ? 'Справка не открылась' : 'Dossier failed to open'}</div>
          <div style={{ fontSize: S(11), opacity: .7 }}>{String(openError.message || openError)}</div>
          <div style={{ fontSize: S(11), opacity: .7 }}>{lang === 'ru' ? 'нажмите, чтобы закрыть' : 'tap to close'}</div>
        </div>
      )}

      {opened && <PersonDetail person={opened} lang={lang}
        onClose={() => setOpenId(null)}
        lightboxIdx={lightboxIdx} setLightboxIdx={setLightboxIdx}
        cardCfg={cardCfg}
        textBgCfg={textBgCfg} textInkCfg={textInkCfg}
        frameCfg={frameCfg}/>}

    </div>
  );
}

window.PersonalitiesApp = PersonalitiesApp;
