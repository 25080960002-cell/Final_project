# Catatan revisi besar (tahap akhir)

Ringkasan jujur: apa yang diubah, bagaimana dibuktikan, dan apa yang BELUM dibuktikan.

## Perubahan utama
**Alur pengguna publik**
- Pendaftaran mandiri (`POST /api/auth/register`, form di `#daftar`): akun + organisasi baru, otomatis administrator,
  validasi kata sandi (min. 10, huruf+angka), pilih kota untuk koordinat cuaca, persetujuan penyimpanan data.
- `#dashboard` wajib login; demo dipisah ke `#demo` dan berlabel *data contoh*. Pengguna asli tidak pernah melihat data contoh.
- Kartu *Langkah awal* untuk akun baru; empty state "Belum ada lahan" dengan aksi.
- Landing: CTA utama *Buat akun organisasi*; demo tetap tersedia sebagai opsi sekunder.

**Fitur**
- Ubah dan hapus lahan (`PATCH/DELETE /plots/:id`) dari modal detail; filter status Kritis.
- Akun saya: ubah nama, ganti kata sandi (mencabut sesi lain).
- Seed demo + 1 akun per peran (`docs/akun-demo.md`), naskah demo (`docs/skenario-demo.md`).

**Bug yang ditemukan dan diperbaiki**
1. Admin organisasi baru tidak bisa menambah lahan: dropdown *Petani pengelola* tidak memuat Administrator.
2. Siklus otomatis dari tambah-lahan tidak mengisi `plot_id/phase/progress/author` (grafik fase kosong). Perbaikan + migrasi 008 backfill.
3. Unggah foto tidak membatasi peran (penyuluh read-only bisa mengunggah). Kini 403.
4. Batas login 8 gagal/IP mengunci semua pengguna di jaringan bersama. Kini per-email 8, per-IP 40.
5. Halaman Peta rusak sesaat karena kesalahan penggantian kode; tertangkap oleh smoke test dan diperbaiki.

**Keamanan**: pembatas laju (login, pendaftaran, ganti sandi, global 900/5 menit per IP), kebijakan kata sandi,
validasi koordinat, query berparameter, isolasi tenant diuji.

## Bukti (dari run nyata)
| Lapisan | Perintah | Hasil |
| --- | --- | --- |
| API integrasi (MySQL 8, DB uji terpisah) | `npm --prefix server run test:report` | 31/31 lulus → `docs/hasil-pengujian-api.md` |
| Unit klien | `npm run test:web` | 5/5 lulus |
| Smoke render (Vite SSR, 33 halaman/mode) | `npm run test:smoke` | 33/33 lulus |
| Build + sintaks | `npm run check` | lulus |

## Belum dibuktikan (jujur)
- **Tampilan di browser sungguhan belum diuji** (sandbox tanpa browser). Smoke render hanya menjamin tidak ada error saat
  render awal; interaksi (klik, form, modal) perlu dicoba manual sebelum rekaman demo. Coba dulu skenario di `docs/skenario-demo.md`.
- Cuaca (Open-Meteo) tidak bisa diuji di sandbox (jaringan dibatasi); di API tampil pesan 503 ramah. Uji di komputer Anda.
- Deploy produksi (Vercel/Railway/VPS) belum diverifikasi live.
- Belum ada email verifikasi / reset kata sandi; pemulihan lewat `npm run set-password`.
- Uji E2E browser (Playwright) belum dibuat.

## Sisa pekerjaan sebelum kumpul
1. Jalankan lokal, klik seluruh skenario demo, catat bug UI yang muncul.
2. Deploy (docs/PANDUAN-DEPLOY.md) dan uji login end-to-end di domain produksi.
3. Rekam demo YouTube; tulis laporan PDF (struktur di `plan.md` §7) memakai `docs/hasil-pengujian-api.md`.
4. Jelaskan di laporan: prediksi = benchmark (bukan AI), dan daftar keterbatasan di atas.
