import {
  adaptCommodities,
  adaptGroups,
  adaptMembers,
  adaptOrganization,
  adaptPlots,
  adaptSummary,
} from './adapters';

const frontendHost = window.location.hostname;
const configuredBase = import.meta.env.VITE_API_BASE_URL;
const localHost = frontendHost === 'localhost' || frontendHost === '127.0.0.1';
const rawBase = configuredBase ?? `http://${frontendHost}:4000`;
const alignedBase = localHost
  ? String(rawBase).replace(/^http:\/\/(localhost|127\.0\.0\.1)(?=:\d+)/, `http://${frontendHost}`)
  : rawBase;
export const API_BASE = String(alignedBase).replace(/\/+$/, '');

const parsedOrg = Number(import.meta.env.VITE_ORGANIZATION_ID ?? 1);
export const ORGANIZATION_ID = Number.isInteger(parsedOrg) && parsedOrg > 0 ? parsedOrg : 1;
let activeOrganizationId = ORGANIZATION_ID;
export function setActiveOrganizationId(id) {
  const value = Number(id);
  if (Number.isInteger(value) && value > 0) activeOrganizationId = value;
}

const orgPath = (suffix) => `/api/organizations/${activeOrganizationId}${suffix}`;

async function getJson(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `Permintaan gagal (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function requestJson(path, method, data, signal, authToken) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `Permintaan gagal (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function fetchSession(signal) {
  const response = await getJson('/api/auth/session', signal);
  if (response.data?.organization_id) setActiveOrganizationId(response.data.organization_id);
  return response.data;
}

export async function login(credentials) {
  const payload = { email: credentials.email, password: credentials.password };
  if (credentials.organization_id !== undefined && credentials.organization_id !== '') {
    payload.organization_id = Number(credentials.organization_id);
  }
  const response = await requestJson('/api/auth/login', 'POST', payload);
  if (response.data?.organization_id) setActiveOrganizationId(response.data.organization_id);
  return response.data;
}

export async function googleAuthenticate(details) {
  const response = await requestJson('/api/auth/google', 'POST', details);
  if (response.data?.organization_id) setActiveOrganizationId(response.data.organization_id);
  return response.data;
}

export async function fetchGoogleConfig(signal) {
  const response = await getJson('/api/auth/google-config', signal);
  return response.data;
}

export async function fetchRegions(level = 'kabupaten', signal) {
  const params = new URLSearchParams({ level });
  const response = await getJson(`/api/reference/regions?${params}`, signal);
  return response.data;
}

export async function acceptInvitation(details) {
  const response = await requestJson('/api/auth/accept-invitation', 'POST', details);
  return response.data;
}

export async function fetchInvitationInfo(token, signal) {
  const response = await requestJson('/api/auth/invitation-info', 'POST', { token }, signal);
  return response.data;
}

export async function logout() {
  return requestJson('/api/auth/logout', 'POST');
}

export async function updateOrganizationSettings(changes) {
  const response = await requestJson(orgPath('/settings'), 'PATCH', changes);
  return response.data;
}

export async function updateOrganization(changes) {
  const response = await requestJson(orgPath(''), 'PATCH', changes);
  return response.data;
}

export async function updateMember(memberId, changes) {
  const response = await requestJson(orgPath(`/members/${encodeURIComponent(memberId)}`), 'PATCH', changes);
  return response.data;
}

export async function fetchWeather(signal) {
  const response = await getJson(orgPath('/weather'), signal);
  return response.data;
}

export async function fetchMapPlots(signal) {
  const response = await getJson(orgPath('/map/plots'), signal);
  return response;
}

export async function fetchPlotDetail(plotId, signal) {
  const response = await getJson(orgPath(`/plots/${encodeURIComponent(plotId)}`), signal);
  return response.data;
}

export async function fetchSymptoms(signal) {
  const response = await getJson('/api/reference/symptoms', signal);
  return response.data;
}

export async function fetchPredictions(signal) {
  const response = await getJson(orgPath('/predictions'), signal);
  return response.data;
}

async function prepareImageUpload(file, preserveOriginal) {
  if (preserveOriginal || file.type !== 'image/jpeg' || typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: file.lastModified }) : file;
  } finally {
    bitmap.close();
  }
}

export async function uploadImage(file, { preserveOriginal = false } = {}) {
  const preparedFile = await prepareImageUpload(file, preserveOriginal);
  const response = await fetch(`${API_BASE}${orgPath('/media')}`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': preparedFile.type },
    body: preparedFile,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? `Unggah gambar gagal (HTTP ${response.status}).`);
  return { ...body.data, url: `${API_BASE}${body.data.url}` };
}

export async function fetchRecords(type, signal) {
  const response = await getJson(orgPath(`/records/${encodeURIComponent(type)}?limit=200`), signal);
  return response.data;
}

/** Ringkasan data operasional dashboard (siklus aktif, tugas terbuka, dll). */
export async function fetchRecordsSummary(signal) {
  const response = await getJson(orgPath('/records/summary'), signal);
  return response.data;
}

export async function createRecord(type, record) {
  const response = await requestJson(orgPath(`/records/${encodeURIComponent(type)}`), 'POST', record);
  return response.data;
}

export async function updateRecord(type, id, changes) {
  const response = await requestJson(orgPath(`/records/${encodeURIComponent(type)}/${encodeURIComponent(id)}`), 'PATCH', changes);
  return response.data;
}

export async function removeRecord(type, id) {
  return requestJson(orgPath(`/records/${encodeURIComponent(type)}/${encodeURIComponent(id)}`), 'DELETE');
}

export async function createPlot(plot) {
  const response = await requestJson(orgPath('/plots'), 'POST', plot);
  return response.data;
}

export async function createInvitation(invitation) {
  const response = await requestJson(orgPath('/invitations'), 'POST', invitation);
  return { ...response.data, organization_id: response.meta?.organization_id };
}

export async function fetchInvitations(signal) {
  const response = await getJson(orgPath('/invitations'), signal);
  return response.data;
}

export async function resendInvitation(invitationId) {
  const response = await requestJson(orgPath(`/invitations/${encodeURIComponent(invitationId)}/resend`), 'POST');
  return { ...response.data, organization_id: response.meta?.organization_id };
}

/**
 * Ambil semua data Fase 1-2 yang dibutuhkan dashboard dalam satu kali jalan.
 * Satu endpoint gagal = seluruh snapshot gagal, lalu UI memakai data contoh.
 */
export async function fetchDashboardSnapshot(signal) {
  const org = activeOrganizationId;
  const [dashboard, plots, groups, members, organization, commodities] = await Promise.all([
    getJson(`/api/organizations/${org}/dashboard`, signal),
    getJson(`/api/organizations/${org}/plots?limit=200`, signal),
    getJson(`/api/organizations/${org}/farm-groups`, signal),
    getJson(`/api/organizations/${org}/members`, signal),
    getJson(`/api/organizations/${org}`, signal),
    getJson('/api/reference/commodities', signal),
  ]);

  return {
    summary: adaptSummary(dashboard.data),
    plots: adaptPlots(plots.data),
    groups: adaptGroups(groups.data),
    teamMembers: adaptMembers(members.data),
    organization: adaptOrganization(organization.data),
    commodities: adaptCommodities(commodities.data),
    fetchedAt: new Date().toISOString(),
  };
}
