import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CloudRain,
  Command,
  FileBarChart2,
  MapPinned,
  ScanLine,
  Search,
  ShieldAlert,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import { Sidebar, Topbar } from './components/DashboardLayout';
import { ContentPage, pageData } from './pages/DashboardPages';
import { nav } from './data/dashboard';
import { fetchRecords } from './data/apiClient';
import { useDashboardData } from './data/DashboardDataContext';
import { ToastStack } from '../../shared/ui';

const noticeIcons = { CloudRain, Sprout, ShieldAlert };

function DataStatus() {
  const { status, source, error } = useDashboardData();

  if (status === 'loading') {
    return <span><span className="live-dot" /> Menghubungkan ke database…</span>;
  }
  if (error) {
    return <span title={`API: ${error}`}><span className="live-dot" /> Sinkronisasi bermasalah · data terakhir</span>;
  }
  if (source === 'api') {
    return <span><span className="live-dot" /> Terhubung ke MySQL · lahan, anggota, kelompok</span>;
  }
  return (
    <span title={error ? `API tidak tersedia: ${error}` : undefined}>
      <span className="live-dot" /> {source === 'mock' ? 'Mode demo · data contoh' : 'API tidak tersambung'}
    </span>
  );
}
const quickActions = [
  { id: 'lahan', label: 'Tambah lahan baru', icon: MapPinned, hint: 'Manajemen lahan' },
  { id: 'scan', label: 'Mulai scan tanaman', icon: ScanLine, hint: 'Kesehatan tanaman' },
  { id: 'laporan', label: 'Buat laporan bulanan', icon: FileBarChart2, hint: 'Data & dokumentasi' },
];

