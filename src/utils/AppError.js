/**
 * ─────────────────────────────────────────────
 *  utils/AppError.js
 *  Custom error class agar setiap error yang
 *  dilempar di dalam aplikasi bisa membawa
 *  HTTP status code-nya sendiri.
 *
 *  Contoh penggunaan:
 *    throw new AppError('URL tidak valid', 400);
 *    throw new AppError('Forbidden', 403);
 * ─────────────────────────────────────────────
 */

'use strict';

class AppError extends Error {
  /**
   * @param {string} message    - Pesan error yang akan dikirim ke client
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name       = 'AppError';
    this.statusCode = statusCode;

    // Pastikan stack trace menunjuk ke pemanggil, bukan ke constructor ini
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
