import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopbar } from '../components/AdminTopbar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminTopbar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
