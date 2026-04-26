// Direction C — «Поток документов»
// Параллакс-ленты архивных бумаг, движущиеся справа налево по 3 полосам.
// Наверху — крупный год, внизу — цитата. Телеграммы, газеты, плакаты, письма.

const { theme: tc, fonts: fc, paperBg: paperC } = window;

function Strip({ items, y, speed, time, height, renderItem, cardStep = 420 }) {
  // Каждая плашка в фиксированном шаге cardStep — равномерно. Три копии подряд.
  const n = items.length;
  const laneW = Math.max(1, n) * cardStep;
  const offset = ((time * speed) % laneW + laneW) % laneW;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: y, height,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: laneW * 3, height,
        transform: `translateX(-${offset}px)`,
        willChange: 'transform',
      }}>
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0,
            left: i * cardStep, width: cardStep, height,
          }}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewspaperClipping({ headline, body, date, width = 360, rotate = -1 }) {
  return (
    <div style={{
      width, padding: '16px 18px 20px',
      background: '#ece0c0',
      border: '1px solid #8a6a30',
      boxShadow: '0 8px 20px rgba(0,0,0,.5)',
      fontFamily: fc.display,
      color: '#2a1810',
      transform: `rotate(${rotate}deg)`,
      position: 'relative',
    }}>
      <div style={{
        fontSize: 10, fontFamily: fc.mono, letterSpacing: '0.25em',
        textTransform: 'uppercase', color: '#7a5020',
        borderBottom: '1px solid #7a5020', paddingBottom: 4, marginBottom: 8,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>ИЗВѢСТІЯ</span><span>{date}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, fontStyle: 'italic' }}>{headline}</div>
      <div style={{ marginTop: 6, fontSize: 12, fontFamily: fc.body, lineHeight: 1.4, color: '#3a2010',
        columnCount: 2, columnGap: 10, columnRule: '1px solid #a88050',
      }}>{body}</div>
    </div>
  );
}

function TelegramSlip({ text, date, width = 320, rotate = 2 }) {
  return (
    <div style={{
      width, padding: '14px 16px',
      background: '#f0dca8',
      border: '1px solid #8a6a30',
      boxShadow: '0 6px 16px rgba(0,0,0,.5)',
      fontFamily: fc.stamp,
      color: '#2a1010',
      transform: `rotate(${rotate}deg)`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5,
        background: `repeating-linear-gradient(90deg, transparent 0 6px, rgba(100,70,20,.6) 6px 7px, transparent 7px 13px)`,
      }}/>
      <div style={{ fontSize: 9, fontFamily: fc.mono, letterSpacing: '0.2em',
        color: '#6a4a20', marginBottom: 6 }}>ТЕЛЕГРАММА · {date}</div>
      <div style={{ fontSize: 13, textTransform: 'uppercase', lineHeight: 1.4, letterSpacing: '0.04em' }}>
        {text}
      </div>
      <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 8,
        fontFamily: fc.mono, color: '#8a5030', transform: 'rotate(-4deg)',
        border: '1px solid #8a3010', padding: '2px 6px' }}>
        ПРИНЯТО
      </div>
    </div>
  );
}

function LetterCard({ body, from, width = 380, rotate = -3 }) {
  return (
    <div style={{
      width, padding: '22px 26px',
      background: '#f0e6cc',
      border: '1px solid #8a6a30',
      boxShadow: '0 10px 24px rgba(0,0,0,.55)',
      fontFamily: fc.display,
      color: '#2a1810',
      transform: `rotate(${rotate}deg)`,
      fontStyle: 'italic',
    }}>
      <div style={{ fontSize: 15, lineHeight: 1.55 }}>«{body}»</div>
      <div style={{ marginTop: 12, fontSize: 11, fontFamily: fc.mono, letterSpacing: '0.15em',
        color: '#6a4a20', textTransform: 'uppercase' }}>— {from}</div>
    </div>
  );
}

// ── Дополнительные архивные «плашки» по годам ────────────────────────────
// Заполняем ленты, чтобы на любой год их было ≥ 12–14 шт.

