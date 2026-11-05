-- =====================================================================
-- TUGAS PERSONAL 1 â€” DATABASE
-- Sistem: MAPAN (Manajemen & Analisis Prediksi Agri Nusantara)
-- Versi subset pendidikan: 6 tabel berelasi
-- Catatan: menjalankan file ini membangun ulang database mapan_tugas1
--          (aman diulang, semua DROP IF EXISTS di awal)
-- Jalankan: mysql -u <user> -p < mapan-tugas1.sql
-- =====================================================================

DROP DATABASE IF EXISTS mapan_tugas1;
CREATE DATABASE mapan_tugas1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapan_tugas1;

-- =====================================================================
-- BAGIAN 4 â€” IMPLEMENTASI DATABASE (SQL DDL)
-- 6 tabel: commodities, users, organizations, organization_members,
--          plots, organization_records
-- =====================================================================

-- 4.1 Master komoditas
CREATE TABLE commodities (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(80)  NOT NULL,
  category        ENUM('pangan','hortikultura','perkebunan') NOT NULL,
  benchmark_yield DECIMAL(6,2) NOT NULL COMMENT 'benchmark ton/hektar',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 Pengguna
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NULL,
  password_hash CHAR(60)     NOT NULL COMMENT 'hash bcrypt, lihat dokumen keamanan',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4.3 Organisasi (kelompok tani/koperasi)
CREATE TABLE organizations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  regency    VARCHAR(100) NOT NULL DEFAULT 'Kab. Semarang',
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4.4 Anggota organisasi â€” relasi N:N users <-> organizations + peran
CREATE TABLE organization_members (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id         INT NOT NULL,
  role            ENUM('administrator','manager','farmer','extension_officer') NOT NULL,
  joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (user_id)         REFERENCES users (id)
);

-- 4.5 Lahan/petak
CREATE TABLE plots (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  commodity_id    INT NOT NULL,
  managed_by      INT NULL COMMENT 'petani pengelola',
  name            VARCHAR(120) NOT NULL,
  area_hectares   DECIMAL(8,3) NOT NULL,
  status          ENUM('sehat','waspada','kritis') NOT NULL DEFAULT 'sehat',
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (commodity_id)    REFERENCES commodities (id),
  FOREIGN KEY (managed_by)      REFERENCES users (id)
);

-- 4.6 Catatan operasional (aktivitas/tugas/panen/scan)
CREATE TABLE organization_records (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  organization_id  INT NOT NULL,
  plot_id          INT NULL,
  author_id        INT NOT NULL,
  record_type      ENUM('activity','task','harvest','scan') NOT NULL,
  title            VARCHAR(160) NOT NULL,
  occurred_on      DATE         NOT NULL,
  progress_percent TINYINT      NOT NULL DEFAULT 0,
  FOREIGN KEY (organization_id) REFERENCES organizations (id),
  FOREIGN KEY (plot_id)         REFERENCES plots (id),
  FOREIGN KEY (author_id)       REFERENCES users (id)
);

-- =====================================================================
-- BAGIAN 5 â€” PENGISIAN DATA (SQL DML)
-- =====================================================================

-- 5.1 INSERT komoditas (6 baris)
INSERT INTO commodities (name, category, benchmark_yield) VALUES
  ('Padi',   'pangan',       5.20),
  ('Jagung', 'pangan',       5.80),
  ('Cabai',  'hortikultura', 8.00),
  ('Tomat',  'hortikultura',25.00),
  ('Kopi',   'perkebunan',   1.10),
  ('Ubi',    'pangan',       9.00);

-- 5.2 INSERT pengguna (6 baris, password_hash = contoh hash bcrypt fiktif)
INSERT INTO users (name, email, phone, password_hash) VALUES
  ('Siti Rahayu',    'siti@tani.id',   '081200000001', '$2y$10$hashsimulasitugas100000000000000000000000000000000001'),
  ('Budi Santoso',   'budi@tani.id',   '081200000002', '$2y$10$hashsimulasitugas100000000000000000000000000000000001'),
  ('Agus Priono',    'agus@tani.id',   '081200000003', '$2y$10$hashsimulasitugas100000000000000000000000000000000001'),
  ('Rina Wulandari', 'rina@tani.id',   '081200000004', '$2y$10$hashsimulasitugas100000000000000000000000000000000001'),
  ('Joko Susilo',    'joko@tani.id',   '081200000005', '$2y$10$hashsimulasitugas100000000000000000000000000000000001'),
  ('Dewi Astuti',    'dewi@tani.id',   '081200000006', '$2y$10$hashsimulasitugas100000000000000000000000000000000001');

-- 5.3 INSERT organisasi (5 baris)
INSERT INTO organizations (name, regency) VALUES
  ('Gapoktan Tani Makmur',        'Kab. Semarang'),
  ('Koperasi Tani Harapan',       'Kab. Semarang'),
  ('Gapoktan Mekar Jaya',         'Kab. Temanggung'),
  ('Kelompok Hortikultura Sari',  'Kab. Boyolali'),
  ('Koperasi Kopi Buana',         'Kab. Temanggung');

-- 5.4 INSERT anggota organisasi (8 baris: N:N users-organizations)
INSERT INTO organization_members (organization_id, user_id, role) VALUES
  (1, 1, 'administrator'),
  (1, 2, 'manager'),
  (1, 3, 'farmer'),
  (1, 4, 'extension_officer'),
  (2, 5, 'administrator'),
  (2, 3, 'farmer'),
  (3, 6, 'administrator'),
  (4, 1, 'manager');

-- 5.5 INSERT lahan (6 baris)
INSERT INTO plots (organization_id, commodity_id, managed_by, name, area_hectares, status) VALUES
  (1, 1, 3, 'Sawah Blok Utara',     1.250, 'sehat'),
  (1, 2, 3, 'Jagung Blok Selatan',  0.800, 'waspada'),
  (1, 3, 2, 'Kebun Cabai Belakang', 0.400, 'kritis'),
  (2, 4, 5, 'Kebun Tomat Rini',     0.500, 'sehat'),
  (2, 1, 5, 'Sawah Debogor',        2.100, 'sehat'),
  (3, 5, 6, 'Lahan Kopi Lereng',    3.500, 'waspada');

-- 5.6 INSERT catatan operasional (7 baris)
INSERT INTO organization_records (organization_id, plot_id, author_id, record_type, title, occurred_on, progress_percent) VALUES
  (1, 1, 3, 'activity', 'Pemupukan tahap 2 Sawah Blok Utara',      '2026-10-05', 100),
  (1, 2, 3, 'task',     'Penyemprotan hama Jagung Selatan',        '2026-10-12', 70),
  (1, 3, 2, 'scan',     'Pemeriksaan gejala daun keriting cabai',  '2026-10-15', 60),
  (1, 1, 1, 'harvest',  'Panen perdana Sawah Blok Utara',          '2026-10-30', 100),
  (2, 5, 5, 'activity', 'Penyiaran benih Sawah Debogor',           '2026-09-28', 100),
  (2, 4, 5, 'harvest',  'Panen tomat gelombang 1',                 '2026-10-20', 100),
  (3, 6, 6, 'activity', 'Pemangkasan kopi Lereng',                 '2026-10-08', 45);

-- 5.7 UPDATE â€” memperbarui data yang ada:
--     a) status lahan kritis diturunkan jadi waspada setelah tindak lanjut
UPDATE plots SET status = 'waspada' WHERE id = 3;
--     b) progres tugas penyemprotan naik ke 100%
UPDATE organization_records SET progress_percent = 100
  WHERE title = 'Penyemprotan hama Jagung Selatan';

