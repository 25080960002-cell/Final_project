// Smoke test render: memuat tiap halaman lewat Vite SSR dan merendernya ke HTML.
// Menangkap error runtime saat render (import hilang, properti undefined, dsb.) tanpa browser.
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Shim minimal lingkungan browser (modul membaca window saat dimuat).
const store = new Map();
globalThis.window = globalThis;
globalThis.location = { hostname: 'localhost', origin: 'http://localhost:5173', hash: '', href: 'http://localhost:5173/' };
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.document = { documentElement: { dataset: {}, style: {} }, querySelector: () => null, getElementById: () => null, addEventListener() {}, removeEventListener() {} };

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const load = (path) => vite.ssrLoadModule(path);
const results = [];
const check = (name, fn) => {
  try {
    const html = fn();
    if (typeof html !== 'string' || html.length < 50) throw new Error('HTML kosong');
    results.push({ name, ok: true, size: html.length });
  } catch (error) {
    results.push({ name, ok: false, error: error.message.split('\n')[0] });
  }
};
const noop = () => {};

try {
  const { default: LandingPage } = await load('/src/features/landing/LandingPage.jsx');
  const { default: AuthPage } = await load('/src/features/auth/AuthPage.jsx');
  const { default: Dashboard } = await load('/src/features/dashboard/Dashboard.jsx');
  const { default: AboutPage } = await load('/src/features/about/AboutPage.jsx');
  const { DashboardDataProvider } = await load('/src/features/dashboard/data/DashboardDataContext.jsx');
  const { ContentPage, pageData } = await load('/src/features/dashboard/pages/DashboardPages.jsx');

  check('Landing', () => renderToString(React.createElement(LandingPage, { onEnter: noop, onRegister: noop, onSignup: noop, onAbout: noop, theme: 'light', onToggleTheme: noop })));
  check('Tentang', () => renderToString(React.createElement(AboutPage, { onEnter: noop, onSignup: noop, theme: 'light', onToggleTheme: noop })));
  check('Auth: masuk', () => renderToString(React.createElement(AuthPage, { initialMode: 'login', onSuccess: noop, onBack: noop })));
  check('Auth: daftar (form pendaftaran)', () => {
    const html = renderToString(React.createElement(AuthPage, { initialMode: 'register', onSuccess: noop, onBack: noop }));
    if (!html.includes('Buat akun &amp; masuk')) throw new Error('form pendaftaran tidak muncul');
    return html;
  });
  check('Auth: undangan', () => renderToString(React.createElement(AuthPage, { invitationToken: 'a'.repeat(64), onSuccess: noop, onBack: noop })));

  const withProvider = (demo, child) => React.createElement(DashboardDataProvider, { demo }, child);
  for (const demo of [true, false]) {
    const mode = demo ? 'demo' : 'asli';
    check(`Dashboard shell (${mode})`, () => renderToString(withProvider(demo,
      React.createElement(Dashboard, { demo, onHome: noop, onLogin: noop, onRegister: noop, theme: 'light', onToggleTheme: noop }))));
    for (const page of Object.keys(pageData)) {
      check(`Halaman ${page} (${mode})`, () => renderToString(withProvider(demo,
        React.createElement(ContentPage, { page, setPage: noop, notify: noop }))));
    }
  }
} catch (error) {
  results.push({ name: 'Pemuatan modul', ok: false, error: error.message.split('\n')[0] });
}

await vite.close();
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK    ' : 'GAGAL '} ${r.name}${r.ok ? '' : ` -> ${r.error}`}`);
console.log(`\nSmoke render: ${results.length - failed.length}/${results.length} lolos`);
process.exit(failed.length ? 1 : 0);
