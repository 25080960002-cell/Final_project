import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express, { Router } from 'express';
import { config } from '../config.js';
import { query } from '../db.js';
import { HttpError, asyncHandler, parseId } from '../http.js';
import { loadOrganization } from '../services/organization.js';

export const mediaRouter = Router();
const mediaTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const signatureMatches = (buffer, type) => {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
};

mediaRouter.post(
  '/organizations/:orgId/media',
  express.raw({ type: [...mediaTypes], limit: '10mb' }),
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const mimeType = req.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!mediaTypes.has(mimeType) || !Buffer.isBuffer(req.body) || req.body.length < 1 || req.body.length > 10 * 1024 * 1024) {
      throw new HttpError(400, 'BERKAS_TIDAK_VALID', 'Pilih JPEG, PNG, atau WEBP berukuran maksimal 10 MB.');
    }
    if (!signatureMatches(req.body, mimeType)) throw new HttpError(400, 'ISI_BERKAS_TIDAK_VALID', 'Isi berkas tidak sesuai dengan jenis gambar.');
    const id = randomUUID();
    const filePath = path.join(config.mediaDirectory, `${id}.img`);
    await mkdir(config.mediaDirectory, { recursive: true });
    await writeFile(filePath, req.body, { flag: 'wx', mode: 0o600 });
    try {
      await query('INSERT INTO media_objects (id, organization_id, uploaded_by_id, mime_type, file_size) VALUES (?, ?, ?, ?, ?)', [id, orgId, req.auth.user_id, mimeType, req.body.length]);
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw error;
    }
    res.status(201).json({ data: { id, url: `/api/organizations/${orgId}/media/${id}`, mime_type: mimeType, file_size: req.body.length } });
  }),
);

mediaRouter.get(
  '/organizations/:orgId/media/:mediaId',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const id = req.params.mediaId;
    if (!/^[a-f\d-]{36}$/i.test(id)) throw new HttpError(404, 'BERKAS_TIDAK_DITEMUKAN', 'Berkas tidak ditemukan.');
    const rows = await query('SELECT mime_type, file_size FROM media_objects WHERE id = ? AND organization_id = ?', [id, orgId]);
    if (!rows[0]) throw new HttpError(404, 'BERKAS_TIDAK_DITEMUKAN', 'Berkas tidak ditemukan.');
    let content;
    try { content = await readFile(path.join(config.mediaDirectory, `${id}.img`)); }
    catch { throw new HttpError(404, 'BERKAS_TIDAK_DITEMUKAN', 'Berkas tidak ditemukan.'); }
    res.setHeader('Content-Type', rows[0].mime_type);
    res.setHeader('Content-Length', rows[0].file_size);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(content);
  }),
);
