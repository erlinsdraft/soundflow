/**
 * ─────────────────────────────────────────────
 *  services/ytdlp.service.js
 *  Wrapper yt-dlp — akan diimplementasikan di
 *  iterasi berikutnya bersama ffmpeg.service.js.
 * ─────────────────────────────────────────────
 */

'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path      = require('path');

/**
 * Download audio dari YouTube menggunakan yt-dlp.
 *
 * @param {string} url       - URL YouTube
 * @param {string} outputDir - Folder tujuan (temp/)
 * @param {string} jobId     - UUID job untuk nama file unik
 * @returns {Promise<string>} - Path file audio yang diunduh
 */
async function download(url, outputDir, jobId) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, `${jobId}.%(ext)s`);

    const args = [
      '--no-playlist',
      '--extract-audio',
      '--audio-quality', '0',
      '--output', outputTemplate,
      '--no-progress',
      '--quiet',
      url,
    ];

    const proc = spawn('yt-dlp', args);
    let stderr  = '';

    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
      // yt-dlp menulis ekstensi file sesuai format sumber — return path glob-nya
      resolve(outputDir); // controller akan mencari file berdasarkan jobId
    });

    proc.on('error', (err) => {
      reject(new Error(`yt-dlp tidak ditemukan. Pastikan yt-dlp terinstall: ${err.message}`));
    });
  });
}

/**
 * Download audio only (bestaudio) and return the downloaded file path.
 * This avoids post-processing with ffmpeg (no --extract-audio).
 *
 * @param {string} url
 * @param {string} outputDir
 * @param {string} jobId
 * @returns {Promise<string>} absolute path to downloaded file
 */
async function downloadAudio(url, outputDir, jobId) {
  if (!url || typeof url !== 'string') throw new Error('Invalid URL');

  await fs.promises.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, `${jobId}.%(ext)s`);
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--no-progress',
      '--quiet',
      '-f', 'bestaudio',
      '--output', outputTemplate,
      url,
    ];

    const proc = spawn('yt-dlp', args);
    let stderr = '';

    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
      }

      // Find the downloaded file by jobId prefix
      try {
        const files = await fs.promises.readdir(outputDir);
        const match = files.find((f) => f.startsWith(`${jobId}.`));
        if (!match) return reject(new Error('Downloaded file not found'));
        resolve(path.join(outputDir, match));
      } catch (err) {
        reject(new Error(`Failed to locate downloaded file: ${err.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`yt-dlp not found or failed to start: ${err.message}`));
    });
  });
}

async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '-j',
      '--no-playlist',
      '--skip-download',
      '--no-warnings',
      '--quiet',
      url,
    ];

    const proc = spawn('yt-dlp', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim() || 'unknown error'}`));
      }

      try {
        const metadata = JSON.parse(stdout);
        resolve({
          title     : metadata.title || null,
          thumbnail : metadata.thumbnail || null,
          duration  : typeof metadata.duration === 'number' ? metadata.duration : null,
          uploader  : metadata.uploader || null,
        });
      } catch (parseError) {
        reject(new Error(`Gagal memproses metadata yt-dlp: ${parseError.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`yt-dlp tidak ditemukan. Pastikan yt-dlp terinstall dan dapat dijalankan: ${err.message}`));
    });
  });
}

module.exports = { download, downloadAudio, getVideoInfo };
