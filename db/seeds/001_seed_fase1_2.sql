-- =====================================================================
-- MAPAN · Seed Fase 1 + 2
-- Prasyarat: 001_fase1_tenant_master.sql, 002_fase2_lahan.sql
--
-- Data mengikuti nilai yang tampil di dashboard:
--   * 24 petak, total 125,00 ha
--   * 6 petak bernama sesuai tabel "Lahan" di UI
--   * 6 kelompok tani sesuai panel "Kelompok tani"
--   * 4 gejala sesuai halaman "Scan tanaman"
--
-- Catatan:
--   * password_hash sengaja NULL. Kredensial dibuat lewat alur API,
--     bukan ditanam di seed (hash palsu lebih berbahaya daripada kosong).
--   * Fase budidaya ("Vegetatif", "Pembungaan", dst.) belum di-seed di
--     sini karena tabelnya (cultivation_cycles) baru dibuat di Fase 3.
--   * Angka "248 petani" dan "52 anggota kelompok" di UI adalah angka
--     presentasi; seed hanya memuat personel minimum yang saling terkait.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

START TRANSACTION;

-- ---------------------------------------------------------------------
-- Wilayah: Bali -> 3 kabupaten -> 4 kecamatan
-- bps_code provinsi/kabupaten memakai kode BPS; kode kecamatan dibiarkan
-- NULL sampai impor resmi agar tidak menebak.
-- ---------------------------------------------------------------------
INSERT INTO regions (id, parent_id, level, name, bps_code, latitude, longitude) VALUES
  (1, NULL, 'provinsi',  'Bali',    '51',   -8.409518, 115.188919),
  (2, 1,    'kabupaten', 'Tabanan', '5102', -8.539400, 115.125000),
  (3, 1,    'kabupaten', 'Badung',  '5103', -8.581000, 115.177000),
  (4, 1,    'kabupaten', 'Gianyar', '5104', -8.543000, 115.325000),
  (5, 2,    'kecamatan', 'Kediri',  NULL,   -8.563000, 115.156000),
  (6, 2,    'kecamatan', 'Marga',   NULL,   -8.447000, 115.091000),
  (7, 4,    'kecamatan', 'Sukawati', NULL,  -8.585000, 115.283000),
  (8, 3,    'kecamatan', 'Mengwi',  NULL,   -8.540000, 115.172000);

-- ---------------------------------------------------------------------
-- Organisasi (tenant) sesuai profil di UI
-- ---------------------------------------------------------------------
INSERT INTO organizations
  (id, name, slug, type, registration_no, founded_year, region_id,
   address, contact_email, contact_phone, description, status) VALUES
  (1, 'Koperasi Subak Sari', 'koperasi-subak-sari', 'koperasi', 'KOP-2018-0472', 2018, 2,
   'Jl. Raya Kediri No. 12, Tabanan, Bali',
   'halo@subaksari.id', '+62361123456',
   'Koperasi pertanian yang menaungi kelompok tani di Tabanan, Badung, dan Gianyar.',
   'aktif');

-- ---------------------------------------------------------------------
-- Pengguna
-- ---------------------------------------------------------------------
INSERT INTO users (id, full_name, email, status) VALUES
  (1, 'Agus Dharma',      'agus@subaksari.id',    'aktif'),
  (2, 'I Wayan Suarta',   'suarta@subaksari.id',  'aktif'),
  (3, 'Ni Made Rini',     'rini@subaksari.id',    'aktif'),
  (4, 'I Ketut Arta',     'arta@subaksari.id',    'aktif'),
  (5, 'Ni Luh Sari',      'sari@subaksari.id',    'aktif'),
  (6, 'I Made Putra',     'made@subaksari.id',    'aktif'),
  (7, 'Ni Kadek Ayu',     'kadek@subaksari.id',   'aktif'),
  (8, 'Dewi Anggraini',   'dewi@bpp-tabanan.go.id', 'aktif');

