// Персоналии Гражданской войны — UI

const SIDE_META = {
  red:   { ru: 'Красные',    en: 'Reds',         color: '#b23028', accent: '#d94a36', flag: '#a01818' },
  white: { ru: 'Белые',      en: 'Whites',       color: '#2a3d5e', accent: '#4a6290', flag: '#1a2238' },
  green: { ru: 'Третья сила',en: 'Third force',  color: '#4d5a28', accent: '#6a7a3a', flag: '#3a4418' },
};

const theme = {
  bg:       '#120803',
  bgDeep:   '#0a0502',
  paper:    '#e8d4a8',
  paperLit: '#f2e1b4',
  paperDim: '#c8b488',
  ink:      '#1a0c06',
  inkSoft:  '#3a2010',
  inkFade:  '#6a4a20',
  ochre:    '#c88a40',
  redDeep:  '#8a1010',
  brass:    '#b78838',
};

const fonts = {
  display: "'Playfair Display', 'PT Serif', Georgia, serif",
  body:    "'PT Serif', Georgia, serif",
  stamp:   "'Special Elite', 'Courier New', monospace",
  mono:    "'JetBrains Mono', monospace",
};

// Стол/бумага — тёмное сукно + виньетка
function tableBg() {
  return {
    background: [
      'repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 2px, transparent 2px 5px)',
      'repeating-linear-gradient(0deg, rgba(0,0,0,.1) 0 2px, transparent 2px 9px)',
      'radial-gradient(ellipse 80% 70% at 50% 45%, #3a1f0e 0%, #1a0804 100%)',
    ].join(','),
  };
}

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
      width: '100%', textAlign: 'left', border: 'none',
      padding: 0, background: 'transparent',
      transform: `rotate(${person._rot || 0}deg)`,
      transition: 'transform 300ms cubic-bezier(.2,.7,.3,1.1)',
      animation: `fadeUp 600ms ${delay}ms both`,
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px) scale(1.03)'}
    onMouseLeave={e => e.currentTarget.style.transform = `rotate(${person._rot || 0}deg)`}
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
          <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"
            style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <radialGradient id={`pbg-${person.id}`} cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#9a7a4c"/>
                <stop offset="55%" stopColor="#4a2e14"/>
                <stop offset="100%" stopColor="#150804"/>
              </radialGradient>
              <linearGradient id={`psil-${person.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d0602"/>
                <stop offset="100%" stopColor="#2a1a0a"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="125" fill={`url(#pbg-${person.id})`}/>
            {/* силуэт */}
            <path d="M 15 125 Q 15 82 32 74 Q 40 72 42 66 Q 34 62 34 47 Q 34 28 50 28 Q 66 28 66 47 Q 66 62 58 66 Q 60 72 68 74 Q 85 82 85 125 Z"
              fill={`url(#psil-${person.id})`}/>
            {/* шинель/воротник-намёк */}
            <path d="M 15 125 L 15 110 Q 50 95 85 110 L 85 125 Z"
              fill={meta.flag} opacity=".55"/>
          </svg>
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

// Модальная карточка с подробностями
function PersonDetail({ person, lang, onClose }) {
  const d = person[lang];
  const meta = SIDE_META[person.side];
  if (!person) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(5,3,1,.88)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 250ms ease',
      padding: 40,
    }}
    onClick={onClose}
    >
      <div style={{
        width: 1100, maxWidth: '100%',
        display: 'grid', gridTemplateColumns: '340px 1fr',
        gap: 28,
        animation: 'popIn 400ms cubic-bezier(.2,.7,.3,1.1)',
      }}
      onClick={e => e.stopPropagation()}
      >
        {/* левая — портрет + флаг */}
        <div style={{
          ...paperFill(),
          border: `1px solid ${theme.inkFade}`,
          padding: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,.8)',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1.3', overflow: 'hidden' }}>
            <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id={`mbg-${person.id}`} cx="50%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#a88656"/>
                  <stop offset="55%" stopColor="#4a2e14"/>
                  <stop offset="100%" stopColor="#150804"/>
                </radialGradient>
                <linearGradient id={`msil-${person.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0d0602"/>
                  <stop offset="100%" stopColor="#2a1a0a"/>
                </linearGradient>
              </defs>
              <rect width="100" height="130" fill={`url(#mbg-${person.id})`}/>
              <path d="M 15 130 Q 15 85 32 77 Q 40 74 42 68 Q 34 64 34 48 Q 34 28 50 28 Q 66 28 66 48 Q 66 64 58 68 Q 60 74 68 77 Q 85 85 85 130 Z"
                fill={`url(#msil-${person.id})`}/>
              <path d="M 15 130 L 15 113 Q 50 96 85 113 L 85 130 Z"
                fill={meta.flag} opacity=".6"/>
            </svg>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(91deg, rgba(0,0,0,.1) 0 1px, transparent 1px 3px)',
            }}/>
            <div style={{
              position: 'absolute', top: 10, left: 10,
              fontFamily: fonts.mono, fontSize: 10, color: '#f0dcae',
              letterSpacing: '0.2em', textShadow: '0 1px 2px #000',
            }}>
              {lang === 'ru' ? '[фотографія отсутствуетъ]' : '[photograph missing]'}
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SideFlag side={person.side} lang={lang}/>
            <div style={{ fontFamily: fonts.mono, fontSize: 11, color: theme.inkFade, letterSpacing: '0.15em' }}>
              {person.years}
            </div>
          </div>
        </div>

        {/* правая — текст */}
        <div style={{ color: theme.paperLit, paddingTop: 8 }}>
          <div style={{
            fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.3em',
            color: meta.accent, textTransform: 'uppercase',
          }}>{d.role}</div>
          <div style={{
            fontFamily: fonts.display, fontSize: 22,
            color: theme.paper, marginTop: 14, fontWeight: 400,
          }}>{d.name}</div>
          <div style={{
            fontFamily: fonts.display, fontStyle: 'italic',
            fontSize: 82, lineHeight: 0.9, color: theme.paperLit,
            marginTop: 2, letterSpacing: '-0.02em',
          }}>{d.sur}</div>

          <div style={{
            marginTop: 16, fontFamily: fonts.stamp, fontSize: 16,
            color: meta.accent, letterSpacing: '0.08em',
          }}>· {d.tag}</div>

          <div style={{
            marginTop: 26, fontFamily: fonts.body, fontSize: 19,
            color: theme.paperLit, lineHeight: 1.55, maxWidth: 680,
            textWrap: 'pretty', fontStyle: 'italic',
          }}>{d.bio}</div>

          {d.facts && d.facts.length > 0 && (
            <div style={{
              marginTop: 28, display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px 28px', maxWidth: 680,
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

          <button onClick={onClose} style={{
            marginTop: 44, background: 'transparent',
            border: `1px solid ${theme.paperDim}`,
            color: theme.paper, padding: '10px 22px',
            fontFamily: fonts.mono, fontSize: 12,
            letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? '← назадъ' : '← back'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonalitiesApp() {
  const [lang, setLang] = React.useState(() => {
    try { return localStorage.getItem('expo:lang') || 'ru'; } catch { return 'ru'; }
  });
  const [filter, setFilter] = React.useState('all');
  const [openId, setOpenId] = React.useState(null);

  React.useEffect(() => { try { localStorage.setItem('expo:lang', lang); } catch {} }, [lang]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // псевдослучайный наклон, стабильный по id
  const people = React.useMemo(() => window.People.map((p, i) => ({
    ...p,
    _rot: [-2.5, 1.8, -1, 2.2, -1.5, .9, -2.1, 1.4, -.8, 2.5, -1.9, 1.1, -2.2, .7, -1.3, 2][i % 16],
  })), []);

  const shown = filter === 'all' ? people : people.filter(p => p.side === filter);
  const opened = openId ? people.find(p => p.id === openId) : null;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      ...tableBg(),
      overflow: 'auto',
      color: theme.paper,
      paddingBottom: 80,
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: rotate(0deg) translateY(22px); } }
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.92); } }
      `}</style>

      {/* TOP BAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '24px 40px 18px',
        background: 'linear-gradient(180deg, rgba(10,5,2,.97) 0%, rgba(10,5,2,.78) 70%, transparent 100%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
      }}>
        <div>
          <div style={{
            fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.35em',
            color: theme.ochre, textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'Музей В.И. Ленина · Гражданская война' : 'Lenin Museum · Russian Civil War'}
          </div>
          <div style={{
            fontFamily: fonts.display, fontStyle: 'italic',
            fontSize: 52, lineHeight: 1, color: theme.paperLit, marginTop: 6,
            letterSpacing: '-0.01em',
          }}>{lang === 'ru' ? 'Персоналіи. 1918—1922' : 'People. 1918—1922'}</div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="index.html" style={{
            fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.25em',
            color: theme.paperDim, textDecoration: 'none',
            border: `1px solid ${theme.inkFade}`, padding: '8px 16px',
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
            color: theme.paperLit, background: 'transparent',
            border: `1px solid ${theme.ochre}`, padding: '8px 16px',
            textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{
        padding: '0 40px 18px', display: 'flex', gap: 10, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {[
          { id: 'all',   ru: 'Всѣ',         en: 'All',         count: people.length },
          { id: 'red',   ru: 'Красные',     en: 'Reds',        count: people.filter(p => p.side==='red').length,   color: SIDE_META.red.flag },
          { id: 'white', ru: 'Бѣлые',       en: 'Whites',      count: people.filter(p => p.side==='white').length, color: SIDE_META.white.flag },
          { id: 'green', ru: 'Третья сила', en: 'Third force', count: people.filter(p => p.side==='green').length, color: SIDE_META.green.flag },
        ].map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.2em',
              padding: '10px 18px',
              background: active ? (f.color || theme.ochre) : 'transparent',
              color: active ? '#f0dcae' : theme.paperDim,
              border: `1px solid ${active ? (f.color || theme.ochre) : theme.inkFade}`,
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
          color: theme.inkFade, textTransform: 'uppercase',
        }}>
          {lang === 'ru' ? 'Нажмите карточку — откроется справка' : 'Tap a card — opens a dossier'}
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

      {opened && <PersonDetail person={opened} lang={lang} onClose={() => setOpenId(null)}/>}
    </div>
  );
}

window.PersonalitiesApp = PersonalitiesApp;
