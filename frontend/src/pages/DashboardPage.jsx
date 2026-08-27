import React from 'react';

export default function DashboardPage({ user, onLogout }) {
  return (
    <div className="dashboard-container">
      <div className="brand-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h1 className="brand-title">KaushalSaathi Dashboard</h1>
        <p className="brand-subtitle">Phase 1 Foundation — Authentication & Core API</p>
      </div>

      <div className="user-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          Welcome, {user?.name || 'User'}
          <span className="badge">{user?.role || 'COUNSELLOR'}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Authenticated via JWT token stored in browser localStorage.
        </p>
      </div>

      <button
        onClick={onLogout}
        className="btn-primary"
        style={{ marginTop: '2rem', maxWidth: '200px' }}
      >
        Sign Out
      </button>
    </div>
  );
}
