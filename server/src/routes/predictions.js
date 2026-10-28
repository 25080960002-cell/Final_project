import { Router } from 'express';
import { query } from '../db.js';
import { asyncHandler, parseId } from '../http.js';
import { asNumber } from '../format.js';
import { loadOrganization } from '../services/organization.js';

export const predictionRouter = Router();

predictionRouter.get(
  '/organizations/:orgId/predictions',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const [cycleRows, commodityRows, healthRows] = await Promise.all([
      query(
        `SELECT r.id, r.title, r.payload, p.id AS plot_id, p.name AS plot_name,
                p.area_ha, c.name AS commodity_name, c.base_yield_per_ha, c.default_unit
           FROM organization_records r
           LEFT JOIN plots p
             ON p.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(r.payload, '$.plot_id')) AS UNSIGNED)
            AND p.organization_id = r.organization_id AND p.deleted_at IS NULL
           LEFT JOIN commodities c ON c.is_active = 1
            AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(r.payload, '$.crop'))) LIKE CONCAT('%', LOWER(c.name), '%')
          WHERE r.organization_id = ? AND r.record_type = 'cycle'
            AND r.status = 'aktif' AND r.deleted_at IS NULL
          ORDER BY r.created_at DESC`,
        [orgId],
      ),
      query(`SELECT id, name, base_yield_per_ha, default_unit FROM commodities WHERE is_active = 1 ORDER BY name`),
      query(
        `SELECT ROUND(AVG(h.health_score), 1) AS average_score
           FROM plot_health_snapshots h JOIN plots p ON p.id = h.plot_id
          WHERE p.organization_id = ? AND p.deleted_at IS NULL
            AND h.recorded_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)`,
        [orgId],
      ),
    ]);
    const health = asNumber(healthRows[0]?.average_score);
    const groups = new Map();
    for (const row of cycleRows) {
      let payload = row.payload;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { payload = {}; }
      }
      const cropName = String(payload?.crop ?? row.title ?? '').trim();
      if (!cropName) continue;
      const commodity = commodityRows.find((item) =>
        cropName.toLowerCase().includes(String(item.name).toLowerCase()) ||
        String(item.name).toLowerCase().includes(cropName.toLowerCase()),
      );
      const payloadArea = Number.parseFloat(String(payload?.area_ha ?? '').replace(',', '.'));
      const area = row.area_ha !== null
        ? asNumber(row.area_ha)
        : Number.isFinite(payloadArea) ? payloadArea : null;
      const baseYield = asNumber(commodity?.base_yield_per_ha);
      const unit = commodity?.default_unit ?? 'kg';
      if (!groups.has(cropName)) {
        groups.set(cropName, { crop: cropName, area_ha: 0, estimate_kg: 0, cycles: 0, unit, health_indicator: Math.round(45 + (health ?? 50) * 0.35) });
      }
      const estimateKg = area !== null && baseYield !== null && unit === 'kg' ? area * baseYield * 10 : 0;
      const group = groups.get(cropName);
      group.area_ha += area ?? 0;
      group.estimate_kg += estimateKg;
      group.cycles += 1;
      group.unit = commodity ? 'kg' : 'belum ada benchmark';
    }
    const rows = [...groups.values()].map((row) => ({
      ...row,
      area_ha: Number(row.area_ha.toFixed(2)),
      estimate_kg: Number(row.estimate_kg.toFixed(1)),
      estimate_tons: Number((row.estimate_kg / 1000).toFixed(2)),
      health_indicator: Math.min(row.health_indicator, 85),
      basis: 'Luas petak × benchmark hasil komoditas; bukan prediksi AI.',
    }));
    res.json({
      data: {
        by_commodity: rows,
        active_cycles: cycleRows.length,
        area_ha: Number(rows.reduce((sum, row) => sum + row.area_ha, 0).toFixed(2)),
        estimated_tons: Number(rows.reduce((sum, row) => sum + row.estimate_tons, 0).toFixed(2)),
        health_average: health,
      },
      meta: { organization_id: orgId, model: 'commodity_benchmark_v1', generated_at: new Date().toISOString() },
    });
  }),
);
