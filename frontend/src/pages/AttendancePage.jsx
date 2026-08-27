import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function AttendancePage({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workDateFilter, setWorkDateFilter] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceService.getAttendance({
        workDate: workDateFilter,
      });
      setRecords(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [workDateFilter]);

  const formatDuration = (totalMins) => {
    if (totalMins === null || totalMins === undefined) return 'Active Session';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m (${totalMins} mins)`;
  };

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Employee Attendance & Session History
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {isManagerOrAdmin
              ? 'Track employee login timestamps, logout records, and server-calculated working duration.'
              : 'View your login timestamps, logout history, and working duration.'}
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
          <LoadingState message="Loading attendance records..." />
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
                <th>Logout Time (IST)</th>
                <th>Working Duration</th>
                <th>Session Status</th>
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
                    {rec.logoutAt
                      ? new Date(rec.logoutAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td>
                    <strong style={{ color: rec.logoutAt ? 'var(--color-text-main)' : 'var(--color-primary)' }}>
                      {formatDuration(rec.totalMins)}
                    </strong>
                  </td>
                  <td>
                    {rec.logoutAt ? (
                      <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        COMPLETED
                      </span>
                    ) : (
                      <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                        ACTIVE SESSION
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
