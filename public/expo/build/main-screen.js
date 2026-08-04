// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/main-screen.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const BACKDROP_SRC = null;
const TOUCH_HIT = "var(--touch-hit, 120px)";
function Backdrop() {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
    // Тёмное дерево, а не бумага: плитки разделов сами бумажные, и на
    // бумажном фоне они переставали читаться как отдельные предметы.
    ...BACKDROP_SRC ? {} : woodBg()
  } }, BACKDROP_SRC && /* @__PURE__ */ React.createElement("img", { src: MTK_URL(BACKDROP_SRC), alt: "", style: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse 95% 85% at 50% 38%, rgba(90,58,34,.22) 0%, rgba(8,4,2,.85) 100%)"
  } }));
}
function MainHeader({ lang, setLang }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "38px 56px 0"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: "0.38em",
    color: theme.brass,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u0413\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u043C\u0443\u0437\u0435\u0439 \u0412. \u0418. \u041B\u0435\u043D\u0438\u043D\u0430" : "State Lenin Museum"), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.display,
    fontSize: 62,
    lineHeight: 1.02,
    color: theme.paperLight,
    marginTop: 10
  } }, lang === "ru" ? "\u0420\u043E\u0441\u0441\u0456\u044F \u0432\u044A \u0413\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u043A\u043E\u0439 \u0432\u043E\u0439\u043D\u0463" : "Russia in the Civil War"), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 16,
    letterSpacing: "0.3em",
    color: theme.paperWarm,
    marginTop: 8
  } }, "1917 \u2014 1922")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setLang(lang === "ru" ? "en" : "ru"), style: {
    // Переключатель языка — основная навигация, ≥120 px (§1).
    minWidth: 120,
    minHeight: TOUCH_HIT,
    fontFamily: fonts.mono,
    fontSize: 15,
    letterSpacing: "0.25em",
    color: theme.paperLight,
    background: "transparent",
    border: `1.5px solid ${theme.brass}`,
    borderRadius: 32,
    textTransform: "uppercase"
  } }, lang === "ru" ? "EN" : "RU")));
}
function Timeline({ years, active, onPick, lang }) {
  const total = years.reduce((s, y) => s + (y.count || 0), 0) || 1;
  const cur = years.find((y) => y.year === active) || null;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 214,
    left: 56,
    right: 56,
    zIndex: 3
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10
  } }, years.map((y) => {
    const on = y.year === active;
    const h = 26 + Math.round(y.count / total * 150);
    return /* @__PURE__ */ React.createElement("button", { key: y.year, onClick: () => onPick(y.year), style: {
      flex: 1,
      // ≥120px по CLAUDE.md §1: тач-палец, а не курсор
      minHeight: TOUCH_HIT,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-end",
      gap: 10,
      padding: 0,
      background: "transparent",
      border: "none"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: h,
      background: on ? theme.brass : `${theme.paperWarm}33`,
      boxShadow: on ? `0 0 22px ${theme.brass}55` : "none",
      borderTop: `2px solid ${on ? theme.gold : theme.paperWarm}`,
      transition: "height 180ms ease, background 180ms ease"
    } }), /* @__PURE__ */ React.createElement("div", { style: {
      fontFamily: fonts.display,
      fontSize: on ? 44 : 36,
      lineHeight: 1,
      color: on ? theme.paperLight : theme.paperWarm,
      transition: "font-size 180ms ease"
    } }, y.year), /* @__PURE__ */ React.createElement("div", { style: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.18em",
      color: on ? theme.brass : `${theme.paperWarm}aa`
    } }, y.count));
  })), /* @__PURE__ */ React.createElement("div", { style: { height: 2, background: `${theme.paperWarm}55`, marginTop: 4 } }), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 16,
    minHeight: 30,
    display: "flex",
    gap: 30,
    alignItems: "baseline",
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: "0.2em",
    color: theme.paperWarm,
    textTransform: "uppercase"
  } }, cur ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: theme.brass } }, cur.count, " ", lang === "ru" ? "\u0441\u043E\u0431\u044B\u0442\u0456\u0439" : "events"), /* @__PURE__ */ React.createElement("span", null, lang === "ru" ? "\u043F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0445\u044A" : "political", " \xB7 ", cur.pol), /* @__PURE__ */ React.createElement("span", null, lang === "ru" ? "\u0432\u043E\u0435\u043D\u043D\u044B\u0445\u044A" : "military", " \xB7 ", cur.mil), /* @__PURE__ */ React.createElement("span", null, lang === "ru" ? "\u0441\u043E \u0441\u043F\u0440\u0430\u0432\u043A\u043E\u0439" : "with a card", " \xB7 ", cur.cards)) : /* @__PURE__ */ React.createElement("span", null, lang === "ru" ? "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u043E\u0434\u044A" : "Pick a year")));
}
function SectionTiles({ sections, lang, onOpen }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 56,
    right: 56,
    top: 470,
    zIndex: 3,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 20
  } }, sections.map((s, i) => {
    const ready = !!s.src;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s.id,
        onClick: ready ? () => onOpen(s.id) : void 0,
        disabled: !ready,
        style: {
          minHeight: TOUCH_HIT,
          height: 470,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
          gap: 0,
          padding: "30px 26px",
          ...paperFillTile(ready),
          border: `1.5px solid ${ready ? theme.brass : `${theme.paperDark}88`}`,
          borderTop: `10px solid ${s.accent}`,
          opacity: ready ? 1 : 0.6,
          cursor: ready ? "pointer" : "default",
          animation: `fadeUpTile 520ms ${i * 70}ms both`
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: "0.3em",
        color: theme.inkFaint,
        textTransform: "uppercase"
      } }, lang === "ru" ? "\u0420\u0430\u0437\u0434\u0435\u043B\u044A" : "Section", " \xB7 ", String(i + 1).padStart(2, "0")),
      /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.display,
        fontSize: 34,
        lineHeight: 1.06,
        color: theme.ink,
        marginTop: 14
      } }, lang === "ru" ? s.ru : s.en),
      /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 14,
        fontFamily: fonts.body,
        fontSize: 15,
        color: theme.inkSoft,
        lineHeight: 1.4
      } }, lang === "ru" ? s.noteRu : s.noteEn),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }),
      s.count != null && /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.display,
        fontSize: 54,
        lineHeight: 1,
        color: s.accent
      } }, s.count),
      /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 6,
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: "0.22em",
        color: ready ? theme.inkFaint : theme.inkSoft,
        textTransform: "uppercase"
      } }, ready ? lang === "ru" ? "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u2192" : "Open \u2192" : lang === "ru" ? "\u0413\u043E\u0442\u043E\u0432\u0438\u0442\u0441\u044F" : "In progress")
    );
  }));
}
function paperFillTile(ready) {
  return ready ? paperBg({ base: theme.paper, vignette: false }) : { background: `linear-gradient(160deg, ${theme.paperWarm}cc 0%, ${theme.paperDark}cc 100%)` };
}
window.Backdrop = Backdrop;
window.MainHeader = MainHeader;
window.Timeline = Timeline;
window.SectionTiles = SectionTiles;
