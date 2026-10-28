-- MAPAN · Fase 4 · Perbaikan data operasional dashboard
-- Menyempurnakan tabel organization_records agar tidak berbantulkan pada payload JSON
-- untuk pencarian dashboard: kolom terstruktur, pengisian awal dari payload, dan index.
-- Additif: payload JSON tetap sumber kebenaran lengkap dan tidak dihapus.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

-- 1. Kolom terstruktur untuk penyaringan dashboard -------------------------------
-- author_user_id : anggota yang membuat catatan (jejak, tugas milik siapa)
-- plot_id        : petak yang dirujuk siklus/laporan/aktivitas
-- phase          : fase budidaya untuk kartu kolom siklus (Persiapan..Pematangan)
-- progress       : 0-100 untuk siklus/order aktivitas
-- due_at         : jatuh tempo tugas/panen yang dijadwalkan
ALTER TABLE organization_records
  ADD COLUMN author_user_id BIGINT UNSIGNED NULL AFTER organization_id,
  ADD COLUMN plot_id        BIGINT UNSIGNED NULL AFTER author_user_id,
  ADD COLUMN phase          VARCHAR(30) NULL AFTER title,
  ADD COLUMN progress       TINYINT UNSIGNED NULL AFTER phase,
  ADD COLUMN due_at         DATETIME(6) NULL AFTER progress;

ALTER TABLE organization_records
  ADD CONSTRAINT fk_records_author FOREIGN KEY (author_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_records_plot FOREIGN KEY (plot_id)
    REFERENCES plots (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Pengisian awal (backfill) dari payload JSON ---------------------------------
-- Hanya menautkan plot_id ketika benar-benar cocok dengan petak organisasi,
-- sehingga data contoh ('p1', 'p2', ...) tidak membuat tautan palsu.
UPDATE organization_records r
LEFT JOIN plots p ON p.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(r.payload, '$.plot_id')) AS UNSIGNED) AND p.organization_id = r.organization_id
   SET r.plot_id = p.id
 WHERE JSON_EXTRACT(r.payload, '$.plot_id') IS NOT NULL
   AND p.id IS NOT NULL;

UPDATE organization_records
   SET phase = LEFT(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.phase')), 30)
 WHERE JSON_EXTRACT(payload, '$.phase') IS NOT NULL
   AND JSON_TYPE(JSON_EXTRACT(payload, '$.phase')) = 'STRING';

UPDATE organization_records
   SET progress = LEAST(CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.progress')) AS UNSIGNED), 100)
 WHERE JSON_EXTRACT(payload, '$.progress') IS NOT NULL
   AND CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.progress')) AS DECIMAL(6, 2)) BETWEEN 0 AND 100;

UPDATE organization_records
   SET due_at = STR_TO_DATE(
     REPLACE(REPLACE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.due_at')), 'T', ' '), 'Z', ''),
     '%Y-%m-%d %H:%i:%s.%f')
 WHERE JSON_EXTRACT(payload, '$.due_at') IS NOT NULL
   AND JSON_TYPE(JSON_EXTRACT(payload, '$.due_at')) = 'STRING'
   AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.due_at')) REGEXP
     '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?Z?$';

-- 3. Index untuk pola akses dashboard --------------------------------------------
-- Daftar catatan per jenis (halaman siklus/tugas/aktivitas).
ALTER TABLE organization_records
  ADD INDEX ix_records_org_type_deleted_created
    (organization_id, record_type, deleted_at, created_at);

-- Ringkasan per status (kartu statistik & tab selesai/aktif).
ALTER TABLE organization_records
  ADD INDEX ix_records_org_type_status_created
    (organization_id, record_type, status, created_at);

-- Filter fase siklus pada papan kolom siklus budidaya.
ALTER TABLE organization_records
  ADD INDEX ix_records_org_type_phase
    (organization_id, record_type, deleted_at, phase);

-- Tugas jatuh tempo / panen terjadwal.
ALTER TABLE organization_records
  ADD INDEX ix_records_org_type_due
    (organization_id, record_type, deleted_at, due_at);

-- Jejak penulis per jenis catatan.
ALTER TABLE organization_records
  ADD INDEX ix_records_author_type
    (author_user_id, record_type);
