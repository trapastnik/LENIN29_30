// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/chronicle-ui.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
if (!window.MTK_TOKENS) {
  throw new Error("chronicle-ui.jsx: \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D brand-tokens.js (\u0441\u043C. public/expo/chronicle.html)");
}
const chTheme = window.MTK_PEOPLE_THEME;
const chFonts = window.MTK_FONTS;
const chBrand = window.BRAND_THEME;
const TRACKS = {
  pol: { ru: "\u041F\u043E\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0456\u044F", en: "Political", color: chBrand.brass },
  mil: { ru: "\u0412\u043E\u0435\u043D\u043D\u044B\u044F", en: "Military", color: chBrand.signalRed },
  both: { ru: "\u041E\u0431\u0449\u0456\u044F", en: "Both", color: chBrand.slateWindow }
};
const MONTHS_RU = [
  "\u044F\u043D\u0432\u0430\u0440\u044C",
  "\u0444\u0435\u0432\u0440\u0430\u043B\u044C",
  "\u043C\u0430\u0440\u0442",
  "\u0430\u043F\u0440\u0435\u043B\u044C",
  "\u043C\u0430\u0439",
  "\u0438\u044E\u043D\u044C",
  "\u0438\u044E\u043B\u044C",
  "\u0430\u0432\u0433\u0443\u0441\u0442",
  "\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044C",
  "\u043E\u043A\u0442\u044F\u0431\u0440\u044C",
  "\u043D\u043E\u044F\u0431\u0440\u044C",
  "\u0434\u0435\u043A\u0430\u0431\u0440\u044C"
];
function monthKey(item) {
  const from = item.date && item.date.from;
  if (!from) return null;
  return String(from).slice(0, 7);
}
function monthLabel(key, lang) {
  if (!key) return "";
  const m = Number(key.slice(5, 7));
  if (!m || m < 1 || m > 12) return key;
  const ru = MONTHS_RU[m - 1];
  return lang === "ru" ? ru.charAt(0).toUpperCase() + ru.slice(1) : new Date(Date.UTC(2e3, m - 1, 1)).toLocaleString("en", { month: "long" });
}
function EventRow({ item, lang, onOpenCard }) {
  const track = TRACKS[item.track] || TRACKS.both;
  const polText = lang === "ru" ? item.pol_ru : item.pol_en || item.pol_ru;
  const milText = lang === "ru" ? item.mil_ru : item.mil_en || item.mil_ru;
  const wide = item.track === "both";
  const isMonth = item.kind === "month-marker";
  const cell = (text, kind, withCard) => {
    if (!text) return /* @__PURE__ */ React.createElement("div", null);
    const c = TRACKS[kind].color;
    return /* @__PURE__ */ React.createElement("div", { style: {
      background: chTheme.paper,
      borderLeft: `4px solid ${c}`,
      padding: "18px 22px",
      boxShadow: "0 8px 20px rgba(0,0,0,.45)"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontFamily: chFonts.mono,
      fontSize: 11,
      letterSpacing: "0.24em",
      color: c,
      textTransform: "uppercase",
      marginBottom: 8
    } }, lang === "ru" ? TRACKS[kind].ru : TRACKS[kind].en, isMonth && ` \xB7 ${lang === "ru" ? "\u0432\u0435\u0441\u044C \u043C\u0463\u0441\u044F\u0446\u044A" : "whole month"}`), /* @__PURE__ */ React.createElement("div", { style: {
      fontFamily: chFonts.body,
      fontSize: 16,
      lineHeight: 1.5,
      color: chTheme.ink,
      textWrap: "pretty"
    } }, richText(text, c)), withCard && item.card && /* @__PURE__ */ React.createElement("button", { onClick: () => onOpenCard(item.card), style: {
      marginTop: 16,
      minHeight: 56,
      padding: "0 26px",
      fontFamily: chFonts.mono,
      fontSize: 12,
      letterSpacing: "0.24em",
      color: chTheme.ink,
      background: "transparent",
      border: `1px solid ${c}`,
      borderRadius: 28,
      textTransform: "uppercase"
    } }, lang === "ru" ? "\u0421\u043F\u0440\u0430\u0432\u043A\u0430 \u2192" : "Dossier \u2192"));
  };
  const axis = /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingTop: 14
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.mono,
    fontSize: 12,
    letterSpacing: "0.14em",
    color: chTheme.paperDim,
    textAlign: "center",
    lineHeight: 1.35,
    background: chTheme.bgDeep,
    padding: "2px 8px"
  } }, item.date && item.date.display_ru), /* @__PURE__ */ React.createElement("div", { style: {
    width: 13,
    height: 13,
    borderRadius: 7,
    background: track.color,
    boxShadow: `0 0 0 5px ${chTheme.bgDeep}`
  } }));
  if (wide) {
    return /* @__PURE__ */ React.createElement("div", { style: { contentVisibility: "auto", containIntrinsicSize: "0 180px" } }, axis, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 10 } }, cell(polText, "pol", true), cell(milText, "mil", false)));
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: "1fr 190px 1fr",
    gap: 18,
    alignItems: "start",
    // Событий в году до 139: браузер может не размечать то, что за экраном.
    contentVisibility: "auto",
    containIntrinsicSize: "0 150px"
  } }, /* @__PURE__ */ React.createElement("div", null, item.track === "pol" ? cell(polText, "pol", true) : null), axis, /* @__PURE__ */ React.createElement("div", null, item.track === "mil" ? cell(milText, "mil", true) : null));
}
function EventCard({ card, lang, onClose }) {
  const photos = React.useMemo(() => window.MTK_CHRONICLE.photos(card), [card]);
  const summary = (lang === "ru" ? card.summary_ru : card.summary_en || card.summary_ru) || "";
  const dates = card.dates && card.dates.display_ru || card.date || "";
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(8,5,2,.86)",
    backdropFilter: "blur(10px) saturate(0.6)",
    WebkitBackdropFilter: "blur(10px) saturate(0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    overscrollBehavior: "contain"
  }, onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "brand-scroll", style: {
    width: 1180,
    maxWidth: "100%",
    maxHeight: "92vh",
    overflowY: "auto",
    background: chTheme.paper,
    color: chTheme.ink,
    border: `1px solid ${chBrand.brass}`,
    padding: "38px 46px 46px",
    boxShadow: "0 30px 90px rgba(0,0,0,.85)",
    overscrollBehavior: "contain"
  }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.mono,
    fontSize: 12,
    letterSpacing: "0.3em",
    color: chTheme.inkFade,
    textTransform: "uppercase"
  } }, dates), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: chFonts.display,
    fontSize: 42,
    lineHeight: 1.06,
    color: chTheme.ink,
    marginTop: 12
  } }, lang === "ru" ? card.title_ru : card.title_en || card.title_ru), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 26,
    fontFamily: chFonts.body,
    fontSize: 17,
    lineHeight: 1.62,
    color: chTheme.inkSoft,
    maxWidth: 860,
    textWrap: "pretty"
  } }, summary.split(/\n\s*\n/).map((p, i) => /* @__PURE__ */ React.createElement("p", { key: i, style: { margin: i === 0 ? "0 0 0.9em" : "0.9em 0" } }, richText(p, chBrand.signalRed)))), photos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 34,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 22
  } }, photos.map((ph, i) => /* @__PURE__ */ React.createElement("figure", { key: i, style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    aspectRatio: "4/3",
    overflow: "hidden",
    background: chTheme.bgDeep,
    border: `1px solid ${chTheme.inkFade}`
  } }, /* @__PURE__ */ React.createElement(ChroniclePhoto, { photo: ph, lang })), (ph.ru || ph.en) && /* @__PURE__ */ React.createElement("figcaption", { style: {
    marginTop: 8,
    fontFamily: chFonts.body,
    fontSize: 12,
    lineHeight: 1.4,
    color: chTheme.inkFade
  } }, lang === "ru" ? ph.ru : ph.en || ph.ru, ph.inv && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 3, opacity: 0.8 } }, ph.inv))))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    marginTop: 36,
    minHeight: 60,
    padding: "0 32px",
    fontFamily: chFonts.mono,
    fontSize: 13,
    letterSpacing: "0.26em",
    color: chTheme.paper,
    background: chTheme.ink,
    border: "none",
    borderRadius: 30,
    textTransform: "uppercase"
  } }, lang === "ru" ? "\u2190 \u041D\u0430\u0437\u0430\u0434\u044A \u043A\u044A \u043B\u0435\u043D\u0442\u0463" : "\u2190 Back to the timeline")));
}
function ChroniclePhoto({ photo, lang }) {
  const [failed, setFailed] = React.useState(false);
  if (photo.src && !failed) {
    return /* @__PURE__ */ React.createElement("img", { src: photo.src, alt: "", loading: "lazy", onError: () => setFailed(true), style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      filter: "sepia(0.10) contrast(1.03)"
    } });
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: chFonts.mono,
    fontSize: 10,
    letterSpacing: "0.18em",
    color: chBrand.slateWindow,
    textTransform: "uppercase",
    textAlign: "center",
    padding: 12
  } }, lang === "ru" ? "\u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0456\u0435 \u043D\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E" : "image not delivered");
}
window.EventRow = EventRow;
window.EventCard = EventCard;
window.chronicleMonthKey = monthKey;
window.chronicleMonthLabel = monthLabel;
window.CHRONICLE_TRACKS = TRACKS;
window.chTheme = chTheme;
window.chFonts = chFonts;
window.chBrand = chBrand;
