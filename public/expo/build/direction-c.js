// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/direction-c.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const { theme: tc, fonts: fc, paperBg: paperC } = window;
function Strip({ items, y, speed, time, height, renderItem, cardStep = 420 }) {
  const n = items.length;
  const laneW = Math.max(1, n) * cardStep;
  const offset = (time * speed % laneW + laneW) % laneW;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 0,
    right: 0,
    top: y,
    height,
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    width: laneW * 3,
    height,
    transform: `translateX(-${offset}px)`,
    willChange: "transform"
  } }, [...items, ...items, ...items].map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    position: "absolute",
    top: 0,
    left: i * cardStep,
    width: cardStep,
    height
  } }, renderItem(item, i)))));
}
function NewspaperClipping({ headline, body, date, width = 360, rotate = -1 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    width,
    padding: "16px 18px 20px",
    background: "#ece0c0",
    border: "1px solid #8a6a30",
    boxShadow: "0 8px 20px rgba(0,0,0,.5)",
    fontFamily: fc.display,
    color: "#2a1810",
    transform: `rotate(${rotate}deg)`,
    position: "relative"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 10,
    fontFamily: fc.mono,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#7a5020",
    borderBottom: "1px solid #7a5020",
    paddingBottom: 4,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("span", null, "\u0418\u0417\u0412\u0462\u0421\u0422\u0406\u042F"), /* @__PURE__ */ React.createElement("span", null, date)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, lineHeight: 1.15, fontStyle: "italic" } }, headline), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: fc.body,
    lineHeight: 1.4,
    color: "#3a2010",
    columnCount: 2,
    columnGap: 10,
    columnRule: "1px solid #a88050"
  } }, body));
}
function TelegramSlip({ text, date, width = 320, rotate = 2 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    width,
    padding: "14px 16px",
    background: "#f0dca8",
    border: "1px solid #8a6a30",
    boxShadow: "0 6px 16px rgba(0,0,0,.5)",
    fontFamily: fc.stamp,
    color: "#2a1010",
    transform: `rotate(${rotate}deg)`,
    position: "relative"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    background: `repeating-linear-gradient(90deg, transparent 0 6px, rgba(100,70,20,.6) 6px 7px, transparent 7px 13px)`
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 9,
    fontFamily: fc.mono,
    letterSpacing: "0.2em",
    color: "#6a4a20",
    marginBottom: 6
  } }, "\u0422\u0415\u041B\u0415\u0413\u0420\u0410\u041C\u041C\u0410 \xB7 ", date), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, textTransform: "uppercase", lineHeight: 1.4, letterSpacing: "0.04em" } }, text), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 8,
    fontFamily: fc.mono,
    color: "#8a5030",
    transform: "rotate(-4deg)",
    border: "1px solid #8a3010",
    padding: "2px 6px"
  } }, "\u041F\u0420\u0418\u041D\u042F\u0422\u041E"));
}
function LetterCard({ body, from, width = 380, rotate = -3 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    width,
    padding: "22px 26px",
    background: "#f0e6cc",
    border: "1px solid #8a6a30",
    boxShadow: "0 10px 24px rgba(0,0,0,.55)",
    fontFamily: fc.display,
    color: "#2a1810",
    transform: `rotate(${rotate}deg)`,
    fontStyle: "italic"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.55 } }, "\xAB", body, "\xBB"), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: fc.mono,
    letterSpacing: "0.15em",
    color: "#6a4a20",
    textTransform: "uppercase"
  } }, "\u2014 ", from));
}
const EXTRA_RU = {
  1918: {
    news: [
      { headline: "\u0414\u0435\u043A\u0440\u0435\u0442 \u043E \u043D\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438", body: "\u0412\u0441\u0435 \u0431\u0430\u043D\u043A\u0438 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u044B \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0441\u0442\u044C\u044E \u0420\u0421\u0424\u0421\u0420. \u0427\u0430\u0441\u0442\u043D\u044B\u0435 \u0432\u043A\u043B\u0430\u0434\u044B \u0441\u0432\u044B\u0448\u0435 10 000 \u0440\u0443\u0431. \u043F\u043E\u0434\u043B\u0435\u0436\u0430\u0442 \u043A\u043E\u043D\u0444\u0438\u0441\u043A\u0430\u0446\u0438\u0438.", date: "\u042F\u043D\u0432\u0430\u0440\u044C" },
      { headline: "\u0413\u043E\u043B\u043E\u0434 \u0432 \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u0435", body: "\u0425\u043B\u0435\u0431\u043D\u044B\u0439 \u043F\u0430\u0451\u043A \u0441\u043E\u043A\u0440\u0430\u0449\u0451\u043D \u0434\u043E \xBC \u0444\u0443\u043D\u0442\u0430 \u0432 \u0434\u0435\u043D\u044C. \u041F\u043E \u0433\u0443\u0431\u0435\u0440\u043D\u0438\u044F\u043C \u2014 \u043F\u0440\u043E\u0434\u043E\u0442\u0440\u044F\u0434\u044B.", date: "\u0424\u0435\u0432\u0440\u0430\u043B\u044C" },
      { headline: "\u0410\u0440\u0445\u0430\u043D\u0433\u0435\u043B\u044C\u0441\u043A\u044A \u0437\u0430\u043D\u044F\u0442\u044A", body: "\u0421\u043E\u044E\u0437\u043D\u044B\u0435 \u0434\u0435\u0441\u0430\u043D\u0442\u044B \u0432\u0445\u043E\u0434\u044F\u0442\u044A \u0432\u044A \u0410\u0440\u0445\u0430\u043D\u0433\u0435\u043B\u044C\u0441\u043A\u044A. \u0418\u043D\u0442\u0435\u0440\u0432\u0435\u043D\u0446\u0456\u044F \u0410\u043D\u0442\u0430\u043D\u0442\u044B \u043D\u0430\u0447\u0430\u0442\u0430.", date: "\u0410\u0432\u0433\u0443\u0441\u0442\u044A" },
      { headline: "\u0412\u044A \u041A\u0430\u0437\u0430\u043D\u0438 \u0437\u043E\u043B\u043E\u0442\u043E\u0439 \u0437\u0430\u043F\u0430\u0441\u044A", body: "\u041D\u0430\u0440\u043E\u0434\u043D\u0430\u044F \u0430\u0440\u043C\u0456\u044F \u041A\u043E\u043C\u0443\u0447\u0430 \u0437\u0430\u0445\u0432\u0430\u0442\u0438\u043B\u0430 \u0447\u0430\u0441\u0442\u044C \u0437\u043E\u043B\u043E\u0442\u043E\u0433\u043E \u0437\u0430\u043F\u0430\u0441\u0430 \u0418\u043C\u043F\u0435\u0440\u0456\u0438 \u2014 650 \u043C\u0438\u043B\u043B. \u0440\u0443\u0431.", date: "\u0410\u0432\u0433\u0443\u0441\u0442\u044A" }
    ],
    tel: [
      { text: "\u0422\u0420\u0415\u0411\u0423\u042E \xB7 \u0412\u0421\u0415 \xB7 \u0421\u0418\u041B\u042B \xB7 \u041D\u0410 \xB7 \u0412\u041E\u0421\u0422\u041E\u041A \xB7 \u0424\u0420\u0423\u041D\u0417\u0415", date: "05.VII" },
      { text: "\u0427\u0415\u0425\u0418 \xB7 \u0417\u0410\u041D\u042F\u041B\u0418 \xB7 \u0421\u0418\u041C\u0411\u0418\u0420\u0421\u041A \xB7 \u0421\u0420\u041E\u0427\u041D\u041E \xB7 \u041F\u041E\u0414\u041C\u041E\u0413\u0410", date: "22.VII" },
      { text: "\u041C\u0418\u0420\u0411\u0410\u0425 \xB7 \u0423\u0411\u0418\u0422 \xB7 \u0411\u041B\u042E\u041C\u041A\u0418\u041D \xB7 \u0421\u041A\u0420\u042B\u041B\u0421\u042F", date: "06.VII" },
      { text: "\u0412\u041B\u0410\u0414\u0418\u0412\u041E\u0421\u0422\u041E\u041A \xB7 \u042F\u041F\u041E\u041D\u0421\u041A\u0418\u0419 \xB7 \u0414\u0415\u0421\u0410\u041D\u0422 \xB7 \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0410\u042E", date: "05.IV" },
      { text: "\u041F\u0420\u0418\u041A\u0410\u0417 \xB7 \u2116 227 \xB7 \u041D\u0418 \xB7 \u0428\u0410\u0413\u0423 \xB7 \u041D\u0410\u0417\u0410\u0414 \xB7 \u0422\u0420\u041E\u0426\u041A\u0418\u0419", date: "10.IX" }
    ],
    let: [
      { body: "\u041D\u0438\u043A\u043E\u043B\u0430\u0439, \u0433\u043E\u043B\u043E\u0434\u044A \u0441\u0442\u0440\u0430\u0448\u043D\u044B\u0439. \u0425\u043B\u0463\u0431\u0430 \u043D\u0463\u0442\u044A, \u043A\u0430\u0440\u0442\u043E\u0448\u043A\u0438 \u043D\u0463\u0442\u044A, \u0434\u0463\u0442\u0438 \u043F\u0443\u0445\u043D\u0443\u0442\u044A. \u041F\u0438\u0448\u0443 \u0432\u044A \u0442\u0438\u0448\u0438, \u043F\u043E\u0434\u044A \u043B\u0430\u043C\u043F\u043E\u0439.", from: "\u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u044A, \u0444\u0435\u0432\u0440\u0430\u043B\u044C" },
      { body: "\u041E\u0442\u0446\u0430 \u0443\u0432\u0435\u043B\u0438 \u043D\u043E\u0447\u044C\u044E. \u041D\u0435 \u0441\u043A\u0430\u0437\u0430\u043B\u0438 \u0437\u0430 \u0447\u0442\u043E. \u0413\u043E\u0432\u043E\u0440\u044F\u0442\u044A \u2014 \u043A\u0430\u043A\u044A \u0431\u044B\u0432\u0448\u0456\u0439 \u043E\u0444\u0438\u0446\u0435\u0440\u044A. \u0425\u0440\u0430\u043D\u0438 \u0411\u043E\u0433\u044A \u0432\u0441\u0463\u0445\u044A \u043D\u0430\u0441\u044A.", from: "\u041C\u043E\u0441\u043A\u0432\u0430, \u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044C" }
    ]
  },
  1919: {
    news: [
      { headline: "\u041A\u043E\u043B\u0447\u0430\u043A\u044A \u0432\u044A \u041E\u043C\u0441\u043A\u0463", body: "\u0412\u0435\u0440\u0445\u043E\u0432\u043D\u044B\u0439 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u0442\u044A \u043F\u0430\u0440\u0430\u0434\u044A \u0421\u0438\u0431\u0438\u0440\u0441\u043A\u043E\u0439 \u0430\u0440\u043C\u0456\u0438. \u0410\u043D\u0433\u043B\u0456\u0439\u0441\u043A\u0456\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u044B.", date: "\u041C\u0430\u0440\u0442\u044A" },
      { headline: "\u041E\u0440\u0451\u043B\u044A \u0441\u0434\u0430\u043D\u044A", body: "\u0414\u043E\u0431\u0440\u043E\u0432\u043E\u043B\u044C\u0447\u0435\u0441\u043A\u0430\u044F \u0430\u0440\u043C\u0456\u044F \u0432\u044A 380 \u0432\u0435\u0440\u0441\u0442\u0430\u0445\u044A \u043E\u0442\u044A \u041C\u043E\u0441\u043A\u0432\u044B. \u0421\u043E\u0432\u043D\u0430\u0440\u043A\u043E\u043C\u044A \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044A \u0430\u0440\u0445\u0438\u0432\u044B.", date: "\u041E\u043A\u0442\u044F\u0431\u0440\u044C" },
      { headline: "\u041A\u043E\u043D\u043D\u044B\u0439 \u043A\u043E\u0440\u043F\u0443\u0441 \u0411\u0443\u0434\u0451\u043D\u043D\u043E\u0433\u043E", body: "\u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u041F\u0435\u0440\u0432\u0430\u044F \u043A\u043E\u043D\u043D\u0430\u044F. 16 000 \u0441\u0430\u0431\u0435\u043B\u044C. \u041F\u0435\u0440\u0435\u043B\u043E\u043C \u043D\u0430 \u042E\u0436\u043D\u043E\u043C \u0444\u0440\u043E\u043D\u0442\u0435.", date: "\u041D\u043E\u044F\u0431\u0440\u044C" },
      { headline: "\u042E\u0434\u0435\u043D\u0438\u0447 \u0443 \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u0430", body: "\u0411\u0435\u043B\u044B\u0435 \u0432 \u0413\u0430\u0442\u0447\u0438\u043D\u0435. \u0422\u0440\u043E\u0446\u043A\u0438\u0439 \u043B\u0438\u0447\u043D\u043E \u043D\u0430 \u0431\u0440\u043E\u043D\u0435\u0432\u0438\u043A\u0435 \u043F\u043E\u0434 \u041F\u0443\u043B\u043A\u043E\u0432\u043E\u043C.", date: "\u041E\u043A\u0442\u044F\u0431\u0440\u044C" }
    ],
    tel: [
      { text: "\u0421\u0414\u0410\u041B\u0418 \xB7 \u0423\u0424\u0423 \xB7 \u041E\u0422\u0421\u0422\u0423\u041F\u0410\u0415\u041C \xB7 \u0417\u0410 \xB7 \u0412\u041E\u041B\u0413\u0423", date: "13.III" },
      { text: "\u0414\u0415\u041D\u0418\u041A\u0418\u041D \xB7 \u0412\u0417\u042F\u041B \xB7 \u0426\u0410\u0420\u0418\u0426\u042B\u041D \xB7 \u041F\u0420\u041E\u0421\u0418\u041C \xB7 \u0420\u0415\u0417\u0415\u0420\u0412", date: "30.VI" },
      { text: "\u041B\u0410\u0422\u042B\u0428\u0421\u041A\u0410\u042F \xB7 \u0414\u0418\u0412\u0418\u0417\u0418\u042F \xB7 \u0412 \xB7 \u042D\u0428\u0415\u041B\u041E\u041D\u0410\u0425 \xB7 \u041D\u0410 \xB7 \u041E\u0420\u0401\u041B", date: "14.X" },
      { text: "\u041F\u0423\u041B\u041A\u041E\u0412\u041E \xB7 \u041E\u0422\u0411\u0418\u041B\u0418 \xB7 \u042E\u0414\u0415\u041D\u0418\u0427 \xB7 \u041E\u0422\u0421\u0422\u0423\u041F\u0410\u0415\u0422 \xB7 \u041A \xB7 \u041D\u0410\u0420\u0412\u0415", date: "22.X" },
      { text: "\u041E\u041C\u0421\u041A \xB7 \u0412\u0417\u042F\u0422 \xB7 \u041A\u041E\u041B\u0427\u0410\u041A \xB7 \u0411\u0415\u0416\u0418\u0422 \xB7 \u0412 \xB7 \u0418\u0420\u041A\u0423\u0422\u0421\u041A", date: "14.XI" },
      { text: "\u0414\u0415\u041D\u0418\u041A\u0418\u041D \xB7 \u041E\u0421\u0422\u0410\u0412\u041B\u042F\u0415\u0422 \xB7 \u041A\u0423\u0420\u0421\u041A \xB7 \u041D\u0410\u0421\u0422\u0423\u041F\u0410\u0415\u041C", date: "17.XI" }
    ],
    let: [
      { body: "\u041C\u0430\u043C\u0430, \u0436\u0438\u0432. \u0418\u0437-\u043F\u043E\u0434 \u041E\u0440\u043B\u0430 \u043E\u0442\u0432\u043E\u0434\u044F\u0442 \u0432 \u0442\u044B\u043B. \u041B\u0430\u0442\u044B\u0448\u0438 \u0441\u0442\u043E\u044F\u043B\u0438 \u043A\u0430\u043A \u0441\u043A\u0430\u043B\u044B. \u0416\u0434\u0438 \u043F\u0438\u0441\u044C\u043C\u0430.", from: "\u043A\u0440\u0430\u0441\u043D\u043E\u0430\u0440\u043C\u0435\u0435\u0446 \u041A., \u043E\u043A\u0442\u044F\u0431\u0440\u044C" },
      { body: "\u041F\u0440\u043E\u0449\u0430\u0439, \u0420\u043E\u0441\u0441\u0456\u044F \u043F\u0440\u0435\u0436\u043D\u044F\u044F. \u0423\u0445\u043E\u0434\u0438\u043C\u044A \u0441\u0442\u0435\u043F\u044C\u044E. \u0417\u0430 \u0441\u043F\u0438\u043D\u043E\u0439 \u0414\u043E\u0431\u0440. \u0430\u0440\u043C\u0456\u044F, \u0432\u043F\u0435\u0440\u0435\u0434\u0438 \u2014 \u0411\u043E\u0433 \u0437\u043D\u0430\u0435\u0442\u044A.", from: "\u043F\u043E\u0440\u0443\u0447\u0438\u043A\u044A \u041F., \u043D\u043E\u044F\u0431\u0440\u044C" }
    ]
  },
  1920: {
    news: [
      { headline: "\u041A\u043E\u043B\u0447\u0430\u043A\u0430 \u0440\u0430\u0441\u0441\u0442\u0440\u0435\u043B\u044F\u043B\u0438", body: "\u0418\u0440\u043A\u0443\u0442\u0441\u043A, \u0431\u0435\u0440. \u0423\u0448\u0430\u043A\u043E\u0432\u043A\u0438. \u0412\u0435\u0440\u0445\u043E\u0432\u043D\u044B\u0439 \u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u0438 \u041F\u0435\u043F\u0435\u043B\u044F\u0435\u0432 \u0440\u0430\u0441\u0441\u0442\u0440\u0435\u043B\u044F\u043D\u044B \u0431\u0435\u0437 \u0441\u0443\u0434\u0430.", date: "\u0424\u0435\u0432\u0440\u0430\u043B\u044C" },
      { headline: "\u041F\u0438\u043B\u0441\u0443\u0434\u0441\u043A\u0438\u0439 \u0432 \u041A\u0438\u0435\u0432\u0435", body: "\u041F\u043E\u043B\u044C\u0441\u043A\u0438\u0435 \u0432\u043E\u0439\u0441\u043A\u0430 \u0432\u043E\u0448\u043B\u0438 \u0432 \u041A\u0438\u0435\u0432. \u0421\u043E\u0432\u0435\u0442\u0441\u043A\u043E-\u043F\u043E\u043B\u044C\u0441\u043A\u0430\u044F \u0432\u043E\u0439\u043D\u0430.", date: "\u041C\u0430\u0439" },
      { headline: "\u0427\u0443\u0434\u043E \u043D\u0430 \u0412\u0438\u0441\u043B\u0435", body: "\u0422\u0443\u0445\u0430\u0447\u0435\u0432\u0441\u043A\u0438\u0439 \u0440\u0430\u0437\u0431\u0438\u0442 \u043F\u043E\u0434 \u0412\u0430\u0440\u0448\u0430\u0432\u043E\u0439. 70 000 \u043F\u043B\u0435\u043D\u043D\u044B\u0445. \u041A\u0430\u043C\u043F\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0438\u0433\u0440\u0430\u043D\u0430.", date: "\u0410\u0432\u0433\u0443\u0441\u0442" },
      { headline: "\u041A\u0440\u044B\u043C \u0432\u0437\u044F\u0442", body: "\u0424\u0440\u0443\u043D\u0437\u0435 \u0444\u043E\u0440\u0441\u0438\u0440\u0443\u0435\u0442 \u0421\u0438\u0432\u0430\u0448. \u0412\u0440\u0430\u043D\u0433\u0435\u043B\u044C \u044D\u0432\u0430\u043A\u0443\u0438\u0440\u0443\u0435\u0442 150 000 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0438\u0437 \u0421\u0435\u0432\u0430\u0441\u0442\u043E\u043F\u043E\u043B\u044F.", date: "\u041D\u043E\u044F\u0431\u0440\u044C" },
      { headline: "\u0420\u0438\u0436\u0441\u043A\u0438\u0439 \u043C\u0438\u0440", body: "\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u043D \u043F\u0440\u0435\u043B\u0438\u043C\u0438\u043D\u0430\u0440\u043D\u044B\u0439 \u043C\u0438\u0440 \u0441 \u041F\u043E\u043B\u044C\u0448\u0435\u0439. \u0413\u0440\u0430\u043D\u0438\u0446\u0443 \u043F\u0440\u043E\u0432\u0435\u043B\u0438 \u043F\u043E \u043B\u0438\u043D\u0438\u0438 \u041A\u0435\u0440\u0437\u043E\u043D\u0430 \u043C\u0438\u043D\u0443\u0441.", date: "\u041E\u043A\u0442\u044F\u0431\u0440\u044C" }
    ],
    tel: [
      { text: "\u041A\u041E\u041B\u0427\u0410\u041A \xB7 \u0420\u0410\u0421\u0421\u0422\u0420\u0415\u041B\u042F\u041D \xB7 \u0412 \xB7 5.00 \xB7 \u0423\u0422\u0420\u0410", date: "07.II" },
      { text: "\u041A\u0418\u0415\u0412 \xB7 \u0412\u0417\u042F\u0422 \xB7 \u041F\u041E\u041B\u042F\u041A\u0410\u041C\u0418 \xB7 \u041F\u0420\u0418\u0411\u042B\u0412\u0410\u0415\u041C \xB7 \u041D\u0410 \xB7 \u0424\u0420\u041E\u041D\u0422", date: "07.V" },
      { text: "\u0412\u0410\u0420\u0428\u0410\u0412\u0410 \xB7 \u041D\u0415 \xB7 \u0412\u0417\u042F\u0422\u0410 \xB7 \u041E\u0422\u0421\u0422\u0423\u041F\u0410\u0415\u041C \xB7 \u041A \xB7 \u0411\u0423\u0413\u0423", date: "16.VIII" },
      { text: "\u0421\u0418\u0412\u0410\u0428 \xB7 \u0424\u041E\u0420\u0421\u0418\u0420\u041E\u0412\u0410\u041D \xB7 \u041A\u0420\u042B\u041C \xB7 \u041D\u0410\u0428", date: "08.XI" },
      { text: "\u0421\u0415\u0412\u0410\u0421\u0422\u041E\u041F\u041E\u041B\u042C \xB7 \u041F\u0423\u0421\u0422 \xB7 \u0412\u0420\u0410\u041D\u0413\u0415\u041B\u042C \xB7 \u0423\u0428\u0401\u041B \xB7 \u0412 \xB7 \u041C\u041E\u0420\u0415", date: "14.XI" },
      { text: "\u041C\u0410\u0425\u041D\u041E \xB7 \u0420\u0410\u0417\u041E\u0420\u0423\u0416\u0418\u0422\u042C \xB7 \u041F\u0420\u0418\u041A\u0410\u0417 \xB7 \u0420\u0412\u0421\u0420", date: "26.XI" }
    ],
    let: [
      { body: "\u0418\u0437\u044A \u0421\u0435\u0432\u0430\u0441\u0442\u043E\u043F\u043E\u043B\u044F \u0432\u044B\u0445\u043E\u0434\u0438\u043C\u044A \u043F\u043E\u0441\u043B\u0463\u0434\u043D\u0438\u043C\u0438. \u041C\u0430\u0442\u044C \u043D\u0430 \xAB\u0410\u043B\u043C\u0430\u0437\u0463\xBB, \u044F \u043D\u0430 \xAB\u0413\u0435\u043D\u0435\u0440\u0430\u043B\u0463 \u0410\u043B\u0435\u043A\u0441\u0463\u0435\u0432\u0463\xBB. \u0411\u043E\u0433\u044A \u0434\u0430\u0441\u0442\u044A \u2014 \u041A\u043E\u043D\u0441\u0442\u0430\u043D\u0442\u0438\u043D\u043E\u043F\u043E\u043B\u044C.", from: "\u043C\u0438\u0447\u043C\u0430\u043D\u044A, \u043D\u043E\u044F\u0431\u0440\u044C" },
      { body: "\u0412\u0430\u0440\u0448\u0430\u0432\u0430 \u043E\u0442\u0431\u0438\u0442\u0430. \u041B\u0435\u0436\u0438\u043C \u043F\u043E\u0434 \u041C\u0438\u043D\u0441\u043A-\u041C\u0430\u0437\u043E\u0432\u0435\u0446\u043A\u0438\u043C. \u0414\u043E\u0436\u0434\u044C, \u0445\u043E\u043B\u043E\u0434, \u0441\u043D\u0430\u0440\u044F\u0434\u044B \u043A\u043E\u043D\u0447\u0438\u043B\u0438\u0441\u044C.", from: "\u043A\u0440\u0430\u0441\u043D\u043E\u0430\u0440\u043C., \u0430\u0432\u0433\u0443\u0441\u0442" }
    ]
  },
  1921: {
    news: [
      { headline: "\u041A\u0440\u043E\u043D\u0448\u0442\u0430\u0434\u0442 \u0432\u0437\u0431\u0443\u043D\u0442\u043E\u0432\u0430\u043B\u0441\u044F", body: "\u041C\u0430\u0442\u0440\u043E\u0441\u044B \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0441\u043E\u0432\u0435\u0442\u043E\u0432 \u0431\u0435\u0437 \u043A\u043E\u043C\u043C\u0443\u043D\u0438\u0441\u0442\u043E\u0432. \u041B\u0438\u0434\u0435\u0440 \u2014 \u041F\u0435\u0442\u0440\u0438\u0447\u0435\u043D\u043A\u043E.", date: "\u041C\u0430\u0440\u0442" },
      { headline: "\u041D\u042D\u041F \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D", body: "X-\u0439 \u0441\u044A\u0435\u0437\u0434 \u0420\u041A\u041F(\u0431) \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u0440\u043E\u0434\u0440\u0430\u0437\u0432\u0451\u0440\u0441\u0442\u043A\u0443 \u043F\u0440\u043E\u0434\u043D\u0430\u043B\u043E\u0433\u043E\u043C. \u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0430 \u043C\u0435\u043B\u043A\u0430\u044F \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u044F.", date: "\u041C\u0430\u0440\u0442" },
      { headline: "\u0413\u043E\u043B\u043E\u0434 \u0432 \u041F\u043E\u0432\u043E\u043B\u0436\u044C\u0435", body: "\u0421\u0430\u0440\u0430\u0442\u043E\u0432, \u0421\u0430\u043C\u0430\u0440\u0430, \u0410\u0441\u0442\u0440\u0430\u0445\u0430\u043D\u044C. \u041F\u043E \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u044F\u043C \u2014 5 \u043C\u043B\u043D \u043D\u0430 \u043A\u0440\u0430\u044E \u0433\u0438\u0431\u0435\u043B\u0438.", date: "\u0418\u044E\u043B\u044C" },
      { headline: "\u0422\u0430\u043C\u0431\u043E\u0432\u0441\u043A\u043E\u0435 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0438\u0435", body: "\u0422\u0443\u0445\u0430\u0447\u0435\u0432\u0441\u043A\u0438\u0439 \u0438 \u0410\u043D\u0442\u043E\u043D\u043E\u0432-\u041E\u0432\u0441\u0435\u0435\u043D\u043A\u043E \u043F\u0440\u043E\u0442\u0438\u0432 \u0410\u043D\u0442\u043E\u043D\u043E\u0432\u0430. \u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u044B \u0433\u0430\u0437\u044B.", date: "\u0418\u044E\u043D\u044C" }
    ],
    tel: [
      { text: "\u041A\u0420\u041E\u041D\u0428\u0422\u0410\u0414\u0422 \xB7 \u0412\u0417\u042F\u0422 \xB7 \u0428\u0422\u0423\u0420\u041C\u041E\u041C \xB7 \u041F\u041E \xB7 \u041B\u042C\u0414\u0423", date: "18.III" },
      { text: "\u0410\u041D\u0422\u041E\u041D\u041E\u0412\u0429\u0418\u041D\u0410 \xB7 \u0413\u0410\u0417\u042B \xB7 \u041F\u0420\u0418\u041C\u0415\u041D\u0415\u041D\u042B \xB7 \u041B\u0415\u0421\u0410 \xB7 \u041E\u0427\u0418\u0429\u0415\u041D\u042B", date: "12.VI" },
      { text: "\u0421\u0410\u041C\u0410\u0420\u0410 \xB7 \u0412\u0410\u0413\u041E\u041D\u042B \xB7 \u0421 \xB7 \u0425\u041B\u0415\u0411\u041E\u041C \xB7 \u0420\u0410\u0417\u041E\u0411\u0420\u0410\u041D\u042B \xB7 \u0413\u041E\u041B\u041E\u0414\u041D\u042B\u041C\u0418", date: "VIII" },
      { text: "\u0410\u0420\u0410 \xB7 \u0413\u0423\u0412\u0415\u0420 \xB7 \u0414\u041E\u0421\u0422\u0410\u0412\u041B\u042F\u0415\u0422 \xB7 \u041F\u0420\u041E\u0414\u041E\u0412\u041E\u041B\u042C\u0421\u0422\u0412\u0418\u0415", date: "IX" },
      { text: "\u0412\u041B\u0410\u0414\u0418\u0412\u041E\u0421\u0422\u041E\u041A \xB7 \u042F\u041F\u041E\u041D\u0426\u042B \xB7 \u0415\u0429\u0401 \xB7 \u0421\u0422\u041E\u042F\u0422", date: "XI" }
    ],
    let: [
      { body: "\u041C\u044B \u043F\u0440\u043E\u0441\u0438\u043C\u044A \u043C\u0438\u0440\u0430 \u0441\u044A \u0420\u043E\u0441\u0441\u0456\u0435\u0439 \u0438 \u0445\u043B\u0463\u0431\u0430 \u0434\u043B\u044F \u0434\u0463\u0442\u0435\u0439. \u0412\u0441\u0451 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u2014 \u043F\u043E\u0442\u043E\u043C\u044A.", from: "\u0432\u043E\u0437\u0437\u0432\u0430\u043D\u0456\u0435 \u0420\u041F\u0426, \u0430\u0432\u0433\u0443\u0441\u0442\u044A" },
      { body: "\u041C\u0430\u0442\u0440\u043E\u0441\u044B \u2014 \u0446\u0432\u0435\u0442 \u0438 \u0433\u043E\u0440\u0434\u043E\u0441\u0442\u044C \u0440\u0435\u0432\u043E\u043B\u044E\u0446\u0438\u0438 \u2014 \u043A\u0440\u0438\u0447\u0430\u0442: \u0434\u043E\u0432\u043E\u043B\u044C\u043D\u043E. \u0418 \u0438\u0445 \u0440\u0430\u0441\u0441\u0442\u0440\u0435\u043B\u0438\u0432\u0430\u044E\u0442.", from: "\u0438\u0437 \u0434\u043D\u0435\u0432\u043D\u0438\u043A\u0430, \u043C\u0430\u0440\u0442" }
    ]
  },
  1922: {
    news: [
      { headline: "\u0413\u0435\u043D\u0443\u044D\u0437\u0441\u043A\u0430\u044F \u043A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F", body: "\u0420\u0421\u0424\u0421\u0420 \u0432\u043F\u0435\u0440\u0432\u044B\u0435 \u0437\u0430 \u0441\u0442\u043E\u043B\u043E\u043C \u0441 \u0410\u043D\u0442\u0430\u043D\u0442\u043E\u0439. \u0427\u0438\u0447\u0435\u0440\u0438\u043D \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043F\u0440\u0438\u0437\u043D\u0430\u043D\u0438\u044F.", date: "\u0410\u043F\u0440\u0435\u043B\u044C" },
      { headline: "\u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0451\u043D", body: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u044F\u043F\u043E\u043D\u0441\u043A\u0438\u0439 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442 \u0443\u0448\u0451\u043B. \u041D\u0420\u0410 \u0432\u0445\u043E\u0434\u0438\u0442 \u0432 \u0433\u043E\u0440\u043E\u0434.", date: "\u041E\u043A\u0442\u044F\u0431\u0440\u044C" },
      { headline: "\u041E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D \u0421\u0421\u0421\u0420", body: "\u0420\u0421\u0424\u0421\u0420, \u0423\u0421\u0421\u0420, \u0411\u0421\u0421\u0420, \u0417\u0421\u0424\u0421\u0420 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043B\u0438 \u0421\u043E\u044E\u0437\u043D\u044B\u0439 \u0434\u043E\u0433\u043E\u0432\u043E\u0440. \u041D\u0430\u0447\u0430\u0442\u0430 \u044D\u043F\u043E\u0445\u0430.", date: "\u0414\u0435\u043A\u0430\u0431\u0440\u044C" },
      { headline: "\xAB\u0424\u0438\u043B\u043E\u0441\u043E\u0444\u0441\u043A\u0438\u0439 \u043F\u0430\u0440\u043E\u0445\u043E\u0434\xBB", body: "\u0418\u0437 \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u0430 \u0432\u044B\u0441\u043B\u0430\u043D\u044B 160 \u0444\u0438\u043B\u043E\u0441\u043E\u0444\u043E\u0432, \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u0435\u0439, \u0443\u0447\u0451\u043D\u044B\u0445.", date: "\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C" }
    ],
    tel: [
      { text: "\u0413\u0415\u041D\u0423\u042F \xB7 \u0420\u0410\u041F\u0410\u041B\u041B\u041E \xB7 \u041F\u041E\u0414\u041F\u0418\u0421\u0410\u041D\u041E \xB7 \u0421 \xB7 \u0413\u0415\u0420\u041C\u0410\u041D\u0418\u0415\u0419", date: "16.IV" },
      { text: "\u0412\u041B\u0410\u0414\u0418\u0412\u041E\u0421\u0422\u041E\u041A \xB7 \u041D\u0410\u0428 \xB7 \u0413\u0420\u0410\u0416\u0414. \xB7 \u0412\u041E\u0419\u041D\u0410 \xB7 \u041E\u041A\u041E\u041D\u0427\u0415\u041D\u0410", date: "25.X" },
      { text: "\u041E\u0411\u0420\u0410\u0417\u041E\u0412\u0410\u041D \xB7 \u0421\u041E\u042E\u0417 \xB7 \u0421\u0421\u0420 \xB7 \u0415\u0414\u0418\u041D\u041E\u0413\u041B\u0410\u0421\u041D\u041E", date: "30.XII" },
      { text: "\u041B\u0415\u041D\u0418\u041D \xB7 \u0411\u041E\u041B\u0415\u041D \xB7 \u041A\u041E\u041D\u0421\u0418\u041B\u0418\u0423\u041C \xB7 \u0417\u0410\u0421\u0415\u0414\u0410\u0415\u0422", date: "XII" }
    ],
    let: [
      { body: "\u041F\u0438\u0448\u0443 \u0441\u044A \u043F\u0430\u043B\u0443\u0431\u044B \xAB\u041E\u0431\u0435\u0440-\u0431\u0443\u0440\u0433\u043E\u043C\u0438\u0441\u0442\u0440\u0430 \u0413\u0430\u043A\u0435\u043D\u0430\xBB. \u0420\u043E\u0441\u0441\u0456\u044F \u043E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0442\u0430\u043C\u044A. \u041C\u044B \u2014 \u0431\u0435\u0437\u044A \u043D\u0435\u0451.", from: "\u041D. \u0411\u0435\u0440\u0434\u044F\u0435\u0432\u044A, \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u044A, \u0441\u0435\u043D\u0442." },
      { body: "\u041A\u043E\u043D\u0447\u0438\u043B\u043E\u0441\u044C. \u0421\u0438\u0436\u0443 \u043D\u0430 \u0441\u0442\u0443\u043F\u0435\u043D\u044C\u043A\u0430\u0445\u044A \u0432\u043E\u043A\u0437\u0430\u043B\u0430 \u0432\u044A \u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u0463. \u0427\u0443\u0436\u0456\u0435 \u043A\u043E\u0440\u0430\u0431\u043B\u0438 \u0443\u0448\u043B\u0438.", from: "\u043E\u043A\u0442\u044F\u0431\u0440\u044C" }
    ]
  }
};
const EXTRA_EN = {
  1918: {
    news: [
      { headline: "Nationalization decree", body: "All banks declared property of the RSFSR. Private deposits above 10,000 rub. confiscated.", date: "January" },
      { headline: "Hunger in Petrograd", body: "Bread ration cut to \xBC pound a day. Requisition squads fan out across the provinces.", date: "February" },
      { headline: "Archangel occupied", body: "Allied landings enter Archangel. Entente intervention has begun.", date: "August" },
      { headline: "Imperial gold in Kazan", body: "Komuch's People's Army seizes part of the Empire's gold reserve \u2014 650 mln rubles.", date: "August" }
    ],
    tel: [
      { text: "DEMAND \xB7 ALL \xB7 FORCES \xB7 TO \xB7 EAST \xB7 FRUNZE", date: "Jul 5" },
      { text: "CZECHS \xB7 TAKE \xB7 SIMBIRSK \xB7 REINFORCEMENT \xB7 URGENT", date: "Jul 22" },
      { text: "MIRBACH \xB7 KILLED \xB7 BLUMKIN \xB7 ESCAPED", date: "Jul 6" },
      { text: "VLADIVOSTOK \xB7 JAPANESE \xB7 LANDING \xB7 CONFIRMED", date: "Apr 5" },
      { text: "ORDER \xB7 No. 227 \xB7 NOT \xB7 ONE \xB7 STEP \xB7 BACK \xB7 TROTSKY", date: "Sep 10" }
    ],
    let: [
      { body: "Nikolai \u2014 famine here is terrible. No bread, no potatoes, children swelling. I write by lamp, alone.", from: "Petrograd, February" },
      { body: "They took father in the night. Said only \u2014 former officer. God keep us all.", from: "Moscow, September" }
    ]
  },
  1919: {
    news: [
      { headline: "Kolchak in Omsk", body: "The Supreme Ruler reviews the Siberian army. British instructors drill new recruits.", date: "March" },
      { headline: "Orel surrendered", body: "Volunteer Army 380 versts from Moscow. Sovnarkom begins archiving.", date: "October" },
      { headline: "First Cavalry Army", body: "Budyonny's 16,000 sabres formed. Turning point on the Southern Front.", date: "November" },
      { headline: "Yudenich at Petrograd", body: "Whites at Gatchina. Trotsky on an armoured train at Pulkovo.", date: "October" }
    ],
    tel: [
      { text: "UFA \xB7 LOST \xB7 RETREAT \xB7 BEYOND \xB7 VOLGA", date: "Mar 13" },
      { text: "DENIKIN \xB7 TAKES \xB7 TSARITSYN \xB7 SEND \xB7 RESERVES", date: "Jun 30" },
      { text: "LATVIAN \xB7 DIVISION \xB7 ENROUTE \xB7 TO \xB7 OREL", date: "Oct 14" },
      { text: "PULKOVO \xB7 HELD \xB7 YUDENICH \xB7 WITHDRAWS \xB7 TO \xB7 NARVA", date: "Oct 22" },
      { text: "OMSK \xB7 TAKEN \xB7 KOLCHAK \xB7 FLEES \xB7 TO \xB7 IRKUTSK", date: "Nov 14" },
      { text: "DENIKIN \xB7 QUITS \xB7 KURSK \xB7 ADVANCING", date: "Nov 17" }
    ],
    let: [
      { body: "Mama, I live. Pulled back from near Orel. The Latvians stood like stone. Wait for a letter.", from: "Red soldier K., October" },
      { body: "Farewell, old Russia. We ride the steppe south. Behind \u2014 the Volunteer Army. Ahead \u2014 God knows.", from: "Lieutenant P., November" }
    ]
  },
  1920: {
    news: [
      { headline: "Kolchak executed", body: "Irkutsk, bank of the Ushakovka. The Supreme Ruler and Pepelyayev shot without trial.", date: "February" },
      { headline: "Pilsudski in Kiev", body: "Polish armies enter Kiev. The Soviet\u2013Polish war is on.", date: "May" },
      { headline: "Miracle on the Vistula", body: "Tukhachevsky shattered near Warsaw. 70,000 prisoners. Campaign lost.", date: "August" },
      { headline: "Crimea falls", body: "Frunze crosses the Sivash. Wrangel evacuates 150,000 from Sevastopol.", date: "November" },
      { headline: "Treaty of Riga", body: "Preliminary peace with Poland. The border runs east of the Curzon Line.", date: "October" }
    ],
    tel: [
      { text: "KOLCHAK \xB7 SHOT \xB7 05.00 \xB7 HOURS", date: "Feb 7" },
      { text: "KIEV \xB7 TAKEN \xB7 BY \xB7 POLES \xB7 REGIMENT \xB7 DEPLOYING", date: "May 7" },
      { text: "WARSAW \xB7 NOT \xB7 TAKEN \xB7 RETREAT \xB7 TO \xB7 BUG", date: "Aug 16" },
      { text: "SIVASH \xB7 FORDED \xB7 CRIMEA \xB7 OURS", date: "Nov 8" },
      { text: "SEVASTOPOL \xB7 EMPTY \xB7 WRANGEL \xB7 GONE \xB7 TO \xB7 SEA", date: "Nov 14" },
      { text: "MAKHNO \xB7 TO \xB7 BE \xB7 DISARMED \xB7 ORDER \xB7 RVSR", date: "Nov 26" }
    ],
    let: [
      { body: "We leave Sevastopol with the last ships. Mother on the Almaz, I on the General Alekseev. God willing \u2014 Constantinople.", from: "Midshipman, November" },
      { body: "Warsaw pushed us back. We lie near Minsk-Mazowiecki. Rain, cold, no shells.", from: "Red soldier, August" }
    ]
  },
  1921: {
    news: [
      { headline: "Kronstadt rises", body: "Sailors demand soviets without Communists. Leader \u2014 Petrichenko.", date: "March" },
      { headline: "NEP declared", body: "10th Congress replaces food requisitioning with a tax. Small trade legalized.", date: "March" },
      { headline: "Volga famine", body: "Saratov, Samara, Astrakhan. 5 million on the edge of death.", date: "July" },
      { headline: "Tambov crushed", body: "Tukhachevsky vs. Antonov. Poison gas used in the forests.", date: "June" }
    ],
    tel: [
      { text: "KRONSTADT \xB7 STORMED \xB7 ACROSS \xB7 THE \xB7 ICE", date: "Mar 18" },
      { text: "GAS \xB7 DEPLOYED \xB7 FORESTS \xB7 CLEARED", date: "Jun 12" },
      { text: "SAMARA \xB7 GRAIN \xB7 CARS \xB7 STORMED \xB7 BY \xB7 STARVING", date: "Aug" },
      { text: "ARA \xB7 HOOVER \xB7 DELIVERS \xB7 PROVISIONS", date: "Sep" },
      { text: "VLADIVOSTOK \xB7 JAPANESE \xB7 STILL \xB7 HERE", date: "Nov" }
    ],
    let: [
      { body: "We ask for peace with Russia and bread for our children. All the rest \u2014 later.", from: "Church appeal, August" },
      { body: "Sailors \u2014 the pride of the revolution \u2014 cry enough. And they are shot for it.", from: "diary, March" }
    ]
  },
  1922: {
    news: [
      { headline: "Genoa Conference", body: "First time the RSFSR sits with the Entente. Chicherin demands recognition.", date: "April" },
      { headline: "Vladivostok freed", body: "Last Japanese transport sails. The People\u2019s Revolutionary Army enters.", date: "October" },
      { headline: "USSR formed", body: "RSFSR, Ukraine, Byelorussia, Transcaucasia sign the Union Treaty.", date: "December" },
      { headline: "Philosophers\u2019 ship", body: "160 philosophers, writers, scientists expelled from Petrograd.", date: "September" }
    ],
    tel: [
      { text: "GENOA \xB7 RAPALLO \xB7 SIGNED \xB7 WITH \xB7 GERMANY", date: "Apr 16" },
      { text: "VLADIVOSTOK \xB7 OURS \xB7 CIVIL \xB7 WAR \xB7 ENDED", date: "Oct 25" },
      { text: "UNION \xB7 OF \xB7 SSR \xB7 FORMED \xB7 UNANIMOUS", date: "Dec 30" },
      { text: "LENIN \xB7 ILL \xB7 COUNCIL \xB7 IN \xB7 SESSION", date: "Dec" }
    ],
    let: [
      { body: "I write from the deck of the Oberb\xFCrgermeister Haken. Russia is behind us. We \u2014 without her.", from: "N. Berdyaev, Petrograd, Sept." },
      { body: "It is over. I sit on the station steps in Vladivostok. The foreign ships are gone.", from: "October" }
    ]
  }
};
function DocumentModal({ item, onClose, lang }) {
  if (!item) return null;
  const { type, props } = item;
  const renderBig = () => {
    if (type === "news") return /* @__PURE__ */ React.createElement(NewspaperClipping, { ...props, width: 720, rotate: 0 });
    if (type === "tel") return /* @__PURE__ */ React.createElement(TelegramSlip, { ...props, width: 640, rotate: 0 });
    if (type === "let") return /* @__PURE__ */ React.createElement(LetterCard, { ...props, width: 760, rotate: 0 });
    return null;
  };
  const label = lang === "ru" ? "\u041A\u043B\u0438\u043A\u043D\u0438\u0442\u0435 \u0432\u043D\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Esc, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u043A\u0440\u044B\u0442\u044C" : "Click outside or press Esc to close";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onClose,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: 20,
        background: "rgba(10,6,2,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out"
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        style: {
          position: "relative",
          transform: "scale(1.0)",
          cursor: "default",
          filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.75))"
        }
      },
      renderBig()
    ),
    /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: fc.mono,
      fontSize: 13,
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color: "#d0b080",
      pointerEvents: "none"
    } }, label)
  );
}
function DirectionC({ lang, time, duration, years }) {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [pauseOnOpen, setPauseOnOpen] = React.useState(() => {
    try {
      return localStorage.getItem("expo:dirC:pause") !== "false";
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("expo:dirC:pause", String(pauseOnOpen));
    } catch {
    }
  }, [pauseOnOpen]);
  React.useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selectedItem]);
  const frozenTimeRef = React.useRef(time);
  if (!(selectedItem && pauseOnOpen)) {
    frozenTimeRef.current = time;
  }
  const stripTime = selectedItem && pauseOnOpen ? frozenTimeRef.current : time;
  const yearSpan = duration / years.length;
  const yearIdx = Math.min(years.length - 1, Math.floor(time / yearSpan));
  const inYearT = (time - yearIdx * yearSpan) / yearSpan;
  const year = years[yearIdx];
  const data = year[lang];
  const extras = (lang === "ru" ? EXTRA_RU : EXTRA_EN)[year.year] || { news: [], tel: [], let: [] };
  const coreNews = data.events.map((ev) => ({
    type: "news",
    headline: ev.title,
    body: ev.note,
    date: ev.date
  }));
  const newsItems = [...coreNews, ...extras.news];
  const coreTel = data.events.map((ev) => ({
    type: "tel",
    text: ev.title.toUpperCase().replace(/ /g, " \xB7 "),
    date: ev.date
  }));
  const telItems = [...coreTel, ...extras.tel];
  const letItems = [
    { body: data.lede, from: `${year.year}` },
    { body: data.quote.text, from: data.quote.by },
    ...data.events.slice(0, 3).map((ev) => ({ body: ev.note, from: `${ev.date}, ${year.year}` })),
    ...extras.let
  ];
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: "#1a0c04",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: [
      "repeating-linear-gradient(91deg, rgba(0,0,0,.2) 0 2px, transparent 2px 24px)",
      "radial-gradient(ellipse 80% 70% at 50% 50%, #3a2010 0%, #1a0c04 100%)"
    ].join(",")
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: "50%",
    top: 0,
    transform: "translateX(-50%)",
    width: "140%",
    height: "100%",
    background: "radial-gradient(ellipse 40% 80% at 50% 0%, rgba(255,220,150,.15) 0%, transparent 60%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    fontFamily: fc.display,
    fontStyle: "italic",
    fontSize: 860,
    fontWeight: 400,
    color: "rgba(220,180,110,0.08)",
    lineHeight: 0.8,
    letterSpacing: "-0.05em",
    pointerEvents: "none",
    userSelect: "none"
  } }, year.year), /* @__PURE__ */ React.createElement(
    Strip,
    {
      y: 280,
      height: 200,
      speed: 60,
      time: stripTime,
      items: newsItems,
      cardStep: 420,
      renderItem: (item, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: () => setSelectedItem({ type: "news", props: item }),
          style: { position: "absolute", top: 20, left: 20, cursor: "zoom-in" }
        },
        /* @__PURE__ */ React.createElement(NewspaperClipping, { ...item, rotate: -2 + i % 3 })
      )
    }
  ), /* @__PURE__ */ React.createElement(
    Strip,
    {
      y: 500,
      height: 200,
      speed: 95,
      time: stripTime,
      items: telItems,
      cardStep: 360,
      renderItem: (item, i) => {
        const s = [0.82, 1, 1.18, 0.92, 1.1, 0.86, 1.05][i % 7];
        const dy = [20, 4, 38, 12, 46, 0, 26][i % 7];
        const dx = [20, 44, 8, 36, 16, 52, 24][i % 7];
        const rot = [-4, 2, -1, 5, -3, 1, 3, -2][i % 8];
        const w = Math.round(320 * s);
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            onClick: () => setSelectedItem({ type: "tel", props: item }),
            style: { position: "absolute", top: dy, left: dx, cursor: "zoom-in" }
          },
          /* @__PURE__ */ React.createElement(TelegramSlip, { ...item, width: w, rotate: rot })
        );
      }
    }
  ), /* @__PURE__ */ React.createElement(
    Strip,
    {
      y: 740,
      height: 230,
      speed: 45,
      time: stripTime,
      items: letItems,
      cardStep: 460,
      renderItem: (item, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: () => setSelectedItem({ type: "let", props: item }),
          style: { position: "absolute", top: 20, left: 20, cursor: "zoom-in" }
        },
        /* @__PURE__ */ React.createElement(LetterCard, { ...item, rotate: 2 - i % 3 * 2 })
      )
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 150, left: 70, zIndex: 3, color: tc.paperLight, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: fc.mono, fontSize: 14, letterSpacing: "0.3em", textTransform: "uppercase", color: tc.ochre } }, data.chapter), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: fc.display, fontSize: 52, fontStyle: "italic", marginTop: 12, color: "#f0dcae", maxWidth: 900, lineHeight: 1.1 } }, data.subtitle)), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 260,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 3,
    color: tc.paperLight,
    maxWidth: 1200,
    textAlign: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: fc.display, fontSize: 36, fontStyle: "italic", lineHeight: 1.3, color: "#f0dcae" } }, data.quote.text), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: fc.mono, fontSize: 14, color: tc.ochre, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 12 } }, "\u2014 ", data.quote.by)), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 270,
    background: "linear-gradient(180deg, #1a0c04 0%, transparent 100%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 370,
    background: "linear-gradient(0deg, #1a0c04 30%, transparent 100%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement(
    "label",
    {
      style: {
        position: "absolute",
        right: 40,
        bottom: 210,
        zIndex: 4,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: fc.mono,
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: tc.ochre,
        padding: "10px 14px",
        background: "rgba(10,6,2,0.55)",
        border: "1px solid rgba(200,150,80,0.25)",
        cursor: "pointer",
        userSelect: "none"
      }
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        role: "checkbox",
        "aria-checked": pauseOnOpen,
        onClick: () => setPauseOnOpen((v) => !v),
        style: {
          width: 28,
          height: 16,
          borderRadius: 8,
          background: pauseOnOpen ? "#c08040" : "rgba(120,80,40,0.35)",
          border: "1px solid #8a6a30",
          position: "relative",
          transition: "background 150ms"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: {
        position: "absolute",
        top: 1,
        left: pauseOnOpen ? 13 : 1,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#f0dcae",
        transition: "left 150ms"
      } })
    ),
    /* @__PURE__ */ React.createElement("span", { onClick: () => setPauseOnOpen((v) => !v) }, lang === "ru" ? "\u041F\u0430\u0443\u0437\u0430 \u043F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438" : "Pause on open")
  ), /* @__PURE__ */ React.createElement(DocumentModal, { item: selectedItem, onClose: () => setSelectedItem(null), lang }));
}
window.DirectionC = DirectionC;
