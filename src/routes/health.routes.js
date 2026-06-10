/**
 * ─────────────────────────────────────────────
 *  routes/health.routes.js
 *  Endpoint diagnostik untuk memverifikasi bahwa
 *  server berjalan dan dependency tersedia.
 *  Berguna untuk monitoring, load balancer, Docker HEALTHCHECK.
 * ─────────────────────────────────────────────
 */

'use strict';

const { Router }         = require('express');
const { checkDependencies } = require('../controllers/health.controller');

const router = Router();

// GET /api/health
// Cek status server + dependency eksternal (yt-dlp, ffmpeg)
router.get('/', checkDependencies);

module.exports = router;
