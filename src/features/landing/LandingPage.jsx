import React, { useEffect, useRef } from 'react';
import {
  EcosystemStrip,
  HowItWorks,
  LandingCta,
  LandingFaq,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingNavbar,
  StorySection,
  Testimonials,
  ValueGrid,
} from './components';
import DataStrip from './components/DataStrip';
import useScrollReveal from '../../shared/hooks/useScrollReveal';

function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;

    let frame = 0;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
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

  return <div className="scroll-progress" ref={barRef} aria-hidden="true" />;
}

export default function LandingPage({ onEnter, onDashboardEntry, onSignup, onAbout, theme, onToggleTheme }) {
  useScrollReveal();

  return (
    <main className="landing">
      <ScrollProgress />
      <a href="#fitur" className="skip-link">Lewati ke konten utama</a>
      <LandingNavbar onEnter={onEnter} onSignup={onSignup} theme={theme} onThemeToggle={onToggleTheme} />
      <LandingHero onEnter={onDashboardEntry ?? onEnter} onSignup={onSignup} onAbout={onAbout} />
      <EcosystemStrip />
      <DataStrip onAbout={onAbout} />
      <ValueGrid />
      <HowItWorks />
      <LandingFeatures onEnter={onEnter} />
      <StorySection onAbout={onAbout} />
      <Testimonials />
      <LandingFaq />
      <LandingCta onEnter={onEnter} onSignup={onSignup} />
      <LandingFooter onEnter={onEnter} onSignup={onSignup} theme={theme} onThemeToggle={onToggleTheme} />
    </main>
  );
}
