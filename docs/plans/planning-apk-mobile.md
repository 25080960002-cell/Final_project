# PLAN — APLIKASI MAPAN Versi Mobile (APK Android)

**Proyek:** APLIKASI MAPAN (Manajemen & Analisis Prediksi Agri Nusantara)
**Tahap:** Ekspansi web app → aplikasi mobile Android (APK)
**Tanggal dokumen:** 4 November 2026
**Keputusan utama:** aplikasi mobile dibangun **baru dengan React Native (Expo)**,
bukan bungkusan web. Backend Express + MySQL yang sudah jadi dipertahankan dan
dipakai ulang — hanya ada penyesuaian kecil di API.
**Arsip plan sebelumnya (revisi web tahap akhir):** `docs/plans/aplikasi-mapan-revisi-tahap-akhir.md`
**Referensi rancangan induk:** `docs/plans/aplikasi-mapan-v1.md`

---

## 1. Ringkasan & Ruang Lingkup

MAPAN versi mobile ditujukan untuk pengguna lapangan (petani, manajer lapangan,
penyuluh) yang bekerja di wilayah sinyal lemah. Web app yang sudah berjalan tetap
menjadi panel untuk Administrator/Manajer; aplikasi mobile membawa fitur-fitur
yang paling dibutuhkan di lapangan, dengan **offline-first** sebagai prinsip inti
(sesuai rancangan induk v1 yang semula tertunda).

### 1.1 Nilai utama versi mobile
1. **Pencatatan tanpa sinyal** — catatan operasional disimpan lokal (SQLite), otomatis sinkron saat online (outbox + idempotency; kolom `client_event_id` sudah tersedia di skema).
2. **Alur harian cepat** — buka APK → dashboard ringkas → catat aktivitas/tugas/panen dalam ≤3 tap.
3. **Foto & lokasi nyata** — kamera (kompresi <300 KB) koordinat GPS per catatan.
4. **Cuaca & informasi siklus** — dari layanan Open-Meteo yang sudah ada di backend.

### 1.2 In-scope (APK v1)
- Masuk dengan email + sandi (akun sama dengan web); penerimaan undangan organisasi.
- Dashboard ringkas per organisasi (KPI dari API nyata, bukan data demo).
- Daftar petak & siklus tanam (baca), catatan operasional (buat/lihat/ubah status).
- Catatan aktivitas/tugas/panen/scan — **tulis offline, kirim belakangan**.
- Foto gejala tanaman (upload via endpoint media yang ada; diagnosis otomatis **tidak diklaim** — dicatat sebagai future work).
- Cuaca harian per region.
- Prediksi hasil — **benchmark komoditas** (bukan AI/ML), ditampilkan dengan label sumber yang jujur.
- Notifikasi dalam-aplikasi untuk catatan tertunda yang gagal/bisa dikirim.
- Multi-tenant & hak akses tetap ditegakkan di **server** (mobile tidak pernah memercayai data lokal untuk otorisasi).

### 1.3 Out-of-scope (APK v1 — dicatat di laporan sebagai future work)
- Editor GIS menggambar batas petak di ponsel (web hanya menampilkan GeoJSON; mobile menampilkan peta baca-saja).
- Diagnosis penyakit otomatis dari foto scan.
- Push notification FCM (persiapan disiapkan, pemasangan di fase berikutnya).
- Versi iOS (Expo mendukung, tapi build & pengujian target v1 = Android APK).
- Sinkronisasi konflik tingkat lanjut (merge dua arah, editing offline struktur petak).

---

## 2. Arsitektur & Teknologi

```
+------------------------------------------------------------+
|                     PERANGKAT ANDROID                      |
|  +------------------------------------------------------+  |
|  | Aplikasi MAPAN (Expo / React Native)                 |  |
|  | - expo-router (navigasi stack+tabs)                  |  |
|  | - UI mobile-native (React Native, warna/token MAPAN) |  |
|  | - SQLite lokal (expo-sqlite): cache baca + outbox    |  |
|  | - Kamera & lokasi (expo-camera, expo-location)       |  |
|  +---------------------------+--------------------------+  |
+------------------------------|-----------------------------+
                               | HTTPS REST /api (sama dgn web)
+------------------------------v-----------------------------+
| Backend Express 5 (existing, server/)                      |
| - Auth sesi + mode token utk client mobile                 |
| - Multi-tenant (organization_id) & peran                   |
| - records / plots / media / cuaca / prediksi benchmark     |
| - Endpoint sync replay (idempotency client_event_id)       |
+------------------------------+-----------------------------+
                               |
                        MySQL 8 (existing, 22 tabel)
```

