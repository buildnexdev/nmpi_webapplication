import React from 'react';
import { NavLink } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <i className="bi bi-shield-lock-fill text-gold fs-3"></i>
        <div>
          <div className="fw-bold text-white leading-none small">ORGANIZATION PORTAL</div>
          <small className="text-gold" style={{ fontSize: '0.65rem' }}>ADMIN CONTROL PANEL</small>
        </div>
      </div>

      <ul className="sidebar-nav">
        <li className="sidebar-nav-item">
          <NavLink to="/" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`} end>
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/members" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-people-fill"></i> Member Directory
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/applications" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-card-checklist"></i> Applications Queue
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/news" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-newspaper"></i> News & Bulletins
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/events" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-calendar-event"></i> Community Events
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/roles" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-shield-check"></i> Roles & RBAC Matrix
          </NavLink>
        </li>
        <li className="sidebar-nav-item">
          <NavLink to="/reports" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-bar-chart-fill"></i> Analytics & Reports
          </NavLink>
        </li>
      </ul>

      <div className="p-3 border-top border-secondary text-center small text-muted">
        System Build v1.0.0
      </div>
    </aside>
  );
};
