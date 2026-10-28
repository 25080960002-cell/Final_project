import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { pool, query } from '../db.js';
import { HttpError, asyncHandler, parseId, parsePagination, pickEnum } from '../http.js';
import { asGeoJson, asIso, asNumber, asPoint } from '../format.js';
import { loadOrganization } from '../services/organization.js';
import { requireRoles } from '../auth.js';

export const plotRouter = Router();

const PLOT_STATUSES = ['sehat', 'perhatian', 'kritis', 'tidak_aktif'];
const SORTABLE = {
  id: 'p.id',
  name: 'p.name',
  area_ha: 'p.area_ha',
  status: 'p.status',
  updated_at: 'p.updated_at',
};

const PLOT_SELECT = `
  SELECT p.id, p.code, p.name, p.area_ha, p.status, p.address,
         p.elevation_m, p.soil_type, p.irrigation_type, p.established_on,
         p.farm_group_id, p.region_id, p.created_at, p.updated_at,
         r.name AS region_name, pr.name AS parent_region_name,
         pv.name AS province_name,
         g.name AS farm_group_name,
         pm.user_id AS farmer_id, u.full_name AS farmer_name,
         hs.health_score, hs.recorded_at AS health_recorded_at,
         b.measured_area_ha,
         ST_Latitude(b.centroid) AS latitude,
         ST_Longitude(b.centroid) AS longitude
    FROM plots p
    LEFT JOIN regions r ON r.id = p.region_id
    LEFT JOIN regions pr ON pr.id = r.parent_id
    LEFT JOIN regions pv ON pv.id = pr.parent_id
    LEFT JOIN farm_groups g ON g.id = p.farm_group_id AND g.deleted_at IS NULL
    LEFT JOIN plot_managers pm ON pm.plot_id = p.id AND pm.is_primary = 1
    LEFT JOIN users u ON u.id = pm.user_id
    LEFT JOIN plot_boundaries b ON b.plot_id = p.id
    LEFT JOIN (
      SELECT plot_id, health_score, recorded_at,
             ROW_NUMBER() OVER (PARTITION BY plot_id
                                ORDER BY recorded_at DESC, id DESC) AS rn
        FROM plot_health_snapshots
    ) hs ON hs.plot_id = p.id AND hs.rn = 1`;

