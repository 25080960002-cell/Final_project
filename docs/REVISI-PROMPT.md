# Prompt revisi besar-besaran APLIKASI MAPAN

Tempel ke AI coding tool di root repo (atau cukup: "Baca AGENTS.md dan docs/REVISI-PROMPT.md, lalu kerjakan").

## Konteks tugas (kriteria penilaian)
"Pada tahap akhir, prototype dikembangkan menjadi aplikasi yang lebih lengkap menggunakan pendekatan
vibe coding. Mahasiswa boleh menggunakan AI coding tools. Aplikasi minimal memiliki: tampilan aplikasi,
database, fitur utama sesuai proposal, proses pengolahan data, hak akses pengguna jika diperlukan,
validasi dan pengujian. Output: source code, database, dokumentasi pengembangan program & hasil
pengujian dalam laporan PDF, dan demo YouTube (link dalam laporan)."

Alur pemilik proyek: web program dulu -> prototype -> proposal. Jadi JANGAN menyesuaikan ke proposal
lama; aplikasi yang jalan sekarang adalah sumber kebenaran. Fokus ke fitur yang benar-benar ada.

## Aturan keras
1. Jujur: jangan klaim fitur yang tidak ada (prediksi = benchmark, bukan AI/ML).
2. Tidak ada data demo yang menyamar sebagai data nyata: beri label "Data contoh" atau sambungkan ke API.
3. Jangan buang fitur yang jalan; jangan tambah dependency tanpa alasan kuat.
4. Migrasi baru berurutan 008+ dan idempotent.
5. Validasi server-side untuk semua input (tipe, ukuran, peran, tenant).
6. Tiap fase: jalankan `npm run check` + test, perbaiki sampai hijau, ringkas hasil.

## Fase 0 — Audit (jangan ubah kode dulu)
Petakan 12 menu dashboard (API nyata / data demo / rusak), semua endpoint backend, bug, dead code,
klaim berlebihan di README/UI. Tulis `docs/audit-akhir.md` (fitur | status | tindakan) dan usulkan
fitur inti final (maks 6–7).

## Fase 1 — Rapikan fitur inti
Ganti SEMUA data demo di dashboard dengan data API atau hapus menunya (lebih baik 7 menu solid
daripada 12 setengah jadi). Tuntas end-to-end (UI -> API -> DB -> tampil lagi):
auth + organisasi + undangan; CRUD petak; siklus tanam + tugas + aktivitas + panen; KPI dashboard
dari data nyata; laporan + ekspor CSV; cuaca (Open-Meteo, pesan error ramah); prediksi benchmark
(tampilkan sumber, asumsi, disclaimer); scan tanaman (foto + gejala + riwayat, tanpa diagnosis otomatis).
Tiap halaman punya state loading/empty/error/sukses; form tervalidasi klien + server. Responsif + tema
terang/gelap tetap jalan.

## Fase 2 — Hak akses & keamanan
Matriks peran x fitur (Administrator, Manajer lapangan, Petani, Penyuluh read-only) ditegakkan di
BACKEND dan tercermin di UI. Isolasi tenant (org A tidak bisa akses org B). Rate limit login, helmet,
CORS ketat, cookie HttpOnly+SameSite, sanitasi upload (maks 10 MB). Tulis `docs/hak-akses.md`.

## Fase 3 — Pengujian (paling lemah saat ini)
Backend: node:test + supertest (atau vitest) dengan DB test terpisah — health, login valid/invalid,
logout, CRUD petak, CRUD catatan, KPI, ekspor CSV, upload >10 MB ditolak, 403 antar peran, isolasi tenant,
cuaca tanpa koordinat. Frontend: test util/komponen penting + 4–5 skenario E2E Playwright.
Pertahankan uji constraint DB. Update CI agar menjalankan semua test. Hasilkan
`docs/hasil-pengujian.md` (No | Pengujian | Langkah | Diharapkan | Aktual | Status) dari run asli,
bukti di `docs/bukti-uji/`.

## Fase 4 — Database deliverable
Seed demo rapi (1 organisasi, 1 akun per peran, 2–3 petak, siklus, catatan, panen realistis).
Skrip npm: migrate, seed, reset-demo. Hasilkan `db/dump/mapan_final.sql`. Perbarui ERD/kamus data
hanya untuk tabel yang benar-benar dipakai (migrasi saat ini membuat 22 tabel).

## Fase 5 — Deploy & demo-ready
Verifikasi build produksi + docker-compose; `.env.example` lengkap, tanpa secret ter-commit.
`docs/PANDUAN-DEPLOY.md` dari nol, `docs/akun-demo.md`, dan `docs/skenario-demo.md` (naskah 5–8 menit).

## Fase 6 — Bahan laporan
README jujur; `docs/laporan/` (arsitektur, modul, migrasi, deployment, matriks akses, tabel pengujian,
keterbatasan/future work); `docs/penggunaan-ai.md` (tools AI, bagian yang dibantu, cara verifikasi).

## Format kerja
Mulai Fase 0, tampilkan ringkasan + rencana, lanjutkan fase berikutnya tanpa menunggu kecuali ada
keputusan ambigu. Tiap akhir fase: file berubah, perintah menjalankan, hasil test, sisa masalah.
Fitur yang tidak bisa dinyatakan nyata dalam waktu wajar: hapus dari UI, catat sebagai future work.

## Definition of Done
Jalan lokal + produksi; fitur inti end-to-end dengan data nyata; hak akses terbukti lewat test;
test hijau di CI; tabel pengujian terisi dari run asli; dump DB + akun demo + skenario demo siap;
README jujur.
