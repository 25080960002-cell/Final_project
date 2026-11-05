// Menjadikan berkas HTML menjadi PDF memakai browser Edge/Chrome terpasang (mode headless).
// Tanpa argumen: docs/laporan/laporan-tahap-akhir.html -> PDF sebelahnya.
// Dengan argumen: node scripts/report-pdf.mjs <input.html> [output.pdf]
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [argIn, argOut] = process.argv.slice(2);
const src = argIn ? resolve(argIn) : resolve(here, '../docs/laporan/laporan-tahap-akhir.html');
const out = argOut
  ? resolve(argOut)
  : src.replace(/\.html?$/i, '.pdf');

const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
];

const exe = candidates.find(existsSync);
if (!exe) {
  console.error(
    'Edge/Chrome tidak ditemukan.\n' +
      'Alternatif: buka docs/laporan/laporan-tahap-akhir.html di browser lalu Ctrl+P -> Simpan sebagai PDF.',
  );
  process.exit(1);
}

const res = spawnSync(
  exe,
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-pdf-header-footer',
    `--print-to-pdf=${out}`,
    `file:///${src.replace(/\\/g, '/')}`,
  ],
  { stdio: 'inherit' },
);

if (res.status === 0 && existsSync(out)) {
  console.log(`PDF dibuat: ${out}`);
} else {
  console.error('Gagal membuat PDF (kode keluar: ' + res.status + ').');
  process.exitCode = 1;
}
