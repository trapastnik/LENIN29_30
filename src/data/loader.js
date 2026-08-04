// In-memory кэш для JSON и текстовых ресурсов content/.
//
// Что здесь было и почему переписано:
//
// 1. **Комментарий обещал LRU, код делал FIFO.** Вытеснялся тот, кого раньше
//    всех положили, а не тот, к кому дольше всех не обращались: попадание
//    в кэш не обновляло позицию. На горячей записи выходило наоборот —
//    самая нужная вылетала первой. Расхождение документации с кодом хуже
//    её отсутствия: следующий читает обещание и не проверяет.
//
// 2. **MAX = 100 при 396 событиях хроники и 70 справках персон.** Поднято
//    до 400. После перехода карточек на ленивую загрузку переполнение
//    перестало быть горячим — за сеанс открывают три-пять справок, — но
//    предел меньше объёма одного раздела всё равно неверен.
//
// 3. **Не было дедупликации.** Два одновременных запроса за одним адресом
//    давали два `fetch`: значение попадало в кэш только после ответа.
//    Теперь кэшируется промис, а не значение, — совпадающие вызовы
//    склеиваются сами.

const CACHE = new Map();
const MAX = 400;

/**
 * Достаёт из кэша, обновляя свежесть. Именно это делает кэш LRU:
 * Map хранит порядок вставки, поэтому «обратились» = «переставить в конец».
 */
function _touch(key) {
  const v = CACHE.get(key);
  CACHE.delete(key);
  CACHE.set(key, v);
  return v;
}

function _evictIfNeeded() {
  while (CACHE.size > MAX) {
    // Первый ключ Map — тот, к кому дольше всех не обращались.
    CACHE.delete(CACHE.keys().next().value);
  }
}

/**
 * Общая механика для json и text: в кэш кладём промис.
 * Провалившийся запрос из кэша убираем — иначе одна сетевая ошибка
 * запомнилась бы навсегда, и раздел не открылся бы до перезагрузки.
 */
function _fetch(url, parse, label) {
  if (CACHE.has(url)) return _touch(url);

  const p = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${label}: ${res.status} ${url}`);
    return parse(res);
  }).catch((err) => {
    CACHE.delete(url);
    throw err;
  });

  CACHE.set(url, p);
  _evictIfNeeded();
  return p;
}

export function fetchJSON(url) {
  return _fetch(url, (r) => r.json(), 'fetchJSON');
}

export function fetchText(url) {
  return _fetch(url, (r) => r.text(), 'fetchText');
}

export function clearCache() { CACHE.clear(); }

/** Для проверок: ключи по свежести, первый — кандидат на вытеснение. */
export function cacheKeys() { return [...CACHE.keys()]; }
