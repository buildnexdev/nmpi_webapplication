import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, NotStaffError } from '../auth/AuthContext';
import { errorMessage, WEBSITE_URL } from '../api/client';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(loginId.trim(), password);
      navigate((location.state as any)?.from || '/', { replace: true });
    } catch (err) {
      setError(err instanceof NotStaffError ? err.message : errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-art">
        <img src="/logo.jpg" alt="NMPI emblem" className="login-logo" />
        <h1>நேதாஜி மக்கள் பாதுகாப்பு இயக்கம்</h1>
        <p>Netaji Makkal Pathukappu Iyakkam — Administration Portal</p>
        <ul>
          <li><i className="bi bi-people-fill"></i> Manage members, approvals and roles</li>
          <li><i className="bi bi-newspaper"></i> Publish news, events and page content</li>
          <li><i className="bi bi-qr-code"></i> Issue verified digital ID cards</li>
        </ul>
      </div>

      <div className="login-form-wrap">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>Sign in</h2>
          <p className="text-muted mb-4">Use your administrator or coordinator account.</p>

          {error && (
            <div className="alert alert-danger d-flex gap-2 align-items-start py-2" role="alert">
              <i className="bi bi-exclamation-circle-fill mt-1"></i>
              <span>{error}</span>
            </div>
          )}

          <label className="form-label" htmlFor="login-id">Email or mobile number</label>
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="bi bi-person"></i></span>
            <input
              id="login-id"
              className="form-control"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin@example.org"
              required
              autoFocus
            />
          </div>

          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-group mb-4">
            <span className="input-group-text"><i className="bi bi-lock"></i></span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>

          <button type="submit" className="btn btn-brand w-100 py-2" disabled={busy || !loginId || !password}>
            {busy ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
            Sign in
          </button>

          <p className="text-center small text-muted mt-4 mb-0">
            Not an administrator? <a href={`${WEBSITE_URL}/login`}>Go to member login</a>
          </p>
        </form>
      </div>
    </div>
  );
};
