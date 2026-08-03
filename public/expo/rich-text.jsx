// Разметка в текстах импорта — общая для персон и хроники.
//
// Импорт кладёт в summary_ru и в строки хроники ссылки на другие справки —
// `[большевиков](#/party/bolsheviks)`, а неразрезолвленные упоминания
// помечает `***жирным курсивом***` (docs/content.md). Без разбора это видно
// на экране как есть: «[большевиков](#/party/bolsheviks)».
//
// Курсива здесь нет намеренно: он лёг бы на Nolde, а курсивного начертания
// у неё нет — браузер синтезирует наклон, и на крупных кеглях это читается
// как дефект засечек (CLAUDE.md §8). Выделяем цветом и насыщенностью.

// Регэксп собирается на каждый вызов, а не лежит константой: с флагом g
// у него есть состояние lastIndex, и один общий экземпляр на два раздела —
// это ошибка, которая ждёт своего часа.
function richTextRe() {
  return /\[([^\]]+)\]\(([^)]+)\)|(\*\*\*)([^*]+)\3|(\*\*)([^*]+)\5|(\*)([^*]+)\7/g;
}

/**
 * Разбирает разметку в массив React-узлов.
 * @param {string} src   исходный текст
 * @param {string} accent  цвет выделения — свой у каждого раздела
 */
function richText(src, accent) {
  if (!src) return [];
  const re = richTextRe();
  const out = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== undefined) {
      // Ссылка на другую справку. Переход между разделами — отдельная задача
      // (нужен роутер поверх iframe-оверлеев), поэтому подсвечиваем как
      // термин, а не делаем кнопку, которая никуда не ведёт.
      out.push(<span key={key++} style={{ color: accent, borderBottom: `1px dotted ${accent}` }}>{m[1]}</span>);
    } else if (m[3]) {
      out.push(<b key={key++} style={{ color: accent, fontWeight: 700 }}>{m[4]}</b>);
    } else if (m[5]) {
      out.push(<b key={key++} style={{ fontWeight: 700 }}>{m[6]}</b>);
    } else {
      out.push(<b key={key++} style={{ fontWeight: 600 }}>{m[8]}</b>);
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

window.richText = richText;
