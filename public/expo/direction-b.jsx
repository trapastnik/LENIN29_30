// Direction B — «Карта фронтов»
// Большая архивная карта Евразии. Линии фронта движутся плавно.
// Флажки появляются и исчезают. Стрелки наступлений.

const { theme: tb, fonts: fb, paperBg: paperBgB, fonts } = window;

// Упрощённая карта европ. части России + Сибирь.
// Координаты — в viewBox 1920x1080.
// Города (примерные проекционные координаты):
const CITIES_B = [
  { id: 'spb',  x: 560, y: 340, ru: 'Петроград',    en: 'Petrograd' },
  { id: 'msk',  x: 660, y: 430, ru: 'Москва',       en: 'Moscow' },
  { id: 'mur',  x: 590, y: 210, ru: 'Мурманск',     en: 'Murmansk' },
  { id: 'arh',  x: 670, y: 250, ru: 'Архангельск',  en: 'Arkhangelsk' },
  { id: 'kie',  x: 520, y: 560, ru: 'Киев',         en: 'Kiev' },
  { id: 'ros',  x: 670, y: 640, ru: 'Ростов',       en: 'Rostov' },
  { id: 'ekt',  x: 700, y: 700, ru: 'Екатеринодар', en: 'Ekaterinodar' },
  { id: 'tsa',  x: 780, y: 600, ru: 'Царицын',      en: 'Tsaritsyn' },
  { id: 'sam',  x: 880, y: 520, ru: 'Самара',       en: 'Samara' },
  { id: 'kaz',  x: 870, y: 450, ru: 'Казань',       en: 'Kazan' },
  { id: 'ufa',  x: 970, y: 480, ru: 'Уфа',          en: 'Ufa' },
  { id: 'ekb',  x: 1030, y: 420, ru: 'Екатеринбург',en: 'Yekaterinburg' },
  { id: 'oms',  x: 1180, y: 470, ru: 'Омск',        en: 'Omsk' },
  { id: 'nsk',  x: 1300, y: 490, ru: 'Новониколаев.', en: 'Novonikolaevsk' },
  { id: 'irk',  x: 1500, y: 540, ru: 'Иркутск',     en: 'Irkutsk' },
  { id: 'hab',  x: 1700, y: 560, ru: 'Хабаровск',   en: 'Khabarovsk' },
  { id: 'vla',  x: 1770, y: 640, ru: 'Владивосток', en: 'Vladivostok' },
  { id: 'sev',  x: 560, y: 720, ru: 'Севастополь',  en: 'Sevastopol' },
  { id: 'per',  x: 610, y: 720, ru: 'Перекоп',      en: 'Perekop' },
  { id: 'var',  x: 380, y: 520, ru: 'Варшава',      en: 'Warsaw' },
  { id: 'tam',  x: 730, y: 530, ru: 'Тамбов',       en: 'Tambov' },
  { id: 'kro',  x: 545, y: 325, ru: 'Кронштадт',    en: 'Kronstadt' },
  { id: 'eka',  x: 1040, y: 415, ru: 'Екатеринбург',en: 'Yekaterinburg' },
];

