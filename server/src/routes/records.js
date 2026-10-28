import { Router } from 'express';
import { query } from '../db.js';
import { HttpError, asyncHandler, parseId, parsePagination } from '../http.js';
import { asIso } from '../format.js';
import { loadOrganization } from '../services/organization.js';
import { requireRoles } from '../auth.js';

export const recordRouter = Router();

const RECORD_TYPES = new Set(['cycle', 'task', 'activity', 'report', 'scan', 'community_post']);
const writeRoles = (req, res, next) => {
  const managers = ['administrator', 'manajer_lapangan'];
  return requireRoles(...(['cycle'].includes(req.params.type) ? managers : ['administrator', 'manajer_lapangan', 'petani']))(req, res, next);
};

function parseRecordType(value) {
  if (!RECORD_TYPES.has(value)) {
    throw new HttpError(400, 'JENIS_CATATAN_TIDAK_VALID', 'Jenis catatan tidak didukung.');
  }
  return value;
}

function parsePayload(value, { required = false } = {}) {
  if (value === undefined && !required) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'PAYLOAD_TIDAK_VALID', 'payload harus berupa objek JSON.');
  }
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 128 * 1024) {
    throw new HttpError(413, 'PAYLOAD_TERLALU_BESAR', 'payload catatan maksimal 128 KB.');
  }
  return value;
}

/**
 * Kolom terstruktur turunan payload (migrasi 007) agar pencarian dashboard
 * tidak harus membongkar payload JSON. payload tetap dipertahankan apa adanya.
 */
function structuredColumns(payload) {
  const columns = { plot_id: null, phase: null, progress: null, due_at: null };
  const rawPlotId = Number(payload.plot_id);
  if (Number.isInteger(rawPlotId) && rawPlotId > 0) columns.plot_id = rawPlotId;
  if (typeof payload.phase === 'string' && payload.phase.trim()) columns.phase = payload.phase.trim().slice(0, 30);
  const rawProgress = Number(payload.progress);
  if (Number.isFinite(rawProgress) && rawProgress >= 0 && rawProgress <= 100) {
    columns.progress = Math.round(rawProgress);
  }
  if (typeof payload.due_at === 'string' && payload.due_at) {
    const dueDate = new Date(payload.due_at);
    if (!Number.isNaN(dueDate.getTime())) columns.due_at = dueDate;
  }
  return columns;
}

async function assertPlotInOrganization(orgId, plotId) {
  const rows = await query(
    'SELECT id FROM plots WHERE id = ? AND organization_id = ? LIMIT 1',
    [plotId, orgId],
  );
  if (!rows[0]) {
    throw new HttpError(400, 'PETAK_TIDAK_TERSAMBUNG', 'plot_id tidak sesuai petak organisasi ini.');
  }
  return plotId;
}

function serialize(row) {
  let payload = row.payload;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  return {
    id: row.id,
    type: row.record_type,
    title: row.title,
    payload,
    status: row.status,
    author_user_id: row.author_user_id ?? null,
    plot_id: row.plot_id ?? null,
    phase: row.phase ?? null,
    progress: row.progress ?? null,
    due_at: row.due_at ? asIso(row.due_at) : null,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
  };
}

const RECORD_SELECT = `
  SELECT id, record_type, title, payload, status, author_user_id, plot_id, phase, progress, due_at, created_at, updated_at
    FROM organization_records`;

/**
 * Ringkasan satu sumber untuk kartu statistik dashboard:
 * total tiap jenis catatan, tugas terbuka/jatuh tempo, dan sebaran fase siklus.
 */
recordRouter.get(
  '/organizations/:orgId/records/summary',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const [typeRows, phaseRows] = await Promise.all([
      query(
        `SELECT record_type,
                COUNT(*) AS total,
                SUM(deleted_at IS NULL) AS aktif,
                SUM(deleted_at IS NULL AND status = 'selesai') AS selesai,
                SUM(deleted_at IS NULL AND status <> 'selesai') AS berjalan,
                SUM(deleted_at IS NULL AND status <> 'selesai'
                      AND due_at IS NOT NULL AND due_at > UTC_TIMESTAMP(6)) AS jatuh_tempo
           FROM organization_records
          WHERE organization_id = ?
          GROUP BY record_type`,
        [orgId],
      ),
      query(
        `SELECT phase, COUNT(*) AS total
           FROM organization_records
          WHERE organization_id = ? AND record_type = 'cycle'
            AND deleted_at IS NULL AND status <> 'selesai' AND phase IS NOT NULL
          GROUP BY phase`,
        [orgId],
      ),
    ]);
    const byType = {};
    for (const row of typeRows) {
      byType[row.record_type] = {
        total: Number(row.total),
        aktif: Number(row.aktif ?? 0),
        berjalan: Number(row.berjalan ?? 0),
        selesai: Number(row.selesai ?? 0),
        jatuh_tempo: Number(row.jatuh_tempo ?? 0),
      };
    }
    const cycleByPhase = {};
    for (const row of phaseRows) {
      if (row.phase) cycleByPhase[row.phase] = Number(row.total);
    }
    const tasks = byType.task ?? { total: 0, aktif: 0, berjalan: 0, selesai: 0, jatuh_tempo: 0 };
    const cycles = byType.cycle ?? { total: 0, aktif: 0, berjalan: 0, selesai: 0, jatuh_tempo: 0 };
    res.json({
      data: {
        by_type: byType,
        task_open: tasks.berjalan,
        task_done: tasks.selesai,
        task_due_soon: tasks.jatuh_tempo,
        cycle_active: cycles.berjalan + cycles.selesai,
        cycle_by_phase: cycleByPhase,
        activity_total: (byType.activity?.aktif ?? 0),
        report_total: (byType.report?.aktif ?? 0),
      },
      meta: { organization_id: orgId, generated_at: new Date().toISOString() },
    });
  }),
);

