# Hasil Pengujian API (otomatis)

Dihasilkan oleh `npm --prefix server run test:report` pada **2026-10-29 05:25 UTC**
(Node v22.22.2, database uji terpisah `mapan_test`, MySQL 8).

**Ringkasan: 31/31 skenario lulus.**

| Kode | Skenario dan hasil yang diharapkan | Hasil aktual | Durasi |
| --- | --- | --- | --- |
| T01 | GET /api/health -> 200 dan database tersambung | ✅ LULUS | 119 ms |
| T02 | endpoint tidak ada: anonim -> 401 (tidak membocorkan rute), login -> 404 berformat error | ✅ LULUS | 172 ms |
| T03 | register valid -> 201, cookie sesi dibuat, peran administrator | ✅ LULUS | 71 ms |
| T04 | session setelah register -> pengguna terbaca | ✅ LULUS | 6 ms |
| T05 | register email ganda -> 409 | ✅ LULUS | 85 ms |
| T06 | register kata sandi lemah / email salah / wilayah kosong -> 400 | ✅ LULUS | 46 ms |
| T07 | login sandi salah -> 401 tanpa cookie | ✅ LULUS | 65 ms |
| T08 | login valid -> 200 dan cookie sesi | ✅ LULUS | 67 ms |
| T09 | akses API tanpa sesi -> 401 | ✅ LULUS | 4 ms |
| T10 | logout mencabut sesi: token lama yang dipakai ulang -> 401 | ✅ LULUS | 90 ms |
| T11 | ubah nama profil | ✅ LULUS | 10 ms |
| T12 | ganti sandi: salah -> 401; lemah -> 400; valid -> 200 dan sandi baru berlaku | ✅ LULUS | 324 ms |
| T13 | buat lahan -> 201 dan muncul di daftar | ✅ LULUS | 49 ms |
| T14 | validasi lahan: nama kosong / luas <= 0 -> 400 | ✅ LULUS | 14 ms |
| T15 | ubah lahan -> data konsisten; validasi ubah | ✅ LULUS | 23 ms |
| T15b | siklus otomatis dari lahan tertaut ke petak dan terhitung di ringkasan fase | ✅ LULUS | 16 ms |
| T16 | KPI dashboard menghitung lahan | ✅ LULUS | 8 ms |
| T17 | organisasi B tidak bisa membaca/mengubah/menghapus data organisasi A | ✅ LULUS | 81 ms |
| T18 | undang petani -> terima undangan -> setujui admin -> login | ✅ LULUS | 138 ms |
| T19 | petani DITOLAK (403) membuat/ubah/hapus lahan dan mengundang | ✅ LULUS | 18 ms |
| T20 | petani BOLEH mencatat aktivitas dan membacanya kembali | ✅ LULUS | 18 ms |
| T21 | petani DITOLAK (403) membuat siklus tanam (hanya admin/manajer) | ✅ LULUS | 12 ms |
| T22 | jenis catatan tidak dikenal -> 400 | ✅ LULUS | 6 ms |
| T23 | unggah berkas >10 MB ditolak (413/400) | ✅ LULUS | 82 ms |
| T24 | unggah berkas palsu (isi bukan gambar) ditolak 400 | ✅ LULUS | 7 ms |
| T25 | unggah gambar valid -> 201 lalu bisa diunduh | ✅ LULUS | 18 ms |
| T26 | cuaca tanpa koordinat wilayah -> pesan error ramah (bukan 500) | ✅ LULUS | 64 ms |
| T27 | endpoint prediksi merespons tanpa error server | ✅ LULUS | 9 ms |
| T28 | hapus lahan -> hilang dari daftar, 404 bila dihapus lagi | ✅ LULUS | 14 ms |
| T29 | login: 8 percobaan salah lalu diblokir 429 (brute-force) | ✅ LULUS | 33 ms |
| T31 | seed demo: 4 akun (admin/manajer/petani/penyuluh) bisa masuk dengan hak akses sesuai peran | ✅ LULUS | 745 ms |

Catatan: kolom "Skenario" memuat langkah dan status HTTP yang diharapkan; tiap baris adalah
satu `it(...)` di `server/test/api.test.js` yang menjalankan permintaan HTTP sungguhan ke API.
