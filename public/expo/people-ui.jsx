// Персоналии Гражданской войны — UI

const SIDE_META = {
  red:   { ru: 'Красные',    en: 'Reds',         color: '#b23028', accent: '#d94a36', flag: '#a01818' },
  white: { ru: 'Белые',      en: 'Whites',       color: '#2a3d5e', accent: '#4a6290', flag: '#1a2238' },
  green: { ru: 'Третья сила',en: 'Third force',  color: '#4d5a28', accent: '#6a7a3a', flag: '#3a4418' },
};

// Бренд-токены (PDF-гайд RAL, через theme.js). Используются для бренд-акцентов
// (флаг лагеря, page-header, бренд-pill); локальные `theme.X` — наши тёплые
// решения поверх (старина, дерево, виньетка карточки).
const BRAND = (typeof window !== 'undefined' && window.BRAND_THEME) || {
  inkBlack: '#000000', paperWhite: '#F7F9EF', brass: '#D2B773',
  signalRed: '#A02128', slateBlue: '#5D6970', slateWindow: '#9DA3A6',
  ironGrey: '#555D61', graphite: '#435059', telegrey4: '#CFD0CF',
};

const theme = {
  // Главные бренд-акценты — RAL по PDF-гайду
  ink:      BRAND.inkBlack,    // RAL 9005
  brass:    BRAND.brass,       // RAL 1002
  redDeep:  BRAND.signalRed,   // RAL 3001 — лагерь «Красные»
  // Тёплая «материальная» палитра карточки персоналии (старая бумага, виньетка)
  bg:       '#120803',         // тёмное сукно стола
  bgDeep:   '#0a0502',
  paper:    '#e8d4a8',         // тёплая бумага карточки
  paperLit: '#f2e1b4',         // светлая
  paperDim: '#c8b488',         // тень
  inkSoft:  '#3a2010',         // длинный текст
  inkFade:  '#6a4a20',         // мета
  ochre:    '#c88a40',         // акцент-охра
};

// Фирменные шрифты Ленин-центра (см. docs/brand.md, tokens.css).
const fonts = {
  display: "'Nolde', 'Playfair Display', Georgia, serif",
  body:    "'21 Cent', 'PT Serif', Georgia, serif",
  stamp:   "'20 Kopeek', 'Special Elite', monospace",
  mono:    "'20 Kopeek', 'JetBrains Mono', 'Courier New', monospace",
};

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
};

function bgForVariant(variant) {
  const v = BG_VARIANTS[variant] || BG_VARIANTS.iron;
  return v.style;
}

