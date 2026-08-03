// Язык интерфейса для страниц, которые собирает vite (parties, states и их
// компоненты). Сцена /expo/ держит язык в состоянии React и сюда не ходит,
// но ключ хранения у нас общий — `expo:lang`, — поэтому переключение в любом
// месте видно везде.
//
// Что переводим: только интерфейс — подписи разделов, кнопки, счётчики.
// Содержание справок остаётся русским: перевода 198 справок не будет,
// в контенте `*_en` = null с `en_status` (решение dvn, CLAUDE.md §9).
// Поэтому здесь нет и не должно быть строк из контента.

const KEY = 'expo:lang';
const EVENT = 'mtk29:lang';
const DEFAULT = 'ru';

export function getLang() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' ? 'en' : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setLang(lang) {
  const next = lang === 'en' ? 'en' : DEFAULT;
  try { localStorage.setItem(KEY, next); } catch {}
  // storage-событие приходит только в ЧУЖИЕ документы того же origin,
  // поэтому своему документу сообщаем сами. Иначе страница, где нажали
  // кнопку, единственная и не перерисуется.
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

/**
 * Подписка на смену языка — и своей страницей, и соседним окном.
 * @returns {() => void} отписка
 */
export function onLangChange(fn) {
  const local = (e) => fn(e.detail || getLang());
  const cross = (e) => { if (e.key === KEY) fn(getLang()); };
  window.addEventListener(EVENT, local);
  window.addEventListener('storage', cross);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener('storage', cross);
  };
}

/** Выбор строки по текущему языку. */
export function t(ru, en) {
  return getLang() === 'en' ? (en != null ? en : ru) : ru;
}

/**
 * Статические подписи в разметке: <span data-ru="Сетка" data-en="Grid">.
 * Держим текст в HTML, а не в таблице строк, — тогда он виден там же,
 * где вёрстка, и не расходится с ней при правках.
 */
export function applyStaticLabels(root = document) {
  const en = getLang() === 'en';
  for (const el of root.querySelectorAll('[data-ru]')) {
    const val = en ? (el.dataset.en || el.dataset.ru) : el.dataset.ru;
    if (el.dataset.attr) el.setAttribute(el.dataset.attr, val);
    else el.textContent = val;
  }
  const html = document.documentElement;
  if (html) html.lang = en ? 'en' : 'ru';
}

/**
 * Кнопка-переключатель. Подпись — язык, на который переключит, как в /expo/.
 */
export function wireLangToggle(btn, onChange) {
  if (!btn) return;
  const paint = () => { btn.textContent = getLang() === 'ru' ? 'EN' : 'RU'; };
  paint();
  btn.addEventListener('click', () => setLang(getLang() === 'ru' ? 'en' : 'ru'));
  onLangChange(() => { paint(); if (onChange) onChange(getLang()); });
}