const EXTRA_RU = {
  1918: {
    news: [
      { headline: 'Декрет о национализации', body: 'Все банки объявлены собственностью РСФСР. Частные вклады свыше 10 000 руб. подлежат конфискации.', date: 'Январь' },
      { headline: 'Голод в Петрограде', body: 'Хлебный паёк сокращён до ¼ фунта в день. По губерниям — продотряды.', date: 'Февраль' },
      { headline: 'Архангельскъ занятъ', body: 'Союзные десанты входятъ въ Архангельскъ. Интервенція Антанты начата.', date: 'Августъ' },
      { headline: 'Въ Казани золотой запасъ', body: 'Народная армія Комуча захватила часть золотого запаса Имперіи — 650 милл. руб.', date: 'Августъ' },
    ],
    tel: [
      { text: 'ТРЕБУЮ · ВСЕ · СИЛЫ · НА · ВОСТОК · ФРУНЗЕ', date: '05.VII' },
      { text: 'ЧЕХИ · ЗАНЯЛИ · СИМБИРСК · СРОЧНО · ПОДМОГА', date: '22.VII' },
      { text: 'МИРБАХ · УБИТ · БЛЮМКИН · СКРЫЛСЯ', date: '06.VII' },
      { text: 'ВЛАДИВОСТОК · ЯПОНСКИЙ · ДЕСАНТ · ПОДТВЕРЖДАЮ', date: '05.IV' },
      { text: 'ПРИКАЗ · № 227 · НИ · ШАГУ · НАЗАД · ТРОЦКИЙ', date: '10.IX' },
    ],
    let: [
      { body: 'Николай, голодъ страшный. Хлѣба нѣтъ, картошки нѣтъ, дѣти пухнутъ. Пишу въ тиши, подъ лампой.', from: 'Петроградъ, февраль' },
      { body: 'Отца увели ночью. Не сказали за что. Говорятъ — какъ бывшій офицеръ. Храни Богъ всѣхъ насъ.', from: 'Москва, сентябрь' },
    ],
  },
  1919: {
    news: [
      { headline: 'Колчакъ въ Омскѣ', body: 'Верховный правитель принимаетъ парадъ Сибирской арміи. Англійскіе инструкторы.', date: 'Мартъ' },
      { headline: 'Орёлъ сданъ', body: 'Добровольческая армія въ 380 верстахъ отъ Москвы. Совнаркомъ переводитъ архивы.', date: 'Октябрь' },
      { headline: 'Конный корпус Будённого', body: 'Создана Первая конная. 16 000 сабель. Перелом на Южном фронте.', date: 'Ноябрь' },
      { headline: 'Юденич у Петрограда', body: 'Белые в Гатчине. Троцкий лично на броневике под Пулковом.', date: 'Октябрь' },
    ],
    tel: [
      { text: 'СДАЛИ · УФУ · ОТСТУПАЕМ · ЗА · ВОЛГУ', date: '13.III' },
      { text: 'ДЕНИКИН · ВЗЯЛ · ЦАРИЦЫН · ПРОСИМ · РЕЗЕРВ', date: '30.VI' },
      { text: 'ЛАТЫШСКАЯ · ДИВИЗИЯ · В · ЭШЕЛОНАХ · НА · ОРЁЛ', date: '14.X' },
      { text: 'ПУЛКОВО · ОТБИЛИ · ЮДЕНИЧ · ОТСТУПАЕТ · К · НАРВЕ', date: '22.X' },
      { text: 'ОМСК · ВЗЯТ · КОЛЧАК · БЕЖИТ · В · ИРКУТСК', date: '14.XI' },
      { text: 'ДЕНИКИН · ОСТАВЛЯЕТ · КУРСК · НАСТУПАЕМ', date: '17.XI' },
    ],
    let: [
      { body: 'Мама, жив. Из-под Орла отводят в тыл. Латыши стояли как скалы. Жди письма.', from: 'красноармеец К., октябрь' },
      { body: 'Прощай, Россія прежняя. Уходимъ степью. За спиной Добр. армія, впереди — Бог знаетъ.', from: 'поручикъ П., ноябрь' },
    ],
  },
  1920: {
    news: [
      { headline: 'Колчака расстреляли', body: 'Иркутск, бер. Ушаковки. Верховный правитель и Пепеляев расстреляны без суда.', date: 'Февраль' },
      { headline: 'Пилсудский в Киеве', body: 'Польские войска вошли в Киев. Советско-польская война.', date: 'Май' },
      { headline: 'Чудо на Висле', body: 'Тухачевский разбит под Варшавой. 70 000 пленных. Кампания проиграна.', date: 'Август' },
      { headline: 'Крым взят', body: 'Фрунзе форсирует Сиваш. Врангель эвакуирует 150 000 человек из Севастополя.', date: 'Ноябрь' },
      { headline: 'Рижский мир', body: 'Подписан прелиминарный мир с Польшей. Границу провели по линии Керзона минус.', date: 'Октябрь' },
    ],
    tel: [
      { text: 'КОЛЧАК · РАССТРЕЛЯН · В · 5.00 · УТРА', date: '07.II' },
      { text: 'КИЕВ · ВЗЯТ · ПОЛЯКАМИ · ПРИБЫВАЕМ · НА · ФРОНТ', date: '07.V' },
      { text: 'ВАРШАВА · НЕ · ВЗЯТА · ОТСТУПАЕМ · К · БУГУ', date: '16.VIII' },
      { text: 'СИВАШ · ФОРСИРОВАН · КРЫМ · НАШ', date: '08.XI' },
      { text: 'СЕВАСТОПОЛЬ · ПУСТ · ВРАНГЕЛЬ · УШЁЛ · В · МОРЕ', date: '14.XI' },
      { text: 'МАХНО · РАЗОРУЖИТЬ · ПРИКАЗ · РВСР', date: '26.XI' },
    ],
    let: [
      { body: 'Изъ Севастополя выходимъ послѣдними. Мать на «Алмазѣ», я на «Генералѣ Алексѣевѣ». Богъ дастъ — Константинополь.', from: 'мичманъ, ноябрь' },
      { body: 'Варшава отбита. Лежим под Минск-Мазовецким. Дождь, холод, снаряды кончились.', from: 'красноарм., август' },
    ],
  },
  1921: {
    news: [
      { headline: 'Кронштадт взбунтовался', body: 'Матросы требуют советов без коммунистов. Лидер — Петриченко.', date: 'Март' },
      { headline: 'НЭП объявлен', body: 'X-й съезд РКП(б) заменяет продразвёрстку продналогом. Разрешена мелкая торговля.', date: 'Март' },
      { headline: 'Голод в Поволжье', body: 'Саратов, Самара, Астрахань. По заявлениям — 5 млн на краю гибели.', date: 'Июль' },
      { headline: 'Тамбовское восстание', body: 'Тухачевский и Антонов-Овсеенко против Антонова. Применены газы.', date: 'Июнь' },
    ],
    tel: [
      { text: 'КРОНШТАДТ · ВЗЯТ · ШТУРМОМ · ПО · ЛЬДУ', date: '18.III' },
      { text: 'АНТОНОВЩИНА · ГАЗЫ · ПРИМЕНЕНЫ · ЛЕСА · ОЧИЩЕНЫ', date: '12.VI' },
      { text: 'САМАРА · ВАГОНЫ · С · ХЛЕБОМ · РАЗОБРАНЫ · ГОЛОДНЫМИ', date: 'VIII' },
      { text: 'АРА · ГУВЕР · ДОСТАВЛЯЕТ · ПРОДОВОЛЬСТВИЕ', date: 'IX' },
      { text: 'ВЛАДИВОСТОК · ЯПОНЦЫ · ЕЩЁ · СТОЯТ', date: 'XI' },
    ],
    let: [
      { body: 'Мы просимъ мира съ Россіей и хлѣба для дѣтей. Всё остальное — потомъ.', from: 'воззваніе РПЦ, августъ' },
      { body: 'Матросы — цвет и гордость революции — кричат: довольно. И их расстреливают.', from: 'из дневника, март' },
    ],
  },
  1922: {
    news: [
      { headline: 'Генуэзская конференция', body: 'РСФСР впервые за столом с Антантой. Чичерин требует признания.', date: 'Апрель' },
      { headline: 'Владивосток освобождён', body: 'Последний японский транспорт ушёл. НРА входит в город.', date: 'Октябрь' },
      { headline: 'Образован СССР', body: 'РСФСР, УССР, БССР, ЗСФСР подписали Союзный договор. Начата эпоха.', date: 'Декабрь' },
      { headline: '«Философский пароход»', body: 'Из Петрограда высланы 160 философов, писателей, учёных.', date: 'Сентябрь' },
    ],
    tel: [
      { text: 'ГЕНУЯ · РАПАЛЛО · ПОДПИСАНО · С · ГЕРМАНИЕЙ', date: '16.IV' },
      { text: 'ВЛАДИВОСТОК · НАШ · ГРАЖД. · ВОЙНА · ОКОНЧЕНА', date: '25.X' },
      { text: 'ОБРАЗОВАН · СОЮЗ · ССР · ЕДИНОГЛАСНО', date: '30.XII' },
      { text: 'ЛЕНИН · БОЛЕН · КОНСИЛИУМ · ЗАСЕДАЕТ', date: 'XII' },
    ],
    let: [
      { body: 'Пишу съ палубы «Обер-бургомистра Гакена». Россія осталась тамъ. Мы — безъ неё.', from: 'Н. Бердяевъ, Петроградъ, сент.' },
      { body: 'Кончилось. Сижу на ступенькахъ вокзала въ Владивостокѣ. Чужіе корабли ушли.', from: 'октябрь' },
    ],
  },
};

