-- =====================================================================
-- MAPAN · Fase 2 · Lahan & Spasial (4 tabel)
-- Target  : MySQL 8.0.16+
-- Prasyarat: 001_fase1_tenant_master.sql
--
-- Isi: plots, plot_boundaries, plot_managers, plot_health_snapshots
--
-- Catatan spasial:
--   * SRID 4326 memakai urutan sumbu (latitude, longitude) di MySQL.
--   * SPATIAL INDEX mewajibkan kolom NOT NULL, karena itu batas lahan
--     dipisah ke plot_boundaries (README §3.1).
--   * ST_Centroid() TIDAK didukung untuk SRS geografis, jadi centroid
--     diisi oleh aplikasi/proyeksi, bukan dihitung di sini.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

-- ---------------------------------------------------------------------
-- 1. plots
-- Petak lahan. Tidak menyimpan nama petani, nama komoditas, atau nama
-- wilayah (seluruhnya lewat foreign key agar 3NF).
-- ---------------------------------------------------------------------
CREATE TABLE plots (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,
  farm_group_id    BIGINT UNSIGNED NULL,
  region_id        BIGINT UNSIGNED NOT NULL COMMENT 'Kecamatan; dasar pencocokan cuaca',
  code             VARCHAR(30) NULL COMMENT 'Kode internal petak, unik per organisasi',
  name             VARCHAR(120) NOT NULL,
  area_ha          DECIMAL(10,2) NOT NULL COMMENT 'Luas hektare, bukan teks "12,4 ha"',
  elevation_m      SMALLINT NULL,
  soil_type        VARCHAR(60) NULL,
  irrigation_type  ENUM('irigasi_teknis','tadah_hujan','lebak','lainnya') NULL,
  status           ENUM('sehat','perhatian','kritis','tidak_aktif') NOT NULL DEFAULT 'sehat',
  address          VARCHAR(255) NULL,
  established_on   DATE NULL,
  notes            TEXT NULL,
  created_by_id    BIGINT UNSIGNED NULL,
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                     ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at       DATETIME(6) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_plots_org_code (organization_id, code),
  KEY ix_plots_org_status (organization_id, status, deleted_at),
  KEY ix_plots_group (farm_group_id),
  KEY ix_plots_region (region_id),

  CONSTRAINT fk_plots_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_plots_group
    FOREIGN KEY (farm_group_id) REFERENCES farm_groups (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_plots_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_plots_created_by
    FOREIGN KEY (created_by_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_plots_area
    CHECK (area_ha > 0),
  CONSTRAINT ck_plots_elevation
    CHECK (elevation_m IS NULL OR elevation_m BETWEEN -500 AND 9000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Petak lahan yang dikelola';

-- ---------------------------------------------------------------------
-- 2. plot_boundaries
-- Relasi 1:1 dengan plots. Dipisah agar plots bisa dibuat sebelum batas
-- dipetakan, sementara tabel ini memenuhi syarat SPATIAL INDEX (NOT NULL).
-- ---------------------------------------------------------------------
CREATE TABLE plot_boundaries (
  plot_id           BIGINT UNSIGNED NOT NULL,
  boundary          POLYGON NOT NULL SRID 4326,
  centroid          POINT NOT NULL SRID 4326
                      COMMENT 'Diisi aplikasi/proyeksi, bukan ST_Centroid()',
  measured_area_ha  DECIMAL(10,2) NULL
                      COMMENT 'ST_Area(boundary)/10000; pembanding area_ha deklarasi',
  mapped_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (plot_id),
  SPATIAL KEY sx_plot_boundaries_boundary (boundary),
  SPATIAL KEY sx_plot_boundaries_centroid (centroid),

  CONSTRAINT fk_plot_boundaries_plot
    FOREIGN KEY (plot_id) REFERENCES plots (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_plot_boundaries_measured_area
    CHECK (measured_area_ha IS NULL OR measured_area_ha > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Batas spasial petak (1:1)';

-- ---------------------------------------------------------------------
-- 3. plot_managers
-- Banyak petani per petak, satu ditandai utama (BR-02).
-- primary_guard meniru partial unique index.
--
-- primary_guard VIRTUAL (bukan STORED) karena plot_id memakai ON DELETE
-- CASCADE, dan MySQL menolak CASCADE pada kolom dasar generated STORED.
-- ---------------------------------------------------------------------
CREATE TABLE plot_managers (
  plot_id        BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_on    DATE NULL,
  primary_guard  BIGINT UNSIGNED GENERATED ALWAYS AS (
                   IF(is_primary, plot_id, NULL)
                 ) VIRTUAL COMMENT 'NULL untuk pengelola non-utama; UNIQUE menjaga maksimal satu utama',

  PRIMARY KEY (plot_id, user_id),
  UNIQUE KEY uk_plot_managers_primary (primary_guard),
  KEY ix_plot_managers_user (user_id),

  CONSTRAINT fk_plot_managers_plot
    FOREIGN KEY (plot_id) REFERENCES plots (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plot_managers_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Petani pengelola petak (banyak-ke-banyak)';

-- ---------------------------------------------------------------------
-- 4. plot_health_snapshots
-- Riwayat skor kesehatan; angka 94% di UI = baris terbaru per petak.
-- ---------------------------------------------------------------------
CREATE TABLE plot_health_snapshots (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plot_id      BIGINT UNSIGNED NOT NULL,
  recorded_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  health_score TINYINT UNSIGNED NOT NULL,
  ndvi         DECIMAL(5,4) NULL COMMENT 'Belum ada pipeline pengisi otomatis',
  source       ENUM('manual','satelit','model') NOT NULL DEFAULT 'manual',
  notes        VARCHAR(255) NULL,
  created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  KEY ix_health_plot_time (plot_id, recorded_at DESC),

  CONSTRAINT fk_health_plot
    FOREIGN KEY (plot_id) REFERENCES plots (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_health_score
    CHECK (health_score BETWEEN 0 AND 100),
  CONSTRAINT ck_health_ndvi
    CHECK (ndvi IS NULL OR ndvi BETWEEN -1 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Riwayat skor kesehatan petak';

-- =====================================================================
-- Selesai Fase 2: 4 tabel (total Fase 1+2 = 17 tabel)
-- =====================================================================
