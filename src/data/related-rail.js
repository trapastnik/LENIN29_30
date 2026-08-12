// Рельс «связанные справки» — правый столбец раскрытой карточки.
//
// ЗАЧЕМ. 3020 разрешённых перекрёстных связей в текстах справок никуда
// не ведут: `rich-text.js:50` намеренно рисует ссылку подсвеченным термином,
// не кнопкой, — строчная ссылка дала бы тач-цель высотой строки, втрое ниже
// порога §1. Но на киоске посетителю больше негде посмотреть: ни поиска,
// ни соседней вкладки. Связность существует только в базе. Решение (dvn,
// 2026-08-05): блок связей с честными целями ≥64px, справа, не под текстом
// (на справке 5500 знаков нижний блок уходит под сгиб).
//
// ДАННЫЕ — public/content/_backlinks.json, генерируется content, три группы,
// НЕ пересекаются:
//   out    — исходящие: эта справка ссылается на них. Видимый эталон —
//            подсвеченные термины в тексте, поэтому НЕ урезаются;
//   refs   — входящие: они ссылаются сюда. Урезаются потолком cap;
//   mutual — взаимные, сила в обе стороны (n_out отсюда, n_in сюда).
//
// ⚠️ ЭТО КАРКАС, НЕ ФИНАЛЬНЫЙ ВИД. Чипы — простые кнопки 64px с подписью.
// Точку цвета лагеря, кольцо и метку (примитив brand.html#c-related) зона
// design отдаёт отдельно; тогда они вставляются в готовую разметку чипа,
// а не переверстывают рельс. Структура — ui, вид — design.

// kind связи → страница, где живёт её карточка. Разделы разведены по
// четырём страницам; глубокая ссылка #card=<id> открывает нужную ту же
// модалкой (см. src/data/deep-link.js).
const СТРАНИЦА = {
  person: 'expo/people.html',
  party: 'parties.html',
  state: 'states.html',
  event: 'expo/chronicle.html',
};

const СЕКЦИИ = [
  { key: 'out',    ru: 'Упоминаются здесь', en: 'Mentioned here' },
  { key: 'refs',   ru: 'Ссылаются сюда',    en: 'Referenced by' },
  { key: 'mutual', ru: 'Взаимные связи',    en: 'Mutual ties' },
];

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Адрес карточки связи. Внутри текущей страницы вернёт только хэш
 * (`#card=<id>`), между страницами — полный путь. Потребитель решает:
 * тот же путь → openModal, чужой → переход.
 */
export function railHref(link, curPage) {
  const page = СТРАНИЦА[link.kind];
  if (!page) return null;                 // неизвестный kind — не рисуем ссылку
  const свой = curPage && page.endsWith(curPage);
  const rel = `${page}#card=${encodeURIComponent(link.id)}`;
  return { page, свой, hash: `#card=${link.id}`, url: window.MTK_URL ? window.MTK_URL(rel) : rel };
}

/**
 * HTML рельса. Пустых секций не рисует. Ключа нет — блока нет вовсе
 * (у всех 198 справок есть хоть одна связь, но правило честное).
 *
 * @param entry   запись из _backlinks.json.items[<id>] ({out, refs, mutual})
 * @param lang    'ru' | 'en'
 * @param curPage имя текущей страницы, напр. 'parties.html'
 */
export function railHTML(entry, lang, curPage) {
  if (!entry) return '';
  const секции = СЕКЦИИ
    .map((s) => ({ ...s, список: entry[s.key] || [] }))
    .filter((s) => s.список.length);
  if (!секции.length) return '';

  const чип = (link) => {
    const href = railHref(link, curPage);
    // Неизвестный kind — статичная метка, не кнопка: мёртвая ссылка хуже
    // отсутствующей (§13). Так же и rich-text.js поступает с нерезолвом.
    if (!href) {
      return `<span class="rail-chip rail-chip--dead" title="${escapeHtml(link.title_ru)}">`
        + `${escapeHtml(link.title_ru)}</span>`;
    }
    return `<button type="button" class="rail-chip" data-id="${escapeHtml(link.id)}"`
      + ` data-kind="${escapeHtml(link.kind)}" data-page="${escapeHtml(href.page)}"`
      + ` data-own="${href.свой ? '1' : '0'}">`
      + `<span class="rail-chip__dot" data-kind="${escapeHtml(link.kind)}"></span>`
      + `<span class="rail-chip__name">${escapeHtml(link.title_ru)}</span>`
      + `</button>`;
  };

  return `<nav class="related-rail" aria-label="${lang === 'en' ? 'Related dossiers' : 'Связанные справки'}">`
    + секции.map((s) =>
        `<section class="rail-section">`
        + `<h3 class="rail-section__title">${lang === 'en' ? s.en : s.ru}`
        + `<span class="rail-section__count">${s.список.length}</span></h3>`
        + `<div class="rail-chips">${s.список.map(чип).join('')}</div>`
        + `</section>`
      ).join('')
    + `</nav>`;
}

/**
 * Вешает навигацию на чипы рельса делегированием. onOwn(id) — открыть
 * карточку той же модалкой (связь на текущей странице). Чужая страница —
 * обычный переход по адресу, история копится как у любой навигации между
 * разделами (deep-link.js на целевой странице сотрёт хэш при открытии).
 */
export function wireRail(root, onOwn) {
  root.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('.rail-chip');
    if (!chip || chip.classList.contains('rail-chip--dead')) return;
    const id = chip.getAttribute('data-id');
    if (chip.getAttribute('data-own') === '1' && typeof onOwn === 'function') {
      onOwn(id);
    } else {
      const page = chip.getAttribute('data-page');
      const rel = `${page}#card=${encodeURIComponent(id)}`;
      window.location.href = window.MTK_URL ? window.MTK_URL(rel) : rel;
    }
  });
}
