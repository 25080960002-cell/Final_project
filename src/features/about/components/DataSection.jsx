import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, BarChart3, Database, ExternalLink, Sprout, UsersRound } from 'lucide-react';
import {
  ageSeries,
  censusFacts,
  headlineStats,
  insights,
  islandShare,
  provinceSeries,
  provinceShare,
  provinceTotal,
  riceSeries,
  sources,
} from '../data/agriculture';

const numberFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatNumber = (value) => numberFormat.format(value);

function ChartTooltip({ active, payload, label, suffix = '', names = {} }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{label}</span>
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey || entry.name}>
          <i style={{ background: entry.color || entry.fill }} />
          <span>{names[entry.dataKey] || entry.name}</span>
          <b>{formatNumber(entry.value)}{suffix}</b>
        </div>
      ))}
    </div>
  );
}

function ComboTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{label}</span>
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey}>
          <i style={{ background: entry.color || entry.fill }} />
          <span>{entry.name}</span>
          <b>
            {formatNumber(entry.value)}
            {entry.dataKey === 'area' ? ' juta ha' : ' kuintal/ha'}
          </b>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ className = '', icon: Icon, badge, title, description, children, foot }) {
  return (
    <article className={`data-card ${className}`} data-reveal>
      <header className="data-card-head">
        <div>
          {badge && <span className="data-badge">{badge}</span>}
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {Icon && <span className="data-card-icon"><Icon size={18} /></span>}
      </header>
      <div className="data-card-body">{children}</div>
      {foot && <footer className="data-card-foot">{foot}</footer>}
    </article>
  );
}

