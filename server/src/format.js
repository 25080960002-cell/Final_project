/** Ubah DECIMAL MySQL menjadi number (atau null). */
export const asNumber = (value) => (value === null || value === undefined ? null : Number(value));

/** Ubah TINYINT(1) menjadi boolean. */
export const asBool = (value) => (value === null || value === undefined ? null : Boolean(value));

/**
 * DATETIME(6) disimpan dalam UTC dan dibaca sebagai string
 * ("2026-10-26 08:00:00.000000"). Ubah ke ISO-8601 dengan penanda Z
 * agar klien tidak salah menebak zona waktu.
 */
export const asIso = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return `${text.replace(' ', 'T')}Z`;
};

/** ST_AsGeoJSON() mengembalikan string; jadikan objek. */
export const asGeoJson = (value) => {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

/** Susun objek koordinat dari kolom ST_Latitude / ST_Longitude. */
export const asPoint = (latitude, longitude) =>
  latitude === null || longitude === null
    ? null
    : { latitude: asNumber(latitude), longitude: asNumber(longitude) };
