import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './http.js';

const scrypt = promisify(scryptCallback);

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;
const COMMON = new Set([
  'password123', 'password1234', '1234567890', '12345678910', 'qwerty12345', 'passw0rd123',
  'admin12345', 'mapan12345', 'indonesia123', 'abcdefghij1',
]);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Kebijakan kata sandi: panjang, huruf + angka, bukan sandi umum, tidak memuat email. */
export function assertPasswordPolicy(password, { email = '' } = {}) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new HttpError(400, 'KATA_SANDI_LEMAH', `Kata sandi minimal ${PASSWORD_MIN} karakter.`);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'KATA_SANDI_LEMAH', 'Kata sandi harus memuat huruf dan angka.');
  }
  const local = String(email).split('@')[0].toLowerCase();
  if (COMMON.has(password.toLowerCase()) || (local.length >= 4 && password.toLowerCase().includes(local))) {
    throw new HttpError(400, 'KATA_SANDI_LEMAH', 'Kata sandi terlalu mudah ditebak. Hindari kata umum atau bagian dari email.');
  }
}
