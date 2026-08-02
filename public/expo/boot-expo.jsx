// Точка входа сцены /expo/. Раньше жила инлайном в index.html под
// <script type="text/babel">; вынесена в файл, чтобы проходить предкомпиляцию
// вместе с остальным JSX (scripts/expo/build-jsx.mjs).
//
// theme, fonts, Vernier, TopBar приходят из shared.jsx, DirectionA/B/C — из
// direction-*.jsx. Все они объявлены на верхнем уровне своих <script> и потому
// уже видны здесь; переобъявлять их через `const {…} = window` нельзя —
// у скриптов страницы общая лексическая область, второе объявление = SyntaxError.

const DIRECTIONS = [
  { id: 'A', ru: 'Стол коменданта',  en: 'Commander\'s Desk' },
  { id: 'B', ru: 'Карта фронтов',    en: 'Fronts Map' },
  { id: 'C', ru: 'Поток документов', en: 'Document Stream' },
];

// общая длительность таймлайна (сек)
const DURATION = 60;

// Разделы-оверлеи, открываются поверх сцены без перезагрузки.
// Iframe'ы монтируются лениво и остаются в DOM → повторный клик мгновенен.
const SECTION_SRCS = {
  parties: '../parties.html',
  states:  '../states.html',
  people:  'people.html',
};

function Expo() {
  const [lang, setLang] = React.useState(() => {
    try { return localStorage.getItem('expo:lang') || 'ru'; } catch { return 'ru'; }
  });
  const [direction, setDirection] = React.useState(() => {
    try { return localStorage.getItem('expo:direction') || 'A'; } catch { return 'A'; }
  });
  const [time, setTime] = React.useState(() => {
    try { return parseFloat(localStorage.getItem('expo:t') || '0') || 0; } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState(true);
  const [scale, setScale] = React.useState(1);
  const [activeSection, setActiveSection] = React.useState(null);
  // Какие разделы уже подгружены (один раз) — iframe'ы остаются в DOM.
  const [loadedSections, setLoadedSections] = React.useState(new Set());

  const openSection = React.useCallback((id) => {
    setActiveSection(id);
    setLoadedSections(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Сообщаем iframe-разделу что его открыли — он сбросит внутренние модалки
    // (например, открытую карточку персоналии), чтобы пользователь видел
    // главный список, а не последний дрилл-даун.
    requestAnimationFrame(() => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((f) => {
        if (f.title === id && f.contentWindow) {
          try { f.contentWindow.postMessage('mtk29:section-opened', '*'); } catch {}
        }
      });
    });
  }, []);
  const closeSection = React.useCallback(() => setActiveSection(null), []);

  // Esc и postMessage('mtk29:close-section') закрывают оверлей.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setActiveSection(null); };
    const onMsg = (e) => { if (e.data === 'mtk29:close-section') setActiveSection(null); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('message', onMsg);
    };
  }, []);

  // persist + sync lang между этим окном и iframes (storage event срабатывает
  // только в чужих окнах одного origin, поэтому iframes сами увидят перемену)
  React.useEffect(() => { try { localStorage.setItem('expo:lang', lang); } catch {} }, [lang]);
  React.useEffect(() => { try { localStorage.setItem('expo:direction', direction); } catch {} }, [direction]);
  React.useEffect(() => { try { localStorage.setItem('expo:t', String(time)); } catch {} }, [time]);

  // Слушаем смены языка из iframes (parties/states/people) — они тоже пишут expo:lang.
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'expo:lang' && e.newValue && e.newValue !== lang) setLang(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [lang]);

  // autoscale 1920x1080 base
  const stageRef = React.useRef(null);
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const s = Math.min(el.clientWidth / 1920, el.clientHeight / 1080);
      setScale(Math.max(0.1, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // tick
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  React.useEffect(() => {
    if (!playing) { lastTsRef.current = null; return; }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime(t => {
        let next = t + dt;
        if (next >= DURATION) next = next % DURATION;
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTsRef.current = null; };
  }, [playing]);

  // keyboard
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p); }
      else if (e.code === 'ArrowLeft') setTime(t => Math.max(0, t - 1));
      else if (e.code === 'ArrowRight') setTime(t => Math.min(DURATION, t + 1));
      else if (e.key === '1') setDirection('A');
      else if (e.key === '2') setDirection('B');
      else if (e.key === '3') setDirection('C');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const years = window.EXPO_DATA.years;

  return (
    <div ref={stageRef} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050301',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 1920, height: 1080,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        flexShrink: 0,
        boxShadow: '0 0 120px rgba(0,0,0,.9)',
      }}>
        {/* сцена направления — слои поверх друг друга, невидимые скрываем */}
        <div style={{ position: 'absolute', inset: 0, visibility: direction === 'A' ? 'visible' : 'hidden' }}>
          <DirectionA lang={lang} time={time} duration={DURATION} years={years}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, visibility: direction === 'B' ? 'visible' : 'hidden' }}>
          <DirectionB lang={lang} time={time} duration={DURATION} years={years}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, visibility: direction === 'C' ? 'visible' : 'hidden' }}>
          <DirectionC lang={lang} time={time} duration={DURATION} years={years}/>
        </div>

        {/* верхний бар */}
        <TopBar
          lang={lang} setLang={setLang}
          direction={direction} setDirection={setDirection}
          directions={DIRECTIONS}
          onOpenSection={openSection}
        />

        {/* верньер */}
        <Vernier
          time={time} duration={DURATION}
          playing={playing}
          onPlayPause={() => setPlaying(p => !p)}
          onSeek={t => setTime(t)}
          onHover={() => {}}
          years={[1918, 1919, 1920, 1921, 1922]}
        />

        {/* подсказка для тач-взаимодействия */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: fonts.mono,
          fontSize: 13,
          letterSpacing: '0.3em',
          color: theme.inkFaint,
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          {lang === 'ru'
            ? '◂ ПЕРЕТАЩИТЕ ВЕРНЬЕР ДЛЯ ДВИЖЕНИЯ ПО ГОДАМ ▸    ·    НАЖМИТЕ РАЗДЕЛ СВЕРХУ, ЧТОБЫ СМЕНИТЬ ВИД'
            : '◂ DRAG THE VERNIER TO SCRUB THROUGH THE YEARS ▸    ·    TAP A SECTION ABOVE TO CHANGE THE VIEW'}
        </div>
      </div>

      {/* Оверлей с разделами: iframe'ы остаются в DOM после первого открытия. */}
      {Object.entries(SECTION_SRCS).map(([id, src]) => (
        loadedSections.has(id) ? (
          <div key={id} style={{
            position: 'fixed', inset: 0,
            zIndex: 200,
            background: '#050301',
            display: activeSection === id ? 'block' : 'none',
          }}>
            <iframe
              src={src}
              title={id}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                border: 0, background: 'transparent',
                display: 'block',
              }}
            />
            <button
              onClick={closeSection}
              style={{
                position: 'absolute', bottom: 32, right: 32,
                zIndex: 10,
                width: 64, height: 64,
                borderRadius: 32,
                border: `1.5px solid ${theme.paperWarm}`,
                background: 'rgba(10,6,3,0.85)',
                color: theme.paperLight,
                fontSize: 32, lineHeight: 1,
                cursor: 'pointer',
                fontFamily: fonts.display,
              }}
              aria-label="Закрыть"
            >×</button>
          </div>
        ) : null
      ))}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Expo/>);
