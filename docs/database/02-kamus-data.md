# 02 · Kamus Data MAPAN

Referensi kolom untuk 42 tabel. Tipe mengikuti MySQL 8.

**Cara membaca**

- **Null**: `wajib` = `NOT NULL`, `boleh` = `NULL`.
- **Default**: `—` berarti tidak ada nilai default eksplisit.
- Semua kolom `id` bertipe `BIGINT UNSIGNED AUTO_INCREMENT` kecuali tabel pivot (kunci komposit).
- `created_at` dan `updated_at` mengikuti aturan di `README.md` §5.3 dan tidak diulang di kolom keterangan.
- Panjang `VARCHAR` dipilih sesuai isi nyata, bukan seragam 255.

---

## 1. Tenancy & Identitas

### 1.1 `organizations`

Koperasi, gapoktan, atau perusahaan agribisnis. Batas isolasi data (tenant).

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `name` | VARCHAR(160) | wajib | Nama tampilan, mis. "Koperasi Subak Sari" |
| `slug` | VARCHAR(80) | wajib | UK — pengenal URL, huruf kecil dan tanda hubung |
| `type` | ENUM('koperasi','gapoktan','perusahaan_agribisnis','lainnya') | wajib | Default `koperasi` |
| `registration_no` | VARCHAR(60) | boleh | UK — mis. "KOP-2018-0472" |
| `founded_year` | SMALLINT UNSIGNED | boleh | `CHECK` 1900–2100 |
| `region_id` | BIGINT UNSIGNED | boleh | FK → `regions.id`, `ON DELETE SET NULL` |
| `address` | VARCHAR(255) | boleh | Alamat lengkap |
| `contact_email` | VARCHAR(160) | boleh | Tidak harus unik (beda dengan `users.email`) |
| `contact_phone` | VARCHAR(32) | boleh | Format E.164 disarankan |
| `description` | TEXT | boleh | Deskripsi singkat untuk halaman profil |
| `logo_path` | VARCHAR(255) | boleh | Path object storage |
| `status` | ENUM('aktif','nonaktif') | wajib | Default `aktif` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete |

**Kunci & indeks:** PK `id` · UK `slug`, `registration_no` · FK `region_id` · indeks `(status, deleted_at)`.

---

### 1.2 `users`

Akun orang. Tidak menyimpan organisasi atau peran — keduanya ada di `organization_members`.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `full_name` | VARCHAR(120) | wajib | Nama lengkap |
| `email` | VARCHAR(160) | wajib | UK — dipakai login web |
| `phone` | VARCHAR(32) | boleh | UK — dipakai login mobile; `NULL` diizinkan untuk akun web-only |
| `password_hash` | VARCHAR(255) | boleh | `NULL` bila akun hanya memakai OTP/PIN |
| `pin_hash` | VARCHAR(255) | boleh | PIN 6 digit untuk mobile, di-hash (dokumen lama §1.2) |
| `avatar_path` | VARCHAR(255) | boleh | Path object storage |
| `email_verified_at` | DATETIME(6) | boleh | — |
| `last_active_at` | DATETIME(6) | boleh | Ditampilkan sebagai "Terakhir aktif" |
| `status` | ENUM('aktif','nonaktif','ditangguhkan') | wajib | Default `aktif` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete, akun tidak benar-benar dihapus |

**Kunci & indeks:** PK `id` · UK `email`, `phone` · indeks `(status, last_active_at)`.

**Catatan:** `email` dan `phone` keduanya unik tetapi nullable. MySQL mengizinkan banyak `NULL` pada kolom `UNIQUE`, sehingga akun yang hanya punya salah satu identitas tetap valid.

---

### 1.3 `organization_members`

Keanggotaan seorang user di sebuah organisasi, beserta perannya. Tabel terpenting untuk isolasi tenant.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `RESTRICT` |
| `user_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `role` | ENUM('administrator','manajer_lapangan','petani','penyuluh') | wajib | Peran **di organisasi ini** |
| `status` | ENUM('aktif','undangan','nonaktif') | wajib | Default `undangan` |
| `joined_at` | DATETIME(6) | boleh | `NULL` selama masih undangan |
| `invited_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `(organization_id, user_id)` · indeks `(organization_id, role, status)`, `(user_id, status)`.

**Catatan:** UK komposit mencegah satu orang punya dua peran di organisasi yang sama. Peran berbeda di organisasi berbeda adalah kasus yang sah.

---

### 1.4 `organization_invitations`

Undangan bergabung yang dikirim ke email sebelum akun dibuat.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `email` | VARCHAR(160) | wajib | Alamat tujuan |
| `role` | ENUM('administrator','manajer_lapangan','petani','penyuluh') | wajib | Peran yang akan diberikan |
| `token` | CHAR(64) | wajib | UK — token acak untuk tautan undangan |
| `invited_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `status` | ENUM('pending','diterima','kedaluwarsa','dibatalkan') | wajib | Default `pending` |
| `expires_at` | DATETIME(6) | wajib | Masa berlaku tautan |
| `accepted_at` | DATETIME(6) | boleh | — |
| `pending_key` | VARCHAR(200) | boleh | **Generated VIRTUAL** - `IF(status='pending', CONCAT(organization_id,':',email), NULL)` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `token`, `pending_key` · indeks `(organization_id, status)`, `(email)`.

**Catatan:** `pending_key` meniru *partial unique index*. Tanpa kolom ini, admin bisa mengirim dua undangan aktif ke email yang sama. Setelah undangan diterima/kedaluwarsa, nilainya menjadi `NULL` dan email itu boleh diundang lagi.

---

### 1.5 `farm_groups`

Kelompok tani di dalam organisasi.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `name` | VARCHAR(120) | wajib | Mis. "Subak Sari" |
| `region_id` | BIGINT UNSIGNED | boleh | FK → `regions.id`, `SET NULL` |
| `leader_user_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `established_year` | SMALLINT UNSIGNED | boleh | — |
| `description` | TEXT | boleh | — |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete |

**Kunci & indeks:** PK `id` · UK `(organization_id, name)` · indeks `(region_id)`.

**Catatan:** Jumlah anggota dan total luas **tidak** disimpan di sini; keduanya dihitung dari `farm_group_members` dan `plots`.

---

### 1.6 `farm_group_members`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `farm_group_id` | BIGINT UNSIGNED | wajib | PK bagian 1, FK → `farm_groups.id`, `CASCADE` |
| `user_id` | BIGINT UNSIGNED | wajib | PK bagian 2, FK → `users.id`, `CASCADE` |
| `position` | ENUM('ketua','pengurus','anggota') | wajib | Default `anggota` |
| `joined_on` | DATE | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `(farm_group_id, user_id)` · indeks `(user_id)`.

---

### 1.7 `organization_settings`

Preferensi tingkat organisasi. Satu baris per organisasi.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `organization_id` | BIGINT UNSIGNED | wajib | PK, FK → `organizations.id`, `CASCADE` |
| `area_unit` | ENUM('ha','m2','are') | wajib | Default `ha` |
| `date_format` | ENUM('d_m_y_long','d_m_y','y_m_d') | wajib | Default `d_m_y_long` |
| `auto_sync` | BOOLEAN | wajib | Default `TRUE` |
| `weekly_report` | BOOLEAN | wajib | Default `FALSE` |
| `high_res_photos` | BOOLEAN | wajib | Default `FALSE` |
| `public_profile` | BOOLEAN | wajib | Default `FALSE` |
| `join_approval` | BOOLEAN | wajib | Default `TRUE` |
| `extension_read_access` | BOOLEAN | wajib | Akses baca untuk penyuluh |
| `weather_daily` | BOOLEAN | wajib | Notifikasi cuaca harian |
| `activity_reminder` | BOOLEAN | wajib | Pengingat aktivitas lapangan |
| `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `organization_id`.

**Catatan:** Kolom bertipe eksplisit dipilih daripada pola *key-value* (`setting_key`, `setting_value`) karena setelan ini terkait langsung dengan kontrol di UI dan punya tipe berbeda. Pola key-value akan menghilangkan validasi tipe dan menyulitkan query.

---

### 1.8 `user_preferences`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `user_id` | BIGINT UNSIGNED | wajib | PK, FK → `users.id`, `CASCADE` |
| `theme` | ENUM('terang','gelap','sistem') | wajib | Default `sistem` |
| `language` | CHAR(5) | wajib | Default `id` |
| `last_organization_id` | BIGINT UNSIGNED | boleh | FK → `organizations.id`, `SET NULL`; mengisi pemilih organisasi di sidebar |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `user_id` · indeks `(last_organization_id)`.

---

### 1.9 `user_devices`

Perangkat terdaftar untuk notifikasi push (FCM).

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `user_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `platform` | ENUM('android','ios','web') | wajib | — |
| `device_name` | VARCHAR(120) | boleh | Mis. "Redmi Note 12" |
| `push_token` | VARCHAR(255) | wajib | UK — token FCM |
| `app_version` | VARCHAR(20) | boleh | Untuk mendiagnosis bug versi lama |
| `last_seen_at` | DATETIME(6) | boleh | — |
| `revoked_at` | DATETIME(6) | boleh | Token tidak lagi dipakai |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `push_token` · indeks `(user_id, revoked_at)`.

---

## 2. Wilayah & Master

### 2.1 `regions`

Hierarki wilayah administratif. Mereferensi dirinya sendiri.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `parent_id` | BIGINT UNSIGNED | boleh | FK → `regions.id`, `RESTRICT`; `NULL` untuk provinsi |
| `level` | ENUM('provinsi','kabupaten','kecamatan','desa') | wajib | — |
| `name` | VARCHAR(120) | wajib | — |
| `bps_code` | CHAR(10) | boleh | UK — kode wilayah BPS, penghubung ke data statistik |
| `latitude` | DECIMAL(9,6) | boleh | Titik pusat wilayah |
| `longitude` | DECIMAL(9,6) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `bps_code` · indeks `(parent_id, level)`, `(level, name)`.

---

### 2.2 `commodities`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `code` | VARCHAR(20) | wajib | UK — mis. `padi`, `jagung`, `cabai` |
| `name` | VARCHAR(80) | wajib | Nama tampilan |
| `category` | ENUM('pangan','hortikultura','perkebunan','lainnya') | wajib | — |
| `base_yield_per_ha` | DECIMAL(10,2) | boleh | Kuintal/ha — koefisien *BaseYield* pada rumus prediksi |
| `default_unit` | ENUM('kg','ton','kuintal') | wajib | Default `kg`; satuan kanonis tetap kg |
| `default_cycle_days` | SMALLINT UNSIGNED | boleh | Estimasi umur tanam |
| `is_active` | BOOLEAN | wajib | Default `TRUE`; `FALSE` menyembunyikan dari pilihan tanpa menghapus riwayat |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `code` · indeks `(category, is_active)`.

---

### 2.3 `crop_varieties`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `commodity_id` | BIGINT UNSIGNED | wajib | FK → `commodities.id`, `CASCADE` |
| `name` | VARCHAR(80) | wajib | Mis. "Inpari 32", "Ciherang" |
| `maturity_days` | SMALLINT UNSIGNED | boleh | Umur panen khas |
| `description` | TEXT | boleh | — |
| `is_active` | BOOLEAN | wajib | Default `TRUE` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `(commodity_id, name)` · indeks `(commodity_id, is_active)`.

---

### 2.4 `symptoms`

Master gejala yang bisa dipilih pada halaman Scan tanaman.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `code` | VARCHAR(30) | wajib | UK — mis. `bercak_daun` |
| `label` | VARCHAR(120) | wajib | Mis. "Bercak pada daun" |
| `category` | ENUM('daun','batang','buah','akar','umum') | wajib | — |
| `is_active` | BOOLEAN | wajib | Default `TRUE` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `code` · indeks `(category, is_active)`.

---

## 3. Lahan

### 3.1 `plots`

Petak lahan yang dikelola.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `RESTRICT` |
| `farm_group_id` | BIGINT UNSIGNED | boleh | FK → `farm_groups.id`, `SET NULL` |
| `region_id` | BIGINT UNSIGNED | wajib | FK → `regions.id`, `RESTRICT`; dasar pencocokan cuaca |
| `code` | VARCHAR(30) | boleh | UK bersama `organization_id` |
| `name` | VARCHAR(120) | wajib | Mis. "Subak Sari" |
| `area_ha` | DECIMAL(10,2) | wajib | `CHECK (area_ha > 0)` |
| `elevation_m` | SMALLINT | boleh | Meter di atas permukaan laut |
| `soil_type` | VARCHAR(60) | boleh | Teks bebas; belum ada master jenis tanah |
| `irrigation_type` | ENUM('irigasi_teknis','tadah_hujan','lebak','lainnya') | boleh | — |
| `status` | ENUM('sehat','perhatian','kritis','tidak_aktif') | wajib | Default `sehat` |
| `address` | VARCHAR(255) | boleh | Alamat tekstual untuk ditampilkan |
| `established_on` | DATE | boleh | Sejak kapan petak digarap |
| `notes` | TEXT | boleh | — |
| `created_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete |

**Kunci & indeks:** PK `id` · UK `(organization_id, code)` · FK `organization_id`, `farm_group_id`, `region_id`, `created_by_id` · indeks `(organization_id, status, deleted_at)`, `(farm_group_id)`, `(region_id)`.

**Catatan:** Tidak menyimpan nama petani maupun nama komoditas. Keduanya berasal dari `plot_managers` dan `cultivation_cycles`.

---

### 3.2 `plot_boundaries`

Batas spasial petak. Relasi satu-ke-satu dengan `plots`.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `plot_id` | BIGINT UNSIGNED | wajib | PK, FK → `plots.id`, `CASCADE` |
| `boundary` | POLYGON SRID 4326 | wajib | Wajib `NOT NULL` agar `SPATIAL INDEX` sah |
| `centroid` | POINT SRID 4326 | wajib | Titik pusat; dipakai untuk saringan viewport peta. **Tidak bisa** diisi `ST_Centroid(boundary)` langsung karena MySQL menolak `ST_Centroid` untuk SRS geografis — hitung lewat proyeksi UTM atau di aplikasi |
| `measured_area_ha` | DECIMAL(10,2) | boleh | Hasil hitung luas dari poligon (bukan input manual) |
| `mapped_at` | DATETIME(6) | wajib | Kapan batas dipetakan |

**Kunci & indeks:** PK `plot_id` · SPATIAL `boundary`, `centroid`.

**Catatan:** Pemisahan tabel ini adalah konsekuensi langsung dari aturan MySQL bahwa kolom ber-`SPATIAL INDEX` harus `NOT NULL`. Tanpa pemisahan, petak yang belum dipetakan tidak bisa disimpan.

---

### 3.3 `plot_managers`

Petani yang menggarap petak. Banyak-ke-banyak, satu ditandai utama.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `plot_id` | BIGINT UNSIGNED | wajib | PK bagian 1, FK → `plots.id`, `CASCADE` |
| `user_id` | BIGINT UNSIGNED | wajib | PK bagian 2, FK → `users.id`, `CASCADE` |
| `is_primary` | BOOLEAN | wajib | Default `FALSE`; yang ditampilkan di kolom "Petani pengelola" |
| `assigned_on` | DATE | boleh | — |
| `primary_guard` | BIGINT UNSIGNED | boleh | **Generated VIRTUAL** - `IF(is_primary, plot_id, NULL)` |

**Kunci & indeks:** PK `(plot_id, user_id)` · UK `primary_guard` · indeks `(user_id)`.

**Catatan:** `primary_guard` memastikan maksimal satu pengelola utama per petak, karena MySQL tidak punya *partial unique index*. Baris dengan `is_primary = FALSE` menghasilkan `NULL` dan tidak saling bentrok.

---

### 3.4 `plot_health_snapshots`

Riwayat skor kesehatan petak.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `plot_id` | BIGINT UNSIGNED | wajib | FK → `plots.id`, `CASCADE` |
| `recorded_at` | DATETIME(6) | wajib | — |
| `health_score` | TINYINT UNSIGNED | wajib | `CHECK (health_score BETWEEN 0 AND 100)` |
| `ndvi` | DECIMAL(5,4) | boleh | `CHECK (ndvi BETWEEN -1 AND 1)`; belum ada pengisi otomatis |
| `source` | ENUM('manual','satelit','model') | wajib | Default `manual` |
| `notes` | VARCHAR(255) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(plot_id, recorded_at DESC)`.

**Catatan:** Angka `94%` di UI adalah baris terbaru per petak. Tren kenaikan/penurunan butuh seluruh seri, karena itu bukan satu kolom di `plots`.

---

## 4. Budidaya

### 4.1 `cultivation_cycles`

Satu penanaman pada satu petak.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `RESTRICT` |
| `plot_id` | BIGINT UNSIGNED | wajib | FK → `plots.id`, `RESTRICT` |
| `commodity_id` | BIGINT UNSIGNED | wajib | FK → `commodities.id`, `RESTRICT` |
| `variety_id` | BIGINT UNSIGNED | boleh | FK → `crop_varieties.id`, `SET NULL` |
| `season_label` | VARCHAR(40) | boleh | Mis. "Musim 2026" |
| `planted_area_ha` | DECIMAL(10,2) | wajib | `CHECK (planted_area_ha > 0)`; tidak boleh melebihi `plots.area_ha` (divalidasi aplikasi) |
| `phase` | ENUM('persiapan','vegetatif','generatif','pematangan','panen','selesai') | wajib | Default `persiapan` |
| `started_on` | DATE | wajib | — |
| `expected_harvest_on` | DATE | boleh | `CHECK (expected_harvest_on >= started_on)` |
| `actual_harvest_on` | DATE | boleh | — |
| `progress_pct` | TINYINT UNSIGNED | wajib | Default 0, `CHECK (progress_pct BETWEEN 0 AND 100)` |
| `status` | ENUM('aktif','selesai','gagal','dibatalkan') | wajib | Default `aktif` |
| `seed_amount_kg` | DECIMAL(10,2) | boleh | — |
| `notes` | TEXT | boleh | — |
| `created_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `active_guard` | VARCHAR(48) | boleh | **Generated VIRTUAL** - `IF(status='aktif', CONCAT(plot_id,':',commodity_id), NULL)`; panjang 48 karena dua `BIGINT UNSIGNED` bisa mencapai 20 digit + pemisah |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `active_guard` · FK `organization_id`, `plot_id`, `commodity_id`, `variety_id`, `created_by_id` · indeks `(organization_id, status, phase)`, `(plot_id, status)`, `(expected_harvest_on)`, `(commodity_id)`.

**Catatan:** `active_guard` menegakkan aturan "satu petak hanya boleh punya satu siklus aktif untuk komoditas yang sama". Setelah siklus selesai, nilainya `NULL` sehingga siklus baru boleh dimulai.

---

### 4.2 `cycle_phase_history`

Jejak perpindahan fase.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `cycle_id` | BIGINT UNSIGNED | wajib | FK → `cultivation_cycles.id`, `CASCADE` |
| `phase` | ENUM('persiapan','vegetatif','generatif','pematangan','panen','selesai') | wajib | — |
| `started_at` | DATETIME(6) | wajib | — |
| `ended_at` | DATETIME(6) | boleh | `NULL` untuk fase yang sedang berjalan; `CHECK (ended_at IS NULL OR ended_at >= started_at)` |
| `changed_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `note` | VARCHAR(255) | boleh | Alasan perubahan fase |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(cycle_id, started_at)`.

---

### 4.3 `activities`

Catatan kegiatan lapangan. Inti alur kerja petani dan tujuan sinkronisasi offline.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `RESTRICT` |
| `cycle_id` | BIGINT UNSIGNED | boleh | FK → `cultivation_cycles.id`, `SET NULL` |
| `plot_id` | BIGINT UNSIGNED | wajib | FK → `plots.id`, `RESTRICT` |
| `type` | ENUM('tanam','pemupukan','penyiangan','pengairan','penyemprotan','pemangkasan','panen','lainnya') | wajib | — |
| `status` | ENUM('direncanakan','berlangsung','selesai','dibatalkan') | wajib | Default `direncanakan` |
| `scheduled_for` | DATETIME(6) | boleh | Rencana pelaksanaan |
| `performed_at` | DATETIME(6) | boleh | Waktu nyata; `CHECK (status <> 'selesai' OR performed_at IS NOT NULL)` |
| `performed_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `notes` | TEXT | boleh | — |
| `photo_path` | VARCHAR(255) | boleh | Path object storage |
| `cost_total` | DECIMAL(14,2) | boleh | `CHECK (cost_total >= 0)`; ringkasan dari `activity_inputs` |
| `client_event_id` | CHAR(36) | boleh | UK — idempotency key dari perangkat |
| `client_timestamp` | DATETIME(6) | boleh | Waktu di perangkat saat dicatat (bisa beda dengan server) |
| `source` | ENUM('web','mobile','sistem') | wajib | Default `web` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `client_event_id` · FK `organization_id`, `cycle_id`, `plot_id`, `performed_by_id` · indeks `(organization_id, performed_at DESC)`, `(cycle_id, type)`, `(plot_id, performed_at DESC)`, `(status, scheduled_for)`.

**Catatan:** `client_timestamp` sengaja dipisah dari `created_at`. Server mencatat kapan data diterima; `client_timestamp` mencatat kapan petani benar-benar mencatat di lapangan. Untuk laporan kronologis, yang dipakai adalah `client_timestamp` bila ada.

---

### 4.4 `activity_inputs`

Sarana produksi yang dipakai dalam satu aktivitas.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `activity_id` | BIGINT UNSIGNED | wajib | FK → `activities.id`, `CASCADE` |
| `input_type` | ENUM('pupuk','pestisida','benih','alat','tenaga_kerja','lainnya') | wajib | — |
| `product_name` | VARCHAR(120) | wajib | Mis. "Urea", "NPK 16-16-16" |
| `quantity` | DECIMAL(12,3) | wajib | `CHECK (quantity > 0)` |
| `unit` | ENUM('kg','liter','karung','orang_hari','unit') | wajib | — |
| `unit_cost` | DECIMAL(14,2) | boleh | Harga satuan |
| `total_cost` | DECIMAL(14,2) | boleh | `CHECK (total_cost >= 0)` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · FK `activity_id` · indeks `(activity_id)`, `(input_type)`.

**Catatan:** Tabel ini adalah alasan `activities` tidak punya kolom teks "jenis pupuk". Satu pemupukan bisa memakai lebih dari satu bahan, dan biaya total perlu dirinci per bahan untuk laporan.

---

### 4.5 `harvests`

Hasil panen nyata.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `RESTRICT` |
| `cycle_id` | BIGINT UNSIGNED | wajib | FK → `cultivation_cycles.id`, `RESTRICT` |
| `plot_id` | BIGINT UNSIGNED | wajib | FK → `plots.id`, `RESTRICT` |
| `harvested_on` | DATE | wajib | — |
| `harvested_area_ha` | DECIMAL(10,2) | wajib | `CHECK (harvested_area_ha > 0)` |
| `yield_kg` | DECIMAL(12,2) | wajib | `CHECK (yield_kg >= 0)` |
| `productivity_kg_ha` | DECIMAL(12,2) | boleh | **Generated STORED** — `yield_kg / NULLIF(harvested_area_ha, 0)` |
| `quality_grade` | ENUM('A','B','C','ditolak') | boleh | — |
| `moisture_pct` | DECIMAL(5,2) | boleh | `CHECK (moisture_pct BETWEEN 0 AND 100)` |
| `price_per_kg` | DECIMAL(14,2) | boleh | — |
| `buyer_name` | VARCHAR(120) | boleh | — |
| `notes` | TEXT | boleh | — |
| `recorded_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · FK `organization_id`, `cycle_id`, `plot_id`, `recorded_by_id` · indeks `(organization_id, harvested_on DESC)`, `(cycle_id)`.

**Catatan:** `productivity_kg_ha` dihitung mesin, bukan diisi manusia, sehingga tidak mungkin berbeda dengan `yield_kg / harvested_area_ha`. Nilai ini bisa diindeks bila laporan produktivitas perlu diurutkan.

---

### 4.6 `tasks`

Tugas harian pada panel "Tugas" di Ringkasan.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `plot_id` | BIGINT UNSIGNED | boleh | FK → `plots.id`, `SET NULL` |
| `assignee_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `title` | VARCHAR(180) | wajib | — |
| `notes` | VARCHAR(255) | boleh | — |
| `due_at` | DATETIME(6) | boleh | — |
| `completed_at` | DATETIME(6) | boleh | — |
| `status` | ENUM('terbuka','selesai','dibatalkan') | wajib | Default `terbuka` |
| `created_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(organization_id, status, due_at)`, `(assignee_id, status)`.

**Catatan:** `status` dan `completed_at` harus konsisten (selesai berarti `completed_at` terisi). Dijaga `CHECK (status <> 'selesai' OR completed_at IS NOT NULL)`.

---

## 5. Analitik & Iklim

### 5.1 `yield_predictions`

Setiap perhitungan prediksi disimpan sebagai baris baru.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `cycle_id` | BIGINT UNSIGNED | wajib | FK → `cultivation_cycles.id`, `CASCADE` |
| `predicted_for` | DATE | wajib | Tanggal panen yang diprediksi |
| `predicted_yield_kg` | DECIMAL(12,2) | wajib | `CHECK (predicted_yield_kg >= 0)` |
| `productivity_kg_ha` | DECIMAL(12,2) | boleh | — |
| `confidence_pct` | DECIMAL(5,2) | wajib | `CHECK (confidence_pct BETWEEN 0 AND 100)` |
| `method` | ENUM('model','manual','musim_lalu') | wajib | Default `model` |
| `model_version` | VARCHAR(40) | boleh | Mis. `yield-v1.2` |
| `recommendation` | VARCHAR(255) | boleh | Teks saran yang tampil di UI |
| `predicted_at` | DATETIME(6) | wajib | Waktu perhitungan |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · FK `organization_id`, `cycle_id` · indeks `(cycle_id, predicted_at DESC)`, `(organization_id, predicted_for)`.

**Catatan:** Tidak ada `UNIQUE (cycle_id)`. Prediksi berubah saat cuaca atau aktivitas berubah, dan riwayatnya dibutuhkan untuk mengevaluasi akurasi model.

---

### 5.2 `prediction_factors`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `prediction_id` | BIGINT UNSIGNED | wajib | FK → `yield_predictions.id`, `CASCADE` |
| `factor` | ENUM('cuaca','kesehatan_tanaman','aktivitas','riwayat_panen','hama') | wajib | — |
| `weight_pct` | DECIMAL(5,2) | boleh | Bobot kontribusi, `CHECK` 0–100 |
| `value_text` | VARCHAR(120) | boleh | Ringkasan nilai, mis. "Hujan 65% pada Kamis" |
| `impact` | ENUM('positif','negatif','netral') | wajib | Default `netral` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · FK `prediction_id` · indeks `(prediction_id)`, `(factor, impact)`.

---

### 5.3 `weather_observations`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `region_id` | BIGINT UNSIGNED | wajib | FK → `regions.id`, `CASCADE` |
| `observed_at` | DATETIME(6) | wajib | — |
| `temperature_c` | DECIMAL(4,1) | boleh | `CHECK` −10…60 |
| `humidity_pct` | SMALLINT UNSIGNED | boleh | `CHECK` 0–100 |
| `wind_kph` | DECIMAL(5,1) | boleh | `CHECK` ≥ 0 |
| `rainfall_mm` | DECIMAL(6,2) | boleh | `CHECK` ≥ 0 |
| `condition` | ENUM('cerah','cerah_berawan','berawan','hujan_ringan','hujan_sedang','hujan_lebat') | wajib | — |
| `source` | VARCHAR(60) | wajib | Mis. `bmkg`, `openweathermap` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `(region_id, observed_at, source)` · indeks `(region_id, observed_at DESC)`.

**Catatan:** UK mencegah data ganda saat proses sinkronisasi cuaca berjalan dua kali untuk jam yang sama.

---

### 5.4 `weather_forecasts`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `region_id` | BIGINT UNSIGNED | wajib | FK → `regions.id`, `CASCADE` |
| `forecast_date` | DATE | wajib | Tanggal yang diramalkan |
| `issued_at` | DATETIME(6) | wajib | Kapan prakiraan diterbitkan |
| `temp_high_c` | DECIMAL(4,1) | boleh | — |
| `temp_low_c` | DECIMAL(4,1) | boleh | `CHECK (temp_low_c <= temp_high_c)` |
| `rain_chance_pct` | SMALLINT UNSIGNED | boleh | `CHECK` 0–100 |
| `condition` | ENUM('cerah','cerah_berawan','berawan','hujan_ringan','hujan_sedang','hujan_lebat') | wajib | — |
| `source` | VARCHAR(60) | wajib | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `(region_id, forecast_date, issued_at)` · indeks `(region_id, forecast_date)`.

**Catatan:** Prakiraan bisa direvisi. Karena `issued_at` ikut dalam UK, revisi tersimpan sebagai baris baru; UI mengambil `issued_at` terbaru per tanggal.

---

### 5.5 `risk_alerts`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | boleh | FK → `organizations.id`, `CASCADE`; `NULL` = berlaku untuk semua organisasi di wilayah itu |
| `region_id` | BIGINT UNSIGNED | wajib | FK → `regions.id`, `CASCADE` |
| `type` | ENUM('hujan','kekeringan','hama','penyakit','banjir') | wajib | — |
| `severity` | ENUM('rendah','sedang','tinggi') | wajib | Urutan deklarasi = urutan `MAX()` |
| `title` | VARCHAR(160) | wajib | — |
| `description` | TEXT | boleh | — |
| `valid_from` | DATETIME(6) | wajib | — |
| `valid_to` | DATETIME(6) | boleh | `NULL` = belum ditentukan |
| `source` | VARCHAR(60) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(region_id, valid_from, valid_to)`, `(organization_id, severity)`.

**Catatan:** `ENUM('rendah','sedang','tinggi')` sengaja tidak diurutkan alfabetis. `MAX(severity)` memakai urutan indeks ENUM, sehingga menghasilkan `tinggi` saat ada campuran — perilaku yang dibutuhkan kartu "Risiko cuaca".

---

### 5.6 `plant_observations`

Catatan hasil scan tanaman (foto + gejala), bukan diagnosis.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `plot_id` | BIGINT UNSIGNED | wajib | FK → `plots.id`, `CASCADE` |
| `cycle_id` | BIGINT UNSIGNED | boleh | FK → `cultivation_cycles.id`, `SET NULL` |
| `commodity_id` | BIGINT UNSIGNED | wajib | FK → `commodities.id`, `RESTRICT` |
| `observed_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `observed_at` | DATETIME(6) | wajib | — |
| `photo_path` | VARCHAR(255) | wajib | Path object storage; foto adalah bukti utama |
| `photo_size_kb` | INT UNSIGNED | boleh | Untuk audit penggunaan penyimpanan |
| `notes` | TEXT | boleh | — |
| `status` | ENUM('baru','ditinjau','selesai') | wajib | Default `baru` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · FK `organization_id`, `plot_id`, `cycle_id`, `commodity_id`, `observed_by_id` · indeks `(organization_id, observed_at DESC)`, `(plot_id, observed_at DESC)`.

---

### 5.7 `observation_symptoms`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `observation_id` | BIGINT UNSIGNED | wajib | PK bagian 1, FK → `plant_observations.id`, `CASCADE` |
| `symptom_id` | BIGINT UNSIGNED | wajib | PK bagian 2, FK → `symptoms.id`, `CASCADE` |
| `severity` | ENUM('ringan','sedang','berat') | boleh | — |

**Kunci & indeks:** PK `(observation_id, symptom_id)` · indeks `(symptom_id)`.

**Catatan:** Pilihan gejala di UI berupa *checkbox* (bisa lebih dari satu), sehingga wajib tabel anak agar memenuhi 1NF.

---

## 6. Sosial & Tata Kelola

### 6.1 `topics`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `label` | VARCHAR(80) | wajib | UK — mis. "Hujan & saluran air" |
| `slug` | VARCHAR(80) | wajib | UK — `hujan-saluran-air` |
| `description` | VARCHAR(255) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `label`, `slug`.

---

### 6.2 `community_posts`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | boleh | FK → `organizations.id`, `CASCADE`; `NULL` = diskusi lintas organisasi |
| `author_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `category` | ENUM('tanya_budidaya','berbagi_pengalaman','panen_pasar') | wajib | Sama dengan filter di UI |
| `title` | VARCHAR(150) | wajib | `CHECK (CHAR_LENGTH(title) <= 100)` sesuai batas input |
| `body` | TEXT | wajib | `CHECK (CHAR_LENGTH(body) <= 600)` sesuai batas input |
| `photo_path` | VARCHAR(255) | boleh | — |
| `like_count` | INT UNSIGNED | wajib | Default 0 — **cache** dari `post_likes` |
| `comment_count` | INT UNSIGNED | wajib | Default 0 — **cache** dari `post_comments` |
| `status` | ENUM('terbit','disembunyikan','dihapus') | wajib | Default `terbit` |
| `created_at`, `updated_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete |

**Kunci & indeks:** PK `id` · FK `organization_id`, `author_id` · indeks `(organization_id, created_at DESC)`, `(author_id)`, `(category, created_at DESC)` · FULLTEXT `(title, body)`.

**Catatan:** `like_count` dan `comment_count` adalah satu-satunya duplikasi angka yang disengaja. Aturan sinkronisasinya ada di dokumen 03 §7.2.

---

### 6.3 `post_comments`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `post_id` | BIGINT UNSIGNED | wajib | FK → `community_posts.id`, `CASCADE` |
| `author_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `body` | VARCHAR(300) | wajib | Sesuai `maxLength` di UI |
| `created_at` | DATETIME(6) | wajib | — |
| `deleted_at` | DATETIME(6) | boleh | Soft delete |

**Kunci & indeks:** PK `id` · indeks `(post_id, created_at)`.

---

### 6.4 `post_likes`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `post_id` | BIGINT UNSIGNED | wajib | PK bagian 1, FK → `community_posts.id`, `CASCADE` |
| `user_id` | BIGINT UNSIGNED | wajib | PK bagian 2, FK → `users.id`, `CASCADE` |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `(post_id, user_id)` · indeks `(user_id)`.

---

### 6.5 `post_topics`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `post_id` | BIGINT UNSIGNED | wajib | PK bagian 1, FK → `community_posts.id`, `CASCADE` |
| `topic_id` | BIGINT UNSIGNED | wajib | PK bagian 2, FK → `topics.id`, `CASCADE` |

**Kunci & indeks:** PK `(post_id, topic_id)` · indeks `(topic_id)`.

---

### 6.6 `notifications`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | boleh | FK → `organizations.id`, `CASCADE` |
| `user_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `type` | ENUM('cuaca','aktivitas','panen','undangan','sistem') | wajib | — |
| `title` | VARCHAR(160) | wajib | — |
| `body` | VARCHAR(500) | boleh | — |
| `entity_type` | VARCHAR(40) | boleh | Mis. `cultivation_cycle` |
| `entity_id` | BIGINT UNSIGNED | boleh | Relasi polimorfik, tanpa FK |
| `read_at` | DATETIME(6) | boleh | `NULL` = belum dibaca; dasar notif dot di topbar |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(user_id, read_at, created_at DESC)`, `(organization_id, created_at DESC)`.

**Catatan:** `entity_type` + `entity_id` sengaja tidak diberi FK karena menunjuk ke tabel berbeda-beda. Validitasnya dijaga aplikasi. Alternatif yang lebih ketat adalah tabel relasi per tipe, tetapi berlebihan untuk kebutuhan notifikasi.

---

### 6.7 `reports`

Riwayat permintaan dan hasil ekspor laporan.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `type` | ENUM('hasil_panen','lahan','aktivitas','cuaca','prediksi') | wajib | Sesuai 4 kartu laporan + prediksi |
| `period_start` | DATE | wajib | — |
| `period_end` | DATE | wajib | `CHECK (period_end >= period_start)` |
| `format` | ENUM('csv','xlsx','pdf') | wajib | Default `csv` |
| `file_path` | VARCHAR(255) | boleh | `NULL` selama masih diproses |
| `row_count` | INT UNSIGNED | boleh | Jumlah baris hasil |
| `status` | ENUM('antre','proses','selesai','gagal') | wajib | Default `antre` |
| `error_message` | VARCHAR(255) | boleh | — |
| `requested_by_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `completed_at` | DATETIME(6) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(organization_id, created_at DESC)`, `(status, created_at)`.

---

### 6.8 `audit_logs`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | boleh | FK → `organizations.id`, `SET NULL` |
| `actor_id` | BIGINT UNSIGNED | boleh | FK → `users.id`, `SET NULL` |
| `action` | VARCHAR(60) | wajib | Mis. `plot.update`, `member.invite` |
| `entity_type` | VARCHAR(40) | boleh | — |
| `entity_id` | BIGINT UNSIGNED | boleh | — |
| `changes` | JSON | boleh | Objek `{before, after}` |
| `ip_address` | VARCHAR(45) | boleh | Cukup untuk IPv6 |
| `user_agent` | VARCHAR(255) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(organization_id, created_at DESC)`, `(entity_type, entity_id)`, `(actor_id, created_at DESC)`.

**Catatan:** Tidak ada `updated_at` — baris audit tidak boleh diubah. `ON DELETE SET NULL` pada `actor_id` agar jejak tidak hilang saat akun dihapus.

---

## 7. Sinkronisasi & Data Resmi

### 7.1 `sync_events`

Buku besar event dari aplikasi mobile untuk replay offline.

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `organization_id` | BIGINT UNSIGNED | wajib | FK → `organizations.id`, `CASCADE` |
| `user_id` | BIGINT UNSIGNED | wajib | FK → `users.id`, `CASCADE` |
| `device_id` | BIGINT UNSIGNED | boleh | FK → `user_devices.id`, `SET NULL` |
| `idempotency_key` | CHAR(36) | wajib | UK — UUID dibuat klien |
| `entity_type` | VARCHAR(40) | wajib | Mis. `activity` |
| `entity_id` | BIGINT UNSIGNED | boleh | Terisi setelah event berhasil diproses |
| `operation` | ENUM('create','update','delete') | wajib | — |
| `payload` | JSON | wajib | Isi asli dari perangkat |
| `client_timestamp` | DATETIME(6) | wajib | Waktu di perangkat |
| `server_timestamp` | DATETIME(6) | wajib | Waktu diterima server |
| `status` | ENUM('diterima','diproses','duplikat','gagal') | wajib | Default `diterima` |
| `error_message` | VARCHAR(255) | boleh | — |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `idempotency_key` · indeks `(organization_id, created_at DESC)`, `(status, created_at)`, `(user_id)`.

**Catatan:** `status='duplikat'` tetap dicatat sebagai indikator kualitas jaringan. `payload` dipertahankan agar event yang gagal dipetakan bisa diproses ulang tanpa meminta petani mencatat lagi.

---

### 7.2 `statistical_sources`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `publisher` | VARCHAR(120) | wajib | Mis. "Badan Pusat Statistik" |
| `title` | VARCHAR(255) | wajib | Judul publikasi |
| `document_no` | VARCHAR(60) | boleh | Nomor Berita Resmi Statistik |
| `published_on` | DATE | boleh | — |
| `url` | VARCHAR(500) | boleh | Tautan sumber |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · indeks `(publisher, published_on)`.

---

### 7.3 `statistical_indicators`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `code` | VARCHAR(40) | wajib | UK — mis. `rice_production` |
| `name` | VARCHAR(160) | wajib | Mis. "Produksi padi" |
| `unit` | VARCHAR(30) | wajib | Mis. `juta ton`, `kuintal/ha` |
| `category` | ENUM('produksi','luas_panen','produktivitas','sosial_ekonomi') | wajib | — |
| `decimals` | TINYINT UNSIGNED | wajib | Default 2 — jumlah desimal saat ditampilkan |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `code` · indeks `(category)`.

---

### 7.4 `statistical_values`

| Kolom | Tipe | Null | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | wajib | PK |
| `indicator_id` | BIGINT UNSIGNED | wajib | FK → `statistical_indicators.id`, `CASCADE` |
| `region_id` | BIGINT UNSIGNED | boleh | FK → `regions.id`, `CASCADE`; `NULL` = angka nasional |
| `period_year` | SMALLINT UNSIGNED | wajib | Mis. 2024 |
| `period_type` | ENUM('tahunan','semester','triwulan','bulanan') | wajib | Default `tahunan` |
| `value` | DECIMAL(18,4) | wajib | — |
| `source_id` | BIGINT UNSIGNED | boleh | FK → `statistical_sources.id`, `SET NULL` |
| `note` | VARCHAR(255) | boleh | Mis. "Angka tetap" / "Angka sementara" |
| `created_at` | DATETIME(6) | wajib | — |

**Kunci & indeks:** PK `id` · UK `(indicator_id, region_id, period_year, period_type)` · indeks `(indicator_id, period_year)`, `(region_id, period_year)`.

**Catatan penting:** MySQL menganggap dua `NULL` **berbeda** pada `UNIQUE`. Karena itu UK di atas **tidak** mencegah dua baris nasional (`region_id = NULL`) untuk indikator dan tahun yang sama. Solusinya: kolom `region_key` hasil *generated column* `IFNULL(region_id, 0)` dan UK memakai kolom itu. Ini akan diterapkan saat DDL ditulis — dicatat di sini agar tidak terlewat.

---

## 8. Rekapitulasi

| Lapis | Jumlah | Tabel |
| :--- | --: | :--- |
| 1 · Inti | 18 | organizations, users, organization_members, regions, commodities, crop_varieties, plots, plot_boundaries, plot_managers, cultivation_cycles, activities, activity_inputs, harvests, plot_health_snapshots, yield_predictions, weather_observations, tasks, organization_settings |
| 2 · Operasional | 13 | organization_invitations, farm_groups, farm_group_members, symptoms, plant_observations, observation_symptoms, cycle_phase_history, prediction_factors, weather_forecasts, risk_alerts, user_preferences, user_devices, sync_events |
| 3 · Sosial & tata kelola | 8 | community_posts, post_comments, post_likes, topics, post_topics, notifications, reports, audit_logs |
| 4 · Data resmi | 3 | statistical_sources, statistical_indicators, statistical_values |
| **Total** | **42** | |

Tabel turunan yang **tidak** dibuat karena cukup berupa view: `v_plot_current`, `v_organization_kpi`, `v_commodity_share`, `v_active_cycles`. Daftarnya ada di dokumen 04.
