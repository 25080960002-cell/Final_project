import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env'), quiet: true });

const toInt = (value, fallback) => {
  if (value === undefined || value === null || !/^\d+$/.test(String(value))) return fallback;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : fallback;
};

const toList = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 4000),
  host: process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  trustProxy: process.env.TRUST_PROXY === 'true' ? 2 : false,
  sessionTtlHours: Math.min(Math.max(toInt(process.env.SESSION_TTL_HOURS, 8), 1), 168),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  mediaDirectory: process.env.MEDIA_DIR ?? path.resolve(here, '../uploads'),
  corsOrigins: toList(process.env.CORS_ORIGINS, 'http://localhost:5173,http://127.0.0.1:5173'),
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? 'zian',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'mapan',
    connectionLimit: toInt(process.env.DB_POOL_MAX, 10),
  },
};

export const isProduction = config.env === 'production';

export function validateConfig() {
  const errors = [];
  if (config.port < 1 || config.port > 65535) errors.push('PORT harus berada pada rentang 1–65535.');
  if (config.db.connectionLimit < 1 || config.db.connectionLimit > 100) errors.push('DB_POOL_MAX harus berada pada rentang 1–100.');
  if (isProduction) {
    if (!config.db.password || config.db.password.length < 16 || /^(ganti_|change.?me|password)/i.test(config.db.password)) {
      errors.push('DB_PASSWORD production wajib diisi dengan secret acak minimal 16 karakter.');
    }
    if (!config.db.user || !config.db.database) errors.push('DB_USER dan DB_NAME wajib diisi pada production.');
  }
  if (errors.length) throw new Error(`Konfigurasi MAPAN tidak valid:\n- ${errors.join('\n- ')}`);
}
