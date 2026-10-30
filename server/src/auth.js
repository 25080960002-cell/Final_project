import { createHash } from 'node:crypto';
import { query } from './db.js';
import { HttpError, parseId } from './http.js';

export const SESSION_COOKIE = 'mapan_session';

export function hashInvitationToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function readSessionToken(req) {
  const cookie = String(req.headers.cookie ?? '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? cookie.slice(SESSION_COOKIE.length + 1) : null;
}

export async function resolveSession(token) {
  if (!token || !/^[a-f\d]{64}$/i.test(token)) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const rows = await query(
    `SELECT s.user_id, s.organization_id, m.role, u.full_name, u.email, u.avatar_path
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN organization_members m
         ON m.user_id = s.user_id AND m.organization_id = s.organization_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL
        AND s.expires_at > UTC_TIMESTAMP(6) AND u.status = 'aktif'
        AND u.deleted_at IS NULL AND m.status = 'aktif'
      LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ? {
    user_id: rows[0].user_id,
    organization_id: rows[0].organization_id,
    role: rows[0].role,
    full_name: rows[0].full_name,
    email: rows[0].email,
    avatar_path: rows[0].avatar_path ?? null,
    token_hash: tokenHash,
  } : null;
}

export async function requireAuth(req, res, next) {
  try {
    const auth = await resolveSession(readSessionToken(req));
    if (!auth) throw new HttpError(401, 'SESI_TIDAK_VALID', 'Silakan masuk kembali untuk melanjutkan.');
    req.auth = auth;
    next();
  } catch (error) { next(error); }
}

export async function optionalAuth(req, res, next) {
  try {
    req.auth = await resolveSession(readSessionToken(req));
    next();
  } catch (error) { next(error); }
}

export function requireTenant(req, res, next) {
  try {
    const orgId = parseId(req.params.orgId, 'organization id');
    if (Number(req.auth?.organization_id) !== orgId) {
      throw new HttpError(404, 'ORGANISASI_TIDAK_DITEMUKAN', 'Organisasi tidak ditemukan.');
    }
    next();
  } catch (error) { next(error); }
}

export async function requireExtensionReadAccess(req, res, next) {
  if (req.auth?.role !== 'penyuluh') return next();
  try {
    const rows = await query(
      'SELECT extension_read_access FROM organization_settings WHERE organization_id = ? LIMIT 1',
      [req.auth.organization_id],
    );
    if (!rows[0] || !Boolean(rows[0].extension_read_access)) {
      throw new HttpError(403, 'AKSES_BACA_PENYULUH_NONAKTIF', 'Akses baca untuk penyuluh belum diaktifkan oleh administrator organisasi.');
    }
    next();
  } catch (error) { next(error); }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) {
      return next(new HttpError(403, 'AKSES_DITOLAK', 'Peran Anda tidak diizinkan melakukan aksi ini.'));
    }
    next();
  };
}
