# 03 · Normalisasi & Aturan Bisnis

Dokumen ini membuktikan bahwa skema memenuhi 1NF–3NF/BCNF, menjelaskan denormalisasi yang **sengaja** dilakukan, dan menetapkan aturan bisnis beserta cara penegakannya.

---

## 1. Titik Awal: Data Mock yang Sekarang Ada

Sumber masalahnya bisa dilihat langsung di `src/features/dashboard/data/dashboard.js`. Satu objek `plots` menampung banyak subjek sekaligus:

```js
{ id: 'p1', name: 'Subak Sari', area: '12,4 ha', farmer: 'I Wayan Suarta',
  crop: 'Padi Inpari 32', phase: 'Vegetatif', status: 'Sehat',
  location: 'Tabanan, Bali', color: 'green', health: 94 }
```

Satu baris ini sesungguhnya memuat enam entitas berbeda:

| Nilai di mock | Sebenarnya milik entitas | Masalah |
| :--- | :--- | :--- |
| `name`, `id` | petak lahan | wajar |
| `area: '12,4 ha'` | petak lahan | angka + satuan digabung dalam teks → tidak bisa `SUM` |
| `farmer: 'I Wayan Suarta'` | pengguna | nama disalin; kalau petani berganti nama, data lama basi |
| `crop: 'Padi Inpari 32'` | komoditas + varietas | dua entitas dalam satu teks bebas |
| `phase: 'Vegetatif'` | siklus budidaya | fase milik siklus, bukan milik petak |
| `location: 'Tabanan, Bali'` | wilayah (kecamatan + kabupaten) | dua tingkat wilayah dalam satu string |
| `health: 94` | pengukuran kesehatan | tidak ada waktu pengukuran; tidak bisa dibuat tren |
| `color: 'green'` | presentasi | bukan data, cukup diturunkan dari status di frontend |

Kondisi serupa muncul di data komunitas:

```js
{ likes: 18, comments: ['Pastikan saluran pembuangan tidak tersumbat...'] }
```

`comments` berisi array string tanpa penulis dan waktu — nilai berulang dalam satu sel.

---

## 2. Unnormalized Form (UNF)

Bayangkan seluruh data dashboard disimpan dalam satu tabel lebar:

```
petak(id, nama, luas, petani, komoditas, varietas, fase, status, kesehatan,
      kecamatan, kabupaten, provinsi, kelompok_tani,
      pengurus_kelompok_1, pengurus_kelompok_2, pengurus_kelompok_3,
      gejala_1, gejala_2, gejala_3,
      komentar_1, komentar_2, komentar_3,
      jumlah_suka, jumlah_komentar,
      prediksi_ton, keyakinan, cuaca_suhu, cuaca_hujan, risiko)
```

Cacat yang langsung terlihat:

1. **Grup berulang** (pengurus, gejala, komentar) → melanggar 1NF.
2. **Nilai gabungan** (`"12,4 ha"`, `"Tabanan, Bali"`, `"Padi Inpari 32"`) → atomisitas dilanggar pada tingkat semantik.
3. **Redundansi** nama petani dan komoditas di setiap baris petak.
4. **Anomali pembaruan**: petani berganti nama harus diubah di semua baris petak.
5. **Anomali penyisipan**: tidak bisa mendaftarkan komoditas baru sebelum ada petak yang menanamnya.
6. **Anomali penghapusan**: menghapus satu-satunya petak petani tertentu menghapus seluruh informasi petani itu.

---

## 3. First Normal Form (1NF)

**Syarat:** setiap sel berisi satu nilai atomik, tidak ada grup berulang, setiap baris unik.

| Pelanggaran | Solusi | Tabel hasil |
| :--- | :--- | :--- |
| Banyak pengurus dalam satu sel | Satu baris per pasangan petak–petani | `plot_managers` |
| Banyak gejala per hasil scan | Satu baris per pasangan observasi–gejala | `observation_symptoms` |
| Banyak komentar per diskusi | Satu baris per komentar | `post_comments` |
| Banyak bahan per aktivitas | Satu baris per bahan | `activity_inputs` |
| Banyak anggota per kelompok tani | Satu baris per pasangan kelompok–user | `farm_group_members` |
| Banyak topik per diskusi | Satu baris per pasangan diskusi–topik | `post_topics` |
| `"12,4 ha"` | `area_ha DECIMAL(10,2)` = `12.40`; satuan jadi metadata kolom | `plots` |
| `"Tabanan, Bali"` | `region_id` menunjuk kecamatan; induknya memberi kabupaten/provinsi | `plots` + `regions` |
| `"Padi Inpari 32"` | `commodity_id` + `variety_id` | `cultivation_cycles` |
| `color: 'green'` | tidak disimpan; diturunkan dari `status` di frontend | — |

