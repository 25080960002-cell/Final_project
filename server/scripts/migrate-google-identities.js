import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, pool } from '../src/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(here, '../../db/migrations/006_google_identities.sql');

try {
  const [rows] = await pool.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_identities'`,
  );
  if (rows.length) {
    console.log('Migrasi identitas Google sudah diterapkan.');
  } else {
    const source = await readFile(migrationPath, 'utf8');
    const statements = source
      .split(/\r?\n/)
      .filter((line) => !/^\s*(--|SET\s|USE\s)/i.test(line))
      .join('\n')
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    console.log('Migrasi identitas Google berhasil diterapkan.');
  }
} catch (error) {
  console.error(`Migrasi identitas Google gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closePool();
}
