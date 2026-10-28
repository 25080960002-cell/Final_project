import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sprout,
  ShoppingBasket,
  TreePine,
  UsersRound,
} from 'lucide-react';
import { Button, Modal } from '../../../shared/ui';
import { landingFeatures } from '../data/features';
import SectionHead from './SectionHead';
import panganGrains from '../assets/images/pangan-grains.jpg';
import sayurMarket from '../assets/images/sayur-market.jpg';
import plantationRows from '../assets/images/plantation-rows.jpg';
import produceMarket from '../assets/images/produce-market.jpg';
import harvestCommunity from '../assets/images/harvest-community.jpg';

const commodities = [
  {
    id: 'pangan',
    image: panganGrains,
    category: 'Tanaman pangan',
    title: 'Padi, jagung, umbi & kacang',
    short: 'Sumber pangan pokok dengan masa tanam dan kebutuhan air yang beragam.',
    points: ['Kalender tanam dan umur tanaman', 'Ketersediaan air dan pemupukan', 'Hama, penyakit, serta pengendaliannya', 'Hasil panen dan penyimpanan'],
  },
  {
    id: 'hortikultura',
    image: sayurMarket,
    category: 'Hortikultura',
    title: 'Sayur, buah & tanaman obat',
    short: 'Komoditas bernilai dengan siklus cepat dan mutu hasil yang perlu dijaga.',
    points: ['Jadwal semai hingga panen', 'Kebutuhan air, nutrisi, dan naungan', 'Pemantauan hama dan penyakit', 'Sortasi dan tujuan pemasaran'],
  },
  {
    id: 'perkebunan',
    image: plantationRows,
    category: 'Perkebunan',
    title: 'Kopi, kakao, teh & rempah',
    short: 'Tanaman tahunan yang dikelola lintas musim, dari kebun hingga panen berkala.',
    points: ['Umur, varietas, dan populasi tanaman', 'Pemangkasan serta tanaman penaung', 'Pembungaan dan perkiraan panen', 'Mutu hasil dan penanganan pascapanen'],
  },
  {
    id: 'pemasaran',
    image: produceMarket,
    category: 'Rantai pasok',
    title: 'Hasil panen siap dipasarkan',
    short: 'Catat hasil, sortasi, dan tujuan pemasaran agar keputusan harga lebih terukur.',
    points: ['Rekap hasil per petak dan komoditas', 'Kualitas dan jumlah siap jual', 'Riwayat pengiriman ke mitra', 'Bahan laporan untuk koperasi'],
  },
  {
    id: 'komunitas',
    image: harvestCommunity,
    category: 'Komunitas tani',
    title: 'Tumbuh bersama kelompok',
    short: 'Bagikan pengalaman lapangan dan pelajari praktik baik dari petani lain.',
    points: ['Diskusi budidaya dan hama', 'Catatan musim sebelumnya', 'Koordinasi tenaga kerja', 'Pendampingan penyuluh'],
  },
];

const COMMODITY_ICONS = [Sprout, Compass, TreePine, ShoppingBasket, UsersRound];

export default function LandingFeatures({ onEnter }) {
  const [selected, setSelected] = useState(0);
  const [commodity, setCommodity] = useState(null);
  const rowRef = useRef(null);
  const feature = landingFeatures[selected];

  const scrollRow = (direction) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector('.commodity-slide');
    const gap = 14;
    const step = (card?.getBoundingClientRect().width || 320) + gap;
    row.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section id="fitur" className="section features-home">
      <div className="container">
        <SectionHead
          eyebrow="FITUR MAPAN"
          title={<>Setiap komoditas punya ritme.<br /><em>MAPAN menyesuaikan.</em></>}
          description="Dirancang untuk tanaman pangan, hortikultura, perkebunan, dan komoditas lain, dengan pencatatan yang fleksibel."
          action={(
            <div className="commodity-nav" aria-label="Navigasi komoditas">
              <button type="button" className="commodity-nav-btn" onClick={() => scrollRow(-1)} aria-label="Komoditas sebelumnya">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="commodity-nav-btn" onClick={() => scrollRow(1)} aria-label="Komoditas berikutnya">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        />

        <div className="commodity-wrap" data-reveal>
          <div className="commodity-slider" ref={rowRef}>
            {commodities.map((item, index) => {
              const Icon = COMMODITY_ICONS[index];
              return (
                <article className={`commodity-slide commodity-${item.id}`} key={item.id}>
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="commodity-shade" aria-hidden="true" />
                  <div className="commodity-copy">
                    <span className="chip chip-glass"><Icon size={13} />{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.short}</p>
                    <button type="button" onClick={() => setCommodity(item)}>
                      Baca pengenalan <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="commodity-hint">
            <span>Geser untuk melihat komoditas lain</span>
            <span><ArrowLeft size={13} /> <ArrowRight size={13} /></span>
          </div>
        </div>

        <div className="explorer" data-reveal>
          <div className="explorer-head">
            <div>
              <span className="eyebrow">ALAT BANTU HARIAN</span>
              <h3>Pilih fitur, lihat cara kerjanya.</h3>
            </div>
            <span className="explorer-count">{String(selected + 1).padStart(2, '0')} / {String(landingFeatures.length).padStart(2, '0')}</span>
          </div>
          <div className="explorer-grid">
            <div className="explorer-list" role="tablist" aria-label="Daftar fitur MAPAN">
              {landingFeatures.map((item, index) => (
                <button
                  type="button"
                  key={item.number}
                  role="tab"
                  aria-selected={selected === index}
                  className={selected === index ? 'is-active' : ''}
                  onClick={() => setSelected(index)}
                >
                  <span className="explorer-num">{item.number}</span>
                  <span className="explorer-label"><b>{item.title}</b><small>{item.category}</small></span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>

            <article className="explorer-panel" key={feature.number}>
              <div className="explorer-photo">
                <img src={feature.image} alt={feature.imageAlt} />
                <span className="chip chip-glass">0{selected + 1} · {feature.category}</span>
              </div>
              <div className="explorer-copy">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="explorer-guide">
                  <span><BookOpen size={15} /> Panduan singkat</span>
                  <p>{feature.guide}</p>
                </div>
                <button type="button" className="text-link" onClick={onEnter}>Buka di dashboard <ArrowRight size={15} /></button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(commodity)}
        onClose={() => setCommodity(null)}
        title={commodity?.title}
        description={commodity?.category}
        size="md"
      >
        {commodity && (
          <div className="commodity-modal">
            <img src={commodity.image} alt={commodity.title} />
            <p>{commodity.short}</p>
            <h4>Hal yang perlu diperhatikan</h4>
            <ul>
              {commodity.points.map((point) => <li key={point}><Check size={14} />{point}</li>)}
            </ul>
            <p className="modal-note">Informasi ini adalah pengenalan umum. Praktik budidaya perlu disesuaikan dengan varietas, lokasi, dan arahan penyuluh setempat.</p>
            <Button onClick={() => { setCommodity(null); onEnter?.(); }}>Kelola di dashboard <ArrowRight size={16} /></Button>
          </div>
        )}
      </Modal>
    </section>
  );
}
