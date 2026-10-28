# Rancangan Basis Data MAPAN

Dokumen rancangan basis data untuk **APLIKASI MAPAN** (Manajemen & Analisis Prediksi Agri Nusantara).

**Status:** rancangan selesai. DDL **Fase 1–2 (17 tabel)** sudah tersedia di [`db/`](../../db/) dan **sudah dieksekusi pada MySQL 8.0.43**: 17 tabel terbentuk, 153 baris seed masuk, 11 pemeriksaan positif sesuai harapan, dan 5/5 uji constraint `PASS`. Belum ada API.
**DBMS acuan:** MySQL 8.0 (InnoDB, `utf8mb4`).
**Cakupan:** seluruh 12 menu dashboard + kebutuhan mobile offline-first.
**Jumlah tabel:** 42, dikelompokkan dalam 4 lapis.

---

## 1. Daftar Dokumen

| # | Dokumen | Isi |
| :-- | :--- | :--- |
| — | `README.md` (ini) | Ruang lingkup, keputusan arsitektur, konvensi, glosarium, penyimpangan dari dokumen lama |
| 01 | [`01-erd.md`](01-erd.md) | Conceptual ERD + 7 ERD per domain, kardinalitas, dan penjelasan relasi kunci |
| 02 | [`02-kamus-data.md`](02-kamus-data.md) | Data dictionary lengkap 42 tabel: kolom, tipe, nullability, default, constraint |
| 03 | [`03-normalisasi-dan-aturan.md`](03-normalisasi-dan-aturan.md) | Bukti 1NF–3NF/BCNF memakai data mock yang sekarang ada + aturan bisnis |
| 04 | [`04-indeks-dan-pemetaan-ui.md`](04-indeks-dan-pemetaan-ui.md) | Strategi indeks, query viewer, dan pemetaan setiap angka UI ke sumber datanya |
| 05 | [`05-rencana-implementasi.md`](05-rencana-implementasi.md) | Urutan pembuatan tabel, dependensi, risiko, dan keputusan yang masih terbuka |
| — | [`db/README.md`](../../db/README.md) | Skrip SQL Fase 1–2, seed demo, dan cara menjalankan verifikasi |

Dokumen ini **menggantikan** rancangan skema pada `docs/plans/aplikasi-mapan-v1.md` §3, tetapi tetap mengadopsi kebutuhan non-fungsionalnya (offline-first, multi-tenant, object storage, prediksi, FCM). Lihat §7 untuk daftar penyimpangan.

---

## 2. Ruang Lingkup

### 2.1 Yang dicakup

| Domain | Menu dashboard yang dilayani |
| :--- | :--- |
| Tenancy & identitas | Pengguna, Organisasi, Pengaturan, pemilih organisasi di sidebar |
| Wilayah & master | Peta lahan, Lahan, filter komoditas, data BPS di halaman Tentang |
| Lahan | Peta lahan, Lahan, Ringkasan |
| Budidaya | Siklus budidaya, aktivitas, panen, tugas harian |
| Analitik & iklim | Prediksi panen, Cuaca & risiko, Scan tanaman |
| Sosial & tata kelola | Komunitas, Laporan, Notifikasi, audit |
| Sinkronisasi mobile | Antrean offline, idempotency, token perangkat |

### 2.2 Yang tidak dicakup (v1)

- Integrasi sensor IoT (sesuai dokumen lama §1.3)
- Marketplace / transaksi jual-beli komoditas
- Analisis citra satelit NDVI otomatis — kolom `ndvi` disiapkan, tetapi belum ada pipeline pengisinya
- Diagnosis penyakit otomatis — UI secara eksplisit menyatakan diagnosis belum terhubung, jadi hanya gejala yang disimpan

### 2.3 Aktor

| Aktor | Peran di sistem | Kebutuhan data utama |
| :--- | :--- | :--- |
| Administrator koperasi | Mengelola organisasi, anggota, laporan | Semua data dalam organisasinya |
| Manajer lapangan | Memantau petak, siklus, risiko | Lahan, siklus, aktivitas, cuaca |
| Petani | Mencatat aktivitas, panen, scan | Petak yang dikelola, tugas, riwayat |
| Penyuluh | Akses baca untuk pendampingan | Lahan, kesehatan tanaman, komunitas |
| Pengunjung publik | Membaca halaman Tentang & data BPS | Data statistik agregat saja |

---

## 3. Keputusan Arsitektur

| # | Keputusan | Alternatif yang ditolak | Alasan |
| :-- | :--- | :--- | :--- |
| A1 | **Shared schema, satu database, `organization_id` di setiap tabel transaksional** | Schema-per-tenant, database-per-tenant | 42 tabel × N koperasi tidak terkelola untuk skala tugas ini. Satu migrasi berlaku untuk semua tenant. Isolasi ditegakkan di lapisan aplikasi (MySQL tidak punya RLS seperti PostgreSQL). |
| A2 | **Peran menempel pada keanggotaan**, bukan pada user | `users.role` seperti dokumen lama | Satu orang bisa menjadi admin di koperasi A dan petani di koperasi B. Ini juga yang membuat tombol *ganti organisasi* di sidebar masuk akal. |
| A3 | **Kunci primer `BIGINT UNSIGNED AUTO_INCREMENT`** | UUID v4 seperti dokumen lama | Untuk tugas perancangan, integer lebih mudah dijelaskan, lebih kecil di indeks, dan urutan insert terjaga. Kolom `client_event_id` (UUID) tetap dipakai untuk idempotensi mobile. |
| A4 | **ENUM untuk state machine yang dikunci UI; tabel lookup untuk data yang bisa diedit** | Semua ENUM, atau semua lookup | Fase budidaya memang 4 kolom tetap di UI (`phaseColumns`), jadi ENUM tepat. Komoditas, varietas, gejala, dan wilayah harus bisa ditambah tanpa migrasi → tabel lookup. |
| A5 | **Geometri dipisah ke `plot_boundaries` (1:1)** | `plots.boundary POLYGON` seperti dokumen lama | MySQL mewajibkan kolom ber-`SPATIAL INDEX` bersifat `NOT NULL`. Kalau boundary nullable, indeks spasial tidak bisa dibuat. Tabel terpisah membuat `plots` tetap bisa dibuat tanpa gambar batas, sementara tabel batas bisa `NOT NULL` + terindeks. |
| A6 | **Semua waktu disimpan UTC di `DATETIME(6)`** | `TIMESTAMP` | `DATETIME` tidak terkena konversi zona waktu server; konversi ke WIB dilakukan di aplikasi. `TIMESTAMP` juga terbatas sampai 2038. |
| A7 | **Luas dalam hektare `DECIMAL(10,2)`, hasil panen dalam kg, uang `DECIMAL(14,2)`** | Menyimpan `"12,4 ha"` / `"1,2 Ton"` seperti mock sekarang | Angka harus bisa di-`SUM`, di-`AVG`, dan dibandingkan. Format tampilan adalah tugas frontend. |
| A8 | **Soft delete (`deleted_at`) pada entitas yang dilihat banyak anggota** | Hard delete | Riwayat aktivitas dan audit harus tetap utuh setelah data "dihapus". |
| A9 | **Counter agregat (`like_count`, `comment_count`) disimpan sebagai cache** | Selalu `COUNT(*)` | Daftar komunitas butuh hitungan tanpa join ke tabel besar. Nilai ini **bukan** sumber kebenaran dan wajib disinkronkan trigger. |
| A10 | **Data BPS masuk tabel, bukan file JS** | Tetap hardcode di `agriculture.js` | Grafik halaman Tentang saat ini punya 6 seri waktu + 5 provinsi + sensus. Kalau angka diperbarui tiap rilis BPS, edit kode bukan solusi. |

### 3.1 Konsekuensi MySQL 8 yang harus disadari

