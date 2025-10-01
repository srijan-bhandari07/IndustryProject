import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminStore } from '../context/AdminStore';
import './auth.css';

export default function Login() {
  const { login } = useAdminStore(); // <-- use store login helper
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = login(form.email, form.password);
    if (!res.ok) {
      setError(res.error || 'Invalid email or password.');
      return;
    }

    const u = res.user;
    navigate(u.role === 'admin' ? '/admin' : '/', { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <i className="fas fa-industry"></i>
          <h1>AI Predictive Maintenance</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="login-input"
            value={form.email}
            onChange={onChange}
            autoComplete="username"
          />

          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="login-input"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
          />

          <button className="login-btn" type="submit">Sign in</button>
        </form>

      
      </div>
    </div>
  );
}
