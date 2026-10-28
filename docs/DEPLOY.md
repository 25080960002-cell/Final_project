# Panduan Deploy MAPAN

## Arsitektur
- **Frontend (React/Vite)** → Vercel
- **Backend (Express/MySQL)** → Railway / Render / Fly.io
- **Database** → MySQL (Railway MySQL / PlanetScale / TiDB)

---

## 1. Push ke GitHub

### A. Buat repo di GitHub
1. Buka https://github.com/new
2. Nama repo: `mapan-web`
3. Pilih **Private** (disarankan) atau Public
4. **JANGAN** centang "Initialize with README" (repo sudah ada commit lokal)
5. Klik **Create repository**

### B. Push dari terminal
```bash
cd D:\ApsMobile_projek\MAPAN_1-main
git remote add origin https://github.com/USERNAME/mapan-web.git
git branch -M main
git push -u origin main
```
Ganti `USERNAME` dengan username GitHub Anda. Jika diminta login, gunakan **Personal Access Token** (Settings → Developer settings → Personal access tokens → Tokens (classic) → scope `repo`).

---

## 2. Deploy Frontend ke Vercel

### A. Import project
1. Buka https://vercel.com/new
2. Klik **Import Git Repository** → pilih `mapan-web`
3. Framework Preset: **Vite** (auto-detect dari `vercel.json`)
4. Root Directory: `.` (default)
5. Build Command: `npm run build` (default)
6. Output Directory: `dist` (default)

### B. Set Environment Variables
Project → Settings → Environment Variables:

| Variable | Value | Environment |
|---|---|---|
| `VITE_API_BASE_URL` | `https://mapan-api.up.railway.app` (URL backend) | Production, Preview, Development |
| `VITE_ORGANIZATION_ID` | `1` | Production, Preview, Development |

### C. Deploy
Klik **Deploy** → tunggu build selesai → dapat URL `https://mapan-web-xxx.vercel.app`

---

## 3. Deploy Backend ke Railway

### A. Buat project
1. Buka https://railway.app → New Project → Deploy from GitHub repo
2. Pilih repo `mapan-web` → **Root Directory**: `server`
3. Railway auto-detect Dockerfile di `server/Dockerfile`

### B. Tambah MySQL
1. Di project Railway → **+ New** → **Database** → **MySQL**
2. Railway otomatis set `DATABASE_URL` — tapi app pakai `DB_HOST/PORT/USER/PASSWORD/NAME`
3. Copy nilai dari MySQL service → Variables:
   - `DB_HOST` = hostname MySQL (mis. `containers-us-west-xxx.railway.app`)
   - `DB_PORT` = port
   - `DB_USER` = `mapan` (atau sesuai MYSQL_USER)
   - `DB_PASSWORD` = password
   - `DB_NAME` = `mapan`

### C. Set Environment Variables (Service API)
```
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
TRUST_PROXY=true
DB_HOST=<dari MySQL service>
DB_PORT=<dari MySQL service>
DB_USER=mapan
DB_PASSWORD=<min 16 karakter>
DB_NAME=mapan
DB_POOL_MAX=10
SESSION_TTL_HOURS=8
CORS_ORIGINS=https://mapan-web-xxx.vercel.app
MEDIA_DIR=/data/media
GOOGLE_CLIENT_ID=<opsional>
MAPAN_INITIAL_ADMIN_EMAIL=admin@domain-anda.com
MAPAN_INITIAL_ADMIN_PASSWORD=<min 12 karakter>
MAPAN_INITIAL_ADMIN_NAME=Administrator MAPAN
MAPAN_INITIAL_ORG_NAME=Nama Organisasi Anda
MAPAN_INITIAL_REGION_NAME=Kabupaten Anda
MAPAN_INITIAL_REGION_LATITUDE=-8.xxxx
MAPAN_INITIAL_REGION_LONGITUDE=115.xxxx
```

### D. Volume untuk media upload
1. Service API → **Volumes** → **+ New Volume**
2. Mount path: `/data/media`

### E. Jalankan migrations
Railway MySQL tidak auto-run `docker-entrypoint-initdb.d`. Jalankan manual:
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway link  # pilih project

# Jalankan migrations (via railway run)
railway run node scripts/check-db.js  # cek koneksi

# Atau jalankan SQL manual via railway connect mysql
railway connect mysql
# lalu paste isi file migrations 001-007 + seed reference
```

Atau gunakan **Railway MySQL shell** untuk paste SQL migrations.

### F. Provisioning admin
Jika `MAPAN_INITIAL_ADMIN_*` diset dan DB kosong, provision-admin berjalan otomatis saat container start (cek logs).

---

## 4. Alternatif: Deploy Backend ke Render

### A. Buat Web Service
1. https://render.com → New → Web Service
2. Connect GitHub repo → Root Directory: `server`
3. Runtime: **Docker** (gunakan `server/Dockerfile`)
4. Plan: Free (untuk testing) atau Starter

### B. Tambah MySQL (Render PostgreSQL tidak cocok — butuh MySQL)
- Render tidak punya MySQL managed → gunakan **PlanetScale** (free tier) atau **TiDB Cloud** (free tier)
- Atau pakai Railway MySQL saja untuk DB, Render untuk API

### C. Set Environment Variables
Sama seperti Railway (lihat tabel di atas).

---

## 5. Verifikasi Deploy

```bash
# Health check
curl https://mapan-api.up.railway.app/api/health

# Login
curl -X POST https://mapan-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@domain-anda.com","password":"your-password"}'

# Buka frontend
open https://mapan-web-xxx.vercel.app
```

---

## 6. Update Frontend setelah Backend URL diketahui

1. Di Vercel Dashboard → Environment Variables → edit `VITE_API_BASE_URL`
2. Redeploy: Deployments → ... → Redeploy

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| CORS error di browser | Pastikan `CORS_ORIGINS` = domain Vercel (dengan https://) |
| Cookie tidak tersimpan | Pastikan backend HTTPS (Railway/Render auto HTTPS) |
| Upload file gagal | Pastikan volume `/data/media` ter-mount |
| Migration belum jalan | Jalankan SQL manual di MySQL shell |
| Admin tidak terbuat | Cek logs, pastikan `MAPAN_INITIAL_ADMIN_*` diset dan DB kosong |
| Weather 503 | Open-Meteo mungkin down — retry otomatis saat refresh |

---

## Checklist Sebelum Go-Live

- [ ] GitHub repo dibuat & code di-push
- [ ] Vercel project dibuat & env var diset
- [ ] Backend (Railway/Render) deployed & healthy
- [ ] MySQL provisioned & migrations 001-007 dijalankan
- [ ] Admin auto-provisioned (cek logs)
- [ ] `VITE_API_BASE_URL` di Vercel = URL backend
- [ ] `CORS_ORIGINS` di backend = domain Vercel
- [ ] Volume media ter-mount
- [ ] Login berhasil via frontend
- [ ] Dashboard menampilkan data (bukan mock)
- [ ] Upload foto lahan berhasil
- [ ] Weather berfungsi (cek region koordinat)
