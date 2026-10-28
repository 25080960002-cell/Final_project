import React, { useState } from 'react';
import { Building2, Flower2, Leaf, Pause, Play, Sprout, TreePine, UsersRound } from 'lucide-react';

const groups = [
  { label: 'Tanaman Pangan', icon: Sprout },
  { label: 'Hortikultura', icon: Flower2 },
  { label: 'Perkebunan', icon: TreePine },
  { label: 'Petani Mandiri', icon: Leaf },
  { label: 'Kelompok Tani', icon: UsersRound },
  { label: 'Koperasi Pertanian', icon: Building2 },
];

export default function EcosystemStrip() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="ecosystem" aria-label="Ekosistem pertanian yang didukung MAPAN">
      <div className="container">
        <div className="ecosystem-head">
          <span>Mendukung beragam ekosistem pertanian</span>
          <button
            type="button"
            className="ecosystem-toggle"
            aria-label={paused ? 'Putar animasi' : 'Jeda animasi'}
            aria-pressed={paused}
            onClick={() => setPaused((current) => !current)}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
        <div className="ecosystem-viewport">
          <div className={`ecosystem-marquee ${paused ? 'is-paused' : ''}`}>
            {[0, 1].map((copy) => (
              <ul className="ecosystem-track" key={copy} aria-hidden={copy === 1 || undefined}>
                {groups.map(({ label, icon: Icon }) => (
                  <li key={label}><Icon size={20} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span></li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
