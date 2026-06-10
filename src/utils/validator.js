/**
 * ─────────────────────────────────────────────
 *  utils/validator.js
 *  Validasi input dari user menggunakan Joi.
 *  Semua schema validasi dikumpulkan di sini.
 * ─────────────────────────────────────────────
 */

'use strict';

const Joi = require('joi');

// ─── Pattern URL YouTube yang valid ───────────────
// Mendukung format:
//   https://www.youtube.com/watch?v=XXXXXXXXXXX
//   https://youtu.be/XXXXXXXXXXX
//   https://youtube.com/watch?v=XXXXXXXXXXX&list=...
//   https://m.youtube.com/watch?v=XXXXXXXXXXX
const YT_PATTERN = /^https?:\/\/(www\.|m\.)?youtube\.com\/watch\?.*v=[\w-]{11}|^https?:\/\/youtu\.be\/[\w-]{11}/;

/**
 * Schema validasi untuk endpoint POST /api/audio/download.
 *
 * Aturan:
 *  - url      : wajib, harus cocok dengan pola YouTube
 *  - startTime: opsional, detik (integer ≥ 0), default 0
 *  - endTime  : opsional, detik (integer > startTime)
 *  - bitrate  : opsional, salah satu dari [128, 192, 256, 320], default 192
 */
const downloadSchema = Joi.object({
  url: Joi.string()
    .pattern(YT_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'URL harus berupa link YouTube yang valid (youtube.com atau youtu.be)',
      'any.required'       : 'URL YouTube wajib diisi',
    }),

  startTime: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min'    : 'startTime tidak boleh negatif',
      'number.integer': 'startTime harus bilangan bulat (detik)',
    }),

  endTime: Joi.number()
    .integer()
    .min(1)
    .greater(Joi.ref('startTime'))
    .optional()
    .allow(null)
    .messages({
      'number.greater': 'endTime harus lebih besar dari startTime',
      'number.min'    : 'endTime minimal 1 detik',
    }),

  bitrate: Joi.number()
    .valid(128, 192, 256, 320)
    .default(parseInt(process.env.DEFAULT_BITRATE) || 192)
    .messages({
      'any.only': 'Bitrate harus salah satu dari: 128, 192, 256, 320 kbps',
    }),
});

/**
 * Validasi data input download.
 * @param {object} data - Body request dari user
 * @returns {{ value: object, error: Joi.ValidationError|undefined }}
 */
function validateDownloadInput(data) {
  return downloadSchema.validate(data, {
    abortEarly  : false, // kumpulkan semua error sekaligus, bukan berhenti di error pertama
    stripUnknown: true,  // buang field yang tidak ada di schema
  });
}

const videoInfoSchema = Joi.object({
  url: Joi.string()
    .pattern(YT_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'URL harus berupa link YouTube yang valid (youtube.com atau youtu.be)',
      'any.required'       : 'URL YouTube wajib diisi',
    }),
});

function validateVideoInfoQuery(data) {
  return videoInfoSchema.validate(data, {
    abortEarly  : false,
    stripUnknown: true,
  });
}

module.exports = { validateDownloadInput, validateVideoInfoQuery };
