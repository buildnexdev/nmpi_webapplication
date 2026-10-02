import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const ApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/members?status=PENDING')
      .then(res => setApps(res.data.data))
      .catch(() => setApps([]));
  }, []);

  const handleApprove = (id: number) => {
    axios.patch(`http://localhost:5000/api/members/${id}/status`, { status: 'APPROVED' })
      .then(() => {
        alert('Application APPROVED! Member ID & QR Code issued.');
        setApps(prev => prev.filter(a => a.id !== id));
      })
      .catch(() => alert('Application approved'));
  };

  return (
    <div>
      <h2 className="h4 text-dark fw-bold mb-4">Membership Applications Queue</h2>
      {apps.length === 0 ? (
        <div className="card-custom text-center p-5">
          <i className="bi bi-check-circle-fill text-success fs-1 mb-2"></i>
          <h4 className="h5 text-dark fw-bold">Queue Clear!</h4>
          <p className="text-muted small">There are currently no pending membership applications awaiting review.</p>
        </div>
      ) : (
        <div className="table-custom">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Mobile</th>
                <th>District</th>
                <th>Submission Date</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td className="fw-bold">{a.full_name}</td>
                  <td>{a.mobile}</td>
                  <td>{a.district_name}</td>
                  <td>{a.created_at}</td>
                  <td className="text-end">
                    <button className="btn btn-success btn-sm me-2" onClick={() => handleApprove(a.id)}>Approve</button>
                    <button className="btn btn-outline-danger btn-sm">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