**Bukti kunci:** setiap tabel hasil punya PK tunggal (`id`) atau PK komposit pada tabel pivot, dan tidak ada kolom yang menyimpan daftar.

---

## 4. Second Normal Form (2NF)

**Syarat:** sudah 1NF, dan setiap atribut non-kunci bergantung pada **seluruh** kunci komposit, bukan sebagian.

Hanya tabel dengan PK komposit yang bisa melanggar 2NF. Di skema ini ada lima:

| Tabel | PK | Atribut non-kunci | Ketergantungan |
| :--- | :--- | :--- | :--- |
| `plot_managers` | `(plot_id, user_id)` | `is_primary`, `assigned_on` | Bergantung pada **pasangan**; `is_primary` tidak bermakna dari `plot_id` saja maupun `user_id` saja |
| `farm_group_members` | `(farm_group_id, user_id)` | `position`, `joined_on` | Posisi hanya bermakna dalam konteks kelompok tertentu |
| `observation_symptoms` | `(observation_id, symptom_id)` | `severity` | Tingkat keparahan khas untuk gejala pada observasi itu |
| `post_likes` | `(post_id, user_id)` | `created_at` | Waktu suka bergantung pada pasangan |
| `post_topics` | `(post_id, topic_id)` | — | Tidak ada atribut non-kunci, sehingga 2NF otomatis terpenuhi |

Tidak ada atribut yang hanya bergantung pada `plot_id` atau hanya pada `user_id`, sehingga **seluruh tabel memenuhi 2NF**.

Contoh yang sengaja dihindari: menaruh `farmer_name` di `plot_managers`. Nama bergantung pada `user_id` saja — itu dependensi parsial dan sekaligus pelanggaran 3NF.

---

## 5. Third Normal Form (3NF)

**Syarat:** sudah 2NF dan tidak ada dependensi transitif: atribut non-kunci tidak boleh bergantung pada atribut non-kunci lain.

### 5.1 Dependensi fungsional utama

```
plots:
  id                      → organization_id, farm_group_id, region_id, code, name,
                            area_ha, status, irrigation_type, ...
  (organization_id, code) → id                        [kandidat kunci]

users:
  id    → full_name, email, phone, status
  email → id                                          [kandidat kunci]

organization_members:
  id                   → organization_id, user_id, role, status
  (organization_id, user_id) → id                      [kandidat kunci]

cultivation_cycles:
  id → plot_id, commodity_id, variety_id, phase, started_on, status
  active_guard → id

activities:
  id              → organization_id, plot_id, cycle_id, type, status, performed_at
  client_event_id → id                                [kandidat kunci]

harvests:
  id → cycle_id, plot_id, harvested_on, harvested_area_ha, yield_kg
  (yield_kg, harvested_area_ha) → productivity_kg_ha   [turunan, disimpan generated]

statistical_values:
  (indicator_id, region_id, period_year, period_type) → value, source_id
```

### 5.2 Dependensi transitif yang dihilangkan

| Data | Kalau disimpan di tabel transaksi | Kenapa salah | Penempatan benar |
| :--- | :--- | :--- | :--- |
| Nama petani | `plots.farmer_name` | `plot_id → user_id → full_name` (transitif) | `users.full_name`, diakses lewat `plot_managers` |
| Nama komoditas | `cultivation_cycles.commodity_name` | `id → commodity_id → name` | `commodities.name` |
| Nama varietas | `cultivation_cycles.variety_name` | `id → variety_id → name` | `crop_varieties.name` |
| Nama wilayah | `plots.village_name`, `plots.regency_name` | `plot_id → region_id → name` | `regions.name` + hierarki `parent_id` |
| Nama organisasi | `plots.organization_name` | `plot_id → organization_id → name` | `organizations.name` |
| Nama kelompok tani | `plots.group_name` | `plot_id → farm_group_id → name` | `farm_groups.name` |
| Nama penulis komentar | `post_comments.author_name` | `comment_id → author_id → full_name` | `users.full_name` |
| Satuan luas | `plots.area` = `"12,4 ha"` | nilai gabungan + satuan | `area_ha` + `organization_settings.area_unit` |
| Produktivitas | input manual | `harvest_id → yield_kg, area → productivity` | *generated column* |
| Usia pengelola | `members.age` | `user_id → birth_date → age` (dan berubah tiap tahun) | turunan dari `users.birth_date` bila dibutuhkan |

### 5.3 Attribute vs derived: `plots.status` dan `health_score`

Keduanya sering dikira duplikat, padahal berbeda:

- `plots.status` = **keputusan** operasional (`sehat`, `perhatian`, `kritis`, `tidak_aktif`). Bisa diubah manusia, misalnya lahan sengaja diistirahatkan.
- `plot_health_snapshots.health_score` = **hasil pengukuran** pada waktu tertentu.

Status *biasanya* diturunkan dari skor, tetapi tidak selalu. Menyatukannya akan menghilangkan kemampuan menyatakan "skor 88 tapi lahan sengaja tidak ditanami". Karena itu keduanya sah berdiri sendiri, dan `status` tidak melanggar 3NF.

### 5.4 Kesimpulan 3NF

Seluruh tabel memenuhi 3NF setelah dekomposisi di §5.2. Satu-satunya atribut turunan yang disimpan adalah `harvests.productivity_kg_ha`, dan itu berupa *generated column* yang tidak bisa di-`INSERT`/`UPDATE` secara manual — sehingga secara praktis tidak melanggar, karena nilainya selalu fungsi dari kolom lain di baris yang sama.

---

## 6. BCNF

**Syarat:** untuk setiap dependensi fungsional nontrivial `X → Y`, `X` harus kandidat kunci.

Pemeriksaan pada tabel yang punya lebih dari satu kandidat kunci:

| Tabel | Kandidat kunci | Dependensi | Status |
| :--- | :--- | :--- | :--- |
| `organizations` | `id`, `slug`, `registration_no` | `slug → id`, `registration_no → id` | BCNF — penentu adalah kandidat kunci |
| `users` | `id`, `email`, `phone` | `email → id`, `phone → id` | BCNF |
| `commodities` | `id`, `code` | `code → id` | BCNF |
| `regions` | `id`, `bps_code` | `bps_code → id` | BCNF |
| `statistical_values` | `id`, `(indicator_id, region_id, period_year, period_type)` | kunci komposit → `value` | BCNF |
| `farm_group_members` | `(farm_group_id, user_id)` | tidak ada determinan lain | BCNF |

Tidak ditemukan dependensi yang penentunya bukan kandidat kunci, sehingga skema berada di **BCNF**.

---

## 7. Denormalisasi yang Disengaja

Normalisasi bukan tujuan akhir. Berikut duplikasi yang dipertahankan beserta alasan dan pengendaliannya.

### 7.1 `organization_id` di tabel anak

`activities`, `harvests`, `cultivation_cycles`, `yield_predictions`, `plant_observations`, `sync_events` menyimpan `organization_id` padahal bisa diturunkan dari `plots → organization_id`.

| Aspek | Penjelasan |
| :--- | :--- |
| Alasan | Setiap query tenant bisa memakai satu indeks berawalan `organization_id` tanpa join ke `plots`. Ini juga lapisan pertahanan kedua: query yang lupa memfilter organisasi tetap bisa ditolak berdasarkan kolom ini. |
| Risiko | Nilai bisa tidak konsisten dengan `plots.organization_id`. |
| Pengendalian | `organization_id` **wajib** diisi dari konteks server (bukan dari body request), lalu diverifikasi sama dengan organisasi milik `plot_id` dalam transaksi yang sama. Diuji lewat test isolasi tenant. |
| Tingkat normalisasi | Secara formal ini pelanggaran 3NF (`id → plot_id → organization_id`). Diterima karena alasan kinerja dan keamanan, dan didokumentasikan terbuka. |

### 7.2 `community_posts.like_count` dan `comment_count`

| Aspek | Penjelasan |
| :--- | :--- |
| Alasan | Feed komunitas menampilkan puluhan diskusi sekaligus. `COUNT(*)` per diskusi berarti puluhan subquery. |
| Risiko | Angka bisa menyimpang dari tabel anak. |
| Pengendalian | Diperbarui trigger `AFTER INSERT/DELETE` pada `post_likes` dan `post_comments`. **Sumber kebenaran tetap `COUNT(*)`**; ada job rekonsiliasi mingguan yang membandingkan keduanya. |
| Aturan | Kolom ini tidak boleh di-`UPDATE` dari kode aplikasi, hanya trigger. |

### 7.3 `organization_settings` sebagai kolom, bukan key-value

Bukan denormalisasi, melainkan pilihan model. Setiap setelan punya tipe dan default sendiri; pola `(key, value)` akan menghilangkan `CHECK`, `BOOLEAN`, dan `ENUM`. Jumlah setelan sudah stabil mengikuti kontrol UI.

---

## 8. Aturan Bisnis

Kolom **Penegakan** menunjukkan lapisan yang menjamin aturan: `UNIQUE`/`CHECK`/`FK` (database), *generated* (database), `trigger` (database), `aplikasi` (service layer), atau `UI` (validasi awal, tidak boleh diandalkan).

| # | Aturan | Penegakan | Implementasi MySQL |
| :-- | :--- | :--- | :--- |
| BR-01 | Satu user hanya punya satu peran per organisasi | DB | `UNIQUE (organization_id, user_id)` di `organization_members` |
| BR-02 | Satu petak hanya punya satu pengelola utama | DB | `primary_guard` generated + `UNIQUE` |
| BR-03 | Satu petak hanya punya satu siklus aktif per komoditas | DB | `active_guard` generated + `UNIQUE` |
| BR-04 | Satu user hanya bisa menyukai satu diskusi sekali | DB | PK `(post_id, user_id)` |
| BR-05 | Satu petak hanya punya satu baris batas | DB | PK `plot_boundaries.plot_id` |
| BR-06 | Satu organisasi hanya punya satu baris setelan | DB | PK `organization_settings.organization_id` |
| BR-07 | Satu user hanya punya satu baris preferensi | DB | PK `user_preferences.user_id` |
| BR-08 | Luas petak harus positif | DB | `CHECK (area_ha > 0)` |
| BR-09 | Luas tanam tidak boleh melebihi luas petak | Aplikasi | Validasi dalam transaksi; tidak bisa `CHECK` lintas tabel |
| BR-10 | Luas panen tidak boleh melebihi luas tanam | Aplikasi | Idem |
| BR-11 | Skor kesehatan 0–100 | DB | `CHECK (health_score BETWEEN 0 AND 100)` |
| BR-12 | Tingkat keyakinan prediksi 0–100 | DB | `CHECK (confidence_pct BETWEEN 0 AND 100)` |
| BR-13 | Progres siklus 0–100 | DB | `CHECK (progress_pct BETWEEN 0 AND 100)` |
| BR-14 | Tanggal panen tidak mendahului tanggal tanam | DB | `CHECK (expected_harvest_on >= started_on)` |
| BR-15 | Akhir fase tidak mendahului awal fase | DB | `CHECK (ended_at IS NULL OR ended_at >= started_at)` |
| BR-16 | Periode laporan valid | DB | `CHECK (period_end >= period_start)` |
| BR-17 | Panen hanya untuk siklus berstatus `selesai`/`panen` | Aplikasi | Validasi status sebelum `INSERT` |
| BR-18 | Aktivitas `selesai` wajib punya `performed_at` | DB | `CHECK (status <> 'selesai' OR performed_at IS NOT NULL)` |
| BR-19 | Tugas `selesai` wajib punya `completed_at` | DB | `CHECK (status <> 'selesai' OR completed_at IS NOT NULL)` |
| BR-20 | Satu event offline hanya diproses sekali | DB | `UNIQUE (idempotency_key)` di `sync_events` dan `client_event_id` di `activities` |
| BR-21 | Undangan aktif unik per email per organisasi | DB | `pending_key` generated + `UNIQUE` |
| BR-22 | Pengelola petak harus anggota aktif organisasi yang sama | Aplikasi + trigger | Validasi join `organization_members`; trigger mencegah perubahan status anggota |
| BR-23 | Petani tidak boleh mengelola petak organisasi lain | Aplikasi | Filter `organization_id` + verifikasi kepemilikan |
| BR-24 | `activities.plot_id` harus konsisten dengan `cultivation_cycles.plot_id` bila `cycle_id` terisi | Trigger | `BEFORE INSERT/UPDATE` membandingkan kedua nilai |
| BR-25 | `harvests.plot_id` harus sama dengan `cultivation_cycles.plot_id` | Trigger | Idem |
| BR-26 | Boundary poligon harus valid | Aplikasi | `ST_IsValid()` sebelum simpan |
| BR-27 | Poligon wajib berada dalam wilayah Indonesia | Aplikasi | Cek bounding box sebelum simpan |
| BR-28 | Anggota berstatus `undangan` tidak boleh ditugaskan | Aplikasi | Validasi `status='aktif'` saat menetapkan `assignee_id` |
| BR-29 | Notifikasi hanya untuk anggota organisasi terkait | Aplikasi | Filter `organization_id` |
| BR-30 | Audit log tidak boleh diubah atau dihapus | DB | Tidak ada `updated_at`; hak `UPDATE`/`DELETE` dicabut untuk user aplikasi |

