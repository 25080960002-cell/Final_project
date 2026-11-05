# PLAN — Tugas Personal 1: Database (basemap: MAPAN)

**Dibuat:** 4 November 2026 · **Output tugas:** laporan PDF berisi analisis sistem, ERD,
CDM, PDM, SQL DDL/DML, uji query + bukti eksekusi.
**Folder kerja:** `docs/tugas/tugas-personal-1-database/`

---

## 1. Keputusan desain (kenapa begini)

| Keputusan | Alasan |
| --- | --- |
| Basis data tugas = subset pendidikan dari database MAPAN asli | Database asli 22 tabel (terlalu besar utk tugas); tugas menyaratkan **min. 5 tabel berelasi** — subset 6 tabel memenuhi & tetap konsisten dengan proyek utama |
| Database terpisah: `mapan_tugas1` | Jangan menyentuh `mapan` (database aplikasi); skrip idempotent (DROP IF EXISTS) jalan ulang aman |
| 6 tabel: `commodities`, `users`, `organizations`, `organization_members`, `plots`, `organization_records` | Mencakup master data, N:N anggota, pengelolaan lahan, catatan operasional — mewakili inti MAPAN |
| Data simulasi ≥5 baris/tabel | 6 komoditas · 6 pengguna · 5 organisasi · 8 anggota · 6 lahan · 7 catatan (+1 baris utk demo DELETE) |
| Transkrip CLI (`--comments -t -vvv`) sebagai bukti eksekusi | Menjadi pengganti screenshot di laporan; mahasiswa tetap disuruh screenshot konsol sendiri untuk laporan final |

## 2. Alur pengerjaan (sudah dieksekusi)

| Langkah | Isi | Status |
| --- | --- | --- |
| 1. Analisis sistem | Latar belakang, tujuan, kebutuhan data MAPAN (subset) | ✅ masuk laporan §1 |
| 2. ERD | Entitas, atribut, PK, relasi + diagram teks/CSS | ✅ laporan §2 |
| 3. CDM & PDM | Konseptual (entitas-relasi) vs fisik (tipe MySQL, constraint, FK) | ✅ laporan §3 |
| 4. DDL | `CREATE DATABASE mapan_tugas1` + 6 `CREATE TABLE` berkunci asing, InnoDB utf8mb4 | ✅ tereksekusi nyata |
| 5. DML | INSERT massal + 2 UPDATE (perbaikan status lahan & progres tugas) + INSERT lalu DELETE (demo manipulasi) | ✅ tereksekusi nyata |
| 6. Uji query | Q1 tampil (JOIN) · Q2 ganti 3 tabel · Q3 filter (WHERE) · Q4 rekap (GROUP BY + COUNT/SUM/AVG) — 8 query | ✅ 8 result set |

## 3. Bukti eksekusi nyata

- Skrip: `docs/tugas/tugas-personal-1-database/mapan-tugas1.sql`
- Transkrip: `docs/tugas/tugas-personal-1-database/hasil-eksekusi.txt` — **exit 0, tanpa ERROR**, 14 result set.
- Database: MySQL 8.4.3 lokal (`127.0.0.1:3306`), user aplikasi `mapan` (diberi hak pada `mapan_tugas1` lewat root).
- Perbaikan saat eksekusi: hash bcrypt palsu sempat melebihi `CHAR(60)` → dikoreksi persis 60 karakter, rerun sukses.

## 4. Masalah yang pernah muncul (untuk dokumentasi)

1. PowerShell tidak mendukung `< file` (redirect input) → pakai pipeline `Get-Content | mysql`.
2. `mysql` membaca `-h127.0.0.1` sebagai host `127` bila tak dikutip → argumen dikutip penuh `--host=...`.
3. User `mapan` tidak punya hak CREATE database → grant lewat root (root lokal password kosong — catatan keamanan: sebaiknya password root diset).
4. Hash palsu 67 karakter gagal `CHAR(60)` → dikoreksi 60 karakter.

## 5. Sisa kerja mahasiswa (sebelum kumpul)

- Screenshot sendiri hasil CLI: buka `docs/tugas/tugas-personal-1-database/hasil-eksekusi.txt`
  sambil jalankan ulang skrip (`mysql -u mapan -p < mapan-tugas1.sql`) lalu screenshot per nomor query;
  tempel di laporan §6 slot tangkap layar.
- Identitas (`ISI-Oleh-Mahasiswa`) di cover.
- Regenerasi PDF: `npm run html:pdf -- docs\tugas\tugas-personal-1-database\laporan-tugas-personal-1-database.html`
