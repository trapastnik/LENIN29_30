// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/rich-text.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
function richTextRe() {
  return /\[([^\]]+)\]\(([^)]+)\)|(\*\*\*)([^*]+)\3|(\*\*)([^*]+)\5|(\*)([^*]+)\7/g;
}
function richText(src, accent) {
  if (!src) return [];
  const re = richTextRe();
  const out = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== void 0) {
      out.push(/* @__PURE__ */ React.createElement("span", { key: key++, style: { color: accent, borderBottom: `1px dotted ${accent}` } }, m[1]));
    } else if (m[3]) {
      out.push(/* @__PURE__ */ React.createElement("b", { key: key++, style: { color: accent, fontWeight: 700 } }, m[4]));
    } else if (m[5]) {
      out.push(/* @__PURE__ */ React.createElement("b", { key: key++, style: { fontWeight: 700 } }, m[6]));
    } else {
      out.push(/* @__PURE__ */ React.createElement("b", { key: key++, style: { fontWeight: 600 } }, m[8]));
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}
window.richText = richText;
