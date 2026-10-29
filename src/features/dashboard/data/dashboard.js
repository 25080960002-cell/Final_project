import {
  Activity,
  Building2,
  CalendarDays,
  CloudSun,
  FileBarChart2,
  LayoutDashboard,
  Map,
  MapPinned,
  ScanLine,
  Settings,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';

export const nav = [
  { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard, group: 'RUANG KERJA' },
  { id: 'peta', label: 'Peta lahan', icon: Map, group: 'RUANG KERJA' },
  { id: 'lahan', label: 'Lahan', icon: MapPinned, group: 'PERTANIAN' },
  { id: 'siklus', label: 'Siklus budidaya', icon: CalendarDays, group: 'PERTANIAN' },
  { id: 'prediksi', label: 'Prediksi panen', icon: TrendingUp, group: 'PERTANIAN' },
  { id: 'cuaca', label: 'Cuaca & risiko', icon: CloudSun, group: 'PERTANIAN' },
  { id: 'scan', label: 'Scan tanaman', icon: ScanLine, group: 'PERTANIAN' },
  { id: 'aktivitas', label: 'Log aktivitas', icon: Activity, group: 'PERTANIAN' },
  { id: 'pengguna', label: 'Pengguna', icon: Users, group: 'ORGANISASI' },
  { id: 'organisasi', label: 'Organisasi', icon: Building2, group: 'ORGANISASI' },
  { id: 'komunitas', label: 'Komunitas', icon: UsersRound, group: 'ORGANISASI' },
  { id: 'laporan', label: 'Laporan', icon: FileBarChart2, group: 'LAINNYA' },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings, group: 'LAINNYA' },
];

export const plots = [
  { id: 'p1', name: 'Subak Sari', area: '12,4 ha', farmer: 'I Wayan Suarta', crop: 'Padi Inpari 32', phase: 'Vegetatif', status: 'Sehat', location: 'Tabanan, Bali', color: 'green', health: 94 },
  { id: 'p2', name: 'Lahan Mekar', area: '8,2 ha', farmer: 'Ni Made Rini', crop: 'Jagung Hibrida', phase: 'Generatif', status: 'Sehat', location: 'Tabanan, Bali', color: 'blue', health: 89 },
  { id: 'p3', name: 'Blok Timur', area: '6,8 ha', farmer: 'I Ketut Arta', crop: 'Cabai Merah', phase: 'Pematangan', status: 'Perhatian', location: 'Gianyar, Bali', color: 'gold', health: 71 },
  { id: 'p4', name: 'Kebun Kedaton', area: '5,1 ha', farmer: 'Ni Luh Sari', crop: 'Kopi Robusta', phase: 'Vegetatif', status: 'Sehat', location: 'Gianyar, Bali', color: 'green', health: 86 },
  { id: 'p5', name: 'Tegal Harum', area: '4,6 ha', farmer: 'I Made Putra', crop: 'Tomat', phase: 'Persiapan', status: 'Sehat', location: 'Badung, Bali', color: 'blue', health: 91 },
  { id: 'p6', name: 'Sawah Tengah', area: '9,3 ha', farmer: 'Ni Kadek Ayu', crop: 'Padi Ciherang', phase: 'Pembungaan', status: 'Perhatian', location: 'Tabanan, Bali', color: 'gold', health: 76 },
];

export const activities = [
  { title: 'Pemupukan · Subak Sari', plot: 'Selesai oleh I Wayan Suarta', time: '08:30', tone: 'leaf', icon: 'Sprout' },
  { title: 'Panen · Lahan Mekar', plot: 'Proses panen sedang berlangsung', time: 'Kemarin', tone: 'water', icon: 'Wheat' },
  { title: 'Penyemprotan · Blok Timur', plot: 'Selesai oleh I Ketut Arta', time: '2 hari lalu', tone: 'gold', icon: 'Spray' },
  { title: 'Pemangkasan · Kebun Kedaton', plot: 'Dijadwalkan minggu ini', time: '3 hari lalu', tone: 'leaf', icon: 'Leaf' },
];

export const commodityShare = [
  { label: 'Padi', value: 42, tone: 'green' },
  { label: 'Jagung', value: 24, tone: 'gold' },
  { label: 'Cabai', value: 18, tone: 'red' },
  { label: 'Kopi', value: 11, tone: 'blue' },
  { label: 'Lainnya', value: 5, tone: 'neutral' },
];

export const teamMembers = [
  { id: 'u1', name: 'Agus Dharma', email: 'agus@subaksari.id', role: 'Administrator', status: 'Aktif', last: 'Hari ini · 09:12', tone: 'green' },
  { id: 'u2', name: 'I Wayan Suarta', email: 'suarta@subaksari.id', role: 'Petani', status: 'Aktif', last: 'Hari ini · 07:45', tone: 'gold' },
  { id: 'u3', name: 'Ni Made Rini', email: 'rini@subaksari.id', role: 'Petani', status: 'Aktif', last: 'Kemarin', tone: 'blue' },
  { id: 'u4', name: 'I Ketut Arta', email: 'arta@subaksari.id', role: 'Manajer lapangan', status: 'Aktif', last: 'Kemarin', tone: 'green' },
  { id: 'u5', name: 'Ni Luh Sari', email: 'sari@subaksari.id', role: 'Petani', status: 'Undangan', last: '—', tone: 'gold' },
];

export const groups = [
  { name: 'Subak Sari', members: 52, area: '18,2 ha', tone: 'green' },
  { name: 'Tirta Amerta', members: 43, area: '14,8 ha', tone: 'blue' },
  { name: 'Mekar Tani', members: 39, area: '12,6 ha', tone: 'gold' },
  { name: 'Karya Pertiwi', members: 36, area: '11,4 ha', tone: 'violet' },
  { name: 'Sari Bumi', members: 28, area: '9,6 ha', tone: 'green' },
  { name: 'Ayu Lestari', members: 24, area: '8,4 ha', tone: 'blue' },
];

export const reports = [
  { id: 'r1', title: 'Laporan hasil panen', desc: 'Estimasi benchmark hasil per komoditas dan siklus aktif.', period: 'Data langsung saat ekspor', icon: 'Wheat', tone: 'gold', file: 'hasil-panen.csv' },
  { id: 'r2', title: 'Laporan lahan', desc: 'Luas, status, petani, dan sebaran petak organisasi.', period: 'Data langsung saat ekspor', icon: 'MapPinned', tone: 'green', file: 'laporan-lahan.csv' },
  { id: 'r3', title: 'Laporan aktivitas', desc: 'Aktivitas budidaya yang dicatat oleh anggota.', period: 'Data langsung saat ekspor', icon: 'Activity', tone: 'blue', file: 'aktivitas.csv' },
  { id: 'r4', title: 'Laporan cuaca & risiko', desc: 'Prakiraan cuaca lima hari untuk wilayah organisasi.', period: 'Data langsung saat ekspor', icon: 'CloudSun', tone: 'violet', file: 'cuaca.csv' },
];


