# AGENTS.md — Konteks proyek untuk AI coding tool

APLIKASI MAPAN (Manajemen & Analisis Prediksi Agri Nusantara): web app multi-tenant untuk
manajemen lahan/petak, siklus tanam, catatan operasional, laporan, cuaca, dan prediksi hasil.
Tugas aktif: **revisi besar tahap akhir** — lihat `docs/REVISI-PROMPT.md`.
Tugas berikutnya: **versi mobile APK (Expo/React Native)** — lihat
`docs/plans/planning-apk-mobile.md`.

## Stack (terverifikasi jalan)
- Frontend: React 19 + Vite 8 (root `/`, kode di `src/`), hash routing, Radix UI, Recharts.
- Backend: Node 22 + Express 5 + mysql2 (`server/`), sesi cookie HttpOnly (hash sesi di DB).
- Database: MySQL 8.0 (`db/migrations/001–007` + `db/seeds/000_reference_catalog.sql`).
  Migrasi menghasilkan 22 tabel (termasuk `schema_migrations`).

## Perintah
```bash
npm run setup        # npm ci untuk frontend + server
npm run db:migrate   # terapkan migrasi (butuh MySQL hidup + server/.env)
npm run db:status    # status migrasi
npm run dev:all      # API (:4000) + frontend (:5173) bersamaan
npm run check        # build frontend + cek sintaks backend
npm test             # unit + smoke render + uji API
cd server && npm run provision-admin   # buat admin pertama (isi MAPAN_INITIAL_* sementara)
```
Env: salin `server/.env.example` -> `server/.env` (dan `.env.example` -> `.env` bila perlu).
Jangan pernah commit `.env`.

## Aturan kerja
1. Jujur: prediksi saat ini = benchmark komoditas, BUKAN AI/ML. Jangan klaim fitur yang tidak ada.
2. Data demo wajib berlabel jelas atau diganti data API. Jangan menyamar sebagai data nyata.
3. Migrasi baru = file baru `008+`, idempotent. Jangan edit 001–007.
4. Semua input divalidasi di server; pakai prepared statements; isolasi tenant lewat `organization_id`.
5. Setelah tiap perubahan: `npm run check` (dan test bila sudah ada) harus hijau.
6. Penyimpangan dari rencana awal (`docs/plans/aplikasi-mapan-v1.md`,
   `docs/plans/planning-apk-mobile.md`) dicatat, bukan disembunyikan.

## Status pengujian
- `npm test` = unit klien + smoke render (Vite SSR) + uji integrasi API (MySQL, DB `mapan_test`). CI menjalankannya.
- `npm --prefix server run test:report` menulis `docs/hasil-pengujian-api.md` dari run asli.
- Belum ada E2E browser. Lihat `docs/CATATAN-REVISI.md` untuk apa yang sudah/belum terbukti.
- Data demo: `cd server && npm run seed-demo` (akun di `docs/akun-demo.md`).
