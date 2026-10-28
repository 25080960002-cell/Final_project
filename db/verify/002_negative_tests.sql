-- =====================================================================
-- MAPAN · Uji negatif Fase 1 + 2
-- Membuktikan bahwa constraint benar-benar MENOLAK data yang salah,
-- dan menolaknya karena alasan yang benar (kode error diperiksa).
--
--   1062 = ER_DUP_ENTRY             (UNIQUE / PRIMARY KEY dilanggar)
--   3819 = ER_CHECK_CONSTRAINT_VIOLATED (CHECK dilanggar)
--
-- Setiap prosedur menjalankan INSERT yang seharusnya gagal di dalam
-- transaksi, lalu ROLLBACK. Tidak ada data yang tertinggal.
--
-- Jalankan: mysql -u root -p mapan < verify/002_negative_tests.sql
-- Setiap baris harus berisi 'PASS'.
-- =====================================================================

USE mapan;

DROP PROCEDURE IF EXISTS assert_br01_duplicate_membership;
DROP PROCEDURE IF EXISTS assert_br02_second_primary;
DROP PROCEDURE IF EXISTS assert_br05_duplicate_boundary;
DROP PROCEDURE IF EXISTS assert_br11_health_range;
DROP PROCEDURE IF EXISTS assert_br21_duplicate_invitation;

DELIMITER $$

-- BR-01: satu user hanya punya satu peran per organisasi
CREATE PROCEDURE assert_br01_duplicate_membership()
BEGIN
  DECLARE v_errno INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_errno = MYSQL_ERRNO;
  END;

  START TRANSACTION;
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (1, 1, 'petani', 'aktif');

  IF v_errno = 1062 THEN
    SELECT 'PASS' AS hasil, 'BR-01 keanggotaan ganda ditolak (1062)' AS uji;
  ELSEIF v_errno = 0 THEN
    SELECT 'FAIL' AS hasil, 'BR-01 keanggotaan ganda DITERIMA' AS uji;
  ELSE
    SELECT 'FAIL' AS hasil, CONCAT('BR-01 gagal karena error lain: ', v_errno) AS uji;
  END IF;
  ROLLBACK;
END$$

-- BR-02: satu petak hanya punya satu pengelola utama
CREATE PROCEDURE assert_br02_second_primary()
BEGIN
  DECLARE v_errno INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_errno = MYSQL_ERRNO;
  END;

  START TRANSACTION;
  INSERT INTO plot_managers (plot_id, user_id, is_primary)
  VALUES (2, 7, TRUE);

  IF v_errno = 1062 THEN
    SELECT 'PASS' AS hasil, 'BR-02 pengelola utama kedua ditolak (1062)' AS uji;
  ELSEIF v_errno = 0 THEN
    SELECT 'FAIL' AS hasil, 'BR-02 pengelola utama kedua DITERIMA' AS uji;
  ELSE
    SELECT 'FAIL' AS hasil, CONCAT('BR-02 gagal karena error lain: ', v_errno) AS uji;
  END IF;
  ROLLBACK;
END$$

-- BR-05: satu petak hanya punya satu baris batas
CREATE PROCEDURE assert_br05_duplicate_boundary()
BEGIN
  DECLARE v_errno INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_errno = MYSQL_ERRNO;
  END;

  START TRANSACTION;
  INSERT INTO plot_boundaries (plot_id, boundary, centroid) VALUES
    (1,
     ST_GeomFromText('POLYGON((-8.5425920 115.1214007, -8.5425920 115.1245993, -8.5394080 115.1245993, -8.5394080 115.1214007, -8.5425920 115.1214007))', 4326),
     ST_GeomFromText('POINT(-8.5410000 115.1230000)', 4326));

  IF v_errno = 1062 THEN
    SELECT 'PASS' AS hasil, 'BR-05 batas petak ganda ditolak (1062)' AS uji;
  ELSEIF v_errno = 0 THEN
    SELECT 'FAIL' AS hasil, 'BR-05 batas petak ganda DITERIMA' AS uji;
  ELSE
    SELECT 'FAIL' AS hasil, CONCAT('BR-05 gagal karena error lain: ', v_errno) AS uji;
  END IF;
  ROLLBACK;
END$$

-- BR-11: skor kesehatan 0-100
CREATE PROCEDURE assert_br11_health_range()
BEGIN
  DECLARE v_errno INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_errno = MYSQL_ERRNO;
  END;

  START TRANSACTION;
  INSERT INTO plot_health_snapshots (plot_id, health_score) VALUES (1, 101);

  IF v_errno = 3819 THEN
    SELECT 'PASS' AS hasil, 'BR-11 skor kesehatan 101 ditolak (3819)' AS uji;
  ELSEIF v_errno = 0 THEN
    SELECT 'FAIL' AS hasil, 'BR-11 skor kesehatan 101 DITERIMA' AS uji;
  ELSE
    SELECT 'FAIL' AS hasil, CONCAT('BR-11 gagal karena error lain: ', v_errno) AS uji;
  END IF;
  ROLLBACK;
END$$

-- BR-21: undangan pending unik per email per organisasi
CREATE PROCEDURE assert_br21_duplicate_invitation()
BEGIN
  DECLARE v_errno INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_errno = MYSQL_ERRNO;
  END;

  START TRANSACTION;
  INSERT INTO organization_invitations
    (organization_id, email, role, token, invited_by_id, status, expires_at)
  VALUES
    (1, 'calon1@subaksari.id', 'petani',
     'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
     1, 'pending', '2026-12-01 00:00:00');

  IF v_errno = 1062 THEN
    SELECT 'PASS' AS hasil, 'BR-21 undangan pending duplikat ditolak (1062)' AS uji;
  ELSEIF v_errno = 0 THEN
    SELECT 'FAIL' AS hasil, 'BR-21 undangan pending duplikat DITERIMA' AS uji;
  ELSE
    SELECT 'FAIL' AS hasil, CONCAT('BR-21 gagal karena error lain: ', v_errno) AS uji;
  END IF;
  ROLLBACK;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Jalankan seluruh uji
-- ---------------------------------------------------------------------
CALL assert_br01_duplicate_membership();
CALL assert_br02_second_primary();
CALL assert_br05_duplicate_boundary();
CALL assert_br11_health_range();
CALL assert_br21_duplicate_invitation();

DROP PROCEDURE IF EXISTS assert_br01_duplicate_membership;
DROP PROCEDURE IF EXISTS assert_br02_second_primary;
DROP PROCEDURE IF EXISTS assert_br05_duplicate_boundary;
DROP PROCEDURE IF EXISTS assert_br11_health_range;
DROP PROCEDURE IF EXISTS assert_br21_duplicate_invitation;

-- Semua baris harus berisi 'PASS'.
-- BR-03 (satu siklus aktif per petak) belum bisa diuji karena tabel
-- cultivation_cycles baru dibuat di Fase 3.
