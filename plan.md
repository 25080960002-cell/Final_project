# PLAN — Revisi & Penyelesaian APLIKASI MAPAN (Tahap Akhir)

**Proyek:** APLIKASI MAPAN (Manajemen & Analisis Prediksi Agri Nusantara)
**Tahap:** Pengembangan prototype → aplikasi lengkap (vibe coding / berbantuan AI)
**Tanggal dokumen:** 29 Oktober 2026
**Referensi tugas:** aplikasi minimal memiliki — tampilan aplikasi, database, fitur utama
sesuai proposal, proses pengolahan data, hak akses pengguna (jika diperlukan), serta
validasi dan pengujian. Output: source code, database, dokumentasi pengembangan program
& hasil pengujian dalam laporan PDF, dan demo aplikasi di YouTube (link masuk laporan).

---

## 1. Ringkasan Alur Proyek Sejauh Ini

| Tahap | Yang dilakukan | Artefak | Status |
| --- | --- | --- | --- |
| 1. Perencanaan awal | Rencana induk v1: offline-first, multi-tenant, GIS, prediksi panen, cuaca | `docs/plans/aplikasi-mapan-v1.md` | ✅ Selesai (beban revisi, lihat §5) |
| 2. Rancangan basis data | ERD, kamus data 42 tabel, normalisasi 1NF–3NF, indeks, rencana implementasi | `docs/database/00–05` | ✅ Selesai |
| 3. Eksekusi DDL Fase 1–2 | 17 tabel inti + seed demo + 5 uji constraint (5/5 PASS, MySQL 8.0.43) | `db/migrations/001–002`, `db/verify/` | ✅ Selesai |
| 4. Eksekusi DDL Fase 3+ | Dashboard records, sesi auth, media, identitas Google, refine (index & kolom terstruktur) | `db/migrations/003–007` | ✅ Selesai (total 7 migrasi berurutan & idempotent) |
| 5. Backend API | Express 5 + MySQL: auth sesi cookie HttpOnly, organizations, plots, records (cycle/task/activity/report/scan/community_post), media, cuaca Open-Meteo, prediksi benchmark | `server/src/routes/*`, `server/src/services/*` | ✅ Berfungsi; ⚠️ sebagian fitur belum penuh |
| 6. Frontend (prototype→web) | React 19 + Vite 8: landing page, Tentang + data BPS, auth masuk/undangan, dashboard 12 menu, tema terang/gelap | `src/` | ✅ Berfungsi; ⚠️ sebagian dashboard masih data demo |
| 7. Deployment | Vercel (frontend) + Railway/Render (API) + VPS docker-compose (web+api+mysql) | `vercel.json`, `Dockerfile`, `docker-compose.yml`, `docs/PANDUAN-DEPLOY.md` | ⚠️ Siap, perlu verifikasi live |
| 8. Pengujian | CI build frontend + cek sintaks backend; uji constraint DB | `.github/workflows/ci.yml` | ❌ Paling lemah — perlu ekspansi besar |
| 9. Dokumentasi laporan akhir | Dokumentasi pengembangan + hasil pengujian + link demo YouTube | Laporan PDF | ❌ Belum dibuat |
| 10. Demo video | Rekaman demo aplikasi | YouTube | ❌ Belum dibuat |

### Stack aktual (berbeda dari rencana awal)

```
Frontend : React 19 + Vite 8 (hash routing, Radix UI, Recharts, Lucide)
Backend  : Node.js 22 + Express 5 + mysql2 (prepared statements)
Database : MySQL 8.0 (InnoDB, utf8mb4, SPATIAL index, sesi hash di DB)
Deploy   : Vercel + Railway/Render (atau VPS docker-compose: Nginx/Caddy)
```

---

## 2. Kondisi Saat Ini (Apa yang Sudah Berjalan)

### 2.1 Tampilan aplikasi ✅
- Landing page (`#top`, `#fitur`, `#faq`, `#kontak`) + halaman Tentang dengan grafik data resmi BPS.
- Auth: `#masuk`, `#daftar` (penjelasan undangan), `#undangan/<token>`.
- Dashboard dengan layout, widget KPI, dan halaman-halaman fitur (`DashboardPages.jsx`, `HealthCommunityPages.jsx`).
- Tipografi Fraunces/Public Sans, tema terang/gelap persist di `localStorage`.

