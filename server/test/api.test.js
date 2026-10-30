import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prepareTestDatabase } from './setup.js';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, GOOD_PASSWORD, uniqueEmail } from './helpers.js';

let server; let baseUrl; let closePool;
const state = {};

const registerPayload = (label, extra = {}) => ({
  full_name: `Admin ${label}`, email: uniqueEmail(label), password: GOOD_PASSWORD,
  organization_name: `Koperasi ${label}`, organization_type: 'koperasi',
  region_name: 'Kabupaten Semarang', latitude: -7.15, longitude: 110.4, ...extra,
});

before(async () => {
  await prepareTestDatabase();
  const { createApp } = await import('../src/app.js');
  ({ closePool } = await import('../src/db.js'));
  const app = createApp();
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closePool();
});

describe('Kesehatan & dokumentasi API', () => {
  it('T01 GET /api/health -> 200 dan database tersambung', async () => {
    const res = await new Client(baseUrl).get('/api/health');
    assert.equal(res.status, 200);
    assert.ok(res.body);
  });
  it('T02 endpoint tidak ada: anonim -> 401 (tidak membocorkan rute), login -> 404 berformat error', async () => {
    assert.equal((await new Client(baseUrl).get('/api/tidak-ada')).status, 401);
    const c = new Client(baseUrl);
    await c.post('/api/auth/register', registerPayload('t02'));
    const res = await c.get('/api/tidak-ada');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'ENDPOINT_TIDAK_DITEMUKAN');
  });
});

describe('Pendaftaran & autentikasi', () => {
  it('T03 register valid -> 201, cookie sesi dibuat, peran administrator', async () => {
    state.a = new Client(baseUrl);
    state.aPayload = registerPayload('a');
    const res = await state.a.post('/api/auth/register', state.aPayload);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'administrator');
    assert.ok(state.a.cookie.startsWith('mapan_session='));
    state.orgA = res.body.data.organization_id;
    state.userA = res.body.data.user.id;
  });
  it('T04 session setelah register -> pengguna terbaca', async () => {
    const res = await state.a.get('/api/auth/session');
    assert.equal(res.body.data.user.email, state.aPayload.email.toLowerCase());
  });
  it('T05 register email ganda -> 409', async () => {
    const res = await new Client(baseUrl).post('/api/auth/register', { ...registerPayload('dup'), email: state.aPayload.email });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'EMAIL_SUDAH_TERDAFTAR');
  });
  it('T06 register kata sandi lemah / email salah / wilayah kosong -> 400', async () => {
    const c = new Client(baseUrl);
    assert.equal((await c.post('/api/auth/register', registerPayload('w1', { password: 'pendek1' }))).status, 400);
    assert.equal((await c.post('/api/auth/register', registerPayload('w2', { password: 'hanyahurufsaja' }))).status, 400);
    assert.equal((await c.post('/api/auth/register', registerPayload('w3', { email: 'bukan-email' }))).status, 400);
    assert.equal((await c.post('/api/auth/register', registerPayload('w4', { region_name: '', latitude: undefined, longitude: undefined }))).status, 400);
    assert.equal((await c.post('/api/auth/register', registerPayload('w5', { latitude: 99, longitude: 10 }))).status, 400);
    assert.equal((await c.post('/api/auth/register', registerPayload('w6', { organization_type: 'abc' }))).status, 400);
  });
  it('T07 login sandi salah -> 401 tanpa cookie', async () => {
    const c = new Client(baseUrl);
    const res = await c.post('/api/auth/login', { email: state.aPayload.email, password: 'salah-salah-123' });
    assert.equal(res.status, 401);
    assert.equal(c.cookie, '');
  });
  it('T08 login valid -> 200 dan cookie sesi', async () => {
    const c = new Client(baseUrl);
    const res = await c.post('/api/auth/login', { email: state.aPayload.email, password: GOOD_PASSWORD });
    assert.equal(res.status, 200);
    assert.ok(c.cookie);
  });
  it('T09 akses API tanpa sesi -> 401', async () => {
    const res = await new Client(baseUrl).get(`/api/organizations/${state.orgA}/dashboard`);
    assert.equal(res.status, 401);
  });
  it('T10 logout mencabut sesi: token lama yang dipakai ulang -> 401', async () => {
    const c = new Client(baseUrl);
    await c.post('/api/auth/login', { email: state.aPayload.email, password: GOOD_PASSWORD });
    const stolen = c.cookie;
    assert.ok(stolen);
    assert.equal((await c.get(`/api/organizations/${state.orgA}/dashboard`)).status, 200);
    assert.equal((await c.post('/api/auth/logout')).status, 200);
    const replay = new Client(baseUrl); replay.cookie = stolen;
    assert.equal((await replay.get(`/api/organizations/${state.orgA}/dashboard`)).status, 401);
  });
});

