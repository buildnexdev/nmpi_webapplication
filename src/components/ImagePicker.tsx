import React, { useRef, useState } from 'react';
import { api, asArray, errorMessage, mediaUrl } from '../api/client';
import { Modal, Spinner } from './ui';

interface MediaFile {
  filename: string;
  path: string;
  url: string;
}

export const ImagePicker: React.FC<{ value: string | null; onChange: (path: string | null) => void }> = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<MediaFile[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/uploads', form);
      onChange(res.data.data.path);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    if (!library) {
      try {
        const res = await api.get('/uploads/list');
        setLibrary(asArray(res.data.data));
      } catch (err) {
        setError(errorMessage(err));
        setLibrary([]);
      }
    }
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
        {error && <div className="text-danger small">{error}</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      {libraryOpen && (
        <Modal title="Choose from media library" onClose={() => setLibraryOpen(false)} size="lg">
          {!library ? (
            <Spinner />
          ) : (library || []).length === 0 ? (
            <p className="text-muted text-center py-4">No images uploaded yet.</p>
          ) : (
            <div className="media-pick-grid">
              {library.map((m) => (
                <button
                  type="button"
                  key={m.filename}
                  className={`media-pick-item ${value === m.path ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(m.path);
                    setLibraryOpen(false);
                  }}
                >
                  <img src={m.url} alt={m.filename} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
