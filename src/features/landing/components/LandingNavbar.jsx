import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { Brand, Button } from '../../../shared/ui';

const homeLinks = [
  { href: '#top', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#tentang', label: 'Tentang' },
  { href: '#faq', label: 'FAQ' },
];

const aboutLinks = [
  { href: '#top', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#tentang', label: 'Tentang' },
  { href: '#tentang-data', label: 'Data' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNavbar({
  onEnter,
  onRegister,
  onSignup,
  theme = 'light',
  onThemeToggle,
  page = 'home',
}) {
  const links = page === 'about' ? aboutLinks : homeLinks;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(page === 'about' ? '#tentang' : '#top');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);

      if (page === 'about') {
        const dataSection = document.querySelector('#tentang-data');
        const reachedData = dataSection
          ? dataSection.getBoundingClientRect().top <= window.innerHeight * 0.45
          : false;
        setActive(reachedData ? '#tentang-data' : '#tentang');
        return;
      }

      const root = document.documentElement;
      const nearBottom = root.scrollHeight > window.innerHeight + 160
        && window.innerHeight + window.scrollY >= root.scrollHeight - 8;
      if (nearBottom) setActive('#faq');
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [page]);

  useEffect(() => {
    if (page !== 'home') return undefined;

    const sections = homeLinks
      .map(({ href }) => document.querySelector(href))
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return undefined;

    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });

        const current = homeLinks.find(({ href }) => visible.has(href.slice(1)));
        if (current) setActive(current.href);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    if (isMobile) document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      if (isMobile) document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const enter = () => {
    setMenuOpen(false);
    onEnter?.();
  };

  return (
    <>
      <header className={`site-nav ${scrolled ? 'is-stuck' : ''} ${menuOpen ? 'is-open' : ''}`}>
        <div className="nav-inner">
          <a href="#top" className="nav-brand" aria-label="MAPAN, kembali ke atas">
            <Brand />
          </a>

          <nav className="nav-links" aria-label="Navigasi utama">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={active === link.href ? 'is-active' : undefined}
                aria-current={active === link.href ? 'location' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <Button variant="outline" onClick={enter} className="nav-login">Masuk</Button>
            <a href="#daftar" className="btn btn-primary btn-md nav-cta">Buat akun <ArrowUpRight size={15} /></a>
            <button
              type="button"
              className="nav-burger"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-drawer" role="dialog" aria-label="Menu navigasi">
          <button type="button" className="drawer-backdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />
          <div className="drawer-panel">
            <div className="drawer-head">
              <Brand />
              <button type="button" className="theme-button" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
            </div>
            <nav className="drawer-links">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={active === link.href ? 'is-active' : undefined}
                  aria-current={active === link.href ? 'location' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}<ArrowUpRight size={16} />
                </a>
              ))}
            </nav>
            <div className="drawer-settings">
              <button type="button" className="btn btn-outline btn-md" onClick={onThemeToggle}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              </button>
            </div>
            <div className="drawer-actions">
              <Button variant="outline" onClick={enter}>Masuk</Button>
              <a href="#daftar" className="btn btn-primary btn-md" onClick={() => setMenuOpen(false)}>Buat akun</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
