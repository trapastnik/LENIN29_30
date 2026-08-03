// Главный экран экспозиции — по ТЗ (../IN/00-tz/МТК 29.docx).
//
// ТЗ: «на главной странице: вверху тайм-лайн и 4 кнопки, раскрывающие разделы».
// Пятая плитка — Симбирск: в докс-ТЗ его нет, он добавлен решением проекта
// (CLAUDE.md §1), под него заведена отдельная зона и ветка.
//
// Что было до этого: три «направления» A/B/C (стол коменданта, карта фронтов,
// поток документов) — заготовки design-pass, между которыми переключался
// посетитель. По ТЗ никакого выбора направления нет, поэтому они сняты.
//
// Слои снизу вверх: Backdrop → таймлайн → плитки разделов.

// ── Слот под 4K-визуал ─────────────────────────────────────────────────────
// Нижний слой сцены. Сюда ляжет отрисованный «стол» в 4K — картинкой, без
// кода. Пока его нет, рисуем бумагу с виньеткой из shared.jsx: пустой чёрный
// экран за плитками выглядел бы как незагрузившийся фон.
//
// Подключение, когда визуал появится: положить файл в public/expo/uploads/
// и указать путь здесь — размер фиксирован канвасом 1920×1080.
const BACKDROP_SRC = null;

function Backdrop() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0,
      overflow: 'hidden',
      // Тёмное дерево, а не бумага: плитки разделов сами бумажные, и на
      // бумажном фоне они переставали читаться как отдельные предметы.
      ...(BACKDROP_SRC ? {} : woodBg()),
    }}>
      {BACKDROP_SRC && (
        <img src={MTK_URL(BACKDROP_SRC)} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        }}/>
      )}
      {/* Виньетка: к краям глубже, чтобы 4K-экран не выглядел плоским */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 95% 85% at 50% 38%, rgba(90,58,34,.22) 0%, rgba(8,4,2,.85) 100%)',
      }}/>
    </div>
  );
}

// ── Шапка ──────────────────────────────────────────────────────────────────
function MainHeader({ lang, setLang }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '38px 56px 0',
    }}>
      <div>
        <div style={{
          fontFamily: fonts.mono, fontSize: 14, letterSpacing: '0.38em',
          color: theme.brass, textTransform: 'uppercase',
        }}>
          {lang === 'ru' ? 'Государственный музей В. И. Ленина' : 'State Lenin Museum'}
        </div>
        <div style={{
          fontFamily: fonts.display, fontSize: 62, lineHeight: 1.02,
          color: theme.paperLight, marginTop: 10,
        }}>
          {lang === 'ru' ? 'Россія въ Гражданской войнѣ' : 'Russia in the Civil War'}
        </div>
        <div style={{
          fontFamily: fonts.mono, fontSize: 16, letterSpacing: '0.3em',
          color: theme.paperWarm, marginTop: 8,
        }}>1917 — 1922</div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} style={{
          // Переключатель языка — основная навигация, ≥120 px (§1).
          minWidth: 120, minHeight: 'var(--touch-hit, 120px)',
          fontFamily: fonts.mono, fontSize: 15, letterSpacing: '0.25em',
          color: theme.paperLight, background: 'transparent',
          border: `1.5px solid ${theme.brass}`, borderRadius: 32,
          textTransform: 'uppercase',
        }}>{lang === 'ru' ? 'EN' : 'RU'}</button>
      </div>
    </div>
  );
}

