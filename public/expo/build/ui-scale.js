// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/ui-scale.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
function S(v) {
  return typeof v === "number" ? `calc(${v}px * var(--ui-scale, 1))` : String(v).replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `calc(${n}px * var(--ui-scale, 1))`);
}
window.MTK_S = S;