const EXTRA_EN = {
  1918: {
    news: [
      { headline: 'Nationalization decree', body: 'All banks declared property of the RSFSR. Private deposits above 10,000 rub. confiscated.', date: 'January' },
      { headline: 'Hunger in Petrograd', body: 'Bread ration cut to ¼ pound a day. Requisition squads fan out across the provinces.', date: 'February' },
      { headline: 'Archangel occupied', body: 'Allied landings enter Archangel. Entente intervention has begun.', date: 'August' },
      { headline: 'Imperial gold in Kazan', body: "Komuch's People's Army seizes part of the Empire's gold reserve — 650 mln rubles.", date: 'August' },
    ],
    tel: [
      { text: 'DEMAND · ALL · FORCES · TO · EAST · FRUNZE', date: 'Jul 5' },
      { text: 'CZECHS · TAKE · SIMBIRSK · REINFORCEMENT · URGENT', date: 'Jul 22' },
      { text: 'MIRBACH · KILLED · BLUMKIN · ESCAPED', date: 'Jul 6' },
      { text: 'VLADIVOSTOK · JAPANESE · LANDING · CONFIRMED', date: 'Apr 5' },
      { text: 'ORDER · No. 227 · NOT · ONE · STEP · BACK · TROTSKY', date: 'Sep 10' },
    ],
    let: [
      { body: 'Nikolai — famine here is terrible. No bread, no potatoes, children swelling. I write by lamp, alone.', from: 'Petrograd, February' },
      { body: 'They took father in the night. Said only — former officer. God keep us all.', from: 'Moscow, September' },
    ],
  },
  1919: {
    news: [
      { headline: 'Kolchak in Omsk', body: 'The Supreme Ruler reviews the Siberian army. British instructors drill new recruits.', date: 'March' },
      { headline: 'Orel surrendered', body: 'Volunteer Army 380 versts from Moscow. Sovnarkom begins archiving.', date: 'October' },
      { headline: 'First Cavalry Army', body: "Budyonny's 16,000 sabres formed. Turning point on the Southern Front.", date: 'November' },
      { headline: 'Yudenich at Petrograd', body: 'Whites at Gatchina. Trotsky on an armoured train at Pulkovo.', date: 'October' },
    ],
    tel: [
      { text: 'UFA · LOST · RETREAT · BEYOND · VOLGA', date: 'Mar 13' },
      { text: 'DENIKIN · TAKES · TSARITSYN · SEND · RESERVES', date: 'Jun 30' },
      { text: 'LATVIAN · DIVISION · ENROUTE · TO · OREL', date: 'Oct 14' },
      { text: 'PULKOVO · HELD · YUDENICH · WITHDRAWS · TO · NARVA', date: 'Oct 22' },
      { text: 'OMSK · TAKEN · KOLCHAK · FLEES · TO · IRKUTSK', date: 'Nov 14' },
      { text: 'DENIKIN · QUITS · KURSK · ADVANCING', date: 'Nov 17' },
    ],
    let: [
      { body: 'Mama, I live. Pulled back from near Orel. The Latvians stood like stone. Wait for a letter.', from: 'Red soldier K., October' },
      { body: 'Farewell, old Russia. We ride the steppe south. Behind — the Volunteer Army. Ahead — God knows.', from: 'Lieutenant P., November' },
    ],
  },
  1920: {
    news: [
      { headline: 'Kolchak executed', body: 'Irkutsk, bank of the Ushakovka. The Supreme Ruler and Pepelyayev shot without trial.', date: 'February' },
      { headline: 'Pilsudski in Kiev', body: 'Polish armies enter Kiev. The Soviet–Polish war is on.', date: 'May' },
      { headline: 'Miracle on the Vistula', body: 'Tukhachevsky shattered near Warsaw. 70,000 prisoners. Campaign lost.', date: 'August' },
      { headline: 'Crimea falls', body: 'Frunze crosses the Sivash. Wrangel evacuates 150,000 from Sevastopol.', date: 'November' },
      { headline: 'Treaty of Riga', body: 'Preliminary peace with Poland. The border runs east of the Curzon Line.', date: 'October' },
    ],
    tel: [
      { text: 'KOLCHAK · SHOT · 05.00 · HOURS', date: 'Feb 7' },
      { text: 'KIEV · TAKEN · BY · POLES · REGIMENT · DEPLOYING', date: 'May 7' },
      { text: 'WARSAW · NOT · TAKEN · RETREAT · TO · BUG', date: 'Aug 16' },
      { text: 'SIVASH · FORDED · CRIMEA · OURS', date: 'Nov 8' },
      { text: 'SEVASTOPOL · EMPTY · WRANGEL · GONE · TO · SEA', date: 'Nov 14' },
      { text: 'MAKHNO · TO · BE · DISARMED · ORDER · RVSR', date: 'Nov 26' },
    ],
    let: [
      { body: 'We leave Sevastopol with the last ships. Mother on the Almaz, I on the General Alekseev. God willing — Constantinople.', from: 'Midshipman, November' },
      { body: 'Warsaw pushed us back. We lie near Minsk-Mazowiecki. Rain, cold, no shells.', from: 'Red soldier, August' },
    ],
  },
  1921: {
    news: [
      { headline: 'Kronstadt rises', body: 'Sailors demand soviets without Communists. Leader — Petrichenko.', date: 'March' },
      { headline: 'NEP declared', body: '10th Congress replaces food requisitioning with a tax. Small trade legalized.', date: 'March' },
      { headline: 'Volga famine', body: 'Saratov, Samara, Astrakhan. 5 million on the edge of death.', date: 'July' },
      { headline: 'Tambov crushed', body: 'Tukhachevsky vs. Antonov. Poison gas used in the forests.', date: 'June' },
    ],
    tel: [
      { text: 'KRONSTADT · STORMED · ACROSS · THE · ICE', date: 'Mar 18' },
      { text: 'GAS · DEPLOYED · FORESTS · CLEARED', date: 'Jun 12' },
      { text: 'SAMARA · GRAIN · CARS · STORMED · BY · STARVING', date: 'Aug' },
      { text: 'ARA · HOOVER · DELIVERS · PROVISIONS', date: 'Sep' },
      { text: 'VLADIVOSTOK · JAPANESE · STILL · HERE', date: 'Nov' },
    ],
    let: [
      { body: 'We ask for peace with Russia and bread for our children. All the rest — later.', from: 'Church appeal, August' },
      { body: 'Sailors — the pride of the revolution — cry enough. And they are shot for it.', from: 'diary, March' },
    ],
  },
  1922: {
    news: [
      { headline: 'Genoa Conference', body: 'First time the RSFSR sits with the Entente. Chicherin demands recognition.', date: 'April' },
      { headline: 'Vladivostok freed', body: 'Last Japanese transport sails. The People’s Revolutionary Army enters.', date: 'October' },
      { headline: 'USSR formed', body: 'RSFSR, Ukraine, Byelorussia, Transcaucasia sign the Union Treaty.', date: 'December' },
      { headline: 'Philosophers’ ship', body: '160 philosophers, writers, scientists expelled from Petrograd.', date: 'September' },
    ],
    tel: [
      { text: 'GENOA · RAPALLO · SIGNED · WITH · GERMANY', date: 'Apr 16' },
      { text: 'VLADIVOSTOK · OURS · CIVIL · WAR · ENDED', date: 'Oct 25' },
      { text: 'UNION · OF · SSR · FORMED · UNANIMOUS', date: 'Dec 30' },
      { text: 'LENIN · ILL · COUNCIL · IN · SESSION', date: 'Dec' },
    ],
    let: [
      { body: 'I write from the deck of the Oberbürgermeister Haken. Russia is behind us. We — without her.', from: 'N. Berdyaev, Petrograd, Sept.' },
      { body: 'It is over. I sit on the station steps in Vladivostok. The foreign ships are gone.', from: 'October' },
    ],
  },
};

