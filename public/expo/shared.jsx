// Общие примитивы для всех 3 направлений:
// - Текстуры бумаги / дерева (CSS-layered gradients)
// - Виньетка 4К-стенда
// - Верньер-скраббер (переопределяет дефолтный PlaybackBar)
// - Лента годов 1918–1922

// ── Цвета, шрифты ──────────────────────────────────────────────────────────
// Архитектура цветов: бренд (PDF-гайд RAL, неизменно) → наша адаптация
// (theme.js / tokens.css, точное наследование) → наши решения поверх
// (тёплая бумага, дерево, старина). Здесь — последний слой.
//
// Используем `BRAND.signalRed` / `BRAND.brass` / `BRAND.inkBlack` напрямую,
// когда нужен официальный бренд-акцент (флаг лагеря, page-header, бренд-pill).
// `theme.X` — наши тёплые расширения для интерьера экспозиции.
const BRAND = (typeof window !== 'undefined' && window.BRAND_THEME) || {
  inkBlack: '#000000', paperWhite: '#F7F9EF', brass: '#D2B773',
  signalRed: '#A02128', slateBlue: '#5D6970', slateWindow: '#9DA3A6',
  ironGrey: '#555D61', graphite: '#435059', telegrey4: '#CFD0CF',
};

const theme = {
  // Архивная палитра — наши решения поверх бренда (тёплая бумага, дерево
  // стола, тени старого документа). Бренд-эквиваленты — в `BRAND.*`.
  ink:         '#2a1f16',    // тёплая умбра вместо BRAND.inkBlack — для эффекта старого чернила
  inkSoft:     '#4a3826',    // подзаголовки
  inkFaint:    '#7a6650',    // мета
  paperLight:  '#efe4cd',    // светлая старая бумага (бренд: BRAND.paperWhite #F7F9EF)
  paper:       '#e6d6b5',    // основная бумага «стола»
  paperWarm:   '#d9c398',    // загорелые края
  paperDark:   '#a8875a',    // тени
  wood:        '#3a2517',    // тёмное дерево стола
  woodLight:   '#5a3a22',    // дерево подсветка
  red:         '#a11b1b',    // архивный красный (бренд: BRAND.signalRed #A02128)
  redDeep:     '#6b0d0d',
  white:       '#f7f1e1',    // слоновая кость (бренд: BRAND.telegrey4 #CFD0CF)
  ochre:       '#c18f3c',    // акцент золота
  brass:       '#8e6a2a',    // тусклая патинированная латунь (бренд: BRAND.brass #D2B773)
  gold:        '#d4af3a',
  greenMap:    '#6b7f4a',    // карта
  blueMap:     '#4a6178',    // карта
};

// Фирменные шрифты Ленин-центра. Совпадают с tokens.css (--font-*).
// Назначение по docs/brand.md:
//   Nolde     — заголовки, крупные цифры, буквицы
//   21 Cent   — длинные тексты, параграфы
//   20 Kopeek — короткие надписи, акценты, кнопки, метки, mono-стиль
const fonts = {
  display: '"Nolde", "Playfair Display", Georgia, serif',
  body:    '"21 Cent", "PT Serif", Georgia, serif',
  mono:    '"20 Kopeek", "JetBrains Mono", "Courier New", monospace',
  stamp:   '"20 Kopeek", "Special Elite", monospace',
  rus:     '"21 Cent", "PT Serif", Georgia, serif',
};

// ── Paper texture (layered) ────────────────────────────────────────────────
function paperBg({ base = theme.paper, vignette = true } = {}) {
  const layers = [
    // мелкие крапинки
    'radial-gradient(ellipse 2px 2px at 17% 23%, rgba(80,50,20,.08) 0, transparent 100%)',
    'radial-gradient(ellipse 1px 1px at 67% 47%, rgba(60,40,10,.10) 0, transparent 100%)',
    'radial-gradient(ellipse 3px 3px at 89% 71%, rgba(100,70,30,.06) 0, transparent 100%)',
    // пятна
    'radial-gradient(ellipse 260px 180px at 20% 30%, rgba(120,80,30,.10) 0, transparent 70%)',
    'radial-gradient(ellipse 420px 260px at 82% 78%, rgba(100,60,20,.12) 0, transparent 70%)',
    'radial-gradient(ellipse 180px 120px at 55% 15%, rgba(180,130,70,.12) 0, transparent 70%)',
    // волокна
    'repeating-linear-gradient(7deg, rgba(60,40,20,.02) 0 2px, transparent 2px 7px)',
    'repeating-linear-gradient(-33deg, rgba(40,30,10,.015) 0 1px, transparent 1px 9px)',
  ];
  if (vignette) {
    layers.push('radial-gradient(ellipse 120% 90% at 50% 50%, transparent 40%, rgba(40,20,5,.28) 100%)');
  }
  return {
    background: `${layers.join(', ')}, ${base}`,
  };
}

