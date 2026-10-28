import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { query } from '../db.js';
import { HttpError, asyncHandler, parseId, pickEnum } from '../http.js';
import { asBool, asIso, asNumber } from '../format.js';
import { loadOrganization, serializeOrganization } from '../services/organization.js';
import { hashInvitationToken, requireExtensionReadAccess, requireRoles } from '../auth.js';

export const organizationRouter = Router();

organizationRouter.patch(
  '/organizations/:orgId',
  requireRoles('administrator'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const columns = {
      name: { max: 160, required: true }, registration_no: { max: 60 },
      address: { max: 255 }, contact_email: { max: 160, email: true },
      contact_phone: { max: 32 }, description: { max: 5000 },
    };
    const updates = [];
    const params = [];
    for (const [key, rules] of Object.entries(columns)) {
      if (req.body?.[key] === undefined) continue;
      const value = req.body[key] === null ? null : typeof req.body[key] === 'string' ? req.body[key].trim() : undefined;
      if (value === undefined || (rules.required && !value) || (value && value.length > rules.max) || (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
        throw new HttpError(400, 'PROFIL_TIDAK_VALID', `${key} tidak valid.`);
      }
      updates.push(`${key} = ?`);
      params.push(value || null);
    }
    if (req.body?.type !== undefined) {
      const type = pickEnum(req.body.type, ['koperasi', 'gapoktan', 'perusahaan_agribisnis', 'lainnya'], 'type');
      if (!type) throw new HttpError(400, 'PROFIL_TIDAK_VALID', 'type tidak boleh kosong.');
      updates.push('type = ?');
      params.push(type);
    }
    if (req.body?.founded_year !== undefined) {
      const year = req.body.founded_year === null || req.body.founded_year === '' ? null : Number(req.body.founded_year);
      if (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) throw new HttpError(400, 'TAHUN_TIDAK_VALID', 'Tahun berdiri tidak valid.');
      updates.push('founded_year = ?');
      params.push(year);
    }
    if (!updates.length) throw new HttpError(400, 'PERUBAHAN_KOSONG', 'Tidak ada profil yang akan disimpan.');
    params.push(orgId);
    await query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ data: serializeOrganization(await loadOrganization(orgId)), meta: { organization_id: orgId } });
  }),
);

