import React from 'react';

export const RolesAdminPage: React.FC = () => {
  return (
    <div>
      <h2 className="h4 text-dark fw-bold mb-4">Role-Based Access Control (RBAC) Matrix</h2>
      <div className="table-custom">
        <table className="table table-bordered m-0 align-middle">
          <thead className="table-dark">
            <tr>
              <th>Permission Module</th>
              <th>SUPER_ADMIN</th>
              <th>ADMIN</th>
              <th>DISTRICT_ADMIN</th>
              <th>TALUK_ADMIN</th>
              <th>UNIT_ADMIN</th>
              <th>MEMBER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Manage All Members</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-muted">(District)</td>
              <td className="text-center text-muted">(Taluk)</td>
              <td className="text-center text-muted">(Unit)</td>
              <td className="text-center text-danger">✗</td>
            </tr>
            <tr>
              <td>Approve Applications</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-danger">✗</td>
              <td className="text-center text-danger">✗</td>
            </tr>
            <tr>
              <td>Manage News & Events</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-success">✓</td>
              <td className="text-center text-danger">✗</td>
              <td className="text-center text-danger">✗</td>
              <td className="text-center text-danger">✗</td>
              <td className="text-center text-danger">✗</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
