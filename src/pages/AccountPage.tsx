import React, { useState } from 'react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { Card, Field, PageHeader } from '../components/ui';

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.new_password.length < 8) return setError('New password must be at least 8 characters.');
    if (form.new_password !== form.confirm) return setError('New passwords do not match.');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: form.current_password, new_password: form.new_password });
      toast('Password changed');
      setForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <PageHeader title="My account" />
      <div className="row g-4">
        <div className="col-lg-5">
          <Card title="Profile">
            <dl className="detail-list mb-0">
              {user.member?.full_name && (<><dt>Name</dt><dd>{user.member.full_name}</dd></>)}
              <dt>Email</dt><dd>{user.email || '—'}</dd>
              <dt>Phone</dt><dd>{user.phone_number ? `${user.country_code || ''} ${user.phone_number}` : '—'}</dd>
              <dt>Roles</dt>
              <dd className="d-flex flex-wrap gap-1">{user.role_names.map((r) => <span key={r} className="status-badge status-brand">{r}</span>)}</dd>
              {user.member?.member_id && (<><dt>Member ID</dt><dd><span className="code-pill">{user.member.member_id}</span></dd></>)}
            </dl>
          </Card>
        </div>
        <div className="col-lg-7">
          <Card title="Change password">
            <form onSubmit={submit} style={{ maxWidth: 420 }}>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <Field label="Current password" required>
                <input type="password" className="form-control" autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
              </Field>
              <Field label="New password" required hint="At least 8 characters.">
                <input type="password" className="form-control" autoComplete="new-password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required />
              </Field>
              <Field label="Confirm new password" required>
                <input type="password" className="form-control" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              </Field>
              <button className="btn btn-brand" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2"></span>}Update password
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};
