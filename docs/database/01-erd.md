# 01 · ERD MAPAN

Semua diagram memakai notasi *crow's foot* (Mermaid). Nama entitas = nama tabel sebenarnya.

**Legenda kardinalitas**

| Simbol | Arti |
| :--- | :--- |
| `||--||` | satu ke satu (wajib) |
| `||--o{` | satu ke banyak (boleh nol) |
| `||--|{` | satu ke banyak (minimal satu) |
| `}o--o{` | banyak ke banyak |

Kunci: `PK` primary key, `FK` foreign key, `UK` unique key. Kolom audit (`created_at`, `updated_at`, `deleted_at`) tidak diulang di setiap diagram agar terbaca; semuanya ada di kamus data.

---

## 1. Gambaran Konseptual

```mermaid
flowchart TB
  subgraph S1["1 · TENANCY & IDENTITAS"]
    ORG[organizations]
    USR[users]
    MEM[organization_members]
    GRP[farm_groups]
  end

  subgraph S2["2 · WILAYAH & MASTER"]
    REG[regions]
    COM[commodities]
    VAR[crop_varieties]
    SYM[symptoms]
  end

  subgraph S3["3 · LAHAN"]
    PLOT[plots]
    BND[plot_boundaries]
    PM[plot_managers]
    HEALTH[plot_health_snapshots]
  end

  subgraph S4["4 · BUDIDAYA"]
    CYC[cultivation_cycles]
    HIST[cycle_phase_history]
    ACT[activities]
    INP[activity_inputs]
    HARV[harvests]
    TASK[tasks]
  end

  subgraph S5["5 · ANALITIK & IKLIM"]
    PRED[yield_predictions]
    PF[prediction_factors]
    WOBS[weather_observations]
    WFC[weather_forecasts]
    RISK[risk_alerts]
    OBS[plant_observations]
    OSYM[observation_symptoms]
  end

  subgraph S6["6 · SOSIAL & TATA KELOLA"]
    POST[community_posts]
    CMT[post_comments]
    LIKE[post_likes]
    TOP[topics]
    NOTIF[notifications]
    REP[reports]
    AUD[audit_logs]
  end

  subgraph S7["7 · SINKRONISASI & DATA RESMI"]
    SYNC[sync_events]
    SRC[statistical_sources]
    IND[statistical_indicators]
    VAL[statistical_values]
  end

  ORG --> MEM
  USR --> MEM
  ORG --> GRP
  REG --> ORG
  REG --> GRP
  ORG --> PLOT
  GRP --> PLOT
  REG --> PLOT
  PLOT --> BND
  USR --> PM
  PLOT --> PM
  PLOT --> HEALTH
  PLOT --> CYC
  COM --> CYC
  VAR --> CYC
  CYC --> HIST
  CYC --> ACT
  ACT --> INP
  CYC --> HARV
  ORG --> TASK
  CYC --> PRED
  PRED --> PF
  REG --> WOBS
  REG --> WFC
  REG --> RISK
  PLOT --> OBS
  OBS --> OSYM
  SYM --> OSYM
  ORG --> POST
  USR --> POST
  POST --> CMT
  POST --> LIKE
  POST --> TOP
  USR --> NOTIF
  ORG --> REP
  USR --> SYNC
  IND --> VAL
  SRC --> VAL
  REG --> VAL
```

### 1.1 Relasi lintas domain

Relasi yang "menyeberang" domain dan perlu diperhatikan saat membuat DDL:

| Dari | Ke | Arti |
| :--- | :--- | :--- |
| `organizations.region_id` | `regions` | Wilayah operasional koperasi |
| `farm_groups.region_id` | `regions` | Wilayah kelompok tani |
| `plots.region_id` | `regions` | Lokasi administratif petak (dasar agregasi cuaca) |
| `plots.organization_id` | `organizations` | Kepemilikan tenant |
| `plots.farm_group_id` | `farm_groups` | Kelompok tani pengelola |
| `cultivation_cycles.plot_id` | `plots` | Siklus berjalan di petak |
| `activities.performed_by_id` | `users` | Petani pencatat |
| `plant_observations.cycle_id` | `cultivation_cycles` | Opsional: scan bisa tanpa siklus |
| `community_posts.organization_id` | `organizations` | `NULL` = diskusi lintas organisasi |
| `statistical_values.region_id` | `regions` | `NULL` = angka nasional |