### 2.2 Database ✅
- Rancangan 42 tabel 4 lapis (Inti 18, Operasional 13, Sosial 4, Data resmi 3).
- 7 migrasi sudah dieksekusi berurutan; progres dicatat di `schema_migrations`.
- Sesi login disimpan sebagai hash di DB (cookie HttpOnly), media di volume + metadata di tabel.
- Multi-tenant: `organization_id` di semua tabel transaksional, isolasi ditegakkan di lapisan aplikasi.

### 2.3 Proses pengolahan data ✅ (sebagian)
- Ringkasan KPI dashboard (`GET /api/organizations/:orgId/dashboard`).
- CRUD catatan operasional terstruktur (penulis, petak, fase, progres, jatuh tempo).
- Ekspor CSV laporan (ambil data langsung saat ekspor).
- Cuaca via Open-Meteo (butuh koordinat region).
- Prediksi hasil pakai benchmark komoditas lokal — **bukan AI/ML** (harus dijelaskan jujur di laporan).

### 2.4 Hak akses pengguna ✅
Peran menempel keanggotaan organisasi (`organization_members`), bukan global:

| Peran | Akses |
| --- | --- |
| Administrator | Semua tulis: profil, pengaturan, undangan, anggota, petak, siklus, catatan |
| Manajer lapangan | Buat petak & siklus + semua catatan operasional |
| Petani | Catatan operasional (aktivitas, tugas, panen, scan) |
| Penyuluh | Baca saja, hanya bila opsi "Akses baca untuk penyuluh" aktif |
| Pengunjung publik | Landing + Tentang (data BPS agregat) |

### 2.5 Validasi & pengujian ⚠️ TERLEMAG
Yang sudah ada:
- Validasi di server per-route (auth, media ≤10 MB, organizations, plots, records, dsb.), prepared statements anti-SQL injection.
- Uji constraint DB fase 1–2: 5/5 PASS (menolak data salah).
- CI: build frontend + `node --check` seluruh file backend.

Yang **belum ada**:
- Tidak ada satupun test automated (unit/integration/E2E) di repo.
- Belum ada dokumen hasil pengujian fungsional yang sistematis.
- CI tidak menjalankan test — hanya build & sintaks.

---

## 3. Gap Terhadap Ketentuan Tugas (Checklist)

| # | Ketentuan | Status | Catatan |
| --- | --- | --- | --- |
| 1 | Tampilan aplikasi | ✅ | Landing + Tentang + Auth + Dashboard lengkap |
| 2 | Database | ✅ | MySQL 8, 7 migrasi, seed, dokumentasi `docs/database/` |
| 3 | Fitur utama sesuai proposal | ⚠️ | Sebagian berjalan; beberapa fitur flagship masih setengah (§4) |
| 4 | Proses pengolahan data | ✅ | KPI, CRUD terstruktur, CSV, cuaca, prediksi benchmark |
| 5 | Hak akses pengguna | ✅ | 4 peran + isolasi tenant + opsi penyuluh |
| 6 | Validasi dan pengujian | ❌ | Hanya constraint DB + CI sintaks. Perlu test suite + dokumen uji |
| 7 | Source code | ✅ | Repo lengkap, siap |
| 8 | Database (deliverable) | ✅ | Dump/dokumen perlu dikemas untuk pengumpulan |
| 9 | Dokumentasi pengembangan & hasil pengujian (laporan PDF) | ❌ | Belum ditulis |
| 10 | Demo YouTube + link di laporan | ❌ | Belum direkam |

---

## 4. Revisi Prioritas (Daftar Kerja)

### P0 — Wajib untuk kelulusan (harus selesai sebelum laporan ditulis)

- [ ] **R1. Paket pengujian otomatis** — buat test minimal yang bisa dijalankan:
  - Backend: test smoke per endpoint kunci (health, login, session, dashboard, plots CRUD, records CRUD, hak akses 403 antar-peran, isolasi tenant 404/403 antar-organisasi).
  - Frontend: build `npm run build` tanpa error (sudah ada) + cek manual terpandu.
  - Catat semua hasil jadi tabel pengujian (skiejukul di §8) untuk lampiran laporan.