-- Ni Luh Sari tampil sebagai "Undangan" di tabel Pengguna, tetapi ia
-- sudah menjadi pengelola petak. BR-22 mengharuskan pengelola petak
-- berstatus anggota aktif, jadi di sini statusnya 'aktif'.
INSERT INTO organization_members
  (organization_id, user_id, role, status, joined_at, invited_by_id) VALUES
  (1, 1, 'administrator',     'aktif', '2018-03-01 00:00:00', NULL),
  (1, 2, 'petani',            'aktif', '2018-04-12 00:00:00', 1),
  (1, 3, 'petani',            'aktif', '2019-02-20 00:00:00', 1),
  (1, 4, 'manajer_lapangan',  'aktif', '2019-06-03 00:00:00', 1),
  (1, 5, 'petani',            'aktif', '2020-01-15 00:00:00', 1),
  (1, 6, 'petani',            'aktif', '2021-08-09 00:00:00', 1),
  (1, 7, 'petani',            'aktif', '2022-11-21 00:00:00', 1),
  (1, 8, 'penyuluh',          'aktif', '2023-02-06 00:00:00', 1);

-- Undangan aktif. Dua baris untuk email berbeda; BR-21 mencegah
-- duplikat pending untuk email+organisasi yang sama.
INSERT INTO organization_invitations
  (organization_id, email, role, token, invited_by_id, status, expires_at) VALUES
  (1, 'calon1@subaksari.id', 'petani',
   'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
   1, 'pending', '2026-11-10 00:00:00'),
  (1, 'calon2@subaksari.id', 'petani',
   'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
   1, 'pending', '2026-11-10 00:00:00');

-- ---------------------------------------------------------------------
-- Kelompok tani (6 nama sesuai UI)
-- ---------------------------------------------------------------------
INSERT INTO farm_groups
  (id, organization_id, name, region_id, leader_user_id, established_year) VALUES
  (1, 1, 'Subak Sari',    5, 2, 2018),
  (2, 1, 'Tirta Amerta',  7, 4, 2019),
  (3, 1, 'Mekar Tani',    5, 3, 2019),
  (4, 1, 'Karya Pertiwi', 7, 5, 2020),
  (5, 1, 'Sari Bumi',     8, 6, 2021),
  (6, 1, 'Ayu Lestari',   6, 7, 2022);

INSERT INTO farm_group_members (farm_group_id, user_id, position, joined_on) VALUES
  (1, 2, 'ketua',    '2018-04-12'),
  (1, 5, 'anggota',  '2020-01-15'),
  (1, 6, 'anggota',  '2021-08-09'),
  (2, 4, 'ketua',    '2019-06-03'),
  (2, 7, 'anggota',  '2022-11-21'),
  (3, 3, 'ketua',    '2019-02-20'),
  (3, 6, 'anggota',  '2021-08-09'),
  (4, 5, 'ketua',    '2020-01-15'),
  (4, 2, 'anggota',  '2018-04-12'),
  (5, 6, 'ketua',    '2021-08-09'),
  (5, 3, 'anggota',  '2019-02-20'),
  (6, 7, 'ketua',    '2022-11-21'),
  (6, 5, 'anggota',  '2020-01-15');

-- ---------------------------------------------------------------------
-- Setelan organisasi & preferensi pengguna
-- ---------------------------------------------------------------------
INSERT INTO organization_settings
  (organization_id, area_unit, date_format, auto_sync, weekly_report,
   high_res_photos, public_profile, join_approval, extension_read_access,
   weather_daily, activity_reminder) VALUES
  (1, 'ha', 'd_m_y_long', TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE);

INSERT INTO user_preferences (user_id, theme, language, last_organization_id) VALUES
  (1, 'sistem', 'id', 1),
  (2, 'sistem', 'id', 1),
  (3, 'sistem', 'id', 1),
  (4, 'sistem', 'id', 1),
  (5, 'sistem', 'id', 1),
  (6, 'sistem', 'id', 1),
  (7, 'sistem', 'id', 1),
  (8, 'sistem', 'id', 1);

INSERT INTO user_devices (user_id, platform, device_name, push_token, app_version, last_seen_at) VALUES
  (2, 'android', 'Redmi Note 12', 'fcm-seed-token-android-suarta-0001', '1.0.0', '2026-10-26 09:12:00'),
  (1, 'web',     'Chrome desktop', 'fcm-seed-token-web-agus-0001',      '1.0.0', '2026-10-27 01:30:00');

