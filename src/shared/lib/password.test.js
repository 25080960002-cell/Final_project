import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { passwordChecks, passwordStrength } from './password.js';
import { CITIES, isIndonesiaCoordinate } from './cities.js';

describe('kekuatan kata sandi (klien)', () => {
  it('menolak yang pendek, tanpa angka, atau memuat email', () => {
    assert.equal(passwordStrength('abc1').valid, false);
    assert.equal(passwordStrength('hanyahurufsemua').valid, false);
    assert.equal(passwordStrength('Budisantoso2026', 'budisantoso@mail.id').valid, false);
  });
  it('menerima kata sandi yang memenuhi kebijakan server', () => {
    assert.equal(passwordStrength('SandiUji2026xyz').valid, true);
    assert.equal(passwordStrength('SandiUji2026xyz!').score, 3);
    assert.equal(passwordStrength('tanamPadi2026').score, 2);
  });
  it('daftar syarat konsisten', () => {
    const ids = passwordChecks('x').map((c) => c.id);
    assert.deepEqual(ids, ['length', 'letter', 'digit', 'email']);
  });
});

describe('daftar kota', () => {
  it('semua koordinat berada di wilayah Indonesia dan nama unik', () => {
    for (const city of CITIES) assert.ok(isIndonesiaCoordinate(city.latitude, city.longitude), city.name);
    assert.equal(new Set(CITIES.map((c) => c.name)).size, CITIES.length);
  });
  it('menolak koordinat di luar Indonesia', () => {
    assert.equal(isIndonesiaCoordinate(51.5, -0.12), false);
    assert.equal(isIndonesiaCoordinate(NaN, 100), false);
  });
});
