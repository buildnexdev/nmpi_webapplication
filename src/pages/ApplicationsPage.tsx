import React from 'react';
import { MembersPage } from './MembersPage';

export const ApplicationsPage: React.FC = () => (
  <MembersPage
    fixedStatus="PENDING"
    title="Pending approvals"
    subtitle="Members waiting for review. Open a member to approve or reject the application."
  />
);
