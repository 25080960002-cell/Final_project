import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
});

/**
 * Jalankan query berparameter. Selalu pakai `?`, jangan menyisipkan
 * nilai dari request langsung ke dalam string SQL.
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function ping() {
  const started = Date.now();
  const rows = await query('SELECT VERSION() AS version, DATABASE() AS nama_database');
  return { ...rows[0], latency_ms: Date.now() - started };
}

export async function closePool() {
  await pool.end();
}
