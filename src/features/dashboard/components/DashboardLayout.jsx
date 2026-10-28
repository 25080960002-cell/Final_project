import React from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Ellipsis,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { Avatar, Brand, IconButton, Status } from '../../../shared/ui';
import { nav } from '../data/dashboard';
import { useDashboardData } from '../data/DashboardDataContext';

function timeAgo(iso) {
  if (!iso) return 'baru saja';
  const seconds = Math.max(Math.round((Date.now() - new Date(iso).getTime()) / 1000), 0);
  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  return `${Math.floor(seconds / 3600)} jam lalu`;
}

export function Sidebar({ active, setActive, mobileOpen, setMobileOpen, onHome, onLogin, theme, onToggleTheme }) {
  const { summary, organization, status, source, fetchedAt, session, error } = useDashboardData();
  let group = '';

  const navItems = nav.map((item) =>
    item.id === 'lahan' && summary
      ? { ...item, badge: String(summary.plot_total) }
      : item,
  );

  const syncLabel = status === 'loading'
    ? 'Menyinkronkan data'
    : error
      ? 'Sinkronisasi bermasalah'
      : source === 'mock'
        ? 'Mode data contoh'
        : 'Data tersinkron';
  const syncDetail = status === 'loading'
    ? 'Mengambil dari MySQL…'
    : error
      ? 'Periksa koneksi lalu coba muat ulang'
      : source === 'mock'
        ? 'Dashboard demo tanpa sesi'
        : `Diperbarui ${timeAgo(fetchedAt)}`;

  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? 'is-open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <Brand inverse />
          <IconButton label="Tutup navigasi" className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </IconButton>
        </div>

        <div className="org-switch">
          <span className="org-mark">{organization?.name?.slice(0, 1) ?? 'M'}</span>
          <span className="org-copy"><b>{organization?.name ?? 'Koperasi Subak Sari'}</b><small>{source === 'mock' ? 'Data contoh' : 'Organisasi aktif'}</small></span>
        </div>

        <nav className="side-nav" aria-label="Navigasi dashboard">
          {navItems.map((item) => {
            const showGroup = item.group !== group;
            group = item.group;
            return (
              <React.Fragment key={item.id}>
                {showGroup && <span className="side-group">{item.group}</span>}
                <button
                  type="button"
                  className={`side-item ${active === item.id ? 'is-active' : ''}`}
                  onClick={() => { setActive(item.id); setMobileOpen(false); }}
                  aria-current={active === item.id ? 'page' : undefined}
                >
                  <item.icon size={17} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {item.badge && <small>{item.badge}</small>}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="side-bottom">
          <div className="sync-card">
            <span className="sync-icon"><Check size={13} /></span>
            <span><b>{syncLabel}</b><small>{syncDetail}</small></span>
          </div>
          {!session && <button type="button" className="side-login-button" onClick={onLogin}>Masuk ke data organisasi</button>}
          <button type="button" className="side-item side-utility" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === 'dark' ? 'Mode terang' : 'Mode gelap'}</span>
          </button>
          <button type="button" className="side-item side-utility" onClick={onHome}>
            <ArrowLeft size={17} />
            <span>Kembali ke halaman awal</span>
          </button>
          <div className="side-user">
            <Avatar name={session?.user?.name ?? 'Demo MAPAN'} size="sm" />
            <span><b>{session?.user?.name ?? 'Demo MAPAN'}</b><small>{session?.user?.role ?? 'Data contoh'}</small></span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({
  title,
  subtitle,
  onMenu,
  onSearch,
  noticesOpen,
  onNotices,
  profileOpen,
  onProfile,
  onHome,
  onLogin,
  onSettings,
    session,
    onLogout,
    hasNotices,
}) {
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <IconButton label="Buka navigasi" className="topbar-menu" onClick={onMenu}><Menu size={19} /></IconButton>
        <div>
          <span className="topbar-kicker">Ruang kerja <i>/</i> {title}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" className="search-trigger" onClick={onSearch}>
          <span className="search-trigger-icon"><Search size={15} /></span>
          <span>Cari menu atau aksi</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="topbar-notice-wrap">
          <IconButton
            label="Notifikasi"
            className={`topbar-icon ${noticesOpen ? 'is-active' : ''}`}
            onClick={onNotices}
            aria-expanded={noticesOpen}
          >
            <Bell size={18} />
            {hasNotices && <i className="notif-dot" />}
          </IconButton>
        </div>

        <button
          type="button"
          className={`profile-trigger ${profileOpen ? 'is-active' : ''}`}
          onClick={onProfile}
          aria-expanded={profileOpen}
        >
            <Avatar name={session?.user?.name ?? 'Demo MAPAN'} size="sm" />
            <span><b>{session?.user?.name ?? 'Demo MAPAN'}</b><small>{session?.user?.role ?? 'Data contoh'}</small></span>
          <ChevronDown size={14} />
        </button>
      </div>

      {profileOpen && (
        <div className="profile-popover">
          <div className="profile-popover-head">
              <Avatar name={session?.user?.name ?? 'Demo MAPAN'} size="md" />
              <span><b>{session?.user?.name ?? 'Demo MAPAN'}</b><small>{session?.user?.email ?? 'Mode data contoh'}</small></span>
            <Status>Aktif</Status>
          </div>
          <button type="button" onClick={onSettings}><Settings size={15} /> Pengaturan akun</button>
            {session
              ? <button type="button" onClick={onLogout}><LogOut size={15} /> Keluar dari dashboard</button>
              : <button type="button" onClick={onLogin}><LogOut size={15} /> Masuk ke data organisasi</button>}
            <button type="button" onClick={onHome}>Kembali ke halaman awal</button>
        </div>
      )}
    </header>
  );
}