organizationRouter.get(
  '/organizations',
  requireExtensionReadAccess,
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT o.id, o.name, o.slug, o.type, o.status,
              r.name AS region_name,
              (SELECT COUNT(*) FROM plots p
                WHERE p.organization_id = o.id AND p.deleted_at IS NULL) AS plot_count,
              (SELECT COUNT(*) FROM organization_members m
                WHERE m.organization_id = o.id AND m.status = 'aktif') AS member_count
         FROM organizations o
         LEFT JOIN regions r ON r.id = o.region_id
        WHERE o.id = ? AND o.deleted_at IS NULL
        ORDER BY o.name`,
      [req.auth.organization_id],
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        type: row.type,
        status: row.status,
        region_name: row.region_name,
        plot_count: row.plot_count,
        member_count: row.member_count,
      })),
      meta: { total: rows.length },
    });
  }),
);

organizationRouter.get(
  '/organizations/:orgId',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const organization = await loadOrganization(orgId);

    const [settingsRows, counts] = await Promise.all([
      query(`SELECT * FROM organization_settings WHERE organization_id = ?`, [orgId]),
      query(
        `SELECT
           (SELECT COUNT(*) FROM plots
             WHERE organization_id = ? AND deleted_at IS NULL) AS plot_total,
           (SELECT COALESCE(SUM(area_ha), 0) FROM plots
             WHERE organization_id = ? AND deleted_at IS NULL) AS plot_area_ha,
           (SELECT COUNT(*) FROM organization_members
             WHERE organization_id = ? AND status = 'aktif') AS member_active,
           (SELECT COUNT(*) FROM farm_groups
             WHERE organization_id = ? AND deleted_at IS NULL) AS farm_group_total,
           (SELECT COUNT(*) FROM organization_invitations
             WHERE organization_id = ? AND status = 'pending') AS invitation_pending`,
        [orgId, orgId, orgId, orgId, orgId],
      ),
    ]);

    const settings = settingsRows[0]
      ? {
          area_unit: settingsRows[0].area_unit,
          date_format: settingsRows[0].date_format,
          auto_sync: asBool(settingsRows[0].auto_sync),
          weekly_report: asBool(settingsRows[0].weekly_report),
          high_res_photos: asBool(settingsRows[0].high_res_photos),
          public_profile: asBool(settingsRows[0].public_profile),
          join_approval: asBool(settingsRows[0].join_approval),
          extension_read_access: asBool(settingsRows[0].extension_read_access),
          weather_daily: asBool(settingsRows[0].weather_daily),
          activity_reminder: asBool(settingsRows[0].activity_reminder),
          updated_at: asIso(settingsRows[0].updated_at),
        }
      : null;

    res.json({
      data: {
        organization: serializeOrganization(organization),
        settings,
        counts: {
          plots: counts[0].plot_total,
          plot_area_ha: asNumber(counts[0].plot_area_ha),
          active_members: counts[0].member_active,
          farm_groups: counts[0].farm_group_total,
          pending_invitations: counts[0].invitation_pending,
        },
      },
      meta: { organization_id: orgId },
    });
  }),
);

organizationRouter.patch(
  '/organizations/:orgId/settings',
  requireRoles('administrator'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const allowed = new Map([
      ['area_unit', ['ha', 'm2', 'are']],
      ['date_format', ['d_m_y_long', 'd_m_y', 'y_m_d']],
    ]);
    const booleanKeys = new Set([
      'auto_sync', 'weekly_report', 'high_res_photos', 'public_profile',
      'join_approval', 'extension_read_access', 'weather_daily', 'activity_reminder',
    ]);
    const updates = [];
    const params = [];
    for (const [key, values] of allowed) {
      if (req.body?.[key] === undefined) continue;
      if (!values.includes(req.body[key])) throw new HttpError(400, 'PREFERENSI_TIDAK_VALID', `${key} tidak valid.`);
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
    for (const key of booleanKeys) {
      if (req.body?.[key] === undefined) continue;
      if (typeof req.body[key] !== 'boolean') throw new HttpError(400, 'PREFERENSI_TIDAK_VALID', `${key} harus bernilai true atau false.`);
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
    if (!updates.length) throw new HttpError(400, 'PERUBAHAN_KOSONG', 'Tidak ada preferensi yang akan disimpan.');
    await query('INSERT IGNORE INTO organization_settings (organization_id) VALUES (?)', [orgId]);
    params.push(orgId);
    await query(`UPDATE organization_settings SET ${updates.join(', ')} WHERE organization_id = ?`, params);
    const rows = await query('SELECT * FROM organization_settings WHERE organization_id = ?', [orgId]);
    const row = rows[0];
    res.json({ data: {
      area_unit: row.area_unit, date_format: row.date_format,
      auto_sync: asBool(row.auto_sync), weekly_report: asBool(row.weekly_report),
      high_res_photos: asBool(row.high_res_photos), public_profile: asBool(row.public_profile),
      join_approval: asBool(row.join_approval), extension_read_access: asBool(row.extension_read_access),
      weather_daily: asBool(row.weather_daily), activity_reminder: asBool(row.activity_reminder),
      updated_at: asIso(row.updated_at),
    }, meta: { organization_id: orgId } });
  }),
);

organizationRouter.get(
  '/organizations/:orgId/dashboard',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const organization = await loadOrganization(orgId);

    const [plotStatus, memberRole, groupRows, invitationStatus, healthRows] = await Promise.all([
      query(
        `SELECT status, COUNT(*) AS total, COALESCE(SUM(area_ha), 0) AS area_ha
           FROM plots
          WHERE organization_id = ? AND deleted_at IS NULL
          GROUP BY status
          ORDER BY status`,
        [orgId],
      ),
      query(
        `SELECT role, COUNT(*) AS total
           FROM organization_members
          WHERE organization_id = ? AND status = 'aktif'
          GROUP BY role
          ORDER BY total DESC, role`,
        [orgId],
      ),
      query(
        `SELECT COUNT(*) AS total
           FROM farm_groups
          WHERE organization_id = ? AND deleted_at IS NULL`,
        [orgId],
      ),
      query(
        `SELECT status, COUNT(*) AS total
           FROM organization_invitations
          WHERE organization_id = ?
          GROUP BY status
          ORDER BY status`,
        [orgId],
      ),
      query(
        `WITH latest AS (
           SELECT h.plot_id, h.health_score, h.recorded_at,
                  ROW_NUMBER() OVER (PARTITION BY h.plot_id
                                     ORDER BY h.recorded_at DESC, h.id DESC) AS rn
             FROM plot_health_snapshots h
             JOIN plots p ON p.id = h.plot_id
            WHERE p.organization_id = ? AND p.deleted_at IS NULL
         )
         SELECT ROUND(AVG(health_score), 1) AS average,
                COUNT(*) AS plots_with_data,
                MAX(recorded_at) AS latest_recorded_at
           FROM latest
          WHERE rn = 1`,
        [orgId],
      ),
    ]);

    const plotTotal = plotStatus.reduce((sum, row) => sum + Number(row.total), 0);
    const plotArea = plotStatus.reduce((sum, row) => sum + Number(row.area_ha), 0);
    const memberActive = memberRole.reduce((sum, row) => sum + Number(row.total), 0);
    const invitationPending = invitationStatus.find((row) => row.status === 'pending');

    res.json({
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          type: organization.type,
        },
        plots: {
          total: plotTotal,
          area_ha: Number(plotArea.toFixed(2)),
          by_status: plotStatus.map((row) => ({
            status: row.status,
            total: Number(row.total),
            area_ha: Number(Number(row.area_ha).toFixed(2)),
          })),
        },
        members: {
          active: memberActive,
          by_role: memberRole.map((row) => ({
            role: row.role,
            total: Number(row.total),
          })),
        },
        farm_groups: { total: Number(groupRows[0].total) },
        invitations: {
          pending: invitationPending ? Number(invitationPending.total) : 0,
          by_status: invitationStatus.map((row) => ({
            status: row.status,
            total: Number(row.total),
          })),
        },
        health: {
          average_score: asNumber(healthRows[0].average),
          plots_with_data: Number(healthRows[0].plots_with_data),
          latest_recorded_at: asIso(healthRows[0].latest_recorded_at),
        },
        cultivation: {
          available: false,
          note:
            'Komoditas, fase tumbuh, dan hasil panen berasal dari cultivation_cycles (Fase 3) dan belum tersedia di API v0.1.',
        },
      },
      meta: {
        organization_id: orgId,
        generated_at: new Date().toISOString(),
        source: 'MySQL mapan, tabel Fase 1-2',
      },
    });
  }),
);

organizationRouter.get(
  '/organizations/:orgId/members',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);

    const rows = await query(
      `SELECT m.id, m.role, m.status AS membership_status, m.joined_at, m.created_at,
              u.id AS user_id, u.full_name, u.email, u.phone,
              u.status AS user_status, u.last_active_at,
              (SELECT COUNT(*)
                 FROM plot_managers pm
                 JOIN plots p ON p.id = pm.plot_id
                WHERE pm.user_id = u.id AND pm.is_primary = 1
                  AND p.organization_id = ? AND p.deleted_at IS NULL) AS primary_plot_count
         FROM organization_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = ? AND u.deleted_at IS NULL
        ORDER BY FIELD(m.role, 'administrator', 'manajer_lapangan', 'penyuluh', 'petani'),
                 u.full_name`,
      [orgId, orgId],
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: row.membership_status,
        user_status: row.user_status,
        joined_at: asIso(row.joined_at),
        last_active_at: asIso(row.last_active_at),
        primary_plot_count: Number(row.primary_plot_count),
      })),
      meta: { organization_id: orgId, total: rows.length },
    });
  }),
);

organizationRouter.patch(
  '/organizations/:orgId/members/:memberId',
  requireRoles('administrator'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const memberId = parseId(req.params.memberId, 'member id');
    await loadOrganization(orgId);
    const existing = await query('SELECT user_id, role, status FROM organization_members WHERE id = ? AND organization_id = ?', [memberId, orgId]);
    if (!existing[0]) throw new HttpError(404, 'ANGGOTA_TIDAK_DITEMUKAN', 'Keanggotaan tidak ditemukan.');
    const updates = [];
    const params = [];
    if (req.body?.role !== undefined) {
      const role = pickEnum(req.body.role, ['administrator', 'manajer_lapangan', 'petani', 'penyuluh'], 'role');
      if (!role) throw new HttpError(400, 'PERAN_TIDAK_VALID', 'Peran tidak valid.');
      updates.push('role = ?'); params.push(role);
    }
    if (req.body?.status !== undefined) {
      const status = pickEnum(req.body.status, ['aktif', 'undangan', 'nonaktif'], 'status');
      if (!status) throw new HttpError(400, 'STATUS_TIDAK_VALID', 'Status tidak valid.');
      updates.push('status = ?'); params.push(status);
      if (status === 'aktif') updates.push('joined_at = COALESCE(joined_at, UTC_TIMESTAMP(6))');
    }
    if (!updates.length) throw new HttpError(400, 'PERUBAHAN_KOSONG', 'Pilih peran atau status baru.');
    const nextRole = req.body?.role ?? existing[0].role;
    const nextStatus = req.body?.status ?? existing[0].status;
    if (Number(existing[0].user_id) === Number(req.auth.user_id) && (nextRole !== existing[0].role || nextStatus !== existing[0].status)) {
      throw new HttpError(409, 'AKUN_SENDIRI_TIDAK_DAPAT_DIUBAH', 'Minta administrator lain untuk mengubah keanggotaan akun Anda.');
    }
    if (existing[0].role === 'administrator' && existing[0].status === 'aktif' && (nextRole !== 'administrator' || nextStatus !== 'aktif')) {
      const admins = await query(`SELECT COUNT(*) AS total FROM organization_members WHERE organization_id = ? AND role = 'administrator' AND status = 'aktif'`, [orgId]);
      if (Number(admins[0].total) <= 1) throw new HttpError(409, 'ADMIN_TERAKHIR', 'Organisasi harus memiliki minimal satu administrator aktif.');
    }
    params.push(memberId, orgId);
    const result = await query(`UPDATE organization_members SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`, params);
    if (!result.affectedRows) throw new HttpError(404, 'ANGGOTA_TIDAK_DITEMUKAN', 'Keanggotaan tidak ditemukan.');
    res.json({ data: { id: memberId, updated: true }, meta: { organization_id: orgId } });
  }),
);

organizationRouter.get(
  '/organizations/:orgId/invitations',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);

    const rows = await query(
      `SELECT i.id, i.invitee_name, i.email, i.role, i.status, i.expires_at, i.accepted_at,
              i.created_at, i.invited_by_id, u.full_name AS invited_by_name
         FROM organization_invitations i
         LEFT JOIN users u ON u.id = i.invited_by_id
        WHERE i.organization_id = ?
        ORDER BY i.created_at DESC`,
      [orgId],
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.invitee_name,
        email: row.email,
        role: row.role,
        status: row.status,
        expires_at: asIso(row.expires_at),
        accepted_at: asIso(row.accepted_at),
        created_at: asIso(row.created_at),
        invited_by: row.invited_by_id
          ? { id: row.invited_by_id, name: row.invited_by_name }
          : null,
      })),
      meta: {
        organization_id: orgId,
        total: rows.length,
        note: 'Token undangan tidak pernah dikirim lewat endpoint daftar.',
      },
    });
  }),
);

organizationRouter.post(
  '/organizations/:orgId/invitations',
  requireRoles('administrator'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body?.role;
    if (!name || name.length > 120) {
      throw new HttpError(400, 'NAMA_TIDAK_VALID', 'Nama wajib diisi dan maksimal 120 karakter.');
    }
    if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'EMAIL_TIDAK_VALID', 'Alamat email tidak valid.');
    }
    if (!['administrator', 'manajer_lapangan', 'petani', 'penyuluh'].includes(role)) {
      throw new HttpError(400, 'PERAN_TIDAK_VALID', 'Peran anggota tidak valid.');
    }
    const token = randomBytes(32).toString('hex');
    try {
      const result = await query(
        `INSERT INTO organization_invitations
           (organization_id, invitee_name, email, role, token, expires_at)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 7 DAY))`,
        [orgId, name, email, role, hashInvitationToken(token)],
      );
      const rows = await query(
        `SELECT id, invitee_name, email, role, status, expires_at, created_at
           FROM organization_invitations WHERE id = ? AND organization_id = ?`,
        [result.insertId, orgId],
      );
      const row = rows[0];
      res.status(201).json({
        data: {
          id: row.id, name: row.invitee_name, email: row.email, role: row.role,
          status: row.status, expires_at: asIso(row.expires_at), created_at: asIso(row.created_at),
          token,
        },
        meta: { organization_id: orgId, delivery: 'not_configured' },
      });
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'UNDANGAN_SUDAH_AKTIF', 'Masih ada undangan aktif untuk email tersebut.');
      }
      throw error;
    }
  }),
);

organizationRouter.post(
  '/organizations/:orgId/invitations/:invitationId/resend',
  requireRoles('administrator'),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    const invitationId = parseId(req.params.invitationId, 'invitation id');
    const token = randomBytes(32).toString('hex');
    const result = await query(
      `UPDATE organization_invitations
          SET token = ?, expires_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 7 DAY)
        WHERE id = ? AND organization_id = ? AND status = 'pending'`,
      [hashInvitationToken(token), invitationId, orgId],
    );
    if (!result.affectedRows) throw new HttpError(404, 'UNDANGAN_TIDAK_DITEMUKAN', 'Undangan pending tidak ditemukan atau sudah diterima.');
    res.json({ data: { id: invitationId, token }, meta: { organization_id: orgId, delivery: 'not_configured' } });
  }),
);

organizationRouter.get(
  '/organizations/:orgId/farm-groups',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);

    const rows = await query(
      `SELECT g.id, g.name, g.established_year, g.description,
              g.region_id, r.name AS region_name,
              g.leader_user_id, l.full_name AS leader_name,
              (SELECT COUNT(*) FROM farm_group_members m
                WHERE m.farm_group_id = g.id) AS member_count,
              (SELECT COUNT(*) FROM plots p
                WHERE p.farm_group_id = g.id AND p.deleted_at IS NULL) AS plot_count,
              (SELECT COALESCE(SUM(p.area_ha), 0) FROM plots p
                WHERE p.farm_group_id = g.id AND p.deleted_at IS NULL) AS area_ha
         FROM farm_groups g
         LEFT JOIN regions r ON r.id = g.region_id
         LEFT JOIN users l ON l.id = g.leader_user_id
        WHERE g.organization_id = ? AND g.deleted_at IS NULL
        ORDER BY g.name`,
      [orgId],
    );

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        established_year: row.established_year,
        description: row.description,
        region: row.region_id ? { id: row.region_id, name: row.region_name } : null,
        leader: row.leader_user_id
          ? { user_id: row.leader_user_id, full_name: row.leader_name }
          : null,
        member_count: Number(row.member_count),
        plot_count: Number(row.plot_count),
        area_ha: asNumber(row.area_ha),
      })),
      meta: { organization_id: orgId, total: rows.length },
    });
  }),
);