plotRouter.post(
  '/organizations/:orgId/plots',
  requireRoles('administrator', 'manajer_lapangan'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const organization = await loadOrganization(orgId);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const areaHa = Number(req.body?.area_ha);
    const farmerId = parseId(req.body?.farmer_id, 'farmer_id');
    const crop = typeof req.body?.crop === 'string' ? req.body.crop.trim() : '';

    if (!name || name.length > 120) {
      throw new HttpError(400, 'NAMA_LAHAN_TIDAK_VALID', 'Nama lahan wajib diisi dan maksimal 120 karakter.');
    }
    if (!Number.isFinite(areaHa) || areaHa <= 0 || areaHa > 99999999) {
      throw new HttpError(400, 'LUAS_TIDAK_VALID', 'Luas lahan harus berupa angka lebih dari nol.');
    }
    if (!organization.region_id) {
      throw new HttpError(409, 'WILAYAH_ORGANISASI_KOSONG', 'Tetapkan wilayah organisasi sebelum membuat lahan.');
    }
    if (!crop || crop.length > 120) {
      throw new HttpError(400, 'KOMODITAS_TIDAK_VALID', 'Komoditas wajib diisi dan maksimal 120 karakter.');
    }

    const connection = await pool.getConnection();
    let plotId;
    try {
      await connection.beginTransaction();
      const [members] = await connection.execute(
        `SELECT u.id FROM organization_members m
           JOIN users u ON u.id = m.user_id
          WHERE m.organization_id = ? AND m.user_id = ? AND m.status = 'aktif'
            AND u.status = 'aktif' AND u.deleted_at IS NULL`,
        [orgId, farmerId],
      );
      if (members.length === 0) {
        throw new HttpError(400, 'PETANI_BELUM_TERDAFTAR', 'Pilih petani aktif yang tergabung di organisasi ini.');
      }
      const code = `PL-${randomUUID().slice(0, 8).toUpperCase()}`;
      const [insert] = await connection.execute(
        `INSERT INTO plots (organization_id, region_id, code, name, area_ha, created_by_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orgId, organization.region_id, code, name, areaHa, farmerId],
      );
      plotId = insert.insertId;
      await connection.execute(
        `INSERT INTO plot_managers (plot_id, user_id, is_primary, assigned_on)
         VALUES (?, ?, TRUE, CURRENT_DATE)`,
        [plotId, farmerId],
      );
      await connection.execute(
        `INSERT INTO organization_records (organization_id, record_type, title, payload)
         VALUES (?, 'cycle', ?, ?)`,
        [orgId, crop, JSON.stringify({ crop, plot: name, plot_id: plotId, area: `${areaHa} ha`, phase: 'Persiapan', progress: 4, status: 'Sehat', harvest: 'Belum dijadwalkan' })],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const rows = await query(`${PLOT_SELECT} WHERE p.organization_id = ? AND p.id = ?`, [orgId, plotId]);
    res.status(201).json({ data: serializePlot(rows[0]), meta: { organization_id: orgId } });
  }),
);

function buildFilters(req, orgId) {
  const conditions = ['p.organization_id = ?', 'p.deleted_at IS NULL'];
  const params = [orgId];

  const status = pickEnum(req.query.status, PLOT_STATUSES, 'status');
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (req.query.farm_group_id !== undefined && req.query.farm_group_id !== '') {
    conditions.push('p.farm_group_id = ?');
    params.push(parseId(req.query.farm_group_id, 'farm_group_id'));
  }

  if (req.query.region_id !== undefined && req.query.region_id !== '') {
    conditions.push('p.region_id = ?');
    params.push(parseId(req.query.region_id, 'region_id'));
  }

  if (typeof req.query.q === 'string' && req.query.q.trim() !== '') {
    const term = `%${req.query.q.trim()}%`;
    conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
    params.push(term, term);
  }

  return { where: conditions.join(' AND '), params };
}

function serializePlot(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    area_ha: asNumber(row.area_ha),
    status: row.status,
    address: row.address,
    elevation_m: row.elevation_m,
    soil_type: row.soil_type,
    irrigation_type: row.irrigation_type,
    established_on: asIso(row.established_on),
    location: {
      region_id: row.region_id,
      region: row.region_name,
      parent_region: row.parent_region_name,
      province: row.province_name,
      label:
        [row.parent_region_name, row.province_name].filter(Boolean).join(', ') ||
        row.region_name ||
        null,
      point: asPoint(row.latitude, row.longitude),
    },
    farm_group: row.farm_group_id
      ? { id: row.farm_group_id, name: row.farm_group_name }
      : null,
    farmer: row.farmer_id ? { user_id: row.farmer_id, full_name: row.farmer_name } : null,
    health:
      row.health_score === null || row.health_score === undefined
        ? null
        : {
            score: row.health_score,
            recorded_at: asIso(row.health_recorded_at),
          },
    boundary:
      row.latitude === null || row.latitude === undefined
        ? null
        : { measured_area_ha: asNumber(row.measured_area_ha) },
    crop: null,
    phase: null,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
  };
}

plotRouter.get(
  '/organizations/:orgId/plots',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);

    const { page, limit, offset } = parsePagination(req.query);
    const { where, params } = buildFilters(req, orgId);

    const sortKey = String(req.query.sort ?? 'id');
    const sortColumn = SORTABLE[sortKey];
    if (!sortColumn) {
      throw new HttpError(
        400,
        'SORT_TIDAK_VALID',
        `sort harus salah satu dari: ${Object.keys(SORTABLE).join(', ')}.`,
      );
    }
    const direction = String(req.query.order ?? 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [countRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM plots p WHERE ${where}`, params),
      query(
        `${PLOT_SELECT}
          WHERE ${where}
          ORDER BY ${sortColumn} ${direction}, p.id ASC
          LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
    ]);

    const total = Number(countRows[0].total);

    res.json({
      data: rows.map(serializePlot),
      meta: {
        organization_id: orgId,
        page,
        limit,
        total,
        total_pages: Math.max(Math.ceil(total / limit), 1),
        cultivation_available: false,
        note: 'Kolom crop dan phase bernilai null sampai cultivation_cycles (Fase 3) diisi.',
      },
    });
  }),
);

plotRouter.get(
  '/organizations/:orgId/plots/:plotId',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const plotId = parseId(req.params.plotId, 'plot id');
    await loadOrganization(orgId);

    const rows = await query(
      `${PLOT_SELECT} WHERE p.organization_id = ? AND p.id = ? AND p.deleted_at IS NULL`,
      [orgId, plotId],
    );
    if (rows.length === 0) {
      throw new HttpError(404, 'PETAK_TIDAK_DITEMUKAN', 'Petak tidak ditemukan pada organisasi ini.');
    }

    const [managerRows, healthRows, boundaryRows] = await Promise.all([
      query(
        `SELECT pm.user_id, pm.is_primary, pm.assigned_on,
                u.full_name, u.email, u.phone, u.status
           FROM plot_managers pm
           JOIN users u ON u.id = pm.user_id
          WHERE pm.plot_id = ?
          ORDER BY pm.is_primary DESC, u.full_name`,
        [plotId],
      ),
      query(
        `SELECT id, health_score, ndvi, source, notes, recorded_at
           FROM plot_health_snapshots
          WHERE plot_id = ?
          ORDER BY recorded_at DESC, id DESC
          LIMIT 12`,
        [plotId],
      ),
      query(
        `SELECT ST_AsGeoJSON(boundary, 6) AS geojson,
                measured_area_ha,
                ST_Latitude(centroid) AS latitude,
                ST_Longitude(centroid) AS longitude,
                mapped_at
           FROM plot_boundaries
          WHERE plot_id = ?`,
        [plotId],
      ),
    ]);

    const boundary = boundaryRows[0]
      ? {
          geometry: asGeoJson(boundaryRows[0].geojson),
          measured_area_ha: asNumber(boundaryRows[0].measured_area_ha),
          centroid: asPoint(boundaryRows[0].latitude, boundaryRows[0].longitude),
          mapped_at: asIso(boundaryRows[0].mapped_at),
        }
      : null;

    res.json({
      data: {
        ...serializePlot(rows[0]),
        managers: managerRows.map((row) => ({
          user_id: row.user_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          is_primary: Boolean(row.is_primary),
          assigned_on: asIso(row.assigned_on),
          user_status: row.status,
        })),
        health_history: healthRows.map((row) => ({
          id: row.id,
          score: row.health_score,
          ndvi: asNumber(row.ndvi),
          source: row.source,
          notes: row.notes,
          recorded_at: asIso(row.recorded_at),
        })),
        boundary,
      },
      meta: { organization_id: orgId, cultivation_available: false },
    });
  }),
);

plotRouter.get(
  '/organizations/:orgId/map/plots',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);

    const rows = await query(
      `SELECT p.id, p.code, p.name, p.status, p.area_ha,
              ST_AsGeoJSON(b.boundary, 6) AS geojson,
              ST_Latitude(b.centroid) AS latitude,
              ST_Longitude(b.centroid) AS longitude
         FROM plots p
         JOIN plot_boundaries b ON b.plot_id = p.id
        WHERE p.organization_id = ? AND p.deleted_at IS NULL
        ORDER BY p.name`,
      [orgId],
    );

    res.json({
      type: 'FeatureCollection',
      features: rows
        .map((row) => {
          const geometry = asGeoJson(row.geojson);
          if (!geometry) return null;
          return {
            type: 'Feature',
            geometry,
            properties: {
              id: row.id,
              code: row.code,
              name: row.name,
              status: row.status,
              area_ha: asNumber(row.area_ha),
              centroid: asPoint(row.latitude, row.longitude),
            },
          };
        })
        .filter(Boolean),
      meta: { organization_id: orgId, total: rows.length, crs: 'EPSG:4326' },
    });
  }),
);
