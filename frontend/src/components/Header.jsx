import React from 'react';

export default function Header({ user, title, onLogout }) {
  return (
    <header className="crm-header">
      <div className="header-title-section">
        <h2 className="header-page-title">{title}</h2>
      </div>

      <div className="header-actions">
        {user?.role && <span className={`role-pill role-pill-${user.role}`}>{user.role}</span>}
        <button
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
