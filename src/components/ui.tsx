import React, { cloneElement, isValidElement, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const modalStack: object[] = [];

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

export const Card: React.FC<{ title?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode; flush?: boolean }> = ({
  title,
  actions,
  className = '',
  children,
  flush,
}) => (
  <section className={`panel ${className}`}>
    {(title || actions) && (
      <header className="panel-header">
        <h2 className="panel-title">{title}</h2>
        {actions}
      </header>
    )}
    <div className={flush ? '' : 'panel-body'}>{children}</div>
  </section>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="state-box">
    <div className="spinner-border text-brand" role="status"></div>
    <span>{label}</span>
  </div>
);

export const EmptyState: React.FC<{ icon?: string; title: string; text?: string; action?: React.ReactNode }> = ({ icon = 'bi-inbox', title, text, action }) => (
  <div className="state-box">
    <i className={`bi ${icon} state-icon`}></i>
    <strong>{title}</strong>
    {text && <span className="text-muted small">{text}</span>}
    {action}
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="state-box text-danger">
    <i className="bi bi-exclamation-triangle state-icon"></i>
    <span>{message}</span>
    {onRetry && (
      <button className="btn btn-sm btn-outline-secondary" onClick={onRetry}>
        <i className="bi bi-arrow-clockwise me-1"></i>Try again
      </button>
    )}
  </div>
);

const STATUS_CLASS: Record<string, string> = {
  APPROVED: 'success',
  ACTIVE: 'success',
  PUBLISHED: 'success',
  UPCOMING: 'info',
  ONGOING: 'brand',
  PENDING: 'warning',
  DRAFT: 'warning',
  COMPLETED: 'muted',
  INACTIVE: 'muted',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
  CANCELLED: 'danger',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`status-badge status-${STATUS_CLASS[status] || 'muted'}`}>{status}</span>
);

export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
}> = ({ title, onClose, children, footer, size }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const entry = {};
    modalStack.push(entry);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === entry) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      modalStack.splice(modalStack.indexOf(entry), 1);
      if (modalStack.length === 0) document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-panel ${size ? `modal-panel-${size}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-panel-header">
          <h3>{title}</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </header>
        <div className="modal-panel-body">{children}</div>
        {footer && <footer className="modal-panel-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};

export const ConfirmDialog: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }) => (
  <Modal
    title={title}
    onClose={onCancel}
    size="sm"
    footer={
      <>
        <button className="btn btn-light" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-brand'}`} onClick={onConfirm} disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2"></span>}
          {confirmLabel}
        </button>
      </>
    }
  >
    <div className="text-secondary">{message}</div>
  </Modal>
);

export const Pagination: React.FC<{ page: number; pageSize: number; total: number; onChange: (page: number) => void }> = ({
  page,
  pageSize,
  total,
  onChange,
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination-bar">
      <span className="text-muted small">
        Showing {from}–{to} of {total}
      </span>
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <i className="bi bi-chevron-left"></i>
        </button>
        <span className="btn btn-outline-secondary disabled">
          {page} / {pages}
        </span>
        <button className="btn btn-outline-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  required,
  hint,
  children,
  className = '',
}) => {
  const autoId = useId();
  const child = isValidElement<{ id?: string }>(children) ? children : null;
  const controlId = child ? child.props.id || autoId : undefined;
  return (
    <div className={`mb-3 ${className}`}>
      <label className="form-label" htmlFor={controlId}>
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      {child ? cloneElement(child, { id: controlId }) : children}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
};

export const Avatar: React.FC<{ src?: string; name: string; size?: number }> = ({ src, name, size = 36 }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return src ? (
    <img src={src} alt={name} className="avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials || '?'}
    </span>
  );
};

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
}
