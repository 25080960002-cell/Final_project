import React from 'react';
import { ArrowRight, ArrowUpRight, Mail, MapPin, Moon, Sun } from 'lucide-react';
import { Brand } from '../../../shared/ui';

const footerGroups = [
  {
    title: 'Produk',
    links: [
      { label: 'Dashboard petani', href: '#fitur' },
      { label: 'Peta lahan', href: '#fitur' },
      { label: 'Cuaca & risiko', href: '#fitur' },
      { label: 'Scan tanaman', href: '#fitur' },
      { label: 'Komunitas petani', href: '#fitur' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang MAPAN', href: '#tentang' },
      { label: 'Cara kerja', href: '#cara-kerja' },
      { label: 'Data pertanian', href: '#tentang-data' },
      { label: 'Cerita lapangan', href: '#cerita' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Pusat bantuan', href: '#faq' },
      { label: 'Panduan pengguna', href: '#faq' },
      { label: 'Kontak', href: 'mailto:halo@mapan.id' },
      { label: 'Status layanan', href: '#kontak' },
    ],
  },
];

const dataSources = [
  {
    label: 'BPS · Produksi padi 2024',
    href: 'https://www.bps.go.id/id/pressrelease/2025/02/03/2414/pada-2024--luas-panen-padi-mencapai-sekitar-10-05-juta-hektare-dengan-produksi-padi-sebanyak-53-14-juta-ton-gabah-kering-giling--gkg--.html',
  },
  {
    label: 'BPS · Sensus Pertanian 2023',
    href: 'https://sensus.bps.go.id/topik/tabular/st2023/239/0/0',
  },
];

export default function LandingFooter({ onEnter, onSignup, theme = 'light', onThemeToggle }) {
  return (
    <footer className="footer" id="kontak">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand inverse />
            <p>
              Ruang kerja digital untuk petani, kelompok tani, dan koperasi dari
              berbagai komoditas dan wilayah di Indonesia.
            </p>
            <div className="footer-contact">
              <span><MapPin size={14} /> Tabanan, Bali · Indonesia</span>
              <a href="mailto:halo@mapan.id"><Mail size={14} /> halo@mapan.id</a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div className="footer-group" key={group.title}>
              <h4>{group.title}</h4>
              {group.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}

          <div className="footer-newsletter">
            <h4>Data & tampilan</h4>
            <p>Angka pada halaman data mengacu pada publikasi resmi BPS dan diperbarui berkala.</p>
            <div className="footer-sources">
              {dataSources.map((source) => (
                <a key={source.label} href={source.href} target="_blank" rel="noopener noreferrer">
                  {source.label}<ArrowUpRight size={12} />
                </a>
              ))}
            </div>
            <div className="footer-display">
              <button type="button" className="footer-theme" onClick={onThemeToggle}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              </button>
            </div>
            <button type="button" className="footer-enter" onClick={onEnter}>Buka Dashboard <ArrowRight size={14} /></button>
            <button type="button" className="footer-enter" onClick={onSignup}>Lihat demo <ArrowRight size={14} /></button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 MAPAN · Ruang kerja digital untuk pertanian Indonesia</span>
          <div>
            <a href="#kontak">Kebijakan privasi</a>
            <a href="#kontak">Ketentuan layanan</a>
            <a href="#top">Kembali ke atas ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
