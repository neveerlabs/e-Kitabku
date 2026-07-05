<h1 align="center">Kitabku Editor</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.8.5-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/backend-Express.js-000000.svg" alt="Backend">
  <img src="https://img.shields.io/badge/frontend-React.js-61DAFB.svg" alt="Frontend">
</p>

**Kitabku Editor** adalah aplikasi desktop berbasis web untuk mengelola konten Kitabku (`data.json`) dengan mudah. Dilengkapi dengan **real-time preview** yang mensimulasikan tampilan mobile website Kitabku, serta **sinkronisasi otomatis ke GitHub** untuk kolaborasi dan backup.

> **Live Demo:** [neveerlabs.github.io/Kitabku](https://neveerlabs.github.io/Kitabku)

---

## ✨ Fitur Utama

- **Edit Konten** — Tambah, ubah, hapus Bab & Topik dengan antarmuka yang intuitif.
- **Real-time Preview** — Hasil akhir persis seperti tampilan mobile website Kitabku.
- **Tag Kitab** — Kelola referensi kitab kuning dengan modal popup interaktif.
- **Preview Media** — Dukungan untuk gambar dan video dengan navigasi carousel.
- **Sinkronisasi GitHub** — Simpan perubahan langsung ke repository GitHub secara otomatis (opsional).
- **Tailwind CSS** — Tampilan modern dan responsif.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS + Lucide Icons |
| **Backend** | Node.js + Express.js + Axios |
| **Integrasi** | GitHub API (sync otomatis) |
| **Markup** | HTML + CSS custom |
| **Lainnya** | dotenv, cors, chalk |

---

## 🚀 Tata Cara Setup

### 1. Clone Repository
```bash
git clone https://github.com/neveerlabs/e-Kitabku.git
cd e-Kitabku
```

### 2. Isi file .env
```bash
GEMINI_API_KEY=AQ.
NVIDIA_API_KEY=nvapi
```

### 3. Install dependen AI untuk Ticker bar
```bash
cd ticker
pip install -r requirements.txt
```

### 4. Jalankan server AI
```bash
python3 ticker_server.py
cd .. # keluar dari folder ticker
```

### 5. Setup backend server
```bash
cd server
npm install
```
Buat file `.env` di dalam folder `server/` dengan isi:
```env
GITHUB_TOKEN=github_personal_access_token
GITHUB_OWNER=github_username
GITHUB_REPO=Kitabku
GITHUB_PATH=data.json
```

> **Catatan**: `GITHUB_TOKEN` wajib diisi jika ingin fitur sync ke GitHub aktif. Token bisa dibuat di **Settings → Developer settings → Personal access tokens → Tokens (classic)** dengan izin `repo`.

Jalankan server
```bash
npm start
```
> Server berjalan di `http://localhost:5000`

### 6. Setup Frontend Client
Buka terminal baru:
```bash
cd client
npm install
npm run dev
```
> frontend berjalan di `http://localhost:3000`

### 7. Buka Aplikasi
Akses `http://localhost:3000` di browser. Masukkan path absolut ke file `data.json` milikmu, misalnya:
```txt
/home/neverlabs/Documents/e-Kitabku/data.json
```
Atau dengan cara upload file `.json` yg ada disamping block path input.

---

### 📁 Struktur Proyek
```txt
e-Kitabku/
├── client/                          # Frontend React + Vite
│   ├── index.html                   # Entry point HTML
│   ├── package.json                 # Dependencies frontend
│   ├── postcss.config.js            # Konfigurasi PostCSS
│   ├── tailwind.config.js           # Konfigurasi Tailwind CSS
│   ├── vite.config.js               # Konfigurasi Vite (proxy ke backend)
│   └── src/
│       ├── App.jsx                  # Komponen utama aplikasi
│       ├── index.css                # Tailwind CSS entry
│       ├── main.jsx                 # React DOM entry
│       └── components/
│           ├── EditorModal.jsx      # Modal edit tags & previews
│           ├── KitabPreview.jsx     # Modal preview kitab kuning
│           ├── PathInput.jsx        # Input path data.json
│           ├── RedirectPreview.jsx  # Modal preview redirect
│           ├── Sidebar.jsx          # Sidebar daftar Bab (drag & drop)
│           ├── TopicEditor.jsx      # Editor utama dengan live preview
│           └── TopicList.jsx        # Daftar Topik dalam Bab
│
└── server/                          # Backend Express.js
    ├── package.json                 # Dependencies backend
    └── server.js                    # Server utama (API + GitHub sync)
```

## Alur Kerja

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KITABKU EDITOR                                   │
│                          (React + Vite)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
|  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐     │
│  │   SIDEBAR    │     │  TOPIC LIST  │     │    TOPIC EDITOR          │     │
│  │   (Bab)      │────▶│   (Topik)    │────▶│    + Live Preview        │     │
│  │              │     │              │     │                          │     │
│  │  • Drag-drop │     │  • Drag-drop │     │  • Insert tools          │     │
│  │  • Tambah    │     │  • Tambah    │     │  • Sync tags/previews    │     │
│  │  • Hapus     │     │  • Hapus     │     │  • Real-time preview     │     │
│  │  • Rename    │     │  • Edit      │     │  • Modal kitab/redirect  │     │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘     │
│                                                         │                   │
│                                                         ▼                   │
│                                          ┌──────────────────────────────┐   │
│                                          │       API CALL (Axios)       │   │
│                                          │  GET /api/data               │   │
│                                          │  PUT /api/data               │   │
│                                          └──────────────┬───────────────┘   │
│                                                         │                   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVER (Express.js)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                     API ROUTES                                     │     │
│  │  POST /api/set-path  →  Set lokasi data.json                       │     │
│  │  GET  /api/data      →  Baca & kirim data.json                     │     │
│  │  PUT  /api/data      →  Simpan data.json + sync ke GitHub          │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    GITHUB SYNC (opsional)                          │     │
│  │  • Cek keberadaan file di repo                                     │     │
│  │  • Update atau buat file baru di branch main                       │     │
│  │  • Menggunakan GitHub API dengan Personal Access Token             │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└────────────────────────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GITHUB REPOSITORY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  https://github.com/neveerlabs/Kitabku                             │     │
│  │  └── data.json  (selalu up-to-date)                                │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Sinkronisasi dua arah:                                                     │
│  • Perubahan dari editor → langsung tersimpan ke GitHub                     │
│  • Data di GitHub bisa ditarik ulang ke editor (via refresh)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Alur Data Sederhana

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐
│ Editor  │───▶│ Server  │───▶│ GitHub  │───▶│ Frontend |
| (local) |    |  (API)  |    | (Cloud) |    |  (Live)  |
└─────────┘    └─────────┘    └─────────┘    └──────────┘
     ▲              ▲              ▲              │
     └──────────────┴──────────────┴──────────────┘
                 (Sinkronisasi Otomatis)
```

---

### 🧩 Komponen & Fungsinya

| Komponen | Peran |
|----------|-------|
| **Editor (React)** | Antarmuka pengguna untuk mengelola Bab, Topik, Tags, Preview, dan konten. |
| **API Server (Express)** | Jembatan antara editor dan file sistem serta GitHub. Menangani baca/tulis data.json. |
| **GitHub Sync** | Opsional. Jika token diset, setiap perubahan akan otomatis di-commit ke repository. |
| **Website Kitabku** | Hasil akhir dari data.json yang di-*deploy* di GitHub Pages. |

---

## 🔁 Proses End-to-End

1. **User mengedit** konten di Topic Editor (tambah/ubah/hapus teks, tags, preview, dll).
2. **Klik "Simpan Topik"** → data dikirim ke server via `PUT /api/data`.
3. **Server menulis** perubahan ke `data.json` di lokal.
4. **Jika token GitHub tersedia**, server langsung **sync ke GitHub** (commit baru di branch `main`).
5. **Website Kitabku** (yang di-*deploy* dari repo yang sama) otomatis mendapatkan update (bisa melalui GitHub Pages rebuild atau manual refresh).

> **Tips:** Dengan workflow ini, user bisa edit konten dari mana saja (cukup clone repo, jalankan editor, dan semua perubahan langsung masuk ke GitHub tanpa perlu copy-paste manual).

---

### 🤝 Kontribusi
Jika menemukan bug atau ingin menambahkan fitur, silakan buat **Issue** atau **Pull Request** di repository ini.

---

<p align="center"> <img src="https://img.shields.io/badge/Made%20with-React-61DAFB.svg" alt="Made with React"> <img src="https://img.shields.io/badge/Made%20with-Node.js-339933.svg" alt="Made with Node.js"> <img src="https://img.shields.io/badge/Editor-VSCode-007ACC.svg" alt="Editor"> <br> <b>Made with By Neverlabs</b> </p>
