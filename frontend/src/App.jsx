import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailsPage from './pages/LeadDetailsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    const token = localStorage.getItem('auth_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('user_info');
        localStorage.removeItem('auth_token');
      }
    }

    const handleAuthExpired = () => {
      setUser(null);
      setCurrentPage('login');
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page, params = {}) => {
    if (params.id) {
      setSelectedLeadId(params.id);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <nav className="nav-bar">
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => handleNavigate('dashboard')}>
          KaushalSaathi Tracker
        </div>
        <div className="nav-links">
          <span
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            Dashboard
          </span>
          <span
            className={`nav-item ${currentPage === 'leads' || currentPage === 'lead_details' ? 'active' : ''}`}
            onClick={() => handleNavigate('leads')}
          >
            Lead Management
          </span>
          <span className="nav-item" onClick={handleLogout} style={{ color: '#f87171' }}>
            Logout ({user.name})
          </span>
        </div>
      </nav>

      {currentPage === 'dashboard' && (
        <DashboardPage user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {currentPage === 'leads' && (
        <LeadsPage user={user} onNavigate={handleNavigate} />
      )}

      {currentPage === 'lead_details' && selectedLeadId && (
        <LeadDetailsPage leadId={selectedLeadId} onNavigate={handleNavigate} />
      )}
    </>
  );
}
