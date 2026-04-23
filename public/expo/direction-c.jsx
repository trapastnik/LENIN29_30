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
      { headline: 'Декретъ о національзаціи', body: 'Всѣ банки объявлены собственностью РСФСР. Частные вклады свыше 10 000 руб. подлежатъ конфискаціи.', date: 'Январь' },
      { headline: 'Голодъ въ Петроградѣ', body: 'Хлѣбный паекъ сокращёнъ до ¼ фунта въ день. По губерніямъ — продотряды.', date: 'Февраль' },
      { headline: 'Архангельскъ занятъ', body: 'Союзные десанты входятъ въ Архангельскъ. Интервенція Антанты начата.', date: 'Августъ' },
      { headline: 'Въ Казани золотой запасъ', body: 'Народная армія Комуча захватила часть золотого запаса Имперіи — 650 милл. руб.', date: 'Августъ' },
    ],
    tel: [
      { text: 'ТРЕБУЮ · ВСЕ · СИЛЫ · НА · ВОСТОКЪ · ФРУНЗЕ', date: '05.VII' },
      { text: 'ЧЕХИ · ЗАНЯЛИ · СИМБИРСКЪ · СРОЧНО · ПОДМОГА', date: '22.VII' },
      { text: 'МИРБАХЪ · УБИТЪ · БЛЮМКИНЪ · СКРЫЛСЯ', date: '06.VII' },
      { text: 'ВЛАДИВОСТОКЪ · ЯПОНСКІЙ · ДЕСАНТЪ · ПОДТВЕРЖДАЮ', date: '05.IV' },
      { text: 'ПРИКАЗЪ · № 227 · НИ · ШАГУ · НАЗАДЪ · ТРОЦКІЙ', date: '10.IX' },
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
      { headline: 'Конный корпусъ Будённаго', body: 'Создана Первая конная. 16 000 сабель. Переломъ на Южномъ фронтѣ.', date: 'Ноябрь' },
      { headline: 'Юденичъ у Петрограда', body: 'Бѣлые въ Гатчинѣ. Троцкій лично на броневикѣ подъ Пулковомъ.', date: 'Октябрь' },
    ],
    tel: [
      { text: 'СДАЛИ · УФУ · ОТСТУПАЕМЪ · ЗА · ВОЛГУ', date: '13.III' },
      { text: 'ДЕНИКИНЪ · ВЗЯЛЪ · ЦАРИЦЫНЪ · ПРОСИМЪ · РЕЗЕРВЪ', date: '30.VI' },
      { text: 'ЛАТЫШСКАЯ · ДИВИЗІЯ · ВЪ · ЭШЕЛОНАХЪ · НА · ОРЁЛЪ', date: '14.X' },
      { text: 'ПУЛКОВО · ОТБИЛИ · ЮДЕНИЧЪ · ОТСТУПАЕТЪ · КЪ · НАРВѢ', date: '22.X' },
      { text: 'ОМСКЪ · ВЗЯТЪ · КОЛЧАКЪ · БѢЖИТЪ · ВЪ · ИРКУТСКѢ', date: '14.XI' },
      { text: 'ДЕНИКИНЪ · ОСТАВЛЯЕТЪ · КУРСКЪ · НАСТУПАЕМЪ', date: '17.XI' },
    ],
    let: [
      { body: 'Мама, живъ. Изъ-подъ Орла отводятъ въ тылъ. Латыши стояли какъ скалы. Жди письма.', from: 'красноармеецъ К., октябрь' },
      { body: 'Прощай, Россія прежняя. Уходимъ степью. За спиной Добр. армія, впереди — Бог знаетъ.', from: 'поручикъ П., ноябрь' },
    ],
  },
  1920: {
    news: [
      { headline: 'Колчака разстрѣляли', body: 'Иркутскъ, бер. Ушаковки. Верховный правитель и Пепеляевъ разстрѣляны безъ суда.', date: 'Февраль' },
      { headline: 'Пилсудскій въ Кіевѣ', body: 'Польскія войска вошли въ Кіевъ. Совѣтско-польская война.', date: 'Май' },
      { headline: 'Чудо на Вислѣ', body: 'Тухачевскій разбитъ подъ Варшавой. 70 000 плѣнныхъ. Кампанія проиграна.', date: 'Августъ' },
      { headline: 'Крымъ взятъ', body: 'Фрунзе форсируетъ Сивашъ. Врангель эвакуируетъ 150 000 человѣкъ изъ Севастополя.', date: 'Ноябрь' },
      { headline: 'Рижскій миръ', body: 'Подписанъ прелиминарный миръ съ Польшей. Границу провели по линіи Керзона минусъ.', date: 'Октябрь' },
    ],
    tel: [
      { text: 'КОЛЧАКЪ · РАЗСТРѢЛЯНЪ · ВЪ · 5.00 · УТРА', date: '07.II' },
      { text: 'КІЕВЪ · ВЗЯТЪ · ПОЛЯКАМИ · ПРИБЫВАЕМЪ · НА · ФРОНТЪ', date: '07.V' },
      { text: 'ВАРШАВА · НЕ · ВЗЯТА · ОТСТУПАЕМЪ · КЪ · БУГУ', date: '16.VIII' },
      { text: 'СИВАШЪ · ФОРСИРОВАНЪ · КРЫМЪ · НАШЪ', date: '08.XI' },
      { text: 'СЕВАСТОПОЛЬ · ПУСТЪ · ВРАНГЕЛЬ · УШЁЛЪ · ВЪ · МОРЕ', date: '14.XI' },
      { text: 'МАХНО · РАЗОРУЖИТЬ · ПРИКАЗЪ · РВСР', date: '26.XI' },
    ],
    let: [
      { body: 'Изъ Севастополя выходимъ послѣдними. Мать на «Алмазѣ», я на «Генералѣ Алексѣевѣ». Богъ дастъ — Константинополь.', from: 'мичманъ, ноябрь' },
      { body: 'Варшава отбита. Лежимъ подъ Минскъ-Мазовецкимъ. Дождь, холодъ, снаряды кончились.', from: 'красноарм., августъ' },
    ],
  },
  1921: {
    news: [
      { headline: 'Кронштадтъ взбунтовался', body: 'Матросы требуютъ совѣтовъ безъ коммунистовъ. Лидеръ — Петриченко.', date: 'Мартъ' },
      { headline: 'НЭПъ объявленъ', body: 'Xъ съѣздъ РКП(б) замѣняетъ продразвёрстку продналогомъ. Разрѣшена мелкая торговля.', date: 'Мартъ' },
      { headline: 'Голодъ въ Поволжьѣ', body: 'Саратовъ, Самара, Астрахань. По заявленіямъ — 5 млн. на краю гибели.', date: 'Іюль' },
      { headline: 'Арестъ Тамбовскихъ', body: 'Тухачевскій и Антоновъ-Овсѣенко противъ Антонова. Примѣнены газы.', date: 'Іюнь' },
    ],
    tel: [
      { text: 'КРОНШТАДТЪ · ВЗЯТЪ · ШТУРМОМЪ · ПО · ЛЬДУ', date: '18.III' },
      { text: 'АРОСА · ГАЗЫ · ПРИМѢНЕНЫ · ЛѢСА · ОЧИЩЕНЫ', date: '12.VI' },
      { text: 'САМАРА · ВАГОНЫ · СЪ · ХЛѢБОМЪ · РАЗОБРАНЫ · ГОЛОДНЫМИ', date: 'VIII' },
      { text: 'АРА · ГУВЕРЪ · ДОСТАВЛЯЕТЪ · ПРОДОВОЛЬСТВІЕ', date: 'IX' },
      { text: 'ВЛАДИВОСТОКЪ · ЯПОНЦЫ · ЕЩЁ · СТОЯТЪ', date: 'XI' },
    ],
    let: [
      { body: 'Мы просимъ мира съ Россіей и хлѣба для дѣтей. Всё остальное — потомъ.', from: 'воззваніе РПЦ, августъ' },
      { body: 'Матросы — цвѣтъ и гордость революціи — кричатъ: довольно. И ихъ разстрѣливаютъ.', from: 'изъ дневника, мартъ' },
    ],
  },
  1922: {
    news: [
      { headline: 'Генуэзская конференція', body: 'РСФСР впервые за столомъ съ Антантой. Чичеринъ требуетъ признанія.', date: 'Апрѣль' },
      { headline: 'Владивостокъ освобождёнъ', body: 'Послѣдній японскій транспортъ ушёлъ. НРА входитъ въ городъ.', date: 'Октябрь' },
      { headline: 'Образованъ СССР', body: 'РСФСР, УССР, БССР, ЗСФСР подписали Союзный договоръ. Начата эпоха.', date: 'Декабрь' },
      { headline: '«Философскій пароходъ»', body: 'Изъ Петрограда высланы 160 философовъ, писателей, учёныхъ.', date: 'Сентябрь' },
    ],
    tel: [
      { text: 'ГЕНУЯ · РАПАЛЛО · ПОДПИСАНО · СЪ · ГЕРМАНІЕЙ', date: '16.IV' },
      { text: 'ВЛАДИВОСТОКЪ · НАШЪ · ГРАЖД. · ВОЙНА · ОКОНЧЕНА', date: '25.X' },
      { text: 'ОБРАЗОВАНЪ · СОЮЗЪ · ССР · ЕДИНОГЛАСНО', date: '30.XII' },
      { text: 'ЛЕНИНЪ · БОЛЕНЪ · КОНСИЛІУМЪ · ЗАСѢДАЕТЪ', date: 'XII' },
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

function DirectionC({ lang, time, duration, years }) {
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
        y={280} height={200} speed={60} time={time}
        items={newsItems} cardStep={420}
        renderItem={(item, i) => (
          <div style={{ position: 'absolute', top: 20, left: 20 }}>
            <NewspaperClipping {...item} rotate={-2 + (i % 3)} />
          </div>
        )}
      />

      <Strip
        y={500} height={200} speed={95} time={time}
        items={telItems} cardStep={360}
        renderItem={(item, i) => {
          // Псевдослучайная вариация в рамках ±20–25% — размер, сдвиг, поворот.
          const s = [0.82, 1.00, 1.18, 0.92, 1.10, 0.86, 1.05][i % 7];   // 0.82..1.18
          const dy = [20, 4, 38, 12, 46, 0, 26][i % 7];                  // 0..46
          const dx = [20, 44, 8, 36, 16, 52, 24][i % 7];                 // 8..52
          const rot = [-4, 2, -1, 5, -3, 1, 3, -2][i % 8];               // ±5°
          const w = Math.round(320 * s);
          return (
            <div style={{ position: 'absolute', top: dy, left: dx }}>
              <TelegramSlip {...item} width={w} rotate={rot} />
            </div>
          );
        }}
      />

      <Strip
        y={740} height={230} speed={45} time={time}
        items={letItems} cardStep={460}
        renderItem={(item, i) => (
          <div style={{ position: 'absolute', top: 20, left: 20 }}>
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
    </div>
  );
}

window.DirectionC = DirectionC;
