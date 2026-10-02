import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const EventsAdminPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/events').then(res => setEvents(res.data.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="h4 text-dark fw-bold mb-4">Community Events Management</h2>
      <div className="table-custom">
        <table className="table m-0">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td className="fw-bold">{e.title}</td>
                <td>{e.event_date} ({e.start_time})</td>
                <td>{e.location}</td>
                <td><span className="badge bg-success">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
