// Cek sintaks seluruh file backend (sama dengan langkah CI), lintas OS.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.js')) files.push(full);
  }
};
['server/src', 'server/scripts'].forEach(walk);

let failed = 0;
for (const file of files) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) {
    failed += 1;
    console.error(`GAGAL  ${file}\n${r.stderr}`);
  }
}
console.log(`Sintaks backend: ${files.length - failed}/${files.length} file OK`);
process.exit(failed ? 1 : 0);