export default function Dashboard({ onHome, onLogin, theme, onToggleTheme }) {
  const { status, source, error, session, signOut, refresh } = useDashboardData();
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [toasts, setToasts] = useState([]);
  const [readNotices, setReadNotices] = useState(false);
  const [notices, setNotices] = useState([]);

  const [title, subtitle] = pageData[page] || pageData.dashboard;

  const notify = (toastTitle, description) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, title: toastTitle, description }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const dismissToast = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  useEffect(() => {
    if (status !== 'ready' || source !== 'api') return undefined;
    let active = true;
    const loadNotices = () => fetchRecords('activity').then((records) => {
      if (active) setNotices(records.slice(0, 8).map((record) => ({
        id: String(record.id), title: record.title,
        meta: record.created_at ? new Date(record.created_at).toLocaleString('id-ID') : 'Aktivitas organisasi',
        tone: 'green', icon: 'Sprout',
      })));
    }).catch(() => {});
    loadNotices();
    const timer = window.setInterval(loadNotices, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [source, status]);

  useEffect(() => {
    const handleKey = (event) => {
      const isPaletteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isPaletteShortcut) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        setSearchText('');
        setNoticeOpen(false);
        setProfileOpen(false);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setNoticeOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const openPage = (id) => {
    setPage(id);
    setPaletteOpen(false);
    setProfileOpen(false);
    setNoticeOpen(false);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const query = searchText.trim().toLowerCase();
  const matchingNav = nav.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(query));
  const matchingActions = quickActions.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query));

  return (
    <div className="dash">
      <Sidebar
        active={page}
        setActive={openPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onHome={onHome}
        onLogin={onLogin}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div className="dash-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenu={() => setMobileOpen(true)}
          onSearch={() => { setPaletteOpen(true); setSearchText(''); }}
          noticesOpen={noticeOpen}
          onNotices={() => { setNoticeOpen((open) => !open); setProfileOpen(false); setReadNotices(true); }}
          profileOpen={profileOpen}
          onProfile={() => { setProfileOpen((open) => !open); setNoticeOpen(false); }}
          onHome={onHome}
          onLogin={onLogin}
          onSettings={() => openPage('pengaturan')}
          session={session}
          onLogout={async () => { await signOut(); onHome(); }}
          hasNotices={notices.length > 0}
        />

        <main className="dash-content">
          {(source !== 'api' || error) && (
            <section className="dashboard-demo-banner" role="status">
              <div><b>{status === 'loading' ? 'Menghubungkan ke data organisasi…' : error ? 'Sinkronisasi data terganggu' : 'Anda sedang melihat dashboard demo'}</b><span>{error ? `Data terakhir tetap tersedia. ${error}` : 'Data contoh tidak tersimpan. Masuk untuk membuka dan mengelola data organisasi Anda.'}</span></div>
              {session
                ? <button type="button" onClick={async () => { try { await refresh(); } catch (cause) { notify('Sinkronisasi gagal', cause.message); } }}>Coba sinkronkan lagi <ArrowRight size={15} /></button>
                : onLogin && <button type="button" onClick={onLogin}>Masuk ke data organisasi <ArrowRight size={15} /></button>}
            </section>
          )}
          <ContentPage page={page} setPage={openPage} notify={notify} />
        </main>

        <footer className="dash-foot">
          <DataStatus />
          <span>MAPAN v1.0 · dibuat untuk pertanian Indonesia</span>
        </footer>
      </div>

      {(noticeOpen || profileOpen) && (
        <button type="button" className="popover-scrim" aria-label="Tutup panel" onClick={() => { setNoticeOpen(false); setProfileOpen(false); }} />
      )}

      {noticeOpen && (
        <section className="notice-popover" aria-label="Notifikasi">
          <div className="notice-head">
            <div><b>Notifikasi</b><small>{readNotices ? 'Sudah dibaca' : `${notices.length} aktivitas`}</small></div>
            <button type="button" onClick={() => setNoticeOpen(false)} aria-label="Tutup notifikasi"><X size={16} /></button>
          </div>
          {notices.length === 0 && <p className="palette-empty">Belum ada catatan aktivitas.</p>}
          {notices.map((notice) => {
            const Icon = noticeIcons[notice.icon] || Sprout;
            return (
              <button type="button" className="notice-item" key={notice.id} onClick={() => openPage('aktivitas')}>
                <span className={`notice-icon tone-${notice.tone}`}><Icon size={16} /></span>
                <span><b>{notice.title}</b><small>{notice.meta}</small></span>
                <ArrowRight size={14} />
              </button>
            );
          })}
          <button type="button" className="notice-all" onClick={() => openPage('aktivitas')}>Lihat semua aktivitas <ArrowRight size={14} /></button>
        </section>
      )}

      {paletteOpen && (
        <div className="palette-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
            <div className="palette-input">
              <Search size={18} />
              <input
                autoFocus
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Cari halaman, lahan, atau aksi..."
              />
              <kbd>ESC</kbd>
            </div>
            <div className="palette-results">
              <span className="palette-label">MENU</span>
              {matchingNav.length === 0 && <p className="palette-empty">Menu tidak ditemukan.</p>}
              {matchingNav.map((item) => (
                <button type="button" className="palette-item" key={item.id} onClick={() => openPage(item.id)}>
                  <span className="palette-icon"><item.icon size={16} /></span>
                  <span><b>{item.label}</b><small>{item.group}</small></span>
                  <ArrowRight size={14} />
                </button>
              ))}
              {matchingActions.length > 0 && <span className="palette-label">AKSI CEPAT</span>}
              {matchingActions.map((item) => (
                <button type="button" className="palette-item" key={item.label} onClick={() => openPage(item.id)}>
                  <span className="palette-icon"><item.icon size={16} /></span>
                  <span><b>{item.label}</b><small>{item.hint}</small></span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <div className="palette-foot">
              <span><kbd>↵</kbd> buka</span>
              <span><Command size={12} /> K untuk membuka pencarian</span>
              <span><Sparkles size={12} /> Coba “laporan” atau “peta”</span>
            </div>
          </section>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
