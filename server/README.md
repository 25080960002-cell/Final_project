# MAPAN API

API multi-tenant untuk dashboard MAPAN. Stack: Node.js 22, Express 5, MySQL 8.4,
dan `mysql2` dengan prepared statements.

## Menjalankan lokal

1. Nyalakan MySQL 8.
2. Salin `.env.example` menjadi `.env`, lalu atur koneksi MySQL.
3. `npm install`
4. `npm run migrate` — menerapkan `../db/migrations/001–007` dan katalog referensi
   secara berurutan (aman dijalankan ulang; progres disimpan di `schema_migrations`).
5. `npm run dev` → `http://127.0.0.1:4000/api`

Buat administrator pertama pada database kosong:

```bash
# isi MAPAN_INITIAL_* di .env terlebih dahulu
npm run provision-admin
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | API dengan auto-reload |
| `npm start` | API produksi |
| `npm run migrate` | Terapkan migrasi yang belum dijalankan |
| `npm run migrate -- --status` | Lihat status migrasi |
| `npm run migrate -- --baseline` | Tandai database lama sebagai sudah termigrasi |
| `npm run provision-admin` | Buat organisasi + admin pertama (DB kosong) |
| `npm run set-password` | Ganti kata sandi admin yang sudah ada |
| `npm run check-db` | Cek isi database sampel lokal |

## Konfigurasi

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `HOST` | `localhost` (dev), `0.0.0.0` (prod) | Alamat bind server |
| `PORT` | `4000` | Port API |
| `TRUST_PROXY` | `false` | `true` atau jumlah hop proxy (Railway/Render: `true`) |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | `127.0.0.1`, `3306`, `mapan` | Alamat basis data |
| `DB_USER`, `DB_PASSWORD` | `mapan`, kosong | Kredensial MySQL; ganti pada deployment |
| `DB_POOL_MAX` | `10` | Batas koneksi |
| `CORS_ORIGINS` | Vite localhost | Origin yang diizinkan; pola `https://*.vercel.app` didukung |
| `COOKIE_SAME_SITE` | `lax` (dev), `none` (prod) | `none` wajib bila frontend & API beda domain |
| `COOKIE_SECURE` | `false` (dev), `true` (prod) | Wajib `true` saat `SameSite=None` |
| `SESSION_TTL_HOURS` | `8` | Umur sesi, rentang 1–168 jam |
| `MEDIA_DIR` | `server/uploads` | Folder berkas; gunakan volume persisten di produksi |

Jangan commit `.env`. Pada production, API menolak start bila `DB_PASSWORD` kosong,
placeholder, atau kurang dari 16 karakter. Contoh variabel produksi ada di
[`.env.production.example`](.env.production.example).

## Endpoint utama

Semua data tenant memakai sesi dan organisasi yang terikat ke sesi. Kesalahan memakai
`{ error: { code, message } }`.

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/health` | Kesehatan API/MySQL |
| `GET` | `/api/auth/session` | Memeriksa sesi cookie |
| `POST` | `/api/auth/login` | Masuk dengan email + kata sandi |
| `POST` | `/api/auth/logout` | Mencabut sesi |
| `POST` | `/api/auth/invitation-info` | Memeriksa tautan undangan |
| `POST` | `/api/auth/accept-invitation` | Membuat akun dari undangan |
| `GET/PATCH` | `/api/organizations/:orgId` | Profil organisasi |
| `GET/PATCH` | `/api/organizations/:orgId/settings` | Preferensi organisasi |
| `GET` | `/api/organizations/:orgId/dashboard` | Ringkasan KPI |
| `GET/POST` | `/api/organizations/:orgId/plots` | Daftar/buat petak |
| `GET` | `/api/organizations/:orgId/map/plots` | GeoJSON batas petak |
| `GET/POST` | `/api/organizations/:orgId/invitations` | Kelola undangan |
| `POST` | `/api/organizations/:orgId/invitations/:id/resend` | Buat ulang tautan undangan |
| `GET/POST/PATCH/DELETE` | `/api/organizations/:orgId/records/:type[/:id]` | Catatan operasional |
| `POST/GET` | `/api/organizations/:orgId/media[/:id]` | Unggah/ambil gambar (maks. 10 MB) |
| `GET` | `/api/organizations/:orgId/weather` | Cuaca & prakiraan Open-Meteo |
| `GET` | `/api/organizations/:orgId/predictions` | Benchmark hasil komoditas |
| `GET` | `/api/reference/*` | Katalog komoditas, gejala, wilayah |

Jenis `records` yang didukung: `cycle`, `task`, `activity`, `report`, `scan`,
`community_post`.

Penulisan profil/pengaturan/undangan/anggota memerlukan administrator. Pembuatan
petak dan siklus memerlukan administrator atau manajer lapangan. Catatan operasional
dapat ditulis administrator, manajer lapangan, atau petani. Penyuluh hanya mendapat
akses baca bila opsi **Akses baca untuk penyuluh** diaktifkan.

Undangan tidak mengirim email otomatis. Scan menyimpan foto dan gejala tanpa diagnosis
otomatis. Prediksi memakai benchmark komoditas, bukan AI. Cuaca memerlukan koordinat
region dan akses keluar server ke Open-Meteo.

## Docker

`Dockerfile` menjalankan API sebagai user `node` dan siap dipakai Railway/Render
(lihat `railway.json`). Migrasi tidak dijalankan otomatis di container; jalankan
`npm run migrate` dari mesin lokal dengan kredensial database produksi. Untuk VPS,
`docker-compose.yml` di root repo sudah menyertakan MySQL dan volume media.
