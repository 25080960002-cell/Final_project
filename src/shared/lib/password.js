/** Penilaian kekuatan kata sandi di sisi klien (selaras dengan kebijakan server: min. 10, huruf + angka). */
export const PASSWORD_MIN = 10;

export function passwordChecks(password = '', email = '') {
  const local = String(email).split('@')[0].toLowerCase();
  return [
    { id: 'length', label: `Minimal ${PASSWORD_MIN} karakter`, ok: password.length >= PASSWORD_MIN },
    { id: 'letter', label: 'Memuat huruf', ok: /[A-Za-z]/.test(password) },
    { id: 'digit', label: 'Memuat angka', ok: /\d/.test(password) },
    { id: 'email', label: 'Tidak memuat bagian email', ok: !(local.length >= 4 && password.toLowerCase().includes(local)) },
  ];
}

/** @returns {{ valid: boolean, score: 0|1|2|3, label: string }} */
export function passwordStrength(password = '', email = '') {
  const valid = passwordChecks(password, email).every((check) => check.ok);
  if (!password) return { valid: false, score: 0, label: '' };
  if (!valid) return { valid: false, score: 1, label: 'Belum memenuhi syarat' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 14 && variety >= 3) return { valid: true, score: 3, label: 'Kuat' };
  return { valid: true, score: 2, label: 'Cukup' };
}
