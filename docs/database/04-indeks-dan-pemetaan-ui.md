# 04 · Indeks & Pemetaan UI ke Data

Dokumen ini menjawab dua pertanyaan: **apakah skema cukup cepat** untuk kebutuhan dashboard, dan **dari mana setiap angka di layar berasal**.

---

## 1. Prinsip Penyusunan Indeks

1. **Awali dengan `organization_id`.** Hampir semua query dashboard dibatasi satu organisasi. Indeks komposit yang berawalan `organization_id` melayani filter sekaligus menjaga isolasi tenant.
2. **Ikuti urutan pemakaian.** Kolom untuk filter kesetaraan lebih dulu, lalu kolom untuk pengurutan/rentang. Contoh: `(organization_id, status, due_at)`.
3. **Satu indeks untuk banyak query.** `(plot_id, performed_at DESC)` melayani riwayat aktivitas per petak dan agregasi bulanan sekaligus.
4. **Jangan mengindeks semuanya.** Setiap indeks memperlambat `INSERT`/`UPDATE`. Tabel yang sering ditulis ( `sync_events`, `weather_observations` ) hanya diberi indeks yang benar-benar dipakai.
5. **Indeks tidak menggantikan desain query.** Kalau sebuah KPI butuh 6 join, masalahnya ada di query, bukan di indeks.

---

## 2. Daftar Indeks

### 2.1 Indeks kunci (selain PK dan FK otomatis)

| Tabel | Indeks | Melayani |
| :--- | :--- | :--- |
| `organization_members` | `(organization_id, role, status)` | Hitung petani/admin per organisasi; komposisi peran |
| `organization_members` | `(user_id, status)` | Daftar organisasi milik seorang user (pemilih organisasi) |
| `organization_invitations` | `(organization_id, status)` | Hitung undangan menunggu |
| `regions` | `(parent_id, level)` | Menelusuri hierarki wilayah |
| `plots` | `(organization_id, status, deleted_at)` | Daftar lahan + filter status |
| `plots` | `(farm_group_id)`, `(region_id)` | Agregasi kelompok tani, pencocokan cuaca |
| `plot_managers` | `(user_id)` | "Lahan yang saya kelola" |
| `plot_health_snapshots` | `(plot_id, recorded_at DESC)` | Skor terbaru & tren kesehatan |
| `cultivation_cycles` | `(organization_id, status, phase)` | Papan kanban per fase |
| `cultivation_cycles` | `(expected_harvest_on)` | "Panen 30 hari ke depan" |
| `activities` | `(organization_id, performed_at DESC)` | Feed aktivitas terbaru |
| `activities` | `(plot_id, performed_at DESC)`, `(cycle_id, type)` | Riwayat per petak, rekap per jenis |
| `harvests` | `(organization_id, harvested_on DESC)` | Laporan hasil panen |
| `yield_predictions` | `(cycle_id, predicted_at DESC)` | Prediksi terbaru per siklus |
| `weather_observations` | `(region_id, observed_at DESC)` | Deret cuaca per wilayah |
| `community_posts` | `(organization_id, created_at DESC)` | Feed komunitas |
| `community_posts` | `FULLTEXT (title, body)` | Pencarian diskusi |
| `notifications` | `(user_id, read_at, created_at DESC)` | Notifikasi belum dibaca |
| `statistical_values` | `(indicator_id, period_year)` | Seri waktu BPS |
| `sync_events` | `(status, created_at)` | Memproses antrean yang gagal |

### 2.2 Indeks yang sengaja **tidak** dibuat

| Indeks | Alasan tidak dibuat |
| :--- | :--- |
| `plots(name)` | Pencarian nama lahan memakai `LIKE '%...%'` yang tidak bisa memakai indeks B-tree. Dataset per organisasi kecil (puluhan petak), jadi full scan terbatas masih wajar. Bila perlu, tambahkan `FULLTEXT(name)`. |
| `activities(notes)` | Teks bebas, tidak pernah difilter. |
| `audit_logs(changes)` | Kolom JSON yang hanya dibaca untuk investigasi, bukan filter. |
| `community_posts(body)` sendiri | Sudah tercakup `FULLTEXT (title, body)`. |
| Indeks pada `is_primary` | Kardinalitas rendah (hampir semua `FALSE`). `primary_guard` yang unik sudah cukup. |

---

## 3. Kenapa `organization_id` Ada di Tabel Anak

Perhatikan query feed aktivitas:

```sql
-- Dengan organization_id di activities: satu indeks, tanpa join
SELECT id, type, performed_at, plot_id
FROM activities
WHERE organization_id = :org_id
ORDER BY performed_at DESC
LIMIT 20;

-- Tanpa organization_id: wajib join ke plots lebih dulu
SELECT a.id, a.type, a.performed_at, a.plot_id
FROM activities a
JOIN plots p ON p.id = a.plot_id
WHERE p.organization_id = :org_id AND p.deleted_at IS NULL
ORDER BY a.performed_at DESC
LIMIT 20;
```

Versi pertama memakai indeks `(organization_id, performed_at DESC)` dan berhenti setelah 20 baris. Versi kedua harus menggabungkan seluruh aktivitas organisasi lalu mengurutkan. Untuk 288 ribu baris aktivitas per tahun, perbedaannya signifikan. Ini alasan teknis di balik denormalisasi di dokumen 03 §7.1.

---

## 4. Pencarian Teks

`LIKE '%pupuk%'` tidak bisa memakai indeks karena wildcard di depan. Untuk pencarian komunitas dipakai `FULLTEXT`:

```sql
SELECT id, title, category, like_count
FROM community_posts
WHERE organization_id = :org_id
  AND status = 'terbit'
  AND MATCH(title, body) AGAINST (:q IN NATURAL LANGUAGE MODE)
ORDER BY MATCH(title, body) AGAINST (:q) DESC
LIMIT 20;
```

Catatan: `FULLTEXT` MySQL memakai daftar *stopword* bawaan yang berbahasa Inggris. Kata umum Indonesia seperti "dan", "yang", "untuk" tidak otomatis menjadi stopword. Untuk v1 ini dapat diterima; bila hasil pencarian terasa bising, tambahkan stopword list kustom saat DDL ditulis.

---

## 5. Query Spasial untuk Halaman Peta

```sql
SELECT p.id, p.name, p.area_ha, p.status,
       ST_AsGeoJSON(b.boundary) AS boundary_geojson
FROM plots p
JOIN plot_boundaries b ON b.plot_id = p.id
WHERE p.organization_id = :org_id
  AND p.deleted_at IS NULL
  AND MBRContains(ST_GeomFromText(:viewport_wkt, 4326), b.centroid);
```

| Keputusan | Alasan |
| :--- | :--- |
| Saring dengan `MBRContains` pada `centroid` | Hanya menyentuh satu titik per petak, bukan seluruh poligon. Cukup untuk menentukan petak mana yang tampil di viewport. |
| Ambil `boundary` hanya setelah lolos filter | `ST_AsGeoJSON` pada poligon besar mahal; jangan dijalankan untuk semua petak. |
| `ST_Contains` untuk presisi | Dipakai saat butuh "petak mana yang memuat titik ini", bukan untuk render peta. |

---

## 6. Pemetaan Angka UI → Query

Setiap angka pada dashboard demo sekarang adalah konstanta. Berikut penggantinya. `:org_id` diisi dari sesi, **tidak pernah** dari parameter URL.

### 6.1 Kartu Ringkasan

**Total lahan & jumlah petak**

```sql
SELECT COUNT(*) AS jumlah_petak,
       COALESCE(SUM(area_ha), 0) AS total_ha
FROM plots
WHERE organization_id = :org_id
  AND deleted_at IS NULL
  AND status <> 'tidak_aktif';
```

**Total petani aktif**

```sql
SELECT COUNT(*) AS total_petani
FROM organization_members
WHERE organization_id = :org_id
  AND status = 'aktif'
  AND role IN ('petani', 'manajer_lapangan');
```

**Siklus aktif**

```sql
SELECT COUNT(*) AS siklus_aktif
FROM cultivation_cycles
WHERE organization_id = :org_id AND status = 'aktif';
```

**Panen dalam 30 hari**

```sql
SELECT COUNT(*) AS panen_30_hari
FROM cultivation_cycles
WHERE organization_id = :org_id
  AND status = 'aktif'
  AND expected_harvest_on BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY;
```

**Prediksi panen & tingkat keyakinan**

```sql
WITH ranked AS (
  SELECT cycle_id, predicted_yield_kg, confidence_pct,
         ROW_NUMBER() OVER (PARTITION BY cycle_id ORDER BY predicted_at DESC, id DESC) AS rn
  FROM yield_predictions
  WHERE organization_id = :org_id
)
SELECT ROUND(SUM(r.predicted_yield_kg) / 1000, 2) AS total_ton,
       ROUND(AVG(r.confidence_pct), 1)             AS keyakinan_pct
FROM ranked r
JOIN cultivation_cycles c ON c.id = r.cycle_id
WHERE r.rn = 1 AND c.status = 'aktif';
```

