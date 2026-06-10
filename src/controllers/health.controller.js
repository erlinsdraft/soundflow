/**
 * ─────────────────────────────────────────────
 *  controllers/health.controller.js
 *  Cek ketersediaan yt-dlp dan ffmpeg di sistem.
 *  Digunakan untuk monitoring dan debugging awal.
 * ─────────────────────────────────────────────
 */

'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Jalankan perintah dan kembalikan versinya,
 * atau pesan error jika tidak ditemukan.
 */
async function checkBinary(cmd, args) {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 5000 });
    return { available: true, version: stdout.trim().split('\n')[0] };
  } catch {
    return { available: false, version: null };
  }
}

/**
 * GET /api/health
 * Response: { status, uptime, dependencies: { ytDlp, ffmpeg } }
 */
async function checkDependencies(req, res, next) {
  try {
    const [ytDlp, ffmpeg] = await Promise.all([
      checkBinary('yt-dlp', ['--version']),
      checkBinary('ffmpeg', ['-version']),
    ]);

    const allOk = ytDlp.available && ffmpeg.available;

    res.status(allOk ? 200 : 503).json({
      success   : allOk,
      status    : allOk ? 'ok' : 'degraded',
      uptime    : Math.floor(process.uptime()),
      timestamp : new Date().toISOString(),
      dependencies: { ytDlp, ffmpeg },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkDependencies };
