import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api, errorMessage, mediaUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Avatar, Card, EmptyState, ErrorState, PageHeader, Spinner, StatusBadge, formatDate } from '../components/ui';

interface Stats {
  total_members: number;
  approved_members: number;
  pending_applications: number;
  suspended_members: number;
  new_last_30_days: number;
  upcoming_events: number;
  published_news: number;
  district_counts: Array<{ id: number; district_name: string; district_name_ta: string; count: number }>;
  parliament_counts: Array<{ id: number; parliament_name: string; parliament_name_ta: string; parliament_code: string; count: number }>;
  monthly_registrations: Array<{ month: string; count: number }>;
  recent_members: Array<{ id: number; member_id: string; full_name: string; profile_image: string | null; status: string; created_at: string; district_name: string }>;
}

function lastSixMonths(data: Stats['monthly_registrations']) {
  const map = new Map(data.map((d) => [d.month, d.count]));
  const out: Array<{ label: string; count: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), count: map.get(key) || 0 });
  }
  return out;
}

const KpiCard: React.FC<{ icon: string; tone: string; label: string; value: number; hint: string; to?: string }> = ({ icon, tone, label, value, hint, to }) => {
  const body = (
    <div className={`kpi-card kpi-${tone}`}>
      <div className="kpi-icon"><i className={`bi ${icon}`}></i></div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value.toLocaleString('en-IN')}</div>
        <div className="kpi-hint">{hint}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="text-decoration-none">{body}</Link> : body;
};

export const DashboardPage: React.FC = () => {
  const { user, isContentAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/dashboard/statistics')
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const greetingName = user?.member?.full_name?.split(' ')[0] || 'Admin';
  const maxDistrict = Math.max(1, ...(stats?.district_counts.map((d) => d.count) || [1]));

  return (
    <>
      <PageHeader
        title={`Vanakkam, ${greetingName}`}
        subtitle="Here is what is happening across the movement today."
        actions={
          <button className="btn btn-light" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        }
      />

      {loading && !stats ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats ? (
        <>
          <div className="kpi-grid">
            <KpiCard icon="bi-people-fill" tone="brand" label="Total members" value={stats.total_members} hint={`+${stats.new_last_30_days} in the last 30 days`} to="/members" />
            <KpiCard icon="bi-patch-check-fill" tone="success" label="Approved" value={stats.approved_members} hint="Active digital ID cards" to="/members" />
            <KpiCard icon="bi-hourglass-split" tone="warning" label="Pending approval" value={stats.pending_applications} hint="Awaiting review" to="/applications" />
            <KpiCard
              icon="bi-calendar-event-fill"
              tone="info"
              label="Upcoming events"
              value={stats.upcoming_events}
              hint={`${stats.published_news} news articles published`}
              to={isContentAdmin ? '/events' : undefined}
            />
          </div>

          <div className="row g-4 mt-1">
            <div className="col-xl-8">
              <Card title="New registrations (last 6 months)">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={lastSixMonths(stats.monthly_registrations)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(122,0,22,0.06)' }} formatter={(v: number) => [v, 'Members']} />
                      <Bar dataKey="count" fill="#7A0016" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="col-xl-4">
              <Card title="Top districts">
                {stats.district_counts.length === 0 ? (
                  <EmptyState icon="bi-geo-alt" title="No members yet" />
                ) : (
                  <ul className="bar-list">
                    {stats.district_counts.map((d) => (
                      <li key={d.id}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="fw-semibold">{d.district_name}</span>
                          <span className="text-muted">{d.count}</span>
                        </div>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.count / maxDistrict) * 100}%` }}></div></div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="col-xl-7">
              <Card title="Recent registrations" actions={<Link to="/members" className="small">View all</Link>} flush>
                {stats.recent_members.length === 0 ? (
                  <EmptyState title="No members registered yet" />
                ) : (
                  <ul className="list-rows">
                    {stats.recent_members.map((m) => (
                      <li key={m.id}>
                        <Avatar src={mediaUrl(m.profile_image)} name={m.full_name} />
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate">{m.full_name}</div>
                          <div className="small text-muted">{m.member_id} · {m.district_name || '—'}</div>
                        </div>
                        <div className="text-end">
                          <StatusBadge status={m.status} />
                          <div className="small text-muted mt-1">{formatDate(m.created_at)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="col-xl-5">
              <Card title="Members by parliament constituency" flush>
                {stats.parliament_counts.length === 0 ? (
                  <EmptyState icon="bi-bank" title="No data yet" />
                ) : (
                  <table className="table table-modern mb-0">
                    <thead>
                      <tr><th>Code</th><th>Constituency</th><th className="text-end">Members</th></tr>
                    </thead>
                    <tbody>
                      {stats.parliament_counts.map((p) => (
                        <tr key={p.id}>
                          <td><span className="code-pill">{p.parliament_code}</span></td>
                          <td>
                            <div className="fw-semibold">{p.parliament_name}</div>
                            <div className="small text-muted">{p.parliament_name_ta}</div>
                          </td>
                          <td className="text-end fw-bold">{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};
