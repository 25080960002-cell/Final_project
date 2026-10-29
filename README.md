# MAPAN

Aplikasi web MAPAN untuk menampilkan informasi dan alur pengelolaan petani dari
berbagai komoditas: tanaman pangan, hortikultura, dan perkebunan.

- **Frontend:** React 19 + Vite 8 (landing page, halaman Tentang, auth, dashboard)
- **Backend:** Node.js 22 + Express 5 + MySQL 8 (`server/`)
- **Deploy:** frontend ke Vercel, backend ke Railway/Render atau VPS Docker

Panduan deploy lengkap ada di [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## Menjalankan lokal

Prasyarat: Node.js 20.19+ dan MySQL 8.

```bash
# 1. Frontend
npm install
npm run dev            # http://localhost:5173

# 2. Database (sekali saja)
cd server
npm install
npm run migrate        # menjalankan db/migrations + katalog referensi

# 3. API (terminal terpisah)
npm run dev            # http://localhost:4000/api
```

Salin `server/.env.example` menjadi `server/.env` lalu sesuaikan koneksi MySQL.
Frontend memakai `.env` di root:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_ORGANIZATION_ID=1
```

Membuat administrator pertama (database kosong):

```bash
cd server
# isi MAPAN_INITIAL_* di .env lebih dulu
npm run provision-admin
```

Mengganti kata sandi admin yang sudah ada: `npm run set-password`.

## Route aplikasi

Aplikasi memakai hash routing agar aman di hosting statis:

| Hash | Halaman |
| --- | --- |
| `#top`, `#fitur`, `#faq`, `#kontak` | Landing page |
| `#tentang`, `#tentang-data` | Tentang & data resmi BPS |
| `#masuk` | Formulir masuk |
| `#daftar` | Penjelasan pendaftaran via undangan |
| `#undangan/<token>` | Penerimaan undangan organisasi |
| `#dashboard` | Dashboard (data contoh bila belum masuk) |

Anggota dibuat melalui undangan organisasi; tidak ada pendaftaran publik.

## Struktur folder

```text
.
├── src/
│   ├── app/                      # Pemilih halaman + lazy loading
│   ├── features/
│   │   ├── landing/              # Navbar, hero, fitur, FAQ, footer, aset foto
│   │   ├── about/                # Halaman Tentang + data BPS
│   │   ├── auth/                 # Masuk & penerimaan undangan
│   │   └── dashboard/
│   │       ├── components/       # Layout dan widget dashboard
│   │       ├── data/             # Klien API, adapter, context, data demo
│   │       └── pages/            # Halaman dashboard
│   └── shared/
│       ├── assets/brand/         # Logo
│       ├── hooks/                # Hook scroll reveal
│       ├── styles/               # CSS global
│       └── ui/                   # Komponen UI bersama
├── server/                       # API Express + MySQL
│   ├── scripts/                  # migrate, provision-admin, set-password
│   └── src/
│       ├── routes/               # auth, organizations, plots, records, media, dll.
│       └── services/
├── db/
│   ├── migrations/               # 001–007 (dijalankan berurutan)
│   ├── seeds/                    # katalog referensi + data demo lokal
│   └── verify/                   # skrip pemeriksaan
├── deploy/                       # Nginx & Caddy untuk VPS
├── docs/                         # Panduan deploy & database
├── .github/workflows/ci.yml      # CI: build frontend + cek sintaks backend
├── vercel.json                   # Konfigurasi frontend Vercel
├── docker-compose.yml            # Opsi VPS (web + api + mysql)
└── vite.config.js
```

## Backend dan status fitur

Dashboard memakai sesi cookie HttpOnly, tenant dipilih dari sesi, dan API membatasi
akses tulis berdasarkan peran. Lahan, siklus, tugas, aktivitas, laporan, pemeriksaan
tanaman, diskusi, pengaturan organisasi, dan foto disimpan di MySQL/volume media.
Cuaca memakai Open-Meteo; estimasi hasil memakai benchmark komoditas lokal.

Catatan integrasi:

- Undangan dibuat dan diterima lewat tautan yang dibagikan admin; pengiriman email
  otomatis belum dikonfigurasi.
- Halaman scan menyimpan foto/gejala, belum mendiagnosis penyakit otomatis.
- Peta menampilkan batas petak GeoJSON bila tersedia; editor GIS belum tersedia.
- CSV laporan mengambil data langsung saat diekspor.

Rincian API: [`server/README.md`](server/README.md) · Skema database:
[`db/README.md`](db/README.md) dan [`docs/database/`](docs/database/README.md).

## Deploy

### Frontend — Vercel

1. Import repo ini di Vercel (Root Directory `.`).
2. Set `VITE_API_BASE_URL=https://<domain-api>` dan `VITE_ORGANIZATION_ID=1`.
3. Deploy (Vercel memakai `vercel.json`, output `dist/`).

### Backend — Railway

1. New Project → Deploy from GitHub → Root Directory `server`.
2. Tambahkan MySQL, isi variabel dari `server/.env.production.example`.
3. Wajib untuk domain berbeda: `COOKIE_SAME_SITE=none` dan `COOKIE_SECURE=true`,
   serta `CORS_ORIGINS` berisi domain Vercel.
4. Mount volume `/data/media`, jalankan `npm run migrate` dari lokal ke database
   Railway.

Langkah rinci dan troubleshooting: [`docs/DEPLOY.md`](docs/DEPLOY.md).

### VPS — Docker Compose

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

## Catatan antarmuka

- Tipografi: **Fraunces** (judul) dan **Public Sans** (isi) di `src/shared/styles/typography.css`.
- Tema terang/gelap disimpan di `localStorage` dan diubah dari landing page, drawer
  seluler, serta popover profil dashboard.
- Grafik Tentang dan ringkasan beranda memakai angka BPS (produksi padi 2019–2024,
  jagung 2024, Sensus Pertanian 2023, produksi padi per provinsi 2024).
- Komponen interaktif memakai Radix UI (dialog, switch); ikon Lucide; grafik Recharts.
- Kredit foto: [`docs/IMAGE-CREDITS.md`](docs/IMAGE-CREDITS.md) — periksa lisensi
  sebelum penggunaan produksi.
