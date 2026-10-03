import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

interface MediaFile {
  filename: string;
  url: string;
  path: string;
  size: number;
  updated_at: string;
}

export const UploadsMediaPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/uploads/list').then((r) => setItems(r.data.data)).catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(list.length);
    let ok = 0;
    for (const file of list) {
      const form = new FormData();
      form.append('file', file);
      try {
        await api.post('/uploads', form);
        ok++;
      } catch (err) {
        toast(`${file.name}: ${errorMessage(err, 'upload failed')}`, 'error');
      }
      setUploading((n) => n - 1);
    }
    if (ok) toast(`${ok} image${ok > 1 ? 's' : ''} uploaded`);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const copy = async (m: MediaFile) => {
    try {
      await navigator.clipboard.writeText(m.url);
      toast('Image URL copied', 'info');
    } catch {
      toast('Could not copy. Select the URL manually.', 'error');
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/uploads/${encodeURIComponent(deleting.filename)}`);
      toast('Image deleted');
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
      <PageHeader title="Media library" subtitle="Images used on the website gallery, news, events and leader profiles." />

      <div
        className={`dropzone ${dragOver ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        {uploading > 0 ? (
          <><span className="spinner-border text-brand"></span><span>Uploading {uploading} file(s)…</span></>
        ) : (
          <><i className="bi bi-cloud-arrow-up"></i><strong>Drop images here or click to upload</strong><span className="small text-muted">JPG, PNG or WEBP, up to 5 MB each</span></>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState icon="bi-images" title="No images yet" />
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <figure key={m.filename} className="media-card">
              <a href={m.url} target="_blank" rel="noreferrer" className="media-card-img">
                <img src={m.url} alt={m.filename} loading="lazy" />
              </a>
              <figcaption>
                <div className="text-truncate small fw-semibold" title={m.filename}>{m.filename}</div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">{(m.size / 1024).toFixed(0)} KB</span>
                  <span>
                    <button className="btn btn-icon btn-sm" title="Copy URL" aria-label="Copy URL" onClick={() => copy(m)}><i className="bi bi-link-45deg"></i></button>
                    <button className="btn btn-icon btn-sm text-danger" title="Delete" aria-label="Delete" onClick={() => setDeleting(m)}><i className="bi bi-trash"></i></button>
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete image?"
          message={<>“{deleting.filename}” will be deleted. Any page still using it will show a broken image.</>}
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
