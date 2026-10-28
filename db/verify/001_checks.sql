-- =====================================================================
-- MAPAN · Verifikasi positif Fase 1 + 2
-- Jalankan setelah migrasi dan seed:
--   mysql -u root -p mapan < verify/001_checks.sql
--
-- Setiap query menyertakan nilai yang diharapkan di komentar.
-- =====================================================================

USE mapan;

-- 1. Jumlah tabel harus 17
SELECT COUNT(*) AS jumlah_tabel
FROM information_schema.tables
WHERE table_schema = 'mapan' AND table_type = 'BASE TABLE';
-- harapan: 17

SELECT table_name AS tabel
FROM information_schema.tables
WHERE table_schema = 'mapan' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Total luas dan jumlah petak harus sama dengan kartu Ringkasan
SELECT COUNT(*) AS jumlah_petak,
       COALESCE(SUM(area_ha), 0) AS total_ha
FROM plots
WHERE organization_id = 1
  AND deleted_at IS NULL
  AND status <> 'tidak_aktif';
-- harapan: 24 petak, 125.00 ha

-- 3. Setiap petak punya tepat satu pengelola utama (BR-02)
SELECT COUNT(*) AS petak_tanpa_pengelola_utama
FROM plots p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM plot_managers pm
    WHERE pm.plot_id = p.id AND pm.is_primary = TRUE
  );
-- harapan: 0

SELECT COUNT(*) AS petak_dengan_lebih_dari_satu_utama
FROM (
  SELECT plot_id
  FROM plot_managers
  WHERE is_primary = TRUE
  GROUP BY plot_id
  HAVING COUNT(*) > 1
) x;
-- harapan: 0

-- 4. Pengelola petak harus anggota aktif organisasi yang sama (BR-22)
SELECT COUNT(*) AS pelanggaran_br22
FROM plot_managers pm
JOIN plots p ON p.id = pm.plot_id
LEFT JOIN organization_members m
       ON m.user_id = pm.user_id
      AND m.organization_id = p.organization_id
WHERE m.id IS NULL OR m.status <> 'aktif';
-- harapan: 0

-- 5. Kode petak unik per organisasi
SELECT COUNT(*) AS kode_ganda
FROM (
  SELECT organization_id, code
  FROM plots
  WHERE code IS NOT NULL
  GROUP BY organization_id, code
  HAVING COUNT(*) > 1
) x;
-- harapan: 0

-- 6. Luas geodetik harus mendekati luas deklarasi (< 1% selisih)
SELECT p.id,
       p.name,
       p.area_ha,
       b.measured_area_ha,
       ROUND(ABS(b.measured_area_ha - p.area_ha) / p.area_ha * 100, 2) AS selisih_pct
FROM plots p
JOIN plot_boundaries b ON b.plot_id = p.id
ORDER BY p.id;
-- harapan: selisih_pct < 1.00 untuk kedua petak

-- 7. Urutan sumbu spasial: titik pusat petak 1 berada di Tabanan, bukan di laut
-- ST_Latitude()/ST_Longitude() dipakai agar tidak bergantung pada urutan X/Y.
SELECT ST_Latitude(centroid) AS lintang, ST_Longitude(centroid) AS bujur
FROM plot_boundaries WHERE plot_id = 1;
-- harapan: lintang sekitar -8.541 (negatif), bujur sekitar 115.123

-- 8. Angka kesehatan terbaru per petak (dasar kartu "94%")
WITH latest AS (
  SELECT hs.plot_id, hs.health_score,
         ROW_NUMBER() OVER (PARTITION BY hs.plot_id
                            ORDER BY hs.recorded_at DESC, hs.id DESC) AS rn
  FROM plot_health_snapshots hs
  JOIN plots p ON p.id = hs.plot_id
  WHERE p.organization_id = 1 AND p.deleted_at IS NULL
)
SELECT p.id, p.name, p.status, l.health_score
FROM plots p
LEFT JOIN latest l ON l.plot_id = p.id AND l.rn = 1
WHERE p.organization_id = 1 AND p.deleted_at IS NULL
ORDER BY p.id;
-- harapan: petak 1=94, 2=89, 3=71, 4=86, 5=91, 6=76

-- 9. Total kelompok tani tanpa fan-out (BR: agregasi dua anak)
SELECT g.id, g.name,
       COALESCE(m.anggota, 0) AS anggota,
       COALESCE(p.luas_ha, 0) AS luas_ha
FROM farm_groups g
LEFT JOIN (
  SELECT farm_group_id, COUNT(*) AS anggota
  FROM farm_group_members
  GROUP BY farm_group_id
) m ON m.farm_group_id = g.id
LEFT JOIN (
  SELECT farm_group_id, SUM(area_ha) AS luas_ha
  FROM plots
  WHERE deleted_at IS NULL AND status <> 'tidak_aktif'
  GROUP BY farm_group_id
) p ON p.farm_group_id = g.id
WHERE g.organization_id = 1 AND g.deleted_at IS NULL
ORDER BY g.id;
-- harapan: total luas_ha seluruh kelompok = 125.00

-- 10. Undangan menunggu
SELECT COUNT(*) AS undangan_menunggu
FROM organization_invitations
WHERE organization_id = 1 AND status = 'pending';
-- harapan: 2

-- 11. Keanggotaan tidak ganda (BR-01)
SELECT COUNT(*) AS baris_keanggotaan,
       COUNT(DISTINCT organization_id, user_id) AS pasangan_unik
FROM organization_members;
-- harapan: kedua angka sama

-- 12. Penting: seed belum mengisi cultivation_cycles
SELECT COUNT(*) AS tabel_siklus_ada
FROM information_schema.tables
WHERE table_schema = 'mapan' AND table_name = 'cultivation_cycles';
-- harapan: 0 (baru dibuat di Fase 3)