function ProductionChart() {
  return (
    <div className="chart-frame" role="img" aria-label="Produksi padi nasional 2019 sampai 2024 dalam juta ton gabah kering giling">
      <ResponsiveContainer width="100%" height={252}>
        <AreaChart data={riceSeries} margin={{ top: 16, right: 10, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="riceProductionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6aa582" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#6aa582" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 8" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
          <YAxis
            domain={[50, 56]}
            ticks={[50, 52, 54, 56]}
            axisLine={false}
            tickLine={false}
            width={38}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltip suffix=" juta ton" names={{ production: 'Produksi' }} />}
            cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="production"
            name="Produksi"
            stroke="var(--accent)"
            strokeWidth={2.6}
            fill="url(#riceProductionFill)"
            dot={{ r: 3.4, strokeWidth: 0, fill: 'var(--accent)' }}
            activeDot={{ r: 5.4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComboChart() {
  return (
    <div className="chart-frame" role="img" aria-label="Luas panen padi dalam juta hektare dan produktivitas dalam kuintal per hektare, 2019 sampai 2024">
      <ResponsiveContainer width="100%" height={252}>
        <ComposedChart data={riceSeries} margin={{ top: 16, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 8" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
          <YAxis
            yAxisId="area"
            domain={[9.5, 11]}
            ticks={[9.5, 10, 10.5, 11]}
            axisLine={false}
            tickLine={false}
            width={38}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
          />
          <YAxis
            yAxisId="productivity"
            orientation="right"
            domain={[50, 54]}
            ticks={[50, 51, 52, 53, 54]}
            axisLine={false}
            tickLine={false}
            width={34}
            tick={{ fill: 'var(--gold)', fontSize: 11 }}
          />
          <Tooltip content={<ComboTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar
            yAxisId="area"
            dataKey="area"
            name="Luas panen"
            fill="var(--lime-strong)"
            radius={[5, 5, 0, 0]}
            barSize={24}
          />
          <Line
            yAxisId="productivity"
            type="monotone"
            dataKey="productivity"
            name="Produktivitas"
            stroke="var(--gold)"
            strokeWidth={2.4}
            dot={{ r: 3, strokeWidth: 0, fill: 'var(--gold)' }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProvinceChart() {
  const summary = provinceSeries
    .map((item) => `${item.province} ${formatNumber(item.production)} juta ton`)
    .join(', ');

  return (
    <div className="chart-frame" role="img" aria-label={`Lima provinsi penghasil padi terbesar 2024: ${summary}`}>
      <ResponsiveContainer width="100%" height={252}>
        <BarChart
          data={provinceSeries}
          layout="vertical"
          margin={{ top: 4, right: 46, bottom: 4, left: 0 }}
          barCategoryGap={16}
        >
          <XAxis type="number" hide domain={[0, 10]} />
          <YAxis
            type="category"
            dataKey="short"
            width={58}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--ink-soft)', fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTooltip suffix=" juta ton" names={{ production: 'Produksi' }} />}
            cursor={{ fill: 'var(--surface-2)' }}
          />
          <Bar dataKey="production" name="Produksi" fill="var(--accent)" radius={[0, 8, 8, 0]} barSize={16}>
            <LabelList
              dataKey="production"
              position="right"
              fill="var(--ink-soft)"
              fontSize={11}
              fontWeight={600}
              formatter={(value) => formatNumber(value)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgeChart() {
  return (
    <div className="chart-frame" role="img" aria-label="Struktur usia pengelola usaha pertanian perorangan 2023: 15-24 tahun 1,24 persen, 25-34 10,34 persen, 35-44 22,08 persen, 45-54 27,09 persen, 55-64 23,20 persen, 65 tahun ke atas 16,15 persen">
      <ResponsiveContainer width="100%" height={252}>
        <BarChart data={ageSeries} margin={{ top: 14, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 8" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="bracket" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={10} />
          <YAxis
            domain={[0, 30]}
            ticks={[0, 10, 20, 30]}
            axisLine={false}
            tickLine={false}
            width={34}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltip suffix="%" names={{ share: 'Porsi pengelola' }} />}
            cursor={{ fill: 'var(--surface-2)' }}
          />
          <Bar dataKey="share" name="Porsi pengelola" radius={[5, 5, 0, 0]} barSize={26}>
            {ageSeries.map((entry) => {
              const senior = entry.bracket === '65+' || Number(entry.bracket.split('–')[0]) >= 55;
              return <Cell key={entry.bracket} fill={senior ? 'var(--gold)' : 'var(--accent)'} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IslandChart() {
  return (
    <div className="donut-block">
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height={194}>
          <PieChart>
            <Pie
              data={islandShare}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={4}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill="var(--accent)" />
              <Cell fill="var(--lime-strong)" />
            </Pie>
            <Tooltip content={<ChartTooltip suffix="%" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <b>54,19%</b>
          <span>Pulau Jawa</span>
        </div>
      </div>
      <ul className="chart-legend-list">
        <li><i className="dot dot-accent" />Pulau Jawa<b>54,19%</b></li>
        <li><i className="dot dot-lime" />Luar Jawa<b>45,81%</b></li>
      </ul>
    </div>
  );
}

export default function DataSection() {
  return (
    <section id="tentang-data" className="section data-section">
      <div className="container">
        <div className="data-head" data-reveal>
          <div>
            <span className="eyebrow"><Database size={14} /> DATA RESMI</span>
            <h2>Potret pertanian Indonesia,<br /><em>dalam angka.</em></h2>
          </div>
          <p>
            Semua grafik di halaman ini bersumber dari publikasi Badan Pusat Statistik.
            Angka disajikan apa adanya, lengkap dengan periode dan satuannya, agar bisa
            dipakai sebagai konteks—bukan pengganti pengamatan di lapangan.
          </p>
        </div>

        <div className="data-kpis">
          {headlineStats.map((stat) => (
            <article className="data-kpi" key={stat.label} data-reveal>
              <span className="data-kpi-label">{stat.label}</span>
              <b>{stat.value} <small>{stat.unit}</small></b>
              <p>{stat.note}</p>
            </article>
          ))}
        </div>

        <div className="data-grid">
          <ChartCard
            className="span-7"
            icon={BarChart3}
            badge="BPS · 3 FEBRUARI 2025"
            title="Produksi padi nasional"
            description="Gabah kering giling (GKG), 2019–2024."
            foot={(
              <>
                <span>2024: <b>53,14 juta ton</b></span>
                <span className="data-delta is-down">−1,55% dari 2023</span>
              </>
            )}
          >
            <ProductionChart />
          </ChartCard>

          <ChartCard
            className="span-5"
            icon={Sprout}
            badge="BPS · 2024"
            title="Dari mana beras kita berasal?"
            description="Sebaran produksi padi nasional menurut pulau."
          >
            <IslandChart />
            <div className="data-mini-stat">
              <span>Jagung 2024</span>
              <b>15,14 juta ton</b>
              <em>+2,47% dari 2023</em>
            </div>
          </ChartCard>

          <ChartCard
            className="span-7"
            icon={BarChart3}
            badge="BPS · 2019–2024"
            title="Luas panen & produktivitas"
            description="Luas panen cenderung menurun, produktivitas bergerak naik."
            foot={(
              <>
                <span>2024: <b>52,88 kuintal/ha</b></span>
                <span className="data-delta">Tertinggi dalam 6 tahun</span>
              </>
            )}
          >
            <ComboChart />
            <ul className="chart-legend-list legend-inline">
              <li><i className="dot dot-lime" />Luas panen (juta ha)</li>
              <li><i className="dot dot-gold" />Produktivitas (kuintal/ha)</li>
            </ul>
          </ChartCard>

          <ChartCard
            className="span-5"
            icon={UsersRound}
            badge="SENSUS PERTANIAN 2023"
            title="Siapa yang mengelola lahan?"
            description="Struktur usia pengelola usaha pertanian perorangan."
            foot={(
              <>
                <span className="data-delta is-warn">39,35% berusia 55+</span>
                <span>Regenerasi jadi agenda utama</span>
              </>
            )}
          >
            <AgeChart />
          </ChartCard>

          <ChartCard
            className="span-7"
            icon={BarChart3}
            badge="BPS · 2024"
            title="Lima provinsi penghasil padi terbesar"
            description="Kontribusi produksi padi menurut provinsi, juta ton GKG."
            foot={(
              <>
                <span>Total lima provinsi: <b>{formatNumber(provinceTotal)} juta ton</b></span>
                <span>{formatNumber(provinceShare)}% produksi nasional</span>
              </>
            )}
          >
            <ProvinceChart />
          </ChartCard>

          <aside className="data-insights span-5" data-reveal>
            <span className="eyebrow">BACAAN DATA</span>
            <h3>Tiga hal yang perlu diperhatikan.</h3>
            <ol>
              {insights.map((item, index) => (
                <li key={item.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <b>{item.title}</b>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div className="census-band" data-reveal>
          <div className="census-copy">
            <span className="eyebrow">SENSUS PERTANIAN 2023</span>
            <h3>Wajah usaha pertanian Indonesia.</h3>
            <p>
              Sensus Pertanian 2023 mencatat 29,36 juta unit usaha pertanian. Hampir
              seluruhnya adalah usaha pertanian perorangan, dan lebih dari separuhnya
              bergerak di subsektor tanaman pangan.
            </p>
          </div>
          <ul className="census-facts">
            {censusFacts.map((fact) => (
              <li key={fact.label}>
                <b>{fact.value}</b>
                <span>{fact.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="data-sources" data-reveal>
          <div className="data-sources-head">
            <span className="eyebrow"><Database size={14} /> SUMBER & METODOLOGI</span>
            <p>
              Data produksi dan luas panen berasal dari Kerangka Sampel Area (KSA) BPS.
              Produktivitas dihitung dari produksi GKG dibagi luas panen. Persentase dapat
              tidak berjumlah tepat 100% karena pembulatan.
            </p>
          </div>
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.label}>
                <a href={source.href} target="_blank" rel="noopener noreferrer">
                  <span>
                    <b>{source.label}</b>
                    <small>{source.meta}</small>
                  </span>
                  <ExternalLink size={15} />
                </a>
              </li>
            ))}
          </ul>
          <p className="data-disclaimer">
            Halaman ini adalah bagian dari prototipe MAPAN. Angka resmi digunakan untuk
            memberi konteks; data operasional pada dashboard demo tetap merupakan data
            simulasi. <a href="#faq">Baca catatan data <ArrowUpRight size={13} /></a>
          </p>
        </div>
      </div>
    </section>
  );
}