| Komponen | Teknologi | Peran |
| --- | --- | --- |
| Aplikasi mobile | React Native 0.76+ via **Expo SDK 52+**, expo-router | Klien Android, navigasi & UI |
| Bahasa | TypeScript | Konsisten & aman tipe |
| Data lokal | expo-sqlite (+ WatermelonDB tidak perlu — skema sederhana) | Cache baca + antrean tulis (outbox) |
| Sensor | expo-camera, expo-location, expo-image-picker | Foto terkompresi + koordinat |
| Grafik | victory-native / react-native-gifted-charts | KPI & tren (pengganti Recharts) |
| Maps | react-native-maps (Google Play Services) | Tampilan GeoJSON petak baca-saja |
| State server | TanStack Query + MMKV | Cache, retry, optimistis UI |
| Backend/API | Express 5 **tanpa penulisan ulang** | Sumber data tunggal |
| CI/Build mobile | EAS Build (APK profil `preview`) | Produksi file APK |

**Struktur repo baru:**

```
/            → web app React (existing, tidak diubah ulang)
server/      → API Express (existing + tambahan kecil, lihat §3)
mobile/      → BARU — aplikasi Expo (tipe, lint, test sendiri)
docs/plans/  → rencana (arsip plan web + plan induk v1)
```

---

## 3. Penyesuaian Backend (Tetap Minimal)

Prinsip: API yang sudah lulus pengujian **tidak boleh dirombak**. Tiga penambahan kecil:

1. **Mode token autentikasi untuk mobile** — cookie HttpOnly tidak nyaman dipakai
   fetch di React Native. Tambah route `POST /api/auth/token` (+refresh/logout)
   yang mengeluarkan token opak, disimpan **hash di tabel sesi yang sama**.
   Middleware menerima `Authorization: Bearer <token>`. Semua aturan peran &
   isolasi tenant tidak berubah.
2. **Endpoint sinkronisasi outbox** — `POST /api/sync/replay` menerima batch
   catatan offline dengan `client_event_id`; kunci unik membuat pengiriman ulang
   aman (idempotent). Respons per item: `accept | duplicate | reject(reason)`.
3. **Aturan konflik sederhana & deterministik** — catatan lapangan selalu
   append-only (tidak diedit offline); struktur (petak/siklus) hanya boleh
   diubah saat online. Ini menghindarkan konflik merge yang rumit di v1.

Semua perubahan ini **diuji otomatis** dan dokumentasinya menambah pengujian-API (`docs/hasil-pengujian-api.md`).

---

## 4. Rancangan Aplikasi Mobile

### 4.1 Navigasi & layar

```
Root
├── (auth)          Masuk · Daftar/undangan
└── (app) Tabs
    ├── Beranda     KPI ringkas, cuaca, catatan tertunda (badge sinkron)
    ├── Petak       daftar → detail petak (peta baca-saja, siklus aktif)
    ├── Catat       tombol besar per jenis catatan (form offline-aman)
    ├── Riwayat     daftar catatan milik saya + status sinkron
    └── Profil      identitas, organisasi, sandi, keluar
```

- Layar mengikuti **token desain MAPAN** (`design-system/mapan/MASTER.md`): warna,
  tipografi, radius di-ekspor ke `mobile/src/theme/*` agar konsisten dengan web.
- Konvensi UX mobile: target sentuh ≥44 pt, bottom tab, form pendek, nomor
  pakai keypad numerik, foto wajib terkompresi.

### 4.2 Mesin offline (jantung aplikasi)

1. **Baca:** halaman mengambil dari SQLite bila ada; refresh dari server saat online (TanStack Query).
2. **Tulis:** setiap catatan baru masuk tabel `outbox` lokal, `client_event_id` UUID dibuat perangkat, dengan `client_timestamp` & payload.
3. **Kirim:** listener `NetInfo` — saat online, antrean dikirim berurutan ke `POST /api/sync/replay`; item gagal menyimpan alasan, antre tampil berlabel "Menunggu sinkron" di Riwayat & badge Beranda.
4. **Foto:** lampiran disimpan ke penyimpanan aplikasi; setelah catatan induk tersinkron, foto dikirim ke endpoint media yang sudah ada (multipart), lalu URL-nya dilampirkan server-side.

