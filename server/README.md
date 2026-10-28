# MAPAN API

API multi-tenant untuk dashboard MAPAN. Stack: Node.js 22, Express 5, MySQL 8.4, dan `mysql2` dengan prepared statements.

## Menjalankan lokal

1. Siapkan MySQL dan jalankan migrasi `001` sampai `006` secara berurutan. Untuk basis data seed, jalankan katalog referensi `db/seeds/000_reference_catalog.sql` setelah migrasi.
2. Salin `server/.env.example` menjadi `server/.env`, lalu atur koneksi MySQL.
3. `cd server`, lalu `npm install` dan `npm run dev`.
4. Buka `http://localhost:5173/` untuk landing page. Masuk untuk data organisasi, atau buka `http://localhost:5173/#dashboard` untuk demo tanpa akses tulis.

API lokal: `http://127.0.0.1:4000/api`. Health check: `GET /api/health`.

## Konfigurasi

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `HOST` | localhost (development), `0.0.0.0` (production) | Alamat bind server |
| `PORT` | `4000` | Port API |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | `127.0.0.1`, `3306`, `mapan` | Alamat basis data |
| `DB_USER`, `DB_PASSWORD` | `zian`, kosong | Kredensial MySQL lokal; ganti pada deployment |
| `DB_POOL_MAX` | `10` | Batas koneksi |
| `CORS_ORIGINS` | Vite localhost | Origin tambahan; origin same-host diizinkan |
| `SESSION_TTL_HOURS` | `8` | Umur sesi, rentang 1–168 jam |
| `MEDIA_DIR` | `server/uploads` | Folder berkas; gunakan volume persisten |

Jangan commit berkas `.env`. Pada mode production, cookie sesi memakai `Secure`; akses dashboard harus melalui HTTPS. Isi `CORS_ORIGINS` dengan domain frontend persis, misalnya `https://mapan.example.com`.

## Endpoint utama

Semua data tenant memakai sesi dan organisasi yang terikat ke sesi. Kesalahan memakai `{ error: { code, message } }`.

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/health` | Kesehatan API/MySQL |
| `GET` | `/api/auth/session` | Memeriksa sesi cookie |
| `POST` | `/api/auth/logout` | Mencabut sesi |
| `POST` | `/api/auth/invitation-info` | Memeriksa tautan undangan; token dikirim di body |
| `POST` | `/api/auth/accept-invitation` | Membuat akun dan menerima undangan |
| `GET/PATCH` | `/api/organizations/:orgId` | Profil organisasi |
| `GET/PATCH` | `/api/organizations/:orgId/settings` | Preferensi organisasi |
| `GET` | `/api/organizations/:orgId/dashboard` | Ringkasan KPI |
| `GET/POST` | `/api/organizations/:orgId/plots` | Daftar/buat petak |
| `GET` | `/api/organizations/:orgId/map/plots` | GeoJSON batas petak yang tersedia |
| `GET/POST` | `/api/organizations/:orgId/invitations` | Kelola undangan; link ditampilkan sekali ketika dibuat |
| `POST` | `/api/organizations/:orgId/invitations/:invitationId/resend` | Buat link baru untuk undangan pending |
| `GET/POST/PATCH/DELETE` | `/api/organizations/:orgId/records/:type[/:recordId]` | Catatan siklus, tugas, aktivitas, laporan, scan, diskusi |
| `POST/GET` | `/api/organizations/:orgId/media[/:mediaId]` | Unggah/ambil JPEG, PNG, WEBP tenant (maks. 10 MB) |
| `GET` | `/api/organizations/:orgId/weather` | Cuaca dan prakiraan lima hari Open-Meteo |
| `GET` | `/api/organizations/:orgId/predictions` | Benchmark hasil komoditas dari siklus aktif |
| `GET` | `/api/reference/*` | Katalog komoditas, gejala, dan wilayah |

Penulisan profil/pengaturan/undangan/anggota memerlukan administrator. Pembuatan petak dan siklus memerlukan administrator atau manajer lapangan. Catatan operasional dapat ditulis administrator, manajer lapangan, atau petani. Penyuluh hanya mendapat akses baca jika opsi **Akses baca untuk penyuluh** diaktifkan administrator pada pengaturan organisasi.

Undangan tidak mengirim email otomatis; administrator membagikan tautan satu kali yang diterima API. Token baru disimpan dalam bentuk hash; token lama tetap dapat dipakai saat transisi. Penerima menerima undangan dengan email terverifikasi yang sama dengan alamat undangan. Scan menyimpan foto dan gejala, tanpa diagnosis otomatis. Prediksi memakai benchmark hasil komoditas, bukan AI. Cuaca memerlukan koordinat region dan akses keluar server ke Open-Meteo.

Pada production, API menolak start bila `DB_PASSWORD` kosong, masih berupa placeholder, atau kurang dari 16 karakter. Isi secret database acak sebelum menjalankan container.

## Provisioning dan Docker

Untuk database kosong, Compose menjalankan migrasi 001–006 dan katalog referensi saat volume MySQL pertama kali dibuat. Buat administrator pertama dengan mengisi sementara variabel `MAPAN_INITIAL_*` di `.env.docker`, lalu jalankan `docker compose --env-file .env.docker run --rm api npm run provision-admin`. Hapus variabel email/kata sandi administrator setelah provisioning. Endpoint tenant dilindungi sesi cookie dan peran MAPAN.

Pemeriksaan isi seed `npm run check-db` hanya berlaku pada database sampel lokal (24 petak, 125 ha), bukan basis data deployment kosong.
