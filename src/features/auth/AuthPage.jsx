import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Factory,
  Handshake,
  Leaf,
  LocateFixed,
  LockKeyhole,
  MapPinned,
  Sprout,
  UserRound,
  X,
} from 'lucide-react';
import { Brand, Button } from '../../shared/ui';
import { acceptInvitation, fetchInvitationInfo, fetchSession, login, register } from '../dashboard/data/apiClient';
import { passwordChecks, passwordStrength } from '../../shared/lib/password';
import { CITIES, isIndonesiaCoordinate } from '../../shared/lib/cities';
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
  const [org, setOrg] = useState({ name: '', type: 'koperasi', region: '', latitude: '', longitude: '', agree: false });

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

  const pickCity = (cityName) => {
    const city = CITIES.find((item) => item.name === cityName);
    if (!city) return;
    setOrg((current) => ({ ...current, region: city.name, latitude: String(city.latitude), longitude: String(city.longitude) }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Peramban ini tidak mendukung lokasi. Pilih kota dari daftar.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => setOrg((current) => ({
        ...current,
        latitude: position.coords.latitude.toFixed(5),
        longitude: position.coords.longitude.toFixed(5),
      })),
      () => setError('Lokasi tidak dapat dibaca. Pilih kota dari daftar atau isi koordinat manual.'),
      { timeout: 8000 },
    );
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');
    if (!passwordStrength(password, email).valid) { setError('Kata sandi belum memenuhi semua syarat.'); return; }
    if (password !== confirmPassword) { setError('Konfirmasi kata sandi belum sama.'); return; }
    const hasCoords = org.latitude !== '' || org.longitude !== '';
    const lat = Number(org.latitude);
    const lon = Number(org.longitude);
    if (hasCoords && !isIndonesiaCoordinate(lat, lon)) { setError('Koordinat harus berpasangan dan berada di wilayah Indonesia.'); return; }
    if (!org.agree) { setError('Centang persetujuan penyimpanan data untuk melanjutkan.'); return; }
    setBusy(true);
    try {
      await register({
        full_name: name, email, password,
        organization_name: org.name, organization_type: org.type, region_name: org.region,
        ...(hasCoords ? { latitude: lat, longitude: lon } : {}),
      });
      onSuccess?.();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  const acceptingInvitation = Boolean(invitationToken);
  const registering = initialMode === 'register' && !acceptingInvitation;
  // Form pendaftaran lebih panjang (data akun + organisasi), jadi kartunya dilebarkan.
  const wideCard = registering;

  const orgTypeOptions = [
    { value: 'koperasi', label: 'Koperasi', hint: 'Anggota balikan hasil', Icon: Handshake },
    { value: 'gapoktan', label: 'Gapoktan', hint: 'Kelompok tani gabungan', Icon: Sprout },
    { value: 'perusahaan_agribisnis', label: 'Agribisnis', hint: 'Perusahaan / CV / PT', Icon: Factory },
    { value: 'lainnya', label: 'Lainnya', hint: 'Perorangan / komunitas', Icon: Leaf },
  ];

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

      <section className={wideCard ? 'auth-card auth-card--wide' : 'auth-card'} aria-labelledby="auth-title">
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
            <h1 id="auth-title">Buat akun <em>MAPAN</em></h1>
            <p className="auth-description">Daftarkan koperasi, gapoktan, atau kelompok tani Anda. Anda otomatis menjadi administrator dan dapat mengundang anggota nanti.</p>
            <form className="auth-form" onSubmit={submitRegister}>
              <section className="auth-section" aria-labelledby="reg-step-1">
                <div className="auth-section-head">
                  <span className="auth-step"><UserRound size={15} /></span>
                  <div><b id="reg-step-1">Data akun Anda</b><small>Pemilik akun, otomatis administrator organisasi.</small></div>
                </div>
                <div className="auth-grid">
                  <label className="auth-field">Nama lengkap<input autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Budi Santoso" /></label>
                  <label className="auth-field">Email<input type="email" autoComplete="username" required maxLength={160} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@organisasi.id" /></label>
                </div>
                <label className="auth-field">Kata sandi<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={10} maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                {password && (
                  <ul className="auth-checks" aria-label="Syarat kata sandi">
                    {passwordChecks(password, email).map((check) => (
                      <li key={check.id} className={check.ok ? 'is-ok' : ''}>{check.ok ? <Check size={13} /> : <X size={13} />}{check.label}</li>
                    ))}
                    <li className={`auth-strength strength-${passwordStrength(password, email).score}`}>Kekuatan: <b>{passwordStrength(password, email).label}</b></li>
                  </ul>
                )}
                <div className="auth-grid">
                  <label className="auth-field">Ulangi kata sandi<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
                  <span className="auth-field-toggle"><button type="button" className="auth-show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}{showPassword ? 'Sembunyikan' : 'Tampilkan'}</button><small>Kata sandi tersimpan terenkripsi.</small></span>
                </div>
              </section>

              <section className="auth-section" aria-labelledby="reg-step-2">
                <div className="auth-section-head">
                  <span className="auth-step auth-step-org"><Building2 size={15} /></span>
                  <div><b id="reg-step-2">Organisasi Anda</b><small>Pilih jenis organisasi yang paling sesuai.</small></div>
                </div>
                <div className="auth-org-types" role="radiogroup" aria-label="Jenis organisasi">
                  {orgTypeOptions.map(({ value, label, hint, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={org.type === value}
                      className={`auth-org-type ${org.type === value ? 'is-selected' : ''}`}
                      onClick={() => setOrg({ ...org, type: value })}
                    >
                      <Icon size={17} />
                      <span><b>{label}</b><small>{hint}</small></span>
                    </button>
                  ))}
                </div>
                <label className="auth-field">Nama organisasi / kelompok tani<input required minLength={3} maxLength={120} value={org.name} onChange={(event) => setOrg({ ...org, name: event.target.value })} placeholder="Contoh: Gapoktan Tani Makmur" /></label>
              </section>

              <section className="auth-section" aria-labelledby="reg-step-3">
                <div className="auth-section-head">
                  <span className="auth-step auth-step-map"><MapPinned size={15} /></span>
                  <div><b id="reg-step-3">Wilayah lahan</b><small>Dipakai untuk prakiraan cuaca di dashboard.</small></div>
                </div>
                <div className="auth-grid">
                  <label className="auth-field">Kota/kabupaten terdekat
                    <select value={CITIES.some((c) => c.name === org.region) ? org.region : ''} onChange={(event) => pickCity(event.target.value)}>
                      <option value="">Pilih dari daftar (opsional)</option>
                      {CITIES.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
                    </select>
                  </label>
                  <label className="auth-field">Nama wilayah<input required minLength={2} maxLength={120} value={org.region} onChange={(event) => setOrg({ ...org, region: event.target.value })} placeholder="Kabupaten/Kota lahan berada" /></label>
                </div>
                <div className="auth-coords">
                  <label className="auth-field">Latitude<input inputMode="decimal" value={org.latitude} onChange={(event) => setOrg({ ...org, latitude: event.target.value })} placeholder="-6.9667" /></label>
                  <label className="auth-field">Longitude<input inputMode="decimal" value={org.longitude} onChange={(event) => setOrg({ ...org, longitude: event.target.value })} placeholder="110.4167" /></label>
                </div>
                <button type="button" className="auth-locate" onClick={useMyLocation}><LocateFixed size={15} /> Gunakan lokasi saya sekarang</button>
                <small className="auth-coords-hint">Opsional — bisa dikosongkan dan diisi nanti lewat dashboard.</small>
              </section>

              <label className="auth-agree auth-agree-card">
                <input type="checkbox" checked={org.agree} onChange={(event) => setOrg({ ...org, agree: event.target.checked })} />
                <span>Saya menyetujui data yang saya masukkan disimpan untuk pengelolaan organisasi di MAPAN.</span>
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <Button type="submit" disabled={busy}>{busy ? 'Membuat akun…' : 'Buat akun & masuk'} <ArrowRight size={16} /></Button>
            </form>
            <p className="auth-footnote">Sudah punya akun? <button type="button" onClick={() => { window.location.hash = '#masuk'; }}>Masuk</button>. Diundang administrator? Buka tautan undangan dari email/pesan Anda.</p>
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
            <p className="auth-footnote">Belum punya akun? <button type="button" onClick={() => { window.location.hash = '#daftar'; }}>Daftarkan organisasi Anda</button>. Diundang administrator? Buka tautan undangan Anda.</p>
          </>
        )}
      </section>
      <footer className="auth-footer">Akses data dilindungi sesi aman dan hak akses organisasi.</footer>
      </div>
    </main>
  );
}
