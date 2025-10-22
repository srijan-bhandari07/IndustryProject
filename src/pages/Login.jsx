import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/AdminStore';
import './auth.css';

export default function Login() {
  const { login } = useAdminStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { ok, error } = await login(form.email, form.password);
    if (!ok) { setError(error || 'Sign in failed'); return; }
    // route by role (admin → /admin, others → /)
    navigate('/'); // or: navigate(user.role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="auth-shell">
      {/* Left: big round emblem */}
      <div className="auth-left">
        <div className="emblem">
          
          <div className="emblem-title">PMS</div>
        </div>
      </div>

      {/* Divider */}
      <div className="auth-divider" aria-hidden />

      {/* Right: compact sign-in */}
      <div className="auth-right">
        <form className="signin-card" onSubmit={handleSubmit}>
          <h1 className="signin-title">Sign in</h1>

          {error && <div className="signin-error">{error}</div>}

          <label className="signin-label" htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email"
            className="signin-input"
           
            value={form.email} onChange={onChange}
            autoComplete="username"
            required
          />

          <label className="signin-label" htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password"
            className="signin-input"
           
            value={form.password} onChange={onChange}
            autoComplete="current-password"
            required
          />

          <div className="signin-row">
            <button className="signin-btn" type="submit">Sign in</button>
            <button
              type="button"
              className="link-btn"
              onClick={() => alert('Ask your admin to reset your password.')}
            >
              forgot password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
