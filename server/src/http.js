export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Validasi id dari URL: bilangan bulat positif. */
export function parseId(raw, label = 'id') {
  const text = String(raw ?? '');
  const value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value <= 0) {
    throw new HttpError(400, 'ID_TIDAK_VALID', `${label} harus bilangan bulat positif.`);
  }
  return value;
}

/** Paginasi dengan batas aman. */
export function parsePagination(query) {
  const parsePositive = (value, fallback, key, max) => {
    if (value === undefined || value === '') return fallback;
    const text = String(value);
    const number = Number(text);
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < 1 || number > max) {
      throw new HttpError(400, 'PAGINASI_TIDAK_VALID', `${key} harus bilangan bulat antara 1 dan ${max}.`);
    }
    return number;
  };
  const page = parsePositive(query.page, 1, 'page', 1_000_000);
  const limit = parsePositive(query.limit, 50, 'limit', 200);
  return { page, limit, offset: (page - 1) * limit };
}

/** Ambil hanya nilai yang diizinkan, jika tidak ada kembalikan null. */
export function pickEnum(value, allowed, label) {
  if (value === undefined || value === null || value === '') return null;
  if (!allowed.includes(value)) {
    throw new HttpError(400, 'NILAI_TIDAK_VALID', `${label} harus salah satu dari: ${allowed.join(', ')}.`);
  }
  return value;
}
