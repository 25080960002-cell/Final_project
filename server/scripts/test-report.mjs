// Menjalankan suite uji API dan menulis docs/hasil-pengujian.md dari hasil run ASLI (bukan karangan).
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const run = spawnSync(process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=tap', 'test/api.test.js'], {
  cwd: path.resolve(here, '..'), encoding: 'utf8',
});
const lines = run.stdout.split('\n');
const rows = [];
for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i].match(/^\s*(not )?ok \d+ - (T\d+[a-z]?) (.+)$/);
  if (!m) continue;
  let duration = '';
  for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
    const d = lines[j].match(/duration_ms:\s*([\d.]+)/);
    if (d) { duration = `${Number(d[1]).toFixed(0)} ms`; break; }
  }
  rows.push({ code: m[2], name: m[3], ok: !m[1], duration });
}
const passed = rows.filter((r) => r.ok).length;
const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const md = `# Hasil Pengujian API (otomatis)

Dihasilkan oleh \`npm --prefix server run test:report\` pada **${stamp}**
(Node ${process.version}, database uji terpisah \`mapan_test\`, MySQL 8).

**Ringkasan: ${passed}/${rows.length} skenario lulus.**

| Kode | Skenario dan hasil yang diharapkan | Hasil aktual | Durasi |
| --- | --- | --- | --- |
${rows.map((r) => `| ${r.code} | ${r.name.replace(/\|/g, '/')} | ${r.ok ? '✅ LULUS' : '❌ GAGAL'} | ${r.duration} |`).join('\n')}

Catatan: kolom "Skenario" memuat langkah dan status HTTP yang diharapkan; tiap baris adalah
satu \`it(...)\` di \`server/test/api.test.js\` yang menjalankan permintaan HTTP sungguhan ke API.
`;
mkdirSync(path.join(root, 'docs'), { recursive: true });
writeFileSync(path.join(root, 'docs/hasil-pengujian-api.md'), md);
console.log(`${passed}/${rows.length} lulus -> docs/hasil-pengujian-api.md`);
process.exit(passed === rows.length && rows.length > 0 ? 0 : 1);
