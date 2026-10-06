import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  page: string;
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [{ to: '/', icon: 'bi-grid-1x2-fill', label: 'Dashboard', page: 'dashboard' }],
  },
  {
    title: 'Membership',
    items: [
      { to: '/members', icon: 'bi-people-fill', label: 'Members', page: 'members' },
      { to: '/applications', icon: 'bi-hourglass-split', label: 'Pending Approvals', page: 'applications' },
      { to: '/reports', icon: 'bi-bar-chart-line-fill', label: 'Reports & Export', page: 'reports' },
    ],
  },
  {
    title: 'Website Content',
    items: [
      { to: '/news', icon: 'bi-newspaper', label: 'News', page: 'news' },
      { to: '/events', icon: 'bi-calendar-event-fill', label: 'Events', page: 'events' },
      { to: '/leadership-admin', icon: 'bi-person-badge-fill', label: 'District Executives', page: 'leadership' },
      { to: '/cms', icon: 'bi-file-earmark-richtext-fill', label: 'Pages', page: 'pages' },
      { to: '/uploads-media', icon: 'bi-images', label: 'Media Library', page: 'media' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/roles', icon: 'bi-shield-lock-fill', label: 'Roles & Access', page: 'roles' },
      { to: '/account', icon: 'bi-person-gear', label: 'My Account', page: 'account' },
    ],
  },
];

export const AdminSidebar: React.FC<{ open: boolean; onNavigate: () => void }> = ({ open, onNavigate }) => {
  const { canAccess } = useAuth();

  return (
    <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/logo.jpg" alt="NMPI emblem" />
        <div className="overflow-hidden">
          <div className="sidebar-brand-ta">நேதாஜி மக்கள் பாதுகாப்பு இயக்கம்</div>
          <div className="sidebar-brand-en">Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => canAccess(i.page));
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">NMPI Platform v2.0</div>
    </aside>
  );
};
