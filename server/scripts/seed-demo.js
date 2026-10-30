// Seed DEMO: organisasi contoh dengan 1 akun per peran, lahan berpeta, siklus, tugas, dan aktivitas.
// Aman dijalankan berulang (dilewati bila organisasi demo sudah ada). Hanya untuk demo/penilaian,
// jangan dijalankan di produksi sungguhan (diblokir kecuali MAPAN_ALLOW_DEMO_SEED=true).
import { pool, closePool } from '../src/db.js';
import { hashPassword } from '../src/password.js';
import { isProduction } from '../src/config.js';

const DEMO_PASSWORD = process.env.MAPAN_DEMO_PASSWORD ?? 'DemoMapan2026';
const DEMO_SLUG = 'demo-gapoktan-tani-makmur';

if (isProduction && process.env.MAPAN_ALLOW_DEMO_SEED !== 'true') {
  console.error('Seed demo diblokir di production. Set MAPAN_ALLOW_DEMO_SEED=true bila memang disengaja.');
  process.exit(1);
}

const ACCOUNTS = [
  { key: 'admin', name: 'Siti Rahayu', email: 'admin@demo.mapan.id', role: 'administrator' },
  { key: 'manajer', name: 'Budi Santoso', email: 'manajer@demo.mapan.id', role: 'manajer_lapangan' },
  { key: 'petani', name: 'Wahyu Hidayat', email: 'petani@demo.mapan.id', role: 'petani' },
  { key: 'penyuluh', name: 'Dewi Lestari', email: 'penyuluh@demo.mapan.id', role: 'penyuluh' },
];

