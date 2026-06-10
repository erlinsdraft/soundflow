/**
 * ─────────────────────────────────────────────
 *  middleware/rateLimiter.js
 *  Batasi jumlah request per IP agar server tidak
 *  dibanjiri request (abuse, scraping, DDoS ringan).
 *  Implementasi in-memory — tanpa library eksternal.
 * ─────────────────────────────────────────────
 */

'use strict';

/** Simpan {ip: {count, resetAt}} di memori proses */
const store = new Map();

const WINDOW_MS  = 15 * 60 * 1000; // jendela waktu: 15 menit
const MAX_HITS   = 20;              // maks request per IP per jendela

/**
 * Bersihkan entry yang sudah melewati jendela waktu.
 * Dijalankan periodik agar Map tidak tumbuh tak terbatas.
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of store.entries()) {
    if (now > record.resetAt) store.delete(ip);
  }
}, WINDOW_MS);

function rateLimiter(req, res, next) {
  const ip  = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Ambil atau buat record untuk IP ini
  let record = store.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, record);
  }

  record.count += 1;

  // Sertakan header informatif sesuai standar RateLimit-* (RFC draft)
  const remaining = Math.max(0, MAX_HITS - record.count);
  res.setHeader('RateLimit-Limit',     MAX_HITS);
  res.setHeader('RateLimit-Remaining', remaining);
  res.setHeader('RateLimit-Reset',     Math.ceil(record.resetAt / 1000));

  if (record.count > MAX_HITS) {
    return res.status(429).json({
      success : false,
      error   : 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((record.resetAt - now) / 1000), // detik
    });
  }

  next();
}

module.exports = { rateLimiter };
