# 🎵 SoundFlow

SoundFlow adalah aplikasi web berbasis Node.js yang memungkinkan pengguna mengunduh audio dari video YouTube, melakukan trimming (pemotongan audio), dan mengekspor hasilnya ke format MP3 secara otomatis.

##  Fitur Utama

* Mengambil metadata video YouTube
* Menampilkan thumbnail video
* Menampilkan judul, durasi, dan channel video
* Download audio dari YouTube menggunakan yt-dlp
* Konversi audio ke format MP3 menggunakan FFmpeg
* Trimming audio berdasarkan waktu mulai dan waktu akhir
* Pemilihan bitrate audio
* Download file MP3 secara otomatis melalui browser

---

##  Teknologi yang Digunakan

### Backend

* Node.js
* Express.js
* yt-dlp
* FFmpeg
* UUID

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

---

## 📂 Struktur Project

```text
soundflow/
│
├── public/
│   ├── index.html
│   ├── css/
│   ├── js/
│
├── src/
│   ├── controllers/
│   │   └── audio.controller.js
│   │
│   ├── services/
│   │   ├── ytdlp.service.js
│   │   └── ffmpeg.service.js
│   │
│   ├── routes/
│   │   └── audio.routes.js
│   │
│   ├── middleware/
│   ├── utils/
│   └── app.js
│
├── temp/
├── package.json
└── README.md
```

---

## Cara Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/soundflow.git
cd soundflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install yt-dlp

Pastikan yt-dlp sudah terinstall dan dapat dijalankan melalui terminal.

Verifikasi:

```bash
yt-dlp --version
```

### 4. Install FFmpeg

Download FFmpeg dari:

https://ffmpeg.org/download.html

atau

https://www.gyan.dev/ffmpeg/builds/

Pastikan file berikut tersedia:

```text
C:\ffmpeg\bin\ffmpeg.exe
C:\ffmpeg\bin\ffprobe.exe
```

Verifikasi:

```bash
ffmpeg -version
```

---

## Menjalankan Aplikasi

Jalankan server:

```bash
npm start
```

Server akan berjalan pada:

```text
http://localhost:3000
```

---

## Cara Penggunaan

1. Masukkan URL video YouTube.
2. Tunggu metadata video muncul.
3. Tentukan:

   * Start Time
   * End Time
   * Bitrate
4. Klik tombol Download.
5. Sistem akan:

   * Mengunduh audio
   * Mengonversi ke MP3
   * Melakukan trimming
   * Mengirim hasil ke browser
6. File MP3 akan otomatis terunduh.

---

##  Alur Sistem

```text
User
  │
  ▼
Frontend
  │
  ▼
YouTube URL
  │
  ▼
Express Backend
  │
  ├── yt-dlp
  │      │
  │      ▼
  │  Download Audio
  │
  └── FFmpeg
         │
         ▼
    Trim & Convert MP3
         │
         ▼
     Browser Download
```

---

##  Endpoint API

### Ambil Metadata Video

```http
GET /api/audio/video-info
```

Query:

```text
?url=https://youtube.com/watch?v=xxxx
```

---

### Download Audio

```http
POST /api/audio/download
```

Body:

```json
{
  "url": "https://youtube.com/watch?v=xxxx",
  "startTime": 30,
  "endTime": 60,
  "bitrate": 192
}
```

---

##  Contoh Penggunaan Trimming

Input:

```text
Start Time = 30
End Time = 60
```

Output:

```text
Durasi MP3 = 30 detik
```

Audio yang dihasilkan hanya berisi bagian video dari detik ke-30 hingga detik ke-60.

---

##  Catatan

* Aplikasi memerlukan koneksi internet untuk mengakses video YouTube.
* yt-dlp dan FFmpeg harus terinstall dengan benar.
* File sementara akan disimpan di folder `temp`.
* File sementara akan dihapus otomatis setelah proses selesai.

---

## Pengembang

Proyek ini dikembangkan sebagai tugas akhir/proyek mata kuliah Jaringan Multimedia.

Nama: Erlinda Rahmadina Aromi

NRP : 5124500025

Program Studi: D3 Teknologi Multimedia Broadcasting

Politeknik Elektronika Negeri Surabaya (PENS)

---

##  Lisensi

Proyek ini dibuat untuk tujuan pembelajaran dan akademik.

```
```
