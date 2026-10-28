import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplets,
  Leaf,
  MapPin,
  Plus,
  Sprout,
  Sun,
  Wind,
  Wheat,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Progress, Status } from '../../../shared/ui';
import { activities as sampleActivities } from '../data/dashboard';
import { useDashboardData } from '../data/DashboardDataContext';
import { formatNumber } from '../data/adapters';
import riceTerraces from '../../landing/assets/images/rice-terraces.jpg';

const activityIcons = { leaf: Sprout, water: Wheat, gold: CloudRain };

export function Sparkline({ data = [4, 8, 6, 11, 9, 14, 12], tone = 'green' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 30 - ((value - min) / (max - min || 1)) * 25;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className={`sparkline sparkline-${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stat({ icon: Icon, label, value, change, tone = 'green', detail, spark }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon tone-${tone}`}><Icon size={18} /></span>
        {change && (
          <span className={`stat-delta ${change.startsWith('-') ? 'is-down' : ''}`}>
            <ArrowUpRight size={13} />{change}
          </span>
        )}
      </div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {detail && <span className="stat-detail">{detail}</span>}
      </div>
      {spark && <Sparkline data={spark} tone={tone} />}
    </article>
  );
}

export function ChartCard({ prediction }) {
  const chartRows = (prediction?.by_commodity ?? []).map((item) => ({ month: item.crop, now: item.estimate_tons }));
  return (
    <article className="panel chart-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">ESTIMASI PRODUKSI</span>
          <h2>Hasil per komoditas</h2>
          <p>Benchmark hasil dari siklus budidaya aktif.</p>
        </div>
        <span className="chip">Ton</span>
      </div>
      <div className="chart-legend">
        <span><i className="legend-current" />Estimasi</span>
        <span>{prediction?.active_cycles ?? 0} siklus aktif</span>
      </div>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartRows} margin={{ top: 12, right: 6, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="yieldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f7f58" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#3f7f58" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                boxShadow: '0 16px 40px -20px rgba(18,38,28,.35)',
                fontSize: 12,
              }}
              cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="now" name="Tahun ini" stroke="#2f7550" strokeWidth={2.6} fill="url(#yieldFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        <span><b>{formatNumber(prediction?.estimated_tons ?? 0)} ton</b> benchmark hasil</span>
        <span>{prediction ? 'Data organisasi' : 'Belum ada siklus'}</span>
      </div>
    </article>
  );
}

export function MapPreview({ onDetail }) {
  const { summary, plots } = useDashboardData();
  const regionTotal = new Set(plots.map((plot) => plot.region).filter(Boolean)).size;

  return (
    <article className="panel map-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">SEBARAN LAHAN</span>
          <h2>Peta petak</h2>
        </div>
        <button type="button" className="text-link small" onClick={onDetail}>Detail <ChevronRight size={14} /></button>
      </div>
      <div className="map-preview">
        <img className="map-photo" src={riceTerraces} alt="Petak-petak lahan pertanian dari udara" />
        <span className="map-tint" aria-hidden="true" />
        <span className="map-attribution">Foto ilustrasi</span>
        <div className="map-status">
          <span className="live-dot" />
          <div><small>STATUS</small><b>{summary ? `${summary.plot_total} petak aktif` : '0 petak aktif'}</b></div>
        </div>
        <div className="map-legend">
          <span><i />Sehat</span>
          <span><i className="warn" />Perhatian</span>
        </div>
      </div>
      <div className="map-meta">
        <span><b>{formatNumber(summary?.area_ha ?? 0)} ha</b> terkelola</span>
        <i className="meta-sep" />
        <span><b>{regionTotal}</b> wilayah</span>
        <span className="meta-updated"><span className="live-dot" />Diperbarui hari ini</span>
      </div>
    </article>
  );
}

export function ActivityPanel({ onAll, onAdd, rows = sampleActivities, disabled = false }) {
  const [activityTitle, setActivityTitle] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!activityTitle.trim() || !onAdd || disabled) return;
    onAdd(activityTitle.trim());
    setActivityTitle('');
  };
  return (
    <article className="panel activity-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">AKTIVITAS</span>
          <h2>Log lapangan</h2>
        </div>
        <button type="button" className="text-link small" onClick={onAll}>Semua <ArrowRight size={14} /></button>
      </div>
      <div className="activity-list">
        {rows.slice(0, 5).map((activity, index) => {
          const Icon = activityIcons[activity.tone] || Leaf;
          return (
            <div className="activity-row" key={activity.title}>
              <span className={`activity-icon tone-${activity.tone}`}><Icon size={16} /></span>
              <div className="activity-copy"><b>{activity.title}</b><small>{activity.plot}</small></div>
              <time>{activity.time}</time>
              {index < Math.min(rows.length, 5) - 1 && <span className="activity-line" aria-hidden="true" />}
            </div>
          );
        })}
        {rows.length === 0 && <p className="muted-cell">Belum ada aktivitas tersimpan.</p>}
      </div>
      <form className="task-add" onSubmit={submit}><Plus size={15} /><input disabled={disabled} value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} placeholder={disabled ? 'Akses baca saja' : 'Catat aktivitas lapangan...'} aria-label="Aktivitas lapangan baru" /><button type="submit" className="sr-only" disabled={disabled}>Simpan aktivitas</button></form>
    </article>
  );
}

