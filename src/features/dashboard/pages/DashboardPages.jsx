import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudRain,
  CloudSun,
  Download,
  Droplets,
  Ellipsis,
  FileBarChart2,
  Filter,
  Layers,
  Mail,
  MapPin,
  KeyRound,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sprout,
  Sun,
  Trash2,
  TrendingUp,
  Users,
  Wheat,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  Modal,
  Progress,
  Status,
  Toggle,
} from '../../../shared/ui';
import {
  commodityShare,
  reports,
} from '../data/dashboard';
import { useDashboardData } from '../data/DashboardDataContext';
import { changePassword, createInvitation, createPlot, deletePlot, updatePlot, updateProfile, createRecord, fetchInvitations, fetchMapPlots, fetchPlotDetail, fetchRecords, fetchRecordsSummary, resendInvitation, updateMember, updateOrganization, updateOrganizationSettings, updateRecord, fetchPredictions, fetchWeather } from '../data/apiClient';
import { adaptPlot, formatNumber } from '../data/adapters';
import { passwordChecks, passwordStrength } from '../../../shared/lib/password';
import { isGoogleMapsConfigured, loadGoogleMaps } from '../../../shared/lib/googleMaps';
import riceTerraces from '../../landing/assets/images/rice-terraces.jpg';
import paddyPlanting from '../../landing/assets/images/paddy-planting.jpg';
import harvestCommunity from '../../landing/assets/images/harvest-community.jpg';
import plantationRows from '../../landing/assets/images/plantation-rows.jpg';
import cornField from '../../landing/assets/images/corn-field.jpg';
import { ActivityPanel, ChartCard, CommodityPanel, MapPreview, Stat, TasksPanel, WeatherPanel } from '../components/DashboardWidgets';
import { CommunityPage, PlantHealthPage } from './HealthCommunityPages';

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PageHead({ eyebrow, title, desc, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchField({ value, onChange, placeholder = 'Cari data...' }) {
  return (
    <label className="search-field">
      <Search size={15} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Bersihkan pencarian"><X size={13} /></button>}
    </label>
  );
}

function OnboardingCard({ summary, hasActivity, setPage, onDismiss }) {
  const steps = [
    { id: 'akun', label: 'Akun dan organisasi dibuat', done: true },
    { id: 'lahan', label: 'Tambahkan lahan pertama', hint: 'Catat nama petak, luas, dan komoditasnya.', done: (summary?.plot_total ?? 0) > 0, page: 'lahan' },
    { id: 'anggota', label: 'Undang petani atau pengurus', hint: 'Bagikan tautan undangan agar tim bisa mencatat bersama.', done: (summary?.member_active ?? 0) > 1 || (summary?.invitation_pending ?? 0) > 0, page: 'pengguna' },
    { id: 'aktivitas', label: 'Catat aktivitas pertama', hint: 'Pemupukan, penyemprotan, atau pengamatan lapangan.', done: hasActivity, page: 'aktivitas' },
    { id: 'cuaca', label: 'Cek prakiraan cuaca wilayah', hint: 'Butuh koordinat wilayah di profil organisasi.', done: false, page: 'cuaca', optional: true },
  ];
  const required = steps.filter((step) => !step.optional);
  const doneCount = required.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  return (
    <section className="panel onboarding-card" aria-label="Langkah awal">
      <div className="onboarding-head">
        <div><span className="eyebrow">LANGKAH AWAL</span><h3>Siapkan ruang kerja Anda</h3><p>{doneCount} dari {required.length} langkah selesai.</p></div>
        <button type="button" className="onboarding-dismiss" onClick={onDismiss} aria-label="Sembunyikan langkah awal"><X size={16} /></button>
      </div>
      <Progress value={Math.round((doneCount / required.length) * 100)} tone="green" />
      <ol className="onboarding-steps">
        {steps.map((step) => (
          <li key={step.id} className={step.done ? 'is-done' : ''}>
            <span className="onboarding-mark">{step.done ? <Check size={14} /> : null}</span>
            <span><b>{step.label}</b>{step.hint && !step.done && <small>{step.hint}</small>}</span>
            {!step.done && step.page && <Button variant={step.id === next?.id ? 'primary' : 'secondary'} onClick={() => setPage(step.page)}>Buka <ArrowRight size={14} /></Button>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DashboardHome({ setPage, notify }) {
  const [tasks, setTasks] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const [activities, setActivities] = useState([]);
  const { summary, session, organization, demo } = useDashboardData();
  const [onboardingHidden, setOnboardingHidden] = useState(false);
  const readOnly = !session || session.user?.role === 'penyuluh';
  const needsOnboarding = !demo && !onboardingHidden && session?.user?.role === 'administrator'
    && ((summary?.plot_total ?? 0) === 0 || (summary?.member_active ?? 0) <= 1);
  const showWeather = organization?.raw?.settings?.weather_daily ?? true;

  useEffect(() => {
    let active = true;
    fetchRecords('task')
      .then((records) => {
        if (active) setTasks(records.map((record) => ({
          id: record.id,
          label: record.title,
          meta: record.payload.meta ?? 'Tugas tersimpan',
          done: record.status === 'selesai',
        })));
      })
      .catch(() => {});
    fetchRecords('activity').then((records) => {
      if (active) setActivities(records.map((record) => ({
        title: record.title,
        plot: record.payload.plot ?? record.payload.description ?? 'Aktivitas lapangan',
        time: record.created_at ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(record.created_at)) : 'Baru',
        tone: 'leaf',
      })));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPredictions(controller.signal).then(setPrediction).catch(() => {});
    if (showWeather) {
      fetchWeather(controller.signal).then(setWeather).catch((cause) => {
        if (cause.name !== 'AbortError') setWeatherError(cause.message);
      });
    } else {
      setWeather(null);
      setWeatherError('Ringkasan cuaca dinonaktifkan di pengaturan organisasi.');
    }
    return () => controller.abort();
  }, [showWeather]);

  const toggleTask = async (id) => {
    if (readOnly) return;
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const nextDone = !task.done;
    try {
      await updateRecord('task', id, { status: nextDone ? 'selesai' : 'aktif' });
      setTasks((current) => current.map((item) => item.id === id ? { ...item, done: nextDone } : item));
      if (nextDone) notify('Tugas diselesaikan', task.label);
    } catch (error) {
      notify('Tugas belum tersimpan', error.message);
    }
  };

  const addTask = async (label) => {
    if (readOnly) return;
    try {
      const record = await createRecord('task', { title: label, payload: { meta: 'Baru ditambahkan' } });
      setTasks((current) => [...current, { id: record.id, label: record.title, meta: record.payload.meta, done: false }]);
      notify('Tugas ditambahkan', label);
    } catch (error) {
      notify('Tugas belum tersimpan', error.message);
    }
  };

  const addActivity = async (title) => {
    if (readOnly) return;
    try {
      const record = await createRecord('activity', { title, payload: { description: title } });
      setActivities((current) => [{ title: record.title, plot: record.payload.description, time: 'Baru saja', tone: 'leaf' }, ...current]);
      notify('Aktivitas dicatat', title);
    } catch (error) { notify('Aktivitas belum tersimpan', error.message); }
  };

  return (
    <div className="page-stack">
      <section className="overview-banner">
        <div>
          <span className="pill pill-soft"><span className="live-dot" />{organization?.name ?? 'Ruang kerja MAPAN'}</span>
          <h2>Selamat datang, <em>{session?.user?.name?.split(' ')[0] ?? 'Pengguna'}</em>.</h2>
          <p>Berikut ringkasan lahan dan kegiatan organisasi Anda hari ini.</p>
        </div>
        <div className="overview-actions">
          <Button variant="secondary" onClick={() => setPage('scan')}><Zap size={15} /> Scan tanaman</Button>
          <Button onClick={() => setPage('lahan')}><Plus size={15} /> Tambah lahan</Button>
        </div>
      </section>

      {needsOnboarding && <OnboardingCard summary={summary} hasActivity={activities.length > 0} setPage={setPage} onDismiss={() => setOnboardingHidden(true)} />}

      <div className="stats-grid">
        <Stat
          icon={MapPinned}
          label="Total lahan"
          value={summary ? `${formatNumber(summary.area_ha)} Ha` : '—'}
          detail={summary ? `dari ${summary.plot_total} petak lahan` : 'menunggu data'}
        />
        <Stat
          icon={Users}
          label="Anggota aktif"
          value={summary ? formatNumber(summary.member_active, 0) : '—'}
          detail={summary ? `aktif di ${summary.group_total} kelompok tani` : 'menunggu data'}
          tone="blue"
        />
        <Stat icon={Wheat} label="Estimasi panen" value={`${formatNumber(prediction?.estimated_tons ?? 0)} ton`} detail={`${prediction?.active_cycles ?? 0} siklus aktif · benchmark`} tone="gold" />
        {showWeather && <Stat icon={ShieldCheck} label="Risiko cuaca" value={weather?.current?.risk ?? '—'} detail={weather?.location?.name ?? (weatherError || 'Prakiraan cuaca')} tone="violet" />}
      </div>

      <div className="dashboard-row dashboard-row-main">
        <ChartCard prediction={prediction} />
        {showWeather && <WeatherPanel onDetail={() => setPage('cuaca')} weather={weather} error={weatherError} />}
      </div>

      <div className="dashboard-row dashboard-row-even">
        <MapPreview onDetail={() => setPage('peta')} />
        <TasksPanel tasks={tasks} onToggle={toggleTask} onAdd={addTask} disabled={readOnly} />
      </div>

      <div className="dashboard-row dashboard-row-even">
        <ActivityPanel onAll={() => setPage('aktivitas')} onAdd={addActivity} rows={activities} disabled={readOnly} />
        <CommodityPanel rows={(prediction?.by_commodity ?? []).map((item) => ({ label: item.crop, area_ha: item.area_ha, value: prediction.area_ha ? Math.round((item.area_ha / prediction.area_ha) * 100) : 0 }))} />
      </div>

      <div className="demo-note"><CircleHelp size={14} /> Estimasi panen menggunakan benchmark komoditas, sedangkan cuaca berasal dari Open-Meteo dan memerlukan koordinat wilayah organisasi.</div>
    </div>
  );
}

const PLOT_STATUS_OPTIONS = [
  ['sehat', 'Sehat'], ['perhatian', 'Perhatian'], ['kritis', 'Kritis'], ['tidak_aktif', 'Tidak aktif'],
];
const IRRIGATION_OPTIONS = [
  ['', 'Belum diatur'], ['irigasi_teknis', 'Irigasi teknis'], ['tadah_hujan', 'Tadah hujan'], ['lebak', 'Lebak / rawa'], ['lainnya', 'Lainnya'],
];

function PlotDetailModal({ plotId, onClose, canManage = false, onChanged, notify }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDetail(null); setError(''); setEditing(false);
    if (!plotId) return undefined;
    const controller = new AbortController();
    fetchPlotDetail(plotId, controller.signal).then(setDetail).catch((cause) => {
      if (cause.name !== 'AbortError') setError(cause.message);
    });
    return () => controller.abort();
  }, [plotId]);

  const startEdit = () => {
    setForm({
      name: detail.name ?? '', area_ha: String(detail.area_ha ?? ''), status: detail.status ?? 'sehat',
      irrigation_type: detail.irrigation_type ?? '', soil_type: detail.soil_type ?? '', address: detail.address ?? '',
    });
    setEditing(true);
  };

  const save = async (event) => {
    event?.preventDefault();
    const area = Number(String(form.area_ha).replace(',', '.'));
    if (!form.name.trim()) { notify?.('Nama lahan wajib diisi', 'Isi nama lahan lalu simpan lagi.'); return; }
    if (!Number.isFinite(area) || area <= 0) { notify?.('Luas tidak valid', 'Luas harus berupa angka lebih dari nol.'); return; }
    setBusy(true);
    try {
      const updated = await updatePlot(plotId, {
        name: form.name.trim(), area_ha: area, status: form.status,
        irrigation_type: form.irrigation_type || null, soil_type: form.soil_type, address: form.address,
      });
      setDetail((current) => ({ ...current, ...updated }));
      setEditing(false);
      notify?.('Lahan diperbarui', updated.name);
      onChanged?.();
    } catch (cause) {
      notify?.('Perubahan belum tersimpan', cause.message);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Hapus lahan "${detail.name}"? Lahan akan disembunyikan dari daftar dan ringkasan.`)) return;
    setBusy(true);
    try {
      await deletePlot(plotId);
      notify?.('Lahan dihapus', detail.name);
      onChanged?.();
      onClose();
    } catch (cause) {
      notify?.('Lahan belum terhapus', cause.message);
    } finally { setBusy(false); }
  };

  const footer = detail && canManage ? (
    editing
      ? <><Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Batal</Button><Button onClick={save} disabled={busy}><Check size={15} /> Simpan perubahan</Button></>
      : <><Button variant="ghost" onClick={remove} disabled={busy}><Trash2 size={15} /> Hapus lahan</Button><Button variant="secondary" onClick={startEdit}><Pencil size={15} /> Ubah data</Button></>
  ) : undefined;

  return (
    <Modal open={Boolean(plotId)} onClose={onClose} title={detail?.name ?? 'Detail lahan'} description="Informasi lahan dan data lapangan dari organisasi." footer={footer}>
      {error ? <p className="form-error" role="alert">Data lahan gagal dimuat: {error}</p> : !detail ? <p className="muted-cell" role="status">Memuat data lahan…</p> : editing ? (
        <form className="form-grid" onSubmit={save}>
          <label className="field field-full">Nama lahan<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="field">Luas (ha)<input required inputMode="decimal" value={form.area_ha} onChange={(event) => setForm({ ...form, area_ha: event.target.value })} /></label>
          <label className="field">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{PLOT_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field">Pengairan<select value={form.irrigation_type} onChange={(event) => setForm({ ...form, irrigation_type: event.target.value })}>{IRRIGATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field">Jenis tanah<input maxLength={60} value={form.soil_type} onChange={(event) => setForm({ ...form, soil_type: event.target.value })} placeholder="Aluvial, latosol…" /></label>
          <label className="field field-full">Alamat / patokan lokasi<input maxLength={255} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        </form>
      ) : (
        <div className="form-grid">
          <div className="field"><span>Kode lahan</span><b>{detail.code}</b></div>
          <div className="field"><span>Luas terdaftar</span><b>{formatNumber(detail.area_ha)} ha</b></div>
          <div className="field"><span>Status</span><b>{PLOT_STATUS_OPTIONS.find(([value]) => value === detail.status)?.[1] ?? detail.status}</b></div>
          <div className="field"><span>Pengairan</span><b>{IRRIGATION_OPTIONS.find(([value]) => value === (detail.irrigation_type ?? ''))?.[1] ?? '—'}</b></div>
          <div className="field"><span>Jenis tanah</span><b>{detail.soil_type || '—'}</b></div>
          <div className="field"><span>Wilayah</span><b>{detail.location?.label ?? detail.location?.region ?? 'Belum diatur'}</b></div>
          <div className="field field-full"><span>Alamat / patokan</span><b>{detail.address || '—'}</b></div>
          <div className="field"><span>Kelompok tani</span><b>{detail.farm_group?.name ?? 'Belum ditautkan'}</b></div>
          <div className="field"><span>Pengelola</span><b>{detail.managers?.map((manager) => manager.full_name).join(', ') || 'Belum ditetapkan'}</b></div>
          <div className="field field-full"><span>Riwayat kesehatan</span><b>{detail.health_history?.length ? detail.health_history.map((item) => `${item.score}% · ${new Date(item.recorded_at).toLocaleDateString('id-ID')}`).join(' | ') : 'Belum ada catatan kesehatan'}</b></div>
          <div className="field field-full"><span>Batas peta</span><b>{detail.boundary?.geometry ? `GeoJSON tersedia · luas terukur ${formatNumber(detail.boundary.measured_area_ha)} ha` : 'Belum ada batas GeoJSON'}</b></div>
        </div>
      )}
    </Modal>
  );
}

export function LandPage({ notify }) {
  const { plots: livePlots, groups: liveGroups, teamMembers, session, refresh } = useDashboardData();
  const canManage = ['administrator', 'manajer_lapangan'].includes(session?.user?.role);
  const [rows, setRows] = useState(livePlots);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Semua');
  const [open, setOpen] = useState(false);
  const [detailPlotId, setDetailPlotId] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: '', area: '', farmer_id: '', crop: '', location: '' });
  const [recordSummary, setRecordSummary] = useState(null);

  useEffect(() => {
    setRows(livePlots);
  }, [livePlots]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecordsSummary(controller.signal).then(setRecordSummary).catch(() => {});
    return () => controller.abort();
  }, []);

  const filtered = rows.filter((plot) => {
    const matchesQuery = `${plot.name} ${plot.farmer} ${plot.crop} ${plot.location}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'Semua' || plot.status === status;
    return matchesQuery && matchesStatus;
  });
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalArea = rows.reduce((sum, plot) => sum + (Number(plot.area_ha) || 0), 0);
  const regionTotal = new Set(rows.map((plot) => plot.location).filter(Boolean)).size;

  const openAddLand = () => {
    const eligible = teamMembers.filter((member) => ['Petani', 'Manajer lapangan', 'Administrator'].includes(member.role) && member.status === 'Aktif');
    const me = eligible.find((member) => Number(member.user_id) === Number(session?.user?.id));
    setForm((current) => ({ ...current, farmer_id: current.farmer_id || String(me?.user_id ?? eligible[0]?.user_id ?? '') }));
    setOpen(true);
  };

  const addLand = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    if (!form.name.trim() || !form.area.trim() || !form.farmer_id || !form.crop.trim()) return;
    const areaValue = Number(form.area.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    try {
      const plot = await createPlot({
        name: form.name.trim(), area_ha: areaValue,
        farmer_id: Number(form.farmer_id), crop: form.crop.trim(),
      });
      const newPlot = adaptPlot({ ...plot, crop: form.crop.trim(), phase: 'Persiapan' });
      setRows((current) => [newPlot, ...current]);
      refresh().catch((error) => notify('Ringkasan belum diperbarui', error.message));
    } catch (error) {
      notify('Lahan belum tersimpan', error.message);
      return;
    }
    setForm({ name: '', area: '', farmer_id: '', crop: '', location: '' });
    setOpen(false);
    notify('Lahan ditambahkan', `${form.name.trim()} · ${areaValue} ha`);
  };

  const exportRows = () => {
    downloadCsv('data-lahan-mapan.csv', [
      ['Nama lahan', 'Petani', 'Komoditas', 'Luas', 'Fase', 'Status', 'Lokasi'],
      ...rows.map((plot) => [plot.name, plot.farmer, plot.crop, plot.area, plot.phase, plot.status, plot.location]),
    ]);
    notify('Ekspor berhasil', 'data-lahan-mapan.csv diunduh.');
  };

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="MANAJEMEN LAHAN"
        title="Semua lahan"
        desc="Pantau kondisi petak, komoditas, dan petani pengelola dalam satu tempat."
        action={<div className="head-actions"><Button variant="secondary" onClick={exportRows}><Download size={15} /> Ekspor</Button><Button disabled={!canManage} title={!canManage ? 'Perlu peran administrator atau manajer lapangan' : undefined} onClick={openAddLand}><Plus size={16} /> Tambah lahan</Button></div>}
      />

      <div className="stats-grid stats-grid-3">
        <Stat icon={MapPinned} label="Petak terdaftar" value={`${rows.length}`} detail={`di ${regionTotal} wilayah`} />
        <Stat icon={Wheat} label="Luas terkelola" value={`${formatNumber(totalArea)} Ha`} detail={`${liveGroups.length} kelompok tani`} tone="gold" />
        <Stat icon={Sprout} label="Siklus aktif" value={recordSummary ? `${recordSummary.cycle_active}` : '—'} detail={recordSummary ? 'dari siklus budidaya tersimpan' : 'menunggu ringkasan data'} tone="blue" />
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <SearchField value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Cari nama lahan, petani, komoditas..." />
          <div className="toolbar-right">
            <label className="select-wrap">
              <Filter size={14} />
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter status">
                <option>Semua</option>
                <option>Sehat</option>
                <option>Perhatian</option>
                <option>Kritis</option>
              </select>
              <ChevronDown size={13} />
            </label>
            <span className="table-count">{filtered.length} petak</span>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama lahan</th>
                <th>Petani pengelola</th>
                <th>Komoditas</th>
                <th>Luas</th>
                <th>Kesehatan</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((plot) => (
                <tr key={plot.id}>
                  <td>
                    <span className="plot-name">
                      <i className={`plot-dot tone-${plot.color}`} />
                      <span><b>{plot.name}</b><small>{plot.location}</small></span>
                    </span>
                  </td>
                  <td>{plot.farmer}</td>
                  <td><span className="crop-cell">{plot.crop}<small>{plot.phase}</small></span></td>
                  <td><b>{plot.area}</b></td>
                  <td>
                    <span className="health-cell">
                      <Progress value={plot.health} tone={plot.health > 80 ? 'green' : 'gold'} />
                      <b>{plot.health}%</b>
                    </span>
                  </td>
                  <td><Status>{plot.status}</Status></td>
                  <td><IconButton label={`Lihat detail ${plot.name}`} className="row-action" onClick={() => setDetailPlotId(plot.plot_id)}><Ellipsis size={17} /></IconButton></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <EmptyState icon={MapPinned} title="Belum ada lahan" description={canManage ? 'Tambahkan petak lahan pertama Anda untuk mulai mencatat siklus tanam, aktivitas, dan estimasi panen.' : 'Administrator atau manajer lapangan belum menambahkan lahan.'} action={canManage ? <Button onClick={openAddLand}><Plus size={15} /> Tambah lahan pertama</Button> : undefined} />
          )}
          {rows.length > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="Lahan tidak ditemukan" description="Coba kata kunci atau filter status yang berbeda." />
          )}
        </div>
        <div className="table-bottom">
          <span>Menampilkan {visibleRows.length} dari {filtered.length} lahan</span>
          <div className="pagination">
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button type="button" key={number} className={number === currentPage ? 'is-active' : ''} onClick={() => setPage(number)}>{number}</button>
            ))}
            <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah lahan baru"
        description="Lengkapi data dasar petak. Anda dapat menyesuaikan detailnya nanti."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button disabled={!canManage} onClick={addLand}><Check size={15} /> Simpan lahan</Button></>}
      >
        <form className="form-grid" onSubmit={addLand}>
          <label className="field field-full">Nama lahan<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Subak Sari" /></label>
          <label className="field">Luas (ha)<input required value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} placeholder="8,4" inputMode="decimal" /></label>
          <label className="field">Petani pengelola<select required value={form.farmer_id} onChange={(event) => setForm({ ...form, farmer_id: event.target.value })}><option value="">Pilih petani</option>{teamMembers.filter((member) => ['Petani', 'Manajer lapangan', 'Administrator'].includes(member.role) && member.status === 'Aktif').map((member) => <option key={member.user_id} value={member.user_id}>{member.name}</option>)}</select></label>
          <label className="field">Komoditas<input required value={form.crop} onChange={(event) => setForm({ ...form, crop: event.target.value })} placeholder="Padi, cabai, kopi..." /></label>
          <label className="field">Wilayah<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Tabanan, Bali" /></label>
        </form>
      </Modal>
      <PlotDetailModal plotId={detailPlotId} onClose={() => setDetailPlotId(null)} canManage={canManage} notify={notify} onChanged={() => refresh().catch((error) => notify('Daftar belum diperbarui', error.message))} />
    </div>
  );
}

