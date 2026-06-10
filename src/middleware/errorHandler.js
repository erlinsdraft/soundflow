/**
 * ─────────────────────────────────────────────
 *  middleware/errorHandler.js
 *  Error handler global Express.
 *  Dipasang PALING AKHIR di app.js (setelah routes).
 *  Menangkap semua error yang di-throw atau di-pass
 *  via next(err) dari middleware/route manapun.
 * ─────────────────────────────────────────────
 */

'use strict';

/**
 * Peta error khusus ke HTTP status code.
 * Key = nama error class atau string kustom.
 */
const ERROR_STATUS_MAP = {
  ValidationError : 400,  // Joi / input tidak valid
  CastError       : 400,  // format data salah
  UnauthorizedError: 401,
  ForbiddenError  : 403,
  NotFoundError   : 404,
  RateLimitError  : 429,
};

/**
 * Tentukan status code dari objek error.
 * Urutan prioritas: statusCode property → map nama class → 500
 */
function resolveStatus(err) {
  if (err.statusCode && err.statusCode >= 100) return err.statusCode;
  if (err.status     && err.status     >= 100) return err.status;
  return ERROR_STATUS_MAP[err.name] || 500;
}

/**
 * Format response error yang konsisten di seluruh aplikasi.
 *
 * Production : sembunyikan pesan teknis — cukup "Internal Server Error"
 * Development: tampilkan pesan lengkap + stack trace
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isDev    = process.env.NODE_ENV !== 'production';
  const status   = resolveStatus(err);

  // Log error ke console (bisa diganti Winston/Pino di production)
  if (status >= 500) {
    console.error(`  [Error] ${req.method} ${req.originalUrl}`);
    console.error(`          Status : ${status}`);
    console.error(`          Message: ${err.message}`);
    if (isDev) console.error(err.stack);
  } else {
    // 4xx tidak perlu stack trace
    console.warn(`  [Warn]  ${req.method} ${req.originalUrl} → ${status}: ${err.message}`);
  }

  // Jangan kirim response jika header sudah terkirim
  if (res.headersSent) return next(err);

  const body = {
    success : false,
    error   : status >= 500 && !isDev
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred',
  };

  // Sertakan stack hanya di development
  if (isDev && err.stack) {
    body.stack = err.stack.split('\n').map(l => l.trim());
  }

  // Sertakan detail validasi Joi jika ada
  if (err.details) {
    body.details = err.details.map(d => d.message);
  }

  res.status(status).json(body);
}

module.exports = { errorHandler };
