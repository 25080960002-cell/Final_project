import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Avatar, Button, Modal } from '../../../shared/ui';
import { accountAvatarUrl, removeAvatar, updateProfile, uploadAvatar } from '../data/apiClient';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfileModal({ open, onClose, session, notify, onSaved }) {
  const user = session?.user;
  const [name, setName] = useState(user?.name ?? '');
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const objectUrlRef = useRef('');

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setPhoto(null);
      setRemovePhoto(false);
      setError('');
      setPreview(accountAvatarUrl(session));
    }
  }, [open, session]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const acceptFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format foto harus JPEG, PNG, atau WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Ukuran foto maksimal 5 MB.');
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPhoto(file);
    setRemovePhoto(false);
    setPreview(url);
    setError('');
  };

  const removeAvatarPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
    setPhoto(null);
    setRemovePhoto(true);
    setPreview('');
    setError('');
  };

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Nama lengkap wajib diisi (2–120 karakter).');
      return;
    }
    setBusy(true);
    try {
      let avatarChanged = false;
      if (photo) { await uploadAvatar(photo); avatarChanged = true; }
      else if (removePhoto) { await removeAvatar(); avatarChanged = true; }
      if (name.trim() !== user?.name) await updateProfile({ full_name: name.trim() });
      notify?.('Profil diperbarui', avatarChanged ? 'Foto dan data profil berhasil tersimpan.' : 'Perubahan profil berhasil tersimpan.');
      onSaved?.();
      onClose?.();
    } catch (cause) {
      setError(cause.message || 'Perubahan profil belum tersimpan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ubah profil"
      description="Perubahan berlaku untuk seluruh organisasi tempat Anda bergabung."
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} type="button" disabled={busy}>Batal</Button>
          <Button type="submit" form="profile-edit-form" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</Button>
        </>
      )}
    >
      <form className="profile-form" id="profile-edit-form" onSubmit={save}>
        <div className="profile-avatar-editor">
          <span className="profile-avatar-preview">
            <Avatar name={name || user?.name || 'Anggota'} size="xl" src={preview && !removePhoto ? preview : ''} />
          </span>
          <div className="profile-avatar-actions">
            <button type="button" className="photo-change" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Camera size={14} /> Ganti foto
            </button>
            {(preview || photo) && !removePhoto && (
              <button type="button" className="photo-change is-danger" disabled={busy} onClick={removeAvatarPreview}>
                <Trash2 size={14} /> Hapus foto
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Pilih foto profil"
              tabIndex={-1}
              onChange={(event) => { acceptFile(event.target.files?.[0]); event.target.value = ''; }}
            />
            <small>JPEG, PNG, atau WEBP · maks. 5 MB</small>
          </div>
        </div>
        <label className="auth-field">Nama lengkap
          <input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="auth-field">Email
          <input type="email" value={user?.email ?? ''} readOnly aria-readonly="true" />
          <small>Email tidak dapat diubah di sini.</small>
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
