import wheatField from '../assets/images/wheat-field.jpg';
import riceTerraces from '../assets/images/rice-terraces.jpg';
import paddyPlanting from '../assets/images/paddy-planting.jpg';
import harvestCommunity from '../assets/images/harvest-community.jpg';
import farmlandSunset from '../assets/images/farmland-sunset.jpg';
import produceMarket from '../assets/images/produce-market.jpg';
import cornField from '../assets/images/corn-field.jpg';

export const landingFeatures = [
  {
    number: '01',
    title: 'Dashboard Pertanian',
    category: 'RINGKASAN DATA',
    image: wheatField,
    imageAlt: 'Petani berjalan di antara lahan gandum yang menguning',
    description: 'Lihat ringkasan lahan, komoditas, aktivitas, cuaca, dan perkiraan hasil dalam satu halaman.',
    guide: 'Klik "Masuk ke Dashboard" untuk membuka halaman utama MAPAN. Baca ringkasan lahan dan komoditas, aktivitas, perkiraan hasil, serta risiko cuaca. Grafik produktivitas dan log aktivitas membantu melihat perkembangan. Tombol "Detail" pada panel peta membuka informasi lahan.',
  },
  {
    number: '02',
    title: 'Peta Lahan',
    category: 'INFORMASI SPASIAL',
    image: riceTerraces,
    imageAlt: 'Petak-petak sawah bertingkat dilihat dari ketinggian',
    description: 'Pantau sebaran lahan, luas, jenis komoditas, dan kondisi petak yang dikelola.',
    guide: 'Buka menu "Peta Spasial" di Dashboard untuk melihat posisi petak. Untuk memeriksa nama petak, pengelola, komoditas, dan fase budidaya, buka menu "Lahan".',
  },
  {
    number: '03',
    title: 'Siklus Budidaya',
    category: 'SIKLUS BUDIDAYA',
    image: paddyPlanting,
    imageAlt: 'Petani menanam bibit padi di sawah',
    description: 'Catat tahapan budidaya sesuai karakter tanaman pangan, hortikultura, perkebunan, dan komoditas lain.',
    guide: 'Pilih menu "Siklus Budidaya" di Dashboard. Catat tahap yang relevan untuk komoditas—misalnya persiapan, tanam, perawatan, pembungaan, atau panen—lalu pantau progres dan jadwalnya.',
  },
  {
    number: '04',
    title: 'Prediksi Panen',
    category: 'PERENCANAAN HASIL',
    image: harvestCommunity,
    imageAlt: 'Kelompok petani memanen hasil kebun bersama',
    description: 'Bandingkan perkiraan hasil per komoditas untuk membantu perencanaan panen dan pemasaran.',
    guide: 'Pilih menu "Prediksi Panen" di Dashboard. Tinjau estimasi hasil, luas produktif, dan faktor risiko untuk tiap komoditas. Gunakan ringkasan tersebut sebagai bahan menyusun rencana panen dan pemasaran bersama kelompok tani.',
  },
  {
    number: '05',
    title: 'Cuaca & Risiko',
    category: 'PEMANTAUAN LAPANGAN',
    image: farmlandSunset,
    imageAlt: 'Lahan pertanian saat matahari terbenam',
    description: 'Pantau cuaca lokal dan risiko yang dapat memengaruhi kegiatan pada beragam jenis lahan.',
    guide: 'Pilih menu "Cuaca & Risiko" di Dashboard. Periksa suhu, kelembapan, angin, peluang hujan, dan prakiraan beberapa hari ke depan. Pertimbangkan dampaknya pada komoditas dan sesuaikan kegiatan dengan kondisi nyata di lahan.',
  },
  {
    number: '06',
    title: 'Manajemen Koperasi',
    category: 'KOLABORASI PETANI',
    image: produceMarket,
    imageAlt: 'Rak sayur dan buah segar di pasar modern',
    description: 'Kelola data anggota, kelompok tani, lahan, dan aktivitas dalam satu workspace.',
    guide: 'Buka menu "Pengguna" untuk melihat anggota, peran, dan status akun. Menu "Organisasi" menampilkan ringkasan koperasi serta kelompok tani yang tercatat.',
  },
  {
    number: '07',
    title: 'Scan Penyakit Tanaman',
    category: 'KESEHATAN TANAMAN',
    image: cornField,
    imageAlt: 'Daun jagung muda di lahan budidaya',
    description: 'Dokumentasikan foto dan gejala tanaman untuk membantu pemeriksaan awal bersama penyuluh atau kelompok tani.',
    guide: 'Pilih menu "Scan penyakit" untuk mengunggah foto tanaman dan mencatat komoditas serta gejala yang terlihat. Foto menjadi dokumentasi pemantauan; hasil diagnosis otomatis belum tersedia pada prototipe ini. Gunakan catatan tersebut untuk berdiskusi dengan penyuluh atau ahli pertanian setempat.',
    featured: true,
  },
  {
    number: '08',
    title: 'Komunitas Petani',
    category: 'BERBAGI PENGETAHUAN',
    image: harvestCommunity,
    imageAlt: 'Petani bekerja bersama saat panen',
    description: 'Ajukan pertanyaan, berbagi pengalaman budidaya, dan belajar dari petani serta kelompok tani lain.',
    guide: 'Buka menu "Komunitas petani" untuk membaca diskusi, mencari topik, dan membagikan pengalaman lapangan. Pada prototipe ini, kiriman dan tanggapan disimpan sementara di halaman selama sesi berlangsung.',
  },
];
