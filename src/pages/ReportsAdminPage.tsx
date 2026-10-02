import React from 'react';

export const ReportsAdminPage: React.FC = () => {
  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Member ID,Name,District,Status,Joined Date\nORG-2026-000001,Organization Administrator,Central Capital,APPROVED,2026-01-01\nORG-2026-000002,Regional Director,Central Capital,APPROVED,2026-01-10\nORG-2026-000003,John Doe Member,Central Capital,APPROVED,2026-02-14";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "member_registration_report_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="h4 text-dark fw-bold mb-4">Analytics & Member Reports</h2>
      <div className="card-custom p-4">
        <h5 className="h6 text-maroon fw-bold mb-3">Export Membership Data</h5>
        <p className="small text-muted">Generate and download CSV reports filtered by regional district or membership status.</p>
        <button className="btn btn-gold" onClick={exportCSV}>
          <i className="bi bi-file-earmark-spreadsheet me-2"></i> Export Member Registry CSV
        </button>
      </div>
    </div>
  );
};
