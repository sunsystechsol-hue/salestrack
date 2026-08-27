import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import AttendancePage from './pages/AttendancePage';
import CallsPage from './pages/CallsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { attendanceService } from './services/api';

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

  const handleLogout = async () => {
    try {
      await attendanceService.logout();
    } catch (err) {
      console.warn('Logout attendance recording error:', err.message);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      setUser(null);
      setCurrentPage('login');
    }
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

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Executive Overview';
      case 'leads':
        return 'Lead Directory';
      case 'lead_details':
        return 'Lead Record Details';
      case 'attendance':
        return 'Employee Attendance & Session Log';
      case 'calls':
        return 'Call Activity Logs';
      case 'followups':
        return 'Follow-up Management';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="main-wrapper">
        <Header user={user} title={getPageTitle()} onLogout={handleLogout} />
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <DashboardPage user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
          )}

          {currentPage === 'leads' && (
            <LeadsPage user={user} onNavigate={handleNavigate} />
          )}

          {currentPage === 'lead_details' && selectedLeadId && (
            <LeadDetailsPage leadId={selectedLeadId} onNavigate={handleNavigate} />
          )}

          {currentPage === 'attendance' && (
            <AttendancePage user={user} />
          )}

          {currentPage === 'calls' && (
            <CallsPage user={user} onNavigate={handleNavigate} />
          )}

          {currentPage === 'followups' && (
            <FollowUpsPage user={user} onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}
