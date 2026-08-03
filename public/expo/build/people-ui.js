// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/people-ui.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
if (!window.MTK_TOKENS) {
  throw new Error("people-ui.jsx: \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D brand-tokens.js (\u0441\u043C. public/expo/people.html)");
}
const SIDE_META = window.MTK_SIDE_META;
const SIDE_NEUTRAL = {
  ru: "\u0412\u043D\u0463 \u043B\u0430\u0433\u0435\u0440\u0435\u0439",
  en: "Unaligned",
  color: "#5D6970",
  // BRAND.slateBlue
  accent: "#9DA3A6",
  // BRAND.slateWindow
  flag: "#555D61"
  // BRAND.ironGrey
};
function sideMeta(side) {
  return side && SIDE_META[side] || SIDE_NEUTRAL;
}
const BRAND = window.BRAND_THEME;
const theme = window.MTK_PEOPLE_THEME;
const fonts = window.MTK_PEOPLE_FONTS;
const T = window.MTK_TOKENS;
const BG_VARIANTS = {
  iron: {
    ru: "\u0416\u0435\u043B\u0435\u0437\u043E-\u0441\u0435\u0440\u044B\u0439",
    en: "Iron grey",
    desc: "RAL 7011 \xB7 \xAB\u0442\u0440\u0435\u0442\u0438\u0439 \u044D\u0442\u0430\u0436\xBB",
    style: { background: "#555D61" }
  },
  graphite: {
    ru: "\u0413\u0440\u0430\u0444\u0438\u0442",
    en: "Graphite",
    desc: "#435059 \xB7 \u043C\u0443\u043B\u044C\u0442\u0438\u043C\u0435\u0434\u0438\u0430",
    style: { background: "#435059" }
  },
  slate: {
    ru: "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440\u044B\u0439",
    en: "Slate blue",
    desc: "RAL 7031 \xB7 \xAB\u0432\u0442\u043E\u0440\u043E\u0439 \u044D\u0442\u0430\u0436\xBB",
    style: { background: "#5D6970" }
  },
  black: {
    ru: "\u0427\u0451\u0440\u043D\u044B\u0439 \u044F\u043D\u0442\u0430\u0440\u044C",
    en: "Ink black",
    desc: "RAL 9005",
    style: { background: "#000000" }
  },
  // «Подложка из косых линий» по brand.html секции 6 (страница 4 PDF)
  stripes: {
    ru: "\u0411\u0440\u0435\u043D\u0434-\u043F\u043E\u043B\u043E\u0441\u044B",
    en: "Brand stripes",
    desc: "iron-grey + \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u043E\u0433\u0440\u0430\u043C\u043C\u044B 105\xB0",
    style: {
      background: [
        "linear-gradient(105deg, transparent 0, transparent 72%, #A02128 72%, #A02128 86%, transparent 86.2%)",
        "linear-gradient(105deg, transparent 0, transparent 2%, rgba(157,163,166,0.18) 2%, rgba(157,163,166,0.18) 14%, transparent 14.2%)",
        "linear-gradient(105deg, transparent 0, transparent 62%, #D2B773 62%, #D2B773 62.2%, transparent 62.4%)",
        "linear-gradient(105deg, transparent 0, transparent 89%, rgba(210,183,115,0.55) 89%, rgba(210,183,115,0.55) 89.15%, transparent 89.35%)",
        "#555D61"
      ].join(","),
      backgroundAttachment: "fixed"
    }
  },
  // «Большая композиция стр. 8 PDF» — slate-blue + красные параллелограммы
  parallelograms: {
    ru: "\u041F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    en: "Parallelograms",
    desc: "slate-blue + \u043A\u0440\u0430\u0441\u043D\u044B\u0435 \u043F\u043B\u0430\u0448\u043A\u0438",
    style: {
      background: [
        "linear-gradient(105deg, transparent 0, transparent 18%, #A02128 18%, #A02128 38%, transparent 38.2%)",
        "linear-gradient(105deg, transparent 0, transparent 56%, rgba(0,0,0,0.18) 56%, rgba(0,0,0,0.18) 70%, transparent 70.2%)",
        "linear-gradient(105deg, transparent 0, transparent 80%, #D2B773 80%, #D2B773 80.18%, transparent 80.4%)",
        "#5D6970"
      ].join(","),
      backgroundAttachment: "fixed"
    }
  },
  // Светлый бумажный фон — paper-white RAL 9001 (brand.html секция 1)
  paper: {
    ru: "\u0411\u0443\u043C\u0430\u0433\u0430",
    en: "Paper",
    desc: "RAL 9001 paper-white",
    style: { background: "#F7F9EF" }
  },
  // Светлый с косыми полосами — paper-white + бренд-параллелограммы
  paperStripes: {
    ru: "\u0411\u0443\u043C\u0430\u0433\u0430+\u043F\u043E\u043B\u043E\u0441\u044B",
    en: "Paper stripes",
    desc: "paper-white + \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    style: {
      background: [
        "linear-gradient(105deg, transparent 0, transparent 72%, #A02128 72%, #A02128 86%, transparent 86.2%)",
        "linear-gradient(105deg, transparent 0, transparent 2%, rgba(85,93,97,0.18) 2%, rgba(85,93,97,0.18) 14%, transparent 14.2%)",
        "linear-gradient(105deg, transparent 0, transparent 62%, #D2B773 62%, #D2B773 62.2%, transparent 62.4%)",
        "linear-gradient(105deg, transparent 0, transparent 89%, rgba(67,80,89,0.55) 89%, rgba(67,80,89,0.55) 89.15%, transparent 89.35%)",
        "#F7F9EF"
      ].join(","),
      backgroundAttachment: "fixed"
    }
  }
};
const BRAND_COLORS = Object.fromEntries([
  ["inkBlack", "ink-black", "\u0427\u0451\u0440\u043D\u044B\u0439", "Black"],
  ["graphite", "graphite", "\u0413\u0440\u0430\u0444\u0438\u0442", "Graphite"],
  ["ironGrey", "iron-grey", "\u0416\u0435\u043B\u0435\u0437\u043E", "Iron grey"],
  ["slateBlue", "slate-blue", "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440\u044B\u0439", "Slate blue"],
  ["slateWindow", "slate-window", "\u0421\u0432\u0435\u0442\u043B\u043E-\u0441\u0435\u0440.", "Slate window"],
  ["telegrey4", "telegrey-4", "\u0422\u0435\u043B\u0435-\u0441\u0435\u0440\u044B\u0439", "Telegrey 4"],
  ["paperWhite", "paper-white", "\u0411\u0443\u043C\u0430\u0433\u0430", "Paper"],
  ["brass", "brass", "\u041B\u0430\u0442\u0443\u043D\u044C", "Brass"],
  ["signalRed", "signal-red", "\u041A\u0440\u0430\u0441\u043D\u044B\u0439", "Signal red"]
].map(([key, token, ru, en]) => [key, { ru, en, hex: T[token] }]));
const TEXT_BG_VARIANTS = {
  transparent: { ru: "\u0411\u0435\u0437 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0438", en: "No backing", bg: "transparent", swatch: "transparent" },
  ...Object.fromEntries(Object.entries(BRAND_COLORS).map(([k, v]) => [
    k,
    { ru: v.ru, en: v.en, bg: v.hex, swatch: v.hex }
  ]))
};
const TEXT_INK_VARIANTS = Object.fromEntries(Object.entries(BRAND_COLORS).map(([k, v]) => [
  k,
  { ru: v.ru, en: v.en, ink: v.hex, swatch: v.hex }
]));
const FRAME_VARIANTS = {
  graphiteSoft: {
    ru: "\u0413\u0440\u0430\u0444\u0438\u0442 (soft)",
    en: "Graphite (soft)",
    bg: "rgba(67,80,89,0.78)",
    overlay: "rgba(0,0,0,0.66)",
    swatch: "#435059"
  },
  ironSoft: {
    ru: "\u0416\u0435\u043B\u0435\u0437\u043E (soft)",
    en: "Iron (soft)",
    bg: "rgba(85,93,97,0.78)",
    overlay: "rgba(0,0,0,0.66)",
    swatch: "#555D61"
  },
  slateSoft: {
    ru: "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440. (soft)",
    en: "Slate (soft)",
    bg: "rgba(93,105,112,0.78)",
    overlay: "rgba(0,0,0,0.66)",
    swatch: "#5D6970"
  },
  blackDeep: {
    ru: "\u0427\u0451\u0440\u043D\u044B\u0439",
    en: "Black",
    bg: "rgba(0,0,0,0.65)",
    overlay: "rgba(0,0,0,0.78)",
    swatch: "#000000"
  },
  graphite: {
    ru: "\u0413\u0440\u0430\u0444\u0438\u0442",
    en: "Graphite",
    bg: "#435059",
    overlay: "rgba(0,0,0,0.74)",
    swatch: "#435059"
  },
  ironGrey: {
    ru: "\u0416\u0435\u043B\u0435\u0437\u043E",
    en: "Iron grey",
    bg: "#555D61",
    overlay: "rgba(0,0,0,0.74)",
    swatch: "#555D61"
  },
  slateBlue: {
    ru: "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440\u044B\u0439",
    en: "Slate blue",
    bg: "#5D6970",
    overlay: "rgba(0,0,0,0.74)",
    swatch: "#5D6970"
  },
  paperWhite: {
    ru: "\u0411\u0443\u043C\u0430\u0433\u0430",
    en: "Paper",
    bg: "#F7F9EF",
    overlay: "rgba(67,80,89,0.74)",
    swatch: "#F7F9EF"
  },
  brass: {
    ru: "\u041B\u0430\u0442\u0443\u043D\u044C",
    en: "Brass",
    bg: "#D2B773",
    overlay: "rgba(0,0,0,0.66)",
    swatch: "#D2B773"
  }
};
function bgForVariant(variant) {
  const v = BG_VARIANTS[variant] || BG_VARIANTS.iron;
  return v.style;
}
function SettingsPanel({
  lang,
  headerVariant,
  setHeaderVariant,
  bgVariant,
  setBgVariant,
  cardVariant,
  setCardVariant,
  textBgVariant,
  setTextBgVariant,
  textInkVariant,
  setTextInkVariant,
  frameVariant,
  setFrameVariant
}) {
  const [open, setOpen] = React.useState(() => {
    try {
      return localStorage.getItem("expo:settingsOpen") === "1";
    } catch {
      return false;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:settingsOpen", open ? "1" : "0");
    } catch {
    }
  }, [open]);
  const groups = [
    { ru: "\u0428\u0430\u043F\u043A\u0430", en: "Header", variants: HEADER_VARIANTS, value: headerVariant, set: setHeaderVariant },
    { ru: "\u0424\u043E\u043D", en: "Bg", variants: BG_VARIANTS, value: bgVariant, set: setBgVariant },
    { ru: "\u0424\u0440\u0435\u0439\u043C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438", en: "Card frame", variants: FRAME_VARIANTS, value: frameVariant, set: setFrameVariant },
    { ru: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430", en: "Card", variants: CARD_VARIANTS, value: cardVariant, set: setCardVariant },
    { ru: "\u041F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0430", en: "Text bg", variants: TEXT_BG_VARIANTS, value: textBgVariant, set: setTextBgVariant },
    { ru: "\u0426\u0432\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430", en: "Text ink", variants: TEXT_INK_VARIANTS, value: textInkVariant, set: setTextInkVariant }
  ];
  const pill = (id, label, active, onClick, swatch) => /* @__PURE__ */ React.createElement("button", { key: id, onClick, style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    textAlign: "left",
    padding: "7px 10px",
    background: active ? "#D2B773" : "transparent",
    color: active ? "#000" : "#F7F9EF",
    border: `1px solid ${active ? "#D2B773" : "rgba(210,183,115,0.45)"}`,
    borderRadius: 30,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer"
  } }, swatch && /* @__PURE__ */ React.createElement("span", { style: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
    background: swatch === "transparent" ? "linear-gradient(135deg, transparent 0 45%, #A02128 45% 55%, transparent 55% 100%), #F7F9EF" : swatch,
    border: "1px solid rgba(0,0,0,0.35)"
  } }), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, lineHeight: 1.15 } }, label));
  return /* @__PURE__ */ React.createElement("div", { style: {
    // z-index выше overlay модалки персоналии (100) и лайтбокса (200),
    // чтобы панель оставалась видна и работала во всех слоях.
    position: "fixed",
    top: 96,
    right: open ? 12 : 0,
    zIndex: 250,
    transition: "right 220ms ease",
    pointerEvents: "auto"
  } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((o) => !o), title: lang === "ru" ? "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" : "Settings", style: {
    position: "absolute",
    top: 0,
    right: open ? "auto" : 0,
    left: open ? -32 : "auto",
    width: 32,
    height: 56,
    background: "#000",
    color: "#D2B773",
    border: "1px solid #D2B773",
    borderRight: open ? "none" : "1px solid #D2B773",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    fontFamily: fonts.mono,
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer"
  } }, open ? "\u203A" : "\u2039"), open && /* @__PURE__ */ React.createElement("div", { style: {
    width: 230,
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid #D2B773",
    borderRadius: 6,
    padding: "14px 12px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.65)",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto"
  }, className: "brand-scroll" }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.32em",
    color: "#D2B773",
    textTransform: "uppercase",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(210,183,115,0.35)"
  } }, lang === "ru" ? "\u25C7 \u0421\u0442\u0438\u043B\u044C" : "\u25C7 Style"), groups.map((g, gi) => /* @__PURE__ */ React.createElement("div", { key: gi, style: { marginBottom: gi < groups.length - 1 ? 14 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.28em",
    color: "rgba(247,249,239,0.55)",
    textTransform: "uppercase",
    marginBottom: 6
  } }, g[lang]), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } }, Object.entries(g.variants).map(
    ([id, v]) => pill(
      id,
      v[lang],
      g.value === id,
      () => g.set(id),
      // swatch — bg цвет варианта (для card / header это hex)
      v.swatch || v.bg || v.style && (typeof v.style.background === "string" ? v.style.background : null) || null
    )
  ))))));
}
const CARD_VARIANTS = {
  paper: { ru: "\u0411\u0443\u043C\u0430\u0433\u0430", en: "Paper", bg: "#F7F9EF", ink: "#000000", accent: "#A02128", muted: "rgba(0,0,0,0.55)", rule: "rgba(0,0,0,0.18)" },
  black: { ru: "\u0427\u0451\u0440\u043D\u044B\u0439", en: "Black", bg: "#000000", ink: "#F7F9EF", accent: "#D2B773", muted: "rgba(247,249,239,0.62)", rule: "rgba(210,183,115,0.35)" },
  graphite: { ru: "\u0413\u0440\u0430\u0444\u0438\u0442", en: "Graphite", bg: "#435059", ink: "#F7F9EF", accent: "#D2B773", muted: "rgba(247,249,239,0.62)", rule: "rgba(210,183,115,0.35)" },
  slate: { ru: "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440\u044B\u0439", en: "Slate", bg: "#5D6970", ink: "#F7F9EF", accent: "#D2B773", muted: "rgba(247,249,239,0.62)", rule: "rgba(210,183,115,0.35)" },
  ironGrey: { ru: "\u0416\u0435\u043B\u0435\u0437\u043E", en: "Iron grey", bg: "#555D61", ink: "#F7F9EF", accent: "#D2B773", muted: "rgba(247,249,239,0.62)", rule: "rgba(210,183,115,0.35)" }
};
const HEADER_VARIANTS = {
  black: { ru: "\u0427\u0451\u0440\u043D\u044B\u0439", en: "Black", bg: "rgba(0,0,0,0.94)", border: "rgba(210,183,115,0.35)" },
  graphite: { ru: "\u0413\u0440\u0430\u0444\u0438\u0442", en: "Graphite", bg: "rgba(67,80,89,0.96)", border: "rgba(210,183,115,0.35)" },
  ironGrey: { ru: "\u0416\u0435\u043B\u0435\u0437\u043E", en: "Iron grey", bg: "rgba(85,93,97,0.96)", border: "rgba(210,183,115,0.35)" },
  slate: { ru: "\u0421\u0438\u043D\u0435-\u0441\u0435\u0440\u044B\u0439", en: "Slate", bg: "rgba(93,105,112,0.96)", border: "rgba(210,183,115,0.35)" },
  paper: { ru: "\u0411\u0443\u043C\u0430\u0433\u0430", en: "Paper", bg: "rgba(247,249,239,0.97)", border: "rgba(0,0,0,0.4)", inkOnLight: true }
};
function paperFill() {
  return {
    background: [
      "radial-gradient(ellipse 70% 60% at 30% 30%, rgba(255,245,210,.6) 0%, transparent 55%)",
      "radial-gradient(ellipse 80% 60% at 80% 80%, rgba(120,80,20,.18) 0%, transparent 60%)",
      `repeating-linear-gradient(97deg, rgba(120,80,30,.05) 0 1px, transparent 1px 3px)`,
      `linear-gradient(180deg, ${theme.paperLit} 0%, ${theme.paper} 60%, ${theme.paperDim} 100%)`
    ].join(",")
  };
}
function Silhouette({ side, size = 240, accent }) {
  const meta = sideMeta(side);
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 100 140", style: { width: size, height: size * 1.4 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: `bg-${side}`, cx: "50%", cy: "40%", r: "70%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#8a6a3c" }), /* @__PURE__ */ React.createElement("stop", { offset: "60%", stopColor: "#4a2e14" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#1a0d05" })), /* @__PURE__ */ React.createElement("linearGradient", { id: `sil-${side}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#1a0d05" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#2a1a0a" }))), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "100", height: "140", fill: `url(#bg-${side})` }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "100", height: "140", fill: "url(#noise)", opacity: ".15" }), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M 20 140 Q 20 95 34 88 Q 40 86 42 80 Q 36 76 36 62 Q 36 44 50 44 Q 64 44 64 62 Q 64 76 58 80 Q 60 86 66 88 Q 80 95 80 140 Z",
      fill: `url(#sil-${side})`
    }
  ), /* @__PURE__ */ React.createElement("circle", { cx: "72", cy: "108", r: "6", fill: meta.flag, opacity: ".85" }), /* @__PURE__ */ React.createElement("circle", { cx: "72", cy: "108", r: "6", fill: "none", stroke: "#f0dcae", strokeOpacity: ".3", strokeWidth: ".6" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "100", height: "140", fill: "url(#vign)", opacity: ".7" }), /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: "vign", cx: "50%", cy: "50%", r: "70%" }, /* @__PURE__ */ React.createElement("stop", { offset: "60%", stopColor: "#000", stopOpacity: "0" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#000", stopOpacity: ".7" }))));
}
function SideFlag({ side, lang }) {
  const meta = sideMeta(side);
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px 4px 6px",
    background: meta.flag,
    color: "#f0dcae",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    clipPath: "polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)",
    paddingRight: 18
  } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, background: "#f0dcae", opacity: 0.85 } }), meta[lang]);
}
function PersonCard({ person, lang, onOpen, delay }) {
  const meta = sideMeta(person.side);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onOpen || void 0,
      disabled: !onOpen,
      style: {
        // Заглушка без справки не кликается: файла <id>.json у неё нет,
        // тап давал бы 404 и пустую модалку.
        opacity: onOpen ? 1 : 0.55,
        cursor: onOpen ? "pointer" : "default",
        position: "relative",
        // isolate: каждая карточка в своём stacking-context — соседи не
        // съедают её клик, даже когда transform-rotate их слегка пересекает
        isolation: "isolate",
        zIndex: 1,
        width: "100%",
        textAlign: "left",
        border: "none",
        padding: 0,
        background: "transparent",
        // Угол ротации уменьшен вдвое (raw `_rot` теперь делим), чтобы
        // соседние карточки в гриде не перекрывали друг друга в углах
        transform: `rotate(${(person._rot || 0) * 0.5}deg)`,
        animation: `fadeUp 600ms ${delay}ms both`
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      ...paperFill(),
      border: `1px solid ${theme.inkFade}`,
      padding: 10,
      boxShadow: "0 10px 22px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.3)",
      position: "relative"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: -1,
      right: -1,
      width: 0,
      height: 0,
      borderTop: `34px solid ${meta.flag}`,
      borderLeft: "34px solid transparent"
    } }), /* @__PURE__ */ React.createElement("div", { style: {
      width: "100%",
      aspectRatio: "1/1.25",
      overflow: "hidden",
      position: "relative",
      background: "#F7F9EF",
      border: `1px solid ${theme.inkSoft}`,
      marginBottom: 10
    } }, person.portrait ? /* @__PURE__ */ React.createElement("img", { src: person.portrait, alt: "", loading: "lazy", style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "top",
      display: "block",
      filter: "sepia(0.18) contrast(1.05)"
    } }) : /* @__PURE__ */ React.createElement(
      "svg",
      {
        viewBox: "0 0 100 125",
        preserveAspectRatio: "xMidYMid slice",
        style: { width: "100%", height: "100%", display: "block" }
      },
      /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: `pbg-${person.id}`, cx: "50%", cy: "35%", r: "80%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#F7F9EF" }), /* @__PURE__ */ React.createElement("stop", { offset: "60%", stopColor: "#CFD0CF" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#9DA3A6" }))),
      /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "100", height: "125", fill: `url(#pbg-${person.id})` }),
      /* @__PURE__ */ React.createElement(
        "path",
        {
          d: "M 15 125 Q 15 82 32 74 Q 40 72 42 66 Q 34 62 34 47 Q 34 28 50 28 Q 66 28 66 47 Q 66 62 58 66 Q 60 72 68 74 Q 85 82 85 125 Z",
          fill: "#555D61"
        }
      ),
      /* @__PURE__ */ React.createElement(
        "path",
        {
          d: "M 15 125 L 15 110 Q 50 95 85 110 L 85 125 Z",
          fill: "#5D6970"
        }
      )
    ), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "repeating-linear-gradient(91deg, rgba(0,0,0,.08) 0 1px, transparent 1px 3px)"
    } }), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: 6,
      left: 8,
      fontFamily: fonts.mono,
      fontSize: 10,
      color: "#f0dcae",
      letterSpacing: "0.15em",
      textShadow: "0 1px 2px #000"
    } }, person.years)), /* @__PURE__ */ React.createElement("div", { style: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 1.05,
      color: theme.ink,
      marginTop: 2
    } }, person.title), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 8,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: "0.2em",
      color: meta.color,
      textTransform: "uppercase"
    } }, meta[lang]), person.stub && /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 6,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: "0.15em",
      color: theme.inkFade,
      textTransform: "uppercase"
    } }, lang === "ru" ? "\u0441\u043F\u0440\u0430\u0432\u043A\u0438 \u043F\u043E\u043A\u0430 \u043D\u0463\u0442\u044A" : "no dossier yet"))
  );
}
function PhotoFrame({ photo, lang }) {
  if (photo && photo.src) {
    return /* @__PURE__ */ React.createElement("img", { src: photo.src, alt: "", loading: "lazy", style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "top",
      display: "block",
      filter: "sepia(0.12) contrast(1.04)"
    } });
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 10,
    background: "linear-gradient(160deg, #435059 0%, #2a2f33 100%)",
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 1.5,
    letterSpacing: "0.16em",
    color: "#9DA3A6",
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0456\u0435 \u043D\u0435 \u0441\u043E\u0431\u0440\u0430\u043D\u043E" : "image not built");
}
function PhotoLightbox({ photo, lang, onClose, onPrev, onNext, hasPrev, hasNext }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    zIndex: 200,
    background: "rgba(2,1,0,.96)",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 200ms ease"
  }, onClick: onClose }, /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 80px 20px",
    minHeight: 0
  } }, /* @__PURE__ */ React.createElement("img", { src: photo.src, alt: "", style: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    filter: "sepia(0.08) contrast(1.04)",
    boxShadow: "0 30px 80px rgba(0,0,0,.9)"
  }, onClick: (e) => e.stopPropagation() })), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "14px 80px 32px",
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 1.5,
    color: theme.paperLit,
    textAlign: "center",
    maxWidth: 1100,
    margin: "0 auto"
  }, onClick: (e) => e.stopPropagation() }, photo[lang]), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    onClose();
  }, style: {
    position: "absolute",
    top: 24,
    right: 24,
    background: "transparent",
    border: `1px solid ${theme.paperDim}`,
    color: theme.paper,
    width: 56,
    height: 56,
    fontFamily: fonts.mono,
    fontSize: 22
  } }, "\xD7"), hasPrev && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    onPrev();
  }, style: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: `1px solid ${theme.paperDim}`,
    color: theme.paper,
    width: 56,
    height: 56,
    fontFamily: fonts.mono,
    fontSize: 22
  } }, "\u2039"), hasNext && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    onNext();
  }, style: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: `1px solid ${theme.paperDim}`,
    color: theme.paper,
    width: 56,
    height: 56,
    fontFamily: fonts.mono,
    fontSize: 22
  } }, "\u203A"));
}
function PersonDetail({ person, lang, onClose, lightboxIdx, setLightboxIdx, cardCfg, textBgCfg, textInkCfg, frameCfg }) {
  const card = cardCfg || CARD_VARIANTS.paper;
  const textBg = textBgCfg && textBgCfg.bg || "transparent";
  const textInk = textInkCfg && textInkCfg.ink || "#F7F9EF";
  const hasTextBg = textBg !== "transparent";
  const frame = frameCfg || FRAME_VARIANTS.graphiteSoft;
  const d = person[lang];
  const meta = sideMeta(person.side);
  const photos = person.photos || [];
  const [viewMode, setViewMode] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleViewMode") || "flow";
    } catch {
      return "flow";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleViewMode", viewMode);
    } catch {
    }
  }, [viewMode]);
  if (!person) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        // fixed — модалка приколочена к viewport iframe и не зависит
        // от scrollTop фонового списка персоналий ни при каких условиях.
        position: "fixed",
        inset: 0,
        background: frame.overlay,
        backdropFilter: "blur(10px) saturate(0.6)",
        WebkitBackdropFilter: "blur(10px) saturate(0.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 250ms ease",
        padding: 40,
        overscrollBehavior: "contain"
      },
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "person-detail-card",
        style: {
          width: 1280,
          maxWidth: "100%",
          height: "90vh",
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 28,
          position: "relative",
          padding: 22,
          background: frame.bg,
          border: `1px solid #D2B773`,
          // BRAND.brass
          boxShadow: "0 0 0 1px rgba(0,0,0,.6), 0 30px 90px rgba(0,0,0,.85), 0 0 60px rgba(210,183,115,.18)",
          animation: "popIn 400ms cubic-bezier(.2,.7,.3,1.1)"
        },
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        background: card.bg,
        border: `1px solid ${card.rule}`,
        padding: 18,
        boxShadow: "0 20px 50px rgba(0,0,0,.8)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: card.ink
      } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: "100%", aspectRatio: "1/1.3", overflow: "hidden", background: "#F7F9EF", flexShrink: 0 } }, person.portrait ? /* @__PURE__ */ React.createElement("img", { src: person.portrait, alt: "", style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top",
        display: "block",
        filter: "sepia(0.15) contrast(1.04)"
      } }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 100 130", preserveAspectRatio: "xMidYMid slice", style: { width: "100%", height: "100%" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: `mbg-${person.id}`, cx: "50%", cy: "35%", r: "80%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#F7F9EF" }), /* @__PURE__ */ React.createElement("stop", { offset: "60%", stopColor: "#CFD0CF" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#9DA3A6" }))), /* @__PURE__ */ React.createElement("rect", { width: "100", height: "130", fill: `url(#mbg-${person.id})` }), /* @__PURE__ */ React.createElement(
        "path",
        {
          d: "M 15 130 Q 15 85 32 77 Q 40 74 42 68 Q 34 64 34 48 Q 34 28 50 28 Q 66 28 66 48 Q 66 64 58 68 Q 60 74 68 77 Q 85 85 85 130 Z",
          fill: "#555D61"
        }
      ), /* @__PURE__ */ React.createElement(
        "path",
        {
          d: "M 15 130 L 15 113 Q 50 96 85 113 L 85 130 Z",
          fill: "#5D6970"
        }
      )), /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: 10,
        left: 10,
        fontFamily: fonts.mono,
        fontSize: 10,
        color: "#435059",
        letterSpacing: "0.2em",
        textShadow: "0 1px 2px rgba(247,249,239,0.6)"
      } }, lang === "ru" ? "[\u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044F \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442]" : "[photograph missing]")), /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "repeating-linear-gradient(91deg, rgba(0,0,0,.1) 0 1px, transparent 1px 3px)"
      } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(SideFlag, { side: person.side, lang }), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: fonts.mono, fontSize: 11, color: card.muted, letterSpacing: "0.15em" } }, person.years)), /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 14,
        fontFamily: fonts.mono,
        fontSize: 11,
        letterSpacing: "0.25em",
        color: card.muted,
        textTransform: "uppercase"
      } }, d.name), /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.display,
        fontSize: 38,
        lineHeight: 0.95,
        color: card.ink,
        marginTop: 2,
        letterSpacing: "-0.01em"
      } }, d.sur), /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 10,
        fontFamily: fonts.stamp,
        fontSize: 13,
        color: card.accent,
        letterSpacing: "0.06em"
      } }, "\xB7 ", d.tag), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), photos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 18,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.mono,
        fontSize: 9,
        letterSpacing: "0.32em",
        color: card.muted,
        textTransform: "uppercase"
      } }, lang === "ru" ? "\u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430" : "Layout"), /* @__PURE__ */ React.createElement("div", { style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        border: `1px solid ${card.rule}`
      } }, [
        { id: "flow", ru: "\u041F\u043E\u0434\u0440\u044F\u0434", en: "Flow" },
        { id: "gallery", ru: "\u0413\u0430\u043B\u0435\u0440\u0435\u044F", en: "Gallery" }
      ].map((m) => {
        const active = viewMode === m.id;
        return /* @__PURE__ */ React.createElement("button", { key: m.id, onClick: () => setViewMode(m.id), style: {
          padding: "10px 8px",
          fontFamily: fonts.mono,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: active ? card.ink : "transparent",
          color: active ? card.bg : card.ink,
          border: "none",
          cursor: "pointer"
        } }, m[lang]);
      }))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
        marginTop: 14,
        background: "transparent",
        border: `1px solid ${card.rule}`,
        color: card.ink,
        padding: "12px 22px",
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        flexShrink: 0
      } }, lang === "ru" ? "\u2190 \u043D\u0430\u0437\u0430\u0434" : "\u2190 back")),
      /* @__PURE__ */ React.createElement("div", { style: {
        display: "grid",
        gridTemplateRows: viewMode === "gallery" && photos.length > 0 ? "1fr auto" : "1fr",
        gap: 16,
        minHeight: 0,
        overflow: "hidden"
      } }, /* @__PURE__ */ React.createElement("div", { className: "brand-scroll", style: {
        color: textInk,
        background: textBg,
        paddingTop: hasTextBg ? 16 : 4,
        paddingRight: hasTextBg ? 18 : 18,
        paddingLeft: hasTextBg ? 18 : 0,
        paddingBottom: hasTextBg ? 18 : 0,
        border: hasTextBg ? `1px solid rgba(0,0,0,0.18)` : "none",
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: 0,
        overscrollBehavior: "contain"
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: "0.3em",
        color: meta.accent,
        textTransform: "uppercase"
      } }, d.role), /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 22,
        fontFamily: fonts.body,
        fontSize: 18,
        color: textInk,
        lineHeight: 1.6,
        maxWidth: 720,
        textWrap: "pretty"
      } }, (d.bio || "").split(/\n\s*\n/).map((p, i) => /* @__PURE__ */ React.createElement("p", { key: i, style: { margin: i === 0 ? "0 0 0.85em" : "0.85em 0" } }, richText(p, meta.accent)))), d.facts && d.facts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
        marginTop: 28,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "10px 28px",
        maxWidth: 720
      } }, d.facts.map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
        fontFamily: fonts.mono,
        fontSize: 13,
        color: textInk,
        lineHeight: 1.4,
        paddingLeft: 14,
        position: "relative",
        borderLeft: `2px solid ${meta.accent}`,
        paddingTop: 2,
        paddingBottom: 2
      } }, f))), viewMode === "flow" && photos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 36 } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.mono,
        fontSize: 11,
        letterSpacing: "0.3em",
        color: theme.ochre,
        textTransform: "uppercase",
        marginBottom: 14
      } }, lang === "ru" ? "\u0424\u043E\u0442\u043E\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u044B \u2014 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u0438\u044F" : "Photographs and objects \u2014 tap to enlarge"), /* @__PURE__ */ React.createElement("div", { style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 18,
        maxWidth: 820
      } }, photos.map((ph, i) => /* @__PURE__ */ React.createElement("figure", { key: i, style: { margin: 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: ph.src ? () => setLightboxIdx(i) : void 0, disabled: !ph.src, style: {
        // Без производной открывать нечего — лайтбокс дал бы пустой экран.
        cursor: ph.src ? "pointer" : "default",
        display: "block",
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer"
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        width: "100%",
        aspectRatio: "1/1",
        overflow: "hidden",
        background: "#1a0d05",
        border: `1px solid ${theme.inkSoft}`
      } }, /* @__PURE__ */ React.createElement(PhotoFrame, { photo: ph, lang }))), /* @__PURE__ */ React.createElement("figcaption", { style: {
        marginTop: 8,
        fontFamily: fonts.body,
        fontSize: 12,
        color: theme.paperDim,
        lineHeight: 1.4
      } }, ph[lang])))))), viewMode === "gallery" && photos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
        borderTop: `1px solid ${theme.inkFade}55`,
        paddingTop: 14,
        minHeight: 0
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: "0.3em",
        color: theme.ochre,
        textTransform: "uppercase",
        marginBottom: 10
      } }, lang === "ru" ? "\u0424\u043E\u0442\u043E\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u2014 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u0438\u044F" : "Photographs \u2014 tap to enlarge"), /* @__PURE__ */ React.createElement("div", { style: {
        display: "grid",
        // Фиксированный шаг под максимум 5 фото — если фото меньше,
        // они занимают левую часть, не растягиваются на всю ширину
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 12
      } }, photos.map((ph, i) => /* @__PURE__ */ React.createElement("figure", { key: i, style: { margin: 0, display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("button", { onClick: ph.src ? () => setLightboxIdx(i) : void 0, disabled: !ph.src, style: {
        // Без производной открывать нечего — лайтбокс дал бы пустой экран.
        cursor: ph.src ? "pointer" : "default",
        display: "block",
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer"
      }, title: ph[lang] }, /* @__PURE__ */ React.createElement("div", { style: {
        width: "100%",
        aspectRatio: "1/1",
        overflow: "hidden",
        background: "#1a0d05",
        border: `1px solid ${theme.inkSoft}`
      } }, /* @__PURE__ */ React.createElement(PhotoFrame, { photo: ph, lang }))), /* @__PURE__ */ React.createElement("figcaption", { style: {
        marginTop: 6,
        fontFamily: fonts.body,
        fontSize: 11,
        color: theme.paperDim,
        lineHeight: 1.35,
        // обрезаем до 3 строк — полная подпись доступна в лайтбоксе
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 3,
        overflow: "hidden"
      } }, ph[lang]))))))
    ),
    lightboxIdx !== null && photos[lightboxIdx] && /* @__PURE__ */ React.createElement(
      PhotoLightbox,
      {
        photo: photos[lightboxIdx],
        lang,
        onClose: () => setLightboxIdx(null),
        onPrev: () => setLightboxIdx((i) => Math.max(0, i - 1)),
        onNext: () => setLightboxIdx((i) => Math.min(photos.length - 1, i + 1)),
        hasPrev: lightboxIdx > 0,
        hasNext: lightboxIdx < photos.length - 1
      }
    )
  );
}
function PersonalitiesApp() {
  const [lang, setLang] = React.useState(() => {
    try {
      return localStorage.getItem("expo:lang") || "ru";
    } catch {
      return "ru";
    }
  });
  const [filter, setFilter] = React.useState("all");
  const [openId, setOpenId] = React.useState(null);
  const [lightboxIdx, setLightboxIdx] = React.useState(null);
  const [bgVariant, setBgVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleBg") || "iron";
    } catch {
      return "iron";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleBg", bgVariant);
    } catch {
    }
  }, [bgVariant]);
  const [headerVariant, setHeaderVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleHeader") || "black";
    } catch {
      return "black";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleHeader", headerVariant);
    } catch {
    }
  }, [headerVariant]);
  const headerCfg = HEADER_VARIANTS[headerVariant] || HEADER_VARIANTS.black;
  const headerInk = headerCfg.inkOnLight ? "#000" : "#F7F9EF";
  const headerInkDim = headerCfg.inkOnLight ? "rgba(0,0,0,0.55)" : "rgba(247,249,239,0.62)";
  const [cardVariant, setCardVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleCard") || "paper";
    } catch {
      return "paper";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleCard", cardVariant);
    } catch {
    }
  }, [cardVariant]);
  const cardCfg = CARD_VARIANTS[cardVariant] || CARD_VARIANTS.paper;
  const [textBgVariant, setTextBgVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleTextBg") || "transparent";
    } catch {
      return "transparent";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleTextBg", textBgVariant);
    } catch {
    }
  }, [textBgVariant]);
  const textBgCfg = TEXT_BG_VARIANTS[textBgVariant] || TEXT_BG_VARIANTS.transparent;
  const [textInkVariant, setTextInkVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleTextInk") || "paperWhite";
    } catch {
      return "paperWhite";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleTextInk", textInkVariant);
    } catch {
    }
  }, [textInkVariant]);
  const textInkCfg = TEXT_INK_VARIANTS[textInkVariant] || TEXT_INK_VARIANTS.paperWhite;
  const [frameVariant, setFrameVariant] = React.useState(() => {
    try {
      return localStorage.getItem("expo:peopleFrame") || "graphiteSoft";
    } catch {
      return "graphiteSoft";
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:peopleFrame", frameVariant);
    } catch {
    }
  }, [frameVariant]);
  const frameCfg = FRAME_VARIANTS[frameVariant] || FRAME_VARIANTS.graphiteSoft;
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
    const onMsg = (e) => {
      if (e.data === "mtk29:section-opened") {
        setOpenId(null);
        setLightboxIdx(null);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  React.useEffect(() => {
    if (!openId) setLightboxIdx(null);
  }, [openId]);
  const [people, setPeople] = React.useState([]);
  const [indexError, setIndexError] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    window.MTK_PERSONS.loadIndex().then((list) => {
      if (!alive) return;
      setPeople(list.map((p, i) => ({
        ...p,
        _rot: [-2.5, 1.8, -1, 2.2, -1.5, 0.9, -2.1, 1.4, -0.8, 2.5, -1.9, 1.1, -2.2, 0.7, -1.3, 2][i % 16]
      })));
    }).catch((err) => {
      if (alive) setIndexError(err);
    });
    return () => {
      alive = false;
    };
  }, []);
  const [opened, setOpened] = React.useState(null);
  const [openError, setOpenError] = React.useState(null);
  React.useEffect(() => {
    if (!openId) {
      setOpened(null);
      setOpenError(null);
      return;
    }
    let alive = true;
    setOpenError(null);
    window.MTK_PERSONS.loadPerson(openId).then((p) => {
      if (alive) setOpened({ ...p, _rot: 0 });
    }).catch((err) => {
      if (alive) {
        setOpened(null);
        setOpenError(err);
      }
    });
    return () => {
      alive = false;
    };
  }, [openId]);
  const shown = filter === "all" ? people : filter === "none" ? people.filter((p) => !p.side) : people.filter((p) => p.side === filter);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else if (openId) setOpenId(null);
      } else if (lightboxIdx !== null) {
        const photos = opened && opened.photos || [];
        if (e.key === "ArrowLeft" && lightboxIdx > 0) setLightboxIdx((i) => i - 1);
        else if (e.key === "ArrowRight" && lightboxIdx < photos.length - 1) setLightboxIdx((i) => i + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, openId, opened]);
  return /* @__PURE__ */ React.createElement("div", { className: "brand-scroll", style: {
    position: "absolute",
    inset: 0,
    ...bgForVariant(bgVariant),
    overflow: opened ? "hidden" : "auto",
    // тач-стол: scroll-chain не должен уносить открытую карточку
    overscrollBehavior: "contain",
    color: theme.paper,
    paddingBottom: 80
  } }, /* @__PURE__ */ React.createElement("style", null, `
        @keyframes fadeUp { from { opacity: 0; transform: rotate(0deg) translateY(22px); } }
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.92); } }

        /* \u0432\u0438\u0434\u0438\u043C\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B\u0431\u0430\u0440 \u043D\u0430 \u0442\u0430\u0447-\u0441\u0442\u043E\u043B\u0435 \u2014 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u043E\u043D\u0438\u043C\u0430\u0442\u044C, \u0447\u0442\u043E \u0431\u043B\u043E\u043A \u0441\u043A\u0440\u043E\u043B\u043B\u0438\u0442\u0441\u044F */
        .brand-scroll {
          scrollbar-width: auto;
          scrollbar-color: ${theme.brass} rgba(0,0,0,0.45);
        }
        .brand-scroll::-webkit-scrollbar { width: 14px; height: 14px; }
        .brand-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.45);
          border-left: 1px solid ${theme.inkFade};
        }
        .brand-scroll::-webkit-scrollbar-thumb {
          background: ${theme.brass};
          border: 3px solid rgba(0,0,0,0.45);
          border-radius: 8px;
          min-height: 60px;
        }
        .brand-scroll::-webkit-scrollbar-thumb:active { background: ${theme.ochre}; }
      `), /* @__PURE__ */ React.createElement("div", { style: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: headerCfg.bg,
    backdropFilter: "blur(6px) saturate(0.9)",
    WebkitBackdropFilter: "blur(6px) saturate(0.9)",
    boxShadow: "0 2px 0 rgba(0,0,0,0.4), 0 14px 24px rgba(0,0,0,0.45)",
    borderBottom: `1px solid ${headerCfg.border}`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "24px 40px 18px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: "0.35em",
    color: "#D2B773",
    textTransform: "uppercase"
    // BRAND.brass — RAL 1002
  } }, lang === "ru" ? "\u041C\u0443\u0437\u0435\u0439 \u0412.\u0418. \u041B\u0435\u043D\u0438\u043D\u0430 \xB7 \u0413\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u043A\u0430\u044F \u0432\u043E\u0439\u043D\u0430" : "Lenin Museum \xB7 Russian Civil War"), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 1,
    color: headerInk,
    marginTop: 6,
    letterSpacing: "-0.01em"
  } }, lang === "ru" ? "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0456\u0438. 1917\u20141922" : "People. 1917\u20141922")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "index.html",
      style: {
        // «к экспозиции» — основная навигация, ≥120 px (§1).
        minHeight: "var(--touch-hit, 120px)",
        padding: "0 24px",
        display: "inline-flex",
        alignItems: "center",
        fontFamily: fonts.mono,
        fontSize: 11,
        letterSpacing: "0.25em",
        color: headerInkDim,
        textDecoration: "none",
        border: `1px solid ${headerInkDim}`,
        textTransform: "uppercase"
      },
      onClick: (e) => {
        if (window.parent !== window) {
          e.preventDefault();
          window.parent.postMessage("mtk29:close-section", "*");
        }
      }
    },
    "\u2190 ",
    lang === "ru" ? "\u043A\u044A \u044D\u043A\u0441\u043F\u043E\u0437\u0438\u0446\u0456\u0438" : "to the exhibit"
  ), /* @__PURE__ */ React.createElement("button", { onClick: () => setLang(lang === "ru" ? "en" : "ru"), style: {
    // Переключатель языка — основная навигация, ≥120 px (§1).
    minWidth: 120,
    minHeight: "var(--touch-hit, 120px)",
    padding: "0 24px",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: "0.25em",
    color: headerInk,
    background: "transparent",
    border: `1px solid #D2B773`,
    // BRAND.brass border
    textTransform: "uppercase"
  } }, lang === "ru" ? "EN" : "RU"))), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "0 40px 18px",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  } }, [
    {
      id: "all",
      ru: "\u0412\u0441\u0463",
      en: "All",
      count: people.length,
      brand: "#D2B773"
      /* BRAND.brass */
    },
    {
      id: "red",
      ru: "\u041A\u0440\u0430\u0441\u043D\u044B\u0435",
      en: "Reds",
      count: people.filter((p) => p.side === "red").length,
      brand: "#A02128"
      /* BRAND.signalRed */
    },
    {
      id: "white",
      ru: "\u0411\u0463\u043B\u044B\u0435",
      en: "Whites",
      count: people.filter((p) => p.side === "white").length,
      brand: "#CFD0CF"
      /* BRAND.telegrey4 */
    },
    {
      id: "green",
      ru: "\u0422\u0440\u0435\u0442\u044C\u044F \u0441\u0438\u043B\u0430",
      en: "Third force",
      count: people.filter((p) => p.side === "green").length,
      brand: "#5D6970"
      /* BRAND.slateBlue */
    },
    {
      id: "none",
      ru: "\u0412\u043D\u0463 \u043B\u0430\u0433\u0435\u0440\u0435\u0439",
      en: "Unaligned",
      count: people.filter((p) => !p.side).length,
      brand: "#9DA3A6"
      /* BRAND.slateWindow */
    }
  ].filter((f) => f.count > 0).map((f) => {
    const active = filter === f.id;
    const lightBg = f.brand === "#D2B773" || f.brand === "#CFD0CF" || f.brand === "#9DA3A6";
    const activeText = lightBg ? "#000" : "#F7F9EF";
    return /* @__PURE__ */ React.createElement("button", { key: f.id, onClick: () => setFilter(f.id), style: {
      // Фильтр лагеря — управляющий элемент раздела, ≥64 px (§1).
      minHeight: 64,
      padding: "0 20px",
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.2em",
      background: active ? f.brand : "transparent",
      color: active ? activeText : headerInkDim,
      border: `1px solid ${active ? f.brand : headerInkDim}`,
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 8
    } }, f[lang], /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, opacity: 0.7 } }, "\xB7 ", f.count));
  }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: "0.2em",
    color: headerInkDim,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u2014 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0441\u043F\u0440\u0430\u0432\u043A\u0430" : "Tap a card \u2014 opens a dossier"))), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "28px 40px 120px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "28px 22px",
    maxWidth: 1800,
    margin: "0 auto"
  } }, shown.map((p, i) => /* @__PURE__ */ React.createElement(
    PersonCard,
    {
      key: p.id,
      person: p,
      lang,
      delay: Math.min(i, 12) * 45,
      onOpen: p.stub ? null : () => setOpenId(p.id)
    }
  ))), indexError && /* @__PURE__ */ React.createElement("div", { style: {
    padding: "40px",
    fontFamily: fonts.mono,
    fontSize: 14,
    color: theme.brass,
    letterSpacing: "0.1em"
  } }, lang === "ru" ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A\u044A \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0456\u0439: " : "Could not load the list of people: ", String(indexError.message || indexError)), openId && !opened && !openError && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(10,6,3,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: "0.3em",
    color: theme.brass,
    textTransform: "uppercase"
  }, onClick: () => setOpenId(null) }, lang === "ru" ? "\u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C\u044A \u0441\u043F\u0440\u0430\u0432\u043A\u0443\u2026" : "loading dossier\u2026"), openId && openError && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(10,6,3,0.82)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: "0.2em",
    color: theme.brass,
    textAlign: "center",
    padding: 40
  }, onClick: () => setOpenId(null) }, /* @__PURE__ */ React.createElement("div", null, lang === "ru" ? "\u0421\u043F\u0440\u0430\u0432\u043A\u0430 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u043B\u0430\u0441\u044C" : "Dossier failed to open"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.7 } }, String(openError.message || openError)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.7 } }, lang === "ru" ? "\u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u043A\u0440\u044B\u0442\u044C" : "tap to close")), opened && /* @__PURE__ */ React.createElement(
    PersonDetail,
    {
      person: opened,
      lang,
      onClose: () => setOpenId(null),
      lightboxIdx,
      setLightboxIdx,
      cardCfg,
      textBgCfg,
      textInkCfg,
      frameCfg
    }
  ), /* @__PURE__ */ React.createElement(
    SettingsPanel,
    {
      lang,
      headerVariant,
      setHeaderVariant,
      bgVariant,
      setBgVariant,
      cardVariant,
      setCardVariant,
      textBgVariant,
      setTextBgVariant,
      textInkVariant,
      setTextInkVariant,
      frameVariant,
      setFrameVariant
    }
  ));
}
window.PersonalitiesApp = PersonalitiesApp;