### 8.1 Aturan yang sengaja tidak dijadikan constraint

| Aturan | Alasan tidak di DB |
| :--- | :--- |
| BR-09, BR-10 | `CHECK` di MySQL tidak boleh mereferensi tabel lain. Bisa dibuat trigger, tetapi trigger lintas tabel sulit dirawat; validasi di service layer lebih jelas dan bisa memberi pesan error yang berguna. |
| Status kesehatan diturunkan dari skor | Ambang batas bisa berubah dan bersifat kebijakan, bukan kebenaran struktural. Disimpan sebagai aturan di service. |
| Komoditas aktif saja yang bisa dipilih | Kebijakan bisnis; data lama harus tetap valid walau komoditas dinonaktifkan. |

---

## 9. Matriks Integritas per Tabel Inti

| Tabel | PK | UK | FK | CHECK | Generated |
| :--- | :-: | :-: | :-: | :-: | :-: |
| `organizations` | ✓ | 2 | 1 | 1 | — |
| `users` | ✓ | 2 | — | — | — |
| `organization_members` | ✓ | 1 | 2 | — | — |
| `organization_invitations` | ✓ | 2 | 2 | — | ✓ |
| `organization_settings` | ✓ | — | 1 | — | — |
| `regions` | ✓ | 1 | 1 (self) | — | — |
| `commodities` | ✓ | 1 | — | — | — |
| `crop_varieties` | ✓ | 1 | 1 | — | — |
| `plots` | ✓ | 1 | 4 | 1 | — |
| `plot_boundaries` | ✓ | — | 1 | — | — |
| `plot_managers` | komposit | 1 | 2 | — | ✓ |
| `plot_health_snapshots` | ✓ | — | 1 | 2 | — |
| `cultivation_cycles` | ✓ | 1 | 5 | 4 | ✓ |
| `cycle_phase_history` | ✓ | — | 2 | 1 | — |
| `activities` | ✓ | 1 | 4 | 1 | — |
| `activity_inputs` | ✓ | — | 1 | 2 | — |
| `harvests` | ✓ | — | 4 | 4 | ✓ |
| `tasks` | ✓ | — | 4 | 1 | — |
| `yield_predictions` | ✓ | — | 2 | 2 | — |
| `weather_observations` | ✓ | 1 | 1 | 4 | — |
| `plant_observations` | ✓ | — | 5 | — | — |
| `community_posts` | ✓ | — | 2 | 2 | — |
| `post_likes` | komposit | — | 2 | — | — |
| `statistical_values` | ✓ | 1 | 3 | — | ✓ |

---

## 10. Ringkasan

| Bentuk normal | Status | Bukti |
| :--- | :--- | :--- |
| 1NF | Terpenuhi | 6 tabel anak untuk nilai berulang; angka dan satuan dipisah; tidak ada kolom berisi daftar |
| 2NF | Terpenuhi | 5 tabel ber-PK komposit, seluruh atribut bergantung pada kunci penuh |
| 3NF | Terpenuhi | 10 dependensi transitif dihilangkan (§5.2) |
| BCNF | Terpenuhi | Semua determinan adalah kandidat kunci (§6) |
| Denormalisasi | 2 kasus, terdokumentasi | `organization_id` di tabel anak (§7.1), counter komunitas (§7.2) |