describe('Akun: profil & ganti kata sandi', () => {
  it('T11 ubah nama profil', async () => {
    const res = await state.a.patch('/api/account/profile', { full_name: 'Nama Baru Uji' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, 'Nama Baru Uji');
  });
  it('T12 ganti sandi: salah -> 401; lemah -> 400; valid -> 200 dan sandi baru berlaku', async () => {
    assert.equal((await state.a.post('/api/account/change-password', { current_password: 'salah-salah1', new_password: 'SandiBaru2026abc' })).status, 401);
    assert.equal((await state.a.post('/api/account/change-password', { current_password: GOOD_PASSWORD, new_password: 'pendek' })).status, 400);
    assert.equal((await state.a.post('/api/account/change-password', { current_password: GOOD_PASSWORD, new_password: 'SandiBaru2026abc' })).status, 200);
    const c = new Client(baseUrl);
    assert.equal((await c.post('/api/auth/login', { email: state.aPayload.email, password: GOOD_PASSWORD })).status, 401);
    assert.equal((await c.post('/api/auth/login', { email: state.aPayload.email, password: 'SandiBaru2026abc' })).status, 200);
    state.aPassword = 'SandiBaru2026abc';
  });
});

describe('CRUD lahan', () => {
  it('T13 buat lahan -> 201 dan muncul di daftar', async () => {
    const res = await state.a.post(`/api/organizations/${state.orgA}/plots`, { name: 'Petak Uji 1', area_ha: 2.5, farmer_id: state.userA, crop: 'Padi' });
    assert.equal(res.status, 201);
    state.plotId = res.body.data.id;
    const list = await state.a.get(`/api/organizations/${state.orgA}/plots`);
    assert.ok(list.body.data.some((p) => p.id === state.plotId));
  });
  it('T14 validasi lahan: nama kosong / luas <= 0 -> 400', async () => {
    const base = `/api/organizations/${state.orgA}/plots`;
    assert.equal((await state.a.post(base, { name: '', area_ha: 1, farmer_id: state.userA, crop: 'Padi' })).status, 400);
    assert.equal((await state.a.post(base, { name: 'X', area_ha: 0, farmer_id: state.userA, crop: 'Padi' })).status, 400);
    assert.equal((await state.a.post(base, { name: 'X', area_ha: -4, farmer_id: state.userA, crop: 'Padi' })).status, 400);
  });
  it('T15 ubah lahan -> data konsisten; validasi ubah', async () => {
    const url = `/api/organizations/${state.orgA}/plots/${state.plotId}`;
    const res = await state.a.patch(url, { name: 'Petak Uji 1 (rev)', area_ha: 3.1, status: 'perhatian', irrigation_type: 'tadah_hujan' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Petak Uji 1 (rev)');
    assert.equal(res.body.data.area_ha, 3.1);
    assert.equal(res.body.data.status, 'perhatian');
    assert.equal((await state.a.patch(url, { status: 'rusak-parah' })).status, 400);
    assert.equal((await state.a.patch(url, {})).status, 400);
  });
  it('T15b siklus otomatis dari lahan tertaut ke petak dan terhitung di ringkasan fase', async () => {
    const summary = await state.a.get(`/api/organizations/${state.orgA}/records/summary`);
    assert.equal(summary.status, 200);
    assert.equal(summary.body.data.cycle_active, 1);
    assert.equal(summary.body.data.cycle_by_phase.Persiapan, 1);
    const cycles = await state.a.get(`/api/organizations/${state.orgA}/records/cycle`);
    assert.equal(cycles.body.data[0].plot_id, state.plotId);
  });
  it('T16 KPI dashboard menghitung lahan', async () => {
    const res = await state.a.get(`/api/organizations/${state.orgA}/dashboard`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.plots.total, 1);
  });
});

describe('Isolasi tenant', () => {
  it('T17 organisasi B tidak bisa membaca/mengubah/menghapus data organisasi A', async () => {
    state.b = new Client(baseUrl);
    const reg = await state.b.post('/api/auth/register', registerPayload('b'));
    assert.equal(reg.status, 201);
    state.orgB = reg.body.data.organization_id;
    assert.notEqual(state.orgA, state.orgB);
    for (const [method, path, body] of [
      ['get', `/api/organizations/${state.orgA}/dashboard`],
      ['get', `/api/organizations/${state.orgA}/plots`],
      ['patch', `/api/organizations/${state.orgA}/plots/${state.plotId}`, { name: 'dibajak' }],
      ['delete', `/api/organizations/${state.orgA}/plots/${state.plotId}`],
    ]) {
      const res = await state.b[method](path, body);
      assert.ok([403, 404].includes(res.status), `${method} ${path} -> ${res.status}`);
    }
    // jalur lintas tenant lewat orgId sendiri tidak boleh menyentuh plot milik A
    const own = await state.b.patch(`/api/organizations/${state.orgB}/plots/${state.plotId}`, { name: 'dibajak' });
    assert.equal(own.status, 404);
    const check = await state.a.get(`/api/organizations/${state.orgA}/plots`);
    assert.ok(check.body.data.some((p) => p.name === 'Petak Uji 1 (rev)'));
  });
});

describe('Hak akses per peran', () => {
  it('T18 undang petani -> terima undangan -> setujui admin -> login', async () => {
    const email = uniqueEmail('petani');
    const inv = await state.a.post(`/api/organizations/${state.orgA}/invitations`, { name: 'Petani Uji', email, role: 'petani' });
    assert.equal(inv.status, 201);
    const accept = await new Client(baseUrl).post('/api/auth/accept-invitation', { token: inv.body.data.token, name: 'Petani Uji', password: GOOD_PASSWORD });
    assert.equal(accept.status, 201);
    if (accept.body.data.pending_approval) {
      const members = await state.a.get(`/api/organizations/${state.orgA}/members`);
      const member = members.body.data.find((m) => (m.email ?? m.user?.email) === email);
      assert.ok(member, 'anggota undangan harus terdaftar');
      assert.equal((await state.a.patch(`/api/organizations/${state.orgA}/members/${member.id}`, { status: 'aktif' })).status, 200);
    }
    state.farmer = new Client(baseUrl);
    assert.equal((await state.farmer.post('/api/auth/login', { email, password: GOOD_PASSWORD })).status, 200);
  });
  it('T19 petani DITOLAK (403) membuat/ubah/hapus lahan dan mengundang', async () => {
    const base = `/api/organizations/${state.orgA}`;
    assert.equal((await state.farmer.post(`${base}/plots`, { name: 'x', area_ha: 1, farmer_id: 1, crop: 'x' })).status, 403);
    assert.equal((await state.farmer.patch(`${base}/plots/${state.plotId}`, { name: 'x' })).status, 403);
    assert.equal((await state.farmer.delete(`${base}/plots/${state.plotId}`)).status, 403);
    assert.equal((await state.farmer.post(`${base}/invitations`, { name: 'x', email: 'x@y.id', role: 'petani' })).status, 403);
  });
  it('T20 petani BOLEH mencatat aktivitas dan membacanya kembali', async () => {
    const base = `/api/organizations/${state.orgA}/records/activity`;
    const created = await state.farmer.post(base, { title: 'Pemupukan uji', payload: { plot_id: state.plotId, note: 'urea 50 kg' } });
    assert.equal(created.status, 201);
    const list = await state.farmer.get(base);
    assert.ok(list.body.data.some((r) => r.title === 'Pemupukan uji'));
  });
  it('T21 petani DITOLAK (403) membuat siklus tanam (hanya admin/manajer)', async () => {
    const res = await state.farmer.post(`/api/organizations/${state.orgA}/records/cycle`, { title: 'Padi', payload: { crop: 'Padi' } });
    assert.equal(res.status, 403);
  });
});

describe('Validasi data & unggah', () => {
  it('T22 jenis catatan tidak dikenal -> 400', async () => {
    const res = await state.a.post(`/api/organizations/${state.orgA}/records/hacker`, { title: 'x', payload: {} });
    assert.equal(res.status, 400);
  });
  it('T23 unggah berkas >10 MB ditolak (413/400)', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1024, 1);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
    const res = await state.a.request('POST', `/api/organizations/${state.orgA}/media`, { raw: big, headers: { 'Content-Type': 'image/jpeg' } });
    assert.ok([400, 413].includes(res.status), `status ${res.status}`);
  });
  it('T24 unggah berkas palsu (isi bukan gambar) ditolak 400', async () => {
    const res = await state.a.request('POST', `/api/organizations/${state.orgA}/media`, { raw: Buffer.from('<?php echo 1; ?>'), headers: { 'Content-Type': 'image/png' } });
    assert.equal(res.status, 400);
  });
  it('T25 unggah gambar valid -> 201 lalu bisa diunduh', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const up = await state.a.request('POST', `/api/organizations/${state.orgA}/media`, { raw: png, headers: { 'Content-Type': 'image/png' } });
    assert.equal(up.status, 201);
    const down = await fetch(`${baseUrl}${up.body.data.url}`, { headers: { Cookie: state.a.cookie } });
    assert.equal(down.status, 200);
    // organisasi B tidak boleh mengunduh media milik A
    const cross = await fetch(`${baseUrl}/api/organizations/${state.orgB}/media/${up.body.data.id}`, { headers: { Cookie: state.b.cookie } });
    assert.equal(cross.status, 404);
  });
});

