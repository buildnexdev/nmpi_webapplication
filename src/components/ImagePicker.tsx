import React, { useEffect, useRef, useState } from 'react';
import { api, asArray, errorMessage, mediaUrl } from '../api/client';
import { Modal, Spinner } from './ui';

/** Folders under backend/uploads/ that staff upload into; General holds older loose files. */
export const MEDIA_FOLDERS = ['Gallery', 'Events', 'News', 'Leaders', 'Videos'] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
export const LIST_FOLDERS = [...MEDIA_FOLDERS, 'General'] as const;

export interface MediaFile {
  filename: string;
  folder: string;
  path: string;
  url: string;
  size: number;
  updated_at: string;
  kind?: 'image' | 'video';
}

export function uploadImage(file: File, folder: MediaFolder) {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/uploads?folder=${folder}`, form).then((res) => res.data.data as MediaFile);
}

export const FolderTabs: React.FC<{ value: string; onChange: (v: string) => void; withAll?: boolean; counts?: Record<string, number> }> = ({ value, onChange, withAll, counts }) => (
  <div className="btn-group btn-group-sm flex-wrap" role="group" aria-label="Folder">
    {[...(withAll ? [''] : []), ...LIST_FOLDERS].map((f) => (
      <button key={f || 'all'} type="button" className={`btn ${value === f ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={() => onChange(f)}>
        {f || 'All'}
        {counts && <span className="ms-1 opacity-75">{f ? counts[f] || 0 : Object.values(counts).reduce((a, b) => a + b, 0)}</span>}
      </button>
    ))}
  </div>
);

export const ImagePicker: React.FC<{ value: string | null; onChange: (path: string | null) => void; folder?: MediaFolder }> = ({ value, onChange, folder = 'Gallery' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryFolder, setLibraryFolder] = useState<string>(folder);
  const [library, setLibrary] = useState<MediaFile[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      onChange((await uploadImage(file, folder)).path);
      setLibrary(null);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!libraryOpen) return;
    let cancelled = false;
    setLibrary(null);
    api
      .get('/uploads/list', { params: { folder: libraryFolder } })
      .then((res) => !cancelled && setLibrary(asArray(res.data.data)))
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setLibrary([]);
      });
    return () => { cancelled = true; };
  }, [libraryOpen, libraryFolder]);

  const openLibrary = () => {
    setLibraryFolder(folder);
    setLibraryOpen(true);
  };

  return (
    <div className="image-picker">
      <div className="image-picker-preview">
        {value ? <img src={mediaUrl(value)} alt="Selected" /> : <i className="bi bi-image"></i>}
      </div>
      <div className="d-flex flex-column gap-2 flex-grow-1">
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-upload me-1"></i>}
            Upload
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={openLibrary}>
            <i className="bi bi-images me-1"></i>Media library
          </button>
          {value && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onChange(null)}>
              <i className="bi bi-x-lg me-1"></i>Remove
            </button>
          )}
        </div>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="…or paste an image URL"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
        <div className="small text-muted"><i className="bi bi-folder2 me-1"></i>Uploads are saved to <code>uploads/{folder}/</code></div>
        {error && <div className="text-danger small">{error}</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      {libraryOpen && (
        <Modal title="Choose from media library" onClose={() => setLibraryOpen(false)} size="lg">
          <div className="mb-3"><FolderTabs value={libraryFolder} onChange={setLibraryFolder} /></div>
          {!library ? (
            <Spinner />
          ) : library.length === 0 ? (
            <p className="text-muted text-center py-4">No images in {libraryFolder} yet.</p>
          ) : (
            <div className="media-pick-grid">
              {library.map((m) => (
                <button
                  type="button"
                  key={m.path}
                  className={`media-pick-item ${value === m.path ? 'selected' : ''}`}
                  title={m.filename}
                  onClick={() => {
                    onChange(m.path);
                    setLibraryOpen(false);
                  }}
                >
                  <img src={mediaUrl(m.url)} alt={m.filename} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
