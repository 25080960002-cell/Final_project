-- =====================================================================
-- MAPAN · 00 · Inisialisasi database
-- Target  : MySQL 8.0.16+ (CHECK constraint baru ditegakkan sejak 8.0.16)
-- Jalankan: mysql -u root -p < 00_init.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS mapan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE mapan;