describe('Cuaca, prediksi, hapus lahan', () => {
  it('T26 cuaca tanpa koordinat wilayah -> pesan error ramah (bukan 500)', async () => {
    const c = new Client(baseUrl);
    const reg = await c.post('/api/auth/register', registerPayload('nocoord', { latitude: undefined, longitude: undefined }));
    assert.equal(reg.status, 201);
    const res = await c.get(`/api/organizations/${reg.body.data.organization_id}/weather`);
    assert.ok(res.status >= 400 && res.status < 500, `status ${res.status}`);
    assert.ok(res.body.error.message);
  });
  it('T27 endpoint prediksi merespons tanpa error server', async () => {
    const res = await state.a.get(`/api/organizations/${state.orgA}/predictions`);
    assert.ok(res.status < 500, `status ${res.status}`);
  });
  it('T28 hapus lahan -> hilang dari daftar, 404 bila dihapus lagi', async () => {
    const url = `/api/organizations/${state.orgA}/plots/${state.plotId}`;
    assert.equal((await state.a.delete(url)).status, 200);
    const list = await state.a.get(`/api/organizations/${state.orgA}/plots`);
    assert.ok(!list.body.data.some((p) => p.id === state.plotId));
    assert.equal((await state.a.delete(url)).status, 404);
  });
});

