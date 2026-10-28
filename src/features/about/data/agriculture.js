/**
 * Angka pertanian Indonesia dari publikasi resmi.
 *
 * Sumber utama:
 * - BPS, "Luas Panen dan Produksi Padi di Indonesia 2024" (3 Februari 2025)
 * - BPS, "Luas Panen dan Produksi Jagung 2024" (3 Februari 2025)
 * - BPS, "Hasil Sensus Pertanian 2023 Tahap 1" (4 Desember 2023)
 *
 * Produktivitas dihitung dari produksi GKG dibagi luas panen, lalu
 * dikonversi ke kuintal per hektare. Pembulatan mengikuti angka publikasi.
 */

export const riceSeries = [
  { year: '2019', production: 54.60, area: 10.68, productivity: 51.12 },
  { year: '2020', production: 54.65, area: 10.66, productivity: 51.27 },
  { year: '2021', production: 54.42, area: 10.41, productivity: 52.28 },
  { year: '2022', production: 54.75, area: 10.45, productivity: 52.39 },
  { year: '2023', production: 53.98, area: 10.21, productivity: 52.87 },
  { year: '2024', production: 53.14, area: 10.05, productivity: 52.88 },
];

export const cornSeries = [
  { year: '2022', production: 16.53 },
  { year: '2023', production: 14.77 },
  { year: '2024', production: 15.14 },
];

/**
 * Produksi padi 2024 menurut provinsi (juta ton GKG), BPS.
 * Jatim 9.270.435,29 · Jateng 8.891.297,05 · Jabar 8.626.879,91
 * Sulsel 4.819.xxx · Sumsel 2.912.xxx
 */
export const provinceSeries = [
  { province: 'Jawa Timur', short: 'Jatim', production: 9.27 },
  { province: 'Jawa Tengah', short: 'Jateng', production: 8.89 },
  { province: 'Jawa Barat', short: 'Jabar', production: 8.63 },
  { province: 'Sulawesi Selatan', short: 'Sulsel', production: 4.82 },
  { province: 'Sumatera Selatan', short: 'Sumsel', production: 2.91 },
];

const nationalRice2024 = riceSeries.find((item) => item.year === '2024').production;

/** Total dan porsi lima provinsi dihitung dari data, bukan ditulis manual. */
export const provinceTotal = provinceSeries.reduce((sum, item) => sum + item.production, 0);
export const provinceShare = (provinceTotal / nationalRice2024) * 100;

export const ageSeries = [
  { bracket: '15–24', share: 1.24 },
  { bracket: '25–34', share: 10.34 },
  { bracket: '35–44', share: 22.08 },
  { bracket: '45–54', share: 27.09 },
  { bracket: '55–64', share: 23.20 },
  { bracket: '65+', share: 16.15 },
];

export const islandShare = [
  { name: 'Pulau Jawa', value: 54.19 },
  { name: 'Luar Jawa', value: 45.81 },
];

export const headlineStats = [
  {
    value: '53,14',
    unit: 'juta ton',
    label: 'Produksi padi 2024',
    note: 'Gabah kering giling (GKG), turun 1,55% dari 2023.',
  },
  {
    value: '10,05',
    unit: 'juta ha',
    label: 'Luas panen padi 2024',
    note: 'Sekitar 50,20% luas panen nasional berada di Pulau Jawa.',
  },
  {
    value: '52,88',
    unit: 'kuintal/ha',
    label: 'Produktivitas padi 2024',
    note: 'Naik tipis dari 52,87 kuintal/ha pada 2023.',
  },
  {
    value: '29,36',
    unit: 'juta unit',
    label: 'Usaha pertanian 2023',
    note: 'Hasil Sensus Pertanian 2023, turun 7,42% dari 2013.',
  },
];

export const censusFacts = [
  { value: '29,34 juta', label: 'Usaha pertanian perorangan (UTP)' },
  { value: '15,77 juta', label: 'Usaha di subsektor tanaman pangan' },
  { value: '39,35%', label: 'Pengelola UTP berusia 55 tahun ke atas' },
  { value: '5.705', label: 'Perusahaan pertanian berbadan hukum' },
];

export const insights = [
  {
    title: 'Produktivitas jadi kunci',
    body: 'Luas panen turun dari 10,68 juta ha (2019) menjadi 10,05 juta ha (2024), sementara produksi relatif bertahan. Peningkatan hasil per hektare menjadi penentu utama.',
  },
  {
    title: 'Regenerasi tidak bisa ditunda',
    body: '39,35% pengelola usaha pertanian perorangan berusia 55 tahun ke atas. Pendampingan, pencatatan yang mudah, dan akses pasar perlu dirancang untuk lintas generasi.',
  },
  {
    title: 'Jawa masih menjadi lumbung',
    body: '54,19% produksi padi nasional berasal dari Pulau Jawa. Data wilayah di luar Jawa perlu diperkuat agar risiko terpusat pada satu pulau bisa dikurangi.',
  },
];

export const sources = [
  {
    label: 'BPS — Luas Panen dan Produksi Padi di Indonesia 2024',
    meta: 'Berita Resmi Statistik · 3 Februari 2025',
    href: 'https://www.bps.go.id/id/pressrelease/2025/02/03/2414/pada-2024--luas-panen-padi-mencapai-sekitar-10-05-juta-hektare-dengan-produksi-padi-sebanyak-53-14-juta-ton-gabah-kering-giling--gkg--.html',
  },
  {
    label: 'BPS — Luas Panen dan Produksi Jagung 2024',
    meta: 'Berita Resmi Statistik · 3 Februari 2025',
    href: 'https://www.bps.go.id/assets/pressrelease/2025/02/03/2412/pada-2024--luas-panen-jagung-pipilan-mencapai-2-55-juta-hektare--produksi-jagung-pipilan-kering-dengan-kadar-air-14-persen-pada-2024-sebanyak-15-14-juta-ton-.html',
  },
  {
    label: 'BPS — Hasil Sensus Pertanian 2023 Tahap 1',
    meta: 'Diseminasi hasil · 4 Desember 2023',
    href: 'https://sensus.bps.go.id/topik/tabular/st2023/239/0/0',
  },
  {
    label: 'BPS — Luas Panen, Produksi, dan Produktivitas Padi menurut Provinsi',
    meta: 'Tabel Statistik · 2024',
    href: 'https://www.bps.go.id/id/statistics-table/2/MTQ5OCMy/luas-panen-produksi-dan-produktivitas-padi-menurut-provinsi.html',
  },
];
