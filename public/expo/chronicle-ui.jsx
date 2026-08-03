// Раздел 1 «Хроника событий» — по ТЗ (../IN/00-tz/МТК 29.docx).
//
// ТЗ: «прокрутка ленты времени, события расположены хронологически… В меню
// должна быть возможность перейти сразу на другой год… Можно сделать
// параллельный рассказ про события политические и военные».
//
// Отсюда две колонки и переключатель годов. 396 событий разложены по годам,
// грузится один год за раз (chronicle-data.js).

if (!window.MTK_TOKENS) {
  throw new Error('chronicle-ui.jsx: не подключён brand-tokens.js (см. public/expo/chronicle.html)');
}

const chTheme = window.MTK_PEOPLE_THEME;
const chFonts = window.MTK_FONTS;
const chBrand = window.BRAND_THEME;

// Два трека ТЗ. Красный за военными — не партийная краска, а привычное
// чтение «боевые действия»; политические берут латунь бренда.
const TRACKS = {
  pol:  { ru: 'Политическія',  en: 'Political', color: chBrand.brass },
  mil:  { ru: 'Военныя',       en: 'Military',  color: chBrand.signalRed },
  both: { ru: 'Общія',         en: 'Both',      color: chBrand.slateWindow },
};

const MONTHS_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

// Месяц из машинной даты, а не из display_ru: там «5–6 января 1918 г.»,
// «Конец октября – начало ноября» и прочая человеческая речь.
function monthKey(item) {
  const from = item.date && item.date.from;
  if (!from) return null;
  return String(from).slice(0, 7);
}

function monthLabel(key, lang) {
  if (!key) return '';
  const m = Number(key.slice(5, 7));
  if (!m || m < 1 || m > 12) return key;
  const ru = MONTHS_RU[m - 1];
  return lang === 'ru'
    ? ru.charAt(0).toUpperCase() + ru.slice(1)
    : new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en', { month: 'long' });
}

// ── Одна строка ленты ──────────────────────────────────────────────────────
// Две колонки — политическое слева, военное справа, между ними ось времени
// с датой. Это и есть «параллельный рассказ» из ТЗ: событие видно в своём
// треке, а не в общем списке с пометкой.
function EventRow({ item, lang, onOpenCard }) {
  const track = TRACKS[item.track] || TRACKS.both;
  const polText = lang === 'ru' ? item.pol_ru : (item.pol_en || item.pol_ru);
  const milText = lang === 'ru' ? item.mil_ru : (item.mil_en || item.mil_ru);
  const wide = item.track === 'both';
  const isMonth = item.kind === 'month-marker';

  // Справка живёт внутри карточки события, а не отдельной строкой под ней:
  // иначе непонятно, к чему она относится, — особенно когда рядом в другом
  // треке стоит своё событие.
  const cell = (text, kind, withCard) => {
    if (!text) return <div/>;
    const c = TRACKS[kind].color;
    return (
      <div style={{
        background: chTheme.paper,
        borderLeft: `4px solid ${c}`,
        padding: '18px 22px',
        boxShadow: '0 8px 20px rgba(0,0,0,.45)',
      }}>
        <div style={{
          fontFamily: chFonts.mono, fontSize: 11, letterSpacing: '0.24em',
          color: c, textTransform: 'uppercase', marginBottom: 8,
        }}>
          {lang === 'ru' ? TRACKS[kind].ru : TRACKS[kind].en}
          {isMonth && ` · ${lang === 'ru' ? 'весь мѣсяцъ' : 'whole month'}`}
        </div>
        <div style={{
          fontFamily: chFonts.body, fontSize: 16, lineHeight: 1.5,
          color: chTheme.ink, textWrap: 'pretty',
        }}>{richText(text, c)}</div>

        {withCard && item.card && (
          <button onClick={() => onOpenCard(item.card)} style={{
            marginTop: 16, minHeight: 56, padding: '0 26px',
            fontFamily: chFonts.mono, fontSize: 12, letterSpacing: '0.24em',
            color: chTheme.ink, background: 'transparent',
            border: `1px solid ${c}`, borderRadius: 28,
            textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'Справка →' : 'Dossier →'}
          </button>
        )}
      </div>
    );
  };

  // Дата и точка на оси. Ось рисуется одной линией на всю ленту (см. фид),
  // здесь только узел, накрывающий её кружком.
  const axis = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8, paddingTop: 14,
    }}>
      <div style={{
        fontFamily: chFonts.mono, fontSize: 12, letterSpacing: '0.14em',
        color: chTheme.paperDim, textAlign: 'center', lineHeight: 1.35,
        background: chTheme.bgDeep, padding: '2px 8px',
      }}>{item.date && item.date.display_ru}</div>
      <div style={{
        width: 13, height: 13, borderRadius: 7,
        background: track.color,
        boxShadow: `0 0 0 5px ${chTheme.bgDeep}`,
      }}/>
    </div>
  );

  if (wide) {
    // Событие сразу в обоих треках — дата над парой колонок.
    return (
      <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 180px' }}>
        {axis}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 10 }}>
          {cell(polText, 'pol', true)}
          {cell(milText, 'mil', false)}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 190px 1fr',
      gap: 18, alignItems: 'start',
      // Событий в году до 139: браузер может не размечать то, что за экраном.
      contentVisibility: 'auto',
      containIntrinsicSize: '0 150px',
    }}>
      <div>{item.track === 'pol' ? cell(polText, 'pol', true) : null}</div>
      {axis}
      <div>{item.track === 'mil' ? cell(milText, 'mil', true) : null}</div>
    </div>
  );
}

