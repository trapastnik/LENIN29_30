// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/boot-expo.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const DIRECTIONS = [
  { id: "A", ru: "\u0421\u0442\u043E\u043B \u043A\u043E\u043C\u0435\u043D\u0434\u0430\u043D\u0442\u0430", en: "Commander's Desk" },
  { id: "B", ru: "\u041A\u0430\u0440\u0442\u0430 \u0444\u0440\u043E\u043D\u0442\u043E\u0432", en: "Fronts Map" },
  { id: "C", ru: "\u041F\u043E\u0442\u043E\u043A \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432", en: "Document Stream" }
];
const DURATION = 60;
const SECTION_SRCS = {
  parties: "../parties.html",
  states: "../states.html",
  people: "people.html"
};
function Expo() {
  const [lang, setLang] = React.useState(() => {
    try {
      return localStorage.getItem("expo:lang") || "ru";
    } catch {
      return "ru";
    }
  });
  const [direction, setDirection] = React.useState(() => {
    try {
      return localStorage.getItem("expo:direction") || "A";
    } catch {
      return "A";
    }
  });
  const [time, setTime] = React.useState(() => {
    try {
      return parseFloat(localStorage.getItem("expo:t") || "0") || 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(true);
  const [scale, setScale] = React.useState(1);
  const [activeSection, setActiveSection] = React.useState(null);
  const [loadedSections, setLoadedSections] = React.useState(/* @__PURE__ */ new Set());
  const openSection = React.useCallback((id) => {
    setActiveSection(id);
    setLoadedSections((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    requestAnimationFrame(() => {
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((f) => {
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
    try {
      localStorage.setItem("expo:direction", direction);
    } catch {
    }
  }, [direction]);
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:t", String(time));
    } catch {
    }
  }, [time]);
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
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1e3;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= DURATION) next = next % DURATION;
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") setTime((t) => Math.max(0, t - 1));
      else if (e.code === "ArrowRight") setTime((t) => Math.min(DURATION, t + 1));
      else if (e.key === "1") setDirection("A");
      else if (e.key === "2") setDirection("B");
      else if (e.key === "3") setDirection("C");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const years = window.EXPO_DATA.years;
  return /* @__PURE__ */ React.createElement("div", { ref: stageRef, style: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050301",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 1920,
    height: 1080,
    position: "relative",
    transform: `scale(${scale})`,
    transformOrigin: "center",
    flexShrink: 0,
    boxShadow: "0 0 120px rgba(0,0,0,.9)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, visibility: direction === "A" ? "visible" : "hidden" } }, /* @__PURE__ */ React.createElement(DirectionA, { lang, time, duration: DURATION, years })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, visibility: direction === "B" ? "visible" : "hidden" } }, /* @__PURE__ */ React.createElement(DirectionB, { lang, time, duration: DURATION, years })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, visibility: direction === "C" ? "visible" : "hidden" } }, /* @__PURE__ */ React.createElement(DirectionC, { lang, time, duration: DURATION, years })), /* @__PURE__ */ React.createElement(
    TopBar,
    {
      lang,
      setLang,
      direction,
      setDirection,
      directions: DIRECTIONS,
      onOpenSection: openSection
    }
  ), /* @__PURE__ */ React.createElement(
    Vernier,
    {
      time,
      duration: DURATION,
      playing,
      onPlayPause: () => setPlaying((p) => !p),
      onSeek: (t) => setTime(t),
      onHover: () => {
      },
      years: [1918, 1919, 1920, 1921, 1922]
    }
  ), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: "0.3em",
    color: theme.inkFaint,
    textTransform: "uppercase",
    pointerEvents: "none"
  } }, lang === "ru" ? "\u25C2 \u041F\u0415\u0420\u0415\u0422\u0410\u0429\u0418\u0422\u0415 \u0412\u0415\u0420\u041D\u042C\u0415\u0420 \u0414\u041B\u042F \u0414\u0412\u0418\u0416\u0415\u041D\u0418\u042F \u041F\u041E \u0413\u041E\u0414\u0410\u041C \u25B8    \xB7    \u041D\u0410\u0416\u041C\u0418\u0422\u0415 \u0420\u0410\u0417\u0414\u0415\u041B \u0421\u0412\u0415\u0420\u0425\u0423, \u0427\u0422\u041E\u0411\u042B \u0421\u041C\u0415\u041D\u0418\u0422\u042C \u0412\u0418\u0414" : "\u25C2 DRAG THE VERNIER TO SCRUB THROUGH THE YEARS \u25B8    \xB7    TAP A SECTION ABOVE TO CHANGE THE VIEW")), Object.entries(SECTION_SRCS).map(([id, src]) => loadedSections.has(id) ? /* @__PURE__ */ React.createElement("div", { key: id, style: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "#050301",
    display: activeSection === id ? "block" : "none"
  } }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      src,
      title: id,
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
