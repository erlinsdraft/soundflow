/**
 * ─────────────────────────────────────────────
 *  middleware/notFoundHandler.js
 *  Tangkap semua request ke route yang tidak ada.
 *  Dipasang SETELAH semua route, SEBELUM errorHandler.
 * ─────────────────────────────────────────────
 */

'use strict';

function notFoundHandler(req, res, next) {
  // Hanya berlaku untuk request ke /api — bukan file statis
  if (!req.originalUrl.startsWith('/api')) return next();

  const err       = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode  = 404;
  next(err);
}

module.exports = { notFoundHandler };