// ── Карточка события ───────────────────────────────────────────────────────
function EventCard({ card, lang, onClose }) {
  const photos = React.useMemo(() => window.MTK_CHRONICLE.photos(card), [card]);
  const summary = (lang === 'ru' ? card.summary_ru : (card.summary_en || card.summary_ru)) || '';
  const dates = (card.dates && card.dates.display_ru) || card.date || '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(8,5,2,.86)',
      backdropFilter: 'blur(10px) saturate(0.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40, overscrollBehavior: 'contain',
    }} onClick={onClose}>
      <div className="brand-scroll" style={{
        width: 1180, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
        background: chTheme.paper, color: chTheme.ink,
        border: `1px solid ${chBrand.brass}`,
        padding: '38px 46px 46px',
        boxShadow: '0 30px 90px rgba(0,0,0,.85)',
        overscrollBehavior: 'contain',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          fontFamily: chFonts.mono, fontSize: 12, letterSpacing: '0.3em',
          color: chTheme.inkFade, textTransform: 'uppercase',
        }}>{dates}</div>

        <div style={{
          fontFamily: chFonts.display, fontSize: 42, lineHeight: 1.06,
          color: chTheme.ink, marginTop: 12,
        }}>{lang === 'ru' ? card.title_ru : (card.title_en || card.title_ru)}</div>

        <div style={{
          marginTop: 26, fontFamily: chFonts.body, fontSize: 17,
          lineHeight: 1.62, color: chTheme.inkSoft, maxWidth: 860,
          textWrap: 'pretty',
        }}>
          {summary.split(/\n\s*\n/).map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? '0 0 0.9em' : '0.9em 0' }}>
              {richText(p, chBrand.signalRed)}
            </p>
          ))}
        </div>

        {photos.length > 0 && (
          <div style={{
            marginTop: 34, display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 22,
          }}>
            {photos.map((ph, i) => (
              <figure key={i} style={{ margin: 0 }}>
                <div style={{
                  width: '100%', aspectRatio: '4/3', overflow: 'hidden',
                  background: chTheme.bgDeep, border: `1px solid ${chTheme.inkFade}`,
                }}>
                  <ChroniclePhoto photo={ph} lang={lang}/>
                </div>
                {(ph.ru || ph.en) && (
                  <figcaption style={{
                    marginTop: 8, fontFamily: chFonts.body, fontSize: 12,
                    lineHeight: 1.4, color: chTheme.inkFade,
                  }}>
                    {lang === 'ru' ? ph.ru : (ph.en || ph.ru)}
                    {ph.inv && <div style={{ marginTop: 3, opacity: .8 }}>{ph.inv}</div>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <button onClick={onClose} style={{
          marginTop: 36, minHeight: 60, padding: '0 32px',
          fontFamily: chFonts.mono, fontSize: 13, letterSpacing: '0.26em',
          color: chTheme.paper, background: chTheme.ink,
          border: 'none', borderRadius: 30, textTransform: 'uppercase',
        }}>{lang === 'ru' ? '← Назадъ къ лентѣ' : '← Back to the timeline'}</button>
      </div>
    </div>
  );
}

// Производные медиа доставляются мимо git и собираются на сервере, поэтому
// файла может не быть даже при заполненном tiers. Ловим и то, и другое:
// сломанная иконка картинки на киоске выглядит как поломка раздела.
function ChroniclePhoto({ photo, lang }) {
  const [failed, setFailed] = React.useState(false);
  if (photo.src && !failed) {
    return (
      <img src={photo.src} alt="" loading="lazy" onError={() => setFailed(true)} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        display: 'block', filter: 'sepia(0.10) contrast(1.03)',
      }}/>
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: chFonts.mono, fontSize: 10, letterSpacing: '0.18em',
      color: chBrand.slateWindow, textTransform: 'uppercase', textAlign: 'center', padding: 12,
    }}>
      {lang === 'ru' ? 'изображеніе не доставлено' : 'image not delivered'}
    </div>
  );
}

window.EventRow = EventRow;
window.EventCard = EventCard;
window.chronicleMonthKey = monthKey;
window.chronicleMonthLabel = monthLabel;
window.CHRONICLE_TRACKS = TRACKS;
window.chTheme = chTheme;
window.chFonts = chFonts;
window.chBrand = chBrand;