export function WeatherPanel({ onDetail, weather, error }) {
  const current = weather?.current;
  return (
    <article className="panel weather-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">CUACA LOKAL</span>
          <h2>Hari ini</h2>
        </div>
        <span className="weather-location"><MapPin size={14} /> {weather?.location?.name ?? 'Wilayah'}</span>
      </div>
      <div className="weather-hero-mini">
        <div className="weather-temperature">
          <span className="weather-sun"><Sun size={30} /><Cloud size={18} /></span>
          <div><b>{current ? `${formatNumber(current.temperature_c, 1)}°` : '—'}</b><small>{current?.description ?? error ?? 'Belum tersedia'}</small></div>
        </div>
        <Status>{current?.risk ?? 'Belum tersedia'}</Status>
      </div>
      <div className="weather-metrics">
        <div><Droplets size={15} /><span>Kelembapan</span><b>{current ? `${formatNumber(current.humidity_pct, 0)}%` : '—'}</b></div>
        <div><Wind size={15} /><span>Angin</span><b>{current ? `${formatNumber(current.wind_kmh)} km/j` : '—'}</b></div>
        <div><CloudRain size={15} /><span>Hujan</span><b>{current ? `${formatNumber(current.rain_probability_pct, 0)}%` : '—'}</b></div>
      </div>
      <div className="weather-advice">
        <span><Check size={14} /></span>
        <p>{current ? `Peluang hujan ${formatNumber(current.rain_probability_pct, 0)}%. Periksa kondisi lahan sebelum menjadwalkan pekerjaan.` : 'Prakiraan tersedia setelah wilayah organisasi memiliki koordinat.'}</p>
      </div>
      <button type="button" className="panel-link" onClick={onDetail}>Lihat prakiraan 5 hari <ArrowRight size={14} /></button>
    </article>
  );
}

export function TasksPanel({ tasks, onToggle, onAdd, disabled = false }) {
  const [newTask, setNewTask] = useState('');
  const done = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const submit = (event) => {
    event.preventDefault();
    if (!newTask.trim() || disabled) return;
    onAdd(newTask.trim());
    setNewTask('');
  };

  return (
    <article className="panel tasks-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">FOKUS HARI INI</span>
          <h2>Tugas lapangan</h2>
        </div>
        <span className="task-count">{done}/{tasks.length} selesai</span>
      </div>
      <div className="task-progress">
        <Progress value={progress} />
        <span>{progress}%</span>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <label className={`task-row ${task.done ? 'is-done' : ''}`} key={task.id}>
            <input type="checkbox" checked={task.done} disabled={disabled} onChange={() => onToggle(task.id)} />
            <span className="task-check"><Check size={12} /></span>
            <span className="task-copy"><b>{task.label}</b><small>{task.meta}</small></span>
          </label>
        ))}
      </div>
      <form className="task-add" onSubmit={submit}>
        <Plus size={15} />
        <input disabled={disabled} value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder={disabled ? 'Akses baca saja' : 'Tambah tugas baru...'} aria-label="Tambah tugas baru" />
      </form>
    </article>
  );
}

export function CommodityPanel({ rows = [] }) {
  return (
    <article className="panel commodity-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">KOMPOSISI</span>
          <h2>Sebaran komoditas</h2>
        </div>
        <span className="chip">{formatNumber(rows.reduce((sum, item) => sum + item.area_ha, 0))} ha</span>
      </div>
      <div className="commodity-stack">
        {rows.map((item, index) => (
          <div className="commodity-row" key={item.label}>
            <span className={`commodity-dot tone-${['green', 'gold', 'blue', 'red'][index % 4]}`} />
            <span>{item.label}</span>
            <div className="commodity-bar"><span className={`tone-${['green', 'gold', 'blue', 'red'][index % 4]}`} style={{ width: `${item.value}%` }} /></div>
            <b>{item.value}%</b>
          </div>
        ))}
      </div>
      <div className="commodity-note">
        <Sprout size={15} />
        <span>{rows.length ? 'Komposisi dihitung dari siklus aktif.' : 'Belum ada data komoditas.'}</span>
      </div>
    </article>
  );
}
