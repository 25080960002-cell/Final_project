# Panduan menjalankan MAPAN di komputer sendiri

Panduan ini untuk menjalankan aplikasi (frontend + backend + MySQL) tanpa bantuan siapa pun.
Semua perintah dijalankan dari folder proyek: `D:\ApsMobile_projek\MAPAN_1-revisi\MAPAN_1-main`.

## Ringkasan cepat (kalau semuanya sudah pernah di-setup)

Buka 2 jendela terminal:

| Terminal | Perintah | Fungsi |
| --- | --- | --- |
| 1 | `jalankan-mysql.bat` (klik dua kali) | MySQL |
| 2 | `npm run dev:all` | API + frontend |

Lalu buka **http://localhost:5173** (kalau port dipakai, Vite pindah ke 5174 — lihat output terminal).

---

## 1. Nyalakan MySQL

Database proyek **bukan** MySQL XAMPP. Datanya ada di instance portable:

- Server: `C:\Users\ASUS\mysql-mapan\mysql-8.4.3-winx64\bin\mysqld.exe`
- Data: `C:\Users\ASUS\mysql-mapan\data` (database `mapan`, `mapan_test`)
- Port: `3306`

**Penting:** port 3306 hanya bisa dipakai satu server. Kalau XAMPP menyala, matikan dulu:

1. Buka **XAMPP Control Panel** → klik **Stop** pada MySQL.
2. Klik dua kali `jalankan-mysql.bat` di folder proyek.
3. Biarkan jendela hitam itu **tetap terbuka** selama coding. Menutupnya = mematikan database.

Cek berhasil: jendela MySQL menampilkan `ready for connections`. Kalau langsung tertutup, baca bagian
Troubleshooting di bawah.

Cek juga server mana yang benar-benar memegang port 3306:

```powershell
Get-NetTCPConnection -LocalPort 3306 -State Listen |
  ForEach-Object { Get-Process -Id $_.OwningProcess } |
  Select-Object Id, Path
```

`Path` harus menunjuk ke `C:\Users\ASUS\mysql-mapan\...`. Kalau yang muncul `c:\software\xampp\...`, berarti
XAMPP MySQL yang jalan — matikan lewat XAMPP Control Panel.

## 2. Install dependensi (sekali saja, atau setelah `git pull`)

```powershell
npm run setup
```

## 3. Siapkan file environment

Salin kalau file belum ada:

```powershell
Copy-Item .env.example .env
Copy-Item server\.env.example server\.env
```

Isi `server/.env` yang dipakai:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mapan
DB_PASSWORD=<password ada di server/.env saat ini>
DB_NAME=mapan
PORT=4000
```

Jangan pernah commit `.env` (sudah masuk `.gitignore`).

## 4. Terapkan migrasi & data demo

```powershell
npm run db:status     # cek migrasi mana yang sudah masuk
npm run db:migrate    # terapkan yang belum (aman diulang)
cd server; npm run seed-demo; cd ..   # isi data demo + akun
```

`npm run db:status` yang sehat menampilkan `001`–`008` dan `seed/000_reference_catalog.sql`
sudah `applied`.

## 5. Jalankan aplikasi

**Cara A — satu terminal (paling gampang):**

```powershell
npm run dev:all
```

**Cara B — dua terminal (biar log terpisah):**

```powershell
# terminal 1
npm run dev:api     # API di http://127.0.0.1:4000

# terminal 2
npm run dev         # frontend di http://localhost:5173
```

Alamat yang dipakai:

| Layanan | URL | Cek cepat |
| --- | --- | --- |
| Frontend | http://localhost:5173 | halaman landing MAPAN |
| Backend | http://127.0.0.1:4000/api/health | `{"data":{"status":"ok","db":{"status":"up"}}}` |
| Login | http://localhost:5173/#masuk | form masuk |
| Dashboard | http://localhost:5173/#dashboard | setelah login |

Kalau terminal menulis `Port 5173 is in use, trying another one...`, buka port yang tertulis
(misal `http://localhost:5174`). Cookie sesi tetap jalan karena API-nya di port 4000.

## 6. Akun untuk login (hasil `seed-demo`)

Kata sandi semua akun: **`DemoMapan2026`**

| Peran | Email |
| --- | --- |
| Administrator | `admin@demo.mapan.id` |
| Manajer lapangan | `manajer@demo.mapan.id` |
| Petani | `petani@demo.mapan.id` |
| Penyuluh | `penyuluh@demo.mapan.id` |

