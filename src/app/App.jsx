import React, { Suspense, useEffect, useRef, useState } from 'react';
import LandingPage from '../features/landing/LandingPage';
import { DashboardDataProvider } from '../features/dashboard/data/DashboardDataContext';

// Halaman berat (dashboard & grafik) dimuat terpisah agar landing page cepat.
const AboutPage = React.lazy(() => import('../features/about/AboutPage'));
const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard'));
const AuthPage = React.lazy(() => import('../features/auth/AuthPage'));

const pageFallback = (
  <div
    role="status"
    style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'inherit' }}
  >
    Memuat…
  </div>
);

function viewForHash(hash) {
  if (hash.startsWith('undangan/')) return 'auth';
  if (hash === 'masuk' || hash === 'daftar') return 'auth';
  if (hash === 'dashboard') return 'dashboard';
  if (hash === 'top' || hash === 'fitur' || hash === 'faq' || hash === 'kontak') return 'landing';
  if (hash === 'tentang' || hash.startsWith('tentang-')) return 'about';
  return 'landing';
}

function getCurrentView() {
  return viewForHash(window.location.hash.replace(/^#/, ''));
}

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem('mapan-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function App() {
  const [view, setView] = useState(getCurrentView);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);
  const [theme, setTheme] = useState(getInitialTheme);
  const lastView = useRef(view);

  useEffect(() => {
    const syncViewWithUrl = () => {
      setView(getCurrentView());
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('popstate', syncViewWithUrl);
    window.addEventListener('hashchange', syncViewWithUrl);

    return () => {
      window.removeEventListener('popstate', syncViewWithUrl);
      window.removeEventListener('hashchange', syncViewWithUrl);
    };
  }, []);

  // On a first load with a deep link (e.g. #tentang-data or #fitur), the
  // browser cannot scroll to the target because React has not mounted it
  // yet. Scroll once after the first render.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash || hash === 'dashboard' || hash === 'top' || hash === 'tentang') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1713' : '#f4f1e5');
    try {
      window.localStorage.setItem('mapan-theme', theme);
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    if (lastView.current === view) return undefined;
    lastView.current = view;

    const hash = window.location.hash;

    if (!hash || view === 'dashboard' || hash === '#tentang' || hash === '#top') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash.slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }, 90);

    return () => window.clearTimeout(timer);
  }, [view]);

  const navigate = (hash = '') => {
    const nextView = viewForHash(hash);
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.pushState({ view: nextView }, '', url);
    setView(nextView);
    setCurrentHash(url.hash);
  };

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  const openDashboard = () => navigate('dashboard');
  const openLogin = () => navigate('masuk');
  const openDashboardEntry = () => navigate('masuk');
  const openDemo = () => navigate('dashboard');
  const openLanding = () => navigate('top');
  const openAbout = (hash = 'tentang') => navigate(hash);
  if (view === 'auth') {
    const hash = window.location.hash.replace(/^#/, '');
    const invitationToken = hash.startsWith('undangan/') ? hash.split('/').at(-1) : '';
    return (
      <Suspense fallback={pageFallback}>
        <AuthPage invitationToken={invitationToken} initialMode={hash === 'daftar' ? 'register' : 'login'} onSuccess={openDashboard} onBack={openLanding} />
      </Suspense>
    );
  }
  if (view === 'dashboard') {
    return (
      <Suspense fallback={pageFallback}>
        <DashboardDataProvider>
          <Dashboard
            onHome={openLanding}
            onLogin={openLogin}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </DashboardDataProvider>
      </Suspense>
    );
  }

  if (view === 'about') {
    return (
      <Suspense fallback={pageFallback}>
        <AboutPage
          onEnter={openLogin}
          onSignup={openDemo}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  return (
    <LandingPage
      onEnter={openLogin}
      onDashboardEntry={openDashboardEntry}
      onSignup={openDemo}
      onAbout={openAbout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