> Temuan: UI sekarang menampilkan "Prediksi panen **1,2 Ton**" untuk 125 ha. Dengan angka wajar (5,6 ton/ha) hasilnya sekitar **700 ton**. Ini bug satuan pada data demo, bukan pada skema. Query di atas mengembalikan kg lalu membaginya ke ton, sehingga tidak mungkin salah satuan lagi.

**Risiko cuaca**

```sql
SELECT COALESCE(MAX(ra.severity), 'rendah') AS tingkat_risiko
FROM risk_alerts ra
WHERE (ra.organization_id = :org_id OR ra.organization_id IS NULL)
  AND ra.region_id IN (SELECT DISTINCT region_id FROM plots WHERE organization_id = :org_id)
  AND NOW() BETWEEN ra.valid_from AND COALESCE(ra.valid_to, '9999-12-31 23:59:59');
```

`MAX()` pada `ENUM('rendah','sedang','tinggi')` mengikuti urutan deklarasi, sehingga menghasilkan `tinggi` bila ada satu peringatan berat.

### 6.2 Lahan & Kesehatan

**Skor kesehatan terbaru per petak**

```sql
WITH latest AS (
  SELECT hs.plot_id, hs.health_score,
         ROW_NUMBER() OVER (PARTITION BY hs.plot_id ORDER BY hs.recorded_at DESC, hs.id DESC) AS rn
  FROM plot_health_snapshots hs
  JOIN plots p ON p.id = hs.plot_id
  WHERE p.organization_id = :org_id AND p.deleted_at IS NULL
)
SELECT p.id, p.name, p.area_ha, p.status, l.health_score
FROM plots p
LEFT JOIN latest l ON l.plot_id = p.id AND l.rn = 1
WHERE p.organization_id = :org_id AND p.deleted_at IS NULL
ORDER BY p.name;
```

**Persentase luas yang sehat** (dihitung terpisah, bukan digabung dengan query daftar)

```sql
WITH latest AS (
  SELECT hs.plot_id, hs.health_score,
         ROW_NUMBER() OVER (PARTITION BY hs.plot_id ORDER BY hs.recorded_at DESC, hs.id DESC) AS rn
  FROM plot_health_snapshots hs
  JOIN plots p ON p.id = hs.plot_id
  WHERE p.organization_id = :org_id AND p.deleted_at IS NULL
)
SELECT ROUND(
         100.0 * SUM(CASE WHEN l.health_score > 80 THEN p.area_ha ELSE 0 END)
         / NULLIF(SUM(p.area_ha), 0), 1
       ) AS pct_luas_sehat
FROM plots p
LEFT JOIN latest l ON l.plot_id = p.id AND l.rn = 1
WHERE p.organization_id = :org_id AND p.deleted_at IS NULL;
```

> Catatan: MySQL **tidak** mendukung klausa `FILTER (WHERE ...)` milik SQL standar (itu fitur PostgreSQL/SQLite). Gunakan `SUM(CASE WHEN ... THEN ... END)`. Dua query di atas sengaja dipisah: menggabungkan daftar per petak dengan agregat seluruh organisasi dalam satu `GROUP BY` akan membuat `pct_luas_sehat` selalu 0% atau 100%.

**Komoditas teratas (pengganti panel "Komposisi komoditas")**

```sql
SELECT c.name AS komoditas,
       ROUND(SUM(cy.planted_area_ha), 2) AS luas_ha,
       ROUND(100 * SUM(cy.planted_area_ha)
             / SUM(SUM(cy.planted_area_ha)) OVER (), 1) AS porsi_pct
FROM cultivation_cycles cy
JOIN commodities c ON c.id = cy.commodity_id
WHERE cy.organization_id = :org_id AND cy.status = 'aktif'
GROUP BY c.id, c.name
ORDER BY luas_ha DESC;
```

### 6.3 Kelompok Tani

Query naif yang menggabungkan dua tabel anak sekaligus akan **menggelembungkan** hasil: 52 anggota × 6 petak = 312 baris, sehingga `SUM(area_ha)` menjadi 6 kali lipat. Solusinya agregasi terpisah:

```sql
SELECT g.id, g.name, g.region_id,
       COALESCE(m.anggota, 0)  AS anggota,
       COALESCE(p.luas_ha, 0)  AS luas_ha
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
WHERE g.organization_id = :org_id AND g.deleted_at IS NULL
ORDER BY g.name;
```

Ini contoh *fan-out trap* yang paling sering lolos ke produksi dan menghasilkan angka salah tanpa error apa pun.

### 6.4 Komposisi Peran & Undangan