// ── Таймлайн ───────────────────────────────────────────────────────────────
// ТЗ: «вверху тайм-лайн», в разделе «Хроника событий» — переход сразу на
// нужный год. Годы и количества берём из public/content/chronicle/_index.json,
// а не вбиваем: там уже посчитано, сколько событий в каждом году и как они
// делятся на политические и военные («можно сделать параллельный рассказ»).
function Timeline({ years, active, onPick, lang }) {
  const total = years.reduce((s, y) => s + (y.count || 0), 0) || 1;
  const cur = years.find(y => y.year === active) || null;

  return (
    <div style={{
      position: 'absolute', top: 214, left: 56, right: 56, zIndex: 3,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10,
      }}>
        {years.map(y => {
          const on = y.year === active;
          // Доля года в общем объёме хроники — высота столбца. 1918-й даёт
          // 139 событий из 396, 1921-й — 19; ровные кнопки это скрадывают.
          const h = 26 + Math.round((y.count / total) * 150);
          return (
            <button key={y.year} onClick={() => onPick(y.year)} style={{
              flex: 1,
              // ≥120px по CLAUDE.md §1: тач-палец, а не курсор
              minHeight: 'var(--touch-hit, 120px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'stretch', justifyContent: 'flex-end',
              gap: 10, padding: 0,
              background: 'transparent', border: 'none',
            }}>
              <div style={{
                height: h,
                background: on ? theme.brass : `${theme.paperWarm}33`,
                boxShadow: on ? `0 0 22px ${theme.brass}55` : 'none',
                borderTop: `2px solid ${on ? theme.gold : theme.paperWarm}`,
                transition: 'height 180ms ease, background 180ms ease',
              }}/>
              <div style={{
                fontFamily: fonts.display, fontSize: on ? 44 : 36,
                lineHeight: 1, color: on ? theme.paperLight : theme.paperWarm,
                transition: 'font-size 180ms ease',
              }}>{y.year}</div>
              <div style={{
                fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.18em',
                color: on ? theme.brass : `${theme.paperWarm}aa`,
              }}>{y.count}</div>
            </button>
          );
        })}
      </div>

      {/* Рельс под годами — непрерывность времени, а не шесть отдельных кнопок */}
      <div style={{ height: 2, background: `${theme.paperWarm}55`, marginTop: 4 }}/>

      {/* Разбор выбранного года. Пока раздел «Хроника» не собран, это
          единственное место, где видно её наполнение; когда появится —
          отсюда же пойдёт переход на нужный год. */}
      <div style={{
        marginTop: 16, minHeight: 30,
        display: 'flex', gap: 30, alignItems: 'baseline',
        fontFamily: fonts.mono, fontSize: 14, letterSpacing: '0.2em',
        color: theme.paperWarm, textTransform: 'uppercase',
      }}>
        {cur ? (
          <>
            <span style={{ color: theme.brass }}>
              {cur.count} {lang === 'ru' ? 'событій' : 'events'}
            </span>
            <span>{lang === 'ru' ? 'политическихъ' : 'political'} · {cur.pol}</span>
            <span>{lang === 'ru' ? 'военныхъ' : 'military'} · {cur.mil}</span>
            <span>{lang === 'ru' ? 'со справкой' : 'with a card'} · {cur.cards}</span>
          </>
        ) : (
          <span>{lang === 'ru' ? 'Выберите годъ' : 'Pick a year'}</span>
        )}
      </div>
    </div>
  );
}

// ── Плитки разделов ────────────────────────────────────────────────────────
// Четыре по ТЗ + Симбирск. Хроника и Симбирск пока без страниц: показываем
// плитку и говорим об этом, а не ведём на 404. Симбирск — чужая зона
// (CLAUDE.md §4), его страницу здесь не заводим.
function SectionTiles({ sections, lang, onOpen }) {
  return (
    <div style={{
      position: 'absolute', left: 56, right: 56, top: 470, zIndex: 3,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 20,
    }}>
      {sections.map((s, i) => {
        const ready = !!s.src;
        return (
          <button key={s.id}
            onClick={ready ? () => onOpen(s.id) : undefined}
            disabled={!ready}
            style={{
              minHeight: 'var(--touch-hit, 120px)',
              height: 470,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              textAlign: 'left', gap: 0,
              padding: '30px 26px',
              ...paperFillTile(ready),
              border: `1.5px solid ${ready ? theme.brass : `${theme.paperDark}88`}`,
              borderTop: `10px solid ${s.accent}`,
              opacity: ready ? 1 : 0.6,
              cursor: ready ? 'pointer' : 'default',
              animation: `fadeUpTile 520ms ${i * 70}ms both`,
            }}>
            <div style={{
              fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.3em',
              color: theme.inkFaint, textTransform: 'uppercase',
            }}>
              {lang === 'ru' ? 'Разделъ' : 'Section'} · {String(i + 1).padStart(2, '0')}
            </div>

            <div style={{
              fontFamily: fonts.display, fontSize: 34, lineHeight: 1.06,
              color: theme.ink, marginTop: 14,
            }}>{lang === 'ru' ? s.ru : s.en}</div>

            <div style={{
              marginTop: 14, fontFamily: fonts.body, fontSize: 15,
              color: theme.inkSoft, lineHeight: 1.4,
            }}>{lang === 'ru' ? s.noteRu : s.noteEn}</div>

            <div style={{ flex: 1 }}/>

            {s.count != null && (
              <div style={{
                fontFamily: fonts.display, fontSize: 54, lineHeight: 1,
                color: s.accent,
              }}>{s.count}</div>
            )}
            <div style={{
              marginTop: 6,
              fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.22em',
              color: ready ? theme.inkFaint : theme.inkSoft, textTransform: 'uppercase',
            }}>
              {ready
                ? (lang === 'ru' ? 'Открыть →' : 'Open →')
                : (lang === 'ru' ? 'Готовится' : 'In progress')}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Бумага плитки. Готовая — тёплая, неготовая — приглушённая: разница должна
// читаться до того, как посетитель нажмёт и ничего не произойдёт.
function paperFillTile(ready) {
  return ready
    ? paperBg({ base: theme.paper, vignette: false })
    : { background: `linear-gradient(160deg, ${theme.paperWarm}cc 0%, ${theme.paperDark}cc 100%)` };
}

window.Backdrop = Backdrop;
window.MainHeader = MainHeader;
window.Timeline = Timeline;
window.SectionTiles = SectionTiles;