const phaseColumns = ['Persiapan', 'Vegetatif', 'Generatif', 'Pematangan'];

export function ActivitiesPage({ notify }) {
  const { session } = useDashboardData();
  const readOnly = !session || session.user?.role === 'penyuluh';
  const [records, setRecords] = useState([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setRecords(await fetchRecords('activity'));
      setError('');
    } catch (cause) {
      setError(cause.message);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    if (readOnly || !title.trim() || busy) return;
    setBusy(true);
    try {
      await createRecord('activity', { title: title.trim(), payload: { description: 'Dicatat dari log aktivitas dashboard' } });
      setTitle('');
      await load();
      notify('Aktivitas dicatat', 'Aktivitas berhasil tersimpan di organisasi.');
    } catch (cause) {
      notify('Aktivitas belum tersimpan', cause.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHead eyebrow="CATATAN LAPANGAN" title="Log aktivitas" desc="Semua aktivitas lapangan yang tersimpan untuk organisasi." />
      <section className="panel activity-panel log-panel">
        <div className="panel-head">
          <div><span className="eyebrow">AKTIVITAS TERSIMPAN</span><h2>Riwayat kegiatan</h2><p>Rekam pekerjaan lapangan agar tim tahu apa yang sudah dikerjakan.</p></div>
          <div className="log-head-actions">
            <span className="chip">{records.length} catatan</span>
            <Button variant="secondary" onClick={load}><RefreshCw size={14} /> Muat ulang</Button>
          </div>
        </div>
        {!readOnly && (
          <form className="task-add log-composer" onSubmit={save}>
            <span className="log-composer-icon"><Activity size={16} /></span>
            <input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Catat kegiatan lapangan, contoh: Pengairan berselangpetak..." aria-label="Aktivitas baru" />
            <Button type="submit" disabled={busy || !title.trim()}>{busy ? '...' : <><Check size={15} /> Simpan</>}</Button>
          </form>
        )}
        {error && <p className="form-error" role="alert">Aktivitas gagal dimuat: {error}</p>}
        <div className="activity-list log-list">{records.map((record, index) => (
          <article className="activity-row log-row" key={record.id}>
            <span className={`activity-icon ${['tone-green', 'tone-water', 'tone-gold', 'tone-violet'][index % 4]}`}><Activity size={16} /></span>
            <div className="activity-copy">
              <b>{record.title}</b>
              <small>{record.payload?.description && record.payload?.description !== record.title ? record.payload.description : record.payload?.plot ?? 'Aktivitas lapangan'}</small>
            </div>
            <time>{record.created_at ? new Date(record.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : ''}</time>
          </article>
        ))}{!error && records.length === 0 && <p className="muted-cell">Belum ada aktivitas tersimpan. Catat kegiatan pertama di atas.</p>}</div>
      </section>
    </div>
  );
}

export function CyclesPage({ notify }) {
  const [cycles, setCycles] = useState([]);
  const [open, setOpen] = useState(false);
  const { plots: livePlots, session } = useDashboardData();
  const canManage = ['administrator', 'manajer_lapangan'].includes(session?.user?.role);
  const [form, setForm] = useState({ crop: '', plot_id: '', phase: 'Persiapan' });

  useEffect(() => {
    let active = true;
    fetchRecords('cycle')
      .then((records) => {
        if (active) setCycles(records.map((record) => ({ id: record.id, ...record.payload, record_status: record.status, image: record.payload.image || paddyPlanting })));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const addCycle = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    const selectedPlot = livePlots.find((plot) => String(plot.plot_id) === String(form.plot_id));
    if (!form.crop.trim() || !selectedPlot) return;
    const nextCycle = {
      crop: form.crop.trim(),
      plot: selectedPlot.name,
      plot_id: selectedPlot.plot_id,
      area_ha: selectedPlot.area_ha,
      area: `${selectedPlot.area_ha} ha`,
      phase: form.phase,
      progress: 4,
      status: 'Sehat',
      harvest: 'Belum dijadwalkan',
      image: paddyPlanting,
    };
    try {
      const record = await createRecord('cycle', { title: nextCycle.crop, payload: nextCycle });
      setCycles((current) => [{ id: record.id, ...record.payload }, ...current]);
    } catch (error) {
      notify('Siklus belum tersimpan', error.message);
      return;
    }
    setOpen(false);
    setForm({ crop: '', plot_id: '', phase: 'Persiapan' });
    notify('Siklus baru dibuat', `${form.crop} · ${selectedPlot.name}`);
  };

  const advanceCycle = async (cycle) => {
    if (!canManage) return;
    const phaseIndex = phaseColumns.indexOf(cycle.phase);
    const isFinished = phaseIndex >= phaseColumns.length - 1;
    const next = isFinished
      ? { ...cycle, progress: 100, status: 'Selesai', harvest: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date()) }
      : { ...cycle, phase: phaseColumns[phaseIndex + 1], progress: Math.min(100, cycle.progress + 20) };
    try {
      await updateRecord('cycle', cycle.id, { payload: next, ...(isFinished ? { status: 'selesai' } : {}) });
      setCycles((current) => current.map((item) => item.id === cycle.id ? { ...next, record_status: isFinished ? 'selesai' : item.record_status } : item));
      notify(isFinished ? 'Siklus ditandai selesai' : 'Fase siklus diperbarui', `${cycle.crop} · ${next.phase}`);
    } catch (error) { notify('Siklus belum diperbarui', error.message); }
  };

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="KALENDER PERTANIAN"
        title="Siklus budidaya"
        desc="Jadwal tanam, fase pertumbuhan, dan estimasi panen setiap komoditas."
        action={<Button disabled={!canManage} title={!canManage ? 'Perlu peran administrator atau manajer lapangan' : undefined} onClick={() => setOpen(true)}><Plus size={16} /> Siklus baru</Button>}
      />

      <div className="stats-grid stats-grid-3">
        <Stat icon={Sprout} label="Siklus aktif" value={`${cycles.filter((cycle) => cycle.record_status !== 'selesai').length}`} detail={`pada ${new Set(cycles.filter((cycle) => cycle.record_status !== 'selesai').map((cycle) => cycle.plot_id).filter(Boolean)).size} petak`} tone="blue" />
        <Stat icon={CalendarDays} label="Panen terjadwal" value={`${cycles.filter((cycle) => cycle.harvest && cycle.harvest !== 'Belum dijadwalkan' && cycle.record_status !== 'selesai').length}`} detail="siklus dengan tanggal panen" tone="gold" />
        <Stat icon={Check} label="Siklus selesai" value={`${cycles.filter((cycle) => cycle.record_status === 'selesai').length}`} detail="ditandai selesai" />
      </div>

      <div className="cycle-board">
        {phaseColumns.map((phase) => {
          const items = cycles.filter((cycle) => cycle.phase === phase);
          return (
            <section className="cycle-column" key={phase}>
              <div className="cycle-column-head"><span>{phase}</span><b>{items.length}</b></div>
              <div className="cycle-column-body">
                {items.map((cycle) => (
                  <article className="cycle-card" key={cycle.id}>
                    <div className="cycle-card-photo"><img src={cycle.image} alt={cycle.crop} /><Status>{cycle.status}</Status></div>
                    <b>{cycle.crop}</b>
                    <small>{cycle.plot} · {cycle.area}</small>
                    <div className="cycle-card-progress">
                      <div><span>Progres</span><b>{cycle.progress}%</b></div>
                      <Progress value={cycle.progress} tone={cycle.status === 'Perhatian' ? 'gold' : 'green'} />
                    </div>
                    <div className="cycle-card-foot"><span><CalendarDays size={13} /> {cycle.harvest}</span>{cycle.record_status !== 'selesai' && ['administrator', 'manajer_lapangan'].includes(session?.user?.role) && <button type="button" aria-label={`Majukan fase ${cycle.crop}`} onClick={() => advanceCycle(cycle)}><ArrowRight size={13} /></button>}</div>
                  </article>
                ))}
                <button type="button" className="cycle-add" disabled={!canManage} onClick={() => { setForm({ ...form, phase }); setOpen(true); }}><Plus size={14} /> Tambah {phase.toLowerCase()}</button>
              </div>
            </section>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat siklus budidaya"
        description="Catat komoditas dan lahan untuk memulai pemantauan fase."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button disabled={!canManage} onClick={addCycle}><Check size={15} /> Simpan siklus</Button></>}
      >
        <form className="form-grid" onSubmit={addCycle}>
          <label className="field field-full">Komoditas<input required value={form.crop} onChange={(event) => setForm({ ...form, crop: event.target.value })} placeholder="Contoh: Cabai Merah" /></label>
          <label className="field">Lahan<select required value={form.plot_id} onChange={(event) => setForm({ ...form, plot_id: event.target.value })}><option value="">Pilih lahan</option>{livePlots.map((plot) => <option key={plot.plot_id} value={plot.plot_id}>{plot.name}</option>)}</select></label>
          <label className="field">Fase awal<select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}>{phaseColumns.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
        </form>
      </Modal>
    </div>
  );
}

export function PredictionPage({ notify }) {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetchPredictions(controller.signal).then(setPrediction).catch((cause) => {
      if (cause.name !== 'AbortError') setError(cause.message);
    });
    return () => controller.abort();
  }, []);
  const forecastRows = (prediction?.by_commodity ?? []).map((item, index) => ({
    crop: item.crop,
    area: `${formatNumber(item.area_ha)} ha`,
    estimate: `${formatNumber(item.estimate_tons)} ton`,
    healthIndicator: item.health_indicator,
    tone: ['green', 'gold', 'blue', 'red'][index % 4],
  }));

  const exportForecast = () => {
    downloadCsv('prediksi-panen.csv', [
      ['Komoditas', 'Luas', 'Estimasi', 'Indikator kesehatan'],
      ...forecastRows.map((row) => [row.crop, row.area, row.estimate, `${row.healthIndicator}%`]),
    ]);
    notify('Ekspor berhasil', 'prediksi-panen.csv diunduh.');
  };

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="ANALISIS HASIL"
        title="Prediksi panen"
        desc="Estimasi hasil dan faktor risiko untuk membantu rencana distribusi."
        action={<Button variant="secondary" onClick={exportForecast} disabled={!forecastRows.length}><Download size={15} /> Unduh laporan</Button>}
      />

      <div className="stats-grid stats-grid-3">
        <Stat icon={Wheat} label="Estimasi produksi" value={`${formatNumber(prediction?.estimated_tons ?? 0)} ton`} detail={`${prediction?.active_cycles ?? 0} siklus aktif`} tone="gold" />
        <Stat icon={MapPinned} label="Luas produktif" value={`${formatNumber(prediction?.area_ha ?? 0)} ha`} detail="dari siklus aktif" />
        <Stat icon={ShieldCheck} label="Indikator kesehatan" value={forecastRows.length ? `${formatNumber(forecastRows.reduce((sum, row) => sum + row.healthIndicator, 0) / forecastRows.length, 0)}%` : '—'} detail="heuristik dari riwayat kesehatan" tone="blue" />
      </div>

      <div className="dashboard-row dashboard-row-main">
        <article className="panel insight-panel">
          <span className="eyebrow">DASAR PERHITUNGAN</span>
          <h2>Estimasi berbasis benchmark komoditas.</h2>
          <p>Angka dihitung dari luas petak dan benchmark hasil komoditas pada database. Gunakan sebagai perkiraan awal dan cocokkan dengan kondisi lapangan.</p>
          <div className="insight-metric"><span>Benchmark</span><b>{prediction?.by_commodity?.length ?? 0} <small>komoditas</small></b></div>
          <div className="prediction-note"><CircleHelp size={15} /> Ini perhitungan benchmark, bukan prediksi AI.</div>
        </article>
        <article className="panel insight-panel">
          <div className="insight-photo"><img src={harvestCommunity} alt="Petani bekerja bersama saat musim panen" /></div>
          <span className="eyebrow">RINGKASAN PREDIKSI</span>
          <h2>{error ? 'Data prediksi belum tersedia.' : forecastRows.length ? 'Siklus aktif tersedia.' : 'Belum ada siklus budidaya.'}</h2>
          <p>{error || 'Buat siklus dan hubungkan ke petak untuk menghitung estimasi hasil panen.'}</p>
          <div className="insight-row"><span><Check size={15} /> Kesehatan rata-rata</span><b>{prediction?.health_average == null ? 'Belum ada data' : `${formatNumber(prediction.health_average)} / 100`}</b></div>
        </article>
      </div>

      <section className="panel table-panel">
        <div className="panel-head table-panel-head">
          <div>
            <span className="eyebrow">PER KOMODITAS</span>
            <h2>Rincian estimasi</h2>
          </div>
          <span className="chip">Data langsung</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Komoditas</th><th>Luas produktif</th><th>Estimasi hasil</th><th>Indikator kesehatan</th><th>Rekomendasi</th></tr></thead>
            <tbody>
              {forecastRows.map((row) => (
                <tr key={row.crop}>
                  <td><span className="plot-name"><i className={`plot-dot tone-${row.tone}`} /><b>{row.crop}</b></span></td>
                  <td>{row.area}</td>
                  <td><b>{row.estimate}</b></td>
                  <td><span className="health-cell"><Progress value={row.healthIndicator} tone={row.tone} /><b>{row.healthIndicator}%</b></span></td>
                  <td><span className="muted-cell">Pantau cuaca dan kondisi lapangan</span></td>
                </tr>
              ))}
              {!forecastRows.length && <tr><td colSpan="5" className="muted-cell">{error || 'Belum ada data siklus untuk dihitung.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetchWeather(controller.signal).then(setWeather).catch((cause) => {
      if (cause.name !== 'AbortError') setError(cause.message);
    });
    return () => controller.abort();
  }, []);
  const current = weather?.current;
  const forecast = weather?.forecast ?? [];
  const highestRisk = [...forecast].sort((a, b) => b.rain_probability_pct - a.rain_probability_pct)[0];
  const formatWeatherDate = (value) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
  return (
    <div className="page-stack">
      <PageHead
        eyebrow="PEMANTAUAN IKLIM"
        title="Cuaca & risiko"
        desc="Pantau kondisi cuaca untuk membantu merencanakan kegiatan di lahan."
        action={<span className="location-pill"><MapPin size={15} /> {weather?.location?.name ?? 'Wilayah organisasi'} <ChevronDown size={13} /></span>}
      />

      {error && <div className="weather-banner"><CircleHelp size={16} /><span>{error}</span></div>}

      <section className="panel weather-hero-card">
        <div className="weather-now">
          <span className="eyebrow">{current?.time ? formatWeatherDate(current.time.slice(0, 10)) : 'CUACA SAAT INI'} · {weather?.location?.name ?? 'WILAYAH ORGANISASI'}</span>
          <div className="weather-now-main">
            <span className="weather-now-icon"><Sun size={54} /><CloudSun size={26} /></span>
            <div><b>{current ? `${formatNumber(current.temperature_c, 1)}°` : '—'}</b><span>{current?.description ?? (error || 'Memuat prakiraan…')}</span></div>
          </div>
          <p>Kondisi hari ini cukup baik untuk kegiatan lapangan. Tetap periksa keadaan cuaca dan tanah di sekitar lahan.</p>
        </div>
        <div className="weather-now-metrics">
          <div><Droplets size={16} /><span>Kelembapan</span><b>{current ? `${formatNumber(current.humidity_pct, 0)}%` : '—'}</b></div>
          <div><Wind size={16} /><span>Kecepatan angin</span><b>{current ? `${formatNumber(current.wind_kmh)} km/jam` : '—'}</b></div>
          <div><CloudRain size={16} /><span>Peluang hujan</span><b>{current ? `${formatNumber(current.rain_probability_pct, 0)}%` : '—'}</b></div>
          <div><ShieldCheck size={16} /><span>Risiko</span><b className="positive">{current?.risk ?? '—'}</b></div>
        </div>
      </section>

      <div className="section-line"><h3>Prakiraan 5 hari</h3><span>{weather?.updated_at ? `Sumber Open-Meteo · diperbarui ${new Date(weather.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Menunggu data cuaca'}</span></div>
      <div className="forecast-grid">
        {forecast.map((day) => (
          <article className="panel forecast-card" key={day.date}>
            <span className="forecast-day">{formatWeatherDate(day.date)}<small>{day.description}</small></span>
            <span className={`forecast-icon ${day.rain_probability_pct >= 50 ? 'rain' : day.rain_probability_pct >= 25 ? 'cloud' : 'sun'}`}>
              {day.rain_probability_pct >= 50 ? <CloudRain /> : day.rain_probability_pct >= 25 ? <CloudSun /> : <Sun />}
            </span>
            <b>{formatNumber(day.temperature_max_c, 0)}° <small>{formatNumber(day.temperature_min_c, 0)}°</small></b>
            <span className="rain-chance"><Droplets size={13} /> Hujan {formatNumber(day.rain_probability_pct, 0)}%</span>
          </article>
        ))}
      </div>

      <div className="dashboard-row dashboard-row-even">
        <article className="panel guidance-card">
          <span className="eyebrow">SARAN KEGIATAN</span>
          <h3>Periksa lahan sebelum mulai bekerja.</h3>
          <p>Gunakan prakiraan sebagai panduan awal. Kebutuhan air dan perawatan berbeda untuk setiap komoditas.</p>
          <ul>
            <li><Check size={15} /> Sesuaikan penyiraman dengan kelembapan tanah dan fase tanaman.</li>
            <li><Check size={15} /> Tinjau kondisi langit sebelum penyemprotan atau pemupukan.</li>
            <li><Check size={15} /> Siapkan saluran air jika hujan berlangsung lama.</li>
          </ul>
        </article>
        <article className="panel risk-card">
          <span className="risk-icon"><ShieldCheck size={20} /></span>
          <h3>{highestRisk ? `Risiko ${highestRisk.risk} pada ${formatWeatherDate(highestRisk.date)}` : 'Risiko cuaca belum tersedia'}</h3>
          <p>{highestRisk ? `Peluang hujan tertinggi ${formatNumber(highestRisk.rain_probability_pct, 0)}%. Periksa kondisi aktual sebelum menjadwalkan kegiatan.` : error || 'Prakiraan akan tampil setelah wilayah organisasi memiliki koordinat.'}</p>
          {forecast.slice(0, 3).map((day) => <div className="risk-row" key={day.date}><span>{formatWeatherDate(day.date).split(',')[0]}</span><Progress value={day.rain_probability_pct} tone={day.risk === 'tinggi' ? 'red' : day.risk === 'sedang' ? 'gold' : 'green'} /><b>{formatNumber(day.rain_probability_pct, 0)}%</b></div>)}
        </article>
      </div>
    </div>
  );
}

export function UsersPage({ notify }) {
  const { teamMembers: liveMembers, summary, refresh, session } = useDashboardData();
  const canManage = session?.user?.role === 'administrator';
  const [rows, setRows] = useState(liveMembers);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('Semua peran');
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ role: 'petani', status: 'aktif' });
  const [form, setForm] = useState({ name: '', email: '', role: 'Petani' });

  useEffect(() => {
    setRows(liveMembers);
    let active = true;
    fetchInvitations()
      .then((invitations) => {
        if (!active) return;
        const roleNames = { administrator: 'Administrator', manajer_lapangan: 'Manajer lapangan', petani: 'Petani', penyuluh: 'Penyuluh' };
        const pending = invitations.filter((item) => item.status === 'pending').map((item) => ({
          id: `i${item.id}`, name: item.name || item.email, email: item.email,
          role: roleNames[item.role] ?? item.role, status: 'Undangan', last: '—', tone: 'blue', invitationId: item.id,
        }));
        setRows([...pending, ...liveMembers]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [liveMembers]);

  const adminTotal = rows.filter((member) => member.role === 'Administrator').length;
  const farmerTotal = rows.filter((member) => member.role === 'Petani').length;
  const pendingInvitations = summary?.invitation_pending ?? 0;

  const filtered = rows.filter((member) => {
    const matchesQuery = `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesRole = role === 'Semua peran' || member.role === role;
    return matchesQuery && matchesRole;
  });

  const invite = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    if (!form.name.trim() || !form.email.trim()) return;
    const roleCodes = { Petani: 'petani', 'Manajer lapangan': 'manajer_lapangan', Administrator: 'administrator', Penyuluh: 'penyuluh' };
    let invitation;
    try {
      invitation = await createInvitation({
        name: form.name.trim(), email: form.email.trim(), role: roleCodes[form.role],
      });
    } catch (error) {
      notify('Undangan belum tersimpan', error.message);
      return;
    }
    const member = {
      id: `i${invitation.id}`, name: invitation.name, email: invitation.email,
      role: form.role, status: 'Undangan', last: '—', tone: 'blue',
      invitationId: invitation.id,
    };
    setRows((current) => [member, ...current]);
    setInviteLink(`${window.location.origin}/#undangan/${invitation.token}`);
    refresh().catch((error) => notify('Ringkasan anggota belum diperbarui', error.message));
    setForm({ name: '', email: '', role: 'Petani' });
    setOpen(false);
    notify('Undangan siap dibagikan', `Tautan penerimaan dibuat untuk ${member.email}.`);
  };

  const manageMember = (member) => {
    if (!member.raw?.id || session?.user?.role !== 'administrator') return;
    setSelectedMember(member);
    setMemberForm({ role: member.raw.role, status: member.raw.status });
  };
  const shareInvitationAgain = async (member) => {
    try {
      const invitation = await resendInvitation(member.invitationId);
      setInviteLink(`${window.location.origin}/#undangan/${invitation.token}`);
      notify('Tautan undangan diperbarui', `Tautan baru dibuat untuk ${member.email}.`);
    } catch (error) { notify('Tautan undangan belum dibuat', error.message); }
  };
  const saveMember = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    try {
      await updateMember(selectedMember.raw.id, memberForm);
      setSelectedMember(null);
      refresh().catch((error) => notify('Daftar anggota belum diperbarui', error.message));
      notify('Keanggotaan diperbarui', `${selectedMember.name} · ${memberForm.status}`);
    } catch (error) { notify('Perubahan anggota belum tersimpan', error.message); }
  };

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="AKSES & TIM"
        title="Pengguna"
        desc="Kelola anggota dan peran akses pada organisasi koperasi."
        action={<Button disabled={!canManage} title={!canManage ? 'Hanya administrator yang dapat mengundang pengguna' : undefined} onClick={() => setOpen(true)}><Plus size={16} /> Undang pengguna</Button>}
      />

      <div className="stats-grid stats-grid-3">
        <Stat icon={Users} label="Total pengguna" value={formatNumber(rows.length, 0)} detail="terdaftar di koperasi" />
        <Stat icon={Shield} label="Administrator" value={formatNumber(adminTotal, 0)} detail="akses pengelola" tone="blue" />
        <Stat icon={Smartphone} label="Petani aktif" value={formatNumber(farmerTotal, 0)} detail={`${pendingInvitations} menunggu undangan`} tone="gold" />
      </div>

      {inviteLink && <section className="panel invite-link-panel"><div><b>Tautan undangan siap</b><small>Email belum dikonfigurasi. Bagikan tautan ini kepada anggota sebelum kedaluwarsa.</small></div><input readOnly value={inviteLink} aria-label="Tautan undangan" /><Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(inviteLink); notify('Tautan disalin', 'Tautan undangan tersalin ke clipboard.'); } catch { notify('Salin tautan', inviteLink); } }}><Check size={15} /> Salin tautan</Button></section>}

      <section className="panel table-panel">
        <div className="table-toolbar">
          <SearchField value={query} onChange={setQuery} placeholder="Cari nama atau email..." />
          <div className="toolbar-right">
            <label className="select-wrap"><Filter size={14} /><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter peran"><option>Semua peran</option><option>Administrator</option><option>Petani</option><option>Manajer lapangan</option><option>Penyuluh</option></select><ChevronDown size={13} /></label>
            <span className="table-count">{filtered.length} anggota</span>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Nama pengguna</th><th>Email</th><th>Peran</th><th>Status</th><th>Terakhir aktif</th><th aria-label="Aksi" /></tr></thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td><span className="person-name"><Avatar name={member.name} size="sm" tone={member.tone} /><b>{member.name}</b></span></td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td><Status>{member.status}</Status></td>
                  <td className="muted-cell">{member.last}</td>
                  <td><IconButton label={`Aksi untuk ${member.name}`} className="row-action" disabled={session?.user?.role !== 'administrator' || (!member.raw?.id && !member.invitationId)} onClick={() => member.raw?.id ? manageMember(member) : shareInvitationAgain(member)}><Ellipsis size={17} /></IconButton></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Search} title="Pengguna tidak ditemukan" description="Coba nama atau peran berbeda." />}
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Undang pengguna"
        description="Kirim undangan untuk bergabung ke ruang kerja koperasi."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button disabled={!canManage} onClick={invite}><Mail size={15} /> Kirim undangan</Button></>}
      >
        <form className="form-grid" onSubmit={invite}>
          <label className="field field-full">Nama lengkap<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama anggota" /></label>
          <label className="field field-full">Alamat email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="nama@email.com" /></label>
          <label className="field field-full">Peran<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Petani</option><option>Manajer lapangan</option><option>Penyuluh</option><option>Administrator</option></select></label>
        </form>
      </Modal>
      <Modal open={Boolean(selectedMember)} onClose={() => setSelectedMember(null)} title="Kelola keanggotaan" description={selectedMember ? `${selectedMember.name} · ${selectedMember.email}` : ''} footer={<><Button variant="ghost" onClick={() => setSelectedMember(null)}>Batal</Button><Button onClick={saveMember}><Check size={15} /> Simpan</Button></>}>
        <form className="form-grid" onSubmit={saveMember}>
          <label className="field">Peran<select value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}><option value="administrator">Administrator</option><option value="manajer_lapangan">Manajer lapangan</option><option value="petani">Petani</option><option value="penyuluh">Penyuluh</option></select></label>
          <label className="field">Status<select value={memberForm.status} onChange={(event) => setMemberForm((current) => ({ ...current, status: event.target.value }))}><option value="aktif">Aktif</option><option value="undangan">Menunggu persetujuan</option><option value="nonaktif">Nonaktif</option></select></label>
        </form>
      </Modal>
    </div>
  );
}