// Конфиги фронтов по годам.
// Каждый фронт — d-строка SVG-пути. Анимируем плавно между годами.
const FRONTS_BY_YEAR = {
  1918: [
    { id: 'east', color: tb.red, d: 'M 920 350 C 940 430 960 530 970 640', label: { text: 'Восточный · Чехи', en: 'East · Czech Legion', x: 990, y: 400 } },
    { id: 'south', color: tb.red, d: 'M 550 680 C 650 700 720 690 780 660', label: { text: 'Южный · Дон', en: 'South · Don', x: 580, y: 760 } },
    { id: 'north', color: tb.red, d: 'M 550 230 C 620 240 680 260 700 290', label: { text: 'Север · интервенция', en: 'North · Intervention', x: 720, y: 210 } },
  ],
  1919: [
    { id: 'east', color: tb.red, d: 'M 1020 320 C 1000 440 990 540 990 660', label: { text: 'Колчак → Волга', en: 'Kolchak → Volga', x: 1050, y: 370 } },
    { id: 'south-peak', color: tb.red, d: 'M 680 450 C 700 480 720 540 760 630', label: { text: 'Деникин → Орёл', en: 'Denikin → Orel', x: 700, y: 420 } },
    { id: 'nw', color: tb.red, d: 'M 500 310 C 540 330 570 340 600 360', label: { text: 'Юденич → Петроград', en: 'Yudenich → Petrograd', x: 420, y: 300 } },
  ],
  1920: [
    { id: 'west', color: tb.red, d: 'M 360 460 C 420 500 480 540 540 580', label: { text: 'Пилсудский · Польша', en: 'Piłsudski · Poland', x: 300, y: 440 } },
    { id: 'crimea', color: tb.red, d: 'M 540 680 C 570 700 600 720 640 720', label: { text: 'Перекоп · ноябрь', en: 'Perekop · Nov', x: 460, y: 760 } },
    { id: 'east-end', color: tb.red, d: 'M 1200 500 C 1250 530 1320 540 1400 550', label: { text: 'Восточн. фронт → Байкал', en: 'East front → Baikal', x: 1220, y: 470 } },
  ],
  1921: [
    { id: 'kron', color: tb.red, d: 'M 530 320 C 540 340 550 340 560 345', label: { text: 'Кронштадт', en: 'Kronstadt', x: 460, y: 300 } },
    { id: 'tam', color: tb.red, d: 'M 690 510 C 720 530 750 550 770 560', label: { text: 'Тамбов · Антонов', en: 'Tambov · Antonov', x: 620, y: 490 } },
    { id: 'vol', color: tb.red, d: 'M 790 500 C 830 530 870 540 920 560', label: { text: 'Голод в Поволжье', en: 'Volga famine', x: 780, y: 470 } },
  ],
  1922: [
    { id: 'far', color: tb.red, d: 'M 1600 540 C 1680 570 1730 610 1770 640', label: { text: 'Волочаевка → Владивосток', en: 'Volochaevka → Vladivostok', x: 1500, y: 520 } },
  ],
};

const FLAGS_BY_YEAR = {
  1918: [
    { city: 'sam', side: 'white', label: { ru: 'КОМУЧ', en: 'KOMUCH' } },
    { city: 'oms', side: 'white', label: { ru: 'Дир-ия', en: 'Direct.' } },
    { city: 'mur', side: 'other', label: { ru: 'Антанта', en: 'Entente' } },
    { city: 'arh', side: 'other', label: { ru: 'Антанта', en: 'Entente' } },
    { city: 'msk', side: 'red', label: { ru: 'РСФСР', en: 'RSFSR' } },
    { city: 'ekt', side: 'white', label: { ru: 'Добр. арм.', en: 'Volunt.' } },
  ],
  1919: [
    { city: 'oms', side: 'white', label: { ru: 'Колчак', en: 'Kolchak' } },
    { city: 'tsa', side: 'white', label: { ru: 'Деникин', en: 'Denikin' } },
    { city: 'ros', side: 'white', label: { ru: 'Добр. арм.', en: 'Volunteers' } },
    { city: 'msk', side: 'red', label: { ru: 'Ставка', en: 'HQ' } },
    { city: 'spb', side: 'red', label: { ru: '7-я армия', en: '7th Army' } },
  ],
  1920: [
    { city: 'var', side: 'other', label: { ru: 'Польша', en: 'Poland' } },
    { city: 'per', side: 'white', label: { ru: 'Врангель', en: 'Wrangel' } },
    { city: 'sev', side: 'white', label: { ru: 'Исход →', en: 'Exodus →' } },
    { city: 'msk', side: 'red', label: { ru: 'Ставка', en: 'HQ' } },
    { city: 'irk', side: 'red', label: { ru: '5-я армия', en: '5th Army' } },
  ],
  1921: [
    { city: 'kro', side: 'other', label: { ru: 'Мятеж', en: 'Mutiny' } },
    { city: 'tam', side: 'other', label: { ru: 'Антонов', en: 'Antonov' } },
    { city: 'sam', side: 'red', label: { ru: 'Помгол', en: 'Pomgol' } },
    { city: 'msk', side: 'red', label: { ru: 'X съезд', en: '10th Congr.' } },
  ],
  1922: [
    { city: 'hab', side: 'other', label: { ru: 'Япония', en: 'Japan' } },
    { city: 'vla', side: 'red', label: { ru: 'ДВР', en: 'FER' } },
    { city: 'msk', side: 'red', label: { ru: 'СССР', en: 'USSR' } },
  ],
};

