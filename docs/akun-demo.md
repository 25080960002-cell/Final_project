# Akun demo (hanya untuk demo/penilaian)

Buat data demo (idempotent) setelah migrasi:

```bash
cd server && npm run seed-demo
```

Kata sandi semua akun: `DemoMapan2026` (ubah dengan `MAPAN_DEMO_PASSWORD` sebelum seed).
Seed diblokir di `NODE_ENV=production` kecuali `MAPAN_ALLOW_DEMO_SEED=true`.

| Peran | Email | Bisa | Tidak bisa |
| --- | --- | --- | --- |
| Administrator | admin@demo.mapan.id | Semua: organisasi, anggota, undangan, lahan, siklus, catatan | — |
| Manajer lapangan | manajer@demo.mapan.id | Tambah/ubah/hapus lahan, siklus, semua catatan | Undang/ubah anggota, pengaturan organisasi |
| Petani | petani@demo.mapan.id | Catat aktivitas, tugas, panen, scan, unggah foto | Tambah lahan, buat siklus, undang |
| Penyuluh | penyuluh@demo.mapan.id | Baca saja (akses baca diaktifkan admin) | Semua aksi tulis dan unggah |

Data demo: 1 organisasi (Gapoktan Tani Makmur DEMO, Kab. Semarang), 6 lahan berbatas peta
(padi, jagung, cabai, tomat, kopi), 6 siklus, 4 tugas, 4 aktivitas, skor kesehatan awal.
Seluruh isi fiktif.
