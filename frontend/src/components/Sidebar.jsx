import React from 'react';

export default function Sidebar({ user, currentPage, onNavigate }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="crm-sidebar">
      {/* Brand Section */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">KS</div>
        <div>
          <h1 className="brand-text">KaushalSaathi</h1>
          <p className="brand-subtext">Sales Tracker CRM</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav">
        <span className="nav-group-label">Core Navigation</span>

        <div
          className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <span className="sidebar-link-icon">📊</span>
          <span>Dashboard</span>
        </div>

        <div
          className={`sidebar-link ${currentPage === 'leads' || currentPage === 'lead_details' ? 'active' : ''}`}
          onClick={() => onNavigate('leads')}
        >
          <span className="sidebar-link-icon">📋</span>
          <span>Lead Management</span>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info-text">
            <p className="user-info-name">{user?.name || 'User'}</p>
            <p className="user-info-role">{user?.role || 'COUNSELLOR'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
