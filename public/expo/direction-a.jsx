// Direction A — «Стол коменданта»
// Plan view тяжёлого дубового стола. Поверх — карта, компас, часы, телеграммы,
// плакат, наган-силуэт. По мере движения таймлайна предметы перемещаются,
// телеграммы «приходят», печати штампуются, страницы дневника перелистываются.

const { theme: t, fonts: f, paperBg, woodBg, ChapterMark, QuoteCard, Stamp } = window;

// ─── Регионы карты (для zoom) ────────────────────────────────────────────
// viewBox карты — 1100x680. Границы даны в этих же координатах.
const MAP_REGIONS = [
  {
    id: 'nw',
    ru: 'Сѣверо-Западъ', en: 'North-West',
    bbox: { x: 40, y: 190, w: 220, h: 200 },
    evByYear: {
      1918: {
        ru: 'Мартъ — переносъ столицы въ Москву. Англо-французскій десантъ въ Мурманскѣ (мартъ) и Архангельскѣ (августъ).',
        en: 'March — capital moved to Moscow. Anglo-French landings at Murmansk (March) and Arkhangelsk (August).',
      },
      1919: {
        ru: 'Маем и осенью — походы Юденича на Петроградъ. 21 октября отбитъ у Пулкова Троцкимъ.',
        en: 'In May and autumn — Yudenich marches on Petrograd. Repulsed at Pulkovo on 21 October by Trotsky.',
      },
      1920: {
        ru: 'Мирные договоры съ Эстоніей (Юрьевскій), Латвіей, Литвой, Финляндіей. Фронтъ закрытъ.',
        en: 'Peace treaties with Estonia (Tartu), Latvia, Lithuania, Finland. The front is closed.',
      },
      1921: {
        ru: '1—18 марта — Кронштадтское возстаніе. Тухачевскій штурмуетъ ледъ Финскаго залива. «За совѣты безъ коммунистовъ».',
        en: '1–18 March — Kronstadt uprising. Tukhachevsky storms the ice of the Gulf of Finland. “Soviets without communists.”',
      },
      1922: {
        ru: 'Голодъ отступаетъ. Петроградъ — изможденъ, населеніе сократилось втрое противъ 1917.',
        en: 'The famine recedes. Petrograd is exhausted: population down to a third of 1917 levels.',
      },
    },
  },
  {
    id: 'center',
    ru: 'Центральная Россія', en: 'Central Russia',
    bbox: { x: 175, y: 330, w: 170, h: 120 },
    evByYear: {
      1918: {
        ru: '5—6 іюля — возстаніе лѣвыхъ эсеровъ въ Москвѣ. 30 августа — покушеніе Каплан на Ленина у завода Михельсона.',
        en: '5–6 July — Left SR uprising in Moscow. 30 August — Kaplan’s attempt on Lenin at the Mikhelson factory.',
      },
      1919: {
        ru: '13 октября — Орёлъ у Деникина. До Москвы — 380 вёрстъ. 20 октября — Орёлъ отбитъ красными.',
        en: '13 October — Denikin takes Orel. Just 380 versts to Moscow. 20 October — the Reds retake Orel.',
      },
      1920: {
        ru: 'Тылъ. Москва — ставка СНК и РВСР, откуда управляется война на всѣхъ фронтахъ.',
        en: 'The rear. Moscow hosts the Sovnarkom and Revvoensovet, directing the war on all fronts.',
      },
      1921: {
        ru: 'Мартъ — X Съѣздъ партіи, переходъ къ НЭПу. Голодъ въ Центральной Россіи не такъ остеръ, какъ въ Поволжьѣ.',
        en: 'March — 10th Party Congress, transition to NEP. Famine in Central Russia is less acute than on the Volga.',
      },
      1922: {
        ru: 'Маемъ — Ленинъ переноситъ первый ударъ. Декабрь — I Съѣздъ Совѣтовъ СССР въ Москвѣ.',
        en: 'May — Lenin suffers his first stroke. December — 1st Congress of Soviets of the USSR, held in Moscow.',
      },
    },
  },
  {
    id: 'south',
    ru: 'Югъ · Донъ · Крымъ', en: 'South · Don · Crimea',
    bbox: { x: 140, y: 420, w: 270, h: 150 },
    evByYear: {
      1918: {
        ru: 'Февраль—апрѣль — Ледяной походъ Корнилова. 13 апрѣля — гибель Корнилова у Екатеринодара. Декабрь — взятіе Ростова красными.',
        en: 'Feb–Apr — Kornilov’s Ice March. 13 Apr — Kornilov killed near Yekaterinodar. December — Rostov taken by the Reds.',
      },
      1919: {
        ru: 'Іюнь — ВСЮР беретъ Царицынъ и Харьковъ. Осенью — «Московская директива»: Орёлъ, Воронежъ. Декабрь — отступленіе на Новороссійскъ.',
        en: 'Jun — AFSR takes Tsaritsyn and Kharkov. Autumn — the Moscow Directive: Orel, Voronezh. December — retreat to Novorossiysk.',
      },
      1920: {
        ru: 'Мартъ — эвакуація Новороссійска. Апрѣль — Деникинъ передаётъ команду Врангелю. 7—11 ноября — Перекопъ. 14—16 ноября — эвакуація Крыма.',
        en: 'March — Novorossiysk evacuation. April — Denikin hands command to Wrangel. 7–11 November — Perekop. 14–16 November — Crimea evacuated.',
      },
      1921: {
        ru: 'Махновщина доживаетъ свои дни. Августъ 1921 — Махно уходитъ въ Румынію.',
        en: 'The Makhnovist movement lives out its last days. August 1921 — Makhno flees to Romania.',
      },
      1922: {
        ru: 'Донъ и Кубань — голодъ, тифъ, возстановленіе желѣзныхъ дорогъ. Образованіе Украинской ССР входитъ въ СССР.',
        en: 'The Don and Kuban — famine, typhus, rebuilding of railways. Ukrainian SSR becomes part of the USSR.',
      },
    },
  },
  {
    id: 'volga',
    ru: 'Поволжье · Уралъ', en: 'Volga · Urals',
    bbox: { x: 340, y: 330, w: 240, h: 200 },
    evByYear: {
      1918: {
        ru: 'Маемъ — мятежъ Чехословацкаго корпуса вдоль Транссиба. Комучъ въ Самарѣ. Іюль — Романовы разстрѣляны въ Екатеринбургѣ.',
        en: 'May — Czechoslovak Legion revolt along the Trans-Siberian. Komuch in Samara. July — Romanovs shot in Yekaterinburg.',
      },
      1919: {
        ru: 'Весенее наступленіе Колчака остановлено подъ Самарой (Фрунзе, Бугурусланъ). Іюль — Уфа и Златоустъ у красныхъ.',
        en: 'Kolchak’s spring offensive stopped near Samara (Frunze, Buguruslan). July — Ufa and Zlatoust taken by the Reds.',
      },
      1920: {
        ru: 'Тылъ. Строительство Волго-Камской военной флотиліи, мобилизація продразвёрстки.',
        en: 'The rear. Construction of the Volga-Kama military flotilla; grain requisitioning ramps up.',
      },
      1921: {
        ru: 'Катастрофическій голодъ въ Поволжьѣ — до 5 милліоновъ погибшихъ. Помгольd, АРА, Ф. Нансенъ. Тамбовъ — газы.',
        en: 'Catastrophic famine on the Volga — up to 5 million dead. Pomgol, ARA, Fridtjof Nansen. Tambov — poison gas.',
      },
      1922: {
        ru: 'Голодъ отступаетъ только осенью. Конфискація церковныхъ цѣнностей подъ лозунгомъ помощи голодающимъ.',
        en: 'Famine recedes only in autumn. Confiscation of church valuables under the banner of famine relief.',
      },
    },
  },
  {
    id: 'siberia',
    ru: 'Сибирь', en: 'Siberia',
    bbox: { x: 580, y: 310, w: 320, h: 200 },
    evByYear: {
      1918: {
        ru: 'Маемъ — чехи захватываютъ Иркутскъ, Омскъ, Новониколаевскъ. 18 ноября — переворотъ Колчака въ Омскѣ.',
        en: 'May — the Czechs seize Irkutsk, Omsk, Novonikolaevsk. 18 November — Kolchak’s coup in Omsk.',
      },
      1919: {
        ru: 'Осенью — крахъ колчаковскаго фронта. Ноябрь — оставленъ Омскъ, «ледяной походъ» колчаковцевъ на востокъ.',
        en: 'Autumn — the Kolchak front collapses. November — Omsk abandoned; Kolchak’s “Ice March” eastward.',
      },
      1920: {
        ru: 'Январь — чехи выдаютъ Колчака иркутскому Политцентру. 7 февраля — разстрѣлъ Колчака въ Иркутскѣ.',
        en: 'January — the Czechs hand Kolchak to the Irkutsk Political Centre. 7 February — Kolchak shot in Irkutsk.',
      },
      1921: {
        ru: 'Возстанія въ Западной Сибири противъ продразвёрстки — крупнѣйшія въ исторіи РСФСР.',
        en: 'Uprisings across Western Siberia against grain requisitioning — the largest in RSFSR history.',
      },
      1922: {
        ru: 'Ликвидація остатковъ бѣлыхъ группъ. Сибирь включается въ хозяйственную жизнь РСФСР.',
        en: 'Mop-up of remaining White detachments. Siberia re-integrates into RSFSR economic life.',
      },
    },
  },
  {
    id: 'fareast',
    ru: 'Дальній Востокъ', en: 'Far East',
    bbox: { x: 860, y: 340, w: 220, h: 230 },
    evByYear: {
      1918: {
        ru: 'Апрѣль — японцы высаживаются во Владивостокѣ. Атаманъ Семёновъ въ Читѣ. Японская интервенція растянется до 1922.',
        en: 'April — Japanese land at Vladivostok. Ataman Semyonov in Chita. Japanese intervention will drag on until 1922.',
      },
      1919: {
        ru: 'Владивостокъ — тылъ Колчака, главный каналъ снабженія отъ Антанты по Транссибу.',
        en: 'Vladivostok — Kolchak’s rear; the main Entente supply channel via the Trans-Siberian.',
      },
      1920: {
        ru: 'Апрѣль — Дальне-Восточная Республика какъ буферъ между РСФСР и Японіей. Столица — Верхнеудинскъ, затѣмъ Чита.',
        en: 'April — the Far Eastern Republic is created as a buffer between the RSFSR and Japan. Capital in Verkhneudinsk, then Chita.',
      },
      1921: {
        ru: 'Маемъ — бѣлый переворотъ во Владивостокѣ (братья Меркуловы). Народно-рев. армія ДВР готовитъ отвѣтный ударъ.',
        en: 'May — White coup in Vladivostok (the Merkulov brothers). The FER People’s Revolutionary Army prepares its counter.',
      },
      1922: {
        ru: 'Февраль — Волочаевка. Октябрь — Споссск, Хабаровскъ, Владивостокъ взяты НРА. 15 ноября — ДВР вошла въ РСФСР.',
        en: 'February — Volochayevka. October — Spassk, Khabarovsk, Vladivostok taken by the PRA. 15 November — FER joins the RSFSR.',
      },
    },
  },
];