recordRouter.get(
  '/organizations/:orgId/records/:type',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const type = parseRecordType(req.params.type);
    await loadOrganization(orgId);
    const { page, limit, offset } = parsePagination(req.query);
    const conditions = ['organization_id = ?', 'record_type = ?', 'deleted_at IS NULL'];
    const params = [orgId, type];
    if (req.query.status) {
      conditions.push('status = ?');
      params.push(String(req.query.status).slice(0, 30));
    }
    if (req.query.plot_id) {
      conditions.push('plot_id = ?');
      params.push(parseId(req.query.plot_id, 'plot id'));
    }
    if (req.query.author_user_id) {
      conditions.push('author_user_id = ?');
      params.push(parseId(req.query.author_user_id, 'user id'));
    }
    const where = conditions.join(' AND ');
    const [countRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM organization_records WHERE ${where}`, params),
      query(
        `${RECORD_SELECT} WHERE ${where}
          ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
    ]);
    const total = Number(countRows[0].total);
    res.json({
      data: rows.map(serialize),
      meta: { organization_id: orgId, type, page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
    });
  }),
);

recordRouter.post(
  '/organizations/:orgId/records/:type',
  writeRoles,
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const type = parseRecordType(req.params.type);
    await loadOrganization(orgId);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const payload = parsePayload(req.body?.payload, { required: true });
    if (!title || title.length > 160) {
      throw new HttpError(400, 'JUDUL_TIDAK_VALID', 'title wajib diisi dan maksimal 160 karakter.');
    }
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : 'aktif';
    if (!status || status.length > 30) {
      throw new HttpError(400, 'STATUS_TIDAK_VALID', 'status wajib diisi dan maksimal 30 karakter.');
    }
    const columns = structuredColumns(payload);
    if (columns.plot_id != null) await assertPlotInOrganization(orgId, columns.plot_id);
    const result = await query(
      `INSERT INTO organization_records
         (organization_id, author_user_id, record_type, title, phase, progress, due_at, payload, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, req.auth.user_id, type, title, columns.phase, columns.progress, columns.due_at, JSON.stringify(payload), status],
    );
    const rows = await query(`${RECORD_SELECT} WHERE id = ? AND organization_id = ?`, [result.insertId, orgId]);
    res.status(201).json({ data: serialize(rows[0]), meta: { organization_id: orgId } });
  }),
);

recordRouter.patch(
  '/organizations/:orgId/records/:type/:recordId',
  writeRoles,
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const type = parseRecordType(req.params.type);
    const recordId = parseId(req.params.recordId, 'record id');
    await loadOrganization(orgId);
    const changes = [];
    const params = [];
    if (req.body?.title !== undefined) {
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      if (!title || title.length > 160) {
        throw new HttpError(400, 'JUDUL_TIDAK_VALID', 'title wajib diisi dan maksimal 160 karakter.');
      }
      changes.push('title = ?');
      params.push(title);
    }
    if (req.body?.status !== undefined) {
      const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
      if (!status || status.length > 30) {
        throw new HttpError(400, 'STATUS_TIDAK_VALID', 'status wajib diisi dan maksimal 30 karakter.');
      }
      changes.push('status = ?');
      params.push(status);
    }
    const payload = parsePayload(req.body?.payload);
    if (payload !== undefined) {
      const columns = structuredColumns(payload);
      if (columns.plot_id != null) await assertPlotInOrganization(orgId, columns.plot_id);
      changes.push('payload = ?', 'plot_id = ?', 'phase = ?', 'progress = ?', 'due_at = ?');
      params.push(JSON.stringify(payload), columns.plot_id, columns.phase, columns.progress, columns.due_at);
    }
    if (!changes.length) throw new HttpError(400, 'PERUBAHAN_KOSONG', 'Isi minimal satu field yang akan diubah.');
    params.push(recordId, orgId, type);
    await query(
      `UPDATE organization_records SET ${changes.join(', ')}
        WHERE id = ? AND organization_id = ? AND record_type = ? AND deleted_at IS NULL`,
      params,
    );
    const rows = await query(
      `${RECORD_SELECT} WHERE id = ? AND organization_id = ? AND record_type = ? AND deleted_at IS NULL`,
      [recordId, orgId, type],
    );
    if (!rows[0]) throw new HttpError(404, 'CATATAN_TIDAK_DITEMUKAN', 'Catatan tidak ditemukan.');
    res.json({ data: serialize(rows[0]), meta: { organization_id: orgId } });
  }),
);

recordRouter.delete(
  '/organizations/:orgId/records/:type/:recordId',
  writeRoles,
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const type = parseRecordType(req.params.type);
    const recordId = parseId(req.params.recordId, 'record id');
    await loadOrganization(orgId);
    const result = await query(
      `UPDATE organization_records SET deleted_at = CURRENT_TIMESTAMP(6)
        WHERE id = ? AND organization_id = ? AND record_type = ? AND deleted_at IS NULL`,
      [recordId, orgId, type],
    );
    if (!result.affectedRows) throw new HttpError(404, 'CATATAN_TIDAK_DITEMUKAN', 'Catatan tidak ditemukan.');
    res.json({ data: { id: recordId, deleted: true }, meta: { organization_id: orgId } });
  }),
);