-- ---------------------------------------------------------------------
-- Master komoditas & varietas
-- base_yield_per_ha dalam kuintal/ha (52,88 = 5,288 ton/ha, angka BPS 2024)
-- ---------------------------------------------------------------------
INSERT INTO commodities
  (id, code, name, category, base_yield_per_ha, default_unit, default_cycle_days) VALUES
  (1, 'padi',  'Padi',        'pangan',       52.88, 'kg', 110),
  (2, 'jagung','Jagung',      'pangan',       57.00, 'kg', 100),
  (3, 'cabai', 'Cabai Merah', 'hortikultura', 90.00, 'kg',  90),
  (4, 'tomat', 'Tomat',       'hortikultura',150.00, 'kg',  75),
  (5, 'kopi',  'Kopi Robusta','perkebunan',    8.00, 'kg', 240);

INSERT INTO crop_varieties (id, commodity_id, name, maturity_days) VALUES
  (1, 1, 'Inpari 32',       110),
  (2, 1, 'Ciherang',        116),
  (3, 2, 'Hibrida',         100),
  (4, 3, 'Merah Keriting',   90),
  (5, 4, 'Tomat Apel',       75),
  (6, 5, 'Robusta',         240);

-- ---------------------------------------------------------------------
-- Master gejala (sesuai checkbox di halaman Scan tanaman)
-- ---------------------------------------------------------------------
INSERT INTO symptoms (id, code, label, category) VALUES
  (1, 'bercak_daun',      'Bercak pada daun',          'daun'),
  (2, 'daun_menguning',   'Daun menguning',            'daun'),
  (3, 'tanaman_layu',     'Tanaman layu',              'umum'),
  (4, 'bagian_membusuk',  'Bagian tanaman membusuk',   'buah');

-- ---------------------------------------------------------------------
-- Petak lahan: 24 baris, total 125,00 ha
-- 6 pertama = baris yang tampil di tabel "Lahan" UI.
-- 18 sisanya = pelengkap agar total luas dan jumlah petak konsisten
-- dengan kartu Ringkasan (125 Ha / 24 petak).
-- ---------------------------------------------------------------------
INSERT INTO plots
  (id, organization_id, farm_group_id, region_id, code, name, area_ha,
   elevation_m, soil_type, irrigation_type, status, address,
   established_on, created_by_id) VALUES
  (1, 1, 1, 5, 'SS-01', 'Subak Sari',     12.40, 180, 'Latosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2018-05-01', 4),
  (2, 1, 3, 5, 'SS-02', 'Lahan Mekar',     8.20, 165, 'Regosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2019-03-11', 4),
  (3, 1, 2, 7, 'SS-03', 'Blok Timur',      6.80, 210, 'Latosol', 'irigasi_teknis', 'perhatian', 'Gianyar, Bali', '2019-07-22', 4),
  (4, 1, 4, 7, 'SS-04', 'Kebun Kedaton',   5.10, 320, 'Andosol', 'tadah_hujan',    'sehat',     'Gianyar, Bali', '2020-02-14', 4),
  (5, 1, 5, 8, 'SS-05', 'Tegal Harum',     4.60, 140, 'Regosol', 'irigasi_teknis', 'sehat',     'Badung, Bali',  '2021-01-09', 4),
  (6, 1, 6, 6, 'SS-06', 'Sawah Tengah',    9.30, 195, 'Latosol', 'irigasi_teknis', 'perhatian', 'Tabanan, Bali', '2018-11-30', 4),

  (7,  1, 1, 5, 'SS-07', 'Blok Utara',     4.20, 186, 'Latosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2019-04-18', 4),
  (8,  1, 2, 5, 'SS-08', 'Blok Selatan',   4.50, 172, 'Regosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2019-09-02', 4),
  (9,  1, 3, 5, 'SS-09', 'Sawah Hilir',    4.10, 158, 'Latosol', 'irigasi_teknis', 'perhatian', 'Tabanan, Bali', '2020-06-27', 4),
  (10, 1, 4, 5, 'SS-10', 'Sawah Hulu',     4.40, 202, 'Latosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2020-10-05', 4),
  (11, 1, 5, 5, 'SS-11', 'Tegal Sari',     4.30, 176, 'Regosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2021-03-19', 4),
  (12, 1, 6, 5, 'SS-12', 'Tegal Asri',     4.60, 168, 'Regosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2021-07-08', 4),
  (13, 1, 1, 6, 'SS-13', 'Kebun Barat',    4.00, 230, 'Andosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2021-11-23', 4),
  (14, 1, 2, 6, 'SS-14', 'Kebun Timur',    4.70, 245, 'Andosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2022-02-17', 4),
  (15, 1, 3, 6, 'SS-15', 'Petak Melati',   4.20, 212, 'Latosol', 'irigasi_teknis', 'perhatian', 'Tabanan, Bali', '2022-05-30', 4),
  (16, 1, 4, 6, 'SS-16', 'Petak Kenanga',  4.40, 205, 'Latosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2022-08-12', 4),
  (17, 1, 5, 6, 'SS-17', 'Subak Ujung',    4.30, 190, 'Regosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2022-12-01', 4),
  (18, 1, 6, 6, 'SS-18', 'Subak Tengah',   4.50, 184, 'Regosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2023-01-25', 4),
  (19, 1, 1, 5, 'SS-19', 'Lahan Harapan',  4.10, 170, 'Latosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2023-03-14', 4),
  (20, 1, 2, 5, 'SS-20', 'Lahan Sejahtera',4.60, 162, 'Regosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2023-05-22', 4),
  (21, 1, 3, 5, 'SS-21', 'Blok Pesisir',   4.20, 110, 'Regosol', 'tadah_hujan',    'perhatian', 'Tabanan, Bali', '2023-08-09', 4),
  (22, 1, 4, 5, 'SS-22', 'Blok Lereng',    4.40, 260, 'Andosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2023-10-17', 4),
  (23, 1, 5, 5, 'SS-23', 'Sawah Baru',     4.30, 175, 'Latosol', 'irigasi_teknis', 'sehat',     'Tabanan, Bali', '2024-01-30', 4),
  (24, 1, 6, 5, 'SS-24', 'Tegal Mulya',    4.80, 166, 'Regosol', 'tadah_hujan',    'sehat',     'Tabanan, Bali', '2024-04-06', 4);

