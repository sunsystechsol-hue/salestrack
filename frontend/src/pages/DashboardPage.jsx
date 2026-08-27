import React from 'react';

export default function DashboardPage({ user, onLogout, onNavigate }) {
  return (
    <div className="app-container" style={{ maxWidth: '900px' }}>
      <div className="brand-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h1 className="brand-title">KaushalSaathi Dashboard</h1>
        <p className="brand-subtitle">Phase 2 — Task, Lead & Sales Performance Tracker</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="user-card" style={{ marginTop: 0, cursor: 'pointer' }} onClick={() => onNavigate('leads')}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
            📋 Lead Management →
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {user?.role === 'COUNSELLOR'
              ? 'View and handle your assigned enquiries, call follow-ups, and statuses.'
              : 'View all enquiries, assign/reassign leads to counsellors, and track lead status.'}
          </p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="btn-secondary"
        style={{ marginTop: '2rem', maxWidth: '150px' }}
      >
        Sign Out
      </button>
    </div>
  );
}