function Flag({ x, y, side, label, appear = 1 }) {
  const colorMap = {
    red:   { fill: tb.red,  stroke: tb.redDeep, text: '#fff' },
    white: { fill: tb.white, stroke: '#5a4020', text: '#3a2010' },
    other: { fill: tb.brass, stroke: '#3a2010', text: '#fff' },
  };
  const c = colorMap[side];
  const offs = (1 - appear) * 30;
  return (
    <g transform={`translate(${x}, ${y - 45 + offs})`} opacity={appear}>
      {/* древко */}
      <line x1="0" y1="0" x2="0" y2="45" stroke="#3a2010" strokeWidth="1.8"/>
      <circle cx="0" cy="0" r="3" fill={tb.brass}/>
      {/* полотнище */}
      <path d="M 0 2 L 56 2 L 48 14 L 56 26 L 0 26 Z" fill={c.fill} stroke={c.stroke} strokeWidth="1.2"/>
      <text x="4" y="18" fontSize="10" fontFamily={fb.mono} fontWeight="700" fill={c.text} letterSpacing="0.05em">{label}</text>
      {/* точка города */}
      <circle cx="0" cy="45" r="5" fill={tb.redDeep} stroke="#2a0a0a" strokeWidth="1.5"/>
      <circle cx="0" cy="45" r="2" fill="#ffcccc"/>
    </g>
  );
}

