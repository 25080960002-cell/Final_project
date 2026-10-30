# 🚀 Panduan Deploy MAPAN

Status terakhir: `npm run check` hijau · `npm test` dijalankan dari database uji `mapan_test`.

## Arsitektur yang didukung

| Bagian | Platform | Bukti konfigurasi |
| --- | --- | --- |
| Frontend (React + Vite) | Vercel | `.env.vercel.example` |
| API (Express) | Railway (Docker) | `server/Dockerfile`, `server/railway.json` (healthcheck `/api/health`) |
| Database | MySQL 8 (Railway/PlanetScale/VPS) | Migrasi `db/migrations/001–008` idempotent |

## 1. Database

1. Buat MySQL 8 (Railway: *New → Database → MySQL*).
2. Catat host, port, user, password.
3. Jalankan migrasi **dari komputer lokal** (folder `db/` tidak ikut ke dalam image API,
   jadi `npm run migrate` tidak bisa dijalankan di dalam container):
   ```bash
   # ganti dengan kredensial + TCP proxy publik dari dashboard Railway
   DB_HOST=<host-publik> DB_PORT=<port-publik> DB_USER=mapan \
   DB_PASSWORD=<password> DB_NAME=mapan \
   npm --prefix server run migrate
   ```
   Migrasi idempotent, boleh diulang. Untuk VPS yang memakai `docker-compose.yml`,
   migrasi sudah otomatis dimuat lewat `/docker-entrypoint-initdb.d` saat volume pertama dibuat.
4. Buat admin pertama (opsional di produksi):
   ```bash
   npm --prefix server run provision-admin
   # isi MAPAN_INITIAL_* → segera hapus MAPAN_INITIAL_ADMIN_PASSWORD dari env setelah sukses
   ```

## 2. Backend → Railway

Environment variables (lihat `server/.env.production.example`):

| Kunci | Aturan |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | `4000` (Railway meng-inject otomatis, biarkan) |
| `TRUST_PROXY` | `true` (di belakang proxy HTTPS) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | dari step 1; `DB_PASSWORD` wajib acak ≥16 karakter |
| `CORS_ORIGINS` | Domain Vercel produksi + `https://*.vercel.app` untuk preview |
| `COOKIE_SAME_SITE` | `none` (lintas domain Vercel ↔ Railway) |
| `COOKIE_SECURE` | `true` |
| `MEDIA_DIR` | Volume persist Railway, contoh `/data/media` — lampirkan Volume ke path ini |
| `GOOGLE_CLIENT_ID` | (opsional) login Google |

Railway memakai `railway.json` sudah termuat: Dockerfile builder, healthcheck `/api/health`, restart on-failure.

## 3. Frontend → Vercel

Environment variables (lihat `.env.vercel.example`):

| Kunci | Nilai |
| --- | --- |
| `VITE_API_BASE_URL` | URL public API, contoh `https://mapan-api.up.railway.app` |
| `VITE_ORGANIZATION_ID` | `1` |
| `VITE_GOOGLE_MAPS_API_KEY` | Kunci Maps JavaScript API (opsional; kosong → peta mode skema) |

Penting: variabel `VITE_*` dibaca saat **build**, set sebelum deploy pertama.

Setelah tahu domain final, perbarui `CORS_ORIGINS` di backend agar persis domain Vercel produksi.

## 4. Checklist sebelum deploy (wajib hijau semua)

```bash
npm install          # deps terpasang
npm run check        # build + sintaks backend
npm test             # unit + smoke + integrasi API (DB mapan_test)
```

## 5. Checklist pasca-deploy

- [ ] `https://<api>/api/health` → `{"status":"ok","db":{"status":"up"}}`
- [ ] Login dari frontend sukses (cookie `SameSite=None; Secure` terlihat di DevTools)
- [ ] Registrasi organisasi baru → otomatis masuk dashboard
- [ ] Upload foto (scan/komunitas/avatar) tersimpan di volume media, bukan disk sementara
- [ ] Peta: mode Google aktif bila kunci dipasang
- [ ] Data demo **tidak** di-seed di produksi (`NODE_ENV=production` memblokir `seed-demo` kecuali `MAPAN_ALLOW_DEMO_SEED=true`)

## 6. Hal yang belum terbukti otomatis

- E2E browser belum ada (Playwright/Cypress belum dipasang) — verifikasi visual manual per checklist di atas.
- Lewat `docs/CATATAN-REVISI.md` untuk daftar apa yang sudah/belum teruji end-to-end.
