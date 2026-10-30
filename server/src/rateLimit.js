import { HttpError } from './http.js';

/**
 * Pembatas laju sederhana (jendela geser, in-memory). Cukup untuk satu instance API;
 * untuk banyak instance gunakan penyimpanan bersama (mis. Redis).
 */
export function createRateLimiter({ windowMs, max, code = 'TERLALU_BANYAK_PERMINTAAN', message, keyFn }) {
  const hits = new Map();
  let lastPrune = 0;
  const text = message ?? 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.';

  const prune = (now) => {
    if (now - lastPrune < 30_000 && hits.size < 10_000) return;
    lastPrune = now;
    for (const [key, list] of hits) {
      const recent = list.filter((t) => now - t < windowMs);
      if (recent.length) hits.set(key, recent); else hits.delete(key);
    }
    while (hits.size > 20_000) hits.delete(hits.keys().next().value);
  };

  return (req, res, next) => {
    const now = Date.now();
    prune(now);
    const key = keyFn ? keyFn(req) : (req.ip ?? 'unknown');
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      const retry = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
      res.setHeader('Retry-After', String(retry));
      return next(new HttpError(429, code, text));
    }
    recent.push(now);
    hits.set(key, recent);
    return next();
  };
}