| Keterbatasan | Dampak | Solusi yang dipakai |
| :--- | :--- | :--- |
| Tidak ada Row Level Security | Isolasi tenant bergantung kode aplikasi | `organization_id` wajib ada di semua tabel transaksional + seluruh query difilter; diuji lewat test isolasi |
| Tidak ada partial index | Tidak bisa `UNIQUE ... WHERE status = 'aktif'` | *Generated column* yang menghasilkan `NULL` saat syarat tidak terpenuhi, lalu `UNIQUE` pada kolom itu (MySQL mengizinkan banyak `NULL`) |
| *Generated* `STORED` tidak boleh ber-`CASCADE` | Error 1215 bila kolom dasar generated `STORED` dipakai FK `ON DELETE CASCADE` | Pakai generated `VIRTUAL`, bukan `STORED`, untuk kolom penjaga (`pending_key`, `primary_guard`, `active_guard`) |
| Tidak ada materialized view | KPI agregat mahal jika dihitung tiap request | View biasa untuk query, tabel ringkasan/cache untuk angka dashboard |
| `SPATIAL INDEX` wajib `NOT NULL` | Boundary opsional tidak bisa diindeks | Tabel `plot_boundaries` terpisah (A5) |
| `FULLTEXT` tidak mendukung bahasa Indonesia secara khusus | Pencarian komunitas | `FULLTEXT(title, body)` dengan `ngram` tidak diperlukan; `LIKE '%...%'` dilarang karena tidak memakai indeks |
| Urutan `ENUM` = urutan deklarasi | `MAX(severity)` | ENUM severity dideklarasikan `('rendah','sedang','tinggi')` agar `MAX` benar secara makna |

---

## 4. Susunan Lapis Tabel

| Lapis | Fokus | Jumlah | Tabel |
| :--- | :--- | --: | :--- |
| **1 · Inti** | Wajib ada agar aplikasi berfungsi | 18 | `organizations`, `users`, `organization_members`, `regions`, `commodities`, `crop_varieties`, `plots`, `plot_boundaries`, `plot_managers`, `cultivation_cycles`, `activities`, `activity_inputs`, `harvests`, `plot_health_snapshots`, `yield_predictions`, `weather_observations`, `tasks`, `organization_settings` |
| **2 · Operasional** | Melengkapi alur kerja & mobile | 13 | `organization_invitations`, `farm_groups`, `farm_group_members`, `symptoms`, `plant_observations`, `observation_symptoms`, `cycle_phase_history`, `prediction_factors`, `weather_forecasts`, `risk_alerts`, `user_preferences`, `user_devices`, `sync_events` |
| **3 · Sosial & tata kelola** | Komunitas, laporan, jejak audit | 8 | `community_posts`, `post_comments`, `post_likes`, `topics`, `post_topics`, `notifications`, `reports`, `audit_logs` |
| **4 · Data resmi** | Statistik BPS untuk halaman publik | 3 | `statistical_sources`, `statistical_indicators`, `statistical_values` |

Lapis 1 wajib selesai sebelum lapis 2. Lapis 3 dan 4 independen dan bisa dikerjakan belakangan.

---

## 5. Konvensi

### 5.1 Penamaan

- Tabel: `snake_case`, **jamak** (`plots`, `activities`).
- Kolom: `snake_case`, **tunggal** (`area_ha`, `harvested_on`).
- Foreign key: `<entitas>_id` (`plot_id`, `commodity_id`).
- Boolean: `is_*` / `has_*`.
- Waktu: akhiran `_at` (`created_at`, `performed_at`). Tanggal: akhiran `_on` (`harvested_on`).
- Uang: akhiran `_cost` atau `price_*`. Satuan selalu di nama kolom (`area_ha`, `yield_kg`, `rainfall_mm`).

### 5.2 Tipe baku

| Kebutuhan | Tipe |
| :--- | :--- |
| Kunci primer/asing | `BIGINT UNSIGNED` |
| Teks pendek | `VARCHAR(n)` dengan `n` sesuai isi, bukan 255 untuk semuanya |
| Teks panjang | `TEXT` |
| Angka desimal | `DECIMAL` — **tidak pernah** `FLOAT`/`DOUBLE` untuk luas, hasil, uang |
| Persentase | `DECIMAL(5,2)` + `CHECK (x BETWEEN 0 AND 100)` |
| Status terbatas | `ENUM(...)` |
| Atribut fleksibel | `JSON` (hanya untuk payload mentah, bukan data yang di-query) |
| Geometri | `POLYGON SRID 4326`, `POINT SRID 4326` |

