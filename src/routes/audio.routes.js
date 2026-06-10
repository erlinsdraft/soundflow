/**
 * ─────────────────────────────────────────────
 *  routes/audio.routes.js
 *  Semua route yang berhubungan dengan audio.
 *  Route hanya mendefinisikan path + method —
 *  logika bisnis ada di controller.
 * ─────────────────────────────────────────────
 */

'use strict';

const { Router } = require('express');
const {
  downloadAudio,
  getJobStatus,
  cancelJob,
  getVideoInfo,
} = require('../controllers/audio.controller');

const router = Router();

// ─── POST /api/audio/download ─────────────────
// Body: { url, startTime?, endTime?, bitrate? }
// Mulai proses download + konversi MP3
router.post('/download', downloadAudio);

// ─── GET /api/audio/video-info ──────────────
// Ambil metadata YouTube tanpa download atau konversi
router.get('/video-info', getVideoInfo);

// ─── GET /api/audio/status/:jobId ─────────────
// Polling status job yang sedang berjalan
// (opsional — berguna untuk progress bar realtime)
router.get('/status/:jobId', getJobStatus);

// ─── DELETE /api/audio/cancel/:jobId ──────────
// Batalkan job yang sedang berjalan + bersihkan temp files
router.delete('/cancel/:jobId', cancelJob);

module.exports = router;
