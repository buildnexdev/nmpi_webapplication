import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { MembersPage } from '../pages/MembersPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { NewsAdminPage } from '../pages/NewsAdminPage';
import { EventsAdminPage } from '../pages/EventsAdminPage';
import { RolesAdminPage } from '../pages/RolesAdminPage';
import { ReportsAdminPage } from '../pages/ReportsAdminPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="news" element={<NewsAdminPage />} />
        <Route path="events" element={<EventsAdminPage />} />
        <Route path="roles" element={<RolesAdminPage />} />
        <Route path="reports" element={<ReportsAdminPage />} />
      </Route>
    </Routes>
  );
};