- [ ] **R2. Lengkapi fitur utama yang masih setengah** — pilih minimal:
  - Dashboard angka nyata dari API (bukan data demo) untuk seluruh 12 menu yang ditampilkan, atau pastikan fallback demo jelas berlabel.
  - Ekspor laporan CSV: uji end-to-end & contoh output.
  - Scan tanaman: paling tidak alur simpan foto + gejala + riwayat tampil rapi (diagnosis otomatis → jujur dicakup: belum).
- [ ] **R3. Deployment hidup** — aplikasi harus bisa dibuka penilai:
  - Frontend deploy Vercel + API di Railway/Render; jalankan `npm run migrate` ke DB produksi; test login end-to-end.
  - Siapkan 1 akun demo per peran untuk demo video.
- [ ] **R4. Laporan PDF** — dokumentasi pengembangan program & hasil pengujian (struktur di §7).
- [ ] **R5. Demo YouTube** — rekam 5–8 menit: masuk per peran, alur pencatatan, ekspor laporan, cuaca/prediksi, hak akses ditolak; cantumkan link di laporan.

### P1 — Sangat disarankan (menaikkan nilai)

- [ ] **R6.** Test E2E dasar dengan Playwright (login → dashboard → catat aktivitas → harap data tampil) meski hanya 3–5 skenario.
- [ ] **R7.** Seed data demo yang rapi untuk database deliverable + `mysqldump` final disertakan di repo/dokumen.
- [ ] **R8.** Dokumen "penggunaan AI (vibe coding)" — catat tools yang dipakai, bagian mana dibantu AI, dan bagaimana hasilnya diverifikasi manusia (ini sesuai semangat tugas dan bagus masuk laporan).
- [ ] **R9.** Rapikan README: samakan klaim fitur dengan kenyataan (jangan tulis "prediksi AI" — saat ini benchmark).

### P2 — Di luar cakupan v1 (catat sebagai future work di laporan, jangan tunda deliverable)

- Diagnosis penyakit otomatis dari foto scan.
- Editor GIS batas petak (saat ini tampil GeoJSON saja).
- Kirim undangan lewat email otomatis (saat ini tautan dibagikan admin).
- Push notification FCM; integrasi PyScripts BMKG/offline-sync mobile.

---

## 5. Penyimpangan Rancangan Awal → Implementasi (Wajib Dijelaskan di Laporan)

| Aspek | Rencana awal (`docs/plans/aplikasi-mapan-v1.md`) | Implementasi aktual | Alasan / status |
| --- | --- | --- | --- |
| Database | PostgreSQL + PostGIS | MySQL 8 (POLYGON SRID 4326 + plot_boundaries terpisah) | Keputusan pemilik proyek; konsekuensi didokumenkan `docs/database/README.md` §3.1 |
| Backend | Python FastAPI/Django + Celery | Node.js 22 + Express 5 | Sederhana, cukup untuk cakupan tugas; background job digantikan operasi on-demand |
| Klien | Aplikasi mobile Flutter/RN + SQLite offline queue | Web app responsif (React) | Offline-first mobile belum dibangun; `sync_events`, `client_event_id` tetap tersedia di skema |
| push FCM | Firebase Cloud Messaging | Tidak ada | Out-of-scope tahap ini, dicatat future work |
| Prediksi | Formula + scrap cuaca background | Benchmark komoditas pada endpoint prediksi | Disederuh; masih memenuhi "proses pengolahan data" |
| Sesi auth | JWT | Cookie HttpOnly + hash sesi di MySQL | Lebih aman dari XSS token lup |

Tabel ini adalah materi penting untuk bab "Dokumentasi Pengembangan Program": menunjukkan
keputusan teknis yang terjadi saat vibe coding dan alasannya, bukan membuang rencana awal diam-diam.

---

## 6. Urutan Kerja yang Disarankan (dari sekarang sampai kumpul)

1. **Beri label status demi fitur** — audit cepat halaman dashboard mana yang masih data demo vs data API (1 hari).
2. **Kerjakan R2** (fitur setengah jadi ke keadaan direkam) (2–4 hari).
3. **Kerjakan R1** — jalankan, perbaiki bug yang ketemu, catat hasil (2–3 hari).
4. **Deploy (R3)** dan verifikasi end-to-end di domain produksi (1 hari).
5. **Rekam demo (R5)** — siapkan skenario demo + akun per peran (1 hari).
6. **Tulis laporan PDF (R4)** menggunakan struktur §7, masukkan tabel pengujian §8 dan link YouTube (2–3 hari).
7. Final check: kumpulkan source code + dump database + PDF.

