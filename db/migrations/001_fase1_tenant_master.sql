-- =====================================================================
-- MAPAN · Fase 1 · Tenancy & Master (13 tabel)
-- Target  : MySQL 8.0.16+
-- Prasyarat: 00_init.sql
--
-- Isi: regions, organizations, users, organization_members,
--      organization_invitations, farm_groups, farm_group_members,
--      organization_settings, user_preferences, user_devices,
--      commodities, crop_varieties, symptoms
--
-- Urutan pembuatan mengikuti arah foreign key dan tidak boleh diacak.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

-- ---------------------------------------------------------------------
-- 1. regions
-- Hierarki wilayah administratif (provinsi -> kabupaten -> kecamatan).
-- Mereferensi dirinya sendiri lewat parent_id.
-- ---------------------------------------------------------------------
CREATE TABLE regions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id   BIGINT UNSIGNED NULL COMMENT 'NULL untuk provinsi',
  level       ENUM('provinsi','kabupaten','kecamatan','desa') NOT NULL,
  name        VARCHAR(120) NOT NULL,
  bps_code    CHAR(10) NULL COMMENT 'Kode wilayah BPS, penghubung ke statistical_values',
  latitude    DECIMAL(9,6) NULL,
  longitude   DECIMAL(9,6) NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_regions_bps_code (bps_code),
  KEY ix_regions_parent_level (parent_id, level),
  KEY ix_regions_level_name (level, name),

  CONSTRAINT fk_regions_parent
    FOREIGN KEY (parent_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_regions_latitude
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_regions_longitude
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Hierarki wilayah administratif';

-- ---------------------------------------------------------------------
-- 2. organizations
-- Koperasi / gapoktan / perusahaan agribisnis. Batas isolasi data (tenant).
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(160) NOT NULL,
  slug             VARCHAR(80) NOT NULL,
  type             ENUM('koperasi','gapoktan','perusahaan_agribisnis','lainnya')
                     NOT NULL DEFAULT 'koperasi',
  registration_no  VARCHAR(60) NULL COMMENT 'Nomor badan hukum, mis. KOP-2018-0472',
  founded_year     SMALLINT UNSIGNED NULL,
  region_id        BIGINT UNSIGNED NULL,
  address          VARCHAR(255) NULL,
  contact_email    VARCHAR(160) NULL,
  contact_phone    VARCHAR(32) NULL,
  description      TEXT NULL,
  logo_path        VARCHAR(255) NULL COMMENT 'Path object storage, bukan blob',
  status           ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                     ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at       DATETIME(6) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_organizations_slug (slug),
  UNIQUE KEY uk_organizations_registration_no (registration_no),
  KEY ix_organizations_status (status, deleted_at),
  KEY ix_organizations_region (region_id),

  CONSTRAINT fk_organizations_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_organizations_founded_year
    CHECK (founded_year IS NULL OR founded_year BETWEEN 1900 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Koperasi/gapoktan pemilik data (tenant)';

-- ---------------------------------------------------------------------
-- 3. users
-- Akun orang. TIDAK menyimpan organisasi atau peran; keduanya ada di
-- organization_members. Satu orang boleh tergabung di banyak organisasi.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  phone             VARCHAR(32) NULL COMMENT 'Unik bila terisi; NULL diizinkan untuk akun web-only',
  password_hash     VARCHAR(255) NULL COMMENT 'Kredensial diisi lewat alur API, bukan seed',
  pin_hash          VARCHAR(255) NULL COMMENT 'PIN 6 digit untuk aplikasi mobile',
  avatar_path       VARCHAR(255) NULL,
  email_verified_at DATETIME(6) NULL,
  last_active_at    DATETIME(6) NULL,
  status            ENUM('aktif','nonaktif','ditangguhkan') NOT NULL DEFAULT 'aktif',
  created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                      ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at        DATETIME(6) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  KEY ix_users_status_active (status, last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Akun pengguna lintas organisasi';

-- ---------------------------------------------------------------------
-- 4. organization_members
-- Peran menempel di sini, bukan di users (BR-01).
-- ---------------------------------------------------------------------
CREATE TABLE organization_members (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,
  role             ENUM('administrator','manajer_lapangan','petani','penyuluh') NOT NULL,
  status           ENUM('aktif','undangan','nonaktif') NOT NULL DEFAULT 'undangan',
  joined_at        DATETIME(6) NULL COMMENT 'NULL selama masih undangan',
  invited_by_id    BIGINT UNSIGNED NULL,
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                     ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_members_org_user (organization_id, user_id),
  KEY ix_members_org_role_status (organization_id, role, status),
  KEY ix_members_user_status (user_id, status),

  CONSTRAINT fk_members_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_members_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_members_invited_by
    FOREIGN KEY (invited_by_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Keanggotaan user di organisasi beserta perannya';

-- ---------------------------------------------------------------------
-- 5. organization_invitations
-- Undangan ke alamat email yang belum tentu punya akun.
-- pending_key meniru partial unique index (BR-21).
--
-- Catatan MySQL: pending_key harus VIRTUAL, bukan STORED. MySQL menolak
-- ON DELETE CASCADE pada kolom dasar generated column STORED (error 1215),
-- sedangkan organization_id justru ingin CASCADE.
-- ---------------------------------------------------------------------
CREATE TABLE organization_invitations (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id  BIGINT UNSIGNED NOT NULL,
  email            VARCHAR(160) NOT NULL,
  role             ENUM('administrator','manajer_lapangan','petani','penyuluh') NOT NULL,
  token            CHAR(64) NOT NULL,
  invited_by_id    BIGINT UNSIGNED NULL,
  status           ENUM('pending','diterima','kedaluwarsa','dibatalkan') NOT NULL DEFAULT 'pending',
  expires_at       DATETIME(6) NOT NULL,
  accepted_at      DATETIME(6) NULL,
  pending_key      VARCHAR(200) GENERATED ALWAYS AS (
                     IF(status = 'pending', CONCAT(organization_id, ':', email), NULL)
                   ) VIRTUAL COMMENT 'NULL saat tidak pending, sehingga email boleh diundang lagi',
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                     ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_invitations_token (token),
  UNIQUE KEY uk_invitations_pending (pending_key),
  KEY ix_invitations_org_status (organization_id, status),
  KEY ix_invitations_email (email),

  CONSTRAINT fk_invitations_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invitations_invited_by
    FOREIGN KEY (invited_by_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Undangan bergabung ke organisasi';

-- ---------------------------------------------------------------------
-- 6. farm_groups
-- Kelompok tani. Jumlah anggota dan total luas TIDAK disimpan (dihitung).
-- ---------------------------------------------------------------------
CREATE TABLE farm_groups (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id   BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(120) NOT NULL,
  region_id         BIGINT UNSIGNED NULL,
  leader_user_id    BIGINT UNSIGNED NULL,
  established_year  SMALLINT UNSIGNED NULL,
  description       TEXT NULL,
  created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                      ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at        DATETIME(6) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_farm_groups_org_name (organization_id, name),
  KEY ix_farm_groups_region (region_id),
  KEY ix_farm_groups_leader (leader_user_id),

  CONSTRAINT fk_farm_groups_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_farm_groups_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_farm_groups_leader
    FOREIGN KEY (leader_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Kelompok tani di dalam organisasi';

-- ---------------------------------------------------------------------
-- 7. farm_group_members
-- ---------------------------------------------------------------------
CREATE TABLE farm_group_members (
  farm_group_id  BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  position       ENUM('ketua','pengurus','anggota') NOT NULL DEFAULT 'anggota',
  joined_on      DATE NULL,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (farm_group_id, user_id),
  KEY ix_farm_group_members_user (user_id),

  CONSTRAINT fk_fgm_group
    FOREIGN KEY (farm_group_id) REFERENCES farm_groups (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_fgm_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Keanggotaan kelompok tani';

-- ---------------------------------------------------------------------
-- 8. organization_settings
-- Satu baris per organisasi. Kolom bertipe eksplisit, bukan key-value.
-- ---------------------------------------------------------------------
CREATE TABLE organization_settings (
  organization_id       BIGINT UNSIGNED NOT NULL,
  area_unit             ENUM('ha','m2','are') NOT NULL DEFAULT 'ha',
  date_format           ENUM('d_m_y_long','d_m_y','y_m_d') NOT NULL DEFAULT 'd_m_y_long',
  auto_sync             BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_report         BOOLEAN NOT NULL DEFAULT FALSE,
  high_res_photos       BOOLEAN NOT NULL DEFAULT FALSE,
  public_profile        BOOLEAN NOT NULL DEFAULT FALSE,
  join_approval         BOOLEAN NOT NULL DEFAULT TRUE,
  extension_read_access BOOLEAN NOT NULL DEFAULT FALSE,
  weather_daily         BOOLEAN NOT NULL DEFAULT FALSE,
  activity_reminder     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                          ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (organization_id),

  CONSTRAINT fk_org_settings_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Preferensi tingkat organisasi';

-- ---------------------------------------------------------------------
-- 9. user_preferences
-- ---------------------------------------------------------------------
CREATE TABLE user_preferences (
  user_id               BIGINT UNSIGNED NOT NULL,
  theme                 ENUM('terang','gelap','sistem') NOT NULL DEFAULT 'sistem',
  language              CHAR(5) NOT NULL DEFAULT 'id',
  last_organization_id  BIGINT UNSIGNED NULL COMMENT 'Mengisi pemilih organisasi di sidebar',
  created_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                          ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (user_id),
  KEY ix_user_preferences_last_org (last_organization_id),

  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_preferences_last_org
    FOREIGN KEY (last_organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Preferensi tampilan per pengguna';

-- ---------------------------------------------------------------------
-- 10. user_devices
-- Token FCM untuk notifikasi push.
-- ---------------------------------------------------------------------
CREATE TABLE user_devices (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  platform      ENUM('android','ios','web') NOT NULL,
  device_name   VARCHAR(120) NULL,
  push_token    VARCHAR(255) NOT NULL,
  app_version   VARCHAR(20) NULL,
  last_seen_at  DATETIME(6) NULL,
  revoked_at    DATETIME(6) NULL,
  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_user_devices_push_token (push_token),
  KEY ix_user_devices_user (user_id, revoked_at),

  CONSTRAINT fk_user_devices_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Perangkat terdaftar untuk notifikasi push';

-- ---------------------------------------------------------------------
-- 11. commodities
-- base_yield_per_ha = koefisien BaseYield pada rumus prediksi (kuintal/ha).
-- ---------------------------------------------------------------------
CREATE TABLE commodities (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code               VARCHAR(20) NOT NULL,
  name               VARCHAR(80) NOT NULL,
  category           ENUM('pangan','hortikultura','perkebunan','lainnya') NOT NULL,
  base_yield_per_ha  DECIMAL(10,2) NULL COMMENT 'Kuintal per hektare',
  default_unit       ENUM('kg','ton','kuintal') NOT NULL DEFAULT 'kg'
                       COMMENT 'Satuan tampilan; satuan kanonis tetap kg',
  default_cycle_days SMALLINT UNSIGNED NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                       ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_commodities_code (code),
  KEY ix_commodities_category_active (category, is_active),

  CONSTRAINT ck_commodities_base_yield
    CHECK (base_yield_per_ha IS NULL OR base_yield_per_ha >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Master komoditas';

-- ---------------------------------------------------------------------
-- 12. crop_varieties
-- ---------------------------------------------------------------------
CREATE TABLE crop_varieties (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  commodity_id   BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(80) NOT NULL,
  maturity_days  SMALLINT UNSIGNED NULL,
  description    TEXT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_crop_varieties_commodity_name (commodity_id, name),
  KEY ix_crop_varieties_commodity_active (commodity_id, is_active),

  CONSTRAINT fk_crop_varieties_commodity
    FOREIGN KEY (commodity_id) REFERENCES commodities (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Varietas per komoditas';

-- ---------------------------------------------------------------------
-- 13. symptoms
-- Master gejala untuk halaman Scan tanaman (bukan tabel penyakit).
-- ---------------------------------------------------------------------
CREATE TABLE symptoms (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(30) NOT NULL,
  label       VARCHAR(120) NOT NULL,
  category    ENUM('daun','batang','buah','akar','umum') NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (id),
  UNIQUE KEY uk_symptoms_code (code),
  KEY ix_symptoms_category_active (category, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Master gejala tanaman';

-- =====================================================================
-- Selesai Fase 1: 13 tabel
-- =====================================================================
