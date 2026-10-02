import React from 'react';

export const AdminTopbar: React.FC = () => {
  return (
    <header className="admin-topbar">
      <div className="d-flex align-items-center gap-3">
        <i className="bi bi-list fs-4 text-muted cursor-pointer"></i>
        <h1 className="h5 fw-bold text-dark m-0">Organization Administration</h1>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="badge bg-gold text-maroon font-bold px-3 py-2">
          <i className="bi bi-shield-fill-check me-1"></i> SUPER_ADMIN SESSION
        </div>
        <div className="dropdown">
          <button className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 border" type="button" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle text-maroon fs-5"></i>
            <span>admin@orgplatform.org</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow">
            <li><a className="dropdown-item" href="http://localhost:3000" target="_blank" rel="noreferrer"><i className="bi bi-globe me-2"></i>View Public Website</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={() => alert('Logged out')}><i className="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
};
