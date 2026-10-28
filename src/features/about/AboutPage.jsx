import React from 'react';
import { LandingCta, LandingFooter, LandingNavbar } from '../landing/components';
import useScrollReveal from '../../shared/hooks/useScrollReveal';
import AboutHero from './components/AboutHero';
import AboutStory from './components/AboutStory';
import DataSection from './components/DataSection';

export default function AboutPage({ onEnter, onSignup, theme, onToggleTheme }) {
  useScrollReveal();

  return (
    <main className="landing about-page">
      <a href="#tentang-data" className="skip-link">Lewati ke data pertanian</a>
      <LandingNavbar
        onEnter={onEnter}
        onSignup={onSignup}
        theme={theme}
        onThemeToggle={onToggleTheme}
        page="about"
      />
      <AboutHero onEnter={onEnter} />
      <AboutStory />
      <DataSection />
      <LandingCta onEnter={onEnter} onSignup={onSignup} />
      <LandingFooter onEnter={onEnter} onSignup={onSignup} theme={theme} onThemeToggle={onToggleTheme} />
    </main>
  );
}
