import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { Card, ErrorState, PageHeader, Spinner } from '../components/ui';

interface RoleInfo {
  name: string;
  scope: string;
  access: Record<string, boolean>;
}

const CAPABILITIES: [string, string][] = [
  ['dashboard', 'Dashboard & reports'],
  ['members', 'View members & applications'],
  ['approve', 'Approve / reject / suspend'],
  ['idcard', 'Download member ID cards'],
  ['roles', 'Change member roles'],
  ['content', 'Manage news, events, pages & media'],
  ['admins', 'Grant Admin / Super Admin'],
];

const ROLE_MATRIX: RoleInfo[] = [
  { name: 'Super Admin', scope: 'Entire organisation', access: { dashboard: true, members: true, approve: true, idcard: true, roles: true, content: true, admins: true } },
  { name: 'Admin', scope: 'Entire organisation', access: { dashboard: true, members: true, approve: true, idcard: true, roles: true, content: true, admins: false } },
  { name: 'District Coordinator', scope: 'Members in their district', access: { dashboard: true, members: true, approve: true, idcard: true, roles: false, content: false, admins: false } },
  { name: 'Taluk Coordinator', scope: 'Members in their taluk / block', access: { dashboard: true, members: true, approve: true, idcard: true, roles: false, content: false, admins: false } },
  { name: 'Unit Coordinator', scope: 'Members in their village / unit', access: { dashboard: true, members: true, approve: true, idcard: true, roles: false, content: false, admins: false } },
  { name: 'Volunteer', scope: 'Own profile only', access: {} },
  { name: 'Member', scope: 'Own profile, digital ID & app', access: {} },
];

export const RolesAdminPage: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/dashboard/statistics')
      .then((r) => setCounts(Object.fromEntries(r.data.data.role_counts.map((x: any) => [x.role_name, x.count]))))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <>
      <PageHeader title="Roles & access" subtitle="What each role can do in this admin panel. To change someone's role, open them from the Members page." />

      {error && <ErrorState message={error} />}
      {!counts && !error ? (
        <Spinner />
      ) : (
        <Card flush>
          <div className="table-responsive">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th className="text-end">Members</th>
                  {CAPABILITIES.map(([key, label]) => <th key={key} className="text-center small" style={{ minWidth: 96 }}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROLE_MATRIX.map((role) => (
                  <tr key={role.name}>
                    <td>
                      <div className="fw-semibold">{role.name}</div>
                      <div className="small text-muted">{role.scope}</div>
                    </td>
                    <td className="text-end fw-semibold">{counts?.[role.name] ?? 0}</td>
                    {CAPABILITIES.map(([key]) => (
                      <td key={key} className="text-center">
                        {role.access[key] ? <i className="bi bi-check-circle-fill text-success" aria-label="Allowed"></i> : <i className="bi bi-dash text-muted" aria-label="Not allowed"></i>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="alert alert-light border mt-4 small mb-0">
        <i className="bi bi-info-circle me-2 text-brand"></i>
        People who register on the website always start as <strong>Member</strong>. Coordinators only see members who share their district, taluk or unit as recorded on the coordinator's own membership profile.
      </div>
    </>
  );
};
