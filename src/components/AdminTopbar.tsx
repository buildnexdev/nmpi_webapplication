import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { WEBSITE_URL, mediaUrl } from '../api/client';
import { Avatar } from './ui';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DISTRICT_ADMIN: 'District Coordinator',
  TALUK_ADMIN: 'Taluk Coordinator',
  UNIT_ADMIN: 'Unit Coordinator',
};

export const AdminTopbar: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const name = user?.member?.full_name || user?.email || '';
  const roleLabel = ROLE_LABEL[user?.roles.find((r) => ROLE_LABEL[r]) || ''] || 'Staff';

  return (
    <header className="admin-topbar">
      <button className="btn btn-icon d-lg-none" onClick={onMenu} aria-label="Open menu">
        <i className="bi bi-list"></i>
      </button>

      <div className="ms-auto d-flex align-items-center gap-2">
        <a className="btn btn-sm btn-light d-none d-sm-inline-flex align-items-center gap-1" href={WEBSITE_URL} target="_blank" rel="noreferrer">
          <i className="bi bi-box-arrow-up-right"></i> View website
        </a>

        <div className="position-relative" ref={menuRef}>
          <button className="user-chip" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
            <Avatar src={mediaUrl(user?.member?.profile_image)} name={name} size={34} />
            <span className="d-none d-md-flex flex-column text-start lh-sm">
              <span className="fw-semibold text-truncate" style={{ maxWidth: 180 }}>{name}</span>
              <span className="small text-muted">{roleLabel}</span>
            </span>
            <i className="bi bi-chevron-down small text-muted"></i>
          </button>
          {open && (
            <div className="dropdown-panel" role="menu">
              <div className="px-3 py-2 small text-muted border-bottom text-truncate">{user?.email}</div>
              <Link className="dropdown-panel-item" to="/account" onClick={() => setOpen(false)}>
                <i className="bi bi-person-gear"></i> My account
              </Link>
              <button className="dropdown-panel-item text-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right"></i> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