```sql
SELECT role, COUNT(*) AS jumlah
FROM organization_members
WHERE organization_id = :org_id AND status = 'aktif'
GROUP BY role;

SELECT COUNT(*) AS undangan_menunggu
FROM organization_invitations
WHERE organization_id = :org_id AND status = 'pending' AND expires_at > NOW();
```

### 6.5 Notifikasi & Feed Komunitas

```sql
SELECT COUNT(*) AS belum_dibaca
FROM notifications
WHERE user_id = :user_id AND read_at IS NULL;
```

```sql
SELECT cp.id, cp.title, cp.category, cp.created_at,
       cp.like_count, cp.comment_count,
       (pl.user_id IS NOT NULL) AS disukai_saya
FROM community_posts cp
LEFT JOIN post_likes pl
       ON pl.post_id = cp.id AND pl.user_id = :user_id
WHERE (cp.organization_id = :org_id OR cp.organization_id IS NULL)
  AND cp.status = 'terbit'
  AND cp.deleted_at IS NULL
ORDER BY cp.created_at DESC, cp.id DESC
LIMIT 20;
```

Untuk halaman berikutnya, gunakan *keyset pagination*, bukan `OFFSET`:

```sql
... AND (cp.created_at, cp.id) < (:last_created_at, :last_id)
ORDER BY cp.created_at DESC, cp.id DESC
LIMIT 20;
```

`OFFSET 5000` memaksa MySQL membaca dan membuang 5.000 baris. Keyset langsung melompat lewat indeks.

### 6.6 Data BPS untuk Halaman Tentang

**Seri waktu produksi padi nasional**

```sql
SELECT sv.period_year, sv.value, si.unit
FROM statistical_values sv
JOIN statistical_indicators si ON si.id = sv.indicator_id
WHERE si.code = 'rice_production'
  AND sv.region_id IS NULL
ORDER BY sv.period_year;
```

**Lima provinsi terbesar + total & porsi**

```sql
WITH provinsi AS (
  SELECT r.name, sv.value
  FROM statistical_values sv
  JOIN statistical_indicators si ON si.id = sv.indicator_id
  JOIN regions r ON r.id = sv.region_id
  WHERE si.code = 'rice_production' AND sv.period_year = 2024
  ORDER BY sv.value DESC
  LIMIT 5
),
nasional AS (
  SELECT sv.value
  FROM statistical_values sv
  JOIN statistical_indicators si ON si.id = sv.indicator_id
  WHERE si.code = 'rice_production'
    AND sv.period_year = 2024
    AND sv.region_id IS NULL
)
SELECT p.name, p.value,
       ROUND(100 * p.value / n.value, 2) AS porsi_nasional_pct
FROM provinsi p
CROSS JOIN nasional n
ORDER BY p.value DESC;
```

Query ini sekaligus menutup masalah yang ditemukan saat audit data: total dan persentase **dihitung**, bukan diketik manual, sehingga tidak bisa lagi berbeda dari jumlah batangnya.

---

## 7. View yang Disarankan

View tidak menyimpan data, tetapi menyederhanakan query dan mencegah logika yang sama ditulis ulang di banyak tempat.

| View | Isi |
| :--- | :--- |
| `v_plot_current` | Petak + pengelola utama + komoditas siklus aktif + skor kesehatan terbaru |
| `v_active_cycles` | Siklus aktif + nama petak, komoditas, varietas, luas |
| `v_organization_kpi` | Angka kartu Ringkasan per organisasi (luas, petak, petani, siklus) |
| `v_commodity_share` | Porsi luas per komoditas per organisasi |
| `v_latest_prediction` | Prediksi terbaru per siklus (hasil `ROW_NUMBER()`) |

Contoh `v_latest_prediction`:

```sql
CREATE OR REPLACE VIEW v_latest_prediction AS
SELECT id, organization_id, cycle_id, predicted_for, predicted_yield_kg,
       productivity_kg_ha, confidence_pct, predicted_at
FROM (
  SELECT yp.*,
         ROW_NUMBER() OVER (PARTITION BY cycle_id ORDER BY predicted_at DESC, id DESC) AS rn
  FROM yield_predictions yp
) ranked
WHERE rn = 1;
```

View ini hanya ilustrasi bentuk; DDL sebenarnya ditulis pada tahap implementasi.

---

## 8. Estimasi Volume & Strategi Pertumbuhan

Asumsi: 500 organisasi, rata-rata 25 petak, 3 siklus per petak per tahun.