function DirectionB({ lang, time, duration, years }) {
  const yearSpan = duration / years.length;
  const yearIdx = Math.min(years.length - 1, Math.floor(time / yearSpan));
  const inYearT = (time - yearIdx * yearSpan) / yearSpan;
  const year = years[yearIdx];
  const data = year[lang];

  // анимационный прогресс для плавных переходов фронтов
  const transitionT = Math.min(1, inYearT * 2);

  const fronts = FRONTS_BY_YEAR[year.year] || [];
  const flags = FLAGS_BY_YEAR[year.year] || [];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at center, #1a0c04 0%, #0a0502 100%)',
      overflow: 'hidden',
    }}>
      {/* Карта как гигантский лист на столе */}
      <div style={{
        position: 'absolute', inset: 0,
        ...paperBgB({ base: '#d6c092', vignette: true }),
      }}/>

      {/* складки */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'linear-gradient(90deg, transparent 24.5%, rgba(40,20,0,.22) 25%, transparent 25.5%)',
          'linear-gradient(90deg, transparent 49.5%, rgba(40,20,0,.22) 50%, transparent 50.5%)',
          'linear-gradient(90deg, transparent 74.5%, rgba(40,20,0,.22) 75%, transparent 75.5%)',
          'linear-gradient(180deg, transparent 49.5%, rgba(40,20,0,.18) 50%, transparent 50.5%)',
        ].join(','),
      }}/>

      {/* SVG карта */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <filter id="roughen">
            <feTurbulence baseFrequency="0.9" numOctaves="2" seed="5"/>
            <feDisplacementMap in="SourceGraphic" scale="3"/>
          </filter>
          <pattern id="landHatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 8 L 8 0" stroke="rgba(90,60,20,.15)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* океаны (тёмные вокруг контура) */}
        {/* Контур Евразии (упрощённый) */}
        <path
          d="M 120 380 Q 180 300 280 260 Q 400 220 540 210 Q 700 200 880 220 Q 1040 230 1200 260 Q 1380 290 1550 320 Q 1700 350 1820 410 Q 1870 460 1840 530 Q 1800 620 1700 680 Q 1500 730 1280 740 Q 1000 750 760 750 Q 540 760 340 740 Q 220 720 140 660 Q 80 560 100 470 Q 110 420 120 380 Z"
          fill="url(#landHatch)" stroke="#3a2010" strokeWidth="2.5" opacity="0.9"
        />
        {/* главные реки */}
        <g stroke="#4a6178" strokeWidth="1.8" fill="none" opacity="0.7">
          <path d="M 560 340 Q 620 450 680 600 Q 710 700 720 750"/>
          <path d="M 810 290 Q 800 400 810 540 Q 820 620 830 720"/>
          <path d="M 1050 320 Q 1070 450 1080 580"/>
          <path d="M 1380 280 Q 1400 430 1410 560"/>
          <path d="M 1640 340 Q 1650 460 1660 580"/>
        </g>

        {/* КГрадус. сетка */}
        <g stroke="rgba(90,60,20,.2)" strokeWidth="0.5" fill="none">
          {[280, 420, 560, 700, 840, 980, 1120, 1260, 1400, 1540, 1680, 1820].map(xl => (
            <line key={`v${xl}`} x1={xl} y1={180} x2={xl} y2={780}/>
          ))}
          {[240, 340, 440, 540, 640, 740].map(yl => (
            <line key={`h${yl}`} x1={120} y1={yl} x2={1820} y2={yl}/>
          ))}
        </g>

        {/* Города — все, как база */}
        {CITIES_B.map(c => {
          // сдвигаем подписи для городов на правом/дальнем краю влево от точки
          const flipLabel = c.x > 1560;
          return (
            <g key={c.id}>
              <circle cx={c.x} cy={c.y} r="3" fill="#3a1c08" opacity="0.7"/>
              <text x={c.x + (flipLabel ? -7 : 7)} y={c.y + 4}
                textAnchor={flipLabel ? 'end' : 'start'}
                fontSize="11" fontFamily={fb.mono} fill="#3a1c08" opacity="0.75">
                {c[lang]}
              </text>
            </g>
          );
        })}

        {/* Фронты */}
        {fronts.map((fr, i) => (
          <g key={`${year.year}-${fr.id}`}>
            <path
              d={fr.d}
              stroke={fr.color}
              strokeWidth={Math.max(3, 7 * transitionT)}
              fill="none"
              strokeDasharray="14 8"
              strokeLinecap="round"
              opacity={0.75 + transitionT * 0.2}
              filter="url(#roughen)"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="44" dur="1.8s" repeatCount="indefinite"/>
            </path>
            {/* штриховка «наступление» */}
            <path
              d={fr.d}
              stroke={fr.color}
              strokeWidth="2"
              fill="none"
              opacity="0.35"
              strokeDasharray="4 3"
            />
          </g>
        ))}

        {/* Наступательные стрелки */}
        {year.year === 1919 && (
          <g>
            <MovingArrow x1={1020} y1={400} x2={860} y2={460} color={tb.red} progress={transitionT} label={lang==='ru'?'Колчак':'Kolchak'}/>
            <MovingArrow x1={680} y1={640} x2={700} y2={440} color={tb.red} progress={Math.min(1,transitionT*1.2)} label={lang==='ru'?'Деникин':'Denikin'}/>
          </g>
        )}
        {year.year === 1920 && (
          <g>
            <MovingArrow x1={360} y1={520} x2={540} y2={560} color={tb.red} progress={transitionT} label={lang==='ru'?'Польша':'Poland'}/>
            <MovingArrow x1={720} y1={660} x2={550} y2={710} color={tb.red} progress={transitionT} label={lang==='ru'?'Перекоп':'Perekop'}/>
          </g>
        )}
        {year.year === 1922 && (
          <g>
            <MovingArrow x1={1500} y1={530} x2={1760} y2={640} color={tb.red} progress={transitionT} label={lang==='ru'?'Владивосток':'Vladivostok'}/>
          </g>
        )}

        {/* Флаги */}
        {flags.map((fl, i) => {
          const city = CITIES_B.find(c => c.id === fl.city);
          if (!city) return null;
          const appearT = Math.min(1, Math.max(0, (inYearT * flags.length - i) * 2));
          return (
            <Flag key={`${year.year}-${fl.city}-${i}`}
              x={city.x} y={city.y}
              side={fl.side}
              label={fl.label[lang]}
              appear={appearT}
            />
          );
        })}

        {/* Легенда карты (в угол) */}
        <g transform="translate(1420, 830)">
          <rect x="0" y="0" width="460" height="220" fill="#f0dcae" stroke="#3a2010" strokeWidth="1.5" opacity="0.92"/>
          <text x="230" y="28" fontSize="16" fontFamily={fb.display} fontWeight="700" fontStyle="italic" textAnchor="middle" fill="#2a1010">
            {lang === 'ru' ? 'Карта фронтов' : 'Fronts map'} · {year.year}
          </text>
          <line x1="20" y1="52" x2="440" y2="52" stroke="#5a3a10" strokeWidth="0.8"/>

          <g transform="translate(20, 72)">
            <rect width="16" height="10" fill={tb.red} stroke="#3a0a0a"/>
            <text x="24" y="10" fontSize="13" fontFamily={fb.mono} fill="#2a1010">{lang === 'ru' ? 'Красная армия' : 'Red Army'}</text>
          </g>
          <g transform="translate(20, 96)">
            <rect width="16" height="10" fill={tb.white} stroke="#5a4020"/>
            <text x="24" y="10" fontSize="13" fontFamily={fb.mono} fill="#2a1010">{lang === 'ru' ? 'Белые армии' : 'White armies'}</text>
          </g>
          <g transform="translate(20, 120)">
            <rect width="16" height="10" fill={tb.brass} stroke="#3a2010"/>
            <text x="24" y="10" fontSize="13" fontFamily={fb.mono} fill="#2a1010">{lang === 'ru' ? 'Интервенты / прочие' : 'Intervention / other'}</text>
          </g>
          <g transform="translate(20, 148)">
            <line x1="0" y1="5" x2="40" y2="5" stroke={tb.red} strokeWidth="3" strokeDasharray="8 4"/>
            <text x="48" y="10" fontSize="13" fontFamily={fb.mono} fill="#2a1010">{lang === 'ru' ? 'Линия фронта' : 'Front line'}</text>
          </g>
          <text x="20" y="192" fontSize="11" fontFamily={fb.mono} fill="#6a4020" letterSpacing="0.1em">
            {lang === 'ru' ? 'РВСР · ОТДЕЛ ОПЕРАТИВНЫЙ' : 'RVSR · OPERATIONS DEPT'}
          </text>
        </g>
      </svg>

      {/* Большой заголовок года поверх карты */}
      <div style={{
        position: 'absolute', top: 150, left: 70,
        color: tb.ink, pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: fb.mono, fontSize: 16, letterSpacing: '0.3em', textTransform: 'uppercase', color: tb.inkFaint,
        }}>{data.chapter}</div>
        <div style={{
          fontSize: 180, fontFamily: fb.display, fontStyle: 'italic',
          lineHeight: 0.85, color: tb.redDeep,
          textShadow: '0 2px 0 rgba(255,240,200,.3), 0 4px 14px rgba(0,0,0,.4)',
          marginTop: 10,
        }}>{year.year}</div>
        <div style={{ fontSize: 28, fontFamily: fb.body, color: tb.ink, fontStyle: 'italic', marginTop: 18, maxWidth: 640, lineHeight: 1.3 }}>
          {data.subtitle}
        </div>
      </div>

      {/* Боковая панель событий */}
      <div style={{
        position: 'absolute', top: 470, left: 70, width: 420,
        background: 'rgba(240,220,170,.78)',
        border: `1px solid ${tb.paperDark}`,
        padding: '20px 22px',
        backdropFilter: 'blur(3px)',
        boxShadow: '0 6px 20px rgba(0,0,0,.35)',
      }}>
        <div style={{
          fontFamily: fb.mono, fontSize: 12, letterSpacing: '0.25em',
          color: tb.inkFaint, textTransform: 'uppercase',
          borderBottom: `1px solid ${tb.paperDark}`, paddingBottom: 10,
        }}>
          {lang === 'ru' ? 'Хроника года' : 'Chronicle of the year'}
        </div>
        {data.events.map((ev, i) => {
          const activeT = inYearT * data.events.length;
          const isActive = i <= Math.floor(activeT);
          const isCurrent = Math.floor(activeT) === i;
          return (
            <div key={i} style={{
              marginTop: 14,
              opacity: isActive ? 1 : 0.3,
              transform: isCurrent ? 'translateX(4px)' : 'none',
              transition: 'all .4s',
              borderLeft: isCurrent ? `3px solid ${tb.red}` : '3px solid transparent',
              paddingLeft: 12,
            }}>
              <div style={{ fontFamily: fb.mono, fontSize: 12, color: tb.inkFaint, letterSpacing: '0.15em' }}>{ev.date}</div>
              <div style={{ fontFamily: fb.display, fontSize: 20, color: tb.ink, fontWeight: 600, marginTop: 2 }}>{ev.title}</div>
              {isCurrent && (
                <div style={{ fontFamily: fb.body, fontSize: 14, color: tb.inkSoft, marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>
                  {ev.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MovingArrow({ x1, y1, x2, y2, color, progress, label }) {
  const tx = x1 + (x2 - x1) * progress;
  const ty = y1 + (y2 - y1) * progress;
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <g>
      <line x1={x1} y1={y1} x2={tx} y2={ty} stroke={color} strokeWidth="5" opacity="0.85" strokeLinecap="round" strokeDasharray="0"/>
      {/* наконечник */}
      <g transform={`translate(${tx}, ${ty}) rotate(${angle})`} opacity={progress}>
        <path d="M 0 0 L -20 -10 L -14 0 L -20 10 Z" fill={color}/>
      </g>
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 14}
          fontSize="14" fontFamily={fb.display} fontStyle="italic"
          fill={color} textAnchor="middle" fontWeight="700"
          style={{ textShadow: '0 1px 0 #f0dcae' }}>
          {label}
        </text>
      )}
    </g>
  );
}

window.DirectionB = DirectionB;