// ── Wood texture ────────────────────────────────────────────────────────────
function woodBg() {
  return {
    background: [
      // слои текстуры
      'repeating-linear-gradient(91deg, rgba(0,0,0,.14) 0 2px, transparent 2px 24px)',
      'repeating-linear-gradient(89deg, rgba(255,200,140,.04) 0 1px, transparent 1px 14px)',
      'repeating-linear-gradient(88deg, rgba(0,0,0,.08) 0 1px, transparent 1px 60px)',
      // узлы и волны
      'radial-gradient(ellipse 320px 80px at 22% 30%, rgba(20,10,0,.28) 0, transparent 70%)',
      'radial-gradient(ellipse 260px 60px at 70% 72%, rgba(30,12,0,.22) 0, transparent 70%)',
      'radial-gradient(ellipse 180px 40px at 45% 58%, rgba(40,20,5,.18) 0, transparent 70%)',
      // виньетка
      'radial-gradient(ellipse 110% 85% at 50% 50%, transparent 30%, rgba(0,0,0,.55) 100%)',
      'linear-gradient(180deg, #4a2c17 0%, #2a1808 100%)',
    ].join(', '),
  };
}

// ── Штамп (круглая печать) ─────────────────────────────────────────────────
function Stamp({ text = 'СЕКРЕТНО', sub = 'РВСР', x = 0, y = 0, rotate = -8, color = theme.redDeep, size = 130, opacity = 0.7 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `rotate(${rotate}deg)`,
      width: size, height: size,
      border: `3px double ${color}`,
      borderRadius: '50%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color, opacity,
      fontFamily: fonts.stamp,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      textAlign: 'center',
      boxShadow: `inset 0 0 0 2px ${color}22`,
      background: 'transparent',
    }}>
      <div style={{ fontSize: size * 0.15, fontWeight: 700, lineHeight: 1 }}>{text}</div>
      <div style={{ fontSize: size * 0.09, marginTop: 6, opacity: 0.85, letterSpacing: '.25em' }}>{sub}</div>
      {/* inner ring */}
      <div style={{
        position: 'absolute', inset: 8,
        border: `1px solid ${color}88`, borderRadius: '50%',
      }}/>
    </div>
  );
}

// ── Маркер года / заголовок главы ──────────────────────────────────────────
function ChapterMark({ year, chapter, subtitle, x = 80, y = 80, lang = 'ru' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      color: theme.ink,
      fontFamily: fonts.display,
      maxWidth: 900,
    }}>
      <div style={{
        fontFamily: fonts.mono,
        fontSize: 18,
        color: theme.inkFaint,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        marginBottom: 18,
      }}>
        {chapter}
      </div>
      <div style={{
        fontSize: 210,
        fontWeight: 400,
        lineHeight: 0.85,
        letterSpacing: '-0.04em',
        fontFamily: fonts.display,
        fontStyle: 'italic',
        color: theme.ink,
        textShadow: '0 2px 0 rgba(90,50,20,.08)',
      }}>
        {year}
      </div>
      <div style={{
        fontSize: 34,
        marginTop: 22,
        color: theme.inkSoft,
        fontFamily: fonts.body,
        maxWidth: 760,
        lineHeight: 1.25,
      }}>
        {subtitle}
      </div>
    </div>
  );
}

// ── Подпись-цитата ─────────────────────────────────────────────────────────
function QuoteCard({ quote, x, y, width = 620, rotate = 0 }) {
  if (!quote) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      transform: `rotate(${rotate}deg)`,
      fontFamily: fonts.body,
      color: theme.ink,
    }}>
      <div style={{
        fontSize: 36,
        lineHeight: 1.3,
        fontStyle: 'italic',
        fontFamily: fonts.display,
        textShadow: '0 1px 0 rgba(255,240,200,.3)',
      }}>
        {quote.text}
      </div>
      <div style={{
        marginTop: 14,
        fontFamily: fonts.mono,
        fontSize: 15,
        color: theme.inkFaint,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        — {quote.by}
      </div>
    </div>
  );
}

