import React, { useCallback, useEffect, useState } from 'react';
import { api, asArray, errorMessage, WEBSITE_URL } from '../api/client';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorState, Field, PageHeader, Spinner, formatDate } from '../components/ui';

interface Page {
  page_key: string;
  title: string;
  title_ta: string | null;
  content: string;
  content_ta: string | null;
  updated_at?: string;
}

const KNOWN_PAGES: Record<string, string> = { about: '/about', structure: '/structure' };

export const CmsAdminPage: React.FC = () => {
  const toast = useToast();
  const [pages, setPages] = useState<Page[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Page | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<'en' | 'ta' | null>(null);

  const load = useCallback((selectKey?: string) => {
    setError(null);
    api
      .get('/pages')
      .then((r) => {
        const list: Page[] = asArray(r.data.data);
        setPages(list);
        const key = selectKey || selectedKey || list[0]?.page_key;
        const page = list.find((p) => p.page_key === key);
        if (page) {
          setSelectedKey(page.page_key);
          setDraft({ ...page });
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [selectedKey]);

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (p: Page) => {
    setSelectedKey(p.page_key);
    setDraft({ ...p });
    setFormError(null);
    setPreview(null);
  };

  const set = (key: keyof Page, value: string) => setDraft((d) => ({ ...d!, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.put(`/pages/${encodeURIComponent(draft.page_key)}`, draft);
      toast('Page saved and published');
      load(draft.page_key);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const newPage = () => {
    const key = window.prompt('Page key (lowercase letters, numbers, dashes), e.g. "vision"');
    if (!key) return;
    const clean = key.trim().toLowerCase();
    setSelectedKey(clean);
    setDraft({ page_key: clean, title: '', title_ta: '', content: '', content_ta: '' });
    setFormError(null);
  };

  return (
    <>
      <PageHeader
        title="Pages"
        subtitle="Edit the bilingual text of website pages such as About, History and Structure."
        actions={<button className="btn btn-light" onClick={newPage}><i className="bi bi-plus-lg me-1"></i>New page</button>}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : !pages ? (
        <Spinner />
      ) : (
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="panel">
              <ul className="page-list">
                {pages.map((p) => (
                  <li key={p.page_key}>
                    <button className={selectedKey === p.page_key ? 'active' : ''} onClick={() => select(p)}>
                      <i className="bi bi-file-earmark-text"></i>
                      <span className="min-w-0">
                        <span className="d-block text-truncate">{p.title}</span>
                        <small className="text-muted">/{p.page_key}</small>
                      </span>
                    </button>
                  </li>
                ))}
                {selectedKey && !pages.some((p) => p.page_key === selectedKey) && (
                  <li><button className="active"><i className="bi bi-file-earmark-plus"></i><span>/{selectedKey} (new)</span></button></li>
                )}
              </ul>
            </div>
          </div>

          <div className="col-lg-9">
            {!draft ? (
              <div className="panel"><EmptyState title="Select a page to edit" /></div>
            ) : (
              <form className="panel" onSubmit={save}>
                <header className="panel-header">
                  <h2 className="panel-title">
                    Editing <span className="code-pill ms-1">/{draft.page_key}</span>
                    {draft.updated_at && <small className="text-muted fw-normal ms-2">Last saved {formatDate(draft.updated_at, true)}</small>}
                  </h2>
                  {KNOWN_PAGES[draft.page_key] && (
                    <a className="btn btn-sm btn-light" href={`${WEBSITE_URL}${KNOWN_PAGES[draft.page_key]}`} target="_blank" rel="noreferrer">
                      <i className="bi bi-box-arrow-up-right me-1"></i>View on website
                    </a>
                  )}
                </header>
                <div className="panel-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="row">
                    <div className="col-md-6">
                      <Field label="Title (English)" required><input className="form-control" value={draft.title} onChange={(e) => set('title', e.target.value)} required /></Field>
                      <Field label="Content (English)" required hint="HTML supported: <p>, <h3>, <ul>, <li>, <b>">
                        <textarea className="form-control font-monospace small" rows={12} value={draft.content} onChange={(e) => set('content', e.target.value)} required />
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="தலைப்பு (Tamil title)"><input className="form-control" value={draft.title_ta || ''} onChange={(e) => set('title_ta', e.target.value)} /></Field>
                      <Field label="உள்ளடக்கம் (Tamil content)">
                        <textarea className="form-control font-monospace small" rows={12} value={draft.content_ta || ''} onChange={(e) => set('content_ta', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center border-top pt-3">
                    <div className="btn-group btn-group-sm">
                      <button type="button" className={`btn ${preview === 'en' ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={() => setPreview(preview === 'en' ? null : 'en')}>Preview English</button>
                      <button type="button" className={`btn ${preview === 'ta' ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={() => setPreview(preview === 'ta' ? null : 'ta')}>Preview Tamil</button>
                    </div>
                    <button type="submit" className="btn btn-brand" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-check me-1"></i>}
                      Save & publish
                    </button>
                  </div>

                  {preview && (
                    <div className="page-preview mt-3">
                      <h3>{preview === 'en' ? draft.title : draft.title_ta || draft.title}</h3>
                      <div dangerouslySetInnerHTML={{ __html: preview === 'en' ? draft.content : draft.content_ta || draft.content }} />
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