---

## 2. Domain 1 — Tenancy & Identitas

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "mempekerjakan"
  USERS ||--o{ ORGANIZATION_MEMBERS : "tergabung"
  ORGANIZATIONS ||--o{ ORGANIZATION_INVITATIONS : "mengundang"
  USERS ||--o{ ORGANIZATION_INVITATIONS : "mengirim"
  ORGANIZATIONS ||--o{ FARM_GROUPS : "memiliki"
  FARM_GROUPS ||--o{ FARM_GROUP_MEMBERS : "beranggota"
  USERS ||--o{ FARM_GROUP_MEMBERS : "menjadi anggota"
  ORGANIZATIONS ||--|| ORGANIZATION_SETTINGS : "mengatur"
  USERS ||--|| USER_PREFERENCES : "memilih"
  USERS ||--o{ USER_DEVICES : "memakai"
  REGIONS ||--o{ ORGANIZATIONS : "berlokasi"
  REGIONS ||--o{ FARM_GROUPS : "berlokasi"

  ORGANIZATIONS {
    bigint id PK
    varchar name
    varchar slug UK
    enum type "koperasi | gapoktan | perusahaan_agribisnis | lainnya"
    varchar registration_no UK
    smallint founded_year
    bigint region_id FK
    varchar contact_email
    enum status "aktif | nonaktif"
  }

  USERS {
    bigint id PK
    varchar full_name
    varchar email UK
    varchar phone
    varchar password_hash
    datetime last_active_at
    enum status "aktif | nonaktif | ditangguhkan"
  }

  ORGANIZATION_MEMBERS {
    bigint id PK
    bigint organization_id FK
    bigint user_id FK
    enum role "administrator | manajer_lapangan | petani | penyuluh"
    enum status "aktif | undangan | nonaktif"
    datetime joined_at
    bigint invited_by_id FK
  }

  ORGANIZATION_INVITATIONS {
    bigint id PK
    bigint organization_id FK
    varchar email
    enum role
    char token UK
    enum status "pending | diterima | kedaluwarsa | dibatalkan"
    datetime expires_at
  }

  FARM_GROUPS {
    bigint id PK
    bigint organization_id FK
    varchar name
    bigint region_id FK
    bigint leader_user_id FK
    smallint established_year
  }

  FARM_GROUP_MEMBERS {
    bigint farm_group_id PK,FK
    bigint user_id PK,FK
    enum position "ketua | pengurus | anggota"
    date joined_on
  }

  ORGANIZATION_SETTINGS {
    bigint organization_id PK,FK
    enum area_unit "ha | m2 | are"
    boolean auto_sync
    boolean weekly_report
    boolean public_profile
    boolean join_approval
    boolean extension_read_access
  }

  USER_PREFERENCES {
    bigint user_id PK,FK
    enum theme "terang | gelap | sistem"
    char language
    bigint last_organization_id FK
  }

  USER_DEVICES {
    bigint id PK
    bigint user_id FK
    enum platform "android | ios | web"
    varchar device_name
    varchar push_token UK
    datetime last_seen_at
  }
```

### Catatan desain

- **`organization_members` adalah jantung isolasi tenant.** `role` ada di sini, bukan di `users`. Satu user bisa punya baris berbeda di dua organisasi dengan peran berbeda. Ini yang membuat `UNIQUE (organization_id, user_id)` penting: satu orang hanya boleh punya satu peran per organisasi.
- **`organization_settings` dan `user_preferences` dipisah** karena pemiliknya berbeda: setelan organisasi diubah admin dan berlaku untuk semua anggota; tema terang/gelap milik masing-masing pengguna. Menggabungkannya akan melanggar 3NF (atribut bergantung pada dua subjek).
- **`user_preferences.last_organization_id`** menyimpan organisasi terakhir yang dipilih sehingga pemilih organisasi di sidebar langsung terbuka di konteks yang benar.
- **`organization_invitations` tidak memakai `user_id`** karena undangan dikirim ke alamat email yang belum tentu punya akun.
- **`user_devices.push_token` unik** agar satu perangkat tidak menerima notifikasi ganda; token FCM lama dicabut dengan `revoked_at`.

---

## 3. Domain 2 — Wilayah & Master

```mermaid
erDiagram
  REGIONS ||--o{ REGIONS : "induk wilayah"
  COMMODITIES ||--o{ CROP_VARIETIES : "memiliki varietas"
  REGIONS ||--o{ PLOTS : "menaungi"
  COMMODITIES ||--o{ CULTIVATION_CYCLES : "ditanam"

  REGIONS {
    bigint id PK
    bigint parent_id FK
    enum level "provinsi | kabupaten | kecamatan | desa"
    varchar name
    char bps_code UK
    decimal latitude
    decimal longitude
  }

  COMMODITIES {
    bigint id PK
    varchar code UK
    varchar name
    enum category "pangan | hortikultura | perkebunan | lainnya"
    decimal base_yield_per_ha
    smallint default_cycle_days
    boolean is_active
  }

  CROP_VARIETIES {
    bigint id PK
    bigint commodity_id FK
    varchar name
    smallint maturity_days
    boolean is_active
  }

  SYMPTOMS {
    bigint id PK
    varchar code UK
    varchar label
    enum category "daun | batang | buah | akar | umum"
    boolean is_active
  }
```

### Catatan desain

- **`regions` mereferensi dirinya sendiri** (`parent_id`) untuk hierarki provinsi → kabupaten → kecamatan → desa. Ini menghindari empat kolom teks berulang di `plots` dan memungkinkan agregasi cuaca per kecamatan seperti yang diminta dokumen lama §7.
- **`bps_code`** memungkinkan pencocokan otomatis dengan tabel BPS, sehingga data statistik dan data operasional memakai kode wilayah yang sama.
- **`commodities.base_yield_per_ha`** adalah koefisien *BaseYield* pada rumus prediksi dokumen lama §5.
- **`symptoms` hanya master gejala, bukan penyakit.** UI menyatakan diagnosis otomatis belum tersambung, jadi menyimpan tabel penyakit akan menjadi tabel kosong tanpa pemakai.
- `regions.level` sengaja `ENUM`, bukan tabel lookup: kedalaman hierarki administratif Indonesia sudah baku dan tidak akan ditambah admin.

---

## 4. Domain 3 — Lahan

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ PLOTS : "memiliki"
  FARM_GROUPS ||--o{ PLOTS : "mengelola"
  REGIONS ||--o{ PLOTS : "menaungi"
  PLOTS ||--|| PLOT_BOUNDARIES : "memiliki batas"
  PLOTS ||--o{ PLOT_MANAGERS : "digarap"
  USERS ||--o{ PLOT_MANAGERS : "menggarap"
  PLOTS ||--o{ PLOT_HEALTH_SNAPSHOTS : "dipantau"

  PLOTS {
    bigint id PK
    bigint organization_id FK
    bigint farm_group_id FK
    bigint region_id FK
    varchar code
    varchar name
    decimal area_ha
    enum irrigation_type "irigasi_teknis | tadah_hujan | lebak | lainnya"
    enum status "sehat | perhatian | kritis | tidak_aktif"
    varchar address
    date established_on
  }

  PLOT_BOUNDARIES {
    bigint plot_id PK,FK
    polygon boundary
    point centroid
    decimal measured_area_ha
    datetime mapped_at
  }

  PLOT_MANAGERS {
    bigint plot_id PK,FK
    bigint user_id PK,FK
    boolean is_primary
    date assigned_on
  }

  PLOT_HEALTH_SNAPSHOTS {
    bigint id PK
    bigint plot_id FK
    datetime recorded_at
    tinyint health_score
    decimal ndvi
    enum source "manual | satelit | model"
    varchar notes
  }
```

### Catatan desain

- **`plot_boundaries` terpisah dari `plots`** karena dua alasan: (1) MySQL mewajibkan kolom `SPATIAL INDEX` bersifat `NOT NULL`, sedangkan batas lahan sering belum dipetakan saat pendaftaran; (2) poligon hanya dibutuhkan halaman Peta, sehingga tabel `plots` tetap ringan untuk query daftar.
- **`plot_managers.is_primary`** menjawab kebutuhan UI yang menampilkan satu "Petani pengelola", tanpa membatasi satu petak hanya boleh satu petani. Dijaga oleh *generated column* + `UNIQUE` (lihat `03-normalisasi-dan-aturan.md`).
- **`plot_health_snapshots` menyimpan riwayat**, bukan satu kolom `health` di `plots`. Angka `94%` di UI adalah snapshot terbaru; tren kesehatan butuh seri waktu.
- **`plots.status`** (`sehat`/`perhatian`) adalah status operasional yang diubah manusia atau mesin, sedangkan `health_score` adalah hasil pengukuran. Keduanya sengaja tidak digabung: status bisa diturunkan dari skor, tetapi tidak selalu (mis. lahan sengaja diistirahatkan).
- **`measured_area_ha`** menyimpan hasil hitung `ST_Area` dari poligon. Bila berbeda dengan `plots.area_ha` (yang diisi manual), selisihnya bisa ditinjau — ini kasus nyata di lapangan.

---

## 5. Domain 4 — Budidaya

```mermaid
erDiagram
  PLOTS ||--o{ CULTIVATION_CYCLES : "menjalankan"
  COMMODITIES ||--o{ CULTIVATION_CYCLES : "komoditas"
  CROP_VARIETIES ||--o{ CULTIVATION_CYCLES : "varietas"
  CULTIVATION_CYCLES ||--o{ CYCLE_PHASE_HISTORY : "melewati fase"
  CULTIVATION_CYCLES ||--o{ ACTIVITIES : "mencatat"
  CULTIVATION_CYCLES ||--o{ HARVESTS : "menghasilkan"
  ACTIVITIES ||--o{ ACTIVITY_INPUTS : "memakai sarana"
  PLOTS ||--o{ ACTIVITIES : "berlangsung di"
  PLOTS ||--o{ TASKS : "terkait"
  USERS ||--o{ ACTIVITIES : "mencatat"

  CULTIVATION_CYCLES {
    bigint id PK
    bigint organization_id FK
    bigint plot_id FK
    bigint commodity_id FK
    bigint variety_id FK
    varchar season_label
    decimal planted_area_ha
    enum phase "persiapan | vegetatif | generatif | pematangan | panen | selesai"
    date started_on
    date expected_harvest_on
    date actual_harvest_on
    tinyint progress_pct
    enum status "aktif | selesai | gagal | dibatalkan"
  }

  CYCLE_PHASE_HISTORY {
    bigint id PK
    bigint cycle_id FK
    enum phase
    datetime started_at
    datetime ended_at
    bigint changed_by_id FK
    varchar note
  }

  ACTIVITIES {
    bigint id PK
    bigint organization_id FK
    bigint cycle_id FK
    bigint plot_id FK
    enum type "tanam | pemupukan | penyiangan | pengairan | penyemprotan | pemangkasan | panen | lainnya"
    enum status "direncanakan | berlangsung | selesai | dibatalkan"
    datetime scheduled_for
    datetime performed_at
    bigint performed_by_id FK
    decimal cost_total
    char client_event_id UK
    datetime client_timestamp
    enum source "web | mobile | sistem"
  }

  ACTIVITY_INPUTS {
    bigint id PK
    bigint activity_id FK
    enum input_type "pupuk | pestisida | benih | alat | tenaga_kerja | lainnya"
    varchar product_name
    decimal quantity
    enum unit "kg | liter | karung | orang_hari | unit"
    decimal unit_cost
    decimal total_cost
  }

  HARVESTS {
    bigint id PK
    bigint organization_id FK
    bigint cycle_id FK
    bigint plot_id FK
    date harvested_on
    decimal harvested_area_ha
    decimal yield_kg
    decimal productivity_kg_ha
    enum quality_grade "A | B | C | ditolak"
    decimal moisture_pct
    decimal price_per_kg
    varchar buyer_name
  }

  TASKS {
    bigint id PK
    bigint organization_id FK
    bigint plot_id FK
    bigint assignee_id FK
    varchar title
    datetime due_at
    datetime completed_at
    enum status "terbuka | selesai | dibatalkan"
  }
```

### Catatan desain

- **Fase ada di dua tempat dengan peran berbeda.** `cultivation_cycles.phase` adalah fase *saat ini* (dipakai papan kanban dan filter); `cycle_phase_history` adalah jejak perpindahan fase. Menyimpan hanya yang pertama akan menghilangkan riwayat; menyimpan hanya yang kedua membuat setiap query papan butuh subquery. Keduanya dijaga konsisten oleh aplikasi dalam satu transaksi.
- **`activities` menyimpan `organization_id`** meskipun bisa diturunkan dari `plot_id`. Ini denormalisasi yang disengaja agar setiap query tenant bisa memakai satu indeks berawalan `organization_id` tanpa join. Lihat justifikasinya di `03-normalisasi-dan-aturan.md` §7.1.
- **`client_event_id` unik** adalah kunci idempotensi untuk replay offline. Aktivitas yang dikirim ulang dari antrean mobile akan ditolak oleh `UNIQUE`, bukan menghasilkan duplikat.
- **`activity_inputs` menormalisasi bahan yang dipakai.** Satu aktivitas pemupukan bisa memakai urea dan NPK sekaligus — inilah alasan tabel anak, bukan kolom teks "jenis pupuk".
- **`harvests.productivity_kg_ha` adalah *generated column*** (`yield_kg / harvested_area_ha`), bukan input manual, sehingga tidak mungkin tidak sinkron dengan komponennya.
- **`harvests` menyimpan `plot_id` selain `cycle_id`** agar laporan per petak tetap jalan walaupun siklusnya nanti dihapus/diarsipkan. Konsistensi keduanya dijaga trigger atau validasi aplikasi (bukan `CHECK`, karena `CHECK` MySQL tidak bisa membaca tabel lain).
- **`activities.cycle_id` boleh `NULL`** untuk kegiatan yang belum terikat siklus (mis. perbaikan saluran air). Kolom `plot_id` tetap wajib.

---

## 6. Domain 5 — Analitik & Iklim

```mermaid
erDiagram
  CULTIVATION_CYCLES ||--o{ YIELD_PREDICTIONS : "diprediksi"
  YIELD_PREDICTIONS ||--o{ PREDICTION_FACTORS : "dijelaskan oleh"
  REGIONS ||--o{ WEATHER_OBSERVATIONS : "diukur"
  REGIONS ||--o{ WEATHER_FORECASTS : "diramalkan"
  REGIONS ||--o{ RISK_ALERTS : "diperingatkan"
  ORGANIZATIONS ||--o{ RISK_ALERTS : "menerima"
  PLOTS ||--o{ PLANT_OBSERVATIONS : "diperiksa"
  PLANT_OBSERVATIONS ||--o{ OBSERVATION_SYMPTOMS : "menunjukkan"
  SYMPTOMS ||--o{ OBSERVATION_SYMPTOMS : "terdeteksi"

  YIELD_PREDICTIONS {
    bigint id PK
    bigint organization_id FK
    bigint cycle_id FK
    date predicted_for
    decimal predicted_yield_kg
    decimal productivity_kg_ha
    decimal confidence_pct
    enum method "model | manual | musim_lalu"
    varchar model_version
    varchar recommendation
    datetime predicted_at
  }

  PREDICTION_FACTORS {
    bigint id PK
    bigint prediction_id FK
    enum factor "cuaca | kesehatan_tanaman | aktivitas | riwayat_panen | hama"
    decimal weight_pct
    varchar value_text
    enum impact "positif | negatif | netral"
  }

  WEATHER_OBSERVATIONS {
    bigint id PK
    bigint region_id FK
    datetime observed_at
    decimal temperature_c
    smallint humidity_pct
    decimal wind_kph
    decimal rainfall_mm
    enum condition
    varchar source
  }

  WEATHER_FORECASTS {
    bigint id PK
    bigint region_id FK
    date forecast_date
    datetime issued_at
    decimal temp_high_c
    decimal temp_low_c
    smallint rain_chance_pct
    enum condition
    varchar source
  }

  RISK_ALERTS {
    bigint id PK
    bigint organization_id FK
    bigint region_id FK
    enum type "hujan | kekeringan | hama | penyakit | banjir"
    enum severity "rendah | sedang | tinggi"
    varchar title
    text description
    datetime valid_from
    datetime valid_to
  }

  PLANT_OBSERVATIONS {
    bigint id PK
    bigint organization_id FK
    bigint plot_id FK
    bigint cycle_id FK
    bigint commodity_id FK
    bigint observed_by_id FK
    datetime observed_at
    varchar photo_path
    int photo_size_kb
    text notes
    enum status "baru | ditinjau | selesai"
  }

  OBSERVATION_SYMPTOMS {
    bigint observation_id PK,FK
    bigint symptom_id PK,FK
    enum severity "ringan | sedang | berat"
  }
```

### Catatan desain

- **`yield_predictions` banyak baris per siklus.** Dokumen lama memasang `UNIQUE` pada `planting_cycle_id`, sehingga prediksi baru menimpa yang lama dan riwayat evaluasi model hilang. Di sini setiap perhitungan adalah baris baru; UI mengambil yang terbaru lewat `ROW_NUMBER()`.
- **`prediction_factors` memecah `weather_snapshot JSONB`** dari dokumen lama menjadi baris terstruktur. Dengan begitu pertanyaan "faktor apa yang paling menurunkan prediksi bulan ini?" bisa dijawab SQL, bukan parsing JSON di aplikasi.
- **Cuaca diukur per `region_id`, bukan per petak.** Sesuai mitigasi risiko dokumen lama §7 (rate limit API): satu kecamatan punya banyak petak, cukup satu deret cuaca. Petak terhubung ke cuaca lewat `plots.region_id`.
- **`weather_forecasts` menyimpan `issued_at`.** Prakiraan yang sama untuk tanggal yang sama bisa direvisi; `UNIQUE (region_id, forecast_date, issued_at)` menyimpan revisinya sebagai riwayat.
- **`risk_alerts.organization_id` boleh `NULL`** untuk peringatan tingkat wilayah yang berlaku bagi semua organisasi di daerah itu.
- **`ENUM severity` sengaja berurutan `rendah → sedang → tinggi`** agar `MAX(severity)` mengembalikan tingkat paling berat sesuai urutan indeks ENUM, bukan urutan abjad.
- **Tidak ada tabel diagnosis.** Lihat Domain 2.

---

## 7. Domain 6 — Sosial & Tata Kelola

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ COMMUNITY_POSTS : "menaungi"
  USERS ||--o{ COMMUNITY_POSTS : "menulis"
  COMMUNITY_POSTS ||--o{ POST_COMMENTS : "ditanggapi"
  USERS ||--o{ POST_COMMENTS : "menanggapi"
  COMMUNITY_POSTS ||--o{ POST_LIKES : "disukai"
  USERS ||--o{ POST_LIKES : "menyukai"
  COMMUNITY_POSTS ||--o{ POST_TOPICS : "bertopik"
  TOPICS ||--o{ POST_TOPICS : "dikaitkan"
  USERS ||--o{ NOTIFICATIONS : "menerima"
  ORGANIZATIONS ||--o{ REPORTS : "menghasilkan"
  USERS ||--o{ AUDIT_LOGS : "melakukan"

  COMMUNITY_POSTS {
    bigint id PK
    bigint organization_id FK
    bigint author_id FK
    enum category "tanya_budidaya | berbagi_pengalaman | panen_pasar"
    varchar title
    text body
    varchar photo_path
    int like_count
    int comment_count
    enum status "terbit | disembunyikan | dihapus"
  }

  POST_COMMENTS {
    bigint id PK
    bigint post_id FK
    bigint author_id FK
    varchar body
  }

  POST_LIKES {
    bigint post_id PK,FK
    bigint user_id PK,FK
    datetime created_at
  }

  TOPICS {
    bigint id PK
    varchar label UK
    varchar slug UK
    varchar description
  }

  POST_TOPICS {
    bigint post_id PK,FK
    bigint topic_id PK,FK
  }

  NOTIFICATIONS {
    bigint id PK
    bigint organization_id FK
    bigint user_id FK
    enum type "cuaca | aktivitas | panen | undangan | sistem"
    varchar title
    varchar body
    varchar entity_type
    bigint entity_id
    datetime read_at
  }

  REPORTS {
    bigint id PK
    bigint organization_id FK
    enum type "hasil_panen | lahan | aktivitas | cuaca | prediksi"
    date period_start
    date period_end
    enum format "csv | xlsx | pdf"
    varchar file_path
    int row_count
    enum status "antre | proses | selesai | gagal"
    bigint requested_by_id FK
    datetime completed_at
  }

  AUDIT_LOGS {
    bigint id PK
    bigint organization_id FK
    bigint actor_id FK
    varchar action
    varchar entity_type
    bigint entity_id
    json changes
    varchar ip_address
    varchar user_agent
  }
```

### Catatan desain

- **`post_likes` memakai kunci komposit `(post_id, user_id)`**, bukan tabel dengan `id` sendiri. Ini menjamin secara struktural bahwa satu pengguna hanya bisa menyukai satu diskusi sekali — tidak perlu validasi aplikasi.
- **`like_count` dan `comment_count` adalah cache.** Sumber kebenaran tetap `COUNT(*)` pada tabel anak. Keduanya wajib diperbarui trigger; kalau tidak, angka di UI akan menyimpang. Justifikasi lengkap ada di dokumen 03 §7.2.
- **`community_posts.organization_id` boleh `NULL`** untuk diskusi lintas koperasi — sesuai teks UI "248 petani terhubung … dari berbagai wilayah".
- **`topics` dipisah dari `post_topics`** karena satu diskusi bisa punya beberapa topik, dan panel "Topik populer" menghitung jumlah diskusi per topik.
- **`reports` menyimpan riwayat ekspor**, bukan hanya tombol unduh. UI sudah menampilkan "Berkas terbaru" dan "Siap dibuka", yang butuh status dan path file.
- **`audit_logs.changes` bertipe `JSON`** karena bentuk perubahannya berbeda per entitas. Ini satu-satunya tempat JSON dipakai untuk data yang tidak di-query langsung — bukan alasan untuk mem-JSON-kan tabel lain.
- **`notifications.entity_type` + `entity_id`** adalah relasi polimorfik (bisa menunjuk ke siklus, petak, atau laporan). Tidak bisa diberi FK sungguhan; validitasnya dijaga aplikasi. Ini kompromi yang didokumentasikan, bukan kelalaian.

---

## 8. Domain 7 — Sinkronisasi & Data Resmi

```mermaid
erDiagram
  USERS ||--o{ SYNC_EVENTS : "mengirim"
  USER_DEVICES ||--o{ SYNC_EVENTS : "berasal dari"
  STATISTICAL_SOURCES ||--o{ STATISTICAL_VALUES : "menerbitkan"
  STATISTICAL_INDICATORS ||--o{ STATISTICAL_VALUES : "diukur oleh"
  REGIONS ||--o{ STATISTICAL_VALUES : "berlaku untuk"

  SYNC_EVENTS {
    bigint id PK
    bigint organization_id FK
    bigint user_id FK
    bigint device_id FK
    char idempotency_key UK
    varchar entity_type
    bigint entity_id
    enum operation "create | update | delete"
    json payload
    datetime client_timestamp
    datetime server_timestamp
    enum status "diterima | diproses | duplikat | gagal"
    varchar error_message
  }

  STATISTICAL_SOURCES {
    bigint id PK
    varchar publisher
    varchar title
    varchar document_no
    date published_on
    varchar url
  }

  STATISTICAL_INDICATORS {
    bigint id PK
    varchar code UK
    varchar name
    varchar unit
    enum category "produksi | luas_panen | produktivitas | sosial_ekonomi"
    tinyint decimals
  }

  STATISTICAL_VALUES {
    bigint id PK
    bigint indicator_id FK
    bigint region_id FK
    smallint period_year
    enum period_type "tahunan | semester | triwulan | bulanan"
    decimal value
    bigint source_id FK
    varchar note
  }
```

### Catatan desain

- **`idempotency_key` unik di tingkat tabel** (bukan hanya per batch) sehingga replay dari perangkat mana pun tetap ditolak bila event yang sama sudah pernah diproses. Ini implementasi langsung dari strategi dokumen lama §4.
- **`payload` menyimpan isi asli dari klien.** Kalau terjadi kegagalan pemetaan ke tabel tujuan, isinya masih bisa direplay manual tanpa meminta petani mengulang pencatatan.
- **`status='duplikat'` dicatat, bukan dibuang.** Tim ops bisa melihat berapa banyak pengiriman ulang terjadi — indikator kesehatan jaringan di lapangan.
- **`statistical_values` memakai `region_id` nullable**: `NULL` berarti angka nasional (mis. produksi padi Indonesia 53,14 juta ton), terisi berarti angka provinsi (mis. Jawa Timur 9,27 juta ton). Satu tabel melayani kedua tingkat.
- **`statistical_values` memakai `DECIMAL(18,4)`** agar angka BPS seperti 52,88 kuintal/ha dan 29,36 juta unit tidak kehilangan presisi.

---

## 9. Ringkasan Kardinalitas Penting

| Relasi | Kardinalitas | Konsekuensi implementasi |
| :--- | :--- | :--- |
| User ↔ Organisasi | banyak ke banyak | Tabel pivot `organization_members` + `UNIQUE(org, user)` |
| Organisasi → Petak | satu ke banyak | `organization_id` di `plots`, indeks komposit |
| Petak ↔ Petani | banyak ke banyak | `plot_managers` + aturan satu `is_primary` |
| Petak ↔ Siklus | satu ke banyak, tapi satu aktif | *Generated column* + `UNIQUE` |
| Siklus → Aktivitas | satu ke banyak | Indeks `(cycle_id, performed_at)` |
| Aktivitas → Sarana | satu ke banyak | `activity_inputs` (1NF) |
| Diskusi ↔ Penyuka | banyak ke banyak | PK komposit `(post_id, user_id)` |
| Wilayah → Cuaca | satu ke banyak | Indeks `(region_id, observed_at DESC)` |
| Organisasi → Statistik | tidak langsung | Statistik bersifat publik, tidak memiliki `organization_id` |

---

## 10. Geometri: Keputusan Spasial

| Aspek | Keputusan |
| :--- | :--- |
| Sistem referensi | `SRID 4326` (WGS 84), sesuai GPS ponsel petani |
| Penyimpanan | `POLYGON` untuk batas, `POINT` untuk titik pusat |
| Indeks | `SPATIAL INDEX` pada `boundary` dan `centroid` |
| Luas | `ST_Area(boundary)` mengembalikan **meter persegi** untuk SRS geografis (MySQL ≥ 8.0.13); bagi 10.000 untuk hektare, simpan di `measured_area_ha` |
| Titik pusat | `ST_Centroid()` **tidak didukung** untuk SRS geografis di MySQL 8.0; hitung lewat proyeksi UTM lalu `ST_Transform` kembali, atau hitung di aplikasi |
| Query viewport peta | Saring dengan `MBRContains` pada `centroid` (murah), lalu ambil `ST_AsGeoJSON(boundary)` hanya untuk petak yang lolos |
| Validasi | Tolak poligon yang memotong dirinya sendiri (`ST_IsValid`) sebelum `INSERT` |

### 10.1 Tiga jebakan spasial MySQL yang harus diingat saat DDL ditulis

1. **Satuan `ST_Area` adalah meter persegi, bukan derajat.** Dokumentasi MySQL 8.0 menyatakan bahwa poligon valid pada SRS geografis menghasilkan *geodetic area* dalam **m²**. Jadi 1 hektare = 10.000 m². Ini berbeda dari PostGIS, yang mengembalikan derajat persegi bila kolomnya bertipe `geometry` (bukan `geography`). Karena proyek ini berpindah dari PostgreSQL ke MySQL, kesalahan konversi justru mudah terjadi di sini.
2. **`ST_Centroid()` menolak SRS geografis.** MySQL melempar `ER_NOT_IMPLEMENTED_FOR_GEOGRAPHIC_SRS`. Karena itu `centroid` tidak boleh diisi lewat `ST_Centroid(boundary)` langsung. Pola yang aman: `ST_Transform(ST_Centroid(ST_Transform(boundary, 32751)), 4326)` untuk zona UTM 51S (Jawa Timur/Bali), atau hitung di aplikasi.
3. **Urutan sumbu `SRID 4326` adalah (lat, lon), sedangkan GeoJSON adalah (lon, lat).** MySQL menghormati definisi sumbu SRS, sehingga WKT/`ST_GeomFromText` untuk 4326 menerima `POINT(latitude longitude)`. Kalau klien Leaflet mengirim `[lat, lng]` lalu disimpan tanpa penyesuaian, petak akan muncul di lokasi yang salah. Standarkan konversi di satu tempat (adapter API), bukan tersebar di beberapa endpoint.
