# MAPAN

Aplikasi web MAPAN untuk menampilkan informasi dan alur pengelolaan petani dari berbagai komoditas, termasuk tanaman pangan, hortikultura, dan perkebunan. Proyek ini menggunakan React dan Vite.

## Menjalankan proyek

Frontend (terminal 1):

```bash
npm install
npm run dev
```

API + database (terminal 2) — MySQL harus hidup lebih dulu:

```bat
server\JALANKAN-API.bat
```

Jalankan migrasi database sampai 006. Alamat utama membuka landing page. Tombol
**Masuk ke Dashboard** meminta sesi MAPAN yang sah untuk memuat data organisasi.
Tautan **Lihat demo** atau `/#dashboard` membuka dashboard contoh tanpa akses tulis.
Anggota membuat akun melalui undangan organisasi; Clerk tidak digunakan.

Atau jalankan MySQL, API, dan frontend sekaligus dengan `C:\Users\ASUS\mysql-local\MULAI.bat`.
Dashboard membaca data dari `http://localhost:4000`; alamat lain bisa diatur lewat
`.env` (contoh di [`.env.example`](.env.example)):

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_ORGANIZATION_ID=1
```

Route `#masuk` membuka formulir masuk MAPAN, `#daftar` menjelaskan pendaftaran melalui
undangan, dan `#undangan/<token>` menerima undangan. Demo dashboard tersedia di `#dashboard`.
Untuk uji lokal, siapkan akun administrator dengan `cd server; npm run provision-admin`
setelah mengisi variabel `MAPAN_INITIAL_*` di `server/.env` bila databasenya kosong.
Jika memakai database sampel yang sudah berisi organisasi, isi `MAPAN_ADMIN_EMAIL` dan
`MAPAN_ADMIN_PASSWORD` di `server/.env`, lalu jalankan `cd server; npm run set-password`.

Build dan preview produksi:

```bash
npm run build
npm run preview
```

## Struktur folder

```text
.
+-- docs/
¦   +-- design-reference/       # Referensi desain
¦   +-- plans/                  # Dokumen perencanaan
+-- src/
¦   +-- app/                    # Pemilih halaman dan komposisi aplikasi
¦   +-- features/
¦   ¦   +-- dashboard/
¦   ¦   ¦   +-- components/     # Layout dan widget dashboard
¦   ¦   ¦   +-- data/           # Data contoh, klien API, dan adapter
¦   ¦   ¦   +-- pages/          # Halaman dashboard
¦   ¦   +-- about/
¦   ¦   ¦   +-- components/     # Hero, cerita, dan halaman data Tentang
¦   ¦   ¦   +-- data/           # Angka resmi BPS dan daftar sumber
¦   ¦   +-- landing/
¦   ¦       +-- assets/images/  # Foto yang dipakai landing page
¦   ¦       +-- components/     # Navbar, hero, fitur, FAQ, dan footer
¦   ¦       +-- data/           # Konten fitur dan FAQ
¦   +-- shared/
¦   ¦   +-- styles/             # Style global aplikasi
¦   ¦   +-- ui/                 # Komponen UI bersama
¦   +-- main.jsx                # Entry point React
+-- server/                     # API (Node + Express + mysql2)
+-- db/                         # DDL, seed, dump, skrip verifikasi MySQL
+-- index.html
+-- package.json
```

## Backend dan status fitur

Dashboard menggunakan sesi berbasis cookie HttpOnly, tenant dipilih dari sesi, dan API
membatasi akses tulis berdasarkan peran. Lahan, siklus, tugas, aktivitas, laporan,
pemeriksaan tanaman, diskusi, pengaturan organisasi, dan foto disimpan di MySQL/volume
media. Cuaca memakai Open-Meteo; estimasi hasil memakai benchmark komoditas lokal dan
bukan model AI. Landing page dan halaman Tentang berisi konten publik.

Catatan integrasi: undangan dapat dibuat dan diterima lewat tautan yang dibagikan admin;
pengiriman email otomatis belum dikonfigurasi. Halaman scan menyimpan foto/gejala, tetapi
belum mendiagnosis penyakit otomatis. Peta utama menampilkan batas petak GeoJSON jika
tersedia; pembuatan dan pengeditan batas GIS belum tersedia. Berkas CSV laporan panen,
lahan, aktivitas, dan cuaca mengambil data saat diekspor.

Rincian API dan skema ada di [`server/README.md`](server/README.md), [`db/README.md`](db/README.md),
dan [`docs/database/`](docs/database/README.md).

## Deploy VPS dengan Docker

Siapkan VPS Linux dengan Docker Engine dan Docker Compose plugin, domain yang DNS-nya
mengarah ke VPS, serta akses HTTPS melalui Caddy/Nginx. Jangan gunakan kata sandi contoh.

1. Salin `.env.docker.example` menjadi `.env.docker`, lalu isi password database yang kuat.
2. Jalankan `docker compose --env-file .env.docker up -d --build`.
3. Atur reverse proxy TLS dari domain ke `127.0.0.1:8080` memakai
   [`deploy/Caddyfile.example`](deploy/Caddyfile.example), lalu buka `https://domain/` untuk landing page.
4. Pada database kosong, isi sementara variabel `MAPAN_INITIAL_*` pada `.env.docker`, lalu jalankan `docker compose --env-file .env.docker run --rm api npm run provision-admin`. Jika database sudah berisi akun admin, isi `MAPAN_ADMIN_EMAIL` dan `MAPAN_ADMIN_PASSWORD`, lalu jalankan `docker compose --env-file .env.docker exec api npm run set-password`. Hapus variabel kata sandi dari `.env.docker` setelah selesai.
5. Buka `https://domain/`, masuk menggunakan akun administrator, dan undang anggota dari menu Pengguna. Dashboard demo tersedia melalui `https://domain/#dashboard`.
6. Cadangkan volume database dan `mapan-media` secara terjadwal.

Migrasi SQL pada folder `db/migrations` dan katalog referensi dijalankan otomatis hanya
saat volume MySQL pertama kali dibuat. Untuk database yang sudah ada, lakukan backup,
periksa tabel/kolom yang telah diterapkan, lalu jalankan hanya migrasi yang belum ada
secara berurutan. `docker compose down -v`
menghapus data database/media dan jangan dipakai untuk deployment yang berisi data.

## Catatan antarmuka

- Tipografi memakai **Fraunces** untuk judul editorial dan **Public Sans** untuk teks isi. Skala teks tunggal ada di `src/shared/styles/typography.css`; kontrol perbesar teks sudah dihapus.
- Tema terang/gelap dapat diubah dari footer landing page, drawer navigasi seluler, dan popover profil dashboard. Pilihan disimpan di `localStorage`.
- Halaman **Tentang** memiliki alamat sendiri (`#tentang`) dan berisi cerita, prinsip kerja, perjalanan, serta bagian data resmi (`#tentang-data`).
- Grafik pada halaman Tentang dan ringkasan data di beranda menggunakan angka publikasi Badan Pusat Statistik (BPS): produksi dan luas panen padi 2019–2024, produksi jagung 2024, Sensus Pertanian 2023, serta produksi padi menurut provinsi 2024. Sumber lengkap ditautkan di halaman data dan footer.
- Komponen interaktif seperti dialog dan saklar pengaturan memakai primitif Radix UI. Ikon memakai Lucide. Grafik memakai Recharts.
- Foto demonstrasi berasal dari Unsplash dan Wikimedia Commons. Sumber lengkap ada di [`docs/IMAGE-CREDITS.md`](docs/IMAGE-CREDITS.md); periksa lisensi sebelum penggunaan produksi.



