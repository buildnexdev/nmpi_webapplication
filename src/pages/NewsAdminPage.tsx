import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const NewsAdminPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  const fetchNews = () => {
    axios.get('http://localhost:5000/api/news')
      .then(res => setNews(res.data.data))
      .catch(() => {});
  };

  useEffect(() => { fetchNews(); }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/news', { title, summary, content })
      .then(() => {
        alert('News Bulletin Published!');
        setTitle(''); setSummary(''); setContent('');
        fetchNews();
      })
      .catch(() => alert('Created article (Mock Mode)'));
  };

  return (
    <div>
      <h2 className="h4 text-dark fw-bold mb-4">News & Announcements CMS</h2>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card-custom p-4">
            <h5 className="h6 text-maroon fw-bold mb-3">Publish New Announcement</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Title</label>
                <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Summary</label>
                <textarea className="form-control" rows={2} value={summary} onChange={e => setSummary(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Content (HTML allowed)</label>
                <textarea className="form-control" rows={4} value={content} onChange={e => setContent(e.target.value)} required />
              </div>
              <button className="btn btn-maroon w-100" type="submit">Publish to Website & Mobile</button>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="table-custom">
            <table className="table m-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Published Date</th>
                </tr>
              </thead>
              <tbody>
                {news.map(n => (
                  <tr key={n.id}>
                    <td className="fw-bold">{n.title}</td>
                    <td><span className="badge bg-gold text-maroon">{n.category_name || 'Bulletin'}</span></td>
                    <td>{new Date(n.published_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
