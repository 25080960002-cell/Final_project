import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { config, isProduction } from './config.js';
import { HttpError } from './http.js';
import { healthRouter } from './routes/health.js';
import { organizationRouter } from './routes/organizations.js';
import { plotRouter } from './routes/plots.js';
import { referenceRouter } from './routes/reference.js';
import { recordRouter } from './routes/records.js';
import { authRouter } from './routes/auth.js';
import { weatherRouter } from './routes/weather.js';
import { predictionRouter } from './routes/predictions.js';
import { mediaRouter } from './routes/media.js';
import { requireAuth, requireExtensionReadAccess, requireTenant } from './auth.js';

/** Cocokkan origin dengan daftar CORS_ORIGINS; pola `*` mengizinkan satu label domain. */
function originAllowed(origin, patterns) {
  return patterns.some((pattern) => {
    if (pattern === '*') return true;
    if (!pattern.includes('*')) return pattern === origin;
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
    return new RegExp(`^${escaped}$`, 'i').test(origin);
  });
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.use((req, res, next) => cors({
      origin(origin, callback) {
        if (!origin || originAllowed(origin, config.corsOrigins)) return callback(null, true);
        try {
          const parsedOrigin = new URL(origin);
          if (['http:', 'https:'].includes(parsedOrigin.protocol) && parsedOrigin.host === req.get('host')) return callback(null, true);
        } catch { /* Origin malformed; reject below. */ }
        // Saat development, izinkan port Vite berapa pun di localhost.
        if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new HttpError(403, 'ORIGIN_DITOLAK', 'Origin tidak diizinkan.'));
      },
      credentials: true,
  })(req, res, next));
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const entry = {
        level: 'info', request_id: req.id, method: req.method,
        path: req.path, status: res.statusCode, duration_ms: Number(ms.toFixed(1)),
      };
      if (isProduction) console.log(JSON.stringify(entry));
      else console.log(`${entry.method} ${entry.path} -> ${entry.status} (${entry.duration_ms} ms) [${entry.request_id}]`);
    });
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (req, res) => {
    res.json({
      data: {
        name: 'MAPAN API',
        version: '0.1.0',
        docs: '/api',
        health: '/api/health',
      },
    });
  });

  app.get('/api', (req, res) => {
    res.json({
      data: {
        version: '0.1.0',
        scope: 'Dashboard tenant, autentikasi sesi, catatan operasional, cuaca, dan estimasi hasil.',
        endpoints: [
          'GET /api/health',
          'POST /api/auth/invitation-info',
          'POST /api/auth/accept-invitation',
          'POST /api/auth/login',
          'POST /api/auth/google',
          'GET /api/auth/google-config',
          'GET /api/auth/session',
          'POST /api/auth/logout',
          'GET /api/organizations',
          'GET /api/organizations/:orgId',
          'PATCH /api/organizations/:orgId',
          'PATCH /api/organizations/:orgId/settings',
          'GET /api/organizations/:orgId/dashboard',
          'GET /api/organizations/:orgId/plots',
          'POST /api/organizations/:orgId/plots',
          'GET /api/organizations/:orgId/plots/:plotId',
          'GET /api/organizations/:orgId/map/plots',
          'GET /api/organizations/:orgId/farm-groups',
          'GET /api/organizations/:orgId/members',
          'GET /api/organizations/:orgId/invitations',
          'POST /api/organizations/:orgId/invitations',
          'POST /api/organizations/:orgId/invitations/:invitationId/resend',
          'PATCH /api/organizations/:orgId/members/:memberId',
          'GET /api/organizations/:orgId/weather',
          'GET /api/organizations/:orgId/predictions',
          'GET /api/reference/commodities',
          'GET /api/reference/symptoms',
          'GET /api/reference/regions',
          'GET /api/organizations/:orgId/records/summary',
          'GET /api/organizations/:orgId/records/:type',
          'POST /api/organizations/:orgId/records/:type',
          'PATCH /api/organizations/:orgId/records/:type/:recordId',
          'DELETE /api/organizations/:orgId/records/:type/:recordId',
          'POST /api/organizations/:orgId/media',
          'GET /api/organizations/:orgId/media/:mediaId',
        ],
      },
    });
  });

  app.use('/api', healthRouter, referenceRouter, authRouter);
  app.use('/api', requireAuth);
  app.use('/api/organizations/:orgId', requireTenant);
  app.use('/api/organizations/:orgId', requireExtensionReadAccess);
  app.use('/api', organizationRouter, plotRouter, recordRouter, weatherRouter, predictionRouter, mediaRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'ENDPOINT_TIDAK_DITEMUKAN',
        message: `Endpoint ${req.method} ${req.path} tidak ada.`,
      },
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'JSON_TIDAK_VALID', message: 'Body request bukan JSON yang valid.' },
      });
    }

    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'REQUEST_TERLALU_BESAR', message: 'Ukuran request melebihi batas yang diizinkan.' } });
    }

    if (err?.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: {
          code: 'TABEL_TIDAK_ADA',
          message: 'Tabel yang diminta tidak ada. Pastikan semua migrasi database sudah dijalankan.',
        },
      });
    }

    console.error(JSON.stringify({
      level: 'error', request_id: req.id, method: req.method, path: req.path,
      error_code: err?.code, error: isProduction ? err?.name : err?.message,
      stack: isProduction ? undefined : err?.stack,
    }));
    return res.status(500).json({
      error: {
        code: 'KESALAHAN_INTERNAL',
        message: 'Terjadi kesalahan pada server.',
        ...(isProduction ? {} : { details: err?.message }),
      },
    });
  });

  return app;
}