// Плавающая панель настроек внешнего вида — всегда видна справа.
// Содержит 3 группы переключателей: ШАПКА / ФОН СПИСКА / БОЛЬШАЯ КАРТОЧКА.
// Свёртывается в узкую полосу-«вкладку» по тапу на шеврон.
function SettingsPanel({ lang,
  headerVariant, setHeaderVariant,
  bgVariant, setBgVariant,
  cardVariant, setCardVariant,
}) {
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem('expo:settingsOpen') !== '0'; } catch { return true; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:settingsOpen', open ? '1' : '0'); } catch {} }, [open]);

  const groups = [
    { ru: 'Шапка',    en: 'Header', variants: HEADER_VARIANTS, value: headerVariant, set: setHeaderVariant },
    { ru: 'Фон',      en: 'Bg',     variants: BG_VARIANTS,     value: bgVariant,     set: setBgVariant },
    { ru: 'Карточка', en: 'Card',   variants: CARD_VARIANTS,   value: cardVariant,   set: setCardVariant },
  ];

  // pill-кнопка варианта
  const pill = (id, label, active, onClick, swatch) => (
    <button key={id} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', textAlign: 'left',
      padding: '7px 10px',
      background: active ? '#D2B773' : 'transparent',
      color: active ? '#000' : '#F7F9EF',
      border: `1px solid ${active ? '#D2B773' : 'rgba(210,183,115,0.45)'}`,
      borderRadius: 30,
      fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.18em',
      textTransform: 'uppercase', cursor: 'pointer',
    }}>
      {swatch && <span style={{
        width: 10, height: 10, borderRadius: 2, flexShrink: 0,
        background: swatch, border: '1px solid rgba(0,0,0,0.35)',
      }}/>}
      <span style={{ flex: 1, lineHeight: 1.15 }}>{label}</span>
    </button>
  );

  return (
    <div style={{
      position: 'fixed', top: 96, right: open ? 12 : 0, zIndex: 90,
      transition: 'right 220ms ease',
      pointerEvents: 'auto',
    }}>
      {/* Tab to collapse/expand */}
      <button onClick={() => setOpen(o => !o)} title={lang === 'ru' ? 'Настройки' : 'Settings'} style={{
        position: 'absolute', top: 0, right: open ? 'auto' : 0,
        left: open ? -32 : 'auto',
        width: 32, height: 56,
        background: '#000', color: '#D2B773',
        border: '1px solid #D2B773',
        borderRight: open ? 'none' : '1px solid #D2B773',
        borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
        fontFamily: fonts.mono, fontSize: 18, lineHeight: 1,
        cursor: 'pointer',
      }}>{open ? '›' : '‹'}</button>

      {open && (
        <div style={{
          width: 230,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid #D2B773',
          borderRadius: 6,
          padding: '14px 12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.65)',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
        }} className="brand-scroll">
          <div style={{
            fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.32em',
            color: '#D2B773', textTransform: 'uppercase',
            marginBottom: 10, paddingBottom: 8,
            borderBottom: '1px solid rgba(210,183,115,0.35)',
          }}>
            {lang === 'ru' ? '◇ Стиль' : '◇ Style'}
          </div>
          {groups.map((g, gi) => (
            <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 14 : 0 }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.28em',
                color: 'rgba(247,249,239,0.55)', textTransform: 'uppercase',
                marginBottom: 6,
              }}>{g[lang]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {Object.entries(g.variants).map(([id, v]) =>
                  pill(id, v[lang], g.value === id, () => g.set(id),
                    // swatch — bg цвет варианта (для card / header это hex)
                    v.bg || (v.style && (typeof v.style.background === 'string' ? v.style.background : null)) || null)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const meta = SIDE_META[side];
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
  const meta = SIDE_META[side];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px 4px 6px',
      background: meta.flag, color: '#f0dcae',
      fontFamily: fonts.mono, fontSize: 11,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)',
      paddingRight: 18,
    }}>
      <span style={{ width: 10, height: 10, background: '#f0dcae', opacity: .85 }}/>
      {meta[lang]}
    </div>
  );
}

// Карточка-миниатюра персоналии
function PersonCard({ person, lang, onOpen, delay }) {
  const d = person[lang];
  const meta = SIDE_META[person.side];
  return (
    <button onClick={onOpen} style={{
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
    }}
    >
      <div style={{
        ...paperFill(),
        border: `1px solid ${theme.inkFade}`,
        padding: 10,
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
          background: '#1a0d05',
          border: `1px solid ${theme.inkSoft}`,
          marginBottom: 10,
        }}>
          {person.portrait ? (
            <img src={person.portrait} alt="" loading="lazy" style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
              display: 'block', filter: 'sepia(0.18) contrast(1.05)',
            }}/>
          ) : (
            <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"
              style={{ width: '100%', height: '100%', display: 'block' }}>
              {/* Чёрно-белый плейсхолдер: bg = bell от slate-window до ink-black,
                  силуэт чёрный, плечо — без цвета лагеря (серое). */}
              <defs>
                <radialGradient id={`pbg-${person.id}`} cx="50%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#9DA3A6"/>
                  <stop offset="55%" stopColor="#555D61"/>
                  <stop offset="100%" stopColor="#000000"/>
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="100" height="125" fill={`url(#pbg-${person.id})`}/>
              <path d="M 15 125 Q 15 82 32 74 Q 40 72 42 66 Q 34 62 34 47 Q 34 28 50 28 Q 66 28 66 47 Q 66 62 58 66 Q 60 72 68 74 Q 85 82 85 125 Z"
                fill="#000000"/>
              <path d="M 15 125 L 15 110 Q 50 95 85 110 L 85 125 Z"
                fill="#435059"/>
            </svg>
          )}
          {/* грейн */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(91deg, rgba(0,0,0,.08) 0 1px, transparent 1px 3px)',
          }}/>
          {/* годы */}
          <div style={{
            position: 'absolute', bottom: 6, left: 8,
            fontFamily: fonts.mono, fontSize: 10, color: '#f0dcae', letterSpacing: '0.15em',
            textShadow: '0 1px 2px #000',
          }}>{person.years}</div>
        </div>

        {/* имя */}
        <div style={{
          fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.25em',
          color: theme.inkFade, textTransform: 'uppercase',
        }}>{d.name}</div>
        <div style={{
          fontFamily: fonts.display, fontStyle: 'italic',
          fontSize: 24, lineHeight: 1, color: theme.ink, marginTop: 2,
        }}>{d.sur}</div>
        <div style={{
          marginTop: 8, fontFamily: fonts.body, fontSize: 12,
          color: theme.inkSoft, lineHeight: 1.3,
        }}>{d.role}</div>
        <div style={{
          marginTop: 4, fontFamily: fonts.stamp, fontSize: 11,
          color: meta.color, letterSpacing: '0.05em',
        }}>{d.tag}</div>
      </div>
    </button>
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
        padding: '40px 80px 20px', minHeight: 0,
      }}>
        <img src={photo.src} alt="" style={{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
          filter: 'sepia(0.08) contrast(1.04)',
          boxShadow: '0 30px 80px rgba(0,0,0,.9)',
        }} onClick={e => e.stopPropagation()}/>
      </div>
      <div style={{
        padding: '14px 80px 32px',
        fontFamily: fonts.body, fontSize: 16, lineHeight: 1.5,
        color: theme.paperLit, textAlign: 'center', maxWidth: 1100, margin: '0 auto',
      }} onClick={e => e.stopPropagation()}>{photo[lang]}</div>

      {/* кнопки */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
        position: 'absolute', top: 24, right: 24,
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: 56, height: 56,
        fontFamily: fonts.mono, fontSize: 22,
      }}>×</button>
      {hasPrev && <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: 56, height: 56,
        fontFamily: fonts.mono, fontSize: 22,
      }}>‹</button>}
      {hasNext && <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: `1px solid ${theme.paperDim}`,
        color: theme.paper, width: 56, height: 56,
        fontFamily: fonts.mono, fontSize: 22,
      }}>›</button>}
    </div>
  );
}

