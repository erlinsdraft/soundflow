/**
 * SoundFlow — Frontend Logic
 * Kirim request ke backend, tampilkan status, trigger download.
 */

const urlInput      = document.getElementById('urlInput');
const startInput    = document.getElementById('startTime');
const endInput      = document.getElementById('endTime');
const bitrateEl     = document.getElementById('bitrate');
const btn           = document.getElementById('downloadBtn');
const statusEl      = document.getElementById('status');
const videoInfoEl   = document.getElementById('videoInfo');
const thumbEl       = document.getElementById('videoThumbnail');
const titleEl       = document.getElementById('videoTitle');
const uploaderEl    = document.getElementById('videoUploader');
const durationEl    = document.getElementById('videoDuration');
const toastContainer = document.getElementById('toastContainer');
const buttonLabel    = btn.querySelector('.button-label');

let toastTimerId = 0;

function setStatus(msg, type = 'info') {
  statusEl.textContent = msg;
  statusEl.className   = `status ${type}`;
  statusEl.classList.remove('hidden');
  showToast(msg, type);
}

function showToast(message, type = 'info') {
  if (!toastContainer || !message) return;

  window.clearTimeout(toastTimerId);
  toastContainer.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<p>${escapeHtml(message)}</p>`;
  toastContainer.appendChild(toast);

  toastTimerId = window.setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, type === 'error' ? 5200 : 3400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setLoading(isLoading, label = 'Download MP3') {
  btn.disabled = isLoading;
  btn.classList.toggle('is-loading', isLoading);
  if (buttonLabel) buttonLabel.textContent = label;
}

function clearVideoInfo() {
  videoInfoEl.style.display = 'none';
  thumbEl.src = '';
  thumbEl.alt = 'Thumbnail video';
  titleEl.textContent = '';
  uploaderEl.textContent = '';
  durationEl.textContent = '';
}

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return 'Durasi tidak tersedia';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')} menit`;
}

function showVideoInfo({ title, thumbnail, duration, uploader }) {
  titleEl.textContent = title || 'Judul tidak tersedia';
  uploaderEl.textContent = uploader ? `Uploader: ${uploader}` : 'Uploader tidak tersedia';
  durationEl.textContent = `Durasi: ${formatDuration(duration)}`;

  if (thumbnail) {
    thumbEl.src = thumbnail;
    thumbEl.alt = title || 'Video thumbnail';
    thumbEl.style.display = 'block';
  } else {
    thumbEl.style.display = 'none';
  }

  videoInfoEl.style.display = 'grid';
}

btn.addEventListener('click', async () => {
  const url       = urlInput.value.trim();
  const startTime = parseInt(startInput.value) || 0;
  const endTime   = parseInt(endInput.value)   || null;
  const bitrate   = parseInt(bitrateEl.value);

  if (!url) {
    setStatus('Masukkan URL YouTube terlebih dahulu.', 'error');
    return;
  }

  setLoading(true, 'Checking link...');
  setStatus('Mengambil metadata...', 'info');
  clearVideoInfo();

  try {
    const params = new URLSearchParams({ url });
    const res    = await fetch(`/api/audio/video-info?${params}`);
    const data   = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengambil metadata');
    }

    showVideoInfo(data.data);
    setStatus('Metadata berhasil dimuat.', 'success');
    // Setelah metadata dimuat, langsung minta backend mendownload audio
    try {
      setLoading(true, 'Preparing MP3...');
      setStatus('Memulai download audio...', 'info');

      const payload = { url, startTime, endTime, bitrate };
      console.log('DOWNLOAD PAYLOAD', payload);

      const dlRes = await fetch('/api/audio/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Jika backend mengembalikan JSON (error), parse dan tampilkan
      const contentType = dlRes.headers.get('Content-Type') || '';
      if (!dlRes.ok) {
        if (contentType.includes('application/json')) {
          const errJson = await dlRes.json();
          throw new Error(errJson.error || JSON.stringify(errJson));
        }
        throw new Error(`Server responded with status ${dlRes.status}`);
      }

      // Terima sebagai Blob dan trigger download
      const blob = await dlRes.blob();

      // Determine filename from Content-Disposition header if present
      const disposition = dlRes.headers.get('Content-Disposition') || '';
      let filename = `soundflow-${Date.now()}`;
      const fnMatch = /filename\*?=(?:UTF-8''?)?"?([^;"\\s]+)"?/i.exec(disposition);
      if (fnMatch && fnMatch[1]) {
        try { filename = decodeURIComponent(fnMatch[1]); } catch (e) { filename = fnMatch[1]; }
      }

      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObj);
      a.remove();

      setStatus('Download berhasil. File akan terunduh otomatis.', 'success');
    } catch (dlErr) {
      setStatus(`Gagal: ${dlErr.message}`, 'error');
    } finally {
      setLoading(false);
    }
  } catch (err) {
    setStatus(`Gagal: ${err.message}`, 'error');
    setLoading(false);
  } finally {
    // btn.disabled handled inside download block to avoid re-enabling too early
  }
});
