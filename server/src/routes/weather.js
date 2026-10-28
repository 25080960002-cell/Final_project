import { Router } from 'express';
import { query } from '../db.js';
import { HttpError, asyncHandler, parseId } from '../http.js';
import { asNumber } from '../format.js';
import { loadOrganization } from '../services/organization.js';

export const weatherRouter = Router();
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function describeWeather(code) {
  if (code === 0) return 'Cerah';
  if ([1, 2].includes(code)) return 'Cerah berawan';
  if (code === 3) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Salju';
  if ([95, 96, 99].includes(code)) return 'Badai petir';
  return 'Kondisi tidak diketahui';
}

function riskFor(probability, code) {
  if ([95, 96, 99].includes(code) || probability >= 70) return 'tinggi';
  if (probability >= 40 || [61, 63, 65, 80, 81, 82].includes(code)) return 'sedang';
  return 'rendah';
}

weatherRouter.get(
  '/organizations/:orgId/weather',
  asyncHandler(async (req, res) => {
    const orgId = parseId(req.params.orgId, 'organization id');
    await loadOrganization(orgId);
    const locations = await query(
      `SELECT r.id, r.name, r.latitude, r.longitude
         FROM organizations o JOIN regions r ON r.id = o.region_id
        WHERE o.id = ? AND o.deleted_at IS NULL`,
      [orgId],
    );
    const region = locations[0];
    if (!region || region.latitude === null || region.longitude === null) {
      throw new HttpError(409, 'KOORDINAT_WILAYAH_KOSONG', 'Wilayah organisasi belum memiliki koordinat untuk prakiraan cuaca.');
    }
    const latitude = asNumber(region.latitude);
    const longitude = asNumber(region.longitude);
    const key = `${latitude},${longitude}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return res.json({ data: cached.data, meta: { organization_id: orgId, cached: true, provider: 'Open-Meteo' } });
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
      forecast_days: '5',
      timezone: 'auto',
    }).toString();

    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } });
    } catch {
      throw new HttpError(503, 'LAYANAN_CUACA_TIDAK_TERSEDIA', 'Layanan cuaca sementara tidak dapat dihubungi.');
    }
    if (!response.ok) {
      throw new HttpError(503, 'LAYANAN_CUACA_TIDAK_TERSEDIA', 'Layanan cuaca memberikan respons gagal.');
    }
    const body = await response.json();
    if (!body.current || !body.daily?.time) {
      throw new HttpError(502, 'RESPONS_CUACA_TIDAK_VALID', 'Format prakiraan cuaca tidak dikenali.');
    }
    const currentCode = Number(body.current.weather_code);
    const currentRain = Number(body.current.precipitation_probability ?? 0);
    const data = {
      location: { region_id: region.id, name: region.name, latitude, longitude },
      current: {
        time: body.current.time,
        temperature_c: asNumber(body.current.temperature_2m),
        humidity_pct: asNumber(body.current.relative_humidity_2m),
        wind_kmh: asNumber(body.current.wind_speed_10m),
        rain_probability_pct: asNumber(body.current.precipitation_probability),
        weather_code: currentCode,
        description: describeWeather(currentCode),
        risk: riskFor(currentRain, currentCode),
      },
      forecast: body.daily.time.map((date, index) => {
        const code = Number(body.daily.weather_code[index]);
        const probability = Number(body.daily.precipitation_probability_max[index] ?? 0);
        return {
          date,
          temperature_max_c: asNumber(body.daily.temperature_2m_max[index]),
          temperature_min_c: asNumber(body.daily.temperature_2m_min[index]),
          rain_probability_pct: asNumber(probability),
          precipitation_mm: asNumber(body.daily.precipitation_sum[index]),
          weather_code: code,
          description: describeWeather(code),
          risk: riskFor(probability, code),
        };
      }),
      updated_at: new Date().toISOString(),
      attribution: 'Open-Meteo',
    };
    cache.set(key, { cachedAt: Date.now(), data });
    res.json({ data, meta: { organization_id: orgId, cached: false, provider: 'Open-Meteo' } });
  }),
);