// [nama, luas ha, komoditas, status, fase, progres, kesehatan, pengelola, lat, lon]
const PLOTS = [
  ['Sawah Utara', 2.4, 'Padi', 'sehat', 'Vegetatif', 38, 92, 'petani', -7.1352, 110.4021],
  ['Sawah Tengah', 3.1, 'Padi', 'perhatian', 'Generatif', 64, 74, 'petani', -7.1391, 110.4064],
  ['Ladang Jagung Timur', 1.8, 'Jagung', 'sehat', 'Vegetatif', 45, 88, 'manajer', -7.1318, 110.4113],
  ['Kebun Cabai Selatan', 0.9, 'Cabai Merah', 'perhatian', 'Pematangan', 82, 69, 'manajer', -7.1427, 110.4032],
  ['Petak Tomat Barat', 0.6, 'Tomat', 'sehat', 'Persiapan', 8, 90, 'petani', -7.1376, 110.3987],
  ['Kebun Kopi Lereng', 4.2, 'Kopi Robusta', 'sehat', 'Vegetatif', 52, 85, 'manajer', -7.1294, 110.4156],
];

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [existing] = await connection.execute('SELECT id FROM organizations WHERE slug = ? LIMIT 1', [DEMO_SLUG]);
  if (existing.length) {
    await connection.rollback();
    console.log(`Organisasi demo sudah ada (ID ${existing[0].id}); dilewati.`);
  } else {
    const [region] = await connection.execute(
      `INSERT INTO regions (level, name, latitude, longitude) VALUES ('kabupaten', 'Kabupaten Semarang', -7.1349, 110.4047)`);
    const [org] = await connection.execute(
      `INSERT INTO organizations (name, slug, type, region_id, status, contact_email, description)
       VALUES ('Gapoktan Tani Makmur (DEMO)', ?, 'gapoktan', ?, 'aktif', 'halo@demo.mapan.id',
               'Organisasi contoh untuk demo MAPAN. Seluruh data di sini fiktif.')`,
      [DEMO_SLUG, region.insertId]);
    const orgId = org.insertId;
    await connection.execute('INSERT INTO organization_settings (organization_id, extension_read_access, weather_daily) VALUES (?, 1, 1)', [orgId]);

    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const ids = {};
    for (const account of ACCOUNTS) {
      const [user] = await connection.execute(
        `INSERT INTO users (full_name, email, password_hash, email_verified_at, status) VALUES (?, ?, ?, UTC_TIMESTAMP(6), 'aktif')`,
        [account.name, account.email, passwordHash]);
      ids[account.key] = user.insertId;
      await connection.execute(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'aktif', UTC_TIMESTAMP(6))`,
        [orgId, user.insertId, account.role]);
      await connection.execute('INSERT INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [user.insertId, orgId]);
    }

    const [group] = await connection.execute(
      `INSERT INTO farm_groups (organization_id, name, region_id, leader_user_id, established_year) VALUES (?, 'Kelompok Tani Sumber Rejeki', ?, ?, 2019)`,
      [orgId, region.insertId, ids.manajer]);

    const plotIds = [];
    for (const [i, [name, area, crop, status, phase, progress, health, owner, lat, lon]] of PLOTS.entries()) {
      const [plot] = await connection.execute(
        `INSERT INTO plots (organization_id, farm_group_id, region_id, code, name, area_ha, status, irrigation_type, soil_type, created_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Aluvial', ?)`,
        [orgId, group.insertId, region.insertId, `DEMO-${String(i + 1).padStart(3, '0')}`, name, area, status,
          crop === 'Padi' ? 'irigasi_teknis' : 'tadah_hujan', ids[owner]]);
      const plotId = plot.insertId;
      plotIds.push(plotId);
      await connection.execute('INSERT INTO plot_managers (plot_id, user_id, is_primary, assigned_on) VALUES (?, ?, TRUE, CURRENT_DATE)', [plotId, ids[owner]]);
      const d = 0.0011;
      const ring = `POLYGON((${lon - d} ${lat - d}, ${lon + d} ${lat - d}, ${lon + d} ${lat + d}, ${lon - d} ${lat + d}, ${lon - d} ${lat - d}))`;
      await connection.execute(
        `INSERT INTO plot_boundaries (plot_id, boundary, centroid, measured_area_ha)
         VALUES (?, ST_GeomFromText(?, 4326, 'axis-order=long-lat'), ST_GeomFromText(?, 4326, 'axis-order=long-lat'), ?)`,
        [plotId, ring, `POINT(${lon} ${lat})`, area]);
      await connection.execute('INSERT INTO plot_health_snapshots (plot_id, health_score, source, notes) VALUES (?, ?, \'manual\', \'Pengamatan awal demo\')', [plotId, health]);
      await connection.execute(
        `INSERT INTO organization_records (organization_id, author_user_id, plot_id, record_type, title, phase, progress, payload)
         VALUES (?, ?, ?, 'cycle', ?, ?, ?, ?)`,
        [orgId, ids.manajer, plotId, crop, phase, progress,
          JSON.stringify({ crop, plot: name, plot_id: plotId, area: `${area} ha`, phase, progress, status: status === 'sehat' ? 'Sehat' : 'Perhatian', harvest: 'Belum dijadwalkan' })]);
    }

    const tasks = [
      ['Pemupukan susulan Sawah Tengah', 'Urea 50 kg/ha · minggu ini', 'aktif', 2],
      ['Cek hama wereng Sawah Utara', 'Pengamatan rutin mingguan', 'aktif', 1],
      ['Panen cabai tahap 1', 'Siapkan tenaga panen', 'aktif', 4],
      ['Pasang mulsa petak tomat', 'Selesai kemarin', 'selesai', -1],
    ];
    for (const [title, meta, status, days] of tasks) {
      await connection.execute(
        `INSERT INTO organization_records (organization_id, author_user_id, record_type, title, due_at, payload, status)
         VALUES (?, ?, 'task', ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? DAY), ?, ?)`,
        [orgId, ids.admin, title, days, JSON.stringify({ meta }), status]);
    }
    const activities = [
      ['Pemupukan NPK', 0, 'petani'], ['Penyemprotan fungisida', 1, 'manajer'],
      ['Penyiangan gulma', 2, 'petani'], ['Pengairan berselang', 3, 'petani'],
    ];
    for (const [title, plotIndex, who] of activities) {
      await connection.execute(
        `INSERT INTO organization_records (organization_id, author_user_id, plot_id, record_type, title, payload)
         VALUES (?, ?, ?, 'activity', ?, ?)`,
        [orgId, ids[who], plotIds[plotIndex], title, JSON.stringify({ plot: PLOTS[plotIndex][0], plot_id: plotIds[plotIndex], description: title })]);
    }
    await connection.commit();
    console.log(`Seed demo selesai (organisasi ID ${orgId}). Kata sandi semua akun demo: ${DEMO_PASSWORD}`);
    for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(17)} ${a.email}`);
  }
} catch (error) {
  await connection.rollback();
  console.error(`Seed demo gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  connection.release();
  await closePool();
}
