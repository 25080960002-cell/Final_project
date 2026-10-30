# Database MAPAN

Schema MySQL 8 untuk tenant, pengguna, referensi, lahan, operasi dashboard, sesi, dan media. Migrasi harus dijalankan berurutan; jangan menjalankan ulang `ALTER TABLE` pada basis data yang sudah bermigrasi.

## Struktur

- `00_init.sql` — membuat database `mapan`.
- `migrations/001_fase1_tenant_master.sql` — 13 tabel awal.
- `migrations/002_fase2_lahan.sql` — tabel petak dan data spasial.
- `migrations/003_fase3_dashboard_records.sql` — catatan dashboard dan nama penerima undangan.
- `migrations/004_auth_sessions.sql` — sesi cookie yang disimpan dalam bentuk hash.
- `migrations/005_media_objects.sql` — metadata gambar; isi file disimpan di volume `mapan-media`.
- `migrations/006_google_identities.sql` — tautan identitas Gmail/Google terverifikasi ke akun pengguna.
- `migrations/007_dashboard_records_refine.sql` — kolom terstruktur (penulis, petak, fase, progres,
  jatuh tempo), pengisian awal dari payload, dan index untuk ringkasan dashboard.
- `seeds/000_reference_catalog.sql` — katalog komoditas/gejala minimal untuk deployment bersih.
- `seeds/001_seed_fase1_2.sql` — data demo lokal, termasuk organisasi dan pengguna tanpa password.
- `verify/` — pemeriksaan sampel seed lama.

## Database lokal

Cara termudah, dari folder `server/`:

```bash
npm run migrate                 # 001–007 + katalog referensi, berurutan & idempotent
npm run migrate -- --status     # cek file yang sudah/belum diterapkan
```

Progres disimpan di tabel `schema_migrations`. Untuk database yang sudah dibuat
manual sebelum tabel itu ada, jalankan `npm run migrate -- --baseline` sekali.

Alternatif manual:

```bash
mysql -u root -p < db/00_init.sql
mysql -u root -p mapan < db/migrations/001_fase1_tenant_master.sql
mysql -u root -p mapan < db/migrations/002_fase2_lahan.sql
mysql -u root -p mapan < db/seeds/001_seed_fase1_2.sql
mysql -u root -p mapan < db/migrations/003_fase3_dashboard_records.sql
mysql -u root -p mapan < db/migrations/004_auth_sessions.sql
mysql -u root -p mapan < db/migrations/005_media_objects.sql
mysql -u root -p mapan < db/migrations/006_google_identities.sql
mysql -u root -p mapan < db/migrations/007_dashboard_records_refine.sql
mysql -u root -p mapan < db/seeds/000_reference_catalog.sql
```

Katalog sebaiknya dimuat sebelum sampel seed jika menggunakan file SQL; `000_reference_catalog.sql` memakai ID otomatis dan seed demo yang lama mengasumsikan ID referensi tetap. Untuk data demo yang konsisten, jalankan seed lama saja dan jangan jalankan katalog tambahan.

## Deploy Docker

`docker-compose.yml` memasang migrasi dan katalog referensi ke `/docker-entrypoint-initdb.d`. MySQL menjalankannya sekali saat volume `mapan-db` pertama dibuat. Data pengguna baru dibuat melalui `npm run provision-admin`; seed demo tidak dijalankan pada deployment produksi. Untuk Railway/Render, jalankan `npm run migrate` dari mesin lokal dengan kredensial database produksi (lihat `docs/PANDUAN-DEPLOY.md`).

Untuk database yang sudah terisi, buat backup terlebih dahulu, periksa tabel/kolom yang ada, lalu jalankan hanya migrasi yang belum diterapkan sesuai urutan. Jalankan katalog referensi bila tabel `commodities` belum berisi data yang diperlukan. Jangan menghapus volume database/media untuk memperbaiki migrasi.