-- 5.8 DELETE â€” menghapus satu catatan simulasi yang salah input:
--     (buat dulu baris datanya, lalu hapus agar hasil eksekusi terlihat)
INSERT INTO organization_records (organization_id, plot_id, author_id, record_type, title, occurred_on)
  VALUES (1, 2, 3, 'task', 'Catatan sementara untuk dihapus', '2026-10-18');
DELETE FROM organization_records WHERE title = 'Catatan sementara untuk dihapus';

-- 5.9 Verifikasi isi tabel seluruhnya
SELECT * FROM commodities;
SELECT * FROM users;
SELECT * FROM organizations;
SELECT * FROM organization_members;
SELECT * FROM plots;
SELECT * FROM organization_records;

-- =====================================================================
-- BAGIAN 6 â€” PENGUJIAN QUERY
-- =====================================================================

-- Q1 Menampilkan data (SELECT + JOIN):
--    Katalog lahan + komoditas + organisasi
SELECT p.id, p.name AS lahan, c.name AS komoditas, o.name AS organisasi,
       p.area_hectares AS luas_ha, p.status
FROM plots p
JOIN commodities c   ON c.id = p.commodity_id
JOIN organizations o ON o.id = p.organization_id;

-- Q2 Menggabungkan tabel (3 tabel: users - members - organizations)
SELECT u.name AS pengguna, u.email, m.role AS peran, o.name AS organisasi
FROM organization_members m
JOIN users u         ON u.id = m.user_id
JOIN organizations o ON o.id = m.organization_id
ORDER BY o.name, m.role;

-- Q3 Mem-filter data:
--    a) lahan milik status kritis ATAU luas > 1 hektar
SELECT p.name AS lahan, o.name AS organisasi, p.area_hectares AS luas_ha, p.status
FROM plots p
JOIN organizations o ON o.id = p.organization_id
WHERE p.status = 'kritis' OR p.area_hectares > 1.000;

--    b) catatan panen yang sudah selesai
SELECT r.title, r.occurred_on, r.progress_percent, p.name AS lahan
FROM organization_records r
LEFT JOIN plots p ON p.id = r.plot_id
WHERE r.record_type = 'harvest' AND r.progress_percent >= 100;

-- Q4 Merekapitulasi data (GROUP BY + agregat):
--    a) luas & jumlah lahan per organisasi
SELECT o.name AS organisasi, COUNT(*) AS jumlah_lahan,
       SUM(p.area_hectares) AS total_luas_ha
FROM plots p
JOIN organizations o ON o.id = p.organization_id
GROUP BY o.name;

--    b) jumlah catatan per jenis dan per organisasi
SELECT o.name AS organisasi, r.record_type AS jenis, COUNT(*) AS jumlah
FROM organization_records r
JOIN organizations o ON o.id = r.organization_id
GROUP BY o.name, r.record_type
ORDER BY o.name, jumlah DESC;

--    c) jumlah anggota per peran
SELECT m.role AS peran, COUNT(*) AS jumlah_anggota
FROM organization_members m
GROUP BY m.role
ORDER BY jumlah_anggota DESC;

--    d) (bonus) log aktivitas kategorinya per komoditas rata
SELECT c.name AS komoditas, COUNT(r.id) AS jumlah_catatan,
       ROUND(AVG(r.progress_percent), 1) AS rata_progres
FROM organization_records r
LEFT JOIN plots p ON p.id = r.plot_id
JOIN commodities c ON c.id = p.commodity_id
GROUP BY c.name
ORDER BY rata_progres DESC;