export function OrganizationPage({ setPage }) {
  const { groups: liveGroups, organization, summary, commodities } = useDashboardData();
  const org = organization;
  const memberTotal = summary?.member_active ?? 0;
  const farmerTotal = summary?.member_role?.petani ?? 0;
  const managerTotal = summary?.member_role?.manajer_lapangan ?? 0;
  const plotTotal = summary?.plot_total ?? org?.plot_total ?? 0;
  const groupTotal = summary?.group_total ?? liveGroups.length;
  const regionTotal = new Set(
    liveGroups.map((group) => group.raw?.region?.name).filter(Boolean),
  ).size;
  const commodityNames = commodities.slice(0, 4).map((item) => item.name).join(', ');

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="PENGELOLAAN KOPERASI"
        title="Organisasi"
        desc="Informasi koperasi dan kelompok tani yang terhubung."
        action={<Button variant="secondary" onClick={() => setPage('pengaturan')}><Settings size={15} /> Atur organisasi</Button>}
      />

      <section className="panel org-hero">
        <span className="org-hero-mark"><Building2 size={26} /></span>
        <div>
          <span className="eyebrow">KOPERASI AKTIF</span>
          <h2>{org?.name ?? 'Koperasi Subak Sari'}</h2>
          <p>
            {org?.region ?? 'Tabanan, Bali'}
            {org?.founded_year ? ` · Berdiri sejak ${org.founded_year}` : ''}
          </p>
        </div>
        <Status>{org?.status ?? 'Aktif'}</Status>
      </section>

      <div className="stats-grid stats-grid-3">
        <Stat icon={Users} label="Anggota koperasi" value={formatNumber(memberTotal, 0)} detail={`${farmerTotal} petani · ${managerTotal} manajer lapangan`} />
        <Stat icon={MapPinned} label="Luas lahan anggota" value={`${formatNumber(summary?.area_ha ?? 0)} ha`} detail={`${plotTotal} petak terdaftar`} tone="gold" />
        <Stat icon={Sprout} label="Kelompok tani" value={`${groupTotal} kelompok`} detail={regionTotal ? `tersebar di ${regionTotal} kecamatan` : 'belum ada kelompok'} tone="blue" />
      </div>

      <div className="section-line"><h3>Kelompok tani</h3><button type="button" className="text-link small" onClick={() => document.getElementById('organization-group-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Lihat semua <ArrowRight size={14} /></button></div>
      <div className="group-grid" id="organization-group-list">
        {liveGroups.map((group) => (
          <article className="panel group-card" key={group.id ?? group.name}>
            <span className={`group-avatar tone-${group.tone}`}><Users size={17} /></span>
            <b>{group.name}</b>
            <small>{group.members} anggota</small>
            <span className="group-area">{group.area}<ChevronRight size={14} /></span>
          </article>
        ))}
      </div>

      <section className="panel org-info">
        <div className="panel-head"><div><span className="eyebrow">PROFIL SINGKAT</span><h2>Informasi organisasi</h2></div></div>
        <div className="info-grid">
          <div><small>Jenis organisasi</small><b>{org?.type ?? '—'}</b></div>
          <div><small>Wilayah operasional</small><b>{org?.region ?? '—'}</b></div>
          <div><small>Email kontak</small><b>{org?.email ?? '—'}</b></div>
          <div><small>Nomor registrasi</small><b>{org?.registration_no ?? '—'}</b></div>
          <div><small>Total petak</small><b>{plotTotal} petak</b></div>
          <div><small>Komoditas utama</small><b>{commodityNames || '—'}</b></div>
        </div>
      </section>
    </div>
  );
}

const reportIcons = { Wheat, MapPinned, Activity, CloudSun };

export function ReportsPage({ notify }) {
  const [lastExport, setLastExport] = useState('');
  const { plots, session } = useDashboardData();

  const download = async (report) => {
    if (!session) return;
    let rows;
    try {
      if (report.id === 'r1') {
        const result = await fetchPredictions();
        rows = [['Komoditas', 'Luas (ha)', 'Estimasi (ton)'], ...result.by_commodity.map((item) => [item.crop, item.area_ha, item.estimate_tons])];
      } else if (report.id === 'r2') {
        rows = [['Nama lahan', 'Petani', 'Komoditas', 'Luas (ha)', 'Status'], ...plots.map((plot) => [plot.name, plot.farmer, plot.crop, plot.area_ha, plot.status])];
      } else if (report.id === 'r3') {
        const result = await fetchRecords('activity');
        rows = [['Tanggal', 'Aktivitas', 'Detail'], ...result.map((record) => [record.created_at, record.title, record.payload.description ?? record.payload.plot ?? ''])];
      } else {
        const result = await fetchWeather();
        rows = [['Tanggal', 'Kondisi', 'Suhu maksimum (°C)', 'Hujan (%)', 'Risiko'], ...result.forecast.map((day) => [day.date, day.description, day.temperature_max_c, day.rain_probability_pct, day.risk])];
      }
    } catch (error) {
      notify('Laporan belum dapat dibuat', error.message);
      return;
    }
    const filename = report.file.replace(/2026|okt-?/gi, new Date().getFullYear());
    downloadCsv(filename, rows);
    setLastExport(filename);
    notify('Laporan diunduh', `${filename} disimpan ke perangkat.`);
    try {
      await createRecord('report', {
        title: report.title,
        payload: { file: filename, exportedAt: new Date().toISOString() },
        status: 'selesai',
      });
    } catch (error) {
      notify('Riwayat laporan belum tersimpan', error.message);
    }
  };

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="DATA & DOKUMENTASI"
        title="Laporan"
        desc="Ringkasan kegiatan dan performa pertanian koperasi."
        action={<span className="location-pill"><CalendarDays size={15} /> {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())} <ChevronDown size={13} /></span>}
      />

      <div className="report-grid">
        {reports.map((report) => {
          const Icon = reportIcons[report.icon] || FileBarChart2;
          return (
            <article className="panel report-card" key={report.id}>
              <div className="report-card-head">
                <span className={`report-icon tone-${report.tone}`}><Icon size={19} /></span>
                <span className="chip">CSV</span>
              </div>
              <h3>{report.title}</h3>
              <p>{report.desc}</p>
              <span className="report-period">{report.period}</span>
              <button type="button" className="report-download" onClick={() => download(report)} disabled={!session} title={!session ? 'Masuk untuk mengunduh data organisasi' : undefined}>
                <Download size={15} /> {session ? 'Unduh laporan' : 'Masuk untuk mengunduh'} <ArrowRight size={14} />
              </button>
            </article>
          );
        })}
      </div>

      <section className="panel export-panel">
        <div>
          <span className="eyebrow">RIWAYAT EKSPOR</span>
          <h2>Berkas terbaru</h2>
          <p>Laporan diunduh sebagai CSV dan dapat dibuka di Excel atau Google Sheets.</p>
        </div>
        {lastExport ? (
          <div className="export-file"><span className="export-icon"><FileBarChart2 size={17} /></span><div><b>{lastExport}</b><small>Baru saja · siap dibuka</small></div><span className="status status-good"><i />Selesai</span></div>
        ) : (
          <div className="export-empty"><Download size={18} /><span>Belum ada ekspor pada sesi ini.</span></div>
        )}
      </section>

      <div className="demo-note"><CircleHelp size={14} /> Laporan panen, lahan, aktivitas, dan cuaca diambil dari data organisasi saat diunduh.</div>
    </div>
  );
}

