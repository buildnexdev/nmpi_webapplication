import React, { useCallback, useEffect, useState } from 'react';
import { api, asArray, errorMessage, mediaUrl } from '../api/client';
import { ImagePicker } from '../components/ImagePicker';
import { useToast } from '../components/Toast';
import { ConfirmDialog, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner, StatusBadge, formatDate } from '../components/ui';

interface EventItem {
  id: number;
  title: string;
  title_ta: string | null;
  description: string;
  description_ta: string | null;
  location: string;
  venue_address: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  cover_image: string | null;
  status: string;
  capacity: number;
}

const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
const EMPTY: Partial<EventItem> = { title: '', title_ta: '', description: '', description_ta: '', location: '', venue_address: '', event_date: '', start_time: '10:00', end_time: '', cover_image: null, status: 'UPCOMING', capacity: 500 };

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

export const EventsAdminPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<Partial<EventItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .get('/events/admin/list', { params: statusFilter ? { status: statusFilter } : {} })
      .then((r) => setItems(asArray(r.data.data)))
      .catch((err) => setError(errorMessage(err)));
  }, [statusFilter]);
  useEffect(load, [load]);

  const set = (key: keyof EventItem, value: any) => setEditing((e) => ({ ...e!, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...editing, start_time: hhmm(editing.start_time), end_time: hhmm(editing.end_time) || null };
      if (editing.id) await api.put(`/events/${editing.id}`, payload);
      else await api.post('/events', payload);
      toast(editing.id ? 'Event updated' : 'Event created');
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
      await api.delete(`/events/${deleting.id}`);
      toast('Event deleted');
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
        title="Events"
        subtitle="Meetings, rallies and programmes shown on the website and app."
        actions={
          <button className="btn btn-brand" onClick={() => { setFormError(null); setEditing({ ...EMPTY }); }}>
            <i className="bi bi-plus-lg me-1"></i>New event
          </button>
        }
      />

      <div className="panel">
        <div className="filter-bar">
          <select className="form-select" style={{ maxWidth: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !items ? (
          <Spinner />
        ) : (items || []).length === 0 ? (
          <EmptyState icon="bi-calendar-event" title="No events yet" text="Create an event to announce it to members." />
        ) : (
          <ul className="content-list">
            {items!.map((ev) => {
              const d = new Date(`${ev.event_date}T00:00:00`);
              return (
                <li key={ev.id}>
                  <div className="date-tile">
                    <span>{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <strong>{d.getDate()}</strong>
                  </div>
                  <div className="content-thumb d-none d-sm-flex">{ev.cover_image ? <img src={mediaUrl(ev.cover_image)} alt="" /> : <i className="bi bi-calendar-event"></i>}</div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                      <StatusBadge status={ev.status} />
                      <span className="small text-muted">{formatDate(ev.event_date)} · {hhmm(ev.start_time)}{ev.end_time ? `–${hhmm(ev.end_time)}` : ''}</span>
                    </div>
                    <div className="fw-semibold text-truncate">{ev.title}</div>
                    <div className="small text-muted text-truncate"><i className="bi bi-geo-alt me-1"></i>{ev.location}</div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-icon" title="Edit" aria-label="Edit" onClick={() => { setFormError(null); setEditing({ ...ev }); }}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-icon text-danger" title="Delete" aria-label="Delete" onClick={() => setDeleting(ev)}><i className="bi bi-trash"></i></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit event' : 'New event'}
          onClose={() => setEditing(null)}
          size="xl"
          footer={
            <>
              <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" form="event-form" className="btn btn-brand" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                {editing.id ? 'Save changes' : 'Create event'}
              </button>
            </>
          }
        >
          <form id="event-form" onSubmit={save}>
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <div className="row">
              <div className="col-md-6">
                <Field label="Title (English)" required><input className="form-control" value={editing.title || ''} onChange={(e) => set('title', e.target.value)} required /></Field>
                <Field label="Description (English)" required><textarea className="form-control" rows={4} value={editing.description || ''} onChange={(e) => set('description', e.target.value)} required /></Field>
              </div>
              <div className="col-md-6">
                <Field label="தலைப்பு (Tamil title)"><input className="form-control" value={editing.title_ta || ''} onChange={(e) => set('title_ta', e.target.value)} /></Field>
                <Field label="விவரம் (Tamil description)"><textarea className="form-control" rows={4} value={editing.description_ta || ''} onChange={(e) => set('description_ta', e.target.value)} /></Field>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4"><Field label="Date" required><input type="date" className="form-control" value={editing.event_date || ''} onChange={(e) => set('event_date', e.target.value)} required /></Field></div>
              <div className="col-md-4"><Field label="Start time" required><input type="time" className="form-control" value={hhmm(editing.start_time)} onChange={(e) => set('start_time', e.target.value)} required /></Field></div>
              <div className="col-md-4"><Field label="End time"><input type="time" className="form-control" value={hhmm(editing.end_time)} onChange={(e) => set('end_time', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="Location / venue name" required><input className="form-control" value={editing.location || ''} onChange={(e) => set('location', e.target.value)} required /></Field></div>
              <div className="col-md-6"><Field label="Full address"><input className="form-control" value={editing.venue_address || ''} onChange={(e) => set('venue_address', e.target.value)} /></Field></div>
              <div className="col-md-6"><Field label="Cover image"><ImagePicker folder="Events" value={editing.cover_image || null} onChange={(v) => set('cover_image', v)} /></Field></div>
              <div className="col-md-3"><Field label="Capacity"><input type="number" min={1} className="form-control" value={editing.capacity || ''} onChange={(e) => set('capacity', Number(e.target.value))} /></Field></div>
              <div className="col-md-3">
                <Field label="Status">
                  <select className="form-select" value={editing.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete event?"
          message={<>“{deleting.title}” will be permanently removed.</>}
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
