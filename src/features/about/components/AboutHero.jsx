import React from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, Database, MapPinned, ShieldCheck, Sprout } from 'lucide-react';
import { Button } from '../../../shared/ui';
import aboutPhoto from '../../landing/assets/images/harvest-community.jpg';

export default function AboutHero({ onEnter }) {
  return (
    <section id="tentang" className="about-hero">
      <span className="about-grid-bg" aria-hidden="true" />
      <div className="container about-hero-grid">
        <div className="about-hero-copy" data-reveal>
          <span className="pill about-pill"><Sprout size={13} /> TENTANG MAPAN</span>
          <h1>
            Pertanian punya datanya.
            <br />
            <em>Kami membantu membacanya.</em>
          </h1>
          <p className="about-lead">
            MAPAN adalah ruang kerja digital untuk petani, kelompok tani, dan koperasi.
            Kami menyatukan catatan lapangan, peta, cuaca, dan data resmi agar keputusan
            harian tidak lagi bergantung pada tebakan.
          </p>
          <div className="about-actions">
            <a className="btn btn-primary btn-lg" href="#tentang-data">
              Jelajahi data pertanian <ArrowRight size={17} />
            </a>
            <Button variant="secondary" size="lg" onClick={onEnter}>
              Buka dashboard <ArrowUpRight size={17} />
            </Button>
          </div>
          <div className="about-hero-meta">
            <span><Database size={14} /> Mengacu publikasi resmi BPS</span>
            <span><ShieldCheck size={14} /> Data demo tetap diberi label jelas</span>
          </div>
        </div>

        <div className="about-hero-visual" data-reveal style={{ '--reveal-delay': '120ms' }}>
          <figure className="about-photo">
            <img src={aboutPhoto} alt="Kelompok petani memanen hasil kebun bersama" />
          </figure>
          <span className="about-photo-shade" aria-hidden="true" />

          <div className="about-float about-float-top">
            <span className="about-float-icon"><BarChart3 size={18} /></span>
            <div>
              <b>53,14 juta ton</b>
              <small>produksi padi 2024 · BPS</small>
            </div>
          </div>

          <div className="about-float about-float-bottom">
            <div className="about-float-head">
              <span><Database size={13} /> Sensus Pertanian 2023</span>
              <span className="live-dot" />
            </div>
            <b>29,36 juta</b>
            <small>unit usaha pertanian di Indonesia</small>
            <div className="about-float-bars" aria-hidden="true">
              <span style={{ width: '82%' }} />
              <span style={{ width: '64%' }} />
              <span style={{ width: '91%' }} />
            </div>
          </div>

          <div className="about-badge">
            <MapPinned size={15} />
            <span>Berangkat dari Subak Sari, Tabanan</span>
          </div>
        </div>
      </div>
    </section>
  );
}
