import { createPublicKey, verify } from 'node:crypto';

const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let cachedKeys = new Map();
let keysExpireAt = 0;

export class GoogleVerificationError extends Error {
  constructor(message, unavailable = false) {
    super(message);
    this.name = 'GoogleVerificationError';
    this.unavailable = unavailable;
  }
}

async function getGoogleKey(kid) {
  if (Date.now() >= keysExpireAt || !cachedKeys.has(kid)) {
    let response;
    try {
      response = await fetch(GOOGLE_KEYS_URL, { signal: AbortSignal.timeout(5000) });
    } catch {
      throw new GoogleVerificationError('Layanan verifikasi Google sedang tidak tersedia.', true);
    }
    if (!response.ok) throw new GoogleVerificationError('Layanan verifikasi Google sedang tidak tersedia.', true);
    const body = await response.json().catch(() => null);
    if (!Array.isArray(body?.keys)) throw new GoogleVerificationError('Kunci verifikasi Google tidak valid.', true);
    cachedKeys = new Map(body.keys.filter((key) => key.kid && key.kty === 'RSA').map((key) => [key.kid, key]));
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/i)?.[1] ?? 300);
    keysExpireAt = Date.now() + Math.max(60, Math.min(maxAge, 3600)) * 1000;
  }
  return cachedKeys.get(kid);
}

export async function verifyGoogleIdToken(token, audience) {
  if (typeof token !== 'string' || token.length > 12000) throw new GoogleVerificationError('Token Google tidak valid.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new GoogleVerificationError('Token Google tidak valid.');

  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new GoogleVerificationError('Token Google tidak valid.');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new GoogleVerificationError('Token Google tidak valid.');
  const jwk = await getGoogleKey(header.kid);
  if (!jwk) throw new GoogleVerificationError('Token Google sudah kedaluwarsa atau tidak dikenali.');

  let signatureValid = false;
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    signatureValid = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'));
  } catch {
    throw new GoogleVerificationError('Token Google tidak valid.');
  }
  const audienceMatches = Array.isArray(claims.aud)
    ? claims.aud.includes(audience) && (claims.aud.length === 1 || claims.azp === audience)
    : claims.aud === audience;
  if (!signatureValid || !audienceMatches || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) {
    throw new GoogleVerificationError('Akun Google tidak dapat diverifikasi untuk aplikasi ini.');
  }
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || claims.exp <= now || claims.iat > now + 60) {
    throw new GoogleVerificationError('Sesi Google kedaluwarsa. Coba masuk kembali.');
  }
  if (claims.email_verified !== true || typeof claims.email !== 'string' || !claims.email.toLowerCase().endsWith('@gmail.com')) {
    throw new GoogleVerificationError('Gunakan akun Gmail yang alamatnya sudah terverifikasi.');
  }
  if (typeof claims.sub !== 'string' || claims.sub.length < 1 || claims.sub.length > 255) throw new GoogleVerificationError('Identitas Google tidak valid.');
  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    name: typeof claims.name === 'string' ? claims.name.trim().slice(0, 120) : '',
  };
}
