// Dump database MAPAN menjadi satu berkas SQL siap kumpul sebagai deliverable.
// Jalankan: npm run db:dump           (struktur + data)
//           npm run db:dump -- --no-data   (struktur saja)
// Output : deliverables/mapan-db-dump.sql
// mysqldump dicari: PATH -> MAPAN_MYSQLDUMP env -> lokasi MySQL lokal umum (termasuk instalasi proyek ini).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '../server/.env');
if (!existsSync(envPath)) {
  console.error('server/.env tidak ada. Salin server/.env.example dulu lalu isi koneksi DB.');
  process.exit(1);
}
const env = {};
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const host = env.DB_HOST || '127.0.0.1';
const port = env.DB_PORT || '3306';
const user = env.DB_USER;
const password = env.DB_PASSWORD;
const database = env.DB_NAME;
if (!user || !database) {
  console.error('DB_USER/DB_NAME tidak ditemukan di server/.env');
  process.exit(1);
}

const candidates = [
  process.env.MAPAN_MYSQLDUMP,
  'C:/Users/ASUS/mysql-mapan/mysql-8.4.3-winx64/bin/mysqldump.exe',
  'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe',
  'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe',
].filter(Boolean);
const dumpExe = candidates.find(existsSync) ?? 'mysqldump';

const noData = process.argv.includes('--no-data');
const outDir = resolve(here, '../deliverables');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, noData ? 'mapan-db-struktur.sql' : 'mapan-db-dump.sql');

console.log(`mysqldump: ${dumpExe}`);
const res = spawnSync(
  dumpExe,
  [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    password ? `--password=${password}` : undefined,
    '--single-transaction',
    '--default-character-set=utf8mb4',
    '--routines',
    '--triggers',
    '--no-tablespaces',
    ...(noData ? ['--no-data'] : []),
    database,
  ].filter(Boolean),
  { stdio: ['ignore', 'pipe', 'inherit'] },
);

if (res.status !== 0) {
  console.error('Dump gagal. Set MAPAN_MYSQLDUMP jika lokasi mysqldump berbeda.');
  process.exit(1);
}

appendFileSync(outFile, res.stdout);
const header =
  `-- Dump MAPAN (database=${database}, host=${host}:${port})\n` +
  `-- Dibuat: ${new Date().toISOString()} · ${noData ? 'struktur saja' : 'struktur + data'}\n`;
writeFileSync(outFile, header + res.stdout);
console.log(`Dump ditulis: ${outFile} (${res.stdout.length.toLocaleString('id-ID')} byte)`);
