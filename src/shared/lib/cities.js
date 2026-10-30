/**
 * Titik pusat perkiraan kota/kabupaten besar di Indonesia (derajat desimal).
 * Dipakai untuk mengisi koordinat wilayah organisasi agar cuaca (Open-Meteo) langsung berfungsi.
 * Koordinat bersifat perkiraan pusat kota dan dapat diubah oleh pengguna.
 */
export const CITIES = [
  ['Banda Aceh', 5.5483, 95.3238], ['Medan', 3.5952, 98.6722], ['Padang', -0.9471, 100.4172],
  ['Pekanbaru', 0.5071, 101.4478], ['Jambi', -1.6101, 103.6131], ['Palembang', -2.9761, 104.7754],
  ['Bengkulu', -3.7956, 102.2592], ['Bandar Lampung', -5.3971, 105.2668], ['Pangkal Pinang', -2.1316, 106.1169],
  ['Tanjung Pinang', 0.9167, 104.45], ['Jakarta', -6.2088, 106.8456], ['Serang', -6.1201, 106.1503],
  ['Bandung', -6.9175, 107.6191], ['Cirebon', -6.7063, 108.557], ['Tasikmalaya', -7.3274, 108.2207],
  ['Semarang', -6.9667, 110.4167], ['Kabupaten Semarang (Ungaran)', -7.1349, 110.4047], ['Surakarta (Solo)', -7.5755, 110.8243],
  ['Magelang', -7.4797, 110.2177], ['Purwokerto', -7.4243, 109.2302], ['Yogyakarta', -7.7956, 110.3695],
  ['Surabaya', -7.2575, 112.7521], ['Malang', -7.9666, 112.6326], ['Kediri', -7.848, 112.0178],
  ['Jember', -8.1845, 113.6681], ['Banyuwangi', -8.2192, 114.3691], ['Denpasar', -8.6705, 115.2126],
  ['Mataram', -8.5833, 116.1167], ['Kupang', -10.1718, 123.6075], ['Pontianak', -0.0263, 109.3425],
  ['Palangka Raya', -2.2161, 113.9135], ['Banjarmasin', -3.3194, 114.5908], ['Samarinda', -0.5022, 117.1536],
  ['Balikpapan', -1.2379, 116.8529], ['Manado', 1.4748, 124.8421], ['Gorontalo', 0.5435, 123.0568],
  ['Palu', -0.8917, 119.8707], ['Makassar', -5.1477, 119.4327], ['Kendari', -3.9985, 122.513],
  ['Ambon', -3.6954, 128.1814], ['Ternate', 0.7833, 127.3667], ['Jayapura', -2.5337, 140.7181],
].map(([name, latitude, longitude]) => ({ name, latitude, longitude }));

export const isIndonesiaCoordinate = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat >= -11.5 && lat <= 6.5 && lon >= 94 && lon <= 142;