Kolom `sync_events`, `client_event_id` dan tabel media yang sudah ada di MySQL
dipakai apa adanya — terbukti disiapkan semenjak rancangan induk.

### 4.3 Hak akses di aplikasi

Menu/tab yang tampil ditentukan peran dari API (server tetap sumbu kebenaran):

| Peran | Mobile dapat |
| --- | --- |
| Administrator | Semua baca + kelola anggota (versi ringkas), catatan semua |
| Manajer lapangan | Petak/siklus + semua catatan operasional |
| Petani | Catatan operasional miliknya (aktivitas, tugas, panen, scan) |
| Penyuluh | Baca saja (mengikuti pengaturan organisasi) |

---

## 5. Tahapan Pengerjaan (Roadmap)

> Estimasi untuk 1–2 developer berbantuan AI. Tiap fase punya syarat lulus; tidak
> melewati fase sebelum definisi "selesai" terpenuhi.

### Fase 0 — Persiapan (½ hari)
- [ ] Scaffold `mobile/` Expo TypeScript (`npx create-expo-app`), expo-router, lint.
- [ ] Profil EAS Build `preview` → **satu APK terpasang di perangkat** (membuktikan jalur build hidup sejak hari pertama).
- [ ] Token desain dari `design-system/mapan/MASTER.md` di-ekspor ke tema mobile.
- ✅ Lulus jika: APK pertama terinstall & menampilkan layar kosong tema MAPAN.

### Fase 1 — Fondasi API + Auth (2–3 hari)
- [ ] Backend: `POST /api/auth/token` (+refresh/logout), tesis Bearer di middleware.
- [ ] Mobile: layar Masuk/Undangan, simpan token di SecureStore.
- ✅ Lulus jika: login dari APK sukses per 3 peran; 401/403 terjawab rapi.

### Fase 2 — Baca data online (3–4 hari)
- [ ] Beranda KPI, daftar Petak/Siklus, Cuaca — data dari API nyata.
- [ ] Cache SQLite baca-saja; offline menampilkan data terakhir + keterangan waktu.
- ✅ Lulus jika: semua data berasal dari API teruji; mode pesawat masih menampilkan data terakhir (bukan layar putih).

### Fase 3 — Tulis + mesin offline (4–6 hari) — **inti revisi**
- [ ] Backend: `POST /api/sync/replay` idempotent + pengujian.
- [ ] Mobile: form Catat (aktivitas/tugas/panen/scan) → simpan lokal → sinkron.
- [ ] Foto + GPS: kompresi <300 KB, terkirim setelah induk tersinkron.
- [ ] Status sinkron (badge, riwayat) + penangg gagal yang jelas.
- ✅ Lulus jika: catat penuh di mode pesawat → nyalakan internet → seluruh antrean terkirim, tanpa duplikat walau dikirim ulang 2×.

### Fase 4 — Rapikan pengalaman mobile (2–3 hari)
- [ ] Peta baca-saja GeoJSON, grafik KPI, tema terang/gelap, i18n ringan.
- [ ] Pengujian pada ponsel kelas bawah (RAM ≤3 GB) — Gingerbread-case §7.
- ✅ Lulus jika: waktu buka <3 detik di ponsel uji; tidak ada crash pada `adb logcat` selama sesi demo.

### Fase 5 — Pengujian & pengemasan (2–3 hari)
- [ ] Unit test mobile (logika form & outbox) + uji API baru dijalankan bersama CI.
- [ ] Uji manual terpandu §6 → tabel hasil; catat tambahan ke `docs/CATATAN-REVISI.md`.
- [ ] **APK rilis:** EAS Build `production` (APK), tanda tangan konfigurasi sederhana, nomor versi `1.0.0`.
- ✅ Lulus jika: APK terinstall bersih di ponsel lain tanpa server setelan tambahan (dengan konfig URL produksi), semua lulus.

---

## 6. Rencana Pengujian

