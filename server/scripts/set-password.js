import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { closePool, query } from '../src/db.js';

const scrypt = promisify(scryptCallback);
const email = process.env.MAPAN_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.MAPAN_ADMIN_PASSWORD;
try {
  if (!email || !password || password.length < 12 || password.length > 200 || /^(ganti_|change.?me|password)/i.test(password)) {
    throw new Error('Set MAPAN_ADMIN_EMAIL dan MAPAN_ADMIN_PASSWORD (12–200 karakter).');
  }
  const admins = await query(
    `SELECT u.id FROM users u JOIN organization_members m ON m.user_id = u.id
      WHERE LOWER(u.email) = ? AND m.role = 'administrator' AND m.status = 'aktif'
        AND u.status = 'aktif' AND u.deleted_at IS NULL`, [email],
  );
  if (!admins.length) throw new Error('Email tidak terdaftar sebagai administrator aktif.');
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  const stored = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
  await query(
    `UPDATE users u JOIN organization_members m ON m.user_id = u.id
        SET u.password_hash = ?
      WHERE LOWER(u.email) = ? AND m.role = 'administrator' AND m.status = 'aktif'`,
    [stored, email],
  );
  console.log(`Kata sandi admin diperbarui untuk ${admins.length} keanggotaan organisasi.`);
} catch (error) {
  console.error(`Gagal memperbarui kata sandi: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closePool();
}
