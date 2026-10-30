// Menyiapkan database uji terpisah (mapan_test) dan menerapkan migrasi.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env'), quiet: true });

export const TEST_DB = process.env.TEST_DB_NAME ?? 'mapan_test';
if (TEST_DB === (process.env.DB_NAME ?? 'mapan') && !process.env.ALLOW_TEST_ON_MAIN_DB) {
  throw new Error('TEST_DB_NAME tidak boleh sama dengan DB_NAME agar data nyata tidak tertimpa.');
}
process.env.DB_NAME = TEST_DB;
// Pembatas pendaftaran dilonggarkan agar suite uji tidak memicunya (diuji terpisah).
process.env.REGISTER_RATE_MAX = process.env.REGISTER_RATE_MAX ?? '500';

export async function prepareTestDatabase({ reset = true } = {}) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'mapan', password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  });
  try {
    if (reset) await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  } catch (error) {
    throw new Error(
      `Tidak bisa membuat database uji "${TEST_DB}": ${error.message}\n` +
      `Buat manual (sebagai root): CREATE DATABASE ${TEST_DB}; GRANT ALL ON ${TEST_DB}.* TO '${process.env.DB_USER}'@'%';`,
    );
  } finally {
    await conn.end();
  }
  const result = spawnSync(process.execPath, [path.resolve(here, '../scripts/migrate.js')], {
    env: { ...process.env, DB_NAME: TEST_DB }, encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`Migrasi uji gagal:\n${result.stdout}\n${result.stderr}`);
}
