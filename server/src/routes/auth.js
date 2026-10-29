import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import { pool, query } from '../db.js';
import { config } from '../config.js';
import { HttpError, asyncHandler, parseId } from '../http.js';
import { hashInvitationToken, optionalAuth, readSessionToken, SESSION_COOKIE, requireAuth } from '../auth.js';
import { GoogleVerificationError, verifyGoogleIdToken } from '../google.js';

const scrypt = promisify(scryptCallback);
export const authRouter = Router();
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED_IDENTITIES = 5000;
let lastPrunedAt = 0;

authRouter.get('/auth/google-config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: { enabled: Boolean(config.googleClientId), client_id: config.googleClientId || null } });
});

function pruneAttempts(now) {
  if (attempts.size < MAX_TRACKED_IDENTITIES && now - lastPrunedAt < 60_000) return;
  lastPrunedAt = now;
  for (const [ip, timestamps] of attempts) {
    const recent = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (recent.length) attempts.set(ip, recent);
    else attempts.delete(ip);
  }
  while (attempts.size > MAX_TRACKED_IDENTITIES) attempts.delete(attempts.keys().next().value);
}

authRouter.post('/auth/invitation-info', asyncHandler(async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!/^[a-f\d]{64}$/i.test(token)) throw new HttpError(404, 'UNDANGAN_TIDAK_DITEMUKAN', 'Undangan tidak ditemukan.');
  const tokenHash = hashInvitationToken(token);
  const rows = await query(
    `SELECT i.organization_id, i.email, i.invitee_name, o.name AS organization_name, i.expires_at
       FROM organization_invitations i JOIN organizations o ON o.id = i.organization_id
      WHERE i.token IN (?, ?) AND i.status = 'pending' AND i.expires_at > UTC_TIMESTAMP(6)
      LIMIT 1`, [tokenHash, token],
  );
  if (!rows[0]) throw new HttpError(410, 'UNDANGAN_KEDALUWARSA', 'Undangan sudah digunakan atau kedaluwarsa.');
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: rows[0] });
}));

function publicSession(auth) {
  return {
    user: { id: auth.user_id, name: auth.full_name, email: auth.email, role: auth.role },
    organization_id: auth.organization_id,
  };
}

async function passwordMatches(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, salt, expectedHex] = stored.split('$');
  if (scheme !== 'scrypt' || !/^[a-f\d]{32}$/i.test(salt ?? '') || !/^[a-f\d]{128}$/i.test(expectedHex ?? '')) return false;
  const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
}

function cookieAttributes() {
  const sameSite = config.cookieSameSite === 'none' ? 'None' : config.cookieSameSite === 'strict' ? 'Strict' : 'Lax';
  return `HttpOnly; SameSite=${sameSite}; Path=/api${config.cookieSecure ? '; Secure' : ''}`;
}

