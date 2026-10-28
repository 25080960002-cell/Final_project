-- Referensi komoditas dan gejala yang aman untuk database produksi kosong.
USE mapan;

INSERT INTO commodities (code, name, category, base_yield_per_ha, default_unit, default_cycle_days) VALUES
  ('padi', 'Padi', 'pangan', 52.88, 'kg', 110),
  ('jagung', 'Jagung', 'pangan', 57.00, 'kg', 100),
  ('cabai', 'Cabai Merah', 'hortikultura', 90.00, 'kg', 90),
  ('tomat', 'Tomat', 'hortikultura', 150.00, 'kg', 75),
  ('kopi', 'Kopi Robusta', 'perkebunan', 8.00, 'kg', 240);

INSERT INTO crop_varieties (commodity_id, name, maturity_days)
SELECT c.id, v.name, v.maturity_days
  FROM commodities c
  JOIN (
    SELECT 'padi' AS code, 'Inpari 32' AS name, 110 AS maturity_days UNION ALL
    SELECT 'padi', 'Ciherang', 116 UNION ALL
    SELECT 'jagung', 'Hibrida', 100 UNION ALL
    SELECT 'cabai', 'Merah Keriting', 90 UNION ALL
    SELECT 'tomat', 'Tomat Apel', 75 UNION ALL
    SELECT 'kopi', 'Robusta', 240
  ) v ON v.code = c.code;

INSERT INTO symptoms (code, label, category) VALUES
  ('bercak_daun', 'Bercak pada daun', 'daun'),
  ('daun_menguning', 'Daun menguning', 'daun'),
  ('tanaman_layu', 'Tanaman layu', 'umum'),
  ('bagian_membusuk', 'Bagian tanaman membusuk', 'buah');
