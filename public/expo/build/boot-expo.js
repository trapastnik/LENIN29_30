// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/boot-expo.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const SECTIONS = [
  {
    id: "chronicle",
    src: "chronicle.html",
    ru: "\u0425\u0440\u043E\u043D\u0438\u043A\u0430 \u0441\u043E\u0431\u044B\u0442\u0456\u0439",
    en: "Chronicle of events",
    noteRu: "\u041B\u0435\u043D\u0442\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 1917\u20131922, \u0441\u043E\u0431\u044B\u0442\u0456\u044F \u043F\u043E \u0433\u043E\u0434\u0430\u043C\u044A",
    noteEn: "Timeline 1917\u20131922, events by year",
    accent: "#A02128",
    // BRAND.signalRed
    countKey: "chronicle"
  },
  {
    id: "parties",
    src: "../parties.html",
    ru: "\u041F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0456\u044F \u043F\u0430\u0440\u0442\u0456\u0438",
    en: "Political parties",
    noteRu: "\u041A\u0440\u0430\u0441\u043D\u044B\u0435, \u0431\u0463\u043B\u044B\u0435, \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0456\u043E\u043D\u043D\u0430\u044F \u0434\u0435\u043C\u043E\u043A\u0440\u0430\u0442\u0456\u044F, \u0437\u0435\u043B\u0451\u043D\u044B\u0435, \u043D\u0430\u0446\u0456\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u044F \u0434\u0432\u0438\u0436\u0435\u043D\u0456\u044F",
    noteEn: "Reds, Whites, revolutionary democracy, Greens, national movements",
    accent: "#8C4A99",
    // --camp-rev-dem
    countKey: "parties"
  },
  {
    id: "states",
    src: "../states.html",
    ru: "\u0413\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u044F \u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0456\u044F",
    en: "State formations",
    noteRu: "\u0428\u0435\u0441\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u044A, \u0441\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u044A \u0438\u043D\u0444\u043E\u0431\u043B\u043E\u043A\u043E\u043C\u044A \u0438 \u043A\u0430\u0440\u0442\u043E\u0439 \u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0456\u0438",
    noteEn: "Six groups, dossiers with an info block and a territory map",
    accent: "#2F4A6B",
    // --camp-intervention
    countKey: "states"
  },
  {
    id: "people",
    src: "people.html",
    ru: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0456\u0438",
    en: "People",
    noteRu: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438 \u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430\u0445\u044A \u0441\u044A \u043E\u0431\u0463\u0438\u0445\u044A \u0441\u0442\u043E\u0440\u043E\u043D\u044A",
    noteEn: "Dossiers on participants from every side",
    accent: "#D2B773",
    // BRAND.brass
    countKey: "persons"
  },
  {
    id: "simbirsk",
    src: null,
    ru: "\u0421\u0438\u043C\u0431\u0438\u0440\u0441\u043A\u044A 1918\u20131919",
    en: "Simbirsk 1918\u20131919",
    noteRu: "\u041B\u043E\u043D\u0433\u0440\u0438\u0434\u044A \u043E \u0433\u043E\u0440\u043E\u0434\u0463 \u043C\u0435\u0436\u0434\u0443 \u043A\u0440\u0430\u0441\u043D\u044B\u043C\u0438 \u0438 \u041A\u043E\u043C\u0443\u0447\u0435\u043C\u044A",
    noteEn: "A longread on the town between the Reds and Komuch",
    accent: "#5A8E55",
    // --camp-green
    countKey: null
  }
];
const COUNT_SOURCES = {
  chronicle: { url: "content/chronicle/_index.json", pick: (d) => (d.years || []).reduce((s, y) => s + (y.count || 0), 0) },
  parties: { url: "content/parties/_index.json", pick: (d) => (d.items || []).length },
  states: { url: "content/states/_index.json", pick: (d) => (d.items || []).length },
  persons: { url: "content/persons/_index.json", pick: (d) => (d.items || []).length }
};
function Expo() {
  const [lang, setLang] = React.useState(() => {
    try {
      return localStorage.getItem("expo:lang") || "ru";
    } catch {
      return "ru";
    }
  });
  const [scale, setScale] = React.useState(1);
  const [activeSection, setActiveSection] = React.useState(null);
  const [loadedSections, setLoadedSections] = React.useState(/* @__PURE__ */ new Set());
  const [years, setYears] = React.useState([]);
  const [activeYear, setActiveYear] = React.useState(null);
  const [counts, setCounts] = React.useState({});
  React.useEffect(() => {
    let alive = true;
    fetch(MTK_URL("content/chronicle/_index.json")).then((r) => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))).then((d) => {
      if (alive) setYears(d.years || []);
    }).catch((err) => console.warn("[expo] \u0445\u0440\u043E\u043D\u0438\u043A\u0430 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C:", err));
    return () => {
      alive = false;
    };
  }, []);
  React.useEffect(() => {
    let alive = true;
    Object.entries(COUNT_SOURCES).forEach(([key, s]) => {
      fetch(MTK_URL(s.url)).then((r) => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))).then((d) => {
        if (alive) setCounts((prev) => ({ ...prev, [key]: s.pick(d) }));
      }).catch((err) => console.warn("[expo] \u0441\u0447\u0451\u0442\u0447\u0438\u043A", key, "\u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F:", err));
    });
    return () => {
      alive = false;
    };
  }, []);
  const pendingYear = React.useRef(null);
  const postYear = React.useCallback((year) => {
    const frame = [...document.querySelectorAll("iframe")].find((f) => f.title === "chronicle");
    if (!frame || !frame.contentWindow || !frame.dataset.ready) {
      pendingYear.current = year;
      return;
    }
    try {
      frame.contentWindow.postMessage({ type: "mtk29:goto-year", year }, "*");
    } catch {
    }
  }, []);
  const onChronicleLoad = React.useCallback((e) => {
    const frame = e.currentTarget;
    frame.dataset.ready = "1";
    if (pendingYear.current == null) return;
    try {
      frame.contentWindow.postMessage({ type: "mtk29:goto-year", year: pendingYear.current }, "*");
    } catch {
    }
    pendingYear.current = null;
  }, []);
  const openYear = React.useCallback((year) => {
    setActiveYear(year);
    openSectionRef.current("chronicle");
    postYear(year);
  }, [postYear]);
  const openSection = React.useCallback((id) => {
    setActiveSection(id);
    setLoadedSections((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    requestAnimationFrame(() => {
      document.querySelectorAll("iframe").forEach((f) => {
        if (f.title === id && f.contentWindow) {
          try {
            f.contentWindow.postMessage("mtk29:section-opened", "*");
          } catch {
          }
        }
      });
    });
  }, []);
  const closeSection = React.useCallback(() => setActiveSection(null), []);
  const openSectionRef = React.useRef(openSection);
  React.useEffect(() => {
    openSectionRef.current = openSection;
  }, [openSection]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActiveSection(null);
    };
    const onMsg = (e) => {
      if (e.data === "mtk29:close-section") setActiveSection(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMsg);
    };
  }, []);
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
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const sections = SECTIONS.map((s) => ({
    ...s,
    count: s.countKey ? counts[s.countKey] != null ? counts[s.countKey] : null : null
  }));
  const overlays = SECTIONS.filter((s) => s.src);
  return /* @__PURE__ */ React.createElement("div", { ref: stageRef, style: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050301",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("style", null, `
        @keyframes fadeUpTile { from { opacity: 0; transform: translateY(26px); } }
      `), /* @__PURE__ */ React.createElement("div", { style: {
    width: 1920,
    height: 1080,
    position: "relative",
    transform: `scale(${scale})`,
    transformOrigin: "center",
    flexShrink: 0,
    boxShadow: "0 0 120px rgba(0,0,0,.9)",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement(Backdrop, null), /* @__PURE__ */ React.createElement(MainHeader, { lang, setLang }), /* @__PURE__ */ React.createElement(Timeline, { years, active: activeYear, onPick: openYear, lang }), /* @__PURE__ */ React.createElement(SectionTiles, { sections, lang, onOpen: openSection }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 26,
    left: 0,
    right: 0,
    zIndex: 3,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: "0.3em",
    color: theme.paperWarm,
    textTransform: "uppercase",
    pointerEvents: "none"
  } }, lang === "ru" ? "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0433\u043E\u0434\u044A \u043D\u0430 \u043B\u0435\u043D\u0442\u0463 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \xB7 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u044A, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043A\u0440\u044B\u0442\u044C" : "Tap a year on the timeline \xB7 tap a section to open")), overlays.map((s) => loadedSections.has(s.id) ? /* @__PURE__ */ React.createElement("div", { key: s.id, style: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "#050301",
    display: activeSection === s.id ? "block" : "none"
  } }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      src: s.src,
      title: s.id,
      onLoad: s.id === "chronicle" ? onChronicleLoad : void 0,
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        background: "transparent",
        display: "block"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: closeSection,
      style: {
        position: "absolute",
        bottom: 32,
        right: 32,
        zIndex: 10,
        width: 64,
        height: 64,
        borderRadius: 32,
        border: `1.5px solid ${theme.paperWarm}`,
        background: "rgba(10,6,3,0.85)",
        color: theme.paperLight,
        fontSize: 32,
        lineHeight: 1,
        cursor: "pointer",
        fontFamily: fonts.display
      },
      "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"
    },
    "\xD7"
  )) : null));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(Expo, null));
