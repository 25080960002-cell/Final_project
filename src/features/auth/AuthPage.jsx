import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Brand, Button } from '../../shared/ui';
import { acceptInvitation, fetchInvitationInfo, fetchSession, login } from '../dashboard/data/apiClient';
import riceTerraces from '../landing/assets/images/rice-terraces.jpg';

export default function AuthPage({ invitationToken = '', initialMode = 'login', onSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [invitationAccepted, setInvitationAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!invitationToken) {
      fetchSession(controller.signal).then((session) => {
        if (session) onSuccess?.();
      }).catch(() => {});
      return () => controller.abort();
    }
    fetchInvitationInfo(invitationToken, controller.signal)
      .then((details) => {
        setInvitation(details);
        setName(details.invitee_name ?? '');
        setEmail(details.email ?? '');
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setError(cause.message);
      });
    return () => controller.abort();
  }, [invitationToken]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email, password });
      onSuccess?.();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  const submitInvitation = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi belum sama.');
      return;
    }
    setBusy(true);
    try {
      const result = await acceptInvitation({ token: invitationToken, name, password });
      setInvitationAccepted(true);
      if (result.pending_approval) {
        setMessage('Undangan diterima. Akun menunggu persetujuan administrator organisasi.');
        setPassword('');
        setConfirmPassword('');
      } else {
        try {
          await login({ email: invitation.email, password, organization_id: invitation.organization_id });
          onSuccess?.();
          return;
        } catch (cause) {
          setMessage('Undangan berhasil diterima. Masuk ke organisasi belum selesai, silakan coba lagi.');
          setError(cause.message);
        }
      }
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  const acceptingInvitation = Boolean(invitationToken);
  const registering = initialMode === 'register' && !acceptingInvitation;

  return (
    <main className="auth-page">
      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-bg" style={{ backgroundImage: `url(${riceTerraces})` }} />
        <div className="auth-visual-inner">
          <Brand inverse />
          <div className="auth-visual-copy">
            <span className="eyebrow eyebrow-light">PLATFORM PERTANIAN ORGANISASI</span>
            <h2>Kelola lahan dengan <em>tenang</em> dan terukur.</h2>
            <p>Satu ruang kerja untuk data lahan, siklus tanam, prediksi panen, dan komunitas koperasi Anda.</p>
          </div>
          <div className="auth-visual-card">
            <div className="auth-visual-card-head">Papan info MAPAN<i /></div>
            <div className="auth-visual-kpis">
              <div><small>Petak lahan</small><b>24</b><span>+2 bulan ini</span></div>
              <div><small>Anggota aktif</small><b>38</b><span>4 kelompok tani</span></div>
              <div><small>Kesehatan</small><b>92%</b><span>skor rata-rata</span></div>
            </div>
            <div className="auth-visual-lines"><span /><span /><span /></div>
          </div>
          <p className="auth-visual-foot">Data terenkripsi · Sesi aman · Hak akses per organisasi</p>
        </div>
      </aside>
      <div className="auth-shell">
        <header className="auth-topbar">
          <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Halaman awal</button>
          <Brand />
          <span className="auth-secure"><LockKeyhole size={14} /> Sesi aman MAPAN</span>
        </header>

      <section className="auth-card" aria-labelledby="auth-title">
        {acceptingInvitation ? (
          <>
            <span className="eyebrow">UNDANGAN ORGANISASI</span>
            <h1 id="auth-title">Bergabung ke MAPAN</h1>
            <p className="auth-description">Buat akun untuk mengakses data organisasi secara aman.</p>
            {invitation && <div className="auth-invitation"><b>{invitation.organization_name}</b><span>{invitation.email}</span></div>}
            {!invitation && !error && <p className="auth-status" role="status">Memeriksa tautan undangan…</p>}
            {!invitation && error && <p className="auth-error" role="alert">{error}</p>}
            {invitation && !invitationAccepted && (
              <form className="auth-form" onSubmit={submitInvitation}>
                <label className="auth-field">Nama lengkap<input autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label className="auth-field">Email undangan<input type="email" value={invitation.email} readOnly /></label>
                <label className="auth-field">Kata sandi<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} /><small>Minimal 12 karakter.</small></label>
                <label className="auth-field">Ulangi kata sandi<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
                <button type="button" className="auth-show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}{showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</button>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <Button type="submit" disabled={busy}>{busy ? 'Memproses…' : 'Terima undangan'} <ArrowRight size={16} /></Button>
              </form>
            )}
            {message && <p className="auth-success auth-invitation-result" role="status"><Check size={16} />{message}</p>}
            {invitationAccepted && error && <p className="auth-error" role="alert">{error}</p>}
            {invitationAccepted && !message.includes('menunggu persetujuan') && <Button variant="secondary" disabled={busy} onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await login({ email: invitation.email, password, organization_id: invitation.organization_id });
                onSuccess?.();
              } catch (cause) {
                setError(cause.message);
              } finally {
                setBusy(false);
              }
            }}>{busy ? 'Memeriksa akun…' : 'Masuk ke organisasi'} <ArrowRight size={16} /></Button>}
          </>
        ) : registering ? (
          <>
            <span className="eyebrow">AKUN ORGANISASI</span>
            <h1 id="auth-title">Buat akun MAPAN</h1>
            <p className="auth-description">Akun dibuat melalui undangan administrator agar data dan peran organisasi terhubung dengan benar.</p>
            <div className="auth-invite-help"><b>Belum menerima undangan?</b><span>Minta administrator organisasi mengundang email yang akan Anda gunakan. Tautan undangan akan membuka formulir pembuatan akun.</span></div>
            <Button variant="secondary" onClick={() => { window.location.hash = '#masuk'; }}>Saya sudah punya akun <ArrowRight size={16} /></Button>
          </>
        ) : (
          <>
            <span className="eyebrow">RUANG KERJA ORGANISASI</span>
            <h1 id="auth-title">Masuk ke MAPAN</h1>
            <p className="auth-description">Masuk untuk membuka data dashboard organisasi dan menyimpan perubahan.</p>
            <form className="auth-form" onSubmit={submitLogin}>
              <label className="auth-field">Email<input type="email" autoComplete="username" autoFocus required maxLength={160} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@organisasi.id" /></label>
              <label className="auth-field">Kata sandi<input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" /></label>
              <button type="button" className="auth-show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}{showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</button>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <Button type="submit" disabled={busy}>{busy ? 'Memeriksa akun…' : 'Masuk ke dashboard'} <ArrowRight size={16} /></Button>
            </form>
            <p className="auth-footnote">Belum punya akun? <button type="button" onClick={() => { window.location.hash = '#daftar'; }}>Lihat cara menerima undangan</button></p>
          </>
        )}
      </section>
      <footer className="auth-footer">Akses data dilindungi sesi aman dan hak akses organisasi.</footer>
      </div>
    </main>
  );
}
