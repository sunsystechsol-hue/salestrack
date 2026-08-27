import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function ReportsPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Common filters
  const [range, setRange] = useState('TODAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Tab Data
  const [performanceData, setPerformanceData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [callData, setCallData] = useState(null);
  const [followupData, setFollowupData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { range, startDate, endDate, page, limit: 15 };

      if (activeTab === 'performance') {
        const res = await reportService.getPerformance(params);
        setPerformanceData(res.data || []);
      } else if (activeTab === 'attendance') {
        const res = await reportService.getAttendance(params);
        setAttendanceData(res.data || []);
        setPagination(res.pagination || { page: 1, totalPages: 1 });
      } else if (activeTab === 'calls') {
        const res = await reportService.getCalls(params);
        setCallData(res.outcomes || null);
      } else if (activeTab === 'followups') {
        const res = await reportService.getFollowups(params);
        setFollowupData(res.data || []);
        setPagination(res.pagination || { page: 1, totalPages: 1 });
      } else if (activeTab === 'tasks') {
        const res = await reportService.getTasks(params);
        setTaskData(res.data || []);
        setPagination(res.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, range, startDate, endDate, page]);

  const handleExportCSV = () => {
    const url = reportService.exportCSVUrl(activeTab, { range, startDate, endDate });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Top Header & Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Management Reports & Business Intelligence
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Detailed breakdown of employee activities, attendance presence logs, call outcomes, follow-ups, and tasks.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            📥 Export CSV Report
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="crm-card" style={{ padding: '0.5rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        <button
          className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => { setActiveTab('performance'); setPage(1); }}
        >
          Counsellor Performance
        </button>
        <button
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => { setActiveTab('attendance'); setPage(1); }}
        >
          Attendance & Live Presence
        </button>
        <button
          className={`btn ${activeTab === 'calls' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => { setActiveTab('calls'); setPage(1); }}
        >
          Call Outcomes Report
        </button>
        <button
          className={`btn ${activeTab === 'followups' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => { setActiveTab('followups'); setPage(1); }}
        >
          Follow-up Directory
        </button>
        <button
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => { setActiveTab('tasks'); setPage(1); }}
        >
          Task Management Report
        </button>
      </div>

      {/* Toolbar Filter */}
      <div className="toolbar-card" style={{ marginBottom: '1.25rem' }}>
        <div className="toolbar-grid" style={{ alignItems: 'center' }}>
          <div style={{ width: '180px' }}>
            <label className="form-label">Date Range</label>
            <select className="form-input" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {range === 'CUSTOM' && (
            <>
              <div style={{ width: '140px' }}>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div style={{ width: '140px' }}>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Main Report Table Content */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message={`Generating ${activeTab} report...`} />
        ) : activeTab === 'performance' ? (
          performanceData.length === 0 ? (
            <EmptyState title="No performance records" description="No data found for selected period." />
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Counsellor</th>
                  <th>Presence Status</th>
                  <th>Leads Assigned</th>
                  <th>Calls Made</th>
                  <th>Interested</th>
                  <th>Follow-ups</th>
                  <th>Converted</th>
                  <th>Conversion Rate</th>
                  <th>Pending Tasks</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((p) => (
                  <tr key={p.userId}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                    </td>
                    <td>
                      {p.isLiveActive ? (
                        <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>🟢 LIVE ACTIVE</span>
                      ) : p.presenceStatus === 'INACTIVE' ? (
                        <span className="badge-status" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>🟡 INACTIVE</span>
                      ) : (
                        <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>⚪ LOGGED OUT</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.leadsAssigned}</td>
                    <td>{p.callsMade}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{p.interested}</td>
                    <td>{p.followUps}</td>
                    <td style={{ color: '#2563eb', fontWeight: 700 }}>{p.converted}</td>
                    <td style={{ fontWeight: 700 }}>{p.conversionRate}%</td>
                    <td>{p.pendingTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'attendance' ? (
          attendanceData.length === 0 ? (
            <EmptyState title="No attendance logs" description="No attendance records recorded for this filter." />
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Work Date</th>
                  <th>Login Time (IST)</th>
                  <th>Logout / Last Seen</th>
                  <th>Working Duration</th>
                  <th>Presence Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.user?.name || '—'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.user?.email}</div>
                    </td>
                    <td><span className={`role-pill role-pill-${r.user?.role}`}>{r.user?.role}</span></td>
                    <td>{new Date(r.workDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    <td style={{ fontFamily: 'monospace' }}>{new Date(r.loginAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.logoutAt ? new Date(r.logoutAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : 'Active Session'}</td>
                    <td><strong>{r.totalMins || r.liveWorkingMins || 0} mins</strong></td>
                    <td>
                      {r.isLiveActive ? (
                        <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>🟢 LIVE ACTIVE</span>
                      ) : r.presenceStatus === 'INACTIVE' ? (
                        <span className="badge-status" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>🟡 INACTIVE</span>
                      ) : (
                        <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>⚪ LOGGED OUT</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'calls' ? (
          !callData ? (
            <EmptyState title="No calls recorded" description="No call outcome logs available for selected date range." />
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Call Outcome</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(callData).map(([outcome, count]) => {
                  const total = Object.values(callData).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={outcome}>
                      <td style={{ fontWeight: 600 }}>{outcome.replace(/_/g, ' ')}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{count}</td>
                      <td>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : activeTab === 'followups' ? (
          followupData.length === 0 ? (
            <EmptyState title="No follow-ups" description="No follow-up schedules found." />
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Course</th>
                  <th>Counsellor</th>
                  <th>Follow-up Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {followupData.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.lead?.name || '—'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{f.lead?.phone}</div>
                    </td>
                    <td>{f.lead?.course || '—'}</td>
                    <td>{f.user?.name || f.lead?.assignedTo?.name || '—'}</td>
                    <td>{new Date(f.nextFollowUp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    <td>
                      {f.isCompleted ? (
                        <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>COMPLETED</span>
                      ) : f.isOverdue ? (
                        <span className="badge-status badge-lost">OVERDUE</span>
                      ) : (
                        <span className="badge-status badge-in-progress">PENDING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'tasks' ? (
          taskData.length === 0 ? (
            <EmptyState title="No tasks found" description="No tasks created in system." />
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned Employee</th>
                  <th>Linked Lead</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {taskData.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                      {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.description}</div>}
                    </td>
                    <td>{t.user?.name}</td>
                    <td>{t.lead ? t.lead.name : '—'}</td>
                    <td>{new Date(t.dueAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    <td>
                      <span className={`badge-status badge-${t.status.toLowerCase().replace(/_/g, '-')}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}
      </div>

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
