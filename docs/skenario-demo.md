# Naskah demo video (5–8 menit)

Persiapan: `npm run setup`, MySQL hidup, `npm run db:migrate`, `cd server && npm run seed-demo`,
lalu `npm run dev:all`. Buka `http://localhost:5173`. Siapkan koneksi internet (cuaca Open-Meteo).

| Menit | Adegan | Yang ditunjukkan / diucapkan |
| --- | --- | --- |
| 0:00 | Landing | Masalah dan tujuan MAPAN; tombol *Buat akun organisasi*, *Masuk*, *Lihat demo* |
| 0:40 | `#demo` | Dashboard demo berlabel **data contoh**: tidak tersimpan, tanpa akun |
| 1:10 | `#daftar` | Pendaftaran mandiri: validasi kata sandi, pilih kota (koordinat cuaca otomatis), persetujuan data |
| 2:00 | Akun baru | Ringkasan kosong dengan kartu *Langkah awal* → tambah lahan pertama (bisa memilih diri sendiri sebagai pengelola) |
| 2:50 | Lahan | Lihat detail → **Ubah data** → **Hapus lahan**; ekspor CSV |
| 3:30 | Login `admin@demo.mapan.id` | KPI dari database, peta batas lahan, siklus per fase, estimasi panen (label *benchmark, bukan AI*) |
| 4:30 | Cuaca | Prakiraan 5 hari dan level risiko dari koordinat wilayah |
| 5:00 | Aktivitas & scan | Catat aktivitas, simpan foto + gejala (tanpa diagnosis otomatis, dijelaskan jujur) |
| 5:40 | Hak akses | Login `petani@…`: tombol Tambah lahan nonaktif/ditolak. Login `penyuluh@…`: hanya baca |
| 6:30 | Keamanan akun | Pengaturan → Akun saya → ganti kata sandi (sesi lain keluar) |
| 7:00 | Pengujian | Tampilkan terminal `npm test` hijau dan `docs/hasil-pengujian-api.md` |
| 7:40 | Penutup | Batasan & rencana lanjutan: diagnosis foto, editor GIS, email verifikasi, mobile offline |
