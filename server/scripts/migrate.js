/**
 * Penerapkan migrasi MAPAN secara berurutan dan idempotent.
 *
 * Pemakaian (dari folder server/):
 *   npm run migrate                     # terapkan file yang belum pernah dijalankan
 *   npm run migrate -- --status         # tampilkan status migrasi
 *   npm run migrate -- --baseline       # tandai database lama sebagai sudah termigrasi
 *
 * Untuk database produksi, isi DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
 * lewat environment sebelum menjalankan perintah ini.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDirectory = path.resolve(here, '../../db');
const migrationsDirectory = path.join(dbDirectory, 'migrations');
const referenceSeed = path.join(dbDirectory, 'seeds', '000_reference_catalog.sql');

const args = new Set(process.argv.slice(2));
const baseline = args.has('--baseline');
const statusOnly = args.has('--status');

function log(message) {
  console.log(`[migrate] ${message}`);
}

async function collectFiles() {
  const names = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const files = names.map((name) => ({
    version: `migration/${name}`,
    label: name,
    file: path.join(migrationsDirectory, name),
  }));
  try {
    await readFile(referenceSeed, 'utf8');
    files.push({
      version: 'seed/000_reference_catalog.sql',
      label: 'seeds/000_reference_catalog.sql',
      file: referenceSeed,
    });
  } catch {
    log('Katalog referensi tidak ditemukan, dilewati.');
  }
  return files;
}

/** Buang perintah USE agar skema mengikuti DB_NAME yang dikonfigurasi. */
function normalizeSql(sql, database) {
  return sql
    .replace(/^\s*USE\s+`?[\w$-]+`?\s*;\s*$/gim, '')
    .replace(/^\s*CREATE\s+DATABASE[\s\S]*?;\s*$/gim, '')
    .replace(/\bUSE\s+`?mapan`?\s*;/gi, `USE \`${database.replace(/`/g, '')}\`;`);
}

async function tableExists(connection, database, table) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
    [database, table],
  );
  return rows.length > 0;
}

async function main() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: 'utf8mb4',
    multipleStatements: true,
    timezone: 'Z',
  });

  try {
    const files = await collectFiles();
    const hadTracker = await tableExists(connection, config.db.database, 'schema_migrations');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    VARCHAR(190) NOT NULL,
        applied_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedRows] = await connection.query('SELECT version FROM schema_migrations');
    const applied = new Set(appliedRows.map((row) => row.version));

    if (statusOnly) {
      for (const item of files) {
        log(`${applied.has(item.version) ? 'OK     ' : 'PENDING'} ${item.label}`);
      }
      return;
    }

    // Database lama yang dibuat manual belum punya pencatat migrasi. Jangan
    // menjalankan ALTER/CREATE ulang; minta pengguna memakai --baseline.
    const legacyDatabase = !hadTracker
      && !applied.size
      && (await tableExists(connection, config.db.database, 'organizations'));
    if (legacyDatabase && !baseline) {
      throw new Error(
        'Database sudah berisi tabel MAPAN tetapi belum punya tabel schema_migrations. '
        + 'Jalankan "npm run migrate -- --baseline" sekali untuk menandai migrasi lama, '
        + 'lalu gunakan "npm run migrate" untuk migrasi berikutnya.',
      );
    }

    let executed = 0;
    for (const item of files) {
      if (applied.has(item.version)) continue;
      if (baseline) {
        await connection.execute('INSERT IGNORE INTO schema_migrations (version) VALUES (?)', [item.version]);
        log(`BASELINE ${item.label}`);
        continue;
      }
      const sql = normalizeSql(await readFile(item.file, 'utf8'), config.db.database);
      log(`Menjalankan ${item.label}…`);
      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [item.version]);
      executed += 1;
    }

    log(executed === 0 ? 'Tidak ada migrasi baru. Database sudah terbaru.' : `${executed} migrasi diterapkan.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`[migrate] Gagal: ${error.message}`);
  process.exitCode = 1;
});
