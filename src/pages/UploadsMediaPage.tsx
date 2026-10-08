import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, asArray, errorMessage, mediaUrl, WEBSITE_URL } from '../api/client';
import { useToast } from '../components/Toast';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { FolderTabs, MEDIA_FOLDERS, MediaFile, MediaFolder, uploadImage } from '../components/ImagePicker';

const FOLDER_HINT: Record<MediaFolder, string> = {
  Gallery: 'Event photos for the Gallery and home hero (allowlisted filenames only).',
  Events: 'Event covers and posters. Shown in Gallery — not used on the home hero.',
  News: 'News covers. Also shown in the Gallery (News).',
  Leaders: 'Leader profile photos. Not shown in the Gallery.',
  Videos: 'MP4/WEBM/MOV for the home About section and optional hero background slide.',
};

export const UploadsMediaPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('');
  const [target, setTarget] = useState<MediaFolder>('Gallery');
  const [uploading, setUploading] = useState(0);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/uploads/list').then((r) => setItems(asArray(r.data.data))).catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(() => (items || []).reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.folder]: (acc[m.folder] || 0) + 1 }), {}), [items]);
  const shown = useMemo(() => (items || []).filter((m) => !tab || m.folder === tab), [items, tab]);

  const selectTab = (f: string) => {
    setTab(f);
    if ((MEDIA_FOLDERS as readonly string[]).includes(f)) setTarget(f as MediaFolder);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        await uploadImage(file, target);
        ok++;
      } catch (err) {
        toast(`${file.name}: ${errorMessage(err, 'upload failed')}`, 'error');
      }
      setUploading((n) => n - 1);
    }
    if (ok) toast(`${ok} file${ok > 1 ? 's' : ''} uploaded to ${target}`);
    if (fileRef.current) fileRef.current.value = '';
    if (ok && tab && tab !== target) setTab(target);
    load();
  };

  const copy = async (m: MediaFile) => {
    try {
      await navigator.clipboard.writeText(m.path);
      toast('Image path copied', 'info');
    } catch {
      toast('Could not copy. Select the URL manually.', 'error');
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/uploads/${encodeURIComponent(deleting.filename)}`, { params: { folder: deleting.folder } });
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
      <PageHeader
        title="Media library"
        subtitle="Images are saved into backend/uploads/<folder>/ and appear on the website automatically."
        actions={<a className="btn btn-outline-secondary" href={`${WEBSITE_URL}/gallery`} target="_blank" rel="noreferrer"><i className="bi bi-box-arrow-up-right me-1"></i>View gallery</a>}
      />

      <div className="panel mb-3">
        <div className="filter-bar d-flex flex-wrap align-items-center gap-3">
          <label className="d-flex align-items-center gap-2 mb-0">
            <span className="small fw-semibold text-nowrap">Upload to</span>
            <select className="form-select form-select-sm" value={target} onChange={(e) => setTarget(e.target.value as MediaFolder)} aria-label="Upload folder">
              {MEDIA_FOLDERS.map((f) => <option key={f} value={f}>uploads/{f}/</option>)}
            </select>
          </label>
          <span className="small text-muted">{FOLDER_HINT[target]}</span>
        </div>
      </div>

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
          <><span className="spinner-border text-brand"></span><span>Uploading {uploading} file(s) to {target}…</span></>
        ) : (
          <><i className="bi bi-cloud-arrow-up"></i><strong>Drop files here or click to upload to <span className="text-brand">{target}</span></strong><span className="small text-muted">{target === 'Videos' ? 'MP4, WEBM or MOV, up to 80 MB each' : 'JPG, PNG or WEBP, up to 5 MB each'}</span></>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={target === 'Videos' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'image/png,image/jpeg,image/webp'}
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      <div className="mb-3"><FolderTabs value={tab} onChange={selectTab} withAll counts={items ? counts : undefined} /></div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <EmptyState icon="bi-images" title={tab ? `No images in ${tab} yet` : 'No images yet'} />
      ) : (
        <div className="media-grid">
          {shown.map((m) => (
            <figure key={m.path} className="media-card">
              <a href={mediaUrl(m.url)} target="_blank" rel="noreferrer" className="media-card-img">
                {m.kind === 'video' ? (
                  <div className="media-card-video">
                    <i className="bi bi-camera-video-fill" aria-hidden="true"></i>
                    <span className="small">Video</span>
                  </div>
                ) : (
                  <img src={mediaUrl(m.url)} alt={m.filename} loading="lazy" />
                )}
                <span className="media-card-folder">{m.folder}</span>
              </a>
              <figcaption>
                <div className="text-truncate small fw-semibold" title={m.path}>{m.filename}</div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">{(m.size / 1024).toFixed(0)} KB</span>
                  <span>
                    <button className="btn btn-icon btn-sm" title="Copy path" aria-label="Copy path" onClick={() => copy(m)}><i className="bi bi-link-45deg"></i></button>
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
          message={<>“{deleting.folder}/{deleting.filename}” will be deleted. Any page still using it will show a broken image.</>}
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
