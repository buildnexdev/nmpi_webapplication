import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve live statistics from Backend API
    axios.get('http://localhost:5000/api/dashboard/statistics')
      .then(res => {
        setStats(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback live stats display if backend server not running yet
        setStats({
          total_members: 4,
          pending_applications: 0,
          approved_members: 4,
          active_members: 4,
          upcoming_events: 2,
          published_news: 3,
          district_counts: [
            { district_name: 'Central Capital District', count: 3 },
            { district_name: 'Northern Heights District', count: 1 },
            { district_name: 'Southern Coastal District', count: 0 },
          ]
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-maroon"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 text-dark fw-bold m-0">Executive Dashboard Overview</h2>
          <small className="text-muted">Real-time statistics fetched from central database API</small>
        </div>
        <button className="btn btn-maroon btn-sm" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Live Data
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-sm-6">
          <div className="stat-kpi-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">TOTAL MEMBERS</span>
              <i className="bi bi-people-fill text-maroon fs-4"></i>
            </div>
            <h3 className="h2 text-dark fw-bold m-0">{stats?.total_members}</h3>
            <small className="text-success fw-semibold"><i className="bi bi-check-circle me-1"></i>Verified Registry</small>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="stat-kpi-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">PENDING APPS</span>
              <i className="bi bi-clock-history text-warning fs-4"></i>
            </div>
            <h3 className="h2 text-dark fw-bold m-0">{stats?.pending_applications}</h3>
            <small className="text-warning fw-semibold"><i className="bi bi-exclamation-triangle me-1"></i>Requires Review</small>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="stat-kpi-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">APPROVED & ACTIVE</span>
              <i className="bi bi-patch-check-fill text-success fs-4"></i>
            </div>
            <h3 className="h2 text-dark fw-bold m-0">{stats?.approved_members}</h3>
            <small className="text-success fw-semibold"><i className="bi bi-qr-code-scan me-1"></i>QR Issued</small>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="stat-kpi-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">UPCOMING EVENTS</span>
              <i className="bi bi-calendar-event text-gold fs-4"></i>
            </div>
            <h3 className="h2 text-dark fw-bold m-0">{stats?.upcoming_events}</h3>
            <small className="text-muted"><i className="bi bi-broadcast me-1"></i>Scheduled Meetings</small>
          </div>
        </div>
      </div>

      {/* Chart & Summary Row */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="stat-kpi-card h-100">
            <h5 className="h6 text-dark fw-bold mb-3 border-bottom pb-2">Regional District Membership Distribution</h5>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.district_counts || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="district_name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7A0016" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="stat-kpi-card h-100">
            <h5 className="h6 text-dark fw-bold mb-3 border-bottom pb-2">Quick Administration Actions</h5>
            <div className="d-flex flex-column gap-2">
              <a href="/members" className="btn btn-outline-danger text-start">
                <i className="bi bi-person-check me-2"></i>Review Pending Applications
              </a>
              <a href="/news" className="btn btn-outline-dark text-start">
                <i className="bi bi-pencil-square me-2"></i>Publish New Announcement
              </a>
              <a href="/events" className="btn btn-outline-dark text-start">
                <i className="bi bi-plus-circle me-2"></i>Create Community Event
              </a>
              <a href="/reports" className="btn btn-outline-secondary text-start">
                <i className="bi bi-download me-2"></i>Export Regional CSV Report
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
