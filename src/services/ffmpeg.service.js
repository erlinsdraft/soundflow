/**
 * ─────────────────────────────────────────────
 *  services/ffmpeg.service.js
 *  Wrapper fluent-ffmpeg untuk konversi audio
 *  dan trimming sebelum ekspor ke MP3.
 * ─────────────────────────────────────────────
 */

'use strict';

const ffmpeg = require('fluent-ffmpeg');

// Gunakan path FFmpeg/FFprobe langsung agar tidak bergantung pada PATH Windows
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ffmpeg\\bin\\ffprobe.exe');

/**
 * Konversi file audio ke MP3 dengan opsi trimming.
 *
 * @param {object} options
 * @param {string}  options.inputPath  - Path file audio sumber
 * @param {string}  options.outputPath - Path file MP3 tujuan
 * @param {number}  options.startTime  - Mulai dari detik ke-N (default: 0)
 * @param {number}  [options.endTime]  - Akhir di detik ke-N (opsional)
 * @param {number}  options.bitrate    - Bitrate kbps (128/192/256/320)
 * @returns {Promise<string>}          - Path output MP3
 */
async function convertToMp3({ inputPath, outputPath, startTime = 0, endTime, bitrate = 192 }) {
  return new Promise((resolve, reject) => {
    // Coerce to numbers and compute trim duration
    const s = Number(startTime) || 0;
    const e = typeof endTime !== 'undefined' && endTime !== null ? Number(endTime) : undefined;
    const duration = (typeof e === 'number' && !Number.isNaN(e) && e > s) ? (e - s) : undefined;

    console.log('[ffmpeg.service] convertToMp3 params:', { inputPath, outputPath, startTime: s, endTime: e, duration, bitrate });

    let cmd = ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .format('mp3');

    // Gunakan input/output options untuk trimming agar lebih deterministik
    if (s > 0) {
      cmd = cmd.inputOptions(`-ss ${s}`);
    }

    if (typeof duration === 'number') {
      cmd = cmd.outputOptions(`-t ${duration}`);
    }

    cmd
      .on('start', (cmdline) => console.log('[ffmpeg] spawn command:', cmdline))
      .on('stderr', (line) => console.log('[ffmpeg] stderr:', line))
      .output(outputPath)
      .on('end', () => {
        console.log('[ffmpeg.service] conversion finished:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('[ffmpeg.service] conversion error:', err.message);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .run();
  });
}

module.exports = { convertToMp3 };