// ── Верньер-скраббер (большой, под палец) ──────────────────────────────────
// Замещает дефолтный PlaybackBar. Годы 1918–1922 — большие, с засечками.
function Vernier({ time, duration, playing, onPlayPause, onSeek, onHover, years }) {
  const trackRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  const timeFromEvt = React.useCallback((clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return x * duration;
  }, [duration]);

  const down = (e) => {
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    setDrag(true);
    onSeek(timeFromEvt(pt.clientX));
  };

  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      onSeek(timeFromEvt(pt.clientX));
    };
    const up = () => setDrag(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag, timeFromEvt, onSeek]);

  return (
    <div style={{
      position: 'absolute', left: 120, right: 120, bottom: 80,
      height: 120,
      display: 'flex', alignItems: 'center', gap: 40,
      userSelect: 'none',
    }}>
      {/* play button — крупный */}
      <button
        onClick={onPlayPause}
        style={{
          width: 90, height: 90, borderRadius: '50%',
          border: `2px solid ${theme.ochre}`,
          background: `radial-gradient(circle at 30% 30%, ${theme.brass}, #3a2510)`,
          color: theme.paperLight,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 18px rgba(0,0,0,.5), inset 0 2px 0 ${theme.gold}88, inset 0 -2px 6px rgba(0,0,0,.5)`,
          flexShrink: 0,
        }}
      >
        {playing ? (
          <svg width="30" height="30" viewBox="0 0 30 30">
            <rect x="8" y="6" width="5" height="18" fill="currentColor"/>
            <rect x="17" y="6" width="5" height="18" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 30 30">
            <path d="M8 5l17 10-17 10V5z" fill="currentColor"/>
          </svg>
        )}
      </button>

      {/* верньер */}
      <div
        ref={trackRef}
        onMouseDown={down}
        onTouchStart={down}
        style={{
          flex: 1, height: 100,
          position: 'relative',
          cursor: 'pointer',
          padding: '0 20px',
          touchAction: 'none',
        }}
      >
        {/* brass frame */}
        <div style={{
          position: 'absolute', inset: '20px 0',
          background: `linear-gradient(180deg, ${theme.brass} 0%, #3a2615 50%, ${theme.brass} 100%)`,
          borderRadius: 6,
          boxShadow: `inset 0 1px 0 ${theme.gold}, inset 0 -1px 0 #1a0e04, 0 2px 8px rgba(0,0,0,.5)`,
        }}/>

        {/* inner track */}
        <div style={{
          position: 'absolute', left: 20, right: 20, top: 28, height: 44,
          background: '#1a0e04',
          borderRadius: 2,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,.8)',
        }}/>

        {/* засечки лет */}
        {years.map((y, i) => {
          const p = (i / (years.length - 1)) * 100;
          return (
            <div key={y} style={{
              position: 'absolute',
              left: `calc(20px + ${p}% - ${p * 0.4 / 100}px)`,
              top: 28,
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ width: 2, height: 44, background: theme.gold, opacity: 0.7 }}/>
              <div style={{
                marginTop: 6,
                fontFamily: fonts.mono,
                fontSize: 18,
                color: theme.gold,
                letterSpacing: '0.1em',
                fontWeight: 700,
              }}>{y}</div>
            </div>
          );
        })}

        {/* индикатор */}
        <div style={{
          position: 'absolute',
          left: `calc(20px + ${pct}% * (100% - 40px) / 100%)`,
          top: 14,
          transform: 'translateX(-50%)',
          width: 24, height: 72,
          background: `linear-gradient(180deg, ${theme.red} 0%, ${theme.redDeep} 100%)`,
          borderRadius: 3,
          boxShadow: `0 0 20px ${theme.red}cc, 0 4px 10px rgba(0,0,0,.6), inset 0 1px 0 #ff5a5a`,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: -8, left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: `12px solid ${theme.red}`,
          }}/>
        </div>
      </div>
    </div>
  );
}

