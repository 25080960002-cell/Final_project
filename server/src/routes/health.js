import { Router } from 'express';
import { ping } from '../db.js';
import { asyncHandler } from '../http.js';

export const healthRouter = Router();

healthRouter.get(
  '/health',
  asyncHandler(async (req, res) => {
    let db;
    try {
      const info = await ping();
      db = { status: 'up', latency_ms: info.latency_ms };
    } catch {
      db = { status: 'down' };
    }

    const ok = db.status === 'up';
    res.status(ok ? 200 : 503).json({
      data: {
        status: ok ? 'ok' : 'degraded',
        db,
        uptime_seconds: Math.round(process.uptime()),
      },
      meta: { checked_at: new Date().toISOString() },
    });
  }),
);
