import React from 'react';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  CloudSun,
  FileBarChart2,
  LayoutDashboard,
  Quote,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { Button, Progress } from '../../../shared/ui';
import SectionHead from './SectionHead';

export function ValueGrid() {
  return (
    <section className="section values">
      <div className="container">
        <SectionHead
          eyebrow="KENAPA MAPAN"
          title={<>Satu tempat untuk semua<br /><em>keputusan di lahan.</em></>}
          description="Dari catatan harian sampai rencana panen, semuanya tersusun rapi dan mudah dibaca oleh petani maupun pengelola koperasi."
        />

        <div className="value-grid" data-reveal>
          <article className="value-card value-chart">
            <div className="value-head">
              <span className="value-icon"><TrendingUp size={18} /></span>
              <span className="chip chip-good">+14,8%</span>
            </div>
            <h3>Produktivitas terlihat jelas</h3>
            <p>Bandingkan hasil tiap musim dan temukan lahan yang perlu perhatian lebih awal.</p>
            <div className="mock-chart" aria-hidden="true">
              <div className="mock-chart-head"><span>Estimasi panen</span><b>1,2 ton</b></div>
              <svg viewBox="0 0 320 96" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,74 C35,70 45,42 78,52 C110,61 118,32 152,40 C186,48 198,18 232,26 C266,34 286,10 320,16 L320,96 L0,96 Z" fill="url(#areaFill)" />
                <path d="M0,74 C35,70 45,42 78,52 C110,61 118,32 152,40 C186,48 198,18 232,26 C266,34 286,10 320,16" fill="none" stroke="var(--accent-strong)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="mock-chart-labels"><span>Jan</span><span>Apr</span><span>Jul</span><span>Okt</span><span>Des</span></div>
            </div>
          </article>

          <article className="value-card value-weather">
            <div className="value-head">
              <span className="value-icon tone-blue"><CloudSun size={18} /></span>
              <span className="chip">Tabanan</span>
            </div>
            <h3>Cuaca yang bisa ditindaklanjuti</h3>
            <p>Bukan sekadar angka, tetapi saran kegiatan untuk hari ini.</p>
            <div className="mock-weather">
              <div><b>28°</b><span>Cerah berawan</span></div>
              <ul>
                <li><span>Kelembapan</span><b>65%</b></li>
                <li><span>Angin</span><b>8 km/j</b></li>
                <li><span>Hujan</span><b>10%</b></li>
              </ul>
            </div>
            <span className="inline-note"><ShieldCheck size={14} /> Risiko rendah untuk kegiatan lapangan</span>
          </article>

          <article className="value-card value-team">
            <div className="value-head">
              <span className="value-icon tone-gold"><UsersRound size={18} /></span>
              <span className="chip">6 kelompok</span>
            </div>
            <h3>Tim dan anggota tetap sinkron</h3>
            <p>Peran, undangan, dan aktivitas lapangan dalam satu alur.</p>
            <div className="mock-team">
              <div className="mock-team-row">
                <span className="avatar avatar-sm avatar-green">WS</span>
                <div><b>I Wayan Suarta</b><small>Pemupukan selesai</small></div>
                <span className="status status-good"><i />Selesai</span>
              </div>
              <div className="mock-team-row">
                <span className="avatar avatar-sm avatar-gold">MR</span>
                <div><b>Ni Made Rini</b><small>Panen berlangsung</small></div>
                <span className="status status-warn"><i />Proses</span>
              </div>
            </div>
          </article>

          <article className="value-card value-report">
            <div className="value-head">
              <span className="value-icon"><FileBarChart2 size={18} /></span>
              <span className="chip">CSV · XLS</span>
            </div>
            <h3>Laporan siap dibagikan</h3>
            <p>Unduh rekap lahan, panen, dan aktivitas untuk rapat koperasi.</p>
            <div className="mock-file">
              <span className="mock-file-icon"><FileBarChart2 size={17} /></span>
              <div><b>Laporan_Oktober_2026</b><small>12 halaman · 248 KB</small></div>
              <span className="mock-file-badge"><Check size={13} /> Siap</span>
            </div>
            <div className="mock-progress-row"><span>Kelengkapan data</span><b>96%</b></div>
            <Progress value={96} />
          </article>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Sprout,
    number: '01',
    label: 'PETA & LAHAN',
    time: '08.00',
    title: 'Daftarkan lahan',
    text: 'Tandai petak, isi komoditas dan luas, lalu hubungkan dengan petani pengelola.',
    meta: 'Sekali di awal · ± 5 menit',
  },
  {
    icon: ClipboardCheck,
    number: '02',
    label: 'AKTIVITAS',
    time: '10.30',
    title: 'Catat kegiatan',
    text: 'Log pemupukan, penyiangan, dan panen langsung dari lapangan — cepat dan rapi.',
    meta: 'Setiap hari · dari ponsel',
  },
  {
    icon: TrendingUp,
    number: '03',
    label: 'KEPUTUSAN',
    time: '16.00',
    title: 'Ambil keputusan',
    text: 'Gunakan cuaca, kesehatan tanaman, dan prediksi panen untuk menyusun langkah berikutnya.',
    meta: 'Tiap minggu · bersama tim',
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="section how">
      <div className="container">
        <div className="how-head" data-reveal>
          <span className="eyebrow">CARA KERJA</span>
          <h2>Tiga langkah sederhana,<br /><em>hasil yang terukur.</em></h2>
          <p>Tanpa proses rumit. Mulai dari data yang sudah Anda miliki di lapangan, lalu biarkan papan informasi bekerja untuk tim.</p>
        </div>

        <div className="how-board" data-reveal>
          <div className="how-board-head">
            <span className="how-board-title"><span className="live-dot" /> Papan informasi · Subak Sari</span>
            <span className="how-board-date">Hari ini, 26 Oktober</span>
          </div>

          <div className="how-track">
            <span className="how-rail" aria-hidden="true" />
            {steps.map(({ icon: Icon, number, label, time, title, text, meta }, index) => (
              <article className={`how-step how-step-${index + 1}`} key={title}>
                <div className="how-card">
                  <div className="how-card-top">
                    <span className="how-label">{number} · {label}</span>
                    <span className="how-time">{time}</span>
                  </div>
                  <span className="how-icon"><Icon size={17} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="how-meta">{meta}</span>
                </div>
                <span className="how-dot" aria-hidden="true" />
              </article>
            ))}
          </div>

          <div className="how-board-foot">
            <span><Check size={14} /> Tercatat otomatis untuk seluruh tim</span>
            <a className="text-link" href="#fitur">Lihat semua fitur <ArrowRight size={15} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote: 'Dulu catatan pemupukan ada di buku dan grup chat. Sekarang semua anggota bisa melihat riwayat yang sama tanpa perlu bertanya ulang.',
    name: 'I Wayan Suarta',
    role: 'Ketua Kelompok Tani Subak Sari',
    initials: 'WS',
    tone: 'green',
  },
  {
    quote: 'Peta lahan dan reminder panen membantu kami menyiapkan tenaga kerja lebih awal. Diskusi kelompok juga jadi lebih terarah.',
    name: 'Ni Made Rini',
    role: 'Petani hortikultura · Mekar Tani',
    initials: 'MR',
    tone: 'gold',
  },
  {
    quote: 'Laporan bulanan yang dulu butuh dua hari kini bisa diunduh dalam hitungan menit. Datanya konsisten untuk rapat pengurus.',
    name: 'Agus Dharma',
    role: 'Administrator Koperasi Subak Sari',
    initials: 'AD',
    tone: 'blue',
  },
];

export function Testimonials() {
  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHead
          eyebrow="CERITA DARI LAPANGAN"
          title={<>Dipercaya oleh mereka yang<br /><em>bertani setiap hari.</em></>}
        />
        <div className="testimonial-grid" data-reveal>
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="testimonial-top">
                <span className="stars" aria-label="5 dari 5 bintang">
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill="currentColor" />)}
                </span>
                <Quote size={24} className="quote-mark" aria-hidden="true" />
              </div>
              <p>“{item.quote}”</p>
              <div className="testimonial-author">
                <span className={`avatar avatar-md avatar-${item.tone}`}>{item.initials}</span>
                <div><b>{item.name}</b><small>{item.role}</small></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta({ onEnter, onRegister, onSignup }) {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-card" data-reveal>
          <div className="cta-copy">
            <span className="eyebrow eyebrow-light"><Sparkles size={14} /> MULAI DARI LAHAN PERTAMA</span>
            <h2>Siap membuat catatan pertanian<br /><em>lebih teratur?</em></h2>
            <p>Buat akun untuk mengelola data organisasi Anda, atau coba dashboard demo tanpa akun.</p>
            <div className="cta-actions">
              <Button variant="cream" size="lg" onClick={onRegister ?? onEnter}>Buat akun organisasi <ArrowRight size={17} /></Button>
              <Button variant="dark-ghost" size="lg" onClick={onSignup}>Lihat demo <ArrowRight size={17} /></Button>
            </div>
          </div>
          <div className="cta-panel" aria-hidden="true">
            <div className="cta-panel-head"><LayoutDashboard size={15} /><span>Ringkasan hari ini</span><i /></div>
            <div className="cta-kpis">
              <div><small>Lahan</small><b>125 ha</b><span>+8,2%</span></div>
              <div><small>Petani</small><b>248</b><span>+12</span></div>
            </div>
            <div className="cta-lines">
              <span style={{ width: '82%' }} /><span style={{ width: '64%' }} /><span style={{ width: '91%' }} /><span style={{ width: '48%' }} />
            </div>
            <div className="cta-foot"><span className="live-dot" /> Data tersinkron 2 menit lalu</div>
          </div>
        </div>
      </div>
    </section>
  );
}
