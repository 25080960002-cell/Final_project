# Panduan Deploy MAPAN

Arsitektur yang dipakai:

- **Frontend (React + Vite)** → Vercel
- **Backend (Express + MySQL)** → Railway (atau Render/VPS Docker)
- **Database** → MySQL Railway (atau MySQL managed lain)
- **Media upload** → volume persisten `/data/media` di service API

> Vercel tidak menjalankan proses Node.js jangka panjang dan tidak menyimpan file
> upload. Karena itu frontend di Vercel, sedangkan API + MySQL + media berada di
> Railway. Keduanya tetap bersumber dari satu repositori GitHub ini.

---

## 1. Push ke GitHub

Repo lokal sudah siap di-commit. Buat repo kosong di <https://github.com/new>
(jangan centang "Initialize with README"), lalu:

```bash
git remote add origin https://github.com/USERNAME/mapan-web.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME`. Jika diminta login, gunakan Personal Access Token dengan scope
`repo`.

---

## 2. Deploy Backend ke Railway

1. <https://railway.app> → **New Project** → **Deploy from GitHub repo** → pilih
   repo ini.
2. Buka service → **Settings**:
   - **Root Directory**: `server`
   - Railway membaca `server/railway.json` dan `server/Dockerfile`.
3. **+ New** → **Database** → **MySQL**.
4. Di service API → **Variables** → **Raw Editor**, tempel isi
   [`server/.env.production.example`](../server/.env.production.example) lalu
   sesuaikan:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dari service MySQL.
   - `CORS_ORIGINS=https://domain-vercel-anda.vercel.app,https://*.vercel.app`
   - `COOKIE_SAME_SITE=none` dan `COOKIE_SECURE=true` (wajib karena beda domain).
   - `MEDIA_DIR=/data/media`.
5. Tambahkan **Volume** pada service API dengan mount path `/data/media`.
6. Deploy. Cek `https://<api-domain>/api/health` → `{"status":"ok"}`.

### Migrasi database produksi

Jalankan dari komputer lokal, arahkan ke MySQL Railway (gunakan **Connect →
Public Network**):

```bash
cd server
# Windows PowerShell
$env:NODE_ENV="production"
$env:DB_HOST="<host>"; $env:DB_PORT="<port>"
$env:DB_USER="<user>"; $env:DB_PASSWORD="<password>"; $env:DB_NAME="mapan"
npm run migrate
npm run provision-admin   # isi MAPAN_INITIAL_* dulu
```

Database yang sudah dibuat manual sebelum ada tabel `schema_migrations`:

```bash
npm run migrate -- --baseline   # sekali saja
npm run migrate                 # migrasi berikutnya
```

Cek status kapan pun dengan `npm run migrate -- --status`.

---

## 3. Deploy Frontend ke Vercel

1. <https://vercel.com/new> → **Import Git Repository** → pilih repo ini.
2. **Root Directory**: `.` (root repo)
3. Framework Preset: **Vite** (terbaca dari `vercel.json`)
4. Build Command: `npm run build`, Output Directory: `dist`
5. **Environment Variables** (Production + Preview + Development):

   | Variable | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | `https://<api-domain-railway>` (tanpa garis miring di akhir) |
   | `VITE_ORGANIZATION_ID` | `1` |

6. **Deploy**, lalu buka `https://<project>.vercel.app`.

Jika domain API berubah, ubah `VITE_API_BASE_URL` lalu **Redeploy** (variabel
Vite dibaca saat build, bukan saat runtime).

---

## 4. Setelah Deploy

1. Buka `https://<project>.vercel.app/#masuk` dan login dengan akun admin.
2. Di Railway, pastikan `CORS_ORIGINS` memuat domain Vercel **persis**.
3. Uji alur: login → dashboard memuat data → tambah lahan → upload foto →
   cuaca → logout.
4. Hapus `MAPAN_INITIAL_ADMIN_PASSWORD` dari Variables Railway setelah
   provisioning berhasil.
5. Backup volume `mapan-db` dan `mapan-media` secara terjadwal.

---

## 5. Alternatif: VPS dengan Docker Compose

```bash
cp .env.docker.example .env.docker
# isi DB_PASSWORD, MYSQL_ROOT_PASSWORD, CORS_ORIGINS
docker compose --env-file .env.docker up -d --build
```

Frontend dan API disajikan dari satu origin lewat Nginx (`deploy/nginx.conf`),
sehingga `COOKIE_SAME_SITE=lax` sudah cukup. Pasang TLS dengan
[`deploy/Caddyfile.example`](../deploy/Caddyfile.example).

---

## Troubleshooting

| Masalah | Penyebab & solusi |
| --- | --- |
| CORS error | `CORS_ORIGINS` tidak memuat domain frontend. Tambahkan domain Vercel persis, atau pola `https://*.vercel.app`. |
| Login berhasil tetapi sesi hilang | Cookie cross-site ditolak. Set `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true`, dan API harus HTTPS. |
| `API tidak tersambung` | `VITE_API_BASE_URL` kosong/salah di Vercel, atau `/api/health` backend tidak `ok`. |
| Upload foto gagal | Volume `/data/media` belum ter-mount atau `MEDIA_DIR` salah. |
| Cuaca 503 | Region organisasi belum punya koordinat, atau Open-Meteo tidak terjangkau. |
| Migrasi gagal `Duplicate column` | Database lama: jalankan `npm run migrate -- --baseline` sekali. |
| Admin tidak bisa dibuat | `provision-admin` hanya jalan pada database tanpa organisasi. |
| Halaman 404 setelah refresh | Pastikan `vercel.json` masih memakai rewrite ke `/index.html`. |
