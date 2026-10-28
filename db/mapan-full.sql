
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mapan` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `mapan`;
DROP TABLE IF EXISTS `commodities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commodities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(80) NOT NULL,
  `category` enum('pangan','hortikultura','perkebunan','lainnya') NOT NULL,
  `base_yield_per_ha` decimal(10,2) DEFAULT NULL COMMENT 'Kuintal per hektare',
  `default_unit` enum('kg','ton','kuintal') NOT NULL DEFAULT 'kg' COMMENT 'Satuan tampilan; satuan kanonis tetap kg',
  `default_cycle_days` smallint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_commodities_code` (`code`),
  KEY `ix_commodities_category_active` (`category`,`is_active`),
  CONSTRAINT `ck_commodities_base_yield` CHECK (((`base_yield_per_ha` is null) or (`base_yield_per_ha` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master komoditas';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `commodities` WRITE;
/*!40000 ALTER TABLE `commodities` DISABLE KEYS */;
INSERT INTO `commodities` VALUES (1,'padi','Padi','pangan',52.88,'kg',110,1,'2026-10-27 01:46:34.614152','2026-10-27 01:46:34.614152'),(2,'jagung','Jagung','pangan',57.00,'kg',100,1,'2026-10-27 01:46:34.614152','2026-10-27 01:46:34.614152'),(3,'cabai','Cabai Merah','hortikultura',90.00,'kg',90,1,'2026-10-27 01:46:34.614152','2026-10-27 01:46:34.614152'),(4,'tomat','Tomat','hortikultura',150.00,'kg',75,1,'2026-10-27 01:46:34.614152','2026-10-27 01:46:34.614152'),(5,'kopi','Kopi Robusta','perkebunan',8.00,'kg',240,1,'2026-10-27 01:46:34.614152','2026-10-27 01:46:34.614152');
/*!40000 ALTER TABLE `commodities` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `crop_varieties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_varieties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `commodity_id` bigint unsigned NOT NULL,
  `name` varchar(80) NOT NULL,
  `maturity_days` smallint unsigned DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_crop_varieties_commodity_name` (`commodity_id`,`name`),
  KEY `ix_crop_varieties_commodity_active` (`commodity_id`,`is_active`),
  CONSTRAINT `fk_crop_varieties_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Varietas per komoditas';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `crop_varieties` WRITE;
