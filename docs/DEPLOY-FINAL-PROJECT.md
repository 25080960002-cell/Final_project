# 🚀 Kit Deploy MAPAN — Repo `Final_project`

Panduan deploy siap pakai untuk repo **`25080960002-cell/Final_project`**.
Semua file konfigurasi yang dibutuhkan sudah ada di repo ini:

| File | Keperluan |
| --- | --- |
| `vercel.json` | Preset Vite + rewrite `/index.html` (frontend di Vercel) |
| `server/railway.json` | Builder Dockerfile + healthcheck `/api/health` (Railway) |
| `server/Dockerfile` | Image API Node 22 + folder media `/data/media` |
| `server/.env.production.example` | Template variabel API di Railway |
| `.env.vercel.example` | Template variabel frontend di Vercel |

Arsitektur: **Frontend → Vercel**, **API + MySQL + media → Railway**.
Vercel tidak bisa menjalankan backend (serverless, tanpa MySQL/disk), jadi backend
tidak ikut ke Vercel.

```
Pengguna → https://mapan-web.vercel.app  →  https://<api>.up.railway.app/api  →  MySQL Railway
```

---

## Langkah 1 — Backend + MySQL di Railway

1. <https://railway.app> → **New Project → Deploy from GitHub repo** → pilih `Final_project`.
2. Buka service yang terbentuk → **Settings → Root Directory** = `server`.
   Railway membaca `server/railway.json` otomatis. Deployment pertama bisa gagal
   healthcheck — **itu normal**, karena env & database belum diisi; lanjut ke
   langkah 3–6 dan Railway akan mencoba lagi.
3. **+ New → Database → MySQL** di dalam project yang sama.
4. Klik service MySQL → tab **Connect → Public (TCP Proxy)** → catat:
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`.
5. Klik service API → **Variables → Raw Editor** → tempel blok di bawah, lalu isi
   `<...>` dengan nilai dari MySQL Railway:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
TRUST_PROXY=true

DB_HOST=<host-publik-mysql-railway>
DB_PORT=<port-publik-mysql-railway>
DB_USER=<user-mysql-railway>
DB_PASSWORD=<password-mysql-railway>
DB_NAME=mapan
DB_POOL_MAX=10

SESSION_TTL_HOURS=8
# Ganti domain setelah tahu URL Vercel final (langkah 4). Pola *.vercel.app diperbolehkan.
CORS_ORIGINS=https://*.vercel.app
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

MEDIA_DIR=/data/media

# HANYA untuk provisioning admin pertama (langkah 2). Hapus password setelah sukses!
MAPAN_INITIAL_ADMIN_EMAIL=<email-anda>
MAPAN_INITIAL_ADMIN_PASSWORD=<sandi-minimal-12-karakter>
MAPAN_INITIAL_ADMIN_NAME=Administrator MAPAN
MAPAN_INITIAL_ORG_NAME=<nama organisasi>
MAPAN_INITIAL_REGION_NAME=<kabupaten/kota>
MAPAN_INITIAL_REGION_LATITUDE=
MAPAN_INITIAL_REGION_LONGITUDE=
```

   Catatan: isi semua placeholder `<...>` (hapus tanda kurung sudutnya), dan
   **jangan** tempel isi `server/.env` lokal ke Railway — env lokal memakai
   kredensial MySQL pribadi yang tidak sama dengan milik Railway.

6. Di service API: **+ New → Volume** → **Mount path** = `/data/media`
   (untuk menyimpan foto lahan/scan secara permanen).
7. Setelah deploy, cek: `https://<api-domain>/api/health` →
   `{"data":{"status":"ok","db":{"status":"up"}}}`.

---

## Langkah 2 — Migrasi database (jalankan dari komputer lokal)

Migrasi **tidak boleh** dijalankan di dalam container (folder `db/` tidak ikut ke image
API). Jalankan dari folder repo ini:

```powershell
cd server
$env:NODE_ENV="production"
$env:DB_HOST="<host-publik-mysql-railway>"
$env:DB_PORT="<port-publik-mysql-railway>"
$env:DB_USER="<user-mysql-railway>"
$env:DB_PASSWORD="<password-mysql-railway>"
$env:DB_NAME="mapan"
npm run migrate
npm run provision-admin   # membuat admin pertama dari MAPAN_INITIAL_* di Railway
```

