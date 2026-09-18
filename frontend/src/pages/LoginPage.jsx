import React, { useState } from 'react';
import FormField from '../components/FormField';
import { authService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);

      // Store JWT token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-logo">KS</div>
          <h1 className="login-brand-title">KaushalSaathi CRM</h1>
          <p className="login-brand-subtitle">Task, Lead & Sales Tracker Platform</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.4rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Demo Credentials (1-Click Fill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', textAlign: 'center', fontWeight: 600 }}
              onClick={() => handleQuickFill('admin@kaushalsaathi.com', 'Admin@12345')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', textAlign: 'center', fontWeight: 600 }}
              onClick={() => handleQuickFill('manager@kaushalsaathi.com', 'Manager@12345')}
            >
              👔 Manager
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', textAlign: 'center', fontWeight: 600 }}
              onClick={() => handleQuickFill('counsellor@kaushalsaathi.com', 'Counsellor@12345')}
            >
              🎧 Counsellor
            </button>
          </div>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <FormField label="Work Email Address" required>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kaushalsaathi.com"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Password" required>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </FormField>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          <strong>Default Passwords:</strong><br />
          • Admin: <code>Admin@12345</code> or <code>AdminPassword123!</code><br />
          • Manager: <code>Manager@12345</code><br />
          • Counsellor: <code>Counsellor@12345</code>
        </div>
      </div>
    </div>
  );
}
