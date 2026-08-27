import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function AttendancePage({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workDateFilter, setWorkDateFilter] = useState('');

  const fetchAttendance = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await attendanceService.getAttendance({
        workDate: workDateFilter,
      });
      setRecords(data.data || []);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    // Auto-refresh presence every 15 seconds
    const interval = setInterval(() => {
      fetchAttendance(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [workDateFilter]);

  const formatDuration = (totalMins, loginAt, logoutAt) => {
    let mins = totalMins;
    if (mins === null || mins === undefined) {
      if (loginAt && !logoutAt) {
        mins = Math.max(0, Math.round((new Date().getTime() - new Date(loginAt).getTime()) / 60000));
      } else {
        return '—';
      }
    }
    const hrs = Math.floor(mins / 60);
    const remainderMins = mins % 60;
    return `${hrs}h ${remainderMins}m (${mins} mins)`;
  };

  const renderPresenceBadge = (rec) => {
    if (rec.logoutAt || rec.presenceStatus === 'LOGGED_OUT') {
      return (
        <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ height: '7px', width: '7px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
          LOGGED OUT
        </span>
      );
    }

    if (rec.isLiveActive || rec.presenceStatus === 'ACTIVE') {
      return (
        <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ height: '7px', width: '7px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 2s infinite' }}></span>
          LIVE ACTIVE
        </span>
      );
    }

    return (
      <span className="badge-status" style={{ backgroundColor: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ height: '7px', width: '7px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
        INACTIVE / IDLE
      </span>
    );
  };

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Live Employee Presence & Attendance Tracking
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {isManagerOrAdmin
              ? 'Real-time employee presence status, heartbeat activity, login timestamps, and working time.'
              : 'Real-time view of your current session presence, login timestamps, and live working time.'}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-grid">
          <div style={{ width: '220px' }}>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>Filter Work Date</label>
            <input
              type="date"
              className="form-input"
              value={workDateFilter}
              onChange={(e) => setWorkDateFilter(e.target.value)}
            />
          </div>
          {workDateFilter && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1.2rem' }}
              onClick={() => setWorkDateFilter('')}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Attendance Table */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message="Loading presence and attendance records..." />
        ) : records.length === 0 ? (
          <EmptyState title="No attendance records found" description="No login sessions recorded for the selected filter." />
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                {isManagerOrAdmin && <th>Employee Name</th>}
                {isManagerOrAdmin && <th>Role</th>}
                <th>Work Date</th>
                <th>Login Time (IST)</th>
                <th>Last Heartbeat / Logout</th>
                <th>Live Working Time</th>
                <th>Presence Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  {isManagerOrAdmin && (
                    <td>
                      <strong style={{ color: 'var(--color-text-main)' }}>{rec.user?.name || '—'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.user?.email}</div>
                    </td>
                  )}
                  {isManagerOrAdmin && (
                    <td>
                      <span className={`role-pill role-pill-${rec.user?.role}`}>{rec.user?.role}</span>
                    </td>
                  )}
                  <td style={{ fontWeight: 500 }}>
                    {new Date(rec.workDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {new Date(rec.loginAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {rec.logoutAt ? (
                      `Logout: ${new Date(rec.logoutAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}`
                    ) : rec.lastSeenAt ? (
                      `Active: ${new Date(rec.lastSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <strong style={{ color: rec.logoutAt ? 'var(--color-text-main)' : 'var(--color-primary)' }}>
                      {formatDuration(rec.totalMins || rec.liveWorkingMins, rec.loginAt, rec.logoutAt)}
                    </strong>
                  </td>
                  <td>{renderPresenceBadge(rec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
