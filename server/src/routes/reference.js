import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler, parseId, pickEnum } from '../http.js';
import { asIso, asNumber } from '../format.js';

export const referenceRouter = Router();

const REGION_LEVELS = ['provinsi', 'kabupaten', 'kecamatan', 'desa'];

referenceRouter.get(
  '/reference/commodities',
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT c.id, c.code, c.name, c.category, c.base_yield_per_ha,
              c.default_unit, c.default_cycle_days,
              v.id AS variety_id, v.name AS variety_name,
              v.maturity_days, v.description AS variety_description
         FROM commodities c
         LEFT JOIN crop_varieties v ON v.commodity_id = c.id AND v.is_active = 1
        WHERE c.is_active = 1
        ORDER BY c.name, v.name`,
    );

    const byId = new Map();
    for (const row of rows) {
      if (!byId.has(row.id)) {
        byId.set(row.id, {
          id: row.id,
          code: row.code,
          name: row.name,
          category: row.category,
          base_yield_per_ha: asNumber(row.base_yield_per_ha),
          default_unit: row.default_unit,
          default_cycle_days: row.default_cycle_days,
          varieties: [],
        });
      }
      if (row.variety_id) {
        byId.get(row.id).varieties.push({
          id: row.variety_id,
          name: row.variety_name,
          maturity_days: row.maturity_days,
          description: row.variety_description,
        });
      }
    }

    const data = [...byId.values()];
    res.json({ data, meta: { total: data.length, source: 'commodities + crop_varieties' } });
  }),
);

referenceRouter.get(
  '/reference/symptoms',
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT id, code, label, category, created_at
         FROM symptoms
        WHERE is_active = 1
        ORDER BY category, label`,
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        code: row.code,
        label: row.label,
        category: row.category,
        created_at: asIso(row.created_at),
      })),
      meta: { total: rows.length },
    });
  }),
);

referenceRouter.get(
  '/reference/regions',
  asyncHandler(async (req, res) => {
    const conditions = [];
    const params = [];

    const level = pickEnum(req.query.level, REGION_LEVELS, 'level');
    if (level) {
      conditions.push('level = ?');
      params.push(level);
    }

    if (req.query.parent_id !== undefined && req.query.parent_id !== '') {
      conditions.push('parent_id = ?');
      params.push(parseId(req.query.parent_id, 'parent_id'));
    }

    if (typeof req.query.q === 'string' && req.query.q.trim() !== '') {
      conditions.push('name LIKE ?');
      params.push(`%${req.query.q.trim()}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT id, parent_id, level, name, bps_code, latitude, longitude
         FROM regions
         ${where}
        ORDER BY FIELD(level, 'provinsi', 'kabupaten', 'kecamatan', 'desa'), name`,
      params,
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        parent_id: row.parent_id,
        level: row.level,
        name: row.name,
        bps_code: row.bps_code,
        point: row.latitude
          ? { latitude: asNumber(row.latitude), longitude: asNumber(row.longitude) }
          : null,
      })),
      meta: { total: rows.length },
    });
  }),
);
