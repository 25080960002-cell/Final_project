import { query } from '../db.js';
import { HttpError } from '../http.js';
import { asIso } from '../format.js';

/** Ambil organisasi aktif atau lempar 404. Dipakai semua route ber-tenant. */
export async function loadOrganization(orgId) {
  const rows = await query(
    `SELECT o.id, o.name, o.slug, o.type, o.registration_no, o.founded_year,
            o.region_id, r.name AS region_name, r.level AS region_level,
            rp.name AS parent_region_name, rv.name AS province_name,
            o.address, o.contact_email, o.contact_phone, o.description,
            o.logo_path, o.status, o.created_at, o.updated_at
       FROM organizations o
       LEFT JOIN regions r ON r.id = o.region_id
       LEFT JOIN regions rp ON rp.id = r.parent_id
       LEFT JOIN regions rv ON rv.id = rp.parent_id
      WHERE o.id = ? AND o.deleted_at IS NULL`,
    [orgId],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'ORGANISASI_TIDAK_DITEMUKAN', 'Organisasi tidak ditemukan.');
  }
  return rows[0];
}

export function serializeOrganization(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    registration_no: row.registration_no,
    founded_year: row.founded_year,
    status: row.status,
    description: row.description,
    address: row.address,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    logo_path: row.logo_path,
    region: row.region_id
      ? {
          id: row.region_id,
          name: row.region_name,
          level: row.region_level,
          parent_region: row.parent_region_name ?? null,
          province: row.province_name ?? null,
          label:
            [row.parent_region_name, row.province_name].filter(Boolean).join(', ') ||
            row.region_name,
        }
      : null,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
  };
}
