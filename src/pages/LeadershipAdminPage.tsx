import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, asArray, errorMessage, mediaUrl } from '../api/client';
import { ImagePicker } from '../components/ImagePicker';
import { useToast } from '../components/Toast';
import { Avatar, ConfirmDialog, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner, StatusBadge } from '../components/ui';

interface Leader {
  id: number;
  name: string;
  name_ta: string | null;
  designation: string;
  designation_ta: string | null;
  district: string | null;
  district_ta: string | null;
  qualification: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  display_order: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const EMPTY: Partial<Leader> = { name: '', name_ta: '', designation: 'District Secretary', designation_ta: 'மாவட்டச் செயலாளர்', district: '', district_ta: '', qualification: '', photo_url: null, phone: '', email: '', bio: '', display_order: 0, status: 'ACTIVE' };

export const LeadershipAdminPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Leader[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Leader> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Leader | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api.get('/leadership/admin/list').then((r) => setItems(asArray(r.data.data))).catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!items || !q) return items;
    return items.filter((l) => [l.name, l.name_ta, l.district, l.district_ta, l.designation].some((v) => v?.toLowerCase().includes(q)));
  }, [items, search]);

  const set = (key: keyof Leader, value: any) => setEditing((e) => ({ ...e!, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing.id) await api.put(`/leadership/${editing.id}`, editing);
      else await api.post('/leadership', editing);
      toast(editing.id ? 'Executive updated' : 'Executive added');
      setEditing(null);
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/leadership/${deleting.id}`);
      toast('Executive removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="District Executives"
        subtitle="Leaders shown on the website's Leadership page. Inactive entries are hidden from the public."
        actions={
          <button className="btn btn-brand" onClick={() => { setFormError(null); setEditing({ ...EMPTY, display_order: (items?.length || 0) + 1 }); }}>
            <i className="bi bi-plus-lg me-1"></i>Add executive
          </button>
        }
      />

      <div className="panel">
        <div className="filter-bar">
          <div className="input-group filter-search">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search by name or district" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !filtered ? (
          <Spinner />
        ) : (filtered || []).length === 0 ? (
          <EmptyState icon="bi-person-badge" title={search ? 'No matches' : 'No executives added yet'} />
        ) : (
          <div className="table-responsive">
            <table className="table table-modern table-hover mb-0">
              <thead>
                <tr><th style={{ width: 60 }}>#</th><th>Executive</th><th>District</th><th className="d-none d-md-table-cell">Contact</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {(filtered || []).map((l) => (
                  <tr key={l.id}>
                    <td className="text-muted">{l.display_order}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar src={mediaUrl(l.photo_url)} name={l.name} size={40} />
                        <div className="min-w-0">
                          <div className="fw-semibold">{l.name}{l.qualification && <span className="text-muted fw-normal">, {l.qualification}</span>}</div>
                          <div className="small text-muted">{l.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td>{l.district || '—'}<div className="small text-muted">{l.district_ta}</div></td>
                    <td className="d-none d-md-table-cell small">{l.phone || '—'}<div className="text-muted">{l.email}</div></td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-icon" title="Edit" aria-label="Edit" onClick={() => { setFormError(null); setEditing({ ...l }); }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-icon text-danger" title="Delete" aria-label="Delete" onClick={() => setDeleting(l)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit executive' : 'Add executive'}
          onClose={() => setEditing(null)}
          size="lg"
          footer={
            <>
              <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" form="leader-form" className="btn btn-brand" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2"></span>}Save
              </button>
            </>
          }
        >
          <form id="leader-form" onSubmit={save}>
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <Field label="Photo"><ImagePicker value={editing.photo_url || null} onChange={(v) => set('photo_url', v)} /></Field>
            <div className="row">
              <div className="col-md-6"><Field label="Name (English)" required><input className="form-control" value={editing.name || ''} onChange={(e) => set('name', e.target.value)} required /></Field></div>
              <div className="col-md-6"><Field label="பெயர் (Tamil)"><input className="form-control" value={editing.name_ta || ''} onChange={(e) => set('name_ta', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="Designation (English)" required><input className="form-control" value={editing.designation || ''} onChange={(e) => set('designation', e.target.value)} required /></Field></div>
              <div className="col-md-6"><Field label="பதவி (Tamil)"><input className="form-control" value={editing.designation_ta || ''} onChange={(e) => set('designation_ta', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="District (English)"><input className="form-control" value={editing.district || ''} onChange={(e) => set('district', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="மாவட்டம் (Tamil)"><input className="form-control" value={editing.district_ta || ''} onChange={(e) => set('district_ta', e.target.value)} /></Field></div>
              <div className="col-md-4"><Field label="Qualification"><input className="form-control" value={editing.qualification || ''} onChange={(e) => set('qualification', e.target.value)} /></Field></div>
              <div className="col-md-4"><Field label="Phone"><input className="form-control" value={editing.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field></div>
              <div className="col-md-4"><Field label="Email"><input type="email" className="form-control" value={editing.email || ''} onChange={(e) => set('email', e.target.value)} /></Field></div>
              <div className="col-12"><Field label="Short bio"><textarea className="form-control" rows={2} value={editing.bio || ''} onChange={(e) => set('bio', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="Display order" hint="Lower numbers appear first."><input type="number" className="form-control" value={editing.display_order ?? 0} onChange={(e) => set('display_order', Number(e.target.value))} /></Field></div>
              <div className="col-md-6">
                <Field label="Visibility">
                  <select className="form-select" value={editing.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="ACTIVE">Active (shown on website)</option>
                    <option value="INACTIVE">Inactive (hidden)</option>
                  </select>
                </Field>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Remove executive?"
          message={<>{deleting.name} will be removed permanently. To hide temporarily, set them to Inactive instead.</>}
          confirmLabel="Remove"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
};
