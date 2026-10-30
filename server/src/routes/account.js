import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import express from 'express';
import { pool, query } from '../db.js';
import { config } from '../config.js';
import { HttpError, asyncHandler } from '../http.js';
import { requireAuth } from '../auth.js';
import { assertPasswordPolicy, hashPassword } from '../password.js';
import { createRateLimiter } from '../rateLimit.js';
import { passwordMatches, publicSession, setSessionCookie } from './auth.js';

/** Rute publik: pendaftaran mandiri (membuat akun + organisasi baru). */
export const publicAccountRouter = Router();
/** Rute akun yang butuh sesi. */
export const accountRouter = Router();

const ORG_TYPES = ['koperasi', 'gapoktan', 'perusahaan_agribisnis', 'lainnya'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, max: Number(process.env.REGISTER_RATE_MAX) || 6, code: 'TERLALU_BANYAK_PENDAFTARAN',
  message: 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam satu jam.',
});
const passwordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, max: 8, code: 'TERLALU_BANYAK_PERCOBAAN',
  message: 'Terlalu banyak percobaan ganti kata sandi. Coba lagi beberapa menit lagi.',
  keyFn: (req) => `u:${req.auth?.user_id ?? req.ip}`,
});

const clean = (value, max) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max + 1) : '');

function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'organisasi';
}

function parseCoordinates(body) {
  const rawLat = body?.latitude;
  const rawLon = body?.longitude;
  const empty = (v) => v === undefined || v === null || v === '';
  if (empty(rawLat) && empty(rawLon)) return { lat: null, lon: null };
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (empty(rawLat) || empty(rawLon) || !Number.isFinite(lat) || !Number.isFinite(lon)
    || lat < -11.5 || lat > 6.5 || lon < 94 || lon > 142) {
    throw new HttpError(400, 'KOORDINAT_TIDAK_VALID', 'Koordinat harus berpasangan dan berada di wilayah Indonesia.');
  }
  return { lat, lon };
}

