/**
 * ─────────────────────────────────────────────
 *  controllers/audio.controller.js
 *  Orkestrator alur download audio:
 *  validasi → download → konversi → kirim → cleanup.
 *
 *  Job registry (Map) menyimpan status setiap
 *  proses agar bisa di-polling atau di-cancel.
 * ─────────────────────────────────────────────
 */

'use strict';

const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateDownloadInput, validateVideoInfoQuery } = require('../utils/validator');
const { removeFiles }                                     = require('../utils/fileCleanup');
const AppError                                            = require('../utils/AppError');
const fs = require('fs');

const ytDlpService = require('../services/ytdlp.service');
const ffmpegService = require('../services/ffmpeg.service');

// ─── Job Registry ─────────────────────────────
// Menyimpan status setiap job download in-memory.
// Key: jobId (UUID), Value: { status, rawPath, mp3Path, error }
//
// Catatan: di production, gunakan Redis agar persist
// jika server restart atau di-scale horizontal.
const jobRegistry = new Map();

/** Status yang mungkin dimiliki sebuah job */
const JOB_STATUS = {
  PENDING    : 'pending',
  DOWNLOADING: 'downloading',
  CONVERTING : 'converting',
  DONE       : 'done',
  FAILED     : 'failed',
  CANCELLED  : 'cancelled',
};

/** Buat entry baru di registry */
function createJob(jobId) {
  const job = {
    id        : jobId,
    status    : JOB_STATUS.PENDING,
    rawPath   : null,
    mp3Path   : null,
    error     : null,
    createdAt : new Date().toISOString(),
  };
  jobRegistry.set(jobId, job);
  return job;
}

// ─── Bersihkan job lama dari registry (> 1 jam) ───
// Mencegah Map tumbuh tak terbatas di proses panjang
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobRegistry.entries()) {
    if (new Date(job.createdAt).getTime() < oneHourAgo) {
      jobRegistry.delete(id);
    }
  }
}, 30 * 60 * 1000);


// ──────────────────────────────────────────────
//  GET /api/audio/video-info
// ──────────────────────────────────────────────
async function getVideoInfo(req, res, next) {
  const { value, error } = validateVideoInfoQuery(req.query);
  if (error) {
    const err = new AppError('URL tidak valid', 400);
    err.details = error.details;
    return next(err);
  }

  try {
    const videoInfo = await ytDlpService.getVideoInfo(value.url);
    return res.json({ success: true, data: videoInfo });
  } catch (err) {
    return next(err);
  }
}

// ──────────────────────────────────────────────
//  POST /api/audio/download
// ──────────────────────────────────────────────
async function downloadAudio(req, res, next) {
  // 1. Debug: tunjukkan payload mentah dari client
  console.log('[audio.controller] raw request body:', req.body);

  // 2. Validasi input
  const { value, error } = validateDownloadInput(req.body);
  if (error) {
    // Lempar sebagai AppError dengan detail Joi
    const err     = new AppError('Input tidak valid', 400);
    err.details   = error.details;
    return next(err);
  }

  const { url, startTime, endTime, bitrate } = value;
  const jobId   = uuidv4();
  const tempDir = path.resolve(process.env.TEMP_DIR || 'temp');

  console.log('CONTROLLER INPUT', {
    startTime,
    endTime,
    bitrate
  });

  // Path file sementara — menggunakan jobId agar unik per request
  const rawPath = path.join(tempDir, `${jobId}.raw`);  // akan diisi yt-dlp
  const mp3Path = path.join(tempDir, `${jobId}.mp3`);

  const job = createJob(jobId);
  job.rawPath = rawPath;
  job.mp3Path = mp3Path;

  try {
    // ── 2. Download audio via yt-dlp (audio-only, no ffmpeg) ──────────────
    job.status = JOB_STATUS.DOWNLOADING;
    await fs.promises.mkdir(tempDir, { recursive: true });

    const downloadedPath = await ytDlpService.downloadAudio(url, tempDir, jobId);
    job.rawPath = downloadedPath;

    // ── 3. Convert downloaded audio to MP3 using ffmpeg service ─────────
    job.status = JOB_STATUS.CONVERTING;
    const convertedPath = await ffmpegService.convertToMp3({
      inputPath : downloadedPath,
      outputPath: mp3Path,
      startTime : startTime || 0,
      endTime   : endTime,
      bitrate   : bitrate || 192,
    });
    job.mp3Path = convertedPath;

    job.status = JOB_STATUS.DONE;

    const outFilename = `soundflow-${jobId.slice(0, 8)}.mp3`;

    return res.download(job.mp3Path, outFilename, async (err) => {
      // Always attempt cleanup whether download succeeded or failed
      await removeFiles(job.rawPath, job.mp3Path);
      if (err && !res.headersSent) return next(err);
    });

  } catch (err) {
    job.status = JOB_STATUS.FAILED;
    job.error  = err.message;

    // Cleanup temp files jika ada yang sudah terbuat
    await removeFiles(job.rawPath, job.mp3Path);

    next(err);
  }
}


// ──────────────────────────────────────────────
//  GET /api/audio/status/:jobId
// ──────────────────────────────────────────────
function getJobStatus(req, res, next) {
  const { jobId } = req.params;
  const job       = jobRegistry.get(jobId);

  if (!job) {
    return next(new AppError(`Job '${jobId}' tidak ditemukan`, 404));
  }

  // Jangan ekspos path file ke client
  const { rawPath, mp3Path, ...safeJob } = job; // eslint-disable-line no-unused-vars

  res.json({ success: true, job: safeJob });
}


// ──────────────────────────────────────────────
//  DELETE /api/audio/cancel/:jobId
// ──────────────────────────────────────────────
async function cancelJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const job       = jobRegistry.get(jobId);

    if (!job) {
      return next(new AppError(`Job '${jobId}' tidak ditemukan`, 404));
    }

    if (job.status === JOB_STATUS.DONE || job.status === JOB_STATUS.CANCELLED) {
      return res.json({ success: true, message: `Job sudah dalam status '${job.status}'` });
    }

    job.status = JOB_STATUS.CANCELLED;

    // Bersihkan file temp yang mungkin sudah terbuat
    await removeFiles(job.rawPath, job.mp3Path);

    res.json({ success: true, message: 'Job berhasil dibatalkan', jobId });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  downloadAudio,
  getVideoInfo,
  getJobStatus,
  cancelJob
};
