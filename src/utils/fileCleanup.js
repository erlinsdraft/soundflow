/**
 * ─────────────────────────────────────────────
 *  utils/fileCleanup.js
 *  Hapus file-file sementara dari folder temp/.
 *  Dipanggil setelah download selesai atau saat error.
 * ─────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Hapus satu file secara async.
 * Tidak melempar error jika file sudah tidak ada (idempotent).
 *
 * @param {string} filePath - Path absolut atau relatif ke file
 * @returns {Promise<void>}
 */
async function removeFile(filePath) {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
    console.log(`  [Cleanup] Deleted: ${path.basename(filePath)}`);
  } catch (err) {
    // ENOENT = file memang sudah tidak ada — tidak perlu di-throw
    if (err.code !== 'ENOENT') {
      console.warn(`  [Cleanup] Could not delete ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Hapus sekumpulan file sekaligus (paralel).
 *
 * @param {...string} filePaths - Satu atau lebih path file
 * @returns {Promise<void>}
 */
async function removeFiles(...filePaths) {
  await Promise.all(filePaths.filter(Boolean).map(removeFile));
}

/**
 * Bersihkan semua file di folder temp/ yang lebih tua dari maxAgeMs.
 * Bisa dijadikan scheduled job untuk mencegah penumpukan file.
 *
 * @param {string} tempDir   - Path folder temp
 * @param {number} maxAgeMs  - Usia maksimum file dalam ms (default: 1 jam)
 * @returns {Promise<void>}
 */
async function cleanOldTempFiles(
  tempDir = process.env.TEMP_DIR || 'temp',
  maxAgeMs = 60 * 60 * 1000
) {
  const dir = path.resolve(tempDir);

  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return; // Folder belum ada — tidak apa-apa
  }

  const now     = Date.now();
  const targets = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(dir, entry.name);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) targets.push(fullPath);
    } catch {
      // File sudah hilang saat di-stat — lewati
    }
  }

  if (targets.length > 0) {
    console.log(`  [Cleanup] Removing ${targets.length} stale temp file(s)...`);
    await removeFiles(...targets);
  }
}

module.exports = { removeFile, removeFiles, cleanOldTempFiles };
