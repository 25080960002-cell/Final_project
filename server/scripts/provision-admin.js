import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { pool, closePool } from '../src/db.js';

const scrypt = promisify(scryptCallback);
const email = process.env.MAPAN_INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.MAPAN_INITIAL_ADMIN_PASSWORD;
const fullName = process.env.MAPAN_INITIAL_ADMIN_NAME?.trim() || 'Administrator MAPAN';
const organizationName = process.env.MAPAN_INITIAL_ORG_NAME?.trim();
const regionName = process.env.MAPAN_INITIAL_REGION_NAME?.trim();
const latitude = process.env.MAPAN_INITIAL_REGION_LATITUDE;
const longitude = process.env.MAPAN_INITIAL_REGION_LONGITUDE;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12 || /^(ganti_|change.?me|password)/i.test(password) || !organizationName || !regionName) {
  console.error('Isi MAPAN_INITIAL_ADMIN_EMAIL, MAPAN_INITIAL_ADMIN_PASSWORD (min. 12 karakter), MAPAN_INITIAL_ORG_NAME, dan MAPAN_INITIAL_REGION_NAME.');
  process.exitCode = 1;
} else {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orgs] = await connection.execute('SELECT id FROM organizations LIMIT 1 FOR UPDATE');
    if (orgs.length) throw new Error('Database sudah memiliki organisasi. Provisioning awal dibatalkan.');
    const lat = latitude === undefined || latitude === '' ? null : Number(latitude);
    const lon = longitude === undefined || longitude === '' ? null : Number(longitude);
    if ((lat === null) !== (lon === null) || (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180))) {
      throw new Error('Koordinat wilayah harus diisi berpasangan dan berada pada rentang latitude/longitude yang valid.');
    }
    const slugBase = organizationName.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'organisasi';
    const [regionResult] = await connection.execute(
      `INSERT INTO regions (level, name, latitude, longitude) VALUES ('kabupaten', ?, ?, ?)`,
      [regionName, lat, lon],
    );
    const [orgResult] = await connection.execute(
      `INSERT INTO organizations (name, slug, type, region_id, status) VALUES (?, ?, 'koperasi', ?, 'aktif')`,
      [organizationName, slugBase, regionResult.insertId],
    );
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, 64);
    const passwordHash = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, password_hash, email_verified_at, status) VALUES (?, ?, ?, UTC_TIMESTAMP(6), 'aktif')`,
      [fullName, email, passwordHash],
    );
    await connection.execute(
      `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at) VALUES (?, ?, 'administrator', 'aktif', UTC_TIMESTAMP(6))`,
      [orgResult.insertId, userResult.insertId],
    );
    await connection.execute('INSERT INTO organization_settings (organization_id) VALUES (?)', [orgResult.insertId]);
    await connection.execute('INSERT INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [userResult.insertId, orgResult.insertId]);
    await connection.commit();
    console.log(`Administrator dibuat untuk organisasi ID ${orgResult.insertId}. Email: ${email}`);
  } catch (error) {
    await connection.rollback();
    console.error(`Provisioning gagal: ${error.message}`);
    process.exitCode = 1;
  } finally {
    connection.release();
    await closePool();
  }
}

if (process.exitCode && !email) await closePool();