describe('Pembatas laju', () => {
  it('T29 login: 8 percobaan salah lalu diblokir 429 (brute-force)', async () => {
    const email = uniqueEmail('brute');
    const c = new Client(baseUrl);
    let last;
    for (let i = 0; i < 10; i += 1) last = await c.post('/api/auth/login', { email, password: 'salah-salah-123' });
    assert.equal(last.status, 429);
    assert.equal(last.body.error.code, 'TERLALU_BANYAK_PERCOBAAN');
  });
});

describe('Seed demo & akun per peran', () => {
  it('T31 seed demo: 4 akun (admin/manajer/petani/penyuluh) bisa masuk dengan hak akses sesuai peran', async () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const run = spawnSync(process.execPath, [path.resolve(here, '../scripts/seed-demo.js')], { env: { ...process.env }, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stdout + run.stderr);

    const login = async (email) => {
      const c = new Client(baseUrl);
      const res = await c.post('/api/auth/login', { email, password: 'DemoMapan2026' });
      assert.equal(res.status, 200, `${email}: ${res.status}`);
      return { c, org: res.body.data.organization_id, uid: res.body.data.user.id };
    };
    const admin = await login('admin@demo.mapan.id');
    const manajer = await login('manajer@demo.mapan.id');
    const petani = await login('petani@demo.mapan.id');
    const penyuluh = await login('penyuluh@demo.mapan.id');
    const base = `/api/organizations/${admin.org}`;

    const dash = await admin.c.get(`${base}/dashboard`);
    assert.equal(dash.body.data.plots.total, 6);
    assert.equal(dash.body.data.members.active, 4);
    const map = await admin.c.get(`${base}/map/plots`);
    assert.equal(map.status, 200);
    assert.equal(map.body.features.length, 6, 'semua lahan demo punya batas peta');
    const pred = await admin.c.get(`${base}/predictions`);
    assert.equal(pred.body.data.active_cycles, 6);
    assert.match(pred.body.data.by_commodity[0].basis, /bukan prediksi AI/);

    // manajer boleh membuat lahan; petani & penyuluh tidak
    const payload = { name: 'Petak Baru', area_ha: 1, crop: 'Padi' };
    assert.equal((await manajer.c.post(`${base}/plots`, { ...payload, farmer_id: manajer.uid })).status, 201);
    assert.equal((await petani.c.post(`${base}/plots`, { ...payload, farmer_id: petani.uid })).status, 403);
    assert.equal((await penyuluh.c.post(`${base}/plots`, { ...payload, farmer_id: penyuluh.uid })).status, 403);
    // penyuluh: baca saja (akses baca diaktifkan seed), tidak boleh mencatat/mengunggah
    assert.equal((await penyuluh.c.get(`${base}/plots`)).status, 200);
    assert.equal((await penyuluh.c.post(`${base}/records/activity`, { title: 'x', payload: {} })).status, 403);
    assert.equal((await penyuluh.c.request('POST', `${base}/media`, { raw: Buffer.from([0xff, 0xd8, 0xff, 1]), headers: { 'Content-Type': 'image/jpeg' } })).status, 403);
    // hanya administrator yang boleh mengundang / mengubah anggota
    assert.equal((await manajer.c.post(`${base}/invitations`, { name: 'x', email: 'x@y.id', role: 'petani' })).status, 403);
    // seed idempoten
    const again = spawnSync(process.execPath, [path.resolve(here, '../scripts/seed-demo.js')], { env: { ...process.env }, encoding: 'utf8' });
    assert.match(again.stdout, /dilewati/);
  });
});