const settingTabs = [
  { id: 'akun', label: 'Akun saya' },
  { id: 'profil', label: 'Profil organisasi' },
  { id: 'akses', label: 'Anggota & akses' },
  { id: 'notifikasi', label: 'Notifikasi' },
  { id: 'data', label: 'Preferensi data' },
];

function AccountPanel({ notify }) {
  const { session, refresh } = useDashboardData();
  const [name, setName] = useState(session?.user?.name ?? '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState('');
  const strength = passwordStrength(passwords.next, session?.user?.email);

  const saveName = async () => {
    setBusy('name');
    try {
      await updateProfile({ full_name: name });
      refresh().catch(() => {});
      notify('Profil diperbarui', 'Nama akun tersimpan.');
    } catch (error) { notify('Profil belum tersimpan', error.message); } finally { setBusy(''); }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!strength.valid) { notify('Kata sandi belum memenuhi syarat', 'Periksa daftar syarat di bawah kolom kata sandi baru.'); return; }
    if (passwords.next !== passwords.confirm) { notify('Konfirmasi belum sama', 'Ulangi kata sandi baru dengan benar.'); return; }
    setBusy('password');
    try {
      await changePassword({ current_password: passwords.current, new_password: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      notify('Kata sandi diganti', 'Sesi di perangkat lain otomatis keluar.');
    } catch (error) { notify('Kata sandi belum diganti', error.message); } finally { setBusy(''); }
  };

  return (
    <>
      <span className="eyebrow">AKUN SAYA</span>
      <h3>Profil &amp; keamanan</h3>
      <p>Kelola nama dan keamanan akun {session?.user?.email}.</p>
      <div className="form-grid">
        <label className="field field-full">Nama lengkap<input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></label>
      </div>
      <div className="settings-save"><span>Peran Anda: <b>{session?.user?.role?.replace('_', ' ')}</b></span><Button disabled={busy === 'name' || name.trim().length < 2 || name.trim() === session?.user?.name} onClick={saveName}><Check size={15} /> Simpan nama</Button></div>

      <div style={{ marginTop: 24 }}><span className="eyebrow">KEAMANAN</span><h3>Ganti kata sandi</h3><p>Setelah diganti, sesi di perangkat lain akan keluar otomatis.</p></div>
      <form className="form-grid" onSubmit={savePassword}>
        <label className="field field-full">Kata sandi saat ini<input type="password" autoComplete="current-password" required value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label>
        <label className="field">Kata sandi baru<input type="password" autoComplete="new-password" required value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label>
        <label className="field">Ulangi kata sandi baru<input type="password" autoComplete="new-password" required value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
        {passwords.next && (
          <ul className="field field-full auth-checks" aria-label="Syarat kata sandi">
            {passwordChecks(passwords.next, session?.user?.email).map((check) => <li key={check.id} className={check.ok ? 'is-ok' : ''}>{check.ok ? <Check size={13} /> : <X size={13} />}{check.label}</li>)}
          </ul>
        )}
        <div className="field field-full"><Button type="submit" disabled={busy === 'password'}><KeyRound size={15} /> Ganti kata sandi</Button></div>
      </form>
    </>
  );
}

export function SettingsPage({ notify }) {
  const [tab, setTab] = useState('akun');
  const { organization, refresh, session, summary } = useDashboardData();
  const canManage = session?.user?.role === 'administrator';
  const [profile, setProfile] = useState({});
  const [settings, setSettings] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const raw = organization?.raw;
    setProfile(raw?.organization ?? {});
    setSettings(raw?.settings ?? {});
  }, [organization]);

  const setToggle = (key) => (value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setBusy(true);
    try {
      if (tab === 'profil') {
        await updateOrganization({
          name: profile.name, type: profile.type, registration_no: profile.registration_no || null,
          founded_year: profile.founded_year || null, address: profile.address || null,
          contact_email: profile.contact_email || null, contact_phone: profile.contact_phone || null,
          description: profile.description || null,
        });
      } else {
        await updateOrganizationSettings(settings);
      }
      refresh().catch((error) => notify('Data dashboard belum diperbarui', error.message));
      notify('Perubahan disimpan', 'Data organisasi tersimpan di server.');
    } catch (error) {
      notify('Perubahan belum tersimpan', error.message);
    } finally { setBusy(false); }
  };
  const setProfileField = (key) => (event) => setProfile((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="page-stack">
      <PageHead eyebrow="PREFERENSI WORKSPACE" title="Pengaturan" desc="Atur informasi organisasi dan preferensi dashboard." />

      <div className="settings-layout">
        <aside className="panel settings-menu">
          {settingTabs.map((item) => (
            <button type="button" key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>
              {item.label}<ChevronRight size={14} />
            </button>
          ))}
          <div className="settings-help">
            <CircleHelp size={17} />
            <span><b>Butuh bantuan?</b><small>Hubungi admin MAPAN.</small></span>
          </div>
        </aside>

        <section className="panel settings-form">
          {tab === 'akun' && <AccountPanel notify={notify} />}
          {tab === 'profil' && (
            <>
              <span className="eyebrow">PROFIL ORGANISASI</span>
              <h3>Informasi koperasi</h3>
              <p>Informasi ini ditampilkan kepada anggota workspace.</p>
              <div className="form-grid">
                <label className="field field-full">Nama organisasi<input disabled={!canManage} value={profile.name ?? ''} onChange={setProfileField('name')} /></label>
                <label className="field">Jenis organisasi<select disabled={!canManage} value={profile.type ?? 'koperasi'} onChange={setProfileField('type')}><option value="koperasi">Koperasi</option><option value="gapoktan">Gapoktan</option><option value="perusahaan_agribisnis">Perusahaan agribisnis</option><option value="lainnya">Lainnya</option></select></label>
                <label className="field">Wilayah operasional<input value={organization?.region ?? ''} disabled /></label>
                <label className="field">Email kontak<input disabled={!canManage} type="email" value={profile.contact_email ?? ''} onChange={setProfileField('contact_email')} /></label>
                <label className="field">Nomor registrasi<input disabled={!canManage} value={profile.registration_no ?? ''} onChange={setProfileField('registration_no')} /></label>
                <label className="field">Tahun berdiri<input disabled={!canManage} type="number" min="1900" max={new Date().getFullYear()} value={profile.founded_year ?? ''} onChange={setProfileField('founded_year')} /></label>
                <label className="field field-full">Alamat<input disabled={!canManage} value={profile.address ?? ''} onChange={setProfileField('address')} /></label>
                <label className="field field-full">Deskripsi singkat<textarea disabled={!canManage} rows={3} value={profile.description ?? ''} onChange={setProfileField('description')} /></label>
              </div>
              <div className="settings-save"><span>{canManage ? 'Profil organisasi disimpan di database.' : 'Hanya administrator yang dapat mengubah profil.'}</span><Button disabled={busy || !canManage} onClick={save}><Check size={15} /> Simpan perubahan</Button></div>
            </>
          )}

          {tab === 'akses' && (
            <>
              <span className="eyebrow">ANGGOTA & AKSES</span>
              <h3>Kontrol akses</h3>
              <p>Atur siapa yang dapat melihat dan mengubah data organisasi.</p>
              <div className="settings-option"><span><b>Profil organisasi publik</b><small>Izinkan anggota melihat informasi dasar koperasi.</small></span><Toggle disabled={!canManage} checked={settings.public_profile ?? false} onChange={setToggle('public_profile')} label="Profil organisasi publik" /></div>
              <div className="settings-option"><span><b>Persetujuan bergabung</b><small>Admin perlu menyetujui anggota baru sebelum aktif.</small></span><Toggle disabled={!canManage} checked={settings.join_approval ?? true} onChange={setToggle('join_approval')} label="Persetujuan bergabung" /></div>
              <div className="settings-option"><span><b>Akses baca untuk penyuluh</b><small>Penyuluh dapat melihat data tanpa mengubahnya.</small></span><Toggle disabled={!canManage} checked={settings.extension_read_access ?? false} onChange={setToggle('extension_read_access')} label="Akses penyuluh" /></div>
              <div className="role-list">
                <span className="role-chip">Administrator · {summary?.member_role?.administrator ?? 0}</span>
                <span className="role-chip">Manajer lapangan · {summary?.member_role?.manajer_lapangan ?? 0}</span>
                <span className="role-chip">Penyuluh · {summary?.member_role?.penyuluh ?? 0}</span>
                <span className="role-chip">Petani · {summary?.member_role?.petani ?? 0}</span>
              </div>
              <div className="settings-save"><span>{canManage ? 'Preferensi akses organisasi.' : 'Hanya administrator yang dapat mengubah preferensi.'}</span><Button disabled={busy || !canManage} onClick={save}><Check size={15} /> Simpan</Button></div>
            </>
          )}

          {tab === 'notifikasi' && (
            <>
              <span className="eyebrow">NOTIFIKASI</span>
              <h3>Pilih kabar yang ingin diterima</h3>
              <p>Cuaca tampil di dashboard. Pengingat aktivitas dan laporan email tersimpan sebagai preferensi, tetapi pengiriman terjadwal belum dikonfigurasi.</p>
              <div className="settings-option"><span><b>Ringkasan cuaca harian</b><small>Tampilkan kondisi cuaca pada halaman utama.</small></span><Toggle disabled={!canManage} checked={settings.weather_daily ?? false} onChange={setToggle('weather_daily')} label="Ringkasan cuaca harian" /></div>
              <div className="settings-option"><span><b>Pengingat aktivitas lapangan</b><small>Preferensi tersimpan; perlu layanan penjadwal untuk mengirim pengingat.</small></span><Toggle disabled={!canManage} checked={settings.activity_reminder ?? false} onChange={setToggle('activity_reminder')} label="Pengingat aktivitas" /></div>
              <div className="settings-option"><span><b>Laporan mingguan</b><small>Preferensi tersimpan; pengiriman email otomatis belum dikonfigurasi.</small></span><Toggle disabled={!canManage} checked={settings.weekly_report ?? false} onChange={setToggle('weekly_report')} label="Laporan mingguan" /></div>
              <div className="settings-save"><span>{canManage ? 'Notifikasi organisasi.' : 'Hanya administrator yang dapat mengubah preferensi.'}</span><Button disabled={busy || !canManage} onClick={save}><Check size={15} /> Simpan</Button></div>
            </>
          )}

          {tab === 'data' && (
            <>
              <span className="eyebrow">PREFERENSI DATA</span>
              <h3>Format dan sinkronisasi</h3>
              <p>Atur bagaimana data ditampilkan dan dibagikan.</p>
              <div className="form-grid">
                <label className="field">Satuan luas<select disabled={!canManage} value={settings.area_unit ?? 'ha'} onChange={(event) => setSettings((current) => ({ ...current, area_unit: event.target.value }))}><option value="ha">Hektare (ha)</option><option value="m2">Meter persegi (m²)</option><option value="are">Are</option></select></label>
                <label className="field">Format tanggal<select disabled={!canManage} value={settings.date_format ?? 'd_m_y_long'} onChange={(event) => setSettings((current) => ({ ...current, date_format: event.target.value }))}><option value="d_m_y_long">20 Okt 2026</option><option value="d_m_y">20/10/2026</option><option value="y_m_d">2026-10-20</option></select></label>
              </div>
              <div className="settings-option"><span><b>Sinkronisasi otomatis</b><small>Ambil ulang ringkasan, lahan, anggota, dan kelompok tiap 60 detik saat online.</small></span><Toggle disabled={!canManage} checked={settings.auto_sync ?? true} onChange={setToggle('auto_sync')} label="Sinkronisasi otomatis" /></div>
              <div className="settings-option"><span><b>Simpan foto resolusi tinggi</b><small>Jika nonaktif, JPEG dikompres ke lebar maksimal 1.920 piksel sebelum diunggah; PNG dan WEBP dipertahankan.</small></span><Toggle disabled={!canManage} checked={settings.high_res_photos ?? false} onChange={setToggle('high_res_photos')} label="Simpan foto resolusi tinggi" /></div>
              <div className="data-note"><ShieldCheck size={17} /><span>Preferensi organisasi tersimpan di database.</span></div>
              <div className="settings-save"><span>{canManage ? 'Format dan sinkronisasi organisasi.' : 'Hanya administrator yang dapat mengubah preferensi.'}</span><Button disabled={busy || !canManage} onClick={save}><Check size={15} /> Simpan</Button></div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export const pageData = {
  dashboard: ['Ringkasan', 'Kondisi pertanian organisasi Anda hari ini.'],
  peta: ['Peta lahan', 'Pantau sebaran dan kondisi setiap petak lahan.'],
  lahan: ['Lahan', 'Kelola informasi lahan dan petani pengelola.'],
  siklus: ['Siklus budidaya', 'Pantau tahap budidaya sesuai karakter tiap komoditas.'],
  prediksi: ['Prediksi panen', 'Estimasi hasil dan produktivitas per komoditas.'],
  cuaca: ['Cuaca & risiko', 'Informasi kondisi cuaca area pertanian.'],
  scan: ['Scan tanaman', 'Dokumentasikan foto dan gejala tanaman.'],
  aktivitas: ['Log aktivitas', 'Riwayat kegiatan lapangan organisasi.'],
  pengguna: ['Pengguna', 'Kelola anggota dan peran akses.'],
  organisasi: ['Organisasi', 'Ringkasan koperasi dan kelompok tani.'],
  komunitas: ['Komunitas', 'Berbagi pengalaman dengan komunitas tani.'],
  laporan: ['Laporan', 'Dokumentasi performa dan kegiatan pertanian.'],
  pengaturan: ['Pengaturan', 'Preferensi workspace koperasi.'],
};

export function ContentPage({ page, setPage, notify }) {
  switch (page) {
    case 'peta': return <FieldMapPage notify={notify} />;
    case 'lahan': return <LandPage notify={notify} />;
    case 'siklus': return <CyclesPage notify={notify} />;
    case 'prediksi': return <PredictionPage notify={notify} />;
    case 'cuaca': return <WeatherPage />;
    case 'scan': return <PlantHealthPage />;
    case 'aktivitas': return <ActivitiesPage notify={notify} />;
    case 'komunitas': return <CommunityPage notify={notify} />;
    case 'pengguna': return <UsersPage notify={notify} />;
    case 'organisasi': return <OrganizationPage setPage={setPage} />;
    case 'laporan': return <ReportsPage notify={notify} />;
    case 'pengaturan': return <SettingsPage notify={notify} />;
    default: return <DashboardHome setPage={setPage} notify={notify} />;
  }
}

export function FieldMapPage({ notify }) {
  const { plots: livePlots, session, refresh } = useDashboardData();
  const canManage = ['administrator', 'manajer_lapangan'].includes(session?.user?.role);
  const [mapFeatures, setMapFeatures] = useState([]);
  const [mapError, setMapError] = useState('');
  const [selectedId, setSelectedId] = useState(livePlots[0]?.id ?? null);
  const [detailPlotId, setDetailPlotId] = useState(null);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const bigMapRef = useRef(null);
  const livePlotsRef = useRef(livePlots);
  livePlotsRef.current = livePlots;

  const googleMapsEnabled = isGoogleMapsConfigured();

  useEffect(() => {
    if (!googleMapsEnabled || googleReady || googleFailed) return undefined;
    let active = true;
    loadGoogleMaps().then(() => {
      if (active) setGoogleReady(true);
    }).catch((cause) => {
      if (active) {
        setGoogleFailed(true);
        setMapError(cause.message);
      }
    });
    return () => { active = false; };
  }, [googleMapsEnabled, googleReady, googleFailed]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMapPlots(controller.signal).then((collection) => setMapFeatures(collection.features ?? [])).catch((error) => {
      if (error.name !== 'AbortError') setMapError(error.message);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!livePlots.some((plot) => plot.id === selectedId)) {
      setSelectedId(livePlots[0]?.id ?? null);
    }
  }, [livePlots, selectedId]);

  const filtered = livePlots.filter((plot) => `${plot.name} ${plot.crop} ${plot.location}`.toLowerCase().includes(query.toLowerCase()));
  const selected = livePlots.find((plot) => plot.id === selectedId) ?? livePlots[0] ?? {
    id: 'empty', name: 'Belum ada petak', crop: '—', area: '—', farmer: '—', phase: '—', health: 0, status: '—', color: 'green', location: '—',
  };
  const totalArea = livePlots.reduce((sum, plot) => sum + (Number(plot.area_ha) || 0), 0);
  const regionTotal = new Set(livePlots.map((plot) => plot.location).filter(Boolean)).size;
  const healthyTotal = livePlots.filter((plot) => plot.status === 'Sehat').length;
  const attentionTotal = livePlots.filter((plot) => plot.status === 'Perhatian').length;
  const mapPaths = useMemo(() => {
    const rings = mapFeatures.flatMap((feature) => {
      const geometry = feature.geometry;
      if (geometry?.type === 'Polygon') return [geometry.coordinates[0] ?? []];
      if (geometry?.type === 'MultiPolygon') return geometry.coordinates.map((polygon) => polygon[0] ?? []);
      return [];
    }).filter((ring) => ring.length > 2);
    const points = rings.flat();
    if (!points.length) return [];
    const longs = points.map(([longitude]) => longitude);
    const lats = points.map(([, latitude]) => latitude);
    const minLon = Math.min(...longs); const maxLon = Math.max(...longs);
    const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
    const width = maxLon - minLon || 1; const height = maxLat - minLat || 1;
    return rings.map((ring) => ring.map(([longitude, latitude]) => {
      const x = 60 + ((longitude - minLon) / width) * 880;
      const y = 480 - ((latitude - minLat) / height) * 420;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' '));
  }, [mapFeatures]);

  /** Render peta dasar Google Maps dengan batas petak GeoJSON. */
  useEffect(() => {
    if (!googleReady || !bigMapRef.current) return undefined;
    const maps = window.google.maps;
    const map = new maps.Map(bigMapRef.current, {
      center: { lat: -2.6, lng: 118 },
      zoom: 5,
      mapTypeId: 'hybrid',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    if (mapFeatures.length > 0) {
      map.data.addGeoJson({ type: 'FeatureCollection', features: mapFeatures });
    }
    const plotPalette = {
      aktif: { fill: '#8fc59b', stroke: '#d6e4a1' },
      selesai: { fill: '#d6e4a1', stroke: '#f4efd9' },
      persiapan: { fill: '#a97d3c', stroke: '#f1dfa2' },
      rusak: { fill: '#b55e4f', stroke: '#f9eae6' },
      ditutup: { fill: '#8b9c90', stroke: '#e3dfce' },
    };
    map.data.setStyle((feature) => {
      const status = String(feature.getProperty('status') ?? 'aktif').toLowerCase();
      const palette = plotPalette[status] ?? plotPalette.aktif;
      return {
        fillColor: palette.fill,
        fillOpacity: 0.3,
        strokeColor: palette.stroke,
        strokeWeight: 2,
        cursor: 'pointer',
      };
    });
    map.data.addListener('click', (event) => {
      const plotId = event.feature.getProperty('id');
      if (plotId === undefined || plotId === null) return;
      const match = livePlotsRef.current.find((plot) => String(plot.plot_id) === String(plotId));
      if (match) setSelectedId(match.id);
    });
    const bounds = new maps.LatLngBounds();
    map.data.forEach((entry) => entry.getGeometry().forEachLatLng((latLng) => bounds.extend(latLng)));
    if (!bounds.isEmpty()) map.fitBounds(bounds, 64);
    return undefined;
  }, [googleReady, mapFeatures]);

  return (
    <div className="page-stack">
      <PageHead
        eyebrow="INFORMASI SPASIAL"
        title="Peta lahan"
        desc="Sebaran lahan, komoditas, dan kondisi petak yang dikelola organisasi tani."
        action={<span className="location-pill"><Layers size={15} /> Batas lahan GeoJSON</span>}
      />

      <div className="stats-grid stats-grid-3">
        <Stat icon={MapPinned} label="Total petak" value={`${livePlots.length} petak`} detail={`${regionTotal} wilayah`} />
        <Stat icon={Wheat} label="Luas terpetakan" value={`${formatNumber(totalArea)} Ha`} detail="dari data petak terdaftar" tone="gold" />
        <Stat icon={ShieldCheck} label="Kondisi lahan" value={`${healthyTotal} sehat`} detail={`${attentionTotal} perlu perhatian`} tone="blue" />
      </div>

      <div className="map-workbench">
        <section className="panel big-map-panel">
          <div className="big-map-toolbar">
            <SearchField value={query} onChange={setQuery} placeholder="Cari desa atau petak..." />
            {googleMapsEnabled && !googleFailed
              ? <span className="chip chip-good">Google Maps aktif</span>
              : <span className="chip">Mode skema GeoJSON · kunci Google Maps belum diatur</span>}
          </div>
          <div className="big-map">
            <div className="map-canvas-inner" style={{ transform: `scale(${zoom})`, display: googleMapsEnabled && googleReady ? 'none' : undefined }}>
              <svg viewBox="0 0 1000 540" preserveAspectRatio="none" className="plot-svg" aria-label="Batas lahan dari GeoJSON">
                {mapPaths.map((points, index) => <polygon key={`${mapFeatures[index]?.properties?.id ?? index}`} points={points} className={`plot plot-${['a', 'b', 'c', 'd'][index % 4]}`} />)}
              </svg>
            </div>
            {googleMapsEnabled && !googleReady && !googleFailed && <div className="map-empty">Memuat Google Maps…</div>}
            {(googleFailed || !googleMapsEnabled) && mapPaths.length === 0 && <div className="map-empty">{mapError || 'Belum ada petak dengan batas GeoJSON. Petak tanpa koordinat tetap ada di daftar.'}</div>}
            {googleMapsEnabled && !googleFailed && <div className="google-canvas" ref={bigMapRef} />}
            {!googleReady && <div className="map-zoom">
              <button type="button" onClick={() => setZoom((value) => Math.min(1.6, value + 0.15))} aria-label="Perbesar peta">+</button>
              <button type="button" onClick={() => setZoom((value) => Math.max(0.8, value - 0.15))} aria-label="Perkecil peta">−</button>
              <button type="button" onClick={() => setZoom(1)} aria-label="Atur ulang peta">⟲</button>
            </div>}
            <div className="map-legend large">
              <b>KETERANGAN</b>
              <span><i />Sehat</span>
              <span><i className="warn" />Perhatian</span>
              <span><i className="blue" />Siklus aktif</span>
              <span><i className="gold" />Mendekati panen</span>
            </div>
            <span className="map-attribution">{googleReady ? 'Sumber: Google Maps · batas petak data organisasi (EPSG:4326)' : 'Sumber: batas petak organisasi · EPSG:4326'}</span>
          </div>
        </section>

        <aside className="panel map-side">
          <div className="panel-head"><div><span className="eyebrow">DAFTAR PETAK</span><h2>{filtered.length} lahan</h2></div><span className="chip">GeoJSON</span></div>
          <div className="map-side-list">
            {filtered.map((plot) => (
              <button type="button" key={plot.id} className={`map-plot ${selected.id === plot.id ? 'is-active' : ''}`} onClick={() => setSelectedId(plot.id)}>
                <span className={`plot-dot tone-${plot.color}`} />
                <span><b>{plot.name}</b><small>{plot.crop} · {plot.area}</small></span>
                <Status>{plot.status}</Status>
              </button>
            ))}
            {filtered.length === 0 && <EmptyState icon={Search} title="Petak tidak ditemukan" description="Coba kata kunci lain." />}
          </div>

          <div className="map-detail">
            <span className="eyebrow">PETAK TERPILIH</span>
            <h3>{selected.name}</h3>
            <p>{selected.crop} · {selected.area}</p>
            <div className="map-detail-row"><span>Petani</span><b>{selected.farmer}</b></div>
            <div className="map-detail-row"><span>Fase</span><b>{selected.phase}</b></div>
            <div className="map-detail-row"><span>Kesehatan</span><b>{selected.health}%</b></div>
            <Progress value={selected.health} tone={selected.health > 80 ? 'green' : 'gold'} />
            <Button disabled={!selected.plot_id} onClick={() => setDetailPlotId(selected.plot_id)}>Lihat detail lahan <ArrowRight size={15} /></Button>
          </div>
        </aside>
      </div>
      <PlotDetailModal plotId={detailPlotId} onClose={() => setDetailPlotId(null)} canManage={canManage} notify={notify} onChanged={() => refresh().catch((error) => notify('Daftar belum diperbarui', error.message))} />
    </div>
  );
}
