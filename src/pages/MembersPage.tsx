import React, { useCallback, useEffect, useState } from 'react';
import { api, downloadFile, errorMessage, mediaUrl } from '../api/client';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { useToast } from '../components/Toast';
import { Avatar, EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge, formatDate } from '../components/ui';

interface Option {
  id: number;
  name_en?: string;
  name?: string;
}

const PAGE_SIZE = 20;

export const MembersPage: React.FC<{ fixedStatus?: string; title?: string; subtitle?: string }> = ({
  fixedStatus,
  title = 'Members',
  subtitle = 'Search, filter and manage every registered member.',
}) => {
  const toast = useToast();
  const [parliaments, setParliaments] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [filters, setFilters] = useState({ search: '', parliament_id: '', district_id: '', role_id: '', status: fixedStatus || '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/master-data/parliaments').then((r) => setParliaments(r.data.data)).catch(() => {});
    api.get('/master-data/districts').then((r) => setDistricts(r.data.data)).catch(() => {});
    api.get('/master-data/roles/all').then((r) => setRoles(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput.trim() ? f : { ...f, search: searchInput.trim() }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, any> = { page, pageSize: PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    api
      .get('/members', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(load, [load]);

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
      await downloadFile(`/members/export.csv${params ? `?${params}` : ''}`, 'members.csv');
    } catch (err) {
      toast(errorMessage(err, 'Export failed'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.entries(filters).some(([k, v]) => v && !(fixedStatus && k === 'status'));

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <button className="btn btn-light" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
            <button className="btn btn-brand" onClick={exportCsv} disabled={exporting}>
              {exporting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-download me-1"></i>}
              Export CSV
            </button>
          </>
        }
      />

      <div className="panel">
        <div className="filter-bar">
          <div className="input-group filter-search">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search name, member ID, phone or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <select className="form-select" value={filters.parliament_id} onChange={(e) => setFilter('parliament_id', e.target.value)} aria-label="Parliament constituency">
            <option value="">All constituencies</option>
            {parliaments.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
          </select>
          <select className="form-select" value={filters.district_id} onChange={(e) => setFilter('district_id', e.target.value)} aria-label="District">
            <option value="">All districts</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
          </select>
          <select className="form-select" value={filters.role_id} onChange={(e) => setFilter('role_id', e.target.value)} aria-label="Role">
            <option value="">All roles</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {!fixedStatus && (
            <select className="form-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
              <option value="">All statuses</option>
              {['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {hasFilters && (
            <button
              className="btn btn-link text-decoration-none"
              onClick={() => {
                setSearchInput('');
                setFilters({ search: '', parliament_id: '', district_id: '', role_id: '', status: fixedStatus || '' });
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading && !data ? (
          <Spinner />
        ) : data && data.items.length === 0 ? (
          <EmptyState icon="bi-people" title={fixedStatus ? 'Nothing waiting for review' : 'No members found'} text={hasFilters ? 'Try changing the filters.' : undefined} />
        ) : data ? (
          <>
            <div className={`table-responsive ${loading ? 'opacity-50' : ''}`}>
              <table className="table table-modern table-hover mb-0">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th className="d-none d-lg-table-cell">Constituency</th>
                    <th className="d-none d-md-table-cell">District</th>
                    <th className="d-none d-xl-table-cell">Role</th>
                    <th>Status</th>
                    <th className="d-none d-xl-table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id} className="clickable" onClick={() => setSelectedId(m.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelectedId(m.id)}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar src={mediaUrl(m.profile_image)} name={m.full_name} />
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{m.full_name}</div>
                            <div className="small text-muted font-monospace">{m.member_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">{m.country_code} {m.phone_number}</td>
                      <td className="d-none d-lg-table-cell">{m.parliament_name || '—'}</td>
                      <td className="d-none d-md-table-cell">{m.district_name || '—'}</td>
                      <td className="d-none d-xl-table-cell">{m.role_name}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td className="d-none d-xl-table-cell text-nowrap">{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </>
        ) : null}
      </div>

      {selectedId && (
        <MemberDetailModal
          memberId={selectedId}
          roles={roles as any}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </>
  );
};