| No | Pengujian | Langkah | Hasil yang diharapkan |
| --- | --- | --- | --- |
| 1 | Login di APK | Email+sandi benar | Masuk ke tab Beranda, KPI tampil |
| 2 | Login salah | Sandi salah | Pesan kesalahan ramah, tidak crash |
| 3 | Undangan | Buka tautan undangan | Bergabung organisasi, peran sesuai |
| 4 | Isolasi tenant | Token org A membuka data org B | 403/404, tanpa kebocoran data |
| 5 | Hak akses | Petani mencoba menu admin | Menu tak tampil; panggil API langsung → 403 |
| 6 | Catat offline | Mode pesawat → isi catatan | Tersimpan lokal, berlabel "Menunggu sinkron" |
| 7 | Sinkron online | Mode pesawat mati | Antrean terkirim, badge hilang, data tampil di web |
| 8 | Kirim ulang | Dekatkan online saat setengah terkirim | Tanpa duplikat (idempotency `client_event_id`) |
| 9 | Foto >batas | Unggah foto 2 MB | Terkompresi <300 KB, sukses terkirim |
| 10 | Media >10 MB (server) | Paksa kirim berkas besar | 413/400 ditolak (tesis existing tetap) |
| 11 | Cuaca | Region tanpa koordinat | Pesan kesalahan ramah |
| 12 | Prediksi | Buka layar prediksi | Angka benchmark + label sumber jujur |
| 13 | Sesi berakhir | Logout → cek data | Data dilokal dibersihkan sesuai pengaturan, API menolak |

Hasil aktual untuk tiap baris akan dilengkapi dan dilampirkan ke dokumen hasil pengujian.

---

## 7. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Ponsel kelas bawah lambat | Demo & penggunaan nyata tersendat | Hindari animasi berat, gambar di-cache image rendah, uji di perangkat ≤3 GB RAM |
| Konflik sinkron offline lama | Data tidak konsisten | Catatan append-only; struktur hanya online; konflik diremakan 2-kolom `client_timestamp` vs `created_at` (server menang) |
| Kuota data & sinyal 2G/3G | Gagal unggah, boros paket | Kompresi foto <300 KB, batch kecil, jadwal unggah saat Wi-Fi bila pengguna setuju |
| Perubahan API mematahkan web | Regresi di klien lama | Perubahan backend serba-additive; `npm run check` + `npm test` wajib hijau tiap commit |
| Bendungan versi OS/paket Expo | Merusak build di akhir proyek | Fase 0 membuktikan EAS Build; versi paket dikunci (lockfile + commit `eas.json`) |
| Klaim berlebihan "AI" | Tingkat kejujuran & nilai akademik | Prediksi tetap diberi label benchmark komoditas, BUKAN AI/ML (aturan kerja AGENTS.md #1) |

---

## 8. Kesesuaian dengan Tugas / Laporan

Rencana web sudah menetapkan deliverable (source code, database, dokumentasi &
hasil pengujian PDF, demo YouTube) — versi mobile **menambah** cara tampil itu:

- **Dokumentasi** menambah bab: arsitektur mobile, mesin offline, keputusan teknis
  (kenapa Expo, kenapa token, kenapa append-only) — mengikuti semangat §5 plan lama.
- **Hasil pengujian** menambah tabel §6 di atas ke laporan.
- **Demo YouTube** menyertakan adegan unggulan versi mobile: **catat tanpa sinyal → sinkron → data tampil di web**.
- Data demo (bila dipakai untuk video) **berlabel jelas**, sesuai aturan kerja proyek.

---

## 9. Definition of Done (APK v1)

- [ ] APK Android rilis terinstall di ≥2 perangkat nyata & sambung-balik ke API produksi/demo.
- [ ] Masuk/undangan berjalan; multi-tenant & peran diuji dari APK (tabel §6 lulus).
- [ ] Pencatatan tanpa sinyal → sinkron otomatis terbukti di demo video (0 duplikat).
- [ ] Foto + GPS tersambung ke catatan, ukuran terkirim terkendali.
- [ ] Backend tetap lulus `npm run check` + `npm test` (tesis lama tidak menurun; tesis baru 100% lulus).
- [ ] Semua data demo berlabel; prediksi diberi label benchmark, tanpa klaim AI/ML.
- [ ] Dokumentasi & laporan diperbarui: arsitektur, pengujian mobile, catatan penyimpangan dari plan lama.
- [ ] `docs/CATATAN-REVISI.md` mencatat status progres tiap fase.
