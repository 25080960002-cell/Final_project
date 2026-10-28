import { query, closePool } from '../src/db.js';

const rows = await query(
  `SELECT
     (SELECT COUNT(*) FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE') AS tabel,
     (SELECT COUNT(*) FROM organizations) AS organisasi,
     (SELECT COUNT(*) FROM users) AS pengguna,
     (SELECT COUNT(*) FROM organization_members) AS anggota,
     (SELECT COUNT(*) FROM farm_groups) AS kelompok,
     (SELECT COUNT(*) FROM plots) AS petak,
     (SELECT COALESCE(SUM(area_ha), 0) FROM plots) AS total_ha,
     (SELECT COUNT(*) FROM plot_boundaries) AS poligon,
     (SELECT COUNT(*) FROM plot_managers) AS pengelola,
     (SELECT COUNT(*) FROM plot_health_snapshots) AS kesehatan,
     (SELECT COUNT(*) FROM organization_invitations) AS undangan,
     (SELECT COUNT(*) FROM commodities) AS komoditas,
     (SELECT COUNT(*) FROM crop_varieties) AS varietas,
     (SELECT COUNT(*) FROM symptoms) AS gejala,
     (SELECT COUNT(*) FROM regions) AS wilayah`,
);

const row = rows[0];
const expected = {
  tabel: 21,
  organisasi: 1,
  pengguna: 9,
  anggota: 9,
  kelompok: 6,
  petak: 24,
  total_ha: 125,
  poligon: 2,
  pengelola: 25,
  kesehatan: 30,
  undangan: 2,
  komoditas: 5,
  varietas: 6,
  gejala: 4,
  wilayah: 8,
};

let gagal = 0;
console.log('Pemeriksaan isi database mapan');
console.log('---------------------------------------------------');
for (const [key, value] of Object.entries(row)) {
  const target = expected[key];
  const ok = Number(value) === target;
  if (!ok) gagal += 1;
  console.log(
    `${ok ? 'OK  ' : 'BEDA'} ${key.padEnd(12)} ${String(value).padStart(8)}  (harapan ${target})`,
  );
}
console.log('---------------------------------------------------');
console.log(gagal === 0 ? 'Semua angka sesuai seed sampel dan skema termigrasi.' : `${gagal} angka tidak sesuai.`);

await closePool();
process.exit(gagal === 0 ? 0 : 1);