function setSessionCookie(res, token) {
  const maxAge = config.sessionTtlHours * 60 * 60;
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieAttributes()}; Max-Age=${maxAge}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`);
}

authRouter.post('/auth/login', asyncHandler(async (req, res) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  pruneAttempts(now);
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const requestedOrgId = req.body?.organization_id === undefined || req.body.organization_id === ''
    ? null
    : parseId(req.body.organization_id, 'organization id');
  if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 200) {
    throw new HttpError(400, 'KREDENSIAL_TIDAK_VALID', 'Email atau kata sandi tidak valid.');
  }
  const attemptKeys = [`ip:${ip}`, `email:${email}`];
  const recentAttempts = new Map(attemptKeys.map((key) => [
    key, (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS),
  ]));
  if ([...recentAttempts.values()].some((recent) => recent.length >= MAX_ATTEMPTS)) {
    throw new HttpError(429, 'TERLALU_BANYAK_PERCOBAAN', 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.');
  }
  const rows = await query(
    `SELECT id, full_name, email, password_hash
       FROM users
      WHERE LOWER(email) = ? AND status = 'aktif' AND deleted_at IS NULL LIMIT 1`,
    [email],
  );
  if (!rows[0] || !(await passwordMatches(password, rows[0]?.password_hash))) {
    for (const [key, recent] of recentAttempts) {
      if (!attempts.has(key) && attempts.size >= MAX_TRACKED_IDENTITIES) attempts.delete(attempts.keys().next().value);
      recent.push(now);
      attempts.set(key, recent);
    }
    throw new HttpError(401, 'KREDENSIAL_TIDAK_VALID', 'Email atau kata sandi salah.');
  }
  const memberships = await query(
    `SELECT m.organization_id, m.role
       FROM organization_members m
       JOIN organizations o ON o.id = m.organization_id
      WHERE m.user_id = ? AND m.status = 'aktif'
        AND o.status = 'aktif' AND o.deleted_at IS NULL
      ORDER BY m.organization_id`,
    [rows[0].id],
  );
  const preferences = await query(
    'SELECT last_organization_id FROM user_preferences WHERE user_id = ? LIMIT 1',
    [rows[0].id],
  );
  const selectedMembership = requestedOrgId
    ? memberships.find((membership) => Number(membership.organization_id) === requestedOrgId)
    : memberships.find((membership) => Number(membership.organization_id) === Number(preferences[0]?.last_organization_id)) ?? memberships[0];
  if (!selectedMembership) {
    throw new HttpError(403, 'KEANGGOTAAN_TIDAK_AKTIF', 'Akun belum memiliki keanggotaan aktif pada organisasi. Hubungi administrator organisasi.');
  }
  for (const key of attemptKeys) attempts.delete(key);
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000);
  await query(
    `INSERT INTO user_sessions (token_hash, user_id, organization_id, expires_at)
     VALUES (?, ?, ?, ?)`,
    [tokenHash, rows[0].id, selectedMembership.organization_id, expiresAt],
  );
  await query(
    'INSERT INTO user_preferences (user_id, last_organization_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_organization_id = VALUES(last_organization_id)',
    [rows[0].id, selectedMembership.organization_id],
  );
  setSessionCookie(res, token);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: publicSession({
    user_id: rows[0].id, full_name: rows[0].full_name,
    email: rows[0].email, role: selectedMembership.role, organization_id: selectedMembership.organization_id,
  }) });
}));

authRouter.post('/auth/google', asyncHandler(async (req, res) => {
  if (!config.googleClientId) throw new HttpError(503, 'GOOGLE_BELUM_DIKONFIGURASI', 'Login Google belum dikonfigurasi.');
  let google;
  try {
    google = await verifyGoogleIdToken(req.body?.credential, config.googleClientId);
  } catch (error) {
    if (error instanceof GoogleVerificationError && error.unavailable) throw new HttpError(503, 'GOOGLE_TIDAK_TERSEDIA', error.message);
    throw new HttpError(401, 'GOOGLE_TIDAK_VALID', error.message || 'Akun Google tidak dapat diverifikasi.');
  }

  const mode = req.body?.mode;
  if (!['login', 'signup', 'invitation'].includes(mode)) throw new HttpError(400, 'MODE_TIDAK_VALID', 'Pilih mode masuk atau daftar.');
  const connection = await pool.getConnection();
  let sessionInfo;
  let sessionToken;
  let pendingApproval = false;
  let resultOrganizationId = null;
  try {
    await connection.beginTransaction();
    const [identityRows] = await connection.execute(
      `SELECT u.id, u.full_name, u.email, u.status
         FROM google_identities gi JOIN users u ON u.id = gi.user_id
        WHERE gi.google_sub = ? AND u.deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [google.sub],
    );
    let user = identityRows[0] ?? null;

    if (!user && mode === 'login') {
      const [emailRows] = await connection.execute(
        `SELECT id, full_name, email, status FROM users
          WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
        [google.email],
      );
      user = emailRows[0] ?? null;
      if (user?.status === 'aktif') {
        const googleName = typeof google.name === 'string' ? google.name.trim().slice(0, 120) : '';
        if (user.full_name === 'Nama dari Google' && googleName) {
          user.full_name = googleName;
          await connection.execute(
            'UPDATE users SET full_name = ?, email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP(6)) WHERE id = ?',
            [googleName, user.id],
          );
        } else {
          await connection.execute(
            'UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP(6)) WHERE id = ?',
            [user.id],
          );
        }
        await connection.execute(
          'INSERT INTO google_identities (google_sub, user_id, email) VALUES (?, ?, ?)',
          [google.sub, user.id, google.email],
        );
      }
    }

    let organizationId;
    let role;
    if (mode === 'invitation') {
      const invitationToken = typeof req.body?.invitation_token === 'string' ? req.body.invitation_token : '';
      if (!/^[a-f\d]{64}$/i.test(invitationToken)) throw new HttpError(400, 'UNDANGAN_TIDAK_VALID', 'Tautan undangan tidak valid.');
      const [invitationRows] = await connection.execute(
        `SELECT i.id, i.organization_id, i.email, i.invitee_name, i.role, s.join_approval
           FROM organization_invitations i
           JOIN organizations o ON o.id = i.organization_id
           LEFT JOIN organization_settings s ON s.organization_id = i.organization_id
          WHERE i.token IN (?, ?) AND i.status = 'pending' AND i.expires_at > UTC_TIMESTAMP(6)
            AND o.status = 'aktif' AND o.deleted_at IS NULL
          LIMIT 1 FOR UPDATE`,
        [hashInvitationToken(invitationToken), invitationToken],
      );
      const invitation = invitationRows[0];
      if (!invitation) throw new HttpError(410, 'UNDANGAN_KEDALUWARSA', 'Undangan tidak ditemukan, sudah dipakai, atau kedaluwarsa.');
      if (invitation.email.toLowerCase() !== google.email) throw new HttpError(403, 'EMAIL_UNDANGAN_BERBEDA', 'Masuk dengan Gmail yang menerima undangan.');

      if (!user) {
        const [emailRows] = await connection.execute(
          'SELECT id, full_name, email, status FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE',
          [google.email],
        );
        user = emailRows[0] ?? null;
      }
      if (user && user.status !== 'aktif') throw new HttpError(403, 'AKUN_NONAKTIF', 'Akun ini tidak aktif. Hubungi administrator organisasi.');
      if (!user) {
        const fullName = google.name || invitation.invitee_name || google.email.split('@')[0];
        const [userResult] = await connection.execute(
          `INSERT INTO users (full_name, email, password_hash, email_verified_at, status)
           VALUES (?, ?, NULL, UTC_TIMESTAMP(6), 'aktif')`,
          [fullName, google.email],
        );
        user = { id: userResult.insertId, full_name: fullName, email: google.email, status: 'aktif' };
      }
      if (!identityRows.length) {
        await connection.execute(
          'INSERT INTO google_identities (google_sub, user_id, email) VALUES (?, ?, ?)',
          [google.sub, user.id, google.email],
        );
      }
      const [existingMembership] = await connection.execute(
        'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? LIMIT 1 FOR UPDATE',
        [invitation.organization_id, user.id],
      );
      if (existingMembership.length) throw new HttpError(409, 'ANGGOTA_SUDAH_TERDAFTAR', 'Akun ini sudah menjadi anggota organisasi tersebut.');
      pendingApproval = Boolean(invitation.join_approval);
      await connection.execute(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES (?, ?, ?, ?, ?)`,
        [invitation.organization_id, user.id, invitation.role, pendingApproval ? 'undangan' : 'aktif', pendingApproval ? null : new Date()],
      );
      await connection.execute(
        "UPDATE organization_invitations SET status = 'diterima', accepted_at = UTC_TIMESTAMP(6) WHERE id = ?",
        [invitation.id],
      );
      await connection.execute('INSERT IGNORE INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [user.id, invitation.organization_id]);
      organizationId = invitation.organization_id;
      role = invitation.role;
    } else if (mode === 'signup') {
      const submittedName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      const organizationName = typeof req.body?.organization_name === 'string' ? req.body.organization_name.trim() : '';
      const organizationType = typeof req.body?.organization_type === 'string' ? req.body.organization_type : '';
      const regionId = parseId(req.body?.region_id, 'wilayah');
      if (submittedName.length < 2 || submittedName.length > 120) {
        throw new HttpError(400, 'NAMA_PENGGUNA_TIDAK_VALID', 'Nama lengkap wajib diisi (2–120 karakter).');
      }
      if (phone.length > 32 || (phone && !/^\+?[0-9][0-9\s().-]{6,30}$/.test(phone))) {
        throw new HttpError(400, 'NOMOR_HP_TIDAK_VALID', 'Masukkan nomor HP yang valid.');
      }
      if (organizationName.length < 2 || organizationName.length > 160) {
        throw new HttpError(400, 'NAMA_ORGANISASI_TIDAK_VALID', 'Nama organisasi wajib diisi (2–160 karakter).');
      }
      if (!['koperasi', 'gapoktan', 'perusahaan_agribisnis', 'lainnya'].includes(organizationType)) {
        throw new HttpError(400, 'JENIS_ORGANISASI_TIDAK_VALID', 'Pilih jenis organisasi yang tersedia.');
      }
      const [regionRows] = await connection.execute('SELECT id FROM regions WHERE id = ? LIMIT 1', [regionId]);
      if (!regionRows[0]) throw new HttpError(400, 'WILAYAH_TIDAK_VALID', 'Pilih wilayah yang tersedia.');
      if (user || identityRows.length) throw new HttpError(409, 'AKUN_SUDAH_TERDAFTAR', 'Akun Gmail ini sudah terdaftar. Pilih Masuk.');
      if (phone) {
        const [phoneRows] = await connection.execute('SELECT id FROM users WHERE phone = ? LIMIT 1 FOR UPDATE', [phone]);
        if (phoneRows[0]) throw new HttpError(409, 'NOMOR_HP_SUDAH_TERDAFTAR', 'Nomor HP ini sudah digunakan akun lain.');
      }

      const fullName = submittedName || google.name || google.email.split('@')[0];
      const [userResult] = await connection.execute(
        `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
         VALUES (?, ?, ?, NULL, UTC_TIMESTAMP(6), 'aktif')`,
        [fullName, google.email, phone || null],
      );
      user = { id: userResult.insertId, full_name: fullName, email: google.email, phone: phone || null, status: 'aktif' };
      await connection.execute(
        'INSERT INTO google_identities (google_sub, user_id, email) VALUES (?, ?, ?)',
        [google.sub, user.id, google.email],
      );

      const slugBase = organizationName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 52) || 'organisasi';
      const slug = `${slugBase}-${randomBytes(4).toString('hex')}`;
      const [organizationResult] = await connection.execute(
        `INSERT INTO organizations (name, slug, type, region_id, contact_email, status)
         VALUES (?, ?, ?, ?, ?, 'aktif')`,
        [organizationName, slug, organizationType, regionId, google.email],
      );
      organizationId = organizationResult.insertId;
      role = 'administrator';
      await connection.execute(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES (?, ?, 'administrator', 'aktif', UTC_TIMESTAMP(6))`,
        [organizationId, user.id],
      );
      await connection.execute('INSERT IGNORE INTO organization_settings (organization_id) VALUES (?)', [organizationId]);
      await connection.execute('INSERT IGNORE INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [user.id, organizationId]);
    } else {
      if (!user || user.status !== 'aktif') throw new HttpError(404, 'AKUN_BELUM_TERDAFTAR', 'Akun ini belum terdaftar. Pilih Daftar untuk membuat akun organisasi.');
      const [memberships] = await connection.execute(
        `SELECT m.organization_id, m.role
           FROM organization_members m JOIN organizations o ON o.id = m.organization_id
          WHERE m.user_id = ? AND m.status = 'aktif' AND o.status = 'aktif' AND o.deleted_at IS NULL
          ORDER BY m.organization_id`,
        [user.id],
      );
      if (!memberships.length) throw new HttpError(403, 'AKUN_BELUM_AKTIF', 'Akun belum memiliki keanggotaan aktif. Hubungi administrator organisasi.');
      const [preferenceRows] = await connection.execute('SELECT last_organization_id FROM user_preferences WHERE user_id = ? LIMIT 1', [user.id]);
      const preferred = memberships.find((membership) => Number(membership.organization_id) === Number(preferenceRows[0]?.last_organization_id));
      const membership = preferred ?? memberships[0];
      organizationId = membership.organization_id;
      role = membership.role;
      await connection.execute(
        'INSERT IGNORE INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)',
        [user.id, organizationId],
      );
      await connection.execute('UPDATE user_preferences SET last_organization_id = ? WHERE user_id = ?', [organizationId, user.id]);
    }
    resultOrganizationId = organizationId;

    if (!pendingApproval) {
      await connection.execute('UPDATE users SET last_active_at = UTC_TIMESTAMP(6) WHERE id = ?', [user.id]);
      sessionToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
      const expiresAt = new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000);
      await connection.execute(
        'INSERT INTO user_sessions (token_hash, user_id, organization_id, expires_at) VALUES (?, ?, ?, ?)',
        [tokenHash, user.id, organizationId, expiresAt],
      );
      sessionInfo = { user_id: user.id, full_name: user.full_name, email: user.email, role, organization_id: organizationId };
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'AKUN_SUDAH_TERDAFTAR', 'Akun Gmail ini sudah terhubung. Pilih Masuk.');
    throw error;
  } finally {
    connection.release();
  }

  if (!pendingApproval) setSessionCookie(res, sessionToken);
  res.setHeader('Cache-Control', 'no-store');
  if (mode === 'invitation') {
    return res.status(201).json({ data: { accepted: true, pending_approval: pendingApproval, organization_id: resultOrganizationId, ...(sessionInfo ? { session: publicSession(sessionInfo) } : {}) } });
  }
  res.status(mode === 'signup' ? 201 : 200).json({ data: publicSession(sessionInfo) });
}));

authRouter.post('/auth/accept-invitation', asyncHandler(async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const fullName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[a-f\d]{64}$/i.test(token) || !fullName || fullName.length > 120 || password.length < 12 || password.length > 200) {
    throw new HttpError(400, 'UNDANGAN_TIDAK_VALID', 'Tautan, nama, atau kata sandi undangan tidak valid. Kata sandi minimal 12 karakter.');
  }
  const connection = await pool.getConnection();
  let organizationId;
  let pendingApproval = false;
  try {
    await connection.beginTransaction();
    const [invitations] = await connection.execute(
      `SELECT id, organization_id, email, role, invitee_name
         FROM organization_invitations
        WHERE token IN (?, ?) AND status = 'pending' AND expires_at > UTC_TIMESTAMP(6)
        LIMIT 1 FOR UPDATE`, [hashInvitationToken(token), token],
    );
    const invitation = invitations[0];
    if (!invitation) throw new HttpError(410, 'UNDANGAN_KEDALUWARSA', 'Undangan tidak ditemukan, sudah dipakai, atau telah kedaluwarsa.');
    const [existingUsers] = await connection.execute('SELECT id, password_hash, status FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE', [invitation.email.toLowerCase()]);
    let userId = existingUsers[0]?.id;
    if (userId) {
      const [memberRows] = await connection.execute('SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? LIMIT 1 FOR UPDATE', [invitation.organization_id, userId]);
      if (memberRows.length) throw new HttpError(409, 'ANGGOTA_SUDAH_TERDAFTAR', 'Akun ini sudah terdaftar di organisasi tersebut.');
      if (existingUsers[0].status !== 'aktif' || !(await passwordMatches(password, existingUsers[0].password_hash))) {
        throw new HttpError(401, 'AKUN_SUDAH_ADA', 'Email sudah memiliki akun. Masukkan kata sandi akun tersebut untuk menerima undangan.');
      }
    } else {
      const salt = randomBytes(16);
      const hash = await scrypt(password, salt, 64);
      const passwordHash = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
      const [userResult] = await connection.execute(
        `INSERT INTO users (full_name, email, password_hash, email_verified_at, status) VALUES (?, ?, ?, UTC_TIMESTAMP(6), 'aktif')`,
        [fullName, invitation.email, passwordHash],
      );
      userId = userResult.insertId;
    }
    const [settingRows] = await connection.execute('SELECT join_approval FROM organization_settings WHERE organization_id = ?', [invitation.organization_id]);
    const requiresApproval = Boolean(settingRows[0]?.join_approval);
    await connection.execute(
      `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?)`,
      [invitation.organization_id, userId, invitation.role, requiresApproval ? 'undangan' : 'aktif', requiresApproval ? null : new Date()],
    );
    await connection.execute('UPDATE organization_invitations SET status = \'diterima\', accepted_at = UTC_TIMESTAMP(6) WHERE id = ?', [invitation.id]);
    await connection.execute('INSERT IGNORE INTO user_preferences (user_id, last_organization_id) VALUES (?, ?)', [userId, invitation.organization_id]);
    await connection.commit();
    organizationId = invitation.organization_id;
    pendingApproval = requiresApproval;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.status(201).json({ data: { accepted: true, pending_approval: pendingApproval, organization_id: organizationId } });
}));

authRouter.get('/auth/session', optionalAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: req.auth ? publicSession(req.auth) : null });
});

authRouter.post('/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE token_hash = ? AND revoked_at IS NULL', [req.auth.token_hash]);
  clearSessionCookie(res);
  res.json({ data: { logged_out: true } });
}));