// ─── Карта (стилизованная, из SVG path) ───────────────────────────────────
function DeskMap({ year, x, y, width = 1100, rotate = -3 }) {
  // упрощённый контур европейской части СССР
  const height = width * 0.62;
  const [region, setRegion] = React.useState(null); // id выбранного региона или null

  // Esc → выход из зума
  React.useEffect(() => {
    if (!region) return;
    const onKey = (e) => { if (e.key === 'Escape') setRegion(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [region]);

  // считаем transform для <g.zoomable>
  const vbW = 1100, vbH = 680;
  let transform = 'translate(0,0) scale(1)';
  if (region) {
    const r = MAP_REGIONS.find(rr => rr.id === region);
    if (r) {
      const pad = 30;
      const bw = r.bbox.w + pad * 2;
      const bh = r.bbox.h + pad * 2;
      const scale = Math.min(vbW / bw, vbH / bh);
      const tx = -((r.bbox.x - pad) * scale) + (vbW - bw * scale) / 2;
      const ty = -((r.bbox.y - pad) * scale) + (vbH - bh * scale) / 2;
      transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    }
  }

  const activeRegion = region ? MAP_REGIONS.find(r => r.id === region) : null;
  const ev = activeRegion && activeRegion.evByYear[year.year]
    ? activeRegion.evByYear[year.year][year.lang || 'ru']
    : null;

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width, height,
      transform: `rotate(${rotate}deg)`,
      transformOrigin: 'center',
      boxShadow: '0 14px 30px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)',
    }}>
      {/* бумажная подложка */}
      <div style={{
        position: 'absolute', inset: 0,
        ...paperBg({ base: '#e0cea3', vignette: false }),
        border: `1px solid ${t.paperDark}`,
      }}/>

      {/* складки карты */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'linear-gradient(90deg, transparent 32.5%, rgba(40,20,0,.18) 33%, transparent 33.5%)',
          'linear-gradient(90deg, transparent 65.5%, rgba(40,20,0,.18) 66%, transparent 66.5%)',
          'linear-gradient(180deg, transparent 48.5%, rgba(40,20,0,.18) 49%, transparent 49.5%)',
        ].join(','),
      }}/>

      <svg viewBox="0 0 1100 680"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
          cursor: region ? 'zoom-out' : 'default' }}
        onClick={(e) => {
          // клик по фону (не по региону и не по подписям) — закрыть зум
          if (region && e.target === e.currentTarget) setRegion(null);
        }}
      >
        <defs>
          <pattern id="seaHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6a8aa6" strokeWidth="0.5" opacity="0.35"/>
          </pattern>
        </defs>

        {/* море (фон — отдельно, чтобы было видно, что суша выделяется) */}
        <rect width="1100" height="680" fill="url(#seaHatch)" opacity="0.7"/>

        <g style={{
          transform,
          transformOrigin: '0 0',
          transition: 'transform 700ms cubic-bezier(.4,.15,.2,1)',
        }}>
        {/* подписи морей */}
        <text x="120" y="95" fontSize="13" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.7">
          {year.lang === 'ru' ? 'Сѣверный Ледовитый океанъ' : 'Arctic Ocean'}
        </text>
        <text x="60" y="420" fontSize="11" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.65">
          {year.lang === 'ru' ? 'Балт.' : 'Baltic'}
        </text>
        <text x="210" y="550" fontSize="11" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.65">
          {year.lang === 'ru' ? 'Чёрное м.' : 'Black Sea'}
        </text>
        <text x="440" y="560" fontSize="11" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.65">
          {year.lang === 'ru' ? 'Каспій' : 'Caspian'}
        </text>
        <text x="1000" y="480" fontSize="11" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.65">
          {year.lang === 'ru' ? 'Тих. ок.' : 'Pacific'}
        </text>

        {/* ──── Контур РСФСР / СССР к 1922 — узнаваемый силуэтъ ──── */}
        {/* Виртуальный прямоугольник 50..1050 x 120..560.
           Реальный СССР тянется от 20°E до 170°E (≈ 150° долготы),
           по широте — 42°N..78°N. Пропорция шир/дл ≈ 1:4.
        */}
        <path
          d="
            M 80 320
            Q 60 280 90 250
            L 140 235
            Q 175 220 185 190
            L 220 170
            Q 260 155 290 175
            L 330 200
            Q 370 195 400 175
            Q 425 150 470 145
            L 520 160
            Q 560 150 600 155
            Q 650 140 700 150
            Q 760 145 810 165
            Q 870 160 920 180
            Q 970 195 1000 180
            L 1035 155
            Q 1055 170 1050 210
            L 1030 255
            Q 1045 290 1025 320
            L 1030 355
            Q 1055 395 1030 425
            L 990 440
            Q 975 465 990 490
            Q 1010 510 990 530
            Q 960 540 925 525
            Q 890 515 870 490
            L 840 470
            Q 815 475 800 460
            Q 775 445 755 430
            L 730 420
            Q 705 430 690 445
            L 665 450
            Q 635 440 610 450
            L 580 455
            Q 550 445 530 455
            L 505 475
            Q 485 488 460 482
            L 440 495
            Q 420 505 415 490
            L 410 470
            Q 400 465 395 480
            Q 385 505 360 508
            L 335 500
            Q 310 510 292 500
            L 278 515
            Q 260 540 235 540
            Q 215 535 205 515
            L 190 500
            Q 170 490 160 470
            L 145 445
            Q 130 435 125 415
            L 115 390
            Q 100 380 95 358
            L 80 320 Z
          "
          fill="#eccf92"
          stroke="#5a3a1a"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Кольский полуостров — выступ на север */}
        <path d="M 155 235 Q 165 215 180 225 Q 175 245 160 245 Z"
          fill="#eccf92" stroke="#5a3a1a" strokeWidth="1.4"/>

        {/* Камчатка — язык на восток-юг */}
        <path d="M 1010 430 Q 1040 445 1050 490 Q 1045 540 1025 555 Q 1015 520 1010 480 Z"
          fill="#eccf92" stroke="#5a3a1a" strokeWidth="1.4"/>

        {/* Сахалинъ */}
        <ellipse cx="985" cy="470" rx="5" ry="24" fill="#eccf92" stroke="#5a3a1a" strokeWidth="1"/>

        {/* Чёрное море — вырез внутрь */}
        <path
          d="M 205 470 Q 240 475 280 470 Q 310 475 330 485 Q 340 495 325 505 Q 290 515 255 510 Q 220 505 205 490 Z"
          fill="url(#seaHatch)" stroke="#5a3a1a" strokeWidth="1.2"
        />
        {/* Каспий */}
        <path
          d="M 435 475 Q 455 478 465 500 Q 470 530 458 555 Q 445 570 430 555 Q 420 525 425 500 Z"
          fill="url(#seaHatch)" stroke="#5a3a1a" strokeWidth="1.2"
        />
        {/* Аральское */}
        <ellipse cx="530" cy="510" rx="14" ry="9" fill="url(#seaHatch)" stroke="#5a3a1a" strokeWidth="0.8"/>
        {/* Байкал */}
        <path d="M 800 340 Q 820 360 830 400 Q 825 420 815 405 Q 800 370 800 340 Z"
          fill="url(#seaHatch)" stroke="#5a3a1a" strokeWidth="0.8"/>

        {/* Финляндия (внутренний вырез) */}
        <path
          d="M 120 290 Q 135 310 145 340 Q 140 360 125 355 Q 115 330 118 300 Z"
          fill="url(#seaHatch)" stroke="#5a3a1a" strokeWidth="1"
        />

        {/* Урал (гряда) */}
        <path d="M 580 220 Q 590 300 595 390 Q 600 470 605 520"
          stroke="#8a6a3c" strokeWidth="2.5" fill="none" strokeDasharray="2 4" opacity="0.7"/>
        <text x="610" y="260" fontSize="10" fontFamily={f.display} fontStyle="italic" fill="#6a4a20" opacity="0.8">
          {year.lang === 'ru' ? 'Уралъ' : 'Urals'}
        </text>

        {/* реки */}
        <path d="M 180 320 Q 200 400 220 470" stroke="#5a7a9a" strokeWidth="1.8" fill="none" opacity="0.75"/>
        <path d="M 340 250 Q 360 350 390 450 Q 410 475 430 478" stroke="#5a7a9a" strokeWidth="2" fill="none" opacity="0.8"/>
        <text x="345" y="355" fontSize="10" fontFamily={f.display} fontStyle="italic" fill="#4a6a8a" opacity="0.75">{year.lang === 'ru' ? 'Волга' : 'Volga'}</text>
        <path d="M 690 230 Q 700 310 715 390 Q 725 460 730 500" stroke="#5a7a9a" strokeWidth="1.8" fill="none" opacity="0.7"/>
        <path d="M 860 240 Q 870 320 880 400" stroke="#5a7a9a" strokeWidth="1.6" fill="none" opacity="0.6"/>

        {/* ──── Города ──── */}
        {[
          { x: 135, y: 320, name: year.lang === 'ru' ? 'Петроградъ' : 'Petrograd', big: true },
          { x: 205, y: 375, name: year.lang === 'ru' ? 'Москва' : 'Moscow', big: true, cap: true },
          { x: 150, y: 255, name: year.lang === 'ru' ? 'Мурманскъ' : 'Murmansk' },
          { x: 340, y: 460, name: year.lang === 'ru' ? 'Царицынъ' : 'Tsaritsyn' },
          { x: 380, y: 420, name: year.lang === 'ru' ? 'Самара' : 'Samara' },
          { x: 540, y: 370, name: year.lang === 'ru' ? 'Уфа' : 'Ufa' },
          { x: 660, y: 380, name: year.lang === 'ru' ? 'Омскъ' : 'Omsk' },
          { x: 725, y: 395, name: year.lang === 'ru' ? 'Новониколаевскъ' : 'Novonikolaevsk' },
          { x: 830, y: 380, name: year.lang === 'ru' ? 'Иркутскъ' : 'Irkutsk' },
          { x: 270, y: 450, name: year.lang === 'ru' ? 'Ростовъ' : 'Rostov' },
          { x: 170, y: 440, name: year.lang === 'ru' ? 'Кіевъ' : 'Kiev' },
          { x: 280, y: 505, name: year.lang === 'ru' ? 'Екатеринодаръ' : 'Ekaterinodar' },
          { x: 320, y: 395, name: year.lang === 'ru' ? 'Орёлъ' : 'Orel' },
          { x: 435, y: 400, name: year.lang === 'ru' ? 'Екатеринбургъ' : 'Yekaterinburg' },
          { x: 1000, y: 480, name: year.lang === 'ru' ? 'Владивостокъ' : 'Vladivostok' },
        ].map((c, i) => (
          <g key={i}>
            {c.cap && <circle cx={c.x} cy={c.y} r="10" fill="none" stroke={t.redDeep} strokeWidth="1.5" opacity="0.65"/>}
            <circle cx={c.x} cy={c.y} r={c.big ? 5 : 3.2} fill="#3a1010" stroke="#6a2020" strokeWidth="1"/>
            <text x={c.x + 8} y={c.y + 4} fontSize={c.big ? 13 : 11} fontFamily={f.mono}
              fontWeight={c.big ? 700 : 400} fill="#2a1408">{c.name}</text>
          </g>
        ))}

        {/* фронты — зависят от года */}
        {year.year === 1918 && (
          <g>
            {/* Восточный фронт — по Уралу и Волге */}
            <path d="M 570 220 Q 580 320 590 420 Q 600 490 580 530"
              stroke={t.red} strokeWidth="4" fill="none" strokeDasharray="10 5" opacity="0.9"/>
            <text x="555" y="250" fontSize="15" fontFamily={f.display} fill={t.red} fontStyle="italic" transform="rotate(92 555 250)">
              {year.lang === 'ru' ? 'Восточный фронтъ' : 'Eastern Front'}
            </text>
            {/* Южный фронт — Дон, Кубань */}
            <path d="M 220 470 Q 260 485 320 490 Q 360 495 400 480"
              stroke={t.red} strokeWidth="3.5" fill="none" strokeDasharray="8 4" opacity="0.8"/>
            <text x="230" y="500" fontSize="12" fontFamily={f.mono} fill={t.red}>{year.lang === 'ru' ? 'Южный фр.' : 'Southern Fr.'}</text>
            {/* Интервенция — Мурманск, Архангельск */}
            <circle cx="150" cy="255" r="14" fill="none" stroke={t.red} strokeWidth="2" opacity="0.7"/>
            <text x="82" y="240" fontSize="11" fontFamily={f.mono} fill={t.redDeep}>{year.lang === 'ru' ? 'Антанта' : 'Entente'}</text>
          </g>
        )}
        {year.year === 1919 && (
          <g>
            {/* Деникин идёт на Москву */}
            <path d="M 270 505 Q 260 470 250 430 Q 235 400 220 380"
              stroke={t.red} strokeWidth="5" fill="none" strokeDasharray="12 5" opacity="0.95"/>
            <circle cx="205" cy="375" r="16" fill="none" stroke={t.red} strokeWidth="2.5" opacity="0.8"/>
            <text x="225" y="370" fontSize="13" fontFamily={f.display} fill={t.red} fontStyle="italic">{year.lang === 'ru' ? 'Орёлъ — 380 вёрстъ' : 'Orel — 380 versts'}</text>
            {/* Колчак — с востока на запад по Уралу */}
            <path d="M 660 380 Q 610 380 570 370 Q 520 370 480 365"
              stroke={t.red} strokeWidth="4" fill="none" strokeDasharray="8 4" opacity="0.85"/>
            <text x="570" y="345" fontSize="12" fontFamily={f.mono} fill={t.redDeep}>{year.lang === 'ru' ? '← Колчакъ' : '← Kolchak'}</text>
            {/* Юденич к Петрограду */}
            <path d="M 85 330 Q 110 322 135 320"
              stroke={t.red} strokeWidth="3.5" fill="none" strokeDasharray="6 3" opacity="0.8"/>
            <text x="70" y="345" fontSize="11" fontFamily={f.mono} fill={t.redDeep}>{year.lang === 'ru' ? 'Юденичъ →' : 'Yudenich →'}</text>
          </g>
        )}
        {year.year === 1920 && (
          <g>
            {/* Совѣтско-польская война — Киевъ, Варшава */}
            <path d="M 90 430 Q 130 435 170 440"
              stroke={t.red} strokeWidth="4" fill="none" strokeDasharray="10 4" opacity="0.9"/>
            <text x="85" y="455" fontSize="12" fontFamily={f.mono} fill={t.red}>{year.lang === 'ru' ? 'Варшава' : 'Warsaw'}</text>
            <text x="155" y="425" fontSize="12" fontFamily={f.mono} fill={t.red}>{year.lang === 'ru' ? 'Кіевъ' : 'Kiev'}</text>
            {/* Крымъ — Перекопъ */}
            <path d="M 260 490 Q 270 505 285 515 Q 295 525 290 540"
              stroke={t.red} strokeWidth="3.5" fill="none" opacity="0.85"/>
            <circle cx="288" cy="518" r="10" fill={t.red} opacity="0.65"/>
            <text x="300" y="520" fontSize="13" fontFamily={f.display} fill={t.red} fontStyle="italic">
              {year.lang === 'ru' ? 'Перекопъ · Крымъ' : 'Perekop · Crimea'}
            </text>
          </g>
        )}
        {year.year === 1921 && (
          <g>
            {/* Кронштадтъ (близъ Петрограда) */}
            <circle cx="125" cy="318" r="10" fill="none" stroke={t.red} strokeWidth="2.5" opacity="0.9"/>
            <text x="75" y="308" fontSize="12" fontFamily={f.mono} fill={t.redDeep}>{year.lang === 'ru' ? 'Кронштадтъ' : 'Kronstadt'}</text>
            {/* Поволжье — голодъ */}
            <ellipse cx="390" cy="430" rx="46" ry="32" fill={t.red} fillOpacity="0.12"
              stroke={t.red} strokeWidth="2" strokeDasharray="3 3" opacity="0.85"/>
            <text x="355" y="395" fontSize="14" fontFamily={f.display} fill={t.red} fontStyle="italic">
              {year.lang === 'ru' ? 'Поволжье · голодъ' : 'Volga · famine'}
            </text>
            {/* Тамбовъ — Антоновщина */}
            <circle cx="270" cy="415" r="8" fill={t.red} opacity="0.75"/>
            <text x="235" y="410" fontSize="11" fontFamily={f.mono} fill={t.redDeep}>{year.lang === 'ru' ? 'Тамбовъ' : 'Tambov'}</text>
          </g>
        )}
        {year.year === 1922 && (
          <g>
            {/* Путь на Владивостокъ */}
            <path d="M 830 380 Q 890 410 940 440 Q 980 460 1000 480"
              stroke={t.red} strokeWidth="5" fill="none" opacity="0.9"/>
            <circle cx="1000" cy="480" r="12" fill={t.red}/>
            <text x="895" y="430" fontSize="14" fontFamily={f.display} fill={t.red} fontStyle="italic">
              {year.lang === 'ru' ? 'На Владивостокъ' : 'To Vladivostok'}
            </text>
            {/* 30 декабря — образование СССР: рамка на всю страну */}
            <rect x="100" y="220" width="900" height="320"
              fill="none" stroke={t.redDeep} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
            <text x="550" y="210" fontSize="14" fontFamily={f.display} fontStyle="italic" fill={t.redDeep} textAnchor="middle">
              {year.lang === 'ru' ? '30 декабря 1922 — СССР' : '30 Dec 1922 — USSR'}
            </text>
          </g>
        )}

        {/* легенда */}
        <g transform="translate(820, 540)" opacity={region ? 0 : 1} style={{ transition: 'opacity 300ms' }}>
          <rect width="230" height="90" fill="#f5e4b5" stroke="#6a4a20" strokeWidth="1"/>
          <text x="115" y="20" fontSize="11" fontFamily={f.display} fontStyle="italic" textAnchor="middle" fill="#3a1c08">
            {year.lang === 'ru' ? 'Фронты Гражданской войны' : 'Civil War Fronts'}
          </text>
          <line x1="14" y1="40" x2="40" y2="40" stroke={t.red} strokeWidth="3" strokeDasharray="6 3"/>
          <text x="48" y="44" fontSize="10" fontFamily={f.mono} fill="#3a1c08">{year.lang === 'ru' ? 'Красный' : 'Red'}</text>
          <line x1="14" y1="58" x2="40" y2="58" stroke="#8a6a30" strokeWidth="2"/>
          <text x="48" y="62" fontSize="10" fontFamily={f.mono} fill="#3a1c08">{year.lang === 'ru' ? 'Граница' : 'Border'}</text>
          <text x="14" y="80" fontSize="9" fontFamily={f.mono} fill="#6a4a20">{year.year} · {year.lang === 'ru' ? 'РВСР' : 'RVSR'}</text>
        </g>

        </g>{/* /zoomable */}

        {/* ──── Регіоны (hit-boxes + подписи) — НЕ масштабируются ──── */}
        {!region && MAP_REGIONS.map(r => {
          const cx = r.bbox.x + r.bbox.w / 2;
          const cy = r.bbox.y + r.bbox.h / 2;
          return (
            <g key={r.id}
              onClick={() => { setRegion(r.id); }}
              style={{ cursor: 'zoom-in' }}
            >
              <rect x={r.bbox.x} y={r.bbox.y} width={r.bbox.w} height={r.bbox.h}
                fill="#000"
                fillOpacity={0}
                stroke="#3a1c08"
                strokeWidth={0.8}
                strokeDasharray="4 4"
                strokeOpacity={0.18}
              />
              {false && (
                <>
                  <rect x={cx - 80} y={cy - 16} width="160" height="32"
                    fill="#f0dcae" stroke="#3a1c08" strokeWidth="1" opacity="0.95"/>
                  <text x={cx} y={cy + 5} textAnchor="middle"
                    fontSize="14" fontFamily={f.display} fontStyle="italic"
                    fill="#3a1c08">⌕ {r[year.lang || 'ru']}</text>
                </>
              )}
            </g>
          );
        })}

        {/* активный регіонъ — рамка */}
        {region && activeRegion && (() => {
          const r = activeRegion;
          // границы региона после масштабированія — SVG координаты (после transform)
          // мы их не анимируемъ, покажем лейблъ поверх
          return (
            <g>
              {/* клик на любом месте закрывает зум */}
              <rect x={0} y={0} width={vbW} height={vbH}
                fill="transparent"
                onClick={() => setRegion(null)}
                style={{ cursor: 'zoom-out' }}
              />
              <rect x={20} y={20} width={vbW - 40} height="44"
                fill="#f0dcae" stroke="#3a1c08" strokeWidth="1.5"
                pointerEvents="none"/>
              <text x={40} y={48} fontSize="20" fontFamily={f.display} fontStyle="italic" fill="#3a1c08"
                pointerEvents="none">
                ⌕ {r[year.lang || 'ru']}
              </text>
              <text x={vbW - 40} y={48} textAnchor="end"
                fontSize="13" fontFamily={f.mono} fill="#6a4a20" letterSpacing="0.15em"
                pointerEvents="none">
                {year.year}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* штамп */}
      <div style={{ position: 'absolute', top: 30, right: 50 }}>
        <Stamp text={year.lang === 'ru' ? 'СЕКРЕТНО' : 'CLASSIFIED'} sub="РВСР" size={120} rotate={12} opacity={0.55}/>
      </div>

      {/* ──── Панель событий региона + кнопка закрыть ──── */}
      {region && activeRegion && (
        <>
          {/* кнопка закрыть */}
          <button
            onClick={() => setRegion(null)}
            style={{
              position: 'absolute', top: 20, left: 20,
              width: 46, height: 46,
              borderRadius: '50%',
              background: t.paperLight,
              border: `1.5px solid ${t.inkFaint}`,
              color: t.redDeep,
              fontFamily: f.display,
              fontSize: 22, fontStyle: 'italic',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 20,
            }}
            aria-label={year.lang === 'ru' ? 'Закрыть' : 'Close'}
          >×</button>

          {/* карточка событий региона */}
          <div style={{
            position: 'absolute',
            right: 40, bottom: 40, width: 420,
            background: '#f5e4b5',
            border: `1px solid ${t.paperDark}`,
            padding: '22px 26px 24px',
            boxShadow: '0 16px 40px rgba(0,0,0,.55), 0 3px 8px rgba(0,0,0,.3)',
            transform: 'rotate(-1.2deg)',
            zIndex: 18,
            animation: 'aDropIn 420ms cubic-bezier(.2,.7,.3,1) both',
          }}>
            <style>{`
              @keyframes aDropIn {
                from { opacity: 0; transform: translateY(-24px) rotate(-1.2deg); }
                to { opacity: 1; transform: translateY(0) rotate(-1.2deg); }
              }
            `}</style>
            <div style={{
              fontFamily: f.mono, fontSize: 10, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: t.inkFaint,
            }}>
              {year.lang === 'ru' ? 'Выписка · РВСР' : 'Excerpt · Revvoensovet'}
            </div>
            <div style={{
              fontSize: 26, fontFamily: f.display, fontStyle: 'italic',
              color: t.redDeep, lineHeight: 1.1, marginTop: 4,
              letterSpacing: '-0.01em',
            }}>
              {activeRegion[year.lang || 'ru']}
            </div>
            <div style={{
              marginTop: 10, height: 1,
              background: `repeating-linear-gradient(90deg, ${t.inkFaint} 0 4px, transparent 4px 8px)`,
              opacity: 0.6,
            }}/>
            <div style={{
              fontSize: 15, fontFamily: f.body, lineHeight: 1.5,
              color: t.ink, marginTop: 12,
              fontStyle: 'italic',
              textWrap: 'pretty',
            }}>
              {ev || (year.lang === 'ru'
                ? '— событій за сей годъ не записано въ сводкѣ. —'
                : '— no events logged for this year. —')}
            </div>
            <div style={{
              marginTop: 14, fontFamily: f.mono, fontSize: 10,
              color: t.inkFaint, letterSpacing: '0.12em',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{year.year}</span>
              <span>{year.lang === 'ru' ? 'л. оборот.' : 'verso'}</span>
            </div>
          </div>
        </>
      )}

      {/* подсказка «кликни» — когда не выбрано */}
      {!region && (
        <div style={{
          position: 'absolute', left: 30, top: 20,
          fontFamily: f.mono, fontSize: 11, letterSpacing: '0.2em',
          color: t.inkFaint, textTransform: 'uppercase',
          background: 'rgba(245,228,181,.85)',
          padding: '6px 12px',
          border: `1px solid ${t.paperDark}`,
          boxShadow: '0 3px 10px rgba(0,0,0,.25)',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          {year.lang === 'ru' ? '⌕ кликните по региону' : '⌕ click a region'}
        </div>
      )}
    </div>
  );
}

// ─── Компас ────────────────────────────────────────────────────────────────
function Compass({ x, y, size = 180, rotation = 0 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, #e8d090 0%, #c8a060 55%, #7a5020 100%)`,
      boxShadow: '0 12px 30px rgba(0,0,0,.6), inset 0 2px 6px rgba(255,220,160,.6), inset 0 -4px 8px rgba(40,20,0,.8)',
      border: `3px solid ${t.brass}`,
    }}>
      {/* стеклянная плёнка */}
      <div style={{
        position: 'absolute', inset: 12,
        borderRadius: '50%',
        background: `radial-gradient(ellipse at 30% 25%, rgba(255,255,255,.55) 0%, transparent 45%), ${t.paperLight}`,
        boxShadow: 'inset 0 2px 8px rgba(80,60,20,.4)',
      }}>
        {/* румбы */}
        <svg viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* внешний круг делений */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = i * 5;
            const major = i % 9 === 0;
            const r1 = 68, r2 = major ? 58 : 63;
            const x1 = 80 + r1 * Math.cos(angle * Math.PI / 180 - Math.PI / 2);
            const y1 = 80 + r1 * Math.sin(angle * Math.PI / 180 - Math.PI / 2);
            const x2 = 80 + r2 * Math.cos(angle * Math.PI / 180 - Math.PI / 2);
            const y2 = 80 + r2 * Math.sin(angle * Math.PI / 180 - Math.PI / 2);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a1c08" strokeWidth={major ? 1.5 : 0.7}/>;
          })}
          {/* буквы */}
          {[
            { a: 0,   l: 'С', color: t.redDeep },
            { a: 90,  l: 'В' },
            { a: 180, l: 'Ю' },
            { a: 270, l: 'З' },
          ].map((c, i) => {
            const x = 80 + 50 * Math.cos(c.a * Math.PI / 180 - Math.PI / 2);
            const y = 80 + 50 * Math.sin(c.a * Math.PI / 180 - Math.PI / 2);
            return (
              <text key={i} x={x} y={y + 5}
                textAnchor="middle"
                fontSize="14" fontFamily={f.display} fontWeight="700"
                fill={c.color || '#3a1c08'}>
                {c.l}
              </text>
            );
          })}
          {/* звезда роза ветров */}
          <g transform={`rotate(${rotation} 80 80)`}>
            <path d="M 80 20 L 86 80 L 80 140 L 74 80 Z" fill={t.redDeep} stroke="#2a1010" strokeWidth="0.5"/>
            <path d="M 20 80 L 80 74 L 140 80 L 80 86 Z" fill="#d9c398" stroke="#5a4020" strokeWidth="0.5"/>
            <circle cx="80" cy="80" r="4" fill={t.brass} stroke="#2a1010"/>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─── Карманные часы ────────────────────────────────────────────────────────
function PocketWatch({ x, y, size = 150, minutes = 0 }) {
  const hourAngle = (minutes / 60 * 30) % 360;
  const minAngle = (minutes * 6) % 360;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size * 1.15,
    }}>
      {/* ушко */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 22, height: 26,
        borderRadius: '50%',
        background: `linear-gradient(180deg, ${t.gold} 0%, ${t.brass} 100%)`,
        border: `1px solid #3a2010`,
        boxShadow: '0 2px 4px rgba(0,0,0,.5)',
      }}/>
      {/* корпус */}
      <div style={{
        position: 'absolute', top: 16, left: 0,
        width: size, height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 25%, #e8c878, ${t.brass} 60%, #3a2010 100%)`,
        boxShadow: '0 12px 28px rgba(0,0,0,.6), inset 0 3px 8px rgba(255,220,160,.4), inset 0 -4px 10px rgba(0,0,0,.6)',
        border: `3px solid ${t.brass}`,
      }}>
        {/* циферблат */}
        <div style={{
          position: 'absolute', inset: 14,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 40% 30%, #f4e8cf 0%, #d9c398 100%)`,
          boxShadow: 'inset 0 2px 10px rgba(80,50,20,.4)',
        }}>
          <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%' }}>
            {/* римские цифры */}
            {['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'].map((num, i) => {
              const a = i * 30 - 90;
              const r = 56;
              const x = 70 + r * Math.cos(a * Math.PI / 180);
              const y = 70 + r * Math.sin(a * Math.PI / 180);
              return <text key={i} x={x} y={y+4} textAnchor="middle" fontSize="11" fontFamily={f.display} fontWeight="700" fill="#3a1c08">{num}</text>;
            })}
            {/* часовая */}
            <line x1="70" y1="70"
              x2={70 + 30 * Math.cos((hourAngle - 90) * Math.PI / 180)}
              y2={70 + 30 * Math.sin((hourAngle - 90) * Math.PI / 180)}
              stroke="#2a1010" strokeWidth="3.5" strokeLinecap="round"/>
            {/* минутная */}
            <line x1="70" y1="70"
              x2={70 + 48 * Math.cos((minAngle - 90) * Math.PI / 180)}
              y2={70 + 48 * Math.sin((minAngle - 90) * Math.PI / 180)}
              stroke="#2a1010" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="70" cy="70" r="3.5" fill={t.redDeep}/>
          </svg>
        </div>
      </div>
      {/* цепочка */}
      <svg style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 200, height: 40, pointerEvents: 'none' }}>
        <path d="M 10 30 Q 100 -10 190 30" stroke="#b89040" strokeWidth="3" fill="none" strokeDasharray="2 2"/>
      </svg>
    </div>
  );
}

