import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sprout } from 'lucide-react';
import { Button } from '../../../shared/ui';
import heroPhoto from '../assets/images/farmland-sunset.jpg';

const heroStats = [
  { value: 125, suffix: ' ha', label: 'Luas lahan terkelola' },
  { value: 248, suffix: '', label: 'Petani dan pengelola' },
  { value: 94, suffix: '%', label: 'Petak dalam kondisi sehat' },
];

function CountUp({ value, suffix = '', duration = 1100 }) {
  const nodeRef = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || !('IntersectionObserver' in window)
    ) {
      setCurrent(value);
      return undefined;
    }

    let frame = 0;
    let started = false;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setCurrent(Math.round(value * eased));
        if (t < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={nodeRef}>{current}{suffix}</span>;
}

export default function LandingHero({ onEnter, onRegister, onSignup, onAbout }) {
  const heroRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const bg = bgRef.current;
    if (!hero || !bg) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      bg.style.transform = `translate3d(0, ${(progress * 34).toFixed(2)}px, 0)`;
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="top" className="hero hero-photo" ref={heroRef}>
      <img className="hero-bg" ref={bgRef} src={heroPhoto} alt="" aria-hidden="true" />
      <span className="hero-veil" aria-hidden="true" />

      <div className="container hero-inner">
        <span className="hero-pill" data-reveal style={{ '--reveal-delay': '60ms' }}>
          <Sprout size={13} /> Ruang kerja digital untuk pertanian
        </span>
        <h1 data-reveal style={{ '--reveal-delay': '120ms' }}>
          Pertanian yang lebih terarah,
          <br />
          <em>dari lahan hingga panen.</em>
        </h1>
        <p className="hero-lead" data-reveal style={{ '--reveal-delay': '190ms' }}>
          Catat lahan dan kegiatan budidaya, pantau cuaca, lalu rencanakan panen
          bersama tim dalam satu ruang kerja yang rapi dan mudah dipakai.
        </p>
        <div className="hero-actions" data-reveal style={{ '--reveal-delay': '260ms' }}>
          <a href="#daftar" className="btn btn-primary btn-lg">Buat akun organisasi <ArrowRight size={17} /></a>
          <Button variant="dark-ghost" size="lg" onClick={onSignup}>Lihat demo dashboard <ArrowRight size={17} /></Button>
        </div>
        <span className="hero-note" data-reveal style={{ '--reveal-delay': '330ms' }}>
          <span className="live-dot" /> Sudah punya akun? <button type="button" className="text-link" onClick={onEnter}>Masuk</button> · Atau jelajahi dashboard demo tanpa akun.
        </span>
      </div>

      <div className="container hero-stats">
        {heroStats.map((stat) => (
          <div key={stat.label}>
            <b>
              <span aria-hidden="true"><CountUp value={stat.value} suffix={stat.suffix} /></span>
              <span className="sr-only">{stat.value}{stat.suffix}</span>
            </b>
            <span>{stat.label}</span>
          </div>
        ))}
        <div className="hero-stats-note"><span className="live-dot" /> Diperbarui hari ini</div>
      </div>
    </section>
  );
}
