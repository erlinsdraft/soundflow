/**
 * ─────────────────────────────────────────────
 *  SoundFlow — Entry Point (app.js)
 *  Tanggung jawab: inisialisasi Express, pasang
 *  semua middleware & route, lalu jalankan server.
 * ─────────────────────────────────────────────
 */

'use strict';

// 1. Load environment variables PERTAMA — sebelum module lain dibaca
require('dotenv').config();

const express  = require('express');
const path     = require('path');

// Layer middleware custom
const { requestLogger }  = require('./middleware/logger');
const { rateLimiter }    = require('./middleware/rateLimiter');
const { errorHandler }   = require('./middleware/errorHandler');
const { notFoundHandler} = require('./middleware/notFoundHandler');

// Route modules
const audioRoutes  = require('./routes/audio.routes');
const healthRoutes = require('./routes/health.routes');

// ─── Buat instance Express ────────────────────
const app = express();

// ─── Middleware Global ────────────────────────
require('./config/middleware')(app);

// ─── Static Files ─────────────────────────────
// Sajikan folder public/ agar browser bisa mengakses HTML/CSS/JS
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Request Logger (dev only) ────────────────
app.use(requestLogger);

// ─── Rate Limiter ─────────────────────────────
app.use('/api', rateLimiter);

// ─── Routes ───────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/audio',  audioRoutes);

// ─── Fallback: kirim index.html untuk non-API route ──
// Berguna jika nantinya menggunakan client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── 404 Handler ─────────────────────────────
// Harus dipasang SETELAH semua route
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────
// Harus dipasang PALING AKHIR — Express mendeteksi
// error handler dari jumlah parameter (err, req, res, next)
app.use(errorHandler);

// ─── Jalankan Server ──────────────────────────
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  🎵  SoundFlow is running');
  console.log(`  ➜   Local:   http://localhost:${PORT}`);
  console.log(`  ➜   Mode:    ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

// ─── Graceful Shutdown ────────────────────────
// Tangkap sinyal SIGTERM (Docker/PM2) dan SIGINT (Ctrl+C)
// agar server bisa menyelesaikan request yang sedang berjalan
// sebelum proses benar-benar berhenti.
const shutdown = (signal) => {
  console.log(`\n  [Server] ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('  [Server] All connections closed. Goodbye.\n');
    process.exit(0);
  });

  // Paksa keluar setelah 10 detik jika ada request yang menggantung
  setTimeout(() => {
    console.error('  [Server] Force exit after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Tangkap unhandled promise rejection agar server tidak crash diam-diam
process.on('unhandledRejection', (reason) => {
  console.error('  [Server] Unhandled Rejection:', reason);
});

module.exports = app; // ekspor untuk keperluan testing
