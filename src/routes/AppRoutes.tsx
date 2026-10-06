import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, PageGuard } from '../layouts/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MembersPage } from '../pages/MembersPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { NewsAdminPage } from '../pages/NewsAdminPage';
import { EventsAdminPage } from '../pages/EventsAdminPage';
import { RolesAdminPage } from '../pages/RolesAdminPage';
import { ReportsAdminPage } from '../pages/ReportsAdminPage';
import { CmsAdminPage } from '../pages/CmsAdminPage';
import { UploadsMediaPage } from '../pages/UploadsMediaPage';
import { LeadershipAdminPage } from '../pages/LeadershipAdminPage';
import { AccountPage } from '../pages/AccountPage';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<AdminLayout />}>
      <Route index element={<PageGuard page="dashboard"><DashboardPage /></PageGuard>} />
      <Route path="members" element={<PageGuard page="members"><MembersPage /></PageGuard>} />
      <Route path="applications" element={<PageGuard page="applications"><ApplicationsPage /></PageGuard>} />
      <Route path="reports" element={<PageGuard page="reports"><ReportsAdminPage /></PageGuard>} />
      <Route path="roles" element={<PageGuard page="roles"><RolesAdminPage /></PageGuard>} />
      <Route path="account" element={<PageGuard page="account"><AccountPage /></PageGuard>} />
      <Route path="news" element={<PageGuard page="news"><NewsAdminPage /></PageGuard>} />
      <Route path="events" element={<PageGuard page="events"><EventsAdminPage /></PageGuard>} />
      <Route path="leadership-admin" element={<PageGuard page="leadership"><LeadershipAdminPage /></PageGuard>} />
      <Route path="cms" element={<PageGuard page="pages"><CmsAdminPage /></PageGuard>} />
      <Route path="uploads-media" element={<PageGuard page="media"><UploadsMediaPage /></PageGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