### 5.3 Kolom wajib

| Kolom | Aturan |
| :--- | :--- |
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` |
| `created_at` | `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)` |
| `updated_at` | `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` |
| `deleted_at` | `DATETIME(6) NULL`, hanya pada tabel yang butuh soft delete |

### 5.4 Aturan integritas

- `FOREIGN KEY` **wajib** untuk setiap relasi; tidak ada relasi yang hanya "disepakati di kode".
- `ON DELETE RESTRICT` sebagai default. `CASCADE` hanya untuk anak yang tidak bermakna tanpa induk (`plot_boundaries`, `activity_inputs`, `observation_symptoms`, `post_likes`).
- `ON DELETE SET NULL` untuk relasi opsional (mis. `plots.farm_group_id`).
- Setiap FK otomatis mendapat indeks (MySQL membuatnya, tetapi tetap diberi nama eksplisit).
- `CHECK` dipakai untuk rentang nilai; MySQL 8 menegakkannya sejak 8.0.16.

### 5.5 Karakter & kolasi

```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
```

Alasan: nama petani, nama lahan, dan teks komunitas memuat karakter non-ASCII. Kolasi `ai_ci` membuat pencarian tidak peka huruf besar/kecil dan aksen.

---

## 6. Glosarium

Istilah UI berbahasa Indonesia, istilah skema berbahasa Inggris agar konsisten dengan konvensi SQL.

| Istilah UI | Nama di skema | Catatan |
| :--- | :--- | :--- |
| Organisasi / Koperasi | `organizations` | Batas isolasi data (tenant) |
| Kelompok tani | `farm_groups` | Sub-unit di dalam organisasi |
| Petani pengelola | `users` + `plot_managers` | Relasi banyak-ke-banyak, satu ditandai utama |
| Lahan / petak | `plots` | Satu bidang tanah yang dikelola |
| Batas lahan | `plot_boundaries` | Poligon + titik pusat (spasial) |
| Siklus budidaya | `cultivation_cycles` | Satu penanaman pada satu petak |
| Fase | `cycle_phase_history` | Riwayat perpindahan fase |
| Aktivitas | `activities` | Pemupukan, penyemprotan, panen, dll. |
| Sarana produksi | `activity_inputs` | Pupuk/pestisida/benih yang dipakai |
| Prediksi panen | `yield_predictions` | Estimasi + tingkat keyakinan |
| Scan tanaman | `plant_observations` | Catatan foto + gejala (bukan diagnosis) |
| Cuaca & risiko | `weather_observations`, `weather_forecasts`, `risk_alerts` | Observasi, prakiraan, peringatan |
| Laporan | `reports` | Riwayat ekspor CSV/XLSX |
| Sinkronisasi | `sync_events` | Antrean offline dari aplikasi mobile |
| Data resmi | `statistical_*` | Statistik BPS untuk halaman publik |

---

## 7. Penyimpangan dari `docs/plans/aplikasi-mapan-v1.md`

| # | Dokumen lama | Rancangan ini | Alasan |
| :-- | :--- | :--- | :--- |
| D1 | PostgreSQL + PostGIS | **MySQL 8** | Keputusan pemilik proyek untuk tugas perancangan basis data. Konsekuensi teknis dijelaskan di §3.1. |
| D2 | PK `UUID` | `BIGINT UNSIGNED` | Lebih ringkas untuk relasi padat dan mudah dijelaskan saat presentasi. UUID tetap dipakai untuk `client_event_id`. |
| D3 | `users.tenant_id` + `users.role` | `organization_members` (user × organisasi × peran) | Satu orang tidak bisa berada di dua koperasi pada desain lama. |
| D4 | `lands` (satu tabel, boundary `NOT NULL`) | `plots` + `plot_boundaries` | Pemisahan agar petak bisa didaftarkan sebelum batas dipetakan, dan agar `SPATIAL INDEX` memenuhi syarat MySQL. |
| D5 | `lands.farmer_id` (satu petani) | `plot_managers` (banyak petani, satu utama) | Satu petak sering digarap bersama; UI tetap menampilkan satu "petani pengelola". |
| D6 | `commodity_type VARCHAR(100)` | `commodity_id` → `commodities` + `crop_varieties` | Menghilangkan salah ketik dan memungkinkan agregasi per komoditas. |
| D7 | `action_type VARCHAR(50)` | `activities.type ENUM` + `activity_inputs` | Tipe aktivitas terkontrol; bahan yang dipakai dinormalisasi ke tabel anak. |
| D8 | `predictions` satu baris per siklus (`UNIQUE`) | `yield_predictions` banyak baris per siklus | Prediksi berubah seiring waktu; riwayat prediksi dibutuhkan untuk evaluasi model. |
| D9 | `photo_urls JSONB` | `photo_path VARCHAR` di tabel terkait | Satu foto per catatan; galeri banyak foto bisa ditambahkan lewat tabel anak bila perlu. |
| D10 | Tidak ada tabel statistik | `statistical_*` | Halaman Tentang menampilkan data BPS dan harus bisa diperbarui tanpa mengubah kode. |
| D11 | Tidak ada tabel audit/sinkronisasi | `audit_logs`, `sync_events`, `user_devices` | Kebutuhan offline-first dan jejak perubahan yang disebut di §4 dokumen lama. |

Yang **tetap diadopsi** dari dokumen lama: multi-tenant, idempotency key untuk replay offline, `client_timestamp`, penyimpanan foto sebagai path object storage, agregasi cuaca per kecamatan, koefisien prediksi (cuaca + kepatuhan operasional), dan FCM.

---

## 8. Pemetaan Singkat: Angka di UI → Tabel

Sebagian besar angka dashboard saat ini adalah konstanta di `dashboard.js`. Berikut asal usulnya setelah skema diterapkan (detail query di `04-indeks-dan-pemetaan-ui.md`).

| Angka UI | Sumber |
| :--- | :--- |
| Total lahan `125 Ha` | `SUM(plots.area_ha)` per organisasi |
| `24 petak` | `COUNT(plots)` |
| Total petani `248` | `COUNT(organization_members)` status aktif |
| Prediksi panen `1,2 Ton` | `SUM(yield_predictions.predicted_yield_kg)` terbaru per siklus aktif |
| Risiko cuaca `Rendah` | `MAX(risk_alerts.severity)` yang masih berlaku |
| Kesehatan petak `94%` | `plot_health_snapshots` terbaru per petak |
| `19 petak` siklus aktif | `COUNT(cultivation_cycles WHERE status='aktif')` |
| Panen 30 hari `6 lahan` | `expected_harvest_on` dalam 30 hari ke depan |
| Komoditas `42%` | Agregasi `planted_area_ha` per komoditas |
| `52 anggota` kelompok | `COUNT(farm_group_members)` |
| `13 menunggu undangan` | `organization_invitations` status `pending` |
| Grafik BPS di halaman Tentang | `statistical_values` |

---

## 9. Batasan Dokumen

- DDL **Fase 1–2 (17 tabel)** sudah ditulis di `db/migrations/`, lengkap dengan seed dan uji constraint. Fase 3–6 belum.
- DDL tersebut **sudah dieksekusi pada MySQL 8.0.43**: semua 17 tabel terbentuk, seed masuk, dan 5 uji constraint menolak data salah dengan kode error yang diharapkan. Rincian di `db/README.md`.
- Batasan MySQL yang baru terbukti saat eksekusi dicatat sebagai R-11 (`STORED` + `CASCADE`) dan R-12 (`mysqldump` harus `--hex-blob`).
- Nama kolom dan tipe sudah final kecuali ada koreksi; penambahan kolom setelah DDL dibuat sebaiknya lewat migrasi, bukan edit langsung.
- Belum ada API atau kode backend.
- Rancangan ini belum diuji dengan data nyata berskala produksi. Estimasi volume dan strategi partisi di `04-indeks-dan-pemetaan-ui.md` bersifat proyeksi.
