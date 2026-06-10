/**
 * ─────────────────────────────────────────────
 *  middleware/logger.js
 *  Log setiap request masuk: method, path,
 *  status code, dan durasi response.
 *  Hanya aktif di mode development.
 * ─────────────────────────────────────────────
 */

'use strict';

// Palet warna ANSI untuk terminal
const COLOR = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
};

/** Pilih warna berdasarkan HTTP status code */
function statusColor(code) {
  if (code >= 500) return COLOR.red;
  if (code >= 400) return COLOR.yellow;
  if (code >= 300) return COLOR.cyan;
  return COLOR.green;
}

/** Format timestamp singkat: HH:MM:SS */
function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

/**
 * Middleware logger.
 * Mencatat setiap request setelah response selesai dikirim
 * (event 'finish') agar status code & durasi sudah tersedia.
 */
function requestLogger(req, res, next) {
  // Di production tidak perlu log per-request (gunakan tool seperti PM2/Winston)
  if (process.env.NODE_ENV === 'production') return next();

  const start  = Date.now();
  const method = req.method.padEnd(6);

  res.on('finish', () => {
    const ms    = Date.now() - start;
    const code  = res.statusCode;
    const color = statusColor(code);

    console.log(
      `  ${COLOR.dim}${timestamp()}${COLOR.reset}` +
      `  ${COLOR.cyan}${method}${COLOR.reset}` +
      `  ${COLOR.white}${req.originalUrl}${COLOR.reset}` +
      `  ${color}${code}${COLOR.reset}` +
      `  ${COLOR.dim}${ms}ms${COLOR.reset}`
    );
  });

  next();
}

module.exports = { requestLogger };