/*!40000 ALTER TABLE `crop_varieties` DISABLE KEYS */;
INSERT INTO `crop_varieties` VALUES (1,1,'Inpari 32',110,NULL,1,'2026-10-27 01:46:34.615734'),(2,1,'Ciherang',116,NULL,1,'2026-10-27 01:46:34.615734'),(3,2,'Hibrida',100,NULL,1,'2026-10-27 01:46:34.615734'),(4,3,'Merah Keriting',90,NULL,1,'2026-10-27 01:46:34.615734'),(5,4,'Tomat Apel',75,NULL,1,'2026-10-27 01:46:34.615734'),(6,5,'Robusta',240,NULL,1,'2026-10-27 01:46:34.615734');
/*!40000 ALTER TABLE `crop_varieties` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `farm_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_group_members` (
  `farm_group_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `position` enum('ketua','pengurus','anggota') NOT NULL DEFAULT 'anggota',
  `joined_on` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`farm_group_id`,`user_id`),
  KEY `ix_farm_group_members_user` (`user_id`),
  CONSTRAINT `fk_fgm_group` FOREIGN KEY (`farm_group_id`) REFERENCES `farm_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fgm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Keanggotaan kelompok tani';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `farm_group_members` WRITE;
/*!40000 ALTER TABLE `farm_group_members` DISABLE KEYS */;
INSERT INTO `farm_group_members` VALUES (1,2,'ketua','2018-04-12','2026-10-27 01:46:34.608288'),(1,5,'anggota','2020-01-15','2026-10-27 01:46:34.608288'),(1,6,'anggota','2021-08-09','2026-10-27 01:46:34.608288'),(2,4,'ketua','2019-06-03','2026-10-27 01:46:34.608288'),(2,7,'anggota','2022-11-21','2026-10-27 01:46:34.608288'),(3,3,'ketua','2019-02-20','2026-10-27 01:46:34.608288'),(3,6,'anggota','2021-08-09','2026-10-27 01:46:34.608288'),(4,2,'anggota','2018-04-12','2026-10-27 01:46:34.608288'),(4,5,'ketua','2020-01-15','2026-10-27 01:46:34.608288'),(5,3,'anggota','2019-02-20','2026-10-27 01:46:34.608288'),(5,6,'ketua','2021-08-09','2026-10-27 01:46:34.608288'),(6,5,'anggota','2020-01-15','2026-10-27 01:46:34.608288'),(6,7,'ketua','2022-11-21','2026-10-27 01:46:34.608288');
/*!40000 ALTER TABLE `farm_group_members` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `farm_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `name` varchar(120) NOT NULL,
  `region_id` bigint unsigned DEFAULT NULL,
  `leader_user_id` bigint unsigned DEFAULT NULL,
  `established_year` smallint unsigned DEFAULT NULL,
  `description` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farm_groups_org_name` (`organization_id`,`name`),
  KEY `ix_farm_groups_region` (`region_id`),
  KEY `ix_farm_groups_leader` (`leader_user_id`),
  CONSTRAINT `fk_farm_groups_leader` FOREIGN KEY (`leader_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_farm_groups_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_farm_groups_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Kelompok tani di dalam organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `farm_groups` WRITE;
/*!40000 ALTER TABLE `farm_groups` DISABLE KEYS */;
INSERT INTO `farm_groups` VALUES (1,1,'Subak Sari',5,2,2018,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL),(2,1,'Tirta Amerta',7,4,2019,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL),(3,1,'Mekar Tani',5,3,2019,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL),(4,1,'Karya Pertiwi',7,5,2020,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL),(5,1,'Sari Bumi',8,6,2021,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL),(6,1,'Ayu Lestari',6,7,2022,NULL,'2026-10-27 01:46:34.606631','2026-10-27 01:46:34.606631',NULL);
/*!40000 ALTER TABLE `farm_groups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `organization_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `email` varchar(160) NOT NULL,
  `role` enum('administrator','manajer_lapangan','petani','penyuluh') NOT NULL,
  `token` char(64) NOT NULL,
  `invited_by_id` bigint unsigned DEFAULT NULL,
  `status` enum('pending','diterima','kedaluwarsa','dibatalkan') NOT NULL DEFAULT 'pending',
  `expires_at` datetime(6) NOT NULL,
  `accepted_at` datetime(6) DEFAULT NULL,
  `pending_key` varchar(200) GENERATED ALWAYS AS (if((`status` = _utf8mb4'pending'),concat(`organization_id`,_utf8mb4':',`email`),NULL)) VIRTUAL COMMENT 'NULL saat tidak pending, sehingga email boleh diundang lagi',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invitations_token` (`token`),
  UNIQUE KEY `uk_invitations_pending` (`pending_key`),
  KEY `ix_invitations_org_status` (`organization_id`,`status`),
  KEY `ix_invitations_email` (`email`),
  KEY `fk_invitations_invited_by` (`invited_by_id`),
  CONSTRAINT `fk_invitations_invited_by` FOREIGN KEY (`invited_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_invitations_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Undangan bergabung ke organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `organization_invitations` WRITE;
/*!40000 ALTER TABLE `organization_invitations` DISABLE KEYS */;
INSERT INTO `organization_invitations` (`id`, `organization_id`, `email`, `role`, `token`, `invited_by_id`, `status`, `expires_at`, `accepted_at`, `created_at`, `updated_at`) VALUES (1,1,'calon1@subaksari.id','petani','a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',1,'pending','2026-11-10 00:00:00.000000',NULL,'2026-10-27 01:46:34.603911','2026-10-27 01:46:34.603911'),(2,1,'calon2@subaksari.id','petani','b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',1,'pending','2026-11-10 00:00:00.000000',NULL,'2026-10-27 01:46:34.603911','2026-10-27 01:46:34.603911');
/*!40000 ALTER TABLE `organization_invitations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `organization_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` enum('administrator','manajer_lapangan','petani','penyuluh') NOT NULL,
  `status` enum('aktif','undangan','nonaktif') NOT NULL DEFAULT 'undangan',
  `joined_at` datetime(6) DEFAULT NULL COMMENT 'NULL selama masih undangan',
  `invited_by_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_members_org_user` (`organization_id`,`user_id`),
  KEY `ix_members_org_role_status` (`organization_id`,`role`,`status`),
  KEY `ix_members_user_status` (`user_id`,`status`),
  KEY `fk_members_invited_by` (`invited_by_id`),
  CONSTRAINT `fk_members_invited_by` FOREIGN KEY (`invited_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_members_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Keanggotaan user di organisasi beserta perannya';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `organization_members` WRITE;
/*!40000 ALTER TABLE `organization_members` DISABLE KEYS */;
INSERT INTO `organization_members` VALUES (1,1,1,'administrator','aktif','2018-03-01 00:00:00.000000',NULL,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(2,1,2,'petani','aktif','2018-04-12 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(3,1,3,'petani','aktif','2019-02-20 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(4,1,4,'manajer_lapangan','aktif','2019-06-03 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(5,1,5,'petani','aktif','2020-01-15 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(6,1,6,'petani','aktif','2021-08-09 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(7,1,7,'petani','aktif','2022-11-21 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014'),(8,1,8,'penyuluh','aktif','2023-02-06 00:00:00.000000',1,'2026-10-27 01:46:34.602014','2026-10-27 01:46:34.602014');
/*!40000 ALTER TABLE `organization_members` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `organization_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_settings` (
  `organization_id` bigint unsigned NOT NULL,
  `area_unit` enum('ha','m2','are') NOT NULL DEFAULT 'ha',
  `date_format` enum('d_m_y_long','d_m_y','y_m_d') NOT NULL DEFAULT 'd_m_y_long',
  `auto_sync` tinyint(1) NOT NULL DEFAULT '1',
  `weekly_report` tinyint(1) NOT NULL DEFAULT '0',
  `high_res_photos` tinyint(1) NOT NULL DEFAULT '0',
  `public_profile` tinyint(1) NOT NULL DEFAULT '0',
  `join_approval` tinyint(1) NOT NULL DEFAULT '1',
  `extension_read_access` tinyint(1) NOT NULL DEFAULT '0',
  `weather_daily` tinyint(1) NOT NULL DEFAULT '0',
  `activity_reminder` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`organization_id`),
  CONSTRAINT `fk_org_settings_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Preferensi tingkat organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `organization_settings` WRITE;
/*!40000 ALTER TABLE `organization_settings` DISABLE KEYS */;
INSERT INTO `organization_settings` VALUES (1,'ha','d_m_y_long',1,0,0,0,1,1,1,1,'2026-10-27 01:46:34.609693');
/*!40000 ALTER TABLE `organization_settings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `type` enum('koperasi','gapoktan','perusahaan_agribisnis','lainnya') NOT NULL DEFAULT 'koperasi',
  `registration_no` varchar(60) DEFAULT NULL COMMENT 'Nomor badan hukum, mis. KOP-2018-0472',
  `founded_year` smallint unsigned DEFAULT NULL,
  `region_id` bigint unsigned DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact_email` varchar(160) DEFAULT NULL,
  `contact_phone` varchar(32) DEFAULT NULL,
  `description` text,
  `logo_path` varchar(255) DEFAULT NULL COMMENT 'Path object storage, bukan blob',
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_organizations_slug` (`slug`),
  UNIQUE KEY `uk_organizations_registration_no` (`registration_no`),
  KEY `ix_organizations_status` (`status`,`deleted_at`),
  KEY `ix_organizations_region` (`region_id`),
  CONSTRAINT `fk_organizations_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_organizations_founded_year` CHECK (((`founded_year` is null) or (`founded_year` between 1900 and 2100)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Koperasi/gapoktan pemilik data (tenant)';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'Koperasi Subak Sari','koperasi-subak-sari','koperasi','KOP-2018-0472',2018,2,'Jl. Raya Kediri No. 12, Tabanan, Bali','halo@subaksari.id','+62361123456','Koperasi pertanian yang menaungi kelompok tani di Tabanan, Badung, dan Gianyar.',NULL,'aktif','2026-10-27 01:46:34.597744','2026-10-27 01:46:34.597744',NULL);
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `plot_boundaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plot_boundaries` (
  `plot_id` bigint unsigned NOT NULL,
  `boundary` polygon NOT NULL /*!80003 SRID 4326 */,
  `centroid` point NOT NULL /*!80003 SRID 4326 */ COMMENT 'Diisi aplikasi/proyeksi, bukan ST_Centroid()',
  `measured_area_ha` decimal(10,2) DEFAULT NULL COMMENT 'ST_Area(boundary)/10000; pembanding area_ha deklarasi',
  `mapped_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`plot_id`),
  SPATIAL KEY `sx_plot_boundaries_boundary` (`boundary`),
  SPATIAL KEY `sx_plot_boundaries_centroid` (`centroid`),
  CONSTRAINT `fk_plot_boundaries_plot` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_plot_boundaries_measured_area` CHECK (((`measured_area_ha` is null) or (`measured_area_ha` > 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Batas spasial petak (1:1)';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `plot_boundaries` WRITE;
/*!40000 ALTER TABLE `plot_boundaries` DISABLE KEYS */;
INSERT INTO `plot_boundaries` VALUES (1,0xE610000001030000000100000005000000890D7107C5C75C4079245E9ECE1521C0B0A6576FF9C75C4079245E9ECE1521C0B0A6576FF9C75C40CB660E492D1421C0890D7107C5C75C40CB660E492D1421C0890D7107C5C75C4079245E9ECE1521C0,0xE610000001010000001D5A643BDFC75C40A245B6F3FD1421C0,12.40,'2026-10-27 01:46:34.630051'),(5,0xE610000001030000000100000005000000A211C715F2CA5C40BA9AE1ABC24B21C01B63CC0212CB5C40BA9AE1ABC24B21C01B63CC0212CB5C409071207FC44A21C0A211C715F2CA5C409071207FC44A21C0A211C715F2CA5C40BA9AE1ABC24B21C0,0xE610000001010000005EBA490C02CB5C4025068195434B21C0,4.60,'2026-10-27 01:46:34.630051');
/*!40000 ALTER TABLE `plot_boundaries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `plot_health_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plot_health_snapshots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plot_id` bigint unsigned NOT NULL,
  `recorded_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `health_score` tinyint unsigned NOT NULL,
  `ndvi` decimal(5,4) DEFAULT NULL COMMENT 'Belum ada pipeline pengisi otomatis',
  `source` enum('manual','satelit','model') NOT NULL DEFAULT 'manual',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_health_plot_time` (`plot_id`,`recorded_at` DESC),
  CONSTRAINT `fk_health_plot` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_health_ndvi` CHECK (((`ndvi` is null) or (`ndvi` between -(1) and 1))),
  CONSTRAINT `ck_health_score` CHECK ((`health_score` between 0 and 100))
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Riwayat skor kesehatan petak';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `plot_health_snapshots` WRITE;
/*!40000 ALTER TABLE `plot_health_snapshots` DISABLE KEYS */;
INSERT INTO `plot_health_snapshots` VALUES (1,1,'2026-09-27 08:00:00.000000',90,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(2,1,'2026-10-26 08:00:00.000000',94,NULL,'manual','Setelah pemupukan susulan','2026-10-27 01:46:34.627385'),(3,2,'2026-09-27 08:00:00.000000',85,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(4,2,'2026-10-26 08:00:00.000000',89,NULL,'manual','Kondisi membaik','2026-10-27 01:46:34.627385'),(5,3,'2026-09-27 08:00:00.000000',74,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(6,3,'2026-10-26 08:00:00.000000',71,NULL,'manual','Gejala layu pada sebagian baris','2026-10-27 01:46:34.627385'),(7,4,'2026-09-27 08:00:00.000000',84,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(8,4,'2026-10-26 08:00:00.000000',86,NULL,'manual','Pemangkasan selesai','2026-10-27 01:46:34.627385'),(9,5,'2026-09-27 08:00:00.000000',88,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(10,5,'2026-10-26 08:00:00.000000',91,NULL,'model','Perhitungan model kesehatan','2026-10-27 01:46:34.627385'),(11,6,'2026-09-27 08:00:00.000000',80,NULL,'manual','Pengamatan rutin','2026-10-27 01:46:34.627385'),(12,6,'2026-10-26 08:00:00.000000',76,NULL,'manual','Perlu pemeriksaan saluran air','2026-10-27 01:46:34.627385'),(13,7,'2026-10-20 08:00:00.000000',88,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(14,8,'2026-10-20 08:00:00.000000',84,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(15,9,'2026-10-20 08:00:00.000000',73,NULL,'manual','Daun menguning pada sebagian petak','2026-10-27 01:46:34.627385'),(16,10,'2026-10-20 08:00:00.000000',90,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(17,11,'2026-10-20 08:00:00.000000',78,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(18,12,'2026-10-20 08:00:00.000000',92,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(19,13,'2026-10-20 08:00:00.000000',86,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(20,14,'2026-10-20 08:00:00.000000',81,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(21,15,'2026-10-20 08:00:00.000000',69,NULL,'manual','Bercak daun meluas','2026-10-27 01:46:34.627385'),(22,16,'2026-10-20 08:00:00.000000',87,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(23,17,'2026-10-20 08:00:00.000000',83,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(24,18,'2026-10-20 08:00:00.000000',94,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(25,19,'2026-10-20 08:00:00.000000',79,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(26,20,'2026-10-20 08:00:00.000000',85,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(27,21,'2026-10-20 08:00:00.000000',72,NULL,'manual','Wilayah pesisir, salinitas tinggi','2026-10-27 01:46:34.627385'),(28,22,'2026-10-20 08:00:00.000000',89,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(29,23,'2026-10-20 08:00:00.000000',82,NULL,'manual',NULL,'2026-10-27 01:46:34.627385'),(30,24,'2026-10-20 08:00:00.000000',91,NULL,'manual',NULL,'2026-10-27 01:46:34.627385');
/*!40000 ALTER TABLE `plot_health_snapshots` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `plot_managers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plot_managers` (
  `plot_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_on` date DEFAULT NULL,
  `primary_guard` bigint unsigned GENERATED ALWAYS AS (if(`is_primary`,`plot_id`,NULL)) VIRTUAL COMMENT 'NULL untuk pengelola non-utama; UNIQUE menjaga maksimal satu utama',
  PRIMARY KEY (`plot_id`,`user_id`),
  UNIQUE KEY `uk_plot_managers_primary` (`primary_guard`),
  KEY `ix_plot_managers_user` (`user_id`),
  CONSTRAINT `fk_plot_managers_plot` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_plot_managers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Petani pengelola petak (banyak-ke-banyak)';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `plot_managers` WRITE;
/*!40000 ALTER TABLE `plot_managers` DISABLE KEYS */;
INSERT INTO `plot_managers` (`plot_id`, `user_id`, `is_primary`, `assigned_on`) VALUES (1,2,1,'2018-05-01'),(1,6,0,'2023-02-01'),(2,3,1,'2019-03-11'),(3,4,1,'2019-07-22'),(4,5,1,'2020-02-14'),(5,6,1,'2021-01-09'),(6,7,1,'2018-11-30'),(7,2,1,'2019-04-18'),(8,3,1,'2019-09-02'),(9,5,1,'2020-06-27'),(10,6,1,'2020-10-05'),(11,7,1,'2021-03-19'),(12,2,1,'2021-07-08'),(13,3,1,'2021-11-23'),(14,5,1,'2022-02-17'),(15,6,1,'2022-05-30'),(16,7,1,'2022-08-12'),(17,2,1,'2022-12-01'),(18,3,1,'2023-01-25'),(19,5,1,'2023-03-14'),(20,6,1,'2023-05-22'),(21,7,1,'2023-08-09'),(22,2,1,'2023-10-17'),(23,3,1,'2024-01-30'),(24,5,1,'2024-04-06');
/*!40000 ALTER TABLE `plot_managers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `plots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `farm_group_id` bigint unsigned DEFAULT NULL,
  `region_id` bigint unsigned NOT NULL COMMENT 'Kecamatan; dasar pencocokan cuaca',
  `code` varchar(30) DEFAULT NULL COMMENT 'Kode internal petak, unik per organisasi',
  `name` varchar(120) NOT NULL,
  `area_ha` decimal(10,2) NOT NULL COMMENT 'Luas hektare, bukan teks "12,4 ha"',
  `elevation_m` smallint DEFAULT NULL,
  `soil_type` varchar(60) DEFAULT NULL,
  `irrigation_type` enum('irigasi_teknis','tadah_hujan','lebak','lainnya') DEFAULT NULL,
  `status` enum('sehat','perhatian','kritis','tidak_aktif') NOT NULL DEFAULT 'sehat',
  `address` varchar(255) DEFAULT NULL,
  `established_on` date DEFAULT NULL,
  `notes` text,
  `created_by_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plots_org_code` (`organization_id`,`code`),
  KEY `ix_plots_org_status` (`organization_id`,`status`,`deleted_at`),
  KEY `ix_plots_group` (`farm_group_id`),
  KEY `ix_plots_region` (`region_id`),
  KEY `fk_plots_created_by` (`created_by_id`),
  CONSTRAINT `fk_plots_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_plots_group` FOREIGN KEY (`farm_group_id`) REFERENCES `farm_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_plots_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_plots_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_plots_area` CHECK ((`area_ha` > 0)),
  CONSTRAINT `ck_plots_elevation` CHECK (((`elevation_m` is null) or (`elevation_m` between -(500) and 9000)))
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Petak lahan yang dikelola';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `plots` WRITE;
/*!40000 ALTER TABLE `plots` DISABLE KEYS */;
INSERT INTO `plots` VALUES (1,1,1,5,'SS-01','Subak Sari',12.40,180,'Latosol','irigasi_teknis','sehat','Tabanan, Bali','2018-05-01',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(2,1,3,5,'SS-02','Lahan Mekar',8.20,165,'Regosol','tadah_hujan','sehat','Tabanan, Bali','2019-03-11',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(3,1,2,7,'SS-03','Blok Timur',6.80,210,'Latosol','irigasi_teknis','perhatian','Gianyar, Bali','2019-07-22',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(4,1,4,7,'SS-04','Kebun Kedaton',5.10,320,'Andosol','tadah_hujan','sehat','Gianyar, Bali','2020-02-14',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(5,1,5,8,'SS-05','Tegal Harum',4.60,140,'Regosol','irigasi_teknis','sehat','Badung, Bali','2021-01-09',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(6,1,6,6,'SS-06','Sawah Tengah',9.30,195,'Latosol','irigasi_teknis','perhatian','Tabanan, Bali','2018-11-30',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(7,1,1,5,'SS-07','Blok Utara',4.20,186,'Latosol','irigasi_teknis','sehat','Tabanan, Bali','2019-04-18',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(8,1,2,5,'SS-08','Blok Selatan',4.50,172,'Regosol','tadah_hujan','sehat','Tabanan, Bali','2019-09-02',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(9,1,3,5,'SS-09','Sawah Hilir',4.10,158,'Latosol','irigasi_teknis','perhatian','Tabanan, Bali','2020-06-27',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(10,1,4,5,'SS-10','Sawah Hulu',4.40,202,'Latosol','irigasi_teknis','sehat','Tabanan, Bali','2020-10-05',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(11,1,5,5,'SS-11','Tegal Sari',4.30,176,'Regosol','tadah_hujan','sehat','Tabanan, Bali','2021-03-19',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(12,1,6,5,'SS-12','Tegal Asri',4.60,168,'Regosol','tadah_hujan','sehat','Tabanan, Bali','2021-07-08',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(13,1,1,6,'SS-13','Kebun Barat',4.00,230,'Andosol','tadah_hujan','sehat','Tabanan, Bali','2021-11-23',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(14,1,2,6,'SS-14','Kebun Timur',4.70,245,'Andosol','tadah_hujan','sehat','Tabanan, Bali','2022-02-17',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(15,1,3,6,'SS-15','Petak Melati',4.20,212,'Latosol','irigasi_teknis','perhatian','Tabanan, Bali','2022-05-30',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(16,1,4,6,'SS-16','Petak Kenanga',4.40,205,'Latosol','irigasi_teknis','sehat','Tabanan, Bali','2022-08-12',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(17,1,5,6,'SS-17','Subak Ujung',4.30,190,'Regosol','irigasi_teknis','sehat','Tabanan, Bali','2022-12-01',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(18,1,6,6,'SS-18','Subak Tengah',4.50,184,'Regosol','irigasi_teknis','sehat','Tabanan, Bali','2023-01-25',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(19,1,1,5,'SS-19','Lahan Harapan',4.10,170,'Latosol','tadah_hujan','sehat','Tabanan, Bali','2023-03-14',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(20,1,2,5,'SS-20','Lahan Sejahtera',4.60,162,'Regosol','irigasi_teknis','sehat','Tabanan, Bali','2023-05-22',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(21,1,3,5,'SS-21','Blok Pesisir',4.20,110,'Regosol','tadah_hujan','perhatian','Tabanan, Bali','2023-08-09',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(22,1,4,5,'SS-22','Blok Lereng',4.40,260,'Andosol','tadah_hujan','sehat','Tabanan, Bali','2023-10-17',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(23,1,5,5,'SS-23','Sawah Baru',4.30,175,'Latosol','irigasi_teknis','sehat','Tabanan, Bali','2024-01-30',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL),(24,1,6,5,'SS-24','Tegal Mulya',4.80,166,'Regosol','tadah_hujan','sehat','Tabanan, Bali','2024-04-06',NULL,4,'2026-10-27 01:46:34.618664','2026-10-27 01:46:34.618664',NULL);
/*!40000 ALTER TABLE `plots` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned DEFAULT NULL COMMENT 'NULL untuk provinsi',
  `level` enum('provinsi','kabupaten','kecamatan','desa') NOT NULL,
  `name` varchar(120) NOT NULL,
  `bps_code` char(10) DEFAULT NULL COMMENT 'Kode wilayah BPS, penghubung ke statistical_values',
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_regions_bps_code` (`bps_code`),
  KEY `ix_regions_parent_level` (`parent_id`,`level`),
  KEY `ix_regions_level_name` (`level`,`name`),
  CONSTRAINT `fk_regions_parent` FOREIGN KEY (`parent_id`) REFERENCES `regions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_regions_latitude` CHECK (((`latitude` is null) or (`latitude` between -(90) and 90))),
  CONSTRAINT `ck_regions_longitude` CHECK (((`longitude` is null) or (`longitude` between -(180) and 180)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hierarki wilayah administratif';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
INSERT INTO `regions` VALUES (1,NULL,'provinsi','Bali','51',-8.409518,115.188919,'2026-10-27 01:46:34.590551'),(2,1,'kabupaten','Tabanan','5102',-8.539400,115.125000,'2026-10-27 01:46:34.590551'),(3,1,'kabupaten','Badung','5103',-8.581000,115.177000,'2026-10-27 01:46:34.590551'),(4,1,'kabupaten','Gianyar','5104',-8.543000,115.325000,'2026-10-27 01:46:34.590551'),(5,2,'kecamatan','Kediri',NULL,-8.563000,115.156000,'2026-10-27 01:46:34.590551'),(6,2,'kecamatan','Marga',NULL,-8.447000,115.091000,'2026-10-27 01:46:34.590551'),(7,4,'kecamatan','Sukawati',NULL,-8.585000,115.283000,'2026-10-27 01:46:34.590551'),(8,3,'kecamatan','Mengwi',NULL,-8.540000,115.172000,'2026-10-27 01:46:34.590551');
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `symptoms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `symptoms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `label` varchar(120) NOT NULL,
  `category` enum('daun','batang','buah','akar','umum') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_symptoms_code` (`code`),
  KEY `ix_symptoms_category_active` (`category`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master gejala tanaman';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `symptoms` WRITE;
/*!40000 ALTER TABLE `symptoms` DISABLE KEYS */;
INSERT INTO `symptoms` VALUES (1,'bercak_daun','Bercak pada daun','daun',1,'2026-10-27 01:46:34.617118'),(2,'daun_menguning','Daun menguning','daun',1,'2026-10-27 01:46:34.617118'),(3,'tanaman_layu','Tanaman layu','umum',1,'2026-10-27 01:46:34.617118'),(4,'bagian_membusuk','Bagian tanaman membusuk','buah',1,'2026-10-27 01:46:34.617118');
/*!40000 ALTER TABLE `symptoms` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_devices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `platform` enum('android','ios','web') NOT NULL,
  `device_name` varchar(120) DEFAULT NULL,
  `push_token` varchar(255) NOT NULL,
  `app_version` varchar(20) DEFAULT NULL,
  `last_seen_at` datetime(6) DEFAULT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_devices_push_token` (`push_token`),
  KEY `ix_user_devices_user` (`user_id`,`revoked_at`),
  CONSTRAINT `fk_user_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Perangkat terdaftar untuk notifikasi push';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
INSERT INTO `user_devices` VALUES (1,2,'android','Redmi Note 12','fcm-seed-token-android-suarta-0001','1.0.0','2026-10-26 09:12:00.000000',NULL,'2026-10-27 01:46:34.612788'),(2,1,'web','Chrome desktop','fcm-seed-token-web-agus-0001','1.0.0','2026-10-27 01:30:00.000000',NULL,'2026-10-27 01:46:34.612788');
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `user_id` bigint unsigned NOT NULL,
  `theme` enum('terang','gelap','sistem') NOT NULL DEFAULT 'sistem',
  `language` char(5) NOT NULL DEFAULT 'id',
  `last_organization_id` bigint unsigned DEFAULT NULL COMMENT 'Mengisi pemilih organisasi di sidebar',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  KEY `ix_user_preferences_last_org` (`last_organization_id`),
  CONSTRAINT `fk_user_preferences_last_org` FOREIGN KEY (`last_organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Preferensi tampilan per pengguna';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES (1,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(2,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(3,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(4,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(5,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(6,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(7,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304'),(8,'sistem','id',1,'2026-10-27 01:46:34.611304','2026-10-27 01:46:34.611304');
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `phone` varchar(32) DEFAULT NULL COMMENT 'Unik bila terisi; NULL diizinkan untuk akun web-only',
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'Kredensial diisi lewat alur API, bukan seed',
  `pin_hash` varchar(255) DEFAULT NULL COMMENT 'PIN 6 digit untuk aplikasi mobile',
  `avatar_path` varchar(255) DEFAULT NULL,
  `email_verified_at` datetime(6) DEFAULT NULL,
  `last_active_at` datetime(6) DEFAULT NULL,
  `status` enum('aktif','nonaktif','ditangguhkan') NOT NULL DEFAULT 'aktif',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  KEY `ix_users_status_active` (`status`,`last_active_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Akun pengguna lintas organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Agus Dharma','agus@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(2,'I Wayan Suarta','suarta@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(3,'Ni Made Rini','rini@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(4,'I Ketut Arta','arta@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(5,'Ni Luh Sari','sari@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(6,'I Made Putra','made@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(7,'Ni Kadek Ayu','kadek@subaksari.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL),(8,'Dewi Anggraini','dewi@bpp-tabanan.go.id',NULL,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-27 01:46:34.599897','2026-10-27 01:46:34.599897',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

