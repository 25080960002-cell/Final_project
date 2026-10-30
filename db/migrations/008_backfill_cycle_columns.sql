-- 008: Isi kolom terstruktur siklus yang dibuat lewat penambahan lahan.
-- Sebelum perbaikan, siklus otomatis hanya menyimpan payload JSON sehingga
-- plot_id/phase/progress/author kosong dan tidak muncul di ringkasan fase.
-- Idempotent: hanya menyentuh baris yang masih kosong.

UPDATE organization_records
   SET plot_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.plot_id')) AS UNSIGNED)
 WHERE record_type = 'cycle' AND plot_id IS NULL
   AND JSON_EXTRACT(payload, '$.plot_id') IS NOT NULL
   AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.plot_id')) REGEXP '^[0-9]+$'
   AND EXISTS (SELECT 1 FROM plots p
                WHERE p.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(organization_records.payload, '$.plot_id')) AS UNSIGNED)
                  AND p.organization_id = organization_records.organization_id);

UPDATE organization_records
   SET phase = LEFT(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.phase')), 30)
 WHERE record_type = 'cycle' AND phase IS NULL
   AND JSON_EXTRACT(payload, '$.phase') IS NOT NULL;

UPDATE organization_records
   SET progress = CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.progress')) AS UNSIGNED)
 WHERE record_type = 'cycle' AND progress IS NULL
   AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.progress')) REGEXP '^[0-9]{1,3}$'
   AND CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.progress')) AS UNSIGNED) <= 100;