| Tabel | Baris/tahun (estimasi) | Catatan |
| :--- | --: | :--- |
| `plots` | 12.500 (total) | Jarang bertambah setelah awal |
| `cultivation_cycles` | 37.500 | 3 per petak per tahun |
| `activities` | ~288.000 | 8 aktivitas per siklus |
| `harvests` | ~37.500 | Satu per siklus |
| `plot_health_snapshots` | ~150.000 | 12 snapshot per petak per tahun |
| `yield_predictions` | ~150.000 | 4 prediksi per siklus |
| `weather_observations` | ~1.460.000 | 500 kecamatan × 8 observasi/hari |
| `community_posts` | ~60.000 | — |
| `sync_events` | ~500.000 | Termasuk event duplikat |

| Tabel | Strategi |
| :--- | :--- |
| `weather_observations` | Kandidat utama partisi `RANGE` per tahun. Data lebih dari 2 tahun diarsipkan ke tabel ringkasan harian. |
| `activities`, `sync_events` | Partisi per tahun bila melewati 5 juta baris. Sebelum itu, indeks saja cukup. |
| `audit_logs` | Retensi 24 bulan, lalu arsip. |
| `notifications` | Hapus yang sudah dibaca lebih dari 90 hari. |
| `yield_predictions` | Simpan hanya prediksi terakhir per bulan per siklus; sisanya diarsipkan. |

Angka di atas adalah proyeksi kasar, bukan hasil benchmark. Klaim "cukup cepat" pada rancangan ini baru berlaku setelah diuji dengan data sebesar itu.

---

## 9. Anti-Pattern yang Dihindari

| Anti-pattern | Contoh salah | Perbaikan |
| :--- | :--- | :--- |
| Fungsi pada kolom terindeks | `WHERE YEAR(performed_at) = 2026` | `WHERE performed_at >= '2026-01-01' AND performed_at < '2027-01-01'` |
| Wildcard di depan | `WHERE name LIKE '%sari%'` | `FULLTEXT (name)` atau pencarian sisi aplikasi untuk dataset kecil |
| `SELECT *` pada tabel ber-`TEXT`/`JSON` | `SELECT * FROM activities` | Sebutkan kolom yang dipakai |
| N+1 query | Satu query per petak untuk skor kesehatan | `ROW_NUMBER()` + join sekali jalan |
| `OFFSET` besar | `LIMIT 20 OFFSET 5000` | Keyset pagination |
| Agregasi dua tabel anak sekaligus | `JOIN members JOIN plots` lalu `SUM` | Subquery terpisah (lihat §6.3) |
| Lupa filter tenant | `WHERE id = :id` | `WHERE id = :id AND organization_id = :org_id` |
| Menyimpan tanggal sebagai string | `harvest_date VARCHAR(20)` | `DATE` / `DATETIME(6)` |

---

## 10. Checklist Sebelum Query Dianggap Selesai

- [ ] Ada `organization_id` di klausa `WHERE` untuk setiap tabel tenant.
- [ ] `EXPLAIN` menunjukkan `type` minimal `range` (bukan `ALL`) pada tabel besar.
- [ ] `rows` yang diperiksa sebanding dengan jumlah hasil, bukan jumlah tabel penuh.
- [ ] Tidak ada `Using temporary; Using filesort` pada query yang dipanggil di halaman utama.
- [ ] Query agregat diuji dengan data yang punya minimal dua anak per induk (untuk menangkap fan-out).
- [ ] Hasil query dibandingkan dengan perhitungan manual pada satu organisasi contoh.

---

## 11. Ringkasan

| Kebutuhan UI | Sumber data | Kompleksitas |
| :--- | :--- | :--- |
| 4 kartu Ringkasan | `plots`, `organization_members`, `cultivation_cycles`, `yield_predictions` | 4 query sederhana / 1 view |
| Daftar lahan + kesehatan | `plots`, `plot_managers`, `plot_health_snapshots` | 1 query dengan window function |
| Papan siklus | `cultivation_cycles` + `commodities` | 1 query, dikelompokkan di aplikasi |
| Prediksi per komoditas | `yield_predictions`, `prediction_factors` | 2 query |
| Cuaca & risiko | `weather_observations`, `weather_forecasts`, `risk_alerts` | 3 query |
| Scan tanaman | `plant_observations`, `observation_symptoms` | 2 query |
| Komunitas | `community_posts`, `post_likes`, `post_comments` | 1 query + keyset pagination |
| Laporan | `reports` + query agregat sesuai jenis | 1 query per jenis laporan |
| Data BPS | `statistical_values` | 2 query |

Tidak ada kebutuhan UI yang memerlukan tabel tambahan di luar 42 tabel yang sudah dirancang.
