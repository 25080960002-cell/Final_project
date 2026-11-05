-- Dump MAPAN (database=mapan, host=127.0.0.1:3306)
-- Dibuat: 2026-11-04T10:31:22.079Z · struktur + data
-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mapan
-- ------------------------------------------------------
-- Server version	8.4.3

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

--
-- Table structure for table `commodities`
--

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

--
-- Dumping data for table `commodities`
--

LOCK TABLES `commodities` WRITE;
/*!40000 ALTER TABLE `commodities` DISABLE KEYS */;
INSERT INTO `commodities` VALUES (1,'padi','Padi','pangan',52.88,'kg',110,1,'2026-10-29 06:09:32.313868','2026-10-29 06:09:32.313868'),(2,'jagung','Jagung','pangan',57.00,'kg',100,1,'2026-10-29 06:09:32.313868','2026-10-29 06:09:32.313868'),(3,'cabai','Cabai Merah','hortikultura',90.00,'kg',90,1,'2026-10-29 06:09:32.313868','2026-10-29 06:09:32.313868'),(4,'tomat','Tomat','hortikultura',150.00,'kg',75,1,'2026-10-29 06:09:32.313868','2026-10-29 06:09:32.313868'),(5,'kopi','Kopi Robusta','perkebunan',8.00,'kg',240,1,'2026-10-29 06:09:32.313868','2026-10-29 06:09:32.313868');
/*!40000 ALTER TABLE `commodities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crop_varieties`
--

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

--
-- Dumping data for table `crop_varieties`
--

LOCK TABLES `crop_varieties` WRITE;
/*!40000 ALTER TABLE `crop_varieties` DISABLE KEYS */;
INSERT INTO `crop_varieties` VALUES (1,3,'Merah Keriting',90,NULL,1,'2026-10-29 06:09:32.318514'),(2,2,'Hibrida',100,NULL,1,'2026-10-29 06:09:32.318514'),(3,5,'Robusta',240,NULL,1,'2026-10-29 06:09:32.318514'),(4,1,'Inpari 32',110,NULL,1,'2026-10-29 06:09:32.318514'),(5,1,'Ciherang',116,NULL,1,'2026-10-29 06:09:32.318514'),(6,4,'Tomat Apel',75,NULL,1,'2026-10-29 06:09:32.318514');
/*!40000 ALTER TABLE `crop_varieties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farm_group_members`
--

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

--
-- Dumping data for table `farm_group_members`
--

LOCK TABLES `farm_group_members` WRITE;
/*!40000 ALTER TABLE `farm_group_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `farm_group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farm_groups`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Kelompok tani di dalam organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farm_groups`
--

LOCK TABLES `farm_groups` WRITE;
/*!40000 ALTER TABLE `farm_groups` DISABLE KEYS */;
INSERT INTO `farm_groups` VALUES (1,2,'Kelompok Tani Sumber Rejeki',2,3,2019,NULL,'2026-10-29 13:09:44.805760','2026-10-29 13:09:44.805760',NULL);
/*!40000 ALTER TABLE `farm_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `google_identities`
--

DROP TABLE IF EXISTS `google_identities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_identities` (
  `google_sub` varchar(255) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `email` varchar(160) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`google_sub`),
  UNIQUE KEY `uk_google_identity_user` (`user_id`),
  KEY `ix_google_identity_email` (`email`),
  CONSTRAINT `fk_google_identity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Akun Google terverifikasi yang ditautkan ke pengguna MAPAN';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `google_identities`
--

LOCK TABLES `google_identities` WRITE;
/*!40000 ALTER TABLE `google_identities` DISABLE KEYS */;
/*!40000 ALTER TABLE `google_identities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_objects`
--

DROP TABLE IF EXISTS `media_objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_objects` (
  `id` char(36) NOT NULL,
  `organization_id` bigint unsigned NOT NULL,
  `uploaded_by_id` bigint unsigned NOT NULL,
  `mime_type` enum('image/jpeg','image/png','image/webp') NOT NULL,
  `file_size` int unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_media_org_created` (`organization_id`,`created_at`),
  KEY `fk_media_user` (`uploaded_by_id`),
  CONSTRAINT `fk_media_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_media_user` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Metadata berkas gambar tenant; isi berkas disimpan di volume media';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_objects`
--

LOCK TABLES `media_objects` WRITE;
/*!40000 ALTER TABLE `media_objects` DISABLE KEYS */;
INSERT INTO `media_objects` VALUES ('7d0d7c5e-28b9-442d-b422-2f012538c408',2,2,'image/png',55338,'2026-10-29 13:14:25.467874'),('fbf5ffba-9cca-4f79-b3b6-115f339bfc4e',2,2,'image/png',55338,'2026-10-29 13:15:34.884944');
/*!40000 ALTER TABLE `media_objects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_invitations`
--

DROP TABLE IF EXISTS `organization_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `email` varchar(160) NOT NULL,
  `invitee_name` varchar(120) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Undangan bergabung ke organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_invitations`
--

LOCK TABLES `organization_invitations` WRITE;
/*!40000 ALTER TABLE `organization_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `organization_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_members`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Keanggotaan user di organisasi beserta perannya';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_members`
--

LOCK TABLES `organization_members` WRITE;
/*!40000 ALTER TABLE `organization_members` DISABLE KEYS */;
INSERT INTO `organization_members` VALUES (1,1,1,'administrator','aktif','2026-10-29 06:09:40.220097',NULL,'2026-10-29 13:09:40.220097','2026-10-29 13:09:40.220097'),(2,2,2,'administrator','aktif','2026-10-29 06:09:44.800159',NULL,'2026-10-29 13:09:44.800159','2026-10-29 13:09:44.800159'),(3,2,3,'manajer_lapangan','aktif','2026-10-29 06:09:44.802022',NULL,'2026-10-29 13:09:44.802022','2026-10-29 13:09:44.802022'),(4,2,4,'petani','aktif','2026-10-29 06:09:44.803252',NULL,'2026-10-29 13:09:44.803252','2026-10-29 13:09:44.803252'),(5,2,5,'penyuluh','aktif','2026-10-29 06:09:44.804004',NULL,'2026-10-29 13:09:44.804004','2026-10-29 13:09:44.804004');
/*!40000 ALTER TABLE `organization_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_records`
--

DROP TABLE IF EXISTS `organization_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint unsigned NOT NULL,
  `author_user_id` bigint unsigned DEFAULT NULL,
  `plot_id` bigint unsigned DEFAULT NULL,
  `record_type` enum('cycle','task','activity','report','scan','community_post') NOT NULL,
  `title` varchar(160) NOT NULL,
  `phase` varchar(30) DEFAULT NULL,
  `progress` tinyint unsigned DEFAULT NULL,
  `due_at` datetime(6) DEFAULT NULL,
  `payload` json NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'aktif',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_records_org_type_created` (`organization_id`,`record_type`,`created_at`),
  KEY `ix_records_org_type_status` (`organization_id`,`record_type`,`status`,`deleted_at`),
  KEY `fk_records_plot` (`plot_id`),
  KEY `ix_records_org_type_deleted_created` (`organization_id`,`record_type`,`deleted_at`,`created_at`),
  KEY `ix_records_org_type_status_created` (`organization_id`,`record_type`,`status`,`created_at`),
  KEY `ix_records_org_type_phase` (`organization_id`,`record_type`,`deleted_at`,`phase`),
  KEY `ix_records_org_type_due` (`organization_id`,`record_type`,`deleted_at`,`due_at`),
  KEY `ix_records_author_type` (`author_user_id`,`record_type`),
  CONSTRAINT `fk_records_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_records_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_records_plot` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Catatan operasional dashboard per organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_records`
--

LOCK TABLES `organization_records` WRITE;
/*!40000 ALTER TABLE `organization_records` DISABLE KEYS */;
INSERT INTO `organization_records` VALUES (1,2,3,1,'cycle','Padi','Vegetatif',38,NULL,'{\"area\": \"2.4 ha\", \"crop\": \"Padi\", \"plot\": \"Sawah Utara\", \"phase\": \"Vegetatif\", \"status\": \"Sehat\", \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 1, \"progress\": 38}','aktif','2026-10-29 13:09:44.809778','2026-10-29 13:09:44.809778',NULL),(2,2,3,2,'cycle','Padi','Pematangan',100,NULL,'{\"id\": 2, \"area\": \"3.1 ha\", \"crop\": \"Padi\", \"plot\": \"Sawah Tengah\", \"image\": \"/src/features/landing/assets/images/paddy-planting.jpg\", \"phase\": \"Pematangan\", \"status\": \"Selesai\", \"harvest\": \"29 Okt 2026\", \"plot_id\": 2, \"progress\": 100, \"record_status\": \"aktif\"}','selesai','2026-10-29 13:09:44.811924','2026-10-29 13:38:28.441311',NULL),(3,2,3,3,'cycle','Jagung','Vegetatif',45,NULL,'{\"area\": \"1.8 ha\", \"crop\": \"Jagung\", \"plot\": \"Ladang Jagung Timur\", \"phase\": \"Vegetatif\", \"status\": \"Sehat\", \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 3, \"progress\": 45}','aktif','2026-10-29 13:09:44.813467','2026-10-29 13:09:44.813467',NULL),(4,2,3,4,'cycle','Cabai Merah','Pematangan',82,NULL,'{\"area\": \"0.9 ha\", \"crop\": \"Cabai Merah\", \"plot\": \"Kebun Cabai Selatan\", \"phase\": \"Pematangan\", \"status\": \"Perhatian\", \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 4, \"progress\": 82}','aktif','2026-10-29 13:09:44.814880','2026-10-29 13:09:44.814880',NULL),(5,2,3,5,'cycle','Tomat','Persiapan',8,NULL,'{\"area\": \"0.6 ha\", \"crop\": \"Tomat\", \"plot\": \"Petak Tomat Barat\", \"phase\": \"Persiapan\", \"status\": \"Sehat\", \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 5, \"progress\": 8}','aktif','2026-10-29 13:09:44.816334','2026-10-29 13:09:44.816334',NULL),(6,2,3,6,'cycle','Kopi Robusta','Vegetatif',52,NULL,'{\"area\": \"4.2 ha\", \"crop\": \"Kopi Robusta\", \"plot\": \"Kebun Kopi Lereng\", \"phase\": \"Vegetatif\", \"status\": \"Sehat\", \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 6, \"progress\": 52}','aktif','2026-10-29 13:09:44.817861','2026-10-29 13:09:44.817861',NULL),(7,2,2,NULL,'task','Pemupukan susulan Sawah Tengah',NULL,NULL,'2026-10-31 06:09:44.818399','{\"meta\": \"Urea 50 kg/ha · minggu ini\"}','aktif','2026-10-29 13:09:44.818399','2026-10-29 13:26:42.516984',NULL),(8,2,2,NULL,'task','Cek hama wereng Sawah Utara',NULL,NULL,'2026-10-30 06:09:44.818680','{\"meta\": \"Pengamatan rutin mingguan\"}','aktif','2026-10-29 13:09:44.818680','2026-10-29 13:26:41.474480',NULL),(9,2,2,NULL,'task','Panen cabai tahap 1',NULL,NULL,'2026-11-02 06:09:44.818946','{\"meta\": \"Siapkan tenaga panen\"}','aktif','2026-10-29 13:09:44.818946','2026-10-29 13:26:40.263252',NULL),(10,2,2,NULL,'task','Pasang mulsa petak tomat',NULL,NULL,'2026-10-28 06:09:44.819802','{\"meta\": \"Selesai kemarin\"}','aktif','2026-10-29 13:09:44.819802','2026-10-29 13:26:39.128894',NULL),(11,2,4,1,'activity','Pemupukan NPK',NULL,NULL,NULL,'{\"plot\": \"Sawah Utara\", \"plot_id\": 1, \"description\": \"Pemupukan NPK\"}','aktif','2026-10-29 13:09:44.820352','2026-10-29 13:09:44.820352',NULL),(12,2,3,2,'activity','Penyemprotan fungisida',NULL,NULL,NULL,'{\"plot\": \"Sawah Tengah\", \"plot_id\": 2, \"description\": \"Penyemprotan fungisida\"}','aktif','2026-10-29 13:09:44.820718','2026-10-29 13:09:44.820718',NULL),(13,2,4,3,'activity','Penyiangan gulma',NULL,NULL,NULL,'{\"plot\": \"Ladang Jagung Timur\", \"plot_id\": 3, \"description\": \"Penyiangan gulma\"}','aktif','2026-10-29 13:09:44.821070','2026-10-29 13:09:44.821070',NULL),(14,2,4,4,'activity','Pengairan berselang',NULL,NULL,NULL,'{\"plot\": \"Kebun Cabai Selatan\", \"plot_id\": 4, \"description\": \"Pengairan berselang\"}','aktif','2026-10-29 13:09:44.821375','2026-10-29 13:09:44.821375',NULL),(15,2,2,NULL,'scan','Cabai Merah · Bercak pada daun',NULL,NULL,NULL,'{\"crop\": \"Cabai Merah\", \"mediaId\": \"7d0d7c5e-28b9-442d-b422-2f012538c408\", \"plot_id\": null, \"photoUrl\": \"http://localhost:4000/api/organizations/2/media/7d0d7c5e-28b9-442d-b422-2f012538c408\", \"symptoms\": [\"Bercak pada daun\"], \"photoName\": \"burger-frenchfries.png\", \"observedAt\": \"2026-10-29T06:14:25.473Z\"}','aktif','2026-10-29 13:14:25.478938','2026-10-29 13:14:25.478938',NULL),(16,2,2,NULL,'community_post','Memeriksa kelembapan Tanah',NULL,NULL,NULL,'{\"id\": 16, \"body\": \"jangan lupa saksikan pengelolaan projek mapan\", \"time\": \"Baru saja\", \"group\": \"Gapoktan Tani Makmur (DEMO)\", \"liked\": true, \"likes\": 1, \"title\": \"Memeriksa kelembapan Tanah\", \"author\": \"Siti Rahayu\", \"mediaId\": \"fbf5ffba-9cca-4f79-b3b6-115f339bfc4e\", \"category\": \"Tanya budidaya\", \"comments\": [], \"initials\": \"SR\", \"location\": \"Kabupaten Semarang\", \"photoUrl\": \"http://localhost:4000/api/organizations/2/media/fbf5ffba-9cca-4f79-b3b6-115f339bfc4e\", \"photoName\": \"burger-frenchfries.png\"}','aktif','2026-10-29 13:15:34.896952','2026-10-29 13:15:56.716096',NULL),(17,2,2,NULL,'cycle','Cabai Merah','Persiapan',4,NULL,'{\"area\": \"0.6 ha\", \"crop\": \"Cabai Merah\", \"plot\": \"Petak Tomat Barat\", \"image\": \"/src/features/landing/assets/images/paddy-planting.jpg\", \"phase\": \"Persiapan\", \"status\": \"Sehat\", \"area_ha\": 0.6, \"harvest\": \"Belum dijadwalkan\", \"plot_id\": 5, \"progress\": 4}','aktif','2026-10-29 13:18:04.708896','2026-10-29 13:18:04.708896',NULL);
/*!40000 ALTER TABLE `organization_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_settings`
--

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

--
-- Dumping data for table `organization_settings`
--

LOCK TABLES `organization_settings` WRITE;
/*!40000 ALTER TABLE `organization_settings` DISABLE KEYS */;
INSERT INTO `organization_settings` VALUES (1,'ha','d_m_y_long',1,0,0,0,1,0,0,0,'2026-10-29 13:09:40.221218'),(2,'ha','d_m_y_long',1,0,0,0,1,1,1,0,'2026-10-29 13:09:44.763148');
/*!40000 ALTER TABLE `organization_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Koperasi/gapoktan pemilik data (tenant)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'Gapoktan Tani Makmur MAPAN','gapoktan-tani-makmur-mapan','koperasi',NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'aktif','2026-10-29 13:09:40.182894','2026-10-29 13:09:40.182894',NULL),(2,'Gapoktan Tani Makmur (DEMO)','demo-gapoktan-tani-makmur','gapoktan',NULL,NULL,2,NULL,'halo@demo.mapan.id',NULL,'Organisasi contoh untuk demo MAPAN. Seluruh data di sini fiktif.',NULL,'aktif','2026-10-29 13:09:44.761969','2026-10-29 13:09:44.761969',NULL);
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plot_boundaries`
--

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

--
-- Dumping data for table `plot_boundaries`
--

LOCK TABLES `plot_boundaries` WRITE;
/*!40000 ALTER TABLE `plot_boundaries` DISABLE KEYS */;
INSERT INTO `plot_boundaries` VALUES (1,_binary '\�\0\0\0\0\0\0\0\0\0\0\0�l\����[@z\�):���\�o_Ι[@z\�):���\�o_Ι[@���Q���l\����[@���Q���l\����[@z\�):���',_binary '\�\0\0\0\0\0/n���[@C�i\�q��',2.40,'2026-10-29 13:09:44.808058'),(2,_binary '\�\0\0\0\0\0\0\0\0\0\0\0hDio\�[@Ș������G\�z�[@Ș������G\�z�[@Zd;\�O��hDio\�[@Zd;\�O��hDio\�[@Ș�����',_binary '\�\0\0\0\0\0F%u�[@�~�:p��',3.10,'2026-10-29 13:09:44.811024'),(3,_binary '\�\0\0\0\0\0\0\0\0\0\0\0n4��@�[@��\����7�\�d�[@��\����7�\�d�[@KY�8օ�n4��@�[@KY�8օ�n4��@�[@��\���',_binary '\�\0\0\0\0\06<�R�[@�sF�\���',1.80,'2026-10-29 13:09:44.812978'),(4,_binary '\�\0\0\0\0\0\0\0\0\0\0\0/n���[@���N@��uq\r\��[@���N@��uq\r\��[@St$����/n���[@St$����/n���[@���N@��',_binary '\�\0\0\0\0\0\�o_Ι[@��\�\���',0.90,'2026-10-29 13:09:44.814187'),(5,_binary '\�\0\0\0\0\0\0\0\0\0\0\0\�8EGr�[@ \�o_��6<�R��[@ \�o_��6<�R��[@��\�Ƌ�\�8EGr�[@��\�Ƌ�\�8EGr�[@ \�o_��',_binary '\�\0\0\0\0\0�:M��[@鷯\��',0.60,'2026-10-29 13:09:44.815664'),(6,_binary '\�\0\0\0\0\0\0\0\0\0\0\0J+��[@��ʡ���z6��[@��ʡ���z6��[@�N@a��J+��[@�N@a��J+��[@��ʡ��',_binary '\�\0\0\0\0\0\�\r�0��[@\�h\0o���',4.20,'2026-10-29 13:09:44.817294');
/*!40000 ALTER TABLE `plot_boundaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plot_health_snapshots`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Riwayat skor kesehatan petak';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plot_health_snapshots`
--

LOCK TABLES `plot_health_snapshots` WRITE;
/*!40000 ALTER TABLE `plot_health_snapshots` DISABLE KEYS */;
INSERT INTO `plot_health_snapshots` VALUES (1,1,'2026-10-29 13:09:44.809110',92,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.809110'),(2,2,'2026-10-29 13:09:44.811494',74,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.811494'),(3,3,'2026-10-29 13:09:44.813257',88,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.813257'),(4,4,'2026-10-29 13:09:44.814611',69,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.814611'),(5,5,'2026-10-29 13:09:44.815931',90,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.815931'),(6,6,'2026-10-29 13:09:44.817615',85,NULL,'manual','Pengamatan awal demo','2026-10-29 13:09:44.817615');
/*!40000 ALTER TABLE `plot_health_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plot_managers`
--

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

--
-- Dumping data for table `plot_managers`
--

LOCK TABLES `plot_managers` WRITE;
/*!40000 ALTER TABLE `plot_managers` DISABLE KEYS */;
INSERT INTO `plot_managers` (`plot_id`, `user_id`, `is_primary`, `assigned_on`) VALUES (1,4,1,'2026-10-29'),(2,4,1,'2026-10-29'),(3,3,1,'2026-10-29'),(4,3,1,'2026-10-29'),(5,4,1,'2026-10-29'),(6,3,1,'2026-10-29');
/*!40000 ALTER TABLE `plot_managers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plots`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Petak lahan yang dikelola';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plots`
--

LOCK TABLES `plots` WRITE;
/*!40000 ALTER TABLE `plots` DISABLE KEYS */;
INSERT INTO `plots` VALUES (1,2,1,2,'DEMO-001','Sawah Utara',2.40,NULL,'Aluvial','irigasi_teknis','sehat','jl wr spartmann',NULL,NULL,4,'2026-10-29 13:09:44.806494','2026-10-29 13:20:26.615580','2026-10-29 06:20:26.615580'),(2,2,1,2,'DEMO-002','Sawah Tengah',3.10,NULL,'Aluvial','irigasi_teknis','perhatian',NULL,NULL,NULL,4,'2026-10-29 13:09:44.810210','2026-10-29 13:20:34.023501','2026-10-29 06:20:34.023501'),(3,2,1,2,'DEMO-003','Ladang Jagung Timur',1.80,NULL,'Aluvial','tadah_hujan','sehat',NULL,NULL,NULL,3,'2026-10-29 13:09:44.812436','2026-10-29 13:26:57.412458','2026-10-29 06:26:57.412458'),(4,2,1,2,'DEMO-004','Kebun Cabai Selatan',0.90,NULL,'Aluvial','tadah_hujan','perhatian',NULL,NULL,NULL,3,'2026-10-29 13:09:44.813749','2026-10-29 13:27:02.899572','2026-10-29 06:27:02.899572'),(5,2,1,2,'DEMO-005','Petak Tomat Barat',0.60,NULL,'Aluvial','tadah_hujan','sehat',NULL,NULL,NULL,4,'2026-10-29 13:09:44.815194','2026-10-29 13:09:44.815194',NULL),(6,2,1,2,'DEMO-006','Kebun Kopi Lereng',4.20,NULL,'Aluvial','tadah_hujan','sehat',NULL,NULL,NULL,3,'2026-10-29 13:09:44.816647','2026-10-29 13:20:19.212032','2026-10-29 06:20:19.212032');
/*!40000 ALTER TABLE `plots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hierarki wilayah administratif';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
INSERT INTO `regions` VALUES (1,NULL,'kabupaten','Kabupaten Semarang',NULL,NULL,NULL,'2026-10-29 13:09:40.181805'),(2,NULL,'kabupaten','Kabupaten Semarang',NULL,-7.134900,110.404700,'2026-10-29 13:09:44.760256');
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('migration/001_fase1_tenant_master.sql','2026-10-29 06:09:31.455626'),('migration/002_fase2_lahan.sql','2026-10-29 06:09:31.686945'),('migration/003_fase3_dashboard_records.sql','2026-10-29 06:09:31.753405'),('migration/004_auth_sessions.sql','2026-10-29 06:09:31.800161'),('migration/005_media_objects.sql','2026-10-29 06:09:31.846356'),('migration/006_google_identities.sql','2026-10-29 06:09:31.892111'),('migration/007_dashboard_records_refine.sql','2026-10-29 06:09:32.303895'),('migration/008_backfill_cycle_columns.sql','2026-10-29 06:09:32.309368'),('seed/000_reference_catalog.sql','2026-10-29 06:09:32.328510');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `symptoms`
--

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

--
-- Dumping data for table `symptoms`
--

LOCK TABLES `symptoms` WRITE;
/*!40000 ALTER TABLE `symptoms` DISABLE KEYS */;
INSERT INTO `symptoms` VALUES (1,'bercak_daun','Bercak pada daun','daun',1,'2026-10-29 06:09:32.324017'),(2,'daun_menguning','Daun menguning','daun',1,'2026-10-29 06:09:32.324017'),(3,'tanaman_layu','Tanaman layu','umum',1,'2026-10-29 06:09:32.324017'),(4,'bagian_membusuk','Bagian tanaman membusuk','buah',1,'2026-10-29 06:09:32.324017');
/*!40000 ALTER TABLE `symptoms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Perangkat terdaftar untuk notifikasi push';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

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

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES (1,'sistem','id',1,'2026-10-29 13:09:40.222101','2026-10-29 13:09:40.222101'),(2,'sistem','id',2,'2026-10-29 13:09:44.800958','2026-10-29 13:09:44.800958'),(3,'sistem','id',2,'2026-10-29 13:09:44.802684','2026-10-29 13:09:44.802684'),(4,'sistem','id',2,'2026-10-29 13:09:44.803506','2026-10-29 13:09:44.803506'),(5,'sistem','id',2,'2026-10-29 13:09:44.804226','2026-10-29 13:09:44.804226');
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `token_hash` char(64) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `organization_id` bigint unsigned NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `last_seen_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `revoked_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`token_hash`),
  KEY `ix_sessions_user_expires` (`user_id`,`expires_at`),
  KEY `ix_sessions_org_user` (`organization_id`,`user_id`),
  CONSTRAINT `fk_sessions_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Token sesi disimpan dalam bentuk hash dan terikat satu organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES ('4c573f9547d0da45c8ee3d70f616d8ad90a119ff7a9bb09502f910ad5bac26ca',2,2,'2026-10-29 14:55:37.754000','2026-10-29 13:55:37.755242','2026-10-29 13:55:37.755242',NULL),('50732cb0064eaa79b41955ed2d8325adcd3b0cd39a05feb006a80d5bd7a55835',2,2,'2026-10-30 08:42:50.241000','2026-10-30 07:42:50.241773','2026-10-30 07:42:50.241773',NULL),('7f07107432a9aaf4bd924abd3d846cf9da6e6f80df2b7b6aa38e92b24d811ad2',2,2,'2026-10-29 14:13:16.314000','2026-10-29 13:13:16.315105','2026-10-29 13:13:16.315105',NULL),('9929d20645daebad8a6c09090ccd49e3feadef85f2d37ba45dd3410572c4c9aa',2,2,'2026-10-29 14:10:04.023000','2026-10-29 13:10:04.026518','2026-10-29 13:10:04.026518',NULL),('aebbc0e29916dbe4c831ee00f5d7feed4244d124aeca6cdb17c1b85b6f0ccb9e',2,2,'2026-10-30 08:44:04.797000','2026-10-30 07:44:04.798215','2026-10-30 07:44:04.798215',NULL),('cbc1521acfb85f8c12e7af204ed10429a27eaecfc3063f2a9e7160cc56a84952',2,2,'2026-10-30 08:42:33.955000','2026-10-30 07:42:33.956217','2026-10-30 07:42:33.956217',NULL),('e9cc879d9c6433fd71ba4a2bb532d1cd9ba8e2e57b9abf075162aaab0c736dff',2,2,'2026-10-30 08:34:55.254000','2026-10-30 07:34:55.258286','2026-10-30 07:34:55.258286',NULL);
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Akun pengguna lintas organisasi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator MAPAN','admin@organisasi.id',NULL,'scrypt$c5abdf5e7d8317fdf82de8c39cdd1134$13093a4e391d7352f8e777c63aa229269359cfcad43a9ce71db613837113ac3b738b81ae5c96ecba97ecb6b994585d71f3de271f9929f32bd7d7909ed8935431',NULL,NULL,'2026-10-29 06:09:40.218550',NULL,'aktif','2026-10-29 13:09:40.218550','2026-10-29 13:09:40.218550',NULL),(2,'Siti Rahayu','admin@demo.mapan.id',NULL,'scrypt$1b856ddaf32d0d88a8abc511b83ab62d$735dd6146119c3d4d9845aa63f1c67732a656cbcee7b85151c43c5448769f906d84d8b3099a3d9c339b42117e07f44cd472c3000cb7bf27f3b66b0c81267e6bd',NULL,NULL,'2026-10-29 06:09:44.799203',NULL,'aktif','2026-10-29 13:09:44.799203','2026-10-29 13:55:48.191846',NULL),(3,'Budi Santoso','manajer@demo.mapan.id',NULL,'scrypt$1b856ddaf32d0d88a8abc511b83ab62d$735dd6146119c3d4d9845aa63f1c67732a656cbcee7b85151c43c5448769f906d84d8b3099a3d9c339b42117e07f44cd472c3000cb7bf27f3b66b0c81267e6bd',NULL,NULL,'2026-10-29 06:09:44.801537',NULL,'aktif','2026-10-29 13:09:44.801537','2026-10-29 13:09:44.801537',NULL),(4,'Wahyu Hidayat','petani@demo.mapan.id',NULL,'scrypt$1b856ddaf32d0d88a8abc511b83ab62d$735dd6146119c3d4d9845aa63f1c67732a656cbcee7b85151c43c5448769f906d84d8b3099a3d9c339b42117e07f44cd472c3000cb7bf27f3b66b0c81267e6bd',NULL,NULL,'2026-10-29 06:09:44.802987',NULL,'aktif','2026-10-29 13:09:44.802987','2026-10-29 13:09:44.802987',NULL),(5,'Dewi Lestari','penyuluh@demo.mapan.id',NULL,'scrypt$1b856ddaf32d0d88a8abc511b83ab62d$735dd6146119c3d4d9845aa63f1c67732a656cbcee7b85151c43c5448769f906d84d8b3099a3d9c339b42117e07f44cd472c3000cb7bf27f3b66b0c81267e6bd',NULL,NULL,'2026-10-29 06:09:44.803785',NULL,'aktif','2026-10-29 13:09:44.803785','2026-10-29 13:09:44.803785',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'mapan'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-04 17:31:22