-- ---------------------------------------------------------------------
-- Pengelola petak. Satu utama per petak (BR-02).
-- Petak 1 punya pengelola kedua non-utama untuk menunjukkan relasi
-- banyak-ke-banyak.
-- ---------------------------------------------------------------------
INSERT INTO plot_managers (plot_id, user_id, is_primary, assigned_on) VALUES
  (1, 2, TRUE,  '2018-05-01'), (1, 6, FALSE, '2023-02-01'),
  (2, 3, TRUE,  '2019-03-11'),
  (3, 4, TRUE,  '2019-07-22'),
  (4, 5, TRUE,  '2020-02-14'),
  (5, 6, TRUE,  '2021-01-09'),
  (6, 7, TRUE,  '2018-11-30'),
  (7, 2, TRUE,  '2019-04-18'),
  (8, 3, TRUE,  '2019-09-02'),
  (9, 5, TRUE,  '2020-06-27'),
  (10, 6, TRUE, '2020-10-05'),
  (11, 7, TRUE, '2021-03-19'),
  (12, 2, TRUE, '2021-07-08'),
  (13, 3, TRUE, '2021-11-23'),
  (14, 5, TRUE, '2022-02-17'),
  (15, 6, TRUE, '2022-05-30'),
  (16, 7, TRUE, '2022-08-12'),
  (17, 2, TRUE, '2022-12-01'),
  (18, 3, TRUE, '2023-01-25'),
  (19, 5, TRUE, '2023-03-14'),
  (20, 6, TRUE, '2023-05-22'),
  (21, 7, TRUE, '2023-08-09'),
  (22, 2, TRUE, '2023-10-17'),
  (23, 3, TRUE, '2024-01-30'),
  (24, 5, TRUE, '2024-04-06');

