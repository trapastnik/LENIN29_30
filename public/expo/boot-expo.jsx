// Точка входа сцены /expo/ — главный экран экспозиции.
//
// Живёт файлом, а не инлайном в index.html, чтобы проходить предкомпиляцию
// вместе с остальным JSX (scripts/expo/build-jsx.mjs).
//
// theme, fonts, paperBg приходят из shared.jsx; Backdrop, MainHeader,
// Timeline, SectionTiles — из main-screen.jsx. Все они объявлены на верхнем
// уровне своих <script> и потому уже видны здесь; переобъявлять их через
// `const {…} = window` нельзя — у скриптов страницы общая лексическая
// область, второе объявление = SyntaxError.

// Разделы. Первые четыре — по ТЗ (../IN/00-tz/МТК 29.docx: «вверху тайм-лайн
// и 4 кнопки»), Симбирск добавлен решением проекта (CLAUDE.md §1).
//
// src: null — страницы ещё нет, плитка показывается неактивной. Ведёт на
// 404 только тот, кто пишет ссылку заранее; здесь мы этого не делаем.
// Симбирск — зона simbirsk, его страницу заводит она, не мы.
const SECTIONS = [
  {
    id: 'chronicle', src: null,
    ru: 'Хроника событій', en: 'Chronicle of events',
    noteRu: 'Лента времени 1917–1922, событія по годамъ',
    noteEn: 'Timeline 1917–1922, events by year',
    accent: '#A02128',            // BRAND.signalRed
    countKey: 'chronicle',
  },
  {
    id: 'parties', src: '../parties.html',
    ru: 'Политическія партіи', en: 'Political parties',
    noteRu: 'Красные, бѣлые, революціонная демократія, зелёные, національныя движенія',
    noteEn: 'Reds, Whites, revolutionary democracy, Greens, national movements',
    accent: '#8C4A99',            // --camp-rev-dem
    countKey: 'parties',
  },
  {
    id: 'states', src: '../states.html',
    ru: 'Государственныя образованія', en: 'State formations',
    noteRu: 'Шесть группъ, справки съ инфоблокомъ и картой территоріи',
    noteEn: 'Six groups, dossiers with an info block and a territory map',
    accent: '#2F4A6B',            // --camp-intervention
    countKey: 'states',
  },
  {
    id: 'people', src: 'people.html',
    ru: 'Персоналіи', en: 'People',
    noteRu: 'Справки о участникахъ съ обѣихъ сторонъ',
    noteEn: 'Dossiers on participants from every side',
    accent: '#D2B773',            // BRAND.brass
    countKey: 'persons',
  },
  {
    id: 'simbirsk', src: null,
    ru: 'Симбирскъ 1918–1919', en: 'Simbirsk 1918–1919',
    noteRu: 'Лонгридъ о городѣ между красными и Комучемъ',
    noteEn: 'A longread on the town between the Reds and Komuch',
    accent: '#5A8E55',            // --camp-green
    countKey: null,
  },
];

// Счётчики на плитках — из индексов разделов, а не константами: цифра,
// разошедшаяся с содержимым, хуже отсутствующей.
const COUNT_SOURCES = {
  chronicle: { url: 'content/chronicle/_index.json', pick: d => (d.years || []).reduce((s, y) => s + (y.count || 0), 0) },
  parties:   { url: 'content/parties/_index.json',   pick: d => (d.items || []).length },
  states:    { url: 'content/states/_index.json',    pick: d => (d.items || []).length },
  persons:   { url: 'content/persons/_index.json',   pick: d => (d.items || []).length },
};

function Expo() {
  const [lang, setLang] = React.useState(() => {
    try { return localStorage.getItem('expo:lang') || 'ru'; } catch { return 'ru'; }
  });
  const [scale, setScale] = React.useState(1);
  const [activeSection, setActiveSection] = React.useState(null);
  // Какие разделы уже подгружены (один раз) — iframe'ы остаются в DOM.
  const [loadedSections, setLoadedSections] = React.useState(new Set());
  const [years, setYears] = React.useState([]);
  const [activeYear, setActiveYear] = React.useState(null);
  const [counts, setCounts] = React.useState({});

  // ── Данные главной ───────────────────────────────────────────────────────
  React.useEffect(() => {
    let alive = true;
    fetch(MTK_URL('content/chronicle/_index.json'))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(d => { if (alive) setYears(d.years || []); })
      .catch(err => console.warn('[expo] хроника не загрузилась:', err));
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    let alive = true;
    Object.entries(COUNT_SOURCES).forEach(([key, s]) => {
      fetch(MTK_URL(s.url))
        .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(d => { if (alive) setCounts(prev => ({ ...prev, [key]: s.pick(d) })); })
        .catch(err => console.warn('[expo] счётчик', key, 'не загрузился:', err));
    });
    return () => { alive = false; };
  }, []);

  // ── Разделы-оверлеи ──────────────────────────────────────────────────────
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
      document.querySelectorAll('iframe').forEach((f) => {
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

  const sections = SECTIONS.map(s => ({
    ...s,
    count: s.countKey ? (counts[s.countKey] != null ? counts[s.countKey] : null) : null,
  }));
  const overlays = SECTIONS.filter(s => s.src);

  return (
    <div ref={stageRef} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050301',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUpTile { from { opacity: 0; transform: translateY(26px); } }
      `}</style>

      <div style={{
        width: 1920, height: 1080,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        flexShrink: 0,
        boxShadow: '0 0 120px rgba(0,0,0,.9)',
        overflow: 'hidden',
      }}>
        <Backdrop/>
        <MainHeader lang={lang} setLang={setLang}/>
        <Timeline years={years} active={activeYear} onPick={setActiveYear} lang={lang}/>
        <SectionTiles sections={sections} lang={lang} onOpen={openSection}/>

        <div style={{
          position: 'absolute', bottom: 26, left: 0, right: 0, zIndex: 3,
          textAlign: 'center',
          fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.3em',
          color: theme.paperWarm, textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          {lang === 'ru'
            ? 'Нажмите годъ на лентѣ времени · нажмите разделъ, чтобы открыть'
            : 'Tap a year on the timeline · tap a section to open'}
        </div>
      </div>

      {/* Оверлей с разделами: iframe'ы остаются в DOM после первого открытия. */}
      {overlays.map(s => (
        loadedSections.has(s.id) ? (
          <div key={s.id} style={{
            position: 'fixed', inset: 0,
            zIndex: 200,
            background: '#050301',
            display: activeSection === s.id ? 'block' : 'none',
          }}>
            <iframe
              src={s.src}
              title={s.id}
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
