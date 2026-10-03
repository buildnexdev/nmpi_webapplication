import React, { useCallback, useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { api, downloadFile, errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { Card, EmptyState, ErrorState, Field, PageHeader, Spinner } from '../components/ui';

interface Option { id: number; name_en?: string; name?: string }

const PIE_COLORS = ['#7A0016', '#D4AF37', '#1F2937', '#B45309', '#0F766E', '#6D28D9', '#9CA3AF'];

export const ReportsAdminPage: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [parliaments, setParliaments] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [filters, setFilters] = useState({ status: '', district_id: '', parliament_id: '', role_id: '' });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api.get('/dashboard/statistics').then((r) => setStats(r.data.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
    api.get('/master-data/districts').then((r) => setDistricts(r.data.data)).catch(() => {});
    api.get('/master-data/parliaments').then((r) => setParliaments(r.data.data)).catch(() => {});
    api.get('/master-data/roles/all').then((r) => setRoles(r.data.data)).catch(() => {});
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      await downloadFile(`/members/export.csv${params.toString() ? `?${params}` : ''}`, 'nmpi_members.csv');
      toast('Member report downloaded');
    } catch (err) {
      toast(errorMessage(err, 'Export failed'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const setFilter = (key: keyof typeof filters, value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const statusData = stats
    ? [
        { name: 'Approved', value: stats.approved_members },
        { name: 'Pending', value: stats.pending_applications },
        { name: 'Suspended', value: stats.suspended_members },
        { name: 'Other', value: Math.max(0, stats.total_members - stats.approved_members - stats.pending_applications - stats.suspended_members) },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <>
      <PageHeader title="Reports" subtitle="Download member lists and review membership breakdowns." />

      <Card title={<><i className="bi bi-file-earmark-spreadsheet me-2 text-brand"></i>Export members to CSV</>} className="mb-4">
        <p className="text-muted small mb-3">Opens in Excel or Google Sheets. Only members within your access scope are included.</p>
        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-lg-3">
            <Field label="Status" className="mb-0">
              <select className="form-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">All statuses</option>
                {['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="col-sm-6 col-lg-3">
            <Field label="Parliament constituency" className="mb-0">
              <select className="form-select" value={filters.parliament_id} onChange={(e) => setFilter('parliament_id', e.target.value)}>
                <option value="">All constituencies</option>
                {parliaments.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
              </select>
            </Field>
          </div>
          <div className="col-sm-6 col-lg-2">
            <Field label="District" className="mb-0">
              <select className="form-select" value={filters.district_id} onChange={(e) => setFilter('district_id', e.target.value)}>
                <option value="">All districts</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
              </select>
            </Field>
          </div>
          <div className="col-sm-6 col-lg-2">
            <Field label="Role" className="mb-0">
              <select className="form-select" value={filters.role_id} onChange={(e) => setFilter('role_id', e.target.value)}>
                <option value="">All roles</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="col-lg-2 d-grid">
            <button className="btn btn-brand" onClick={exportCsv} disabled={exporting}>
              {exporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-download me-1"></i>}
              Download CSV
            </button>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !stats ? (
        <Spinner />
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <Card title="Membership status">
              {statusData.length === 0 ? (
                <EmptyState title="No members yet" />
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
          <div className="col-lg-7">
            <Card title="Members by role">
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.role_counts} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="role_name" width={130} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(122,0,22,0.05)' }} />
                    <Bar dataKey="count" name="Members" fill="#7A0016" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <div className="col-12">
            <Card title="Members by district (top 10)" flush>
              {stats.district_counts.length === 0 ? (
                <EmptyState title="No data yet" />
              ) : (
                <div className="table-responsive">
                  <table className="table table-modern mb-0">
                    <thead><tr><th>District</th><th className="text-end">Members</th><th style={{ width: '40%' }}>Share</th></tr></thead>
                    <tbody>
                      {stats.district_counts.map((d: any) => {
                        const pct = stats.total_members ? Math.round((d.count / stats.total_members) * 100) : 0;
                        return (
                          <tr key={d.id}>
                            <td>{d.district_name}<div className="small text-muted">{d.district_name_ta}</div></td>
                            <td className="text-end fw-semibold">{d.count}</td>
                            <td><div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div><small className="text-muted">{pct}%</small></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
};