Data ini fiktif dan hanya untuk demo. Ganti kata sandinya untuk pemakaian nyata:
`cd server; npm run set-password`.

## 7. Di mana melihat data pengguna

### a. Di aplikasi (paling ramah)

Login sebagai administrator, lalu di sidebar buka grup **ORGANISASI → Pengguna**.
Di situ ada daftar anggota, peran, status, dan undangan. Menu **Pengaturan** untuk identitas organisasi.

### b. phpMyAdmin (tampilan tabel)

1. Apache XAMPP harus menyala (XAMPP Control Panel → Start Apache).
2. Pastikan **MySQL XAMPP mati** dan MySQL proyek yang jalan (lihat langkah 1).
3. Buka http://localhost/phpmyadmin → login user `mapan` + password dari `server/.env`.
4. Pilih database `mapan`.

### c. Terminal MySQL (tanpa install apa pun)

```powershell
C:\Users\ASUS\mysql-mapan\mysql-8.4.3-winx64\bin\mysql.exe -u mapan -p mapan
```

Lalu query yang berguna:

```sql
SHOW TABLES;

-- daftar pengguna + peran di organisasi
SELECT u.id, u.full_name, u.email, u.status, om.role, om.organization_id
FROM users u
LEFT JOIN organization_members om ON om.user_id = u.id;

-- akun yang belum punya kata sandi
SELECT id, email FROM users WHERE password_hash IS NULL;

-- organisasi
SELECT id, name FROM organizations;

-- sesi login yang aktif
SELECT user_id, created_at, expires_at FROM user_sessions ORDER BY created_at DESC LIMIT 10;
```

Keluar dengan `exit`.

### d. Lewat API (untuk debugging)

```powershell
# login, simpan cookie
curl.exe -c cookie.txt -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@demo.mapan.id\",\"password\":\"DemoMapan2026\"}' `
  http://127.0.0.1:4000/api/auth/login

# daftar anggota organisasi 2
curl.exe -b cookie.txt http://127.0.0.1:4000/api/organizations/2/members
```

### e. Dump / arsip SQL

`db/mapan-full.sql` adalah dump lengkap; migrasi rinci ada di `db/migrations/`.

## 8. Mematikan

1. Terminal `npm run dev:all` → tekan `Ctrl + C`.
2. Jendela `jalankan-mysql.bat` → tekan `Ctrl + C` (atau tutup jendelanya).

## 9. Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| `Access denied for user 'mapan'` | Yang jalan MySQL XAMPP, bukan instance proyek | Stop MySQL XAMPP, jalankan `jalankan-mysql.bat` |
| Dashboard tampil "Data organisasi belum bisa dimuat / Terjadi kesalahan pada server", padahal login berhasil | XAMPP MySQL menyala belakangan dan merebut port 3306 (bisa terjadi walau MySQL proyek masih hidup) | Tutup MySQL XAMPP, matikan sisa `mysqld`, jalankan ulang `jalankan-mysql.bat` |
| `mysqld: Can't create/write ... /ibdata1` atau MySQL langsung mati | Port 3306 masih dipakai / ada mysqld lain | `Get-Process mysqld`, hentikan yang lama, coba lagi |
| `EADDRINUSE :4000` | API sudah jalan (mungkin dari sesi lain) | Matikan proses lama: `Get-NetTCPConnection -LocalPort 4000` lalu `Stop-Process -Id <PID>` |
| Frontend terbuka tapi data kosong / 401 | Belum login, atau cookie diblokir | Pastikan buka `http://localhost:5173`, bukan `127.0.0.1` campur, dan `VITE_API_BASE_URL=http://localhost:4000` |
| Halaman putih setelah `#dashboard` | Sesi kedaluwarsa | Logout / hapus cookie, login ulang |
| `Unknown database 'mapan'` | Database belum dimigrasi | `npm run db:migrate` |
| Login gagal padahal akun ada | Password belum di-set (`password_hash` NULL) | `cd server; npm run set-password` |

Cek cepat kesehatan sistem kapan pun:

```powershell
npm run db:status
npm run db:check
npm run check
```

## 10. Catatan pengembangan

- Jangan mengedit migrasi `001`–`007`; buat file baru `008+` yang idempotent.
- Prediksi panen saat ini **benchmark komoditas**, bukan AI/ML.
- Sebelum commit: `npm run check` dan `npm test` harus hijau.
- Detail deploy produksi: `docs/PANDUAN-DEPLOY.md`.
