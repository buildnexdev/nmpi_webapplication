import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopbar } from '../components/AdminTopbar';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '../components/ui';

export const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center"><Spinner label="Checking your session..." /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="admin-layout">
      <AdminSidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-backdrop d-lg-none" onClick={() => setMenuOpen(false)}></div>}
      <div className="admin-main">
        <AdminTopbar onMenu={() => setMenuOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const ContentAdminOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isContentAdmin } = useAuth();
  return isContentAdmin ? children : <Navigate to="/" replace />;
};
