# Laporan Tahap Akhir MAPAN

Isi folder ini adalah **laporan resmi tugas** (dokumentasi pengembangan + hasil pengujian).

| Berkas | Arti |
| --- | --- |
| `laporan-tahap-akhir.html` | Sumber laporan — **edit file ini** untuk mengisi identitas, link YouTube, dan tangkapan layar |
| `LAPORAN-MAPAN-tahap-akhir.pdf` | Hasil PDF siap kumpul (dibangkitkan dari HTML di atas) |
| `assets/mapan-logo-full.png` | Logo resmi MAPAN (dipakai cover laporan) |

## Cara mengisi bagian yang belum terisi

Semua bagian yang harus diisi ditandai blok berwarna kuning bertuliskan
`ISI-Oleh-Mahasiswa`. Buka `laporan-tahap-akhir.html` dengan VS Code/Notepad lalu
cari teks `ISI-Oleh-Mahasiswa` — antara lain:

1. **Cover** — nama lengkap, NIM, prodi, kampus.
2. **§2.2 Tools** — nama AI coding tool yang benar-benar kamu pakai.
3. **§5.5** — URL produksi bila sudah di-deploy (atau tulis “menjalankan lokal”).
4. **§7.5** — link build CI terakhir.
5. **§8** — ganti setiap kotak `[Tangkap layar: …]` dengan tag `<img>` tangkapan layarmu:
   ```html
   <img src="assets/01-landing.png" style="max-width:170mm" alt="Landing" />
   ```
6. **§9** — link video YouTube (disarankan *unlisted*).

Setelah semua terisi, bangkitkan ulang PDF:

```bash
npm run laporan:pdf
```

(Tanpa Node pun bisa: buka HTML-nya di browser → Ctrl+P → *Simpan sebagai PDF*.)
