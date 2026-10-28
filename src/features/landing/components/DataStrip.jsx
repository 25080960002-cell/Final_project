import React from 'react';
import { ArrowRight, Database, ExternalLink } from 'lucide-react';
import riceTerraces from '../assets/images/rice-terraces.jpg';
import { riceSeries } from '../../about/data/agriculture';

const stats = [
  {
    value: '53,14',
    unit: 'juta ton',
    label: 'Produksi padi 2024',
    meta: 'BPS · turun 1,55% dari 2023',
  },
  {
    value: '10,05',
    unit: 'juta ha',
    label: 'Luas panen padi 2024',
    meta: 'BPS · 50,20% berada di Pulau Jawa',
  },
  {
    value: '52,88',
    unit: 'kuintal/ha',
    label: 'Produktivitas padi 2024',
    meta: 'BPS · tertinggi dalam enam tahun',
  },
];

function MiniProductionChart() {
  const width = 420;
  const height = 128;
  const padX = 10;
  const padY = 14;
  const values = riceSeries.map((item) => item.production);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.4;
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = padX + (index / (values.length - 1)) * (width - padX * 2);
    const y = height - padY - ((value - min) / span) * (height - padY * 2);
    return [x, y];
  });

  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width - padX},${height - padY} L${padX},${height - padY} Z`;

  return (
    <svg
      className="data-strip-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Grafik produksi padi nasional 2019 sampai 2024, dari 54,60 juta ton menjadi 53,14 juta ton"
    >
      <defs>
        <linearGradient id="dataStripFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6e4a1" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#d6e4a1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dataStripFill)" />
      <path d={line} fill="none" stroke="#d6e4a1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], index) => (
        <circle
          key={riceSeries[index].year}
          cx={x}
          cy={y}
          r={index === points.length - 1 ? 4.4 : 2.6}
          fill={index === points.length - 1 ? '#f4f1e5' : '#d6e4a1'}
          stroke={index === points.length - 1 ? '#d6e4a1' : 'none'}
          strokeWidth="2"
        />
      ))}
      <text x={padX} y={height - 1} className="data-strip-axis">2019</text>
      <text x={width - padX} y={height - 1} textAnchor="end" className="data-strip-axis">2024</text>
    </svg>
  );
}

export default function DataStrip({ onAbout }) {
  return (
    <section className="data-strip" aria-label="Data resmi pertanian Indonesia">
      <div className="container data-strip-grid">
        <div className="data-strip-copy" data-reveal>
          <span className="eyebrow eyebrow-light"><Database size={14} /> DATA RESMI</span>
          <h2>
            Keputusan yang lebih baik
            <br />
            <em>dimulai dari data terbuka.</em>
          </h2>
          <p>
            MAPAN menghubungkan catatan lapangan dengan publikasi resmi Badan Pusat
            Statistik, agar setiap rencana panen dan pemupukan punya konteks yang jelas.
          </p>
          <button type="button" className="text-link text-link-light" onClick={() => onAbout?.('tentang-data')}>
            Lihat potret pertanian Indonesia <ArrowRight size={16} />
          </button>
        </div>

        <div className="data-strip-panel" data-reveal style={{ '--reveal-delay': '110ms' }}>
          <div className="data-strip-visual">
            <img src={riceTerraces} alt="" aria-hidden="true" loading="lazy" />
            <span className="data-strip-veil" aria-hidden="true" />
            <div className="data-strip-chart-wrap">
              <div className="data-strip-chart-head">
                <span>Produksi padi nasional</span>
                <span>2019–2024 · juta ton GKG</span>
              </div>
              <MiniProductionChart />
            </div>
          </div>

          <div className="data-strip-stats">
            {stats.map((item) => (
              <div key={item.label}>
                <b>{item.value} <small>{item.unit}</small></b>
                <span>{item.label}</span>
                <em>{item.meta}</em>
              </div>
            ))}
          </div>

          <a
            className="data-strip-source"
            href="https://www.bps.go.id/id/pressrelease/2025/02/03/2414/pada-2024--luas-panen-padi-mencapai-sekitar-10-05-juta-hektare-dengan-produksi-padi-sebanyak-53-14-juta-ton-gabah-kering-giling--gkg--.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sumber: Badan Pusat Statistik, Berita Resmi Statistik 3 Februari 2025
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}