- Database sudah punya tabel manual dari cara lama? Jalankan sekali:
  `npm run migrate -- --baseline`, barulah `npm run migrate`.
- Cek status: `npm run migrate -- --status` (harus menampilkan `001`–`008` + seed `applied`).
- ⚠️ **Setelah provisioning sukses, hapus `MAPAN_INITIAL_ADMIN_PASSWORD`** dari Variables
  Railway agar sandi admin tidak tinggal di dashboard.

---

## Langkah 3 — Frontend di Vercel

1. <https://vercel.com/new> → **Import Git Repository** → `Final_project`.
2. **Root Directory** = `.` (root), Framework Preset = **Vite**
   (build `npm run build`, output `dist` — sudah dibaca dari `vercel.json`).
3. **Environment Variables** — isi untuk **Production, Preview, dan Development**:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<api-domain-railway>` (tanpa `/` di akhir) |
| `VITE_ORGANIZATION_ID` | `1` |
| `VITE_GOOGLE_MAPS_API_KEY` | *(opsional)* kunci Maps JavaScript API |

   ⚠️ `VITE_*` dibaca **saat build**. Set dulu variabelnya, baru klik **Deploy**.
4. **Deploy** → buka `https://<nama>.vercel.app`.

---

## Langkah 4 — Kunci domain final di Railway

Sekarang domain Vercel sudah diketahui (mis. `https://final-project-mapan.vercel.app`).

1. Railway → service API → **Variables** → perbarui:

```env
CORS_ORIGINS=https://<nama-project>.vercel.app,https://*.vercel.app
```

2. Railway auto-redeploy. Berikan 1–2 menit.

---

## Langkah 5 — Checklist pasca-deploy

- [ ] `https://<api>/api/health` → `{"status":"ok","db":{"status":"up"}}`
- [ ] Login di `https://<nama-project>.vercel.app/#masuk` dengan akun admin (provisioning)
- [ ] Dashboard memuat data, tidak ada error `CORS` / `API tidak tersambung` (DevTools → Console/Network)
- [ ] Cookie sesi terlihat `SameSite=None; Secure` (DevTools → Application → Cookies)
- [ ] Tambah lahan → unggah foto → foto tersimpan (bukti volume `/data/media`). Hapus foto → tersimpan
- [ ] Halaman Cuaca & Prediksi merespons (wilayah proyek punya koordinat)
- [ ] Logout membawa Anda benar-benar keluar — sesi lama tidak bisa dibuka ulang
- [ ] Halaman Pengaturan organisasi terbuka (di aplikasi: menu ORGANISASI → Pengaturan)

---

## Bila bermasalah

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| CORS error di browser | `CORS_ORIGINS` tidak memuat domain Vercel persis | Perbaiki variabel Railway, tunggu redeploy |
| Login berhasil lalu langsung ter-logout / dashboard kosong | Cookie lintas domain ditolak browser | Pastikan `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true`, dan akses API via HTTPS |
| Halaman putih / 404 setelah refresh | `vercel.json` rewrite hilang | Pastikan file masih ada di root repo |
| Upload foto gagal | Volume `/data/media` belum ter-mount / `MEDIA_DIR` salah | Tambahkan Volume di service API dengan path `/data/media` |
| Cuaca 503 | Wilayah organisasi belum punya koordinat | Isi latitude/longitude (di aplikasi: Pengaturan) |
| Migrasi `Duplicate column` | Database lama dengan tabel manual | `npm run migrate -- --baseline` sekali |
| `provision-admin` ditolak | Database sudah punya organisasi | Lewati — gunakan `node scripts/set-password.js` dari lokal untuk mengganti sandi admin |

Referensi lengkap: `docs/DEPLOY.md` dan `docs/PANDUAN-DEPLOY.md`.

---

## Alternatif satu server (VPS + Docker Compose)

Gabungkan di satu origin lewat Nginx (`deploy/nginx.conf`) → `COOKIE_SAME_SITE=lax`
sudah cukup, tanpa Railway:

```bash
cp .env.docker.example .env.docker   # isi DB_PASSWORD, MYSQL_ROOT_PASSWORD, CORS_ORIGINS
docker compose --env-file .env.docker up -d --build
```
TLS dengan `deploy/Caddyfile.example`.
