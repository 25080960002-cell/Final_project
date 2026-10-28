/**
 * Fungsi murni untuk mengubah respons API menjadi bentuk yang dipakai
 * komponen dashboard (bentuknya sama dengan data contoh lama).
 * Tidak ada akses browser di sini supaya mudah diuji dengan Node.
 */

const PLOT_STATUS = {
  sehat: { label: 'Sehat', tone: 'green' },
  perhatian: { label: 'Perhatian', tone: 'gold' },
  kritis: { label: 'Kritis', tone: 'red' },
  tidak_aktif: { label: 'Tidak aktif', tone: 'neutral' },
};

const ROLES = {
  administrator: 'Administrator',
  manajer_lapangan: 'Manajer lapangan',
  petani: 'Petani',
  penyuluh: 'Penyuluh',
};

const MEMBERSHIP = {
  aktif: 'Aktif',
  undangan: 'Undangan',
  nonaktif: 'Nonaktif',
};

const ORG_TYPES = {
  koperasi: 'Koperasi pertanian',
  gapoktan: 'Gapoktan',
  perusahaan_agribisnis: 'Perusahaan agribisnis',
  lainnya: 'Organisasi pertanian',
};

const TONES = ['green', 'blue', 'gold', 'violet'];

export function formatNumber(value, maxFractionDigits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: maxFractionDigits }).format(number);
}

export function formatArea(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${formatNumber(number)} ha` : '—';
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function adaptPlot(plot) {
  const status = PLOT_STATUS[plot.status] ?? { label: plot.status, tone: 'neutral' };
  return {
    id: `p${plot.id}`,
    plot_id: plot.id,
    code: plot.code,
    name: plot.name,
    area: formatArea(plot.area_ha),
    area_ha: Number(plot.area_ha) || 0,
    farmer: plot.farmer?.full_name ?? '—',
    crop: plot.crop ?? 'Belum ada siklus',
    phase: plot.phase ?? '—',
    status: status.label,
    status_code: plot.status,
    location: plot.location?.label ?? plot.location?.region ?? '—',
    region: plot.location?.region ?? null,
    color: status.tone,
    health: plot.health?.score ?? 0,
    health_recorded_at: plot.health?.recorded_at ?? null,
    boundary: plot.boundary ?? null,
    point: plot.location?.point ?? null,
    farm_group: plot.farm_group?.name ?? null,
    raw: plot,
  };
}

export function adaptPlots(rows = []) {
  return rows.map(adaptPlot);
}

export function adaptGroup(group, index = 0) {
  return {
    id: group.id,
    name: group.name,
    members: group.member_count,
    area: formatArea(group.area_ha),
    area_ha: Number(group.area_ha) || 0,
    leader: group.leader?.full_name ?? '—',
    tone: TONES[index % TONES.length],
    raw: group,
  };
}

export function adaptGroups(rows = []) {
  return rows.map(adaptGroup);
}

export function adaptMember(member, index = 0) {
  return {
    id: `u${member.user_id}`,
    user_id: member.user_id,
    name: member.full_name,
    email: member.email,
    role: ROLES[member.role] ?? member.role,
    role_code: member.role,
    status: MEMBERSHIP[member.status] ?? member.status,
    last: formatDate(member.last_active_at),
    joined_at: member.joined_at,
    primary_plot_count: member.primary_plot_count ?? 0,
    tone: TONES[index % TONES.length],
    raw: member,
  };
}

export function adaptMembers(rows = []) {
  return rows.map(adaptMember);
}

export function adaptSummary(payload) {
  if (!payload) return null;
  const plotStatus = Object.fromEntries(
    (payload.plots?.by_status ?? []).map((row) => [row.status, row.total]),
  );
  const memberRole = Object.fromEntries(
    (payload.members?.by_role ?? []).map((row) => [row.role, row.total]),
  );

  return {
    plot_total: payload.plots?.total ?? 0,
    area_ha: Number(payload.plots?.area_ha) || 0,
    member_active: payload.members?.active ?? 0,
    group_total: payload.farm_groups?.total ?? 0,
    invitation_pending: payload.invitations?.pending ?? 0,
    health_average: payload.health?.average_score ?? null,
    health_latest_at: payload.health?.latest_recorded_at ?? null,
    plot_status: plotStatus,
    member_role: memberRole,
  };
}

export function adaptOrganization(payload) {
  if (!payload?.organization) return null;
  const { organization, counts } = payload;
  return {
    id: organization.id,
    name: organization.name,
    type: ORG_TYPES[organization.type] ?? organization.type,
    type_code: organization.type,
    region: organization.region?.label ?? '—',
    address: organization.address,
    email: organization.contact_email,
    registration_no: organization.registration_no,
    founded_year: organization.founded_year,
    description: organization.description,
    status: organization.status === 'aktif' ? 'Aktif' : organization.status,
    plot_total: counts?.plots ?? 0,
    area_ha: Number(counts?.plot_area_ha) || 0,
    member_active: counts?.active_members ?? 0,
    group_total: counts?.farm_groups ?? 0,
    pending_invitations: counts?.pending_invitations ?? 0,
    raw: payload,
  };
}

export function adaptCommodities(rows = []) {
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    variety_count: row.varieties?.length ?? 0,
    raw: row,
  }));
}