---

## 7. Struktur Laporan PDF yang Disarankan

```
1  Pendahuluan (proposal, tujuan, ruang lingkup)
2  Metode Pengembangan (pendekatan vibe coding; tools AI yang dipakai; cara verifikasi)
3  Arsitektur & Teknologi (diagram stack aktual; alasan deviasi §5)
4  Rancangan Basis Data (ringkas dari docs/database — ERD, kamus data, normalisasi; merujuk lampiran)
5  Dokumentasi Pengembangan Program
   5.1 Versi/prototype awal → tahap akhir
   5.2 Modul frontend (landing, tentang, auth, dashboard)
   5.3 Modul backend (auth sesi, multi-tenant, records, media, cuaca, prediksi)
   5.4 Migrasi database (001–007) & seed
   5.5 Deployment (Vercel + Railway / docker-compose)
6  Hak Akses Pengguna (matriks peran × fitur)
7  Validasi dan Hasil Pengujian
   7.1 Pengujian basis data (constraint PASS)
   7.2 Pengujian API (endpooint, kasus, hasil)
   7.3 Pengujian hak akses & isolasi tenant
   7.4 Pengujian UI manual (skenario + tangkapan layar)
   7.5 CI (build & sintaks)
8  Tampilan Aplikasi (tangkapan layar per halaman)
9  Demo (tautan YouTube + panduan akun demo)
10 Kesimpulan & Future Work (diagnosis otomatis, GIS editor, offline mobile, FCM)
Lampiran: kamus data, dump struktur DB, contoh CSV laporan
```

---

## 8. Skematik Tabel Hasil Pengujian (isi saat R1/R3 selesai)

| No | Pengujian | Langkah | Hasil diharapkan | Hasil aktual | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Health check | `GET /api/health` | `{status:"ok"}` | — | ☐ |
| 2 | Login valid | Email+sandi benar | Cookie sesi dibuat | — | ☐ |
| 3 | Login tidak valid | Sandi salah | 401, tanpa cookie | — | ☐ |
| 4 | Isolasi tenant | API org B dengan sesi org A | 403/404, tanpa data kebocoran | — | ☐ |
| 5 | Hak akses petani | Petani PATCH undangan | 403 | — | ☐ |
| 6 | CRUD petak | Buat → lihat → ubah | Data konsisten | — | ☐ |
| 7 | CRUD catatan aktivitas | Buat → tampil dashboard | Terhitung ke KPI | — | ☐ |
| 8 | Media upload >10 MB | Unggah berkas melebihi batas | 413/400 ditolak | — | ☐ |
| 9 | Ekspor CSV laporan | Klik ekspor | CSV berisi data terkini | — | ☐ |
| 10 | Cuaca | Region tanpa koordinat | Pesan kesalahan ramah | — | ☐ |
| 11 | Prediksi | Endpoint prediksi | Angka benchmark + sumber jelas | — | ☐ |
| 12 | Sesi berakhir | Logout → akses dashboard | Redirect/menolak | — | ☐ |
| 13 | DB constraint | Insert data salah | 5/5 tetap PASS | — | ☐ |

---

## 9. Definition of Done (Ketentuan Tugas)

- [ ] Tampilan aplikasi berjalan (lokal + produksi).
- [ ] Database berjalan: migrasi reproducible, seed demo, dump deliverable.
- [ ] Fitur utama proposal berjalan dan terekam demo (benchmark/limitasi dijelaskan jujur).
- [ ] Proses pengolahan data berjalan: KPI dashboard, catatan, cuaca, prediksi, ekspor CSV.
- [ ] Hak akses peran diuji & terbukti (admin/manajer/petani/penyuluh).
- [ ] Validasi & pengujian: test suite otomatis + tabel pengujian terisi di laporan.
- [ ] Laporan PDF: dokumentasi pengembangan + hasil pengujian + link YouTube.
- [ ] Demo YouTube: 5–8 menit, ditonton penilaian tanpa setup.
- [ ] README final tidak mengklaim fitur yang belum ada.
