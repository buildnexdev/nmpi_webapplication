import React, { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, mediaUrl } from '../api/client';
import { ImagePicker } from '../components/ImagePicker';
import { useToast } from '../components/Toast';
import { ConfirmDialog, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner, StatusBadge, formatDate } from '../components/ui';

interface News {
  id: number;
  category: string;
  title: string;
  title_ta: string | null;
  summary: string;
  summary_ta: string | null;
  content: string;
  content_ta: string | null;
  cover_image: string | null;
  is_featured: number;
  status: 'DRAFT' | 'PUBLISHED';
  published_at: string;
}

const EMPTY: Partial<News> = { category: 'Announcement', title: '', title_ta: '', summary: '', summary_ta: '', content: '', content_ta: '', cover_image: null, is_featured: 0, status: 'PUBLISHED' };
const CATEGORIES = ['Announcement', 'Press Release', 'Event Report', 'Statement', 'Campaign'];

export const NewsAdminPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<News[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<Partial<News> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<News | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .get('/news/admin/list', { params: statusFilter ? { status: statusFilter } : {} })
      .then((r) => setItems(r.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [statusFilter]);
  useEffect(load, [load]);

  const set = (key: keyof News, value: any) => setEditing((e) => ({ ...e!, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing.id) await api.put(`/news/${editing.id}`, editing);
      else await api.post('/news', editing);
      toast(editing.id ? 'News article updated' : editing.status === 'DRAFT' ? 'Draft saved' : 'News article published');
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
      await api.delete(`/news/${deleting.id}`);
      toast('News article deleted');
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
        title="News"
        subtitle="Articles appear on the website and the member mobile app."
        actions={
          <button className="btn btn-brand" onClick={() => { setFormError(null); setEditing({ ...EMPTY }); }}>
            <i className="bi bi-plus-lg me-1"></i>New article
          </button>
        }
      />

      <div className="panel">
        <div className="filter-bar">
          <div className="btn-group" role="group" aria-label="Filter by status">
            {[['', 'All'], ['PUBLISHED', 'Published'], ['DRAFT', 'Drafts']].map(([v, l]) => (
              <button key={v} className={`btn btn-sm ${statusFilter === v ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={() => setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon="bi-newspaper" title="No articles yet" text="Publish your first announcement for members and the public." />
        ) : (
          <ul className="content-list">
            {items.map((n) => (
              <li key={n.id}>
                <div className="content-thumb">{n.cover_image ? <img src={mediaUrl(n.cover_image)} alt="" /> : <i className="bi bi-newspaper"></i>}</div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                    <StatusBadge status={n.status} />
                    {!!n.is_featured && <span className="status-badge status-brand"><i className="bi bi-star-fill me-1"></i>Featured</span>}
                    <span className="small text-muted">{n.category} · {formatDate(n.published_at)}</span>
                  </div>
                  <div className="fw-semibold text-truncate">{n.title}</div>
                  {n.title_ta && <div className="small text-muted text-truncate">{n.title_ta}</div>}
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-icon" title="Edit" aria-label="Edit" onClick={() => { setFormError(null); setEditing({ ...n }); }}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-icon text-danger" title="Delete" aria-label="Delete" onClick={() => setDeleting(n)}><i className="bi bi-trash"></i></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit article' : 'New article'}
          onClose={() => setEditing(null)}
          size="xl"
          footer={
            <>
              <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" form="news-form" className="btn btn-brand" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                {editing.id ? 'Save changes' : editing.status === 'DRAFT' ? 'Save draft' : 'Publish'}
              </button>
            </>
          }
        >
          <form id="news-form" onSubmit={save}>
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <div className="row">
              <div className="col-md-6">
                <Field label="Title (English)" required><input className="form-control" value={editing.title || ''} onChange={(e) => set('title', e.target.value)} required /></Field>
                <Field label="Summary (English)" required><textarea className="form-control" rows={2} value={editing.summary || ''} onChange={(e) => set('summary', e.target.value)} required /></Field>
                <Field label="Content (English)" required hint="Basic HTML such as <p>, <b>, <ul> is supported."><textarea className="form-control" rows={7} value={editing.content || ''} onChange={(e) => set('content', e.target.value)} required /></Field>
              </div>
              <div className="col-md-6">
                <Field label="தலைப்பு (Tamil title)"><input className="form-control" value={editing.title_ta || ''} onChange={(e) => set('title_ta', e.target.value)} /></Field>
                <Field label="சுருக்கம் (Tamil summary)"><textarea className="form-control" rows={2} value={editing.summary_ta || ''} onChange={(e) => set('summary_ta', e.target.value)} /></Field>
                <Field label="உள்ளடக்கம் (Tamil content)"><textarea className="form-control" rows={7} value={editing.content_ta || ''} onChange={(e) => set('content_ta', e.target.value)} /></Field>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6"><Field label="Cover image"><ImagePicker value={editing.cover_image || null} onChange={(v) => set('cover_image', v)} /></Field></div>
              <div className="col-md-3">
                <Field label="Category">
                  <select className="form-select" value={editing.category} onChange={(e) => set('category', e.target.value)}>
                    {Array.from(new Set([...CATEGORIES, editing.category || 'Announcement'])).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="news-featured" checked={!!editing.is_featured} onChange={(e) => set('is_featured', e.target.checked ? 1 : 0)} />
                  <label className="form-check-label" htmlFor="news-featured">Feature on home page</label>
                </div>
              </div>
              <div className="col-md-3">
                <Field label="Status">
                  <select className="form-select" value={editing.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft (hidden)</option>
                  </select>
                </Field>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete article?"
          message={<>“{deleting.title}” will be permanently removed from the website and app.</>}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
};
