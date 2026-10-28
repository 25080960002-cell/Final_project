import React from 'react';
import { ArrowUpRight, Check, Sprout } from 'lucide-react';
import storyPhoto from '../assets/images/rice-terraces.jpg';

export default function StorySection({ onAbout }) {
  return (
    <section id="cerita" className="section story">
      <div className="container story-grid">
        <div className="story-visual" data-reveal>
          <figure className="story-photo">
            <img src={storyPhoto} alt="Petani berjalan di antara terasering sawah" loading="lazy" />
          </figure>
          <div className="story-badge">
            <span className="story-badge-icon"><Sprout size={18} /></span>
            <div><b>Sejak 2018</b><small>mendampingi koperasi tani</small></div>
          </div>
          <div className="story-quote">
            <p>“Keputusan yang baik berawal dari pemahaman kondisi di lapangan.”</p>
          </div>
        </div>

        <div className="story-copy" data-reveal style={{ '--reveal-delay': '90ms' }}>
          <span className="eyebrow">TENTANG MAPAN</span>
          <h2>Teknologi yang mengikuti <em>irama petani.</em></h2>
          <p>
            Setiap komoditas punya ritme dan tantangannya sendiri. Petani perlu memahami
            cuaca, kondisi lahan, dan fase budidaya sebelum menentukan langkah berikutnya.
          </p>
          <p>
            MAPAN menyatukan catatan lapangan, peta, cuaca, dan kolaborasi tim agar keputusan
            tidak lagi berserakan di buku, grup chat, atau ingatan semata.
          </p>
          <ul className="story-list">
            <li><Check size={15} /> Dibuat bersama kelompok tani dan pengelola koperasi.</li>
            <li><Check size={15} /> Ringan dipakai di ponsel, nyaman dibaca di desktop.</li>
            <li><Check size={15} /> Data dapat diunduh untuk rapat dan pelaporan.</li>
          </ul>
          <button type="button" className="text-link" onClick={() => onAbout?.()}>
            Buka halaman Tentang MAPAN <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