// ── Верхний бар: логотип + RU/EN + индикатор направления ──────────────────
function TopBar({ lang, setLang, direction, setDirection, directions, onOpenSection }) {
  return (
    <div style={{
      position: 'absolute', top: 40, left: 60, right: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 32,
      zIndex: 100,
      pointerEvents: 'auto',
    }}>
      {/* лого */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 22,
        color: theme.ink,
        fontFamily: fonts.display,
      }}>
        <div style={{
          width: 78, height: 78,
          border: `3px solid ${theme.redDeep}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.paperLight,
          color: theme.redDeep,
          fontFamily: fonts.display,
          fontStyle: 'italic',
          fontSize: 40,
          fontWeight: 700,
        }}>Л</div>
        <div>
          <div style={{ fontSize: 18, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: fonts.mono, color: theme.inkFaint }}>
            {lang === 'ru' ? 'Государственный музей В.И. Ленина' : 'V.I. Lenin State Museum'}
          </div>
          <div style={{ fontSize: 36, fontFamily: fonts.display, marginTop: 4, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
            {lang === 'ru' ? 'Гражданская война · 1918—1922' : 'Civil War · 1918—1922'}
          </div>
        </div>
      </div>

      {/* направления + персоналии — единая пилюля */}
      <div style={{
        display: 'flex', gap: 6,
        background: 'rgba(239,228,205,.55)',
        backdropFilter: 'blur(6px)',
        border: `1px solid ${theme.paperDark}66`,
        borderRadius: 40,
        padding: 5,
      }}>
        {directions.map((d) => (
          <button
            key={d.id}
            onClick={() => setDirection(d.id)}
            style={{
              padding: '14px 26px',
              fontFamily: fonts.mono,
              fontSize: 17,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 30,
              background: direction === d.id ? theme.ink : 'transparent',
              color: direction === d.id ? theme.paperLight : theme.ink,
              cursor: 'pointer',
              transition: 'all .2s',
            }}
          >
            {d.id} · {lang === 'ru' ? d.ru : d.en}
          </button>
        ))}
        {/* разделитель */}
        <div style={{ width: 1, background: `${theme.paperDark}55`, margin: '6px 4px' }}/>
        {[
          { section: 'parties', src: '/parties.html', ru: 'Партіи',    en: 'Parties' },
          { section: 'states',  src: '/states.html',  ru: 'Государственные образования', en: 'State formations' },
          { section: 'people',  src: '/expo/people.html', ru: 'Персоналіи', en: 'People' },
        ].map(link => (
          <button key={link.section} onClick={() => onOpenSection && onOpenSection(link.section, link.src)}
            style={{
              padding: '14px 20px',
              fontFamily: fonts.mono,
              fontSize: 15,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 30,
              background: 'transparent',
              color: theme.ink,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span>{lang === 'ru' ? link.ru : link.en}</span>
            <span style={{ opacity: .55 }}>→</span>
          </button>
        ))}
      </div>

      {/* служебная ссылка на бренд-каталог — центральный артефакт визуальной системы */}
      <a href="/brand.html" target="_blank" rel="noopener" style={{
        fontFamily: fonts.mono, fontSize: 14, letterSpacing: '0.28em',
        color: theme.paperLight, textDecoration: 'none',
        textTransform: 'uppercase', fontWeight: 700,
        background: theme.ink,
        border: `1.5px solid ${theme.ink}`,
        padding: '13px 22px', borderRadius: 30,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 0 rgba(0,0,0,.25)',
      }}
        onClick={(e) => {
          if (window.parent !== window) e.stopPropagation();
        }}
      >
        ◇ {lang === 'ru' ? 'БРЕНД' : 'BRAND'}
      </a>

      {/* RU/EN */}
      <div style={{
        display: 'flex', gap: 0,
        border: `1.5px solid ${theme.ink}`,
        borderRadius: 30,
        overflow: 'hidden',
        fontFamily: fonts.mono,
      }}>
        {['ru', 'en'].map((l) => (
          <button key={l}
            onClick={() => setLang(l)}
            style={{
              padding: '14px 24px',
              background: lang === l ? theme.ink : 'transparent',
              color: lang === l ? theme.paperLight : theme.ink,
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.2em',
              fontFamily: fonts.mono,
            }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Мелкая пыль / частицы ───────────────────────────────────────────────────
function DustParticles({ count = 30 }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 8,
      dur: 14 + Math.random() * 18,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes dustFloat {
          0%   { transform: translate(0, 0);     opacity: 0;   }
          20%  {                                  opacity: .5; }
          80%  {                                  opacity: .4; }
          100% { transform: translate(var(--dx), -120px); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: 'rgba(240,220,180,.6)',
          animation: `dustFloat ${p.dur}s ${p.delay}s infinite linear`,
          '--dx': `${p.drift}px`,
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, {
  theme, fonts,
  paperBg, woodBg,
  Stamp, ChapterMark, QuoteCard,
  Vernier, TopBar, DustParticles,
});