publicAccountRouter.post('/auth/register', registerLimiter, asyncHandler(async (req, res) => {
  const fullName = clean(req.body?.full_name, 120);
  const email = clean(req.body?.email, 160).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const orgName = clean(req.body?.organization_name, 120);
  const orgType = req.body?.organization_type ?? 'koperasi';
  const regionName = clean(req.body?.region_name, 120);
  const regionId = req.body?.region_id ? Number(req.body.region_id) : null;

  if (fullName.length < 2 || fullName.length > 120) {
    throw new HttpError(400, 'NAMA_TIDAK_VALID', 'Nama lengkap wajib diisi (2–120 karakter).');
  }
  if (email.length > 160 || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'EMAIL_TIDAK_VALID', 'Format email tidak valid.');
  }
  assertPasswordPolicy(password, { email });
  if (orgName.length < 3 || orgName.length > 120) {
    throw new HttpError(400, 'NAMA_ORGANISASI_TIDAK_VALID', 'Nama organisasi/kelompok wajib diisi (3–120 karakter).');
  }
  if (!ORG_TYPES.includes(orgType)) {
    throw new HttpError(400, 'JENIS_ORGANISASI_TIDAK_VALID', `Jenis organisasi harus salah satu dari: ${ORG_TYPES.join(', ')}.`);
  }
  if (!regionId && (regionName.length < 2 || regionName.length > 120)) {
    throw new HttpError(400, 'WILAYAH_TIDAK_VALID', 'Nama wilayah (kabupaten/kota) wajib diisi.');
  }
  if (regionId !== null && (!Number.isSafeInteger(regionId) || regionId <= 0)) {
    throw new HttpError(400, 'WILAYAH_TIDAK_VALID', 'Wilayah yang dipilih tidak valid.');
  }
  const { lat, lon } = parseCoordinates(req.body);

  const passwordHash = await hashPassword(password);
  const connection = await pool.getConnection();
  let userId; let orgId;
  try {
    await connection.beginTransaction();
    const [dupes] = await connection.execute(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1 FOR UPDATE', [email],
    );
    if (dupes.length) {
      throw new HttpError(409, 'EMAIL_SUDAH_TERDAFTAR', 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
    }
    let finalRegionId = regionId;
    if (finalRegionId) {
      const [rows] = await connection.execute('SELECT id FROM regions WHERE id = ? LIMIT 1', [finalRegionId]);
      if (!rows.length) throw new HttpError(400, 'WILAYAH_TIDAK_VALID', 'Wilayah yang dipilih tidak ditemukan.');
    } else {
      const [regionResult] = await connection.execute(
        `INSERT INTO regions (level, name, latitude, longitude) VALUES ('kabupaten', ?, ?, ?)`,
        [regionName, lat, lon],
      );
      finalRegionId = regionResult.insertId;
    }
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, 'aktif')`,
      [fullName, email, passwordHash],
    );
    userId = userResult.insertId;
    const slug = `${slugify(orgName)}-${randomBytes(3).toString('hex')}`;
    const [orgResult] = await connection.execute(
      `INSERT INTO organizations (name, slug, type, region_id, status) VALUES (?, ?, ?, ?, 'aktif')`,
      [orgName, slug, orgType, finalRegionId],
    );
    orgId = orgResult.insertId;
    await connection.execute(
      `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'administrator', 'aktif', UTC_TIMESTAMP(6))`, [orgId, userId],
    );
    await connection.execute('INSERT INTO organization_settings (organization_id) VALUES (?)', [orgId]);
    await connection.execute(
      'INSERT INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [userId, orgId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'EMAIL_SUDAH_TERDAFTAR', 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
    }
    throw error;
  } finally {
    connection.release();
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await query(
    `INSERT INTO user_sessions (token_hash, user_id, organization_id, expires_at) VALUES (?, ?, ?, ?)`,
    [tokenHash, userId, orgId, new Date(Date.now() + config.sessionTtlHours * 3600 * 1000)],
  );
  setSessionCookie(res, token);
  res.setHeader('Cache-Control', 'no-store');
  res.status(201).json({ data: publicSession({
    user_id: userId, full_name: fullName, email, role: 'administrator', organization_id: orgId,
  }) });
}));

accountRouter.patch('/account/profile', requireAuth, asyncHandler(async (req, res) => {
  const fullName = clean(req.body?.full_name, 120);
  if (fullName.length < 2 || fullName.length > 120) {
    throw new HttpError(400, 'NAMA_TIDAK_VALID', 'Nama lengkap wajib diisi (2–120 karakter).');
  }
  await query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, req.auth.user_id]);
  res.json({ data: publicSession({ ...req.auth, full_name: fullName }) });
}));

/** ---------- Foto profil (avatar) ---------- */
const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const avatarFilePattern = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.img$/;
const avatarSignatureMatches = (buffer, type) => {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
};
const mimeFromAvatarSignature = (content) => {
  if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8) return 'image/jpeg';
  if (content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (content.length >= 12 && content.toString('ascii', 0, 4) === 'RIFF' && content.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
};

accountRouter.post('/account/avatar', requireAuth, express.raw({ type: [...avatarMimeTypes], limit: '5mb' }), asyncHandler(async (req, res) => {
  const mimeType = req.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!avatarMimeTypes.has(mimeType) || !Buffer.isBuffer(req.body) || req.body.length < 1 || req.body.length > 5 * 1024 * 1024) {
    throw new HttpError(400, 'AVATAR_TIDAK_VALID', 'Pilih JPEG, PNG, atau WEBP berukuran maksimal 5 MB.');
  }
  if (!avatarSignatureMatches(req.body, mimeType)) {
    throw new HttpError(400, 'ISI_AVATAR_TIDAK_VALID', 'Isi berkas tidak sesuai dengan jenis gambar.');
  }
  const fileName = `${randomUUID()}.img`;
  await mkdir(config.mediaDirectory, { recursive: true });
  const filePath = path.join(config.mediaDirectory, fileName);
  await writeFile(filePath, req.body, { flag: 'wx', mode: 0o600 });
  const current = await query('SELECT avatar_path FROM users WHERE id = ? LIMIT 1', [req.auth.user_id]);
  try {
    await query('UPDATE users SET avatar_path = ? WHERE id = ?', [fileName, req.auth.user_id]);
  } catch (error) {
    await unlink(filePath).catch(() => {});
    throw error;
  }
  const previous = current[0]?.avatar_path;
  if (previous && avatarFilePattern.test(previous)) {
    await unlink(path.join(config.mediaDirectory, previous)).catch(() => {});
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: publicSession({ ...req.auth, avatar_path: fileName }) });
}));

accountRouter.delete('/account/avatar', requireAuth, asyncHandler(async (req, res) => {
  const current = await query('SELECT avatar_path FROM users WHERE id = ? LIMIT 1', [req.auth.user_id]);
  const previous = current[0]?.avatar_path;
  if (previous) {
    if (avatarFilePattern.test(previous)) {
      await unlink(path.join(config.mediaDirectory, previous)).catch(() => {});
    }
    await query('UPDATE users SET avatar_path = NULL WHERE id = ?', [req.auth.user_id]);
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: publicSession({ ...req.auth, avatar_path: null }) });
}));

accountRouter.get('/account/avatar', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query('SELECT avatar_path FROM users WHERE id = ? LIMIT 1', [req.auth.user_id]);
  const fileName = rows[0]?.avatar_path;
  if (!fileName || !avatarFilePattern.test(fileName)) {
    throw new HttpError(404, 'AVATAR_TIDAK_DITEMUKAN', 'Foto profil belum diunggah.');
  }
  let content;
  try { content = await readFile(path.join(config.mediaDirectory, fileName)); }
  catch { throw new HttpError(404, 'AVATAR_TIDAK_DITEMUKAN', 'Foto profil tidak dapat dibaca.'); }
  res.setHeader('Content-Type', mimeFromAvatarSignature(content));
  res.setHeader('Content-Length', content.length);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(content);
}));

accountRouter.post('/account/change-password', requireAuth, passwordLimiter, asyncHandler(async (req, res) => {
  const current = typeof req.body?.current_password === 'string' ? req.body.current_password : '';
  const next = typeof req.body?.new_password === 'string' ? req.body.new_password : '';
  const rows = await query('SELECT password_hash, email FROM users WHERE id = ? LIMIT 1', [req.auth.user_id]);
  if (!rows[0] || !(await passwordMatches(current, rows[0].password_hash))) {
    throw new HttpError(401, 'KATA_SANDI_SALAH', 'Kata sandi saat ini tidak sesuai.');
  }
  assertPasswordPolicy(next, { email: rows[0].email });
  if (next === current) {
    throw new HttpError(400, 'KATA_SANDI_SAMA', 'Kata sandi baru harus berbeda dari yang lama.');
  }
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(next), req.auth.user_id]);
  // Cabut sesi lain di perangkat berbeda; sesi ini tetap aktif.
  await query(
    `UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(6)
      WHERE user_id = ? AND token_hash <> ? AND revoked_at IS NULL`,
    [req.auth.user_id, req.auth.token_hash],
  );
  res.json({ data: { changed: true } });
}));

