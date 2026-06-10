/**
 * ─────────────────────────────────────────────
 *  config/middleware.js
 *  Konfigurasi terpusat semua middleware Express.
 *  Dipanggil sekali dari app.js saat startup.
 * ─────────────────────────────────────────────
 */

'use strict';

const express = require('express');
const cors    = require('cors');

/**
 * Daftar origin yang diizinkan mengakses API.
 * Di production, ganti dengan domain asli Anda.
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

module.exports = function applyMiddleware(app) {

  // ── 1. Security Headers (manual, tanpa helmet) ────────────────
  // Tambahkan header keamanan dasar di setiap response
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // ── 2. CORS ───────────────────────────────────────────────────
  // Mengizinkan browser dari origin tertentu mengakses API ini.
  // credentials: true diperlukan jika nanti menggunakan cookie/session.
  const corsOptions = {
    origin(origin, callback) {
      // Izinkan request tanpa origin (Postman, curl, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
    methods:          ['GET', 'POST', 'DELETE'],
    allowedHeaders:   ['Content-Type', 'Accept'],
    credentials:      true,
  };
  app.use(cors(corsOptions));

  // ── 3. Body Parsers ───────────────────────────────────────────
  // Parse body JSON — batas ukuran diambil dari .env
  const limitMb = `${process.env.BODY_LIMIT_MB || 5}mb`;
  app.use(express.json({ limit: limitMb }));

  // Parse body application/x-www-form-urlencoded (form HTML biasa)
  app.use(express.urlencoded({ extended: true, limit: limitMb }));

  // ── 4. Trust Proxy ────────────────────────────────────────────
  // Diperlukan saat aplikasi berjalan di balik reverse proxy
  // (Nginx, Caddy, dll) agar req.ip menunjuk ke IP client asli,
  // bukan IP proxy. Jangan aktifkan jika tidak pakai proxy.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
};
