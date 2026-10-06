import React, { useEffect, useState } from 'react';
import { api, asArray, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { Card, ErrorState, PageHeader, Spinner } from '../components/ui';

interface PortalPage {
  key: string;
  label: string;
  section: string;
}

interface RoleRow {
  id: number;
  name: string;
  code: string;
  label: string;
  description: string | null;
  member_count: number;
  locked: boolean;
  access: Record<string, boolean>;
}

export const RolesAdminPage: React.FC = () => {
  const toast = useToast();
  const { isPortalAdmin } = useAuth();
  const [pages, setPages] = useState<PortalPage[]>([]);
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = () => {
    setError(null);
    api
      .get('/access/matrix')
      .then((r) => {
        setPages(asArray(r.data.data.pages));
        setRoles(asArray(r.data.data.roles));
        setDirty(false);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const toggle = (roleId: number, pageKey: string) => {
    if (!isPortalAdmin) return;
    setRoles((list) =>
      (list || []).map((role) => {
        if (role.id !== roleId || role.locked) return role;
        if (pageKey === 'account') return role;
        if (pageKey === 'roles') return role;
        return { ...role, access: { ...role.access, [pageKey]: !role.access[pageKey] } };
      })
    );
    setDirty(true);
  };

  const save = async () => {
    if (!roles) return;
    setSaving(true);
    try {
      const res = await api.put('/access/matrix', {
        items: roles.map((r) => ({ role_id: r.id, access: r.access })),
      });
      setPages(res.data.data.pages || pages);
      setRoles(res.data.data.roles || roles);
      setDirty(false);
      toast('Role page access saved');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Roles & access"
        subtitle="Choose which admin portal pages each role can open. Only Admin and Super Admin can change this."
        actions={
          isPortalAdmin ? (
            <button className="btn btn-brand" onClick={save} disabled={!dirty || saving || !roles}>
              {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
              Save access
            </button>
          ) : undefined
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}
      {!roles && !error ? (
        <Spinner />
      ) : roles ? (
        <Card flush>
          <div className="table-responsive">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th className="text-end">Members</th>
                  {pages.map((p) => (
                    <th key={p.key} className="text-center small" style={{ minWidth: 88 }}>{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="fw-semibold">{role.label || role.name}</div>
                      <div className="small text-muted">{role.description || role.name}{role.locked ? ' · locked' : ''}</div>
                    </td>
                    <td className="text-end fw-semibold">{role.member_count}</td>
                    {pages.map((p) => {
                      const on = Boolean(role.access[p.key]);
                      const lockedCell = role.locked || p.key === 'account' || p.key === 'roles' || !isPortalAdmin;
                      return (
                        <td key={p.key} className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={on}
                            disabled={lockedCell}
                            title={
                              p.key === 'roles'
                                ? 'Roles & Access is only for Admin and Super Admin'
                                : role.locked
                                  ? 'Super Admin always has full access'
                                  : p.label
                            }
                            onChange={() => toggle(role.id, p.key)}
                            aria-label={`${role.label} can open ${p.label}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <div className="alert alert-light border mt-4 small mb-0">
        <i className="bi bi-info-circle me-2 text-brand"></i>
        People who register on the website always start as <strong>Member</strong> and cannot open this admin portal.
        Super Admin always has every page. The Roles & Access page itself can only be used by Admin and Super Admin.
      </div>
    </>
  );
};
