// Лёгкий in-memory LRU-кэш для JSON и текстовых ресурсов content/.

const CACHE = new Map();
const MAX = 100;

export async function fetchJSON(url) {
  if (CACHE.has(url)) return CACHE.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchJSON: ${res.status} ${url}`);
  const data = await res.json();
  _put(url, data);
  return data;
}

export async function fetchText(url) {
  if (CACHE.has(url)) return CACHE.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchText: ${res.status} ${url}`);
  const text = await res.text();
  _put(url, text);
  return text;
}

function _put(k, v) {
  if (CACHE.size >= MAX) {
    const first = CACHE.keys().next().value;
    CACHE.delete(first);
  }
  CACHE.set(k, v);
}

export function clearCache() { CACHE.clear(); }
