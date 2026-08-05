// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/boot-chronicle.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const YEARS_FALLBACK = [1917, 1918, 1919, 1920, 1921, 1922];
function ChronicleApp() {
  const [lang, setLang] = React.useState(() => {
    try {
      return localStorage.getItem("expo:lang") || "ru";
    } catch {
      return "ru";
    }
  });
  const [years, setYears] = React.useState([]);
  const [year, setYear] = React.useState(() => {
    try {
      return Number(localStorage.getItem("expo:chronicleYear")) || 1917;
    } catch {
      return 1917;
    }
  });
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [track, setTrack] = React.useState("all");
  const [cardId, setCardId] = React.useState(null);
  const [card, setCard] = React.useState(null);
  const [cardError, setCardError] = React.useState(null);
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:lang", lang);
    } catch {
    }
  }, [lang]);
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "expo:lang" && e.newValue && e.newValue !== lang) setLang(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:chronicleYear", String(year));
    } catch {
    }
  }, [year]);
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (d === "mtk29:section-opened") {
        setCardId(null);
        return;
      }
      if (d && d.type === "mtk29:goto-year" && d.year) {
        setYear(Number(d.year));
        setCardId(null);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (cardId) setCardId(null);
      else if (window.parent !== window) window.parent.postMessage("mtk29:close-section", "*");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cardId]);
  React.useEffect(() => {
    let alive = true;
    window.MTK_CHRONICLE.loadIndex().then((y) => {
      if (alive) setYears(y);
    }).catch((err) => console.warn("[chronicle] \u0438\u043D\u0434\u0435\u043A\u0441 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F:", err));
    return () => {
      alive = false;
    };
  }, []);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    window.MTK_CHRONICLE.loadYear(year).then((list) => {
      if (alive) {
        setItems(list);
        setLoading(false);
      }
    }).catch((err) => {
      if (alive) {
        setError(err);
        setItems([]);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [year]);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [year]);
  React.useEffect(() => {
    if (!cardId) {
      setCard(null);
      setCardError(null);
      return;
    }
    let alive = true;
    setCard(null);
    setCardError(null);
    window.MTK_CHRONICLE.loadCard(cardId).then((c) => {
      if (alive) setCard(c);
    }).catch((err) => {
      if (alive) setCardError(err);
    });
    return () => {
      alive = false;
    };
  }, [cardId]);
  const shown = React.useMemo(() => track === "all" ? items : items.filter((i) => i.track === track || i.track === "both"), [items, track]);
  const months = React.useMemo(() => {
    const groups = [];
    let cur = null;
    for (const it of shown) {
      const key = chronicleMonthKey(it);
      if (!cur || cur.key !== key) {
        cur = { key, items: [] };
        groups.push(cur);
      }
      cur.items.push(it);
    }
    return groups;
  }, [shown]);
  const counts = React.useMemo(() => ({
    all: items.length,
    pol: items.filter((i) => i.track === "pol" || i.track === "both").length,
    mil: items.filter((i) => i.track === "mil" || i.track === "both").length
  }), [items]);
  const yearList = years.length ? years : YEARS_FALLBACK.map((y) => ({ year: y, count: null }));
  return /* @__PURE__ */ React.createElement("div", { ref: scrollRef, className: "brand-scroll", style: {
    position: "absolute",
    inset: 0,
    overflowY: cardId ? "hidden" : "auto",
    overscrollBehavior: "contain",
    background: chTheme.bgDeep,
    color: chTheme.paper
  } }, /* @__PURE__ */ React.createElement("style", null, `
        @keyframes chFade { from { opacity: 0; transform: translateY(14px); } }
        .brand-scroll { scrollbar-width: auto; scrollbar-color: ${chBrand.brass} rgba(0,0,0,0.45); }
        .brand-scroll::-webkit-scrollbar { width: 14px; }
        .brand-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.45); }
        .brand-scroll::-webkit-scrollbar-thumb {
          background: ${chBrand.brass}; border: 3px solid rgba(0,0,0,0.45);
          border-radius: 8px; min-height: 60px;
        }
      `), /* @__PURE__ */ React.createElement("div", { style: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: chTheme.ink,
    boxShadow: "0 2px 0 rgba(0,0,0,0.4), 0 14px 24px rgba(0,0,0,0.45)",
    borderBottom: `1px solid ${chBrand.brass}55`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: S("26px 40px 0"),
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: S(24)
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.mono,
    fontSize: S(11),
    letterSpacing: "0.34em",
    color: chBrand.brass,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u0420\u0430\u0437\u0434\u0435\u043B\u044A \xB7 01" : "Section \xB7 01"), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.display,
    fontSize: S(44),
    lineHeight: 1.05,
    color: chTheme.paper,
    marginTop: S(6)
  } }, lang === "ru" ? "\u0425\u0440\u043E\u043D\u0438\u043A\u0430 \u0441\u043E\u0431\u044B\u0442\u0456\u0439. 1917\u20141922" : "Chronicle of events. 1917\u20141922")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: S(12), alignItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    if (window.parent !== window) window.parent.postMessage("mtk29:close-section", "*");
  }, style: {
    // «к экспозиции» — основная навигация, ≥120 px (§1).
    minHeight: S("var(--touch-hit, 120px)"),
    padding: S("0 28px"),
    fontFamily: chFonts.mono,
    fontSize: S(12),
    letterSpacing: "0.22em",
    color: chTheme.paper,
    background: "transparent",
    border: `1px solid ${chBrand.brass}`,
    borderRadius: 28,
    textTransform: "uppercase"
  } }, "\u2190 ", lang === "ru" ? "\u043A\u044A \u044D\u043A\u0441\u043F\u043E\u0437\u0438\u0446\u0456\u0438" : "to the exhibit"), /* @__PURE__ */ React.createElement("button", { onClick: () => setLang(lang === "ru" ? "en" : "ru"), style: {
    // Переключатель языка — основная навигация, ≥120 px (§1).
    minWidth: S(120),
    minHeight: S("var(--touch-hit, 120px)"),
    padding: S("0 24px"),
    fontFamily: chFonts.mono,
    fontSize: S(12),
    letterSpacing: "0.24em",
    color: chTheme.paper,
    background: "transparent",
    border: `1px solid ${chBrand.brass}`,
    borderRadius: 28,
    textTransform: "uppercase"
  } }, lang === "ru" ? "EN" : "RU"))), /* @__PURE__ */ React.createElement("div", { style: { padding: S("18px 40px 0"), display: "flex", gap: S(10), flexWrap: "wrap" } }, yearList.map((y) => {
    const on = y.year === year;
    return /* @__PURE__ */ React.createElement("button", { key: y.year, onClick: () => setYear(y.year), style: {
      // Кнопка года — основная навигация по ленте, ≥120 px (§1).
      minWidth: S(150),
      minHeight: S("var(--touch-hit, 120px)"),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: S(2),
      background: on ? chBrand.brass : "transparent",
      color: on ? chBrand.inkBlack : chTheme.paperDim,
      border: `1px solid ${on ? chBrand.brass : chTheme.paperDim}`
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: chFonts.display, fontSize: S(26), lineHeight: 1 } }, y.year), y.count != null && /* @__PURE__ */ React.createElement("span", { style: { fontFamily: chFonts.mono, fontSize: S(10), letterSpacing: "0.2em", opacity: 0.8 } }, y.count));
  })), /* @__PURE__ */ React.createElement("div", { style: { padding: S("14px 40px 18px"), display: "flex", gap: S(10), alignItems: "center" } }, [
    { id: "all", ru: "\u0412\u0441\u0451", en: "All", color: chBrand.brass, n: counts.all },
    { id: "pol", ru: CHRONICLE_TRACKS.pol.ru, en: CHRONICLE_TRACKS.pol.en, color: CHRONICLE_TRACKS.pol.color, n: counts.pol },
    { id: "mil", ru: CHRONICLE_TRACKS.mil.ru, en: CHRONICLE_TRACKS.mil.en, color: CHRONICLE_TRACKS.mil.color, n: counts.mil }
  ].map((t) => {
    const on = track === t.id;
    return /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setTrack(t.id), style: {
      // Фильтр трека — управляющий элемент раздела, ≥64 px (§1).
      minHeight: S(64),
      padding: S("0 22px"),
      fontFamily: chFonts.mono,
      fontSize: S(12),
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      background: on ? t.color : "transparent",
      color: on ? chBrand.inkBlack : chTheme.paperDim,
      border: `1px solid ${on ? t.color : chTheme.paperDim}`,
      display: "flex",
      alignItems: "center",
      gap: S(8)
    } }, lang === "ru" ? t.ru : t.en, /* @__PURE__ */ React.createElement("span", { style: { fontSize: S(10), opacity: 0.75 } }, "\xB7 ", t.n));
  }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.mono,
    fontSize: S(11),
    letterSpacing: "0.2em",
    color: chTheme.paperDim,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u0438\u0442\u0435 \u043B\u0435\u043D\u0442\u0443 \xB7 \u0441\u043F\u0440\u0430\u0432\u043A\u0430 \u0435\u0441\u0442\u044C \u043D\u0435 \u0443 \u043A\u0430\u0436\u0434\u0430\u0433\u043E \u0441\u043E\u0431\u044B\u0442\u0456\u044F" : "Scroll the timeline \xB7 not every event has a dossier"))), /* @__PURE__ */ React.createElement("div", { style: { padding: S("34px 40px 120px"), maxWidth: S(1800), margin: "0 auto", position: "relative" } }, !loading && !error && shown.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    bottom: S(120),
    left: "50%",
    width: S(1),
    marginLeft: -0.5,
    background: `${chBrand.brass}33`,
    pointerEvents: "none",
    zIndex: 0
  } }), loading && /* @__PURE__ */ React.createElement("div", { style: {
    padding: S(60),
    textAlign: "center",
    fontFamily: chFonts.mono,
    fontSize: S(13),
    letterSpacing: "0.3em",
    color: chBrand.brass,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C\u044A " + year + " \u0433\u043E\u0434\u044A\u2026" : "loading " + year + "\u2026"), error && /* @__PURE__ */ React.createElement("div", { style: {
    padding: S(60),
    textAlign: "center",
    fontFamily: chFonts.mono,
    fontSize: S(13),
    color: chBrand.signalRed
  } }, lang === "ru" ? "\u0413\u043E\u0434\u044A \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F: " : "Year failed to load: ", String(error.message || error)), !loading && !error && months.map((g, gi) => /* @__PURE__ */ React.createElement("div", { key: g.key || gi, style: { marginBottom: S(46) } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: S(18),
    margin: S("0 0 22px"),
    position: "relative",
    zIndex: 1,
    background: chTheme.bgDeep
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.display,
    fontSize: S(30),
    lineHeight: 1,
    color: chBrand.brass
  } }, chronicleMonthLabel(g.key, lang)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: S(1), background: `${chBrand.brass}44` } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.mono,
    fontSize: S(11),
    letterSpacing: "0.2em",
    color: chTheme.paperDim
  } }, g.items.length)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: S(22), position: "relative", zIndex: 1 } }, g.items.map((it) => /* @__PURE__ */ React.createElement(EventRow, { key: it.id, item: it, lang, onOpenCard: setCardId }))))), !loading && !error && shown.length === 0 && /* @__PURE__ */ React.createElement("div", { style: {
    padding: S(60),
    textAlign: "center",
    fontFamily: chFonts.mono,
    fontSize: S(13),
    letterSpacing: "0.24em",
    color: chTheme.paperDim,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u0432\u044A \u044D\u0442\u043E\u043C\u044A \u0433\u043E\u0434\u0443 \u0442\u0430\u043A\u0438\u0445\u044A \u0441\u043E\u0431\u044B\u0442\u0456\u0439 \u043D\u0463\u0442\u044A" : "no such events this year")), cardId && !card && !cardError && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(8,5,2,.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: chFonts.mono,
    fontSize: S(13),
    letterSpacing: "0.3em",
    color: chBrand.brass,
    textTransform: "uppercase"
  }, onClick: () => setCardId(null) }, lang === "ru" ? "\u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C\u044A \u0441\u043F\u0440\u0430\u0432\u043A\u0443\u2026" : "loading dossier\u2026"), cardId && cardError && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(8,5,2,.88)",
    display: "flex",
    flexDirection: "column",
    gap: S(16),
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: S(40),
    fontFamily: chFonts.mono,
    fontSize: S(13),
    letterSpacing: "0.2em",
    color: chBrand.brass
  }, onClick: () => setCardId(null) }, /* @__PURE__ */ React.createElement("div", null, lang === "ru" ? "\u0421\u043F\u0440\u0430\u0432\u043A\u0430 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u043B\u0430\u0441\u044C" : "Dossier failed to open"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: S(11), opacity: 0.7 } }, String(cardError.message || cardError))), card && /* @__PURE__ */ React.createElement(EventCard, { card, lang, onClose: () => setCardId(null) }));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(ChronicleApp, null));