-- ---------------------------------------------------------------------
-- Riwayat kesehatan. Enam petak pertama punya dua snapshot supaya tren
-- bisa diuji; sisanya satu snapshot.
-- ---------------------------------------------------------------------
INSERT INTO plot_health_snapshots (plot_id, recorded_at, health_score, source, notes) VALUES
  (1, '2026-09-27 08:00:00', 90, 'manual', 'Pengamatan rutin'),
  (1, '2026-10-26 08:00:00', 94, 'manual', 'Setelah pemupukan susulan'),
  (2, '2026-09-27 08:00:00', 85, 'manual', 'Pengamatan rutin'),
  (2, '2026-10-26 08:00:00', 89, 'manual', 'Kondisi membaik'),
  (3, '2026-09-27 08:00:00', 74, 'manual', 'Pengamatan rutin'),
  (3, '2026-10-26 08:00:00', 71, 'manual', 'Gejala layu pada sebagian baris'),
  (4, '2026-09-27 08:00:00', 84, 'manual', 'Pengamatan rutin'),
  (4, '2026-10-26 08:00:00', 86, 'manual', 'Pemangkasan selesai'),
  (5, '2026-09-27 08:00:00', 88, 'manual', 'Pengamatan rutin'),
  (5, '2026-10-26 08:00:00', 91, 'model',  'Perhitungan model kesehatan'),
  (6, '2026-09-27 08:00:00', 80, 'manual', 'Pengamatan rutin'),
  (6, '2026-10-26 08:00:00', 76, 'manual', 'Perlu pemeriksaan saluran air'),

  (7,  '2026-10-20 08:00:00', 88, 'manual', NULL),
  (8,  '2026-10-20 08:00:00', 84, 'manual', NULL),
  (9,  '2026-10-20 08:00:00', 73, 'manual', 'Daun menguning pada sebagian petak'),
  (10, '2026-10-20 08:00:00', 90, 'manual', NULL),
  (11, '2026-10-20 08:00:00', 78, 'manual', NULL),
  (12, '2026-10-20 08:00:00', 92, 'manual', NULL),
  (13, '2026-10-20 08:00:00', 86, 'manual', NULL),
  (14, '2026-10-20 08:00:00', 81, 'manual', NULL),
  (15, '2026-10-20 08:00:00', 69, 'manual', 'Bercak daun meluas'),
  (16, '2026-10-20 08:00:00', 87, 'manual', NULL),
  (17, '2026-10-20 08:00:00', 83, 'manual', NULL),
  (18, '2026-10-20 08:00:00', 94, 'manual', NULL),
  (19, '2026-10-20 08:00:00', 79, 'manual', NULL),
  (20, '2026-10-20 08:00:00', 85, 'manual', NULL),
  (21, '2026-10-20 08:00:00', 72, 'manual', 'Wilayah pesisir, salinitas tinggi'),
  (22, '2026-10-20 08:00:00', 89, 'manual', NULL),
  (23, '2026-10-20 08:00:00', 82, 'manual', NULL),
  (24, '2026-10-20 08:00:00', 91, 'manual', NULL);

-- ---------------------------------------------------------------------
-- Batas spasial untuk 2 petak contoh.
-- WKT 4326 memakai urutan (latitude, longitude) — bukan (lon, lat).
-- Poligon dibuat persegi dengan sisi sesuai luas deklarasi sehingga
-- measured_area_ha bisa dibandingkan dengan area_ha.
-- ---------------------------------------------------------------------
INSERT INTO plot_boundaries (plot_id, boundary, centroid) VALUES
  (1,
   ST_GeomFromText('POLYGON((-8.5425920 115.1214007, -8.5425920 115.1245993, -8.5394080 115.1245993, -8.5394080 115.1214007, -8.5425920 115.1214007))', 4326),
   ST_GeomFromText('POINT(-8.5410000 115.1230000)', 4326)),
  (5,
   ST_GeomFromText('POLYGON((-8.6479696 115.1710257, -8.6479696 115.1729743, -8.6460304 115.1729743, -8.6460304 115.1710257, -8.6479696 115.1710257))', 4326),
   ST_GeomFromText('POINT(-8.6470000 115.1720000)', 4326));

-- Luas geodetik: ST_Area() pada SRS geografis mengembalikan m² (MySQL >= 8.0.13).
-- Bagi 10.000 untuk hektare. Jangan menganggap hasilnya derajat.
UPDATE plot_boundaries
SET measured_area_ha = ROUND(ST_Area(boundary) / 10000, 2)
WHERE measured_area_ha IS NULL;

COMMIT;

-- =====================================================================
-- Ringkasan setelah seed:
--   regions 8 · organizations 1 · users 8 · members 8 · invitations 2
--   farm_groups 6 · group_members 13 · commodities 5 · varieties 6
--   symptoms 4 · plots 24 (125,00 ha) · plot_managers 25
--   health_snapshots 30 · plot_boundaries 2
-- =====================================================================