function DocumentModal({ item, onClose, lang }) {
  if (!item) return null;
  const { type, props } = item;
  const renderBig = () => {
    if (type === 'news') return <NewspaperClipping {...props} width={720} rotate={0} />;
    if (type === 'tel')  return <TelegramSlip   {...props} width={640} rotate={0} />;
    if (type === 'let')  return <LetterCard     {...props} width={760} rotate={0} />;
    return null;
  };
  const label = lang === 'ru'
    ? 'Кликните вне документа или нажмите Esc, чтобы закрыть'
    : 'Click outside or press Esc to close';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(10,6,2,0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          transform: 'scale(1.0)',
          cursor: 'default',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.75))',
        }}
      >
        {renderBig()}
      </div>
      <div style={{
        position: 'absolute', bottom: 40, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: fc.mono, fontSize: 13, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: '#d0b080',
        pointerEvents: 'none',
      }}>
        {label}
      </div>
    </div>
  );
}

function DirectionC({ lang, time, duration, years }) {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [pauseOnOpen, setPauseOnOpen] = React.useState(() => {
    try { return localStorage.getItem('expo:dirC:pause') !== 'false'; } catch { return true; }
  });

  React.useEffect(() => {
    try { localStorage.setItem('expo:dirC:pause', String(pauseOnOpen)); } catch {}
  }, [pauseOnOpen]);

  // Esc → закрыть модалку
  React.useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setSelectedItem(null); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [selectedItem]);

  // Замораживаем time, пока модалка открыта и тоггл включён.
  const frozenTimeRef = React.useRef(time);
  if (!(selectedItem && pauseOnOpen)) {
    frozenTimeRef.current = time;
  }
  const stripTime = (selectedItem && pauseOnOpen) ? frozenTimeRef.current : time;

  const yearSpan = duration / years.length;
  const yearIdx = Math.min(years.length - 1, Math.floor(time / yearSpan));
  const inYearT = (time - yearIdx * yearSpan) / yearSpan;
  const year = years[yearIdx];
  const data = year[lang];
  const extras = (lang === 'ru' ? EXTRA_RU : EXTRA_EN)[year.year] || { news: [], tel: [], let: [] };

  // Построим items для лент на основе событий + доп. плашек
  const coreNews = data.events.map(ev => ({
    type: 'news', headline: ev.title, body: ev.note, date: ev.date,
  }));
  const newsItems = [...coreNews, ...extras.news];

  const coreTel = data.events.map(ev => ({
    type: 'tel', text: ev.title.toUpperCase().replace(/ /g, ' · '), date: ev.date,
  }));
  const telItems = [...coreTel, ...extras.tel];

  const letItems = [
    { body: data.lede, from: `${year.year}` },
    { body: data.quote.text, from: data.quote.by },
    ...data.events.slice(0, 3).map(ev => ({ body: ev.note, from: `${ev.date}, ${year.year}` })),
    ...extras.let,
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#1a0c04',
      overflow: 'hidden',
    }}>
      {/* задник — глубокое дерево стенда */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'repeating-linear-gradient(91deg, rgba(0,0,0,.2) 0 2px, transparent 2px 24px)',
          'radial-gradient(ellipse 80% 70% at 50% 50%, #3a2010 0%, #1a0c04 100%)',
        ].join(','),
      }}/>

      {/* луч света сверху */}
      <div style={{
        position: 'absolute', left: '50%', top: 0,
        transform: 'translateX(-50%)',
        width: '140%', height: '100%',
        background: 'radial-gradient(ellipse 40% 80% at 50% 0%, rgba(255,220,150,.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}/>

      {/* крупный год по центру (фоном) */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: fc.display, fontStyle: 'italic',
        fontSize: 860, fontWeight: 400,
        color: 'rgba(220,180,110,0.08)',
        lineHeight: 0.8, letterSpacing: '-0.05em',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        {year.year}
      </div>

      {/* 3 ленты */}
      <Strip
        y={280} height={200} speed={60} time={stripTime}
        items={newsItems} cardStep={420}
        renderItem={(item, i) => (
          <div
            onClick={() => setSelectedItem({ type: 'news', props: item })}
            style={{ position: 'absolute', top: 20, left: 20, cursor: 'zoom-in' }}
          >
            <NewspaperClipping {...item} rotate={-2 + (i % 3)} />
          </div>
        )}
      />

      <Strip
        y={500} height={200} speed={95} time={stripTime}
        items={telItems} cardStep={360}
        renderItem={(item, i) => {
          // Псевдослучайная вариация в рамках ±20–25% — размер, сдвиг, поворот.
          const s = [0.82, 1.00, 1.18, 0.92, 1.10, 0.86, 1.05][i % 7];   // 0.82..1.18
          const dy = [20, 4, 38, 12, 46, 0, 26][i % 7];                  // 0..46
          const dx = [20, 44, 8, 36, 16, 52, 24][i % 7];                 // 8..52
          const rot = [-4, 2, -1, 5, -3, 1, 3, -2][i % 8];               // ±5°
          const w = Math.round(320 * s);
          return (
            <div
              onClick={() => setSelectedItem({ type: 'tel', props: item })}
              style={{ position: 'absolute', top: dy, left: dx, cursor: 'zoom-in' }}
            >
              <TelegramSlip {...item} width={w} rotate={rot} />
            </div>
          );
        }}
      />

      <Strip
        y={740} height={230} speed={45} time={stripTime}
        items={letItems} cardStep={460}
        renderItem={(item, i) => (
          <div
            onClick={() => setSelectedItem({ type: 'let', props: item })}
            style={{ position: 'absolute', top: 20, left: 20, cursor: 'zoom-in' }}
          >
            <LetterCard {...item} rotate={2 - (i % 3) * 2} />
          </div>
        )}
      />

      {/* Заголовок */}
      <div style={{ position: 'absolute', top: 150, left: 70, zIndex: 3, color: tc.paperLight, pointerEvents: 'none' }}>
        <div style={{ fontFamily: fc.mono, fontSize: 14, letterSpacing: '0.3em', textTransform: 'uppercase', color: tc.ochre }}>
          {data.chapter}
        </div>
        <div style={{ fontFamily: fc.display, fontSize: 52, fontStyle: 'italic', marginTop: 12, color: '#f0dcae', maxWidth: 900, lineHeight: 1.1 }}>
          {data.subtitle}
        </div>
      </div>

      {/* Нижняя цитата */}
      <div style={{ position: 'absolute', bottom: 260, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
        color: tc.paperLight, maxWidth: 1200, textAlign: 'center' }}>
        <div style={{ fontFamily: fc.display, fontSize: 36, fontStyle: 'italic', lineHeight: 1.3, color: '#f0dcae' }}>
          {data.quote.text}
        </div>
        <div style={{ fontFamily: fc.mono, fontSize: 14, color: tc.ochre, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 12 }}>
          — {data.quote.by}
        </div>
      </div>

      {/* Верхний виньет-градиент */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 270,
        background: 'linear-gradient(180deg, #1a0c04 0%, transparent 100%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 370,
        background: 'linear-gradient(0deg, #1a0c04 30%, transparent 100%)', pointerEvents: 'none' }}/>

      {/* Тоггл «пауза при открытии» — правый-нижний, над нижней цитатой */}
      <label
        style={{
          position: 'absolute', right: 40, bottom: 210, zIndex: 4,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: fc.mono, fontSize: 11, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: tc.ochre,
          padding: '10px 14px',
          background: 'rgba(10,6,2,0.55)',
          border: '1px solid rgba(200,150,80,0.25)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span
          role="checkbox"
          aria-checked={pauseOnOpen}
          onClick={() => setPauseOnOpen(v => !v)}
          style={{
            width: 28, height: 16, borderRadius: 8,
            background: pauseOnOpen ? '#c08040' : 'rgba(120,80,40,0.35)',
            border: '1px solid #8a6a30',
            position: 'relative', transition: 'background 150ms',
          }}
        >
          <span style={{
            position: 'absolute', top: 1, left: pauseOnOpen ? 13 : 1,
            width: 12, height: 12, borderRadius: '50%',
            background: '#f0dcae', transition: 'left 150ms',
          }}/>
        </span>
        <span onClick={() => setPauseOnOpen(v => !v)}>
          {lang === 'ru' ? 'Пауза при открытии' : 'Pause on open'}
        </span>
      </label>

      {/* Модалка с увеличенным документом */}
      <DocumentModal item={selectedItem} onClose={() => setSelectedItem(null)} lang={lang} />
    </div>
  );
}

window.DirectionC = DirectionC;
