import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { Check, X } from 'lucide-react';
import mapanMark from '../assets/brand/mapan-mark.png';

export function Brand({ inverse = false, compact = false }) {
  return (
    <span className={`brand ${inverse ? 'brand-inverse' : ''} ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark"><img src={mapanMark} alt="" /></span>
      <span className="brand-word">MAPAN<small>AGRI PLATFORM</small></span>
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

const statusTones = {
  Sehat: 'good', Rendah: 'good', Aktif: 'good', Selesai: 'good', Baik: 'good', Normal: 'good',
  Perhatian: 'warn', Sedang: 'warn', Undangan: 'warn', Menunggu: 'warn', Tertunda: 'warn',
  Tinggi: 'danger', Gagal: 'danger', Kritis: 'danger',
};

export function Status({ children, tone }) {
  const resolved = tone || statusTones[children] || 'neutral';
  return <span className={`status status-${resolved}`}><i />{children}</span>;
}

export function Avatar({ name = '', size = 'md', tone = 'green', src = '' }) {
  const className = `avatar avatar-${size} avatar-${tone}`;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  if (src) {
    return <span className={`${className} avatar-photo`}><img src={src} alt={name || 'Foto profil'} /></span>;
  }
  return <span className={className}>{initials || '?'}</span>;
}

export function Progress({ value = 0, tone = 'green', label }) {
  return (
    <span className={`progress progress-${tone}`} aria-label={label} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </span>
  );
}

export function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
    >
      <Switch.Thumb className="toggle-thumb" />
    </Switch.Root>
  );
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content className={`modal modal-${size}`}>
          <header className="modal-head">
            <div>
              {title ? (
                <Dialog.Title asChild><h3>{title}</h3></Dialog.Title>
              ) : (
                <Dialog.Title className="sr-only">Informasi</Dialog.Title>
              )}
              {description && <Dialog.Description asChild><p>{description}</p></Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-button" aria-label="Tutup"><X size={18} /></button>
            </Dialog.Close>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-foot">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={22} /></span>}
      <b>{title}</b>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <span className="toast-icon"><Check size={15} /></span>
          <div><b>{toast.title}</b>{toast.description && <small>{toast.description}</small>}</div>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Tutup notifikasi"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