// Модальная карточка с подробностями
function PersonDetail({ person, lang, onClose, lightboxIdx, setLightboxIdx, cardCfg }) {
  const card = cardCfg || CARD_VARIANTS.paper;
  const d = person[lang];
  const meta = SIDE_META[person.side];
  const photos = person.photos || [];

  // Режим раскладки правой колонки:
  //   'flow'    — текст и фото-галерея в одном скроллящемся блоке (как было)
  //   'gallery' — текст скроллится сверху, фото-полоса прибита снизу
  const [viewMode, setViewMode] = React.useState(() => {
    try { return localStorage.getItem('expo:peopleViewMode') || 'flow'; } catch { return 'flow'; }
  });
  React.useEffect(() => { try { localStorage.setItem('expo:peopleViewMode', viewMode); } catch {} }, [viewMode]);

  if (!person) return null;
  return (
    <div style={{
      // fixed — модалка приколочена к viewport iframe и не зависит
      // от scrollTop фонового списка персоналий ни при каких условиях.
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.78)',  // BRAND.inkBlack overlay
      backdropFilter: 'blur(10px) saturate(0.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(0.6)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 250ms ease',
      padding: 40,
      overscrollBehavior: 'contain',
    }}
    onClick={onClose}
    >
      <div className="person-detail-card" style={{
        width: 1280, maxWidth: '100%', height: '90vh',
        display: 'grid', gridTemplateColumns: '380px 1fr',
        gap: 28, position: 'relative',
        padding: 22, background: 'rgba(0,0,0,0.65)',  // BRAND.inkBlack frame
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
          padding: 18,
          boxShadow: '0 20px 50px rgba(0,0,0,.8)',
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          color: card.ink,
        }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1.3', overflow: 'hidden', background: '#1a0d05', flexShrink: 0 }}>
            {person.portrait ? (
              <img src={person.portrait} alt="" style={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                display: 'block', filter: 'sepia(0.15) contrast(1.04)',
              }}/>
            ) : (
              <>
                <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
                  {/* Чёрно-белый placeholder (бренд: slate-window → iron-grey → black). */}
                  <defs>
                    <radialGradient id={`mbg-${person.id}`} cx="50%" cy="35%" r="70%">
                      <stop offset="0%" stopColor="#9DA3A6"/>
                      <stop offset="55%" stopColor="#555D61"/>
                      <stop offset="100%" stopColor="#000000"/>
                    </radialGradient>
                  </defs>
                  <rect width="100" height="130" fill={`url(#mbg-${person.id})`}/>
                  <path d="M 15 130 Q 15 85 32 77 Q 40 74 42 68 Q 34 64 34 48 Q 34 28 50 28 Q 66 28 66 48 Q 66 64 58 68 Q 60 74 68 77 Q 85 85 85 130 Z"
                    fill="#000000"/>
                  <path d="M 15 130 L 15 113 Q 50 96 85 113 L 85 130 Z"
                    fill="#435059"/>
                </svg>
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  fontFamily: fonts.mono, fontSize: 10, color: '#f0dcae',
                  letterSpacing: '0.2em', textShadow: '0 1px 2px #000',
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
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <SideFlag side={person.side} lang={lang}/>
            <div style={{ fontFamily: fonts.mono, fontSize: 11, color: card.muted, letterSpacing: '0.15em' }}>
              {person.years}
            </div>
          </div>
          <div style={{
            marginTop: 14, fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.25em',
            color: card.muted, textTransform: 'uppercase',
          }}>{d.name}</div>
          <div style={{
            fontFamily: fonts.display, fontStyle: 'italic',
            fontSize: 38, lineHeight: 0.95, color: card.ink, marginTop: 2,
            letterSpacing: '-0.01em',
          }}>{d.sur}</div>
          <div style={{
            marginTop: 10, fontFamily: fonts.stamp, fontSize: 13,
            color: card.accent, letterSpacing: '0.06em',
          }}>· {d.tag}</div>
          <div style={{ flex: 1 }}/>

          {/* Переключатель режима показа — только если есть фото */}
          {photos.length > 0 && (
            <div style={{
              marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6,
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.32em',
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
                      padding: '10px 8px',
                      fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.18em',
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
            marginTop: 14, background: 'transparent',
            border: `1px solid ${card.rule}`,
            color: card.ink, padding: '12px 22px',
            fontFamily: fonts.mono, fontSize: 12,
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
          gap: 16, minHeight: 0, overflow: 'hidden',
        }}>
          <div className="brand-scroll" style={{
            color: theme.paperLit, paddingTop: 4, paddingRight: 18,
            overflowY: 'auto', overflowX: 'hidden', minHeight: 0,
            overscrollBehavior: 'contain',
          }}>
            <div style={{
              fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.3em',
              color: meta.accent, textTransform: 'uppercase',
            }}>{d.role}</div>

            <div style={{
              marginTop: 22, fontFamily: fonts.body, fontSize: 18,
              color: theme.paperLit, lineHeight: 1.6, maxWidth: 720,
              textWrap: 'pretty',
            }}>
              {d.bio.split(/\n\s*\n/).map((p, i) => (
                <p key={i} style={{ margin: i === 0 ? '0 0 0.85em' : '0.85em 0' }}>{p}</p>
              ))}
            </div>

            {d.facts && d.facts.length > 0 && (
              <div style={{
                marginTop: 28, display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px 28px', maxWidth: 720,
              }}>
                {d.facts.map((f, i) => (
                  <div key={i} style={{
                    fontFamily: fonts.mono, fontSize: 13,
                    color: theme.paper, lineHeight: 1.4,
                    paddingLeft: 14, position: 'relative',
                    borderLeft: `2px solid ${meta.accent}`,
                    paddingTop: 2, paddingBottom: 2,
                  }}>{f}</div>
                ))}
              </div>
            )}

            {/* Фото-сетка во flow-режиме (полная, с подписями под каждым) */}
            {viewMode === 'flow' && photos.length > 0 && (
              <div style={{ marginTop: 36 }}>
                <div style={{
                  fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.3em',
                  color: theme.ochre, textTransform: 'uppercase', marginBottom: 14,
                }}>
                  {lang === 'ru' ? 'Фотодокументы и предметы — нажмите для увеличения' : 'Photographs and objects — tap to enlarge'}
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 18, maxWidth: 820,
                }}>
                  {photos.map((ph, i) => (
                    <figure key={i} style={{ margin: 0 }}>
                      <button onClick={() => setLightboxIdx(i)} style={{
                        display: 'block', width: '100%', padding: 0, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                      }}>
                        <div style={{
                          width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                          background: '#1a0d05',
                          border: `1px solid ${theme.inkSoft}`,
                        }}>
                          <img src={ph.src} alt="" loading="lazy" style={{
                            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                            display: 'block', filter: 'sepia(0.12) contrast(1.04)',
                          }}/>
                        </div>
                      </button>
                      <figcaption style={{
                        marginTop: 8, fontFamily: fonts.body, fontSize: 12,
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
              paddingTop: 14,
              minHeight: 0,
            }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.3em',
                color: theme.ochre, textTransform: 'uppercase', marginBottom: 10,
              }}>
                {lang === 'ru' ? 'Фотодокументы — нажмите для увеличения' : 'Photographs — tap to enlarge'}
              </div>
              <div style={{
                display: 'grid',
                // Фиксированный шаг под максимум 5 фото — если фото меньше,
                // они занимают левую часть, не растягиваются на всю ширину
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 12,
              }}>
                {photos.map((ph, i) => (
                  <figure key={i} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => setLightboxIdx(i)} style={{
                      display: 'block', width: '100%', padding: 0, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                    }} title={ph[lang]}>
                      <div style={{
                        width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                        background: '#1a0d05',
                        border: `1px solid ${theme.inkSoft}`,
                      }}>
                        <img src={ph.src} alt="" loading="lazy" style={{
                          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                          display: 'block', filter: 'sepia(0.12) contrast(1.04)',
                        }}/>
                      </div>
                    </button>
                    <figcaption style={{
                      marginTop: 6, fontFamily: fonts.body, fontSize: 11,
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

  // Esc: сначала закрывает лайтбокс, затем модалку. Стрелки — навигация по фото.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else if (openId) setOpenId(null);
      } else if (lightboxIdx !== null) {
        const opened = window.People.find(p => p.id === openId);
        const photos = opened?.photos || [];
        if (e.key === 'ArrowLeft' && lightboxIdx > 0) setLightboxIdx(i => i - 1);
        else if (e.key === 'ArrowRight' && lightboxIdx < photos.length - 1) setLightboxIdx(i => i + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, openId]);

  // При смене персоны — лайтбокс закрываем
  React.useEffect(() => { if (!openId) setLightboxIdx(null); }, [openId]);

  // псевдослучайный наклон, стабильный по id
  const people = React.useMemo(() => window.People.map((p, i) => ({
    ...p,
    _rot: [-2.5, 1.8, -1, 2.2, -1.5, .9, -2.1, 1.4, -.8, 2.5, -1.9, 1.1, -2.2, .7, -1.3, 2][i % 16],
  })), []);

  const shown = filter === 'all' ? people : people.filter(p => p.side === filter);
  const opened = openId ? people.find(p => p.id === openId) : null;

  return (
    <div className="brand-scroll" style={{
      position: 'absolute', inset: 0,
      ...bgForVariant(bgVariant),
      overflow: opened ? 'hidden' : 'auto',
      // тач-стол: scroll-chain не должен уносить открытую карточку
      overscrollBehavior: 'contain',
      color: theme.paper,
      paddingBottom: 80,
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
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: headerCfg.bg,
        backdropFilter: 'blur(6px) saturate(0.9)',
        WebkitBackdropFilter: 'blur(6px) saturate(0.9)',
        boxShadow: '0 2px 0 rgba(0,0,0,0.4), 0 14px 24px rgba(0,0,0,0.45)',
        borderBottom: `1px solid ${headerCfg.border}`,
      }}>
      <div style={{
        padding: '24px 40px 18px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
      }}>
        <div>
          <div style={{
            fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.35em',
            color: '#D2B773', textTransform: 'uppercase',  // BRAND.brass — RAL 1002
          }}>
            {lang === 'ru' ? 'Музей В.И. Ленина · Гражданская война' : 'Lenin Museum · Russian Civil War'}
          </div>
          <div style={{
            fontFamily: fonts.display, fontStyle: 'italic',
            fontSize: 52, lineHeight: 1, color: headerInk, marginTop: 6,
            letterSpacing: '-0.01em',
          }}>{lang === 'ru' ? 'Персоналіи. 1918—1922' : 'People. 1918—1922'}</div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="index.html" style={{
            fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.25em',
            color: headerInkDim, textDecoration: 'none',
            border: `1px solid ${headerInkDim}`, padding: '8px 16px',
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
            fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.25em',
            color: headerInk, background: 'transparent',
            border: `1px solid #D2B773`, padding: '8px 16px',  // BRAND.brass border
            textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
      </div>

      {/* FILTERS — внутри того же sticky-блока, прибиты к шапке.
           Цвета лагерей — bg signalRed/telegrey4/brass из BRAND. */}
      <div style={{
        padding: '0 40px 18px', display: 'flex', gap: 10, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {[
          { id: 'all',   ru: 'Всѣ',         en: 'All',         count: people.length, brand: '#D2B773' /* BRAND.brass */ },
          { id: 'red',   ru: 'Красные',     en: 'Reds',        count: people.filter(p => p.side==='red').length,   brand: '#A02128' /* BRAND.signalRed */ },
          { id: 'white', ru: 'Бѣлые',       en: 'Whites',      count: people.filter(p => p.side==='white').length, brand: '#CFD0CF' /* BRAND.telegrey4 */ },
          { id: 'green', ru: 'Третья сила', en: 'Third force', count: people.filter(p => p.side==='green').length, brand: '#5D6970' /* BRAND.slateBlue */ },
        ].map(f => {
          const active = filter === f.id;
          // На активном фоне signalRed/slateBlue текст белый, на brass/telegrey4 — чёрный
          const lightBg = (f.brand === '#D2B773' || f.brand === '#CFD0CF');
          const activeText = lightBg ? '#000' : '#F7F9EF';
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.2em',
              padding: '10px 18px',
              background: active ? f.brand : 'transparent',
              color: active ? activeText : headerInkDim,
              border: `1px solid ${active ? f.brand : headerInkDim}`,
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {f[lang]}
              <span style={{ fontSize: 10, opacity: .7 }}>· {f.count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }}/>
        <div style={{
          fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.2em',
          color: headerInkDim, textTransform: 'uppercase',
        }}>
          {lang === 'ru' ? 'Нажмите карточку — откроется справка' : 'Tap a card — opens a dossier'}
        </div>
      </div>

      </div>

      {/* GRID */}
      <div style={{
        padding: '28px 40px 120px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '28px 22px',
        maxWidth: 1800, margin: '0 auto',
      }}>
        {shown.map((p, i) => (
          <PersonCard key={p.id} person={p} lang={lang}
            delay={i * 45}
            onOpen={() => setOpenId(p.id)}/>
        ))}
      </div>

      {opened && <PersonDetail person={opened} lang={lang}
        onClose={() => setOpenId(null)}
        lightboxIdx={lightboxIdx} setLightboxIdx={setLightboxIdx}
        cardCfg={cardCfg}/>}

      {/* Плавающая панель стилей — справа, всегда видна */}
      <SettingsPanel
        lang={lang}
        headerVariant={headerVariant} setHeaderVariant={setHeaderVariant}
        bgVariant={bgVariant} setBgVariant={setBgVariant}
        cardVariant={cardVariant} setCardVariant={setCardVariant}
      />
    </div>
  );
}

window.PersonalitiesApp = PersonalitiesApp;