// ─── Телеграмма / документ ─────────────────────────────────────────────────
function Telegram({ x, y, rotate = 0, width = 360, entry = 0, duration = 0, localTime = 0, lang, event }) {
  const appear = Math.min(1, Math.max(0, (localTime - entry) / 0.6));
  const offsetY = (1 - appear) * 60;
  const op = appear;
  return (
    <div style={{
      position: 'absolute', left: x, top: y + offsetY,
      width,
      transform: `rotate(${rotate}deg)`,
      opacity: op,
      transition: 'opacity .1s',
      boxShadow: '0 6px 20px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.3)',
      fontFamily: f.stamp,
      color: '#2a1010',
    }}>
      <div style={{
        padding: '18px 22px 24px',
        ...paperBg({ base: '#f0e0b0', vignette: false }),
        border: `1px solid ${t.paperDark}`,
        position: 'relative',
      }}>
        {/* перфорация сверху */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: `repeating-linear-gradient(90deg, transparent 0 8px, rgba(100,70,30,.6) 8px 9px, transparent 9px 16px)`,
        }}/>
        <div style={{
          fontSize: 11, fontFamily: f.mono, letterSpacing: '0.2em',
          color: '#6a4a20',
          borderBottom: '1px dashed #8a6a40',
          paddingBottom: 6,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{lang === 'ru' ? 'ТЕЛЕГРАММА' : 'TELEGRAM'}</span>
          <span>{event.date}</span>
        </div>
        <div style={{
          marginTop: 12,
          fontSize: 18,
          fontFamily: f.stamp,
          lineHeight: 1.35,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          wordSpacing: '0.15em',
        }}>
          {event.title}
        </div>
        <div style={{
          marginTop: 10,
          fontSize: 13,
          fontFamily: f.stamp,
          lineHeight: 1.5,
          color: '#3a2010',
        }}>
          {event.note}
        </div>
        {/* штамп */}
        <div style={{
          position: 'absolute', top: 18, right: 18,
          transform: 'rotate(8deg)',
          border: `2px solid ${t.redDeep}`,
          padding: '4px 10px',
          color: t.redDeep,
          fontSize: 10,
          letterSpacing: '0.2em',
          fontFamily: f.mono,
          fontWeight: 700,
          opacity: 0.8,
        }}>
          {lang === 'ru' ? 'ПРИНЯТО' : 'RECEIVED'}
        </div>
      </div>
    </div>
  );
}

// ─── Плакат ────────────────────────────────────────────────────────────────
function Poster({ x, y, rotate = 0, width = 280, year, lang }) {
  const posters = {
    1918: {
      ru: { top: 'СВОБОДА', mid: 'ИЛИ', bot: 'СМЕРТЬ', color: t.red },
      en: { top: 'FREEDOM', mid: 'OR', bot: 'DEATH', color: t.red },
    },
    1919: {
      ru: { top: 'ВСЕ', mid: 'НА БОРЬБУ', bot: 'С ДЕНИКИНЫМ!', color: t.redDeep },
      en: { top: 'ALL', mid: 'AGAINST', bot: 'DENIKIN!', color: t.redDeep },
    },
    1920: {
      ru: { top: 'ТЫ', mid: 'ЗАПИСАЛСЯ', bot: 'ДОБРОВОЛЬЦЕМ?', color: '#8a3010' },
      en: { top: 'HAVE YOU', mid: 'ENLISTED AS A', bot: 'VOLUNTEER?', color: '#8a3010' },
    },
    1921: {
      ru: { top: 'ПОМОГИ!', mid: 'ГОЛОД', bot: 'В ПОВОЛЖЬЕ', color: '#6b0d0d' },
      en: { top: 'HELP!', mid: 'FAMINE', bot: 'IN THE VOLGA', color: '#6b0d0d' },
    },
    1922: {
      ru: { top: 'МИР', mid: 'ТРУД', bot: 'ОКТЯБРЬ', color: t.red },
      en: { top: 'PEACE', mid: 'LABOR', bot: 'OCTOBER', color: t.red },
    },
  };
  const p = posters[year][lang];
  // На 1920 — используем оригинал плаката Д. Моора
  if (year === 1920) {
    return (
      <div style={{
        position: 'absolute', left: x, top: y, width, height: width * 1.45,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 14px 32px rgba(0,0,0,.65)',
        background: '#f0dcae',
        padding: 6,
        border: `1px solid ${t.paperDark}`,
      }}>
        <img src="assets/moor-poster.jpg" alt="Моор. Ты записался добровольцем? (1920)"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'sepia(0.15) contrast(1.05)',
          }}/>
        <div style={{
          position: 'absolute', bottom: -18, left: 10,
          fontFamily: f.mono, fontSize: 10, color: '#5a4020', letterSpacing: '0.15em',
        }}>Д. МООР · 1920</div>
      </div>
    );
  }
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width, height: width * 1.4,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '0 10px 26px rgba(0,0,0,.55)',
      ...paperBg({ base: '#e8d4a8', vignette: false }),
      padding: 20,
      fontFamily: f.display,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${t.paperDark}`,
    }}>
      <div style={{
        position: 'absolute', inset: 10,
        border: `3px solid ${p.color}`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        fontSize: width * 0.14, fontWeight: 900, color: p.color,
        letterSpacing: '0.02em', marginBottom: 10,
      }}>{p.top}</div>
      <div style={{
        fontSize: width * 0.22, fontWeight: 900, color: p.color,
        fontStyle: 'italic', letterSpacing: '-0.02em',
        lineHeight: 1, textAlign: 'center',
      }}>{p.mid}</div>
      <div style={{
        fontSize: width * 0.13, fontWeight: 900, color: p.color,
        letterSpacing: '0.05em', marginTop: 10,
      }}>{p.bot}</div>
      <div style={{
        marginTop: 20, fontSize: 11, fontFamily: f.mono,
        color: '#5a4020', letterSpacing: '0.2em',
      }}>{year}</div>
    </div>
  );
}

// ─── Фото-карточка ─────────────────────────────────────────────────────────
function PhotoCard({ x, y, rotate = 0, width = 220, caption, era = 1918 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      transform: `rotate(${rotate}deg)`,
      background: '#f5f0dc',
      padding: '14px 14px 36px',
      boxShadow: '0 8px 20px rgba(0,0,0,.5)',
    }}>
      <div style={{
        width: '100%', height: width * 1.1,
        background: [
          'repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px)',
          'radial-gradient(ellipse 60% 50% at 50% 40%, #8a7a5a 0%, #4a3a24 70%, #2a2010 100%)',
        ].join(','),
        position: 'relative',
      }}>
        {/* силуэтные фигуры */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
          <circle cx="35" cy="40" r="8" fill="#1a1408"/>
          <path d="M 22 80 Q 22 55 35 55 Q 48 55 48 80 Z" fill="#1a1408"/>
          <circle cx="60" cy="42" r="7" fill="#2a2010"/>
          <path d="M 48 80 Q 48 58 60 58 Q 72 58 72 80 Z" fill="#2a2010"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(30,20,0,.5) 100%)',
        }}/>
      </div>
      <div style={{
        marginTop: 12,
        fontFamily: f.stamp,
        fontSize: 12,
        color: '#4a3020',
        textAlign: 'center',
        letterSpacing: '0.05em',
      }}>{caption}</div>
      <div style={{
        position: 'absolute', bottom: 6, right: 10,
        fontFamily: f.mono, fontSize: 9, color: '#7a5a30', letterSpacing: '0.1em',
      }}>{era}</div>
    </div>
  );
}

// ─── Главная сцена направления A ──────────────────────────────────────────
function DirectionA({ lang, time, duration, years }) {
  // по времени определяем, какой год сейчас основной
  const yearSpan = duration / years.length;
  const yearIdx = Math.min(years.length - 1, Math.floor(time / yearSpan));
  const inYearT = (time - yearIdx * yearSpan) / yearSpan; // 0..1 внутри года
  const year = years[yearIdx];
  const data = year[lang];

  // какой event показывать
  const eventIdx = Math.min(data.events.length - 1, Math.floor(inYearT * data.events.length));
  const event = data.events[eventIdx];
  const localEventT = (inYearT * data.events.length) % 1;

  // часы: начинаются в полночь, идут быстрее
  const totalMinutes = (time / duration) * 60 * 18; // 18 часов "времени истории"

  // ротация компаса зависит от года — "теряем ориентиры"
  const compassRot = yearIdx * 40 + inYearT * 15;

  // Зоны (1920x1080, нижние 200px отведены под TopBar+Vernier):
  //   LEFT COL:   x 40–480   y 190–860   → label + lede + compass
  //   CENTER:     x 500–1280 y 190–760   → карта (780x570)
  //   RIGHT COL:  x 1300–1880 y 190–860  → часы / плакат / фото / цитата
  //   BOTTOM:     x 500–1280 y 780–870   → текущая телеграмма (одна, активная)
  //
  // Верхний бар (логотип+направления+RU/EN) ~ y 40-110 — не пересекать.

  // текущая активная + предыдущая телеграмма (для fade)
  const curEvent = data.events[eventIdx];
  const prevEvent = eventIdx > 0 ? data.events[eventIdx - 1] : null;

  const commanders = {
    ru: ['Л. Троцкий','М. Фрунзе','С. Будённый','М. Тухачевский','В. Блюхер'],
    en: ['L. Trotsky','M. Frunze','S. Budyonny','M. Tukhachevsky','V. Blücher'],
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      ...woodBg(),
      overflow: 'hidden',
    }}>
      {/* глобальная виньетка */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 35%, rgba(0,0,0,.65) 100%)' }}/>

      {/* точечный свет сверху (лампа) */}
      <div style={{
        position: 'absolute', left: '50%', top: '42%',
        transform: 'translate(-50%, -50%)',
        width: 1700, height: 900,
        background: 'radial-gradient(ellipse at center, rgba(255,220,150,.22) 0%, transparent 55%)',
        pointerEvents: 'none',
      }}/>

      {/* ─── КАРТА — БАЗОВЫЙ СЛОЙ (на весь стол) ─────────────────── */}
      <div style={{
        position: 'absolute', left: 260, top: 170, width: 1400, height: 840,
      }}>
        <DeskMap year={{ ...year, lang }} x={0} y={0} width={1400} rotate={-1.2}/>
      </div>

      {/* ─── ЯРЛЫК ГЛАВЫ — верх-лево, поверх карты ─────────────────── */}
      <div style={{
        position: 'absolute', left: 60, top: 170, width: 400,
        transform: 'rotate(-2deg)',
        zIndex: 6,
      }}>
        <div style={{
          background: '#f0dcae',
          border: `1px solid ${t.paperDark}`,
          padding: '16px 22px 20px',
          boxShadow: '0 10px 28px rgba(0,0,0,.6)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -10, left: 24,
            width: 44, height: 22,
            background: t.brass,
            border: `1px solid #3a2010`,
            borderRadius: 2,
          }}/>
          <div style={{
            fontFamily: f.mono, fontSize: 12, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: t.inkFaint,
          }}>{data.chapter}</div>
          <div style={{
            fontSize: 92, fontFamily: f.display, fontStyle: 'italic',
            lineHeight: 0.9, color: t.redDeep,
            letterSpacing: '-0.03em', marginTop: 4,
            textShadow: '0 1px 0 rgba(255,240,200,.3)',
          }}>{year.year}</div>
          <div style={{
            fontSize: 17, fontFamily: f.body, fontStyle: 'italic',
            color: t.ink, marginTop: 6, lineHeight: 1.3,
          }}>{data.subtitle}</div>
        </div>
      </div>

      {/* ─── ЛИД-ЛИСТ — поверх карты, нижне-левый край ──────────── */}
      <div style={{
        position: 'absolute', left: 90, top: 430, width: 340,
        transform: 'rotate(2deg)',
        zIndex: 5,
        ...paperBg({ base: '#e8d6a8', vignette: false }),
        border: `1px solid ${t.paperDark}`,
        padding: '16px 20px',
        boxShadow: '0 10px 22px rgba(0,0,0,.55)',
        fontFamily: f.body, fontSize: 15, lineHeight: 1.45,
        color: t.ink, fontStyle: 'italic',
      }}>
        {data.lede}
      </div>

      {/* ─── КОМПАС — поверх карты, низ-лево ─────────────────────── */}
      <div style={{
        position: 'absolute', left: 110, top: 720, zIndex: 7,
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.6))',
      }}>
        <Compass x={0} y={0} size={170} rotation={compassRot}/>
      </div>

      {/* ─── ЧАСЫ — поверх карты, верх-право (сдвинуты левее чтобы не лезть на плакат) ─── */}
      <div style={{
        position: 'absolute', right: 510, top: 160, zIndex: 7,
        filter: 'drop-shadow(0 12px 24px rgba(0,0,0,.65))',
        transform: 'rotate(-4deg)',
      }}>
        <PocketWatch x={0} y={0} size={128} minutes={totalMinutes}/>
      </div>

      {/* ─── ПЛАКАТ — право-верх, ушёл на карту ──────────────────── */}
      <div style={{
        position: 'absolute', right: 70, top: 200, zIndex: 6,
        width: 260, height: 260 * 1.45,
        filter: 'drop-shadow(0 14px 28px rgba(0,0,0,.6))',
      }}>
        <Poster x={0} y={0} rotate={5} width={260} year={year.year} lang={lang}/>
      </div>

      {/* ─── ФОТО — право-низ, глубже внутрь стола ─────────────── */}
      <div style={{
        position: 'absolute', right: 90, top: 620, zIndex: 7,
        width: 210, height: 210 * 1.4,
        filter: 'drop-shadow(0 10px 22px rgba(0,0,0,.6))',
      }}>
        <PhotoCard x={0} y={0} rotate={-5} width={210}
          caption={commanders[lang][yearIdx]} era={year.year}/>
      </div>

      {/* ─── ЦИТАТА — низ-центр, на карте ─────────────────────────── */}
      <div style={{
        position: 'absolute', left: 870, top: 770, width: 460,
        transform: 'rotate(-1deg)',
        zIndex: 5,
        ...paperBg({ base: '#e0cea0', vignette: false }),
        border: `1px solid ${t.paperDark}`,
        padding: '14px 20px',
        boxShadow: '0 10px 20px rgba(0,0,0,.55)',
      }}>
        <div style={{
          fontFamily: f.display, fontStyle: 'italic', fontSize: 20,
          lineHeight: 1.3, color: t.ink,
        }}>{data.quote.text}</div>
        <div style={{
          fontFamily: f.mono, fontSize: 10, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: t.inkFaint, marginTop: 8,
        }}>— {data.quote.by}</div>
      </div>

      {/* ─── ТЕЛЕГРАММА — центр-низ, на карте ────────────────────── */}
      <div style={{
        position: 'absolute', left: 510, top: 560, width: 440, height: 180,
        zIndex: 8,
      }}>
        {prevEvent && localEventT < 0.3 && (
          <div style={{
            position: 'absolute', inset: 0,
            opacity: Math.max(0, 1 - localEventT / 0.3),
            transform: `translateY(${localEventT / 0.3 * 20}px) rotate(-3deg)`,
            filter: 'drop-shadow(0 12px 22px rgba(0,0,0,.6))',
          }}>
            <Telegram x={0} y={0} rotate={0} width={440}
              entry={0} duration={1} localTime={1} lang={lang} event={prevEvent}/>
          </div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: Math.min(1, localEventT / 0.3 + 0.3),
          transform: `translateY(${Math.max(0, (1 - localEventT / 0.3) * 20)}px) rotate(2deg)`,
          filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.65))',
        }}>
          <Telegram x={0} y={0} rotate={0} width={440}
            entry={0} duration={1} localTime={1} lang={lang} event={curEvent}/>
        </div>
      </div>

      {/* DUST */}
      <window.DustParticles count={28}/>
    </div>
  );
}

window.DirectionA = DirectionA;
