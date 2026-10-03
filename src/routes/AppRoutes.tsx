import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, ContentAdminOnly } from '../layouts/AdminLayout';
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
      <Route index element={<DashboardPage />} />
      <Route path="members" element={<MembersPage />} />
      <Route path="applications" element={<ApplicationsPage />} />
      <Route path="reports" element={<ReportsAdminPage />} />
      <Route path="roles" element={<RolesAdminPage />} />
      <Route path="account" element={<AccountPage />} />
      <Route path="news" element={<ContentAdminOnly><NewsAdminPage /></ContentAdminOnly>} />
      <Route path="events" element={<ContentAdminOnly><EventsAdminPage /></ContentAdminOnly>} />
      <Route path="leadership-admin" element={<ContentAdminOnly><LeadershipAdminPage /></ContentAdminOnly>} />
      <Route path="cms" element={<ContentAdminOnly><CmsAdminPage /></ContentAdminOnly>} />
      <Route path="uploads-media" element={<ContentAdminOnly><UploadsMediaPage /></ContentAdminOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
