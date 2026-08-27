import React, { useState, useEffect } from 'react';
import { leadService, dashboardService, taskService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';

export default function DashboardPage({ user, onLogout, onNavigate }) {
  const isCounsellor = user?.role === 'COUNSELLOR';

  // Counsellor dashboard state
  const [counsellorData, setCounsellorData] = useState(null);

  // Admin/Manager overview state
  const [metrics, setMetrics] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [recentLeads, setRecentLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    if (isCounsellor) {
      dashboardService
        .getCounsellorDashboard()
        .then((data) => {
          if (isMounted) setCounsellorData(data);
        })
        .catch((err) => {
          if (isMounted) setError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      leadService
        .getLeads({ limit: 100, page: 1 })
        .then((res) => {
          if (!isMounted) return;
          const leads = res.data || [];
          const total = res.pagination?.total || leads.length;
          const newCount = leads.filter((l) => l.status === 'NEW').length;
          const contactedCount = leads.filter((l) => l.status === 'CONTACTED' || l.status === 'FOLLOW_UP').length;
          const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;

          setMetrics({
            total,
            new: newCount,
            contacted: contactedCount,
            converted: convertedCount,
          });

          setRecentLeads(leads.slice(0, 5));
        })
        .catch((err) => {
          if (isMounted) setError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleTaskStatusToggle = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      const updated = await dashboardService.getCounsellorDashboard();
      setCounsellorData(updated);
    } catch (err) {
      alert(`Failed to update task status: ${err.message}`);
    }
  };

  const formatDuration = (totalMins) => {
    if (totalMins === null || totalMins === undefined) return 'Active Session';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  // ----------------------------------------------------
  // COUNSELLOR DASHBOARD VIEW
  // ----------------------------------------------------
  if (isCounsellor) {
    const m = counsellorData?.metrics || {};
    const att = counsellorData?.attendance || {};
    const lists = counsellorData?.lists || {};

    return (
      <div>
        {/* Welcome Header */}
        <div className="crm-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Good day, {user?.name}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Counsellor Performance Dashboard — Today's Date: <strong>{counsellorData?.date || 'Today'}</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge-status" style={{ backgroundColor: att.logoutAt ? '#f1f5f9' : '#dcfce7', color: att.logoutAt ? '#475569' : '#15803d', fontSize: '0.8rem' }}>
                {att.logoutAt ? 'SESSION LOGGED OUT' : 'SESSION ACTIVE'}
              </span>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                Working Time: <strong style={{ color: '#ffffff' }}>{formatDuration(att.totalMins)}</strong>
              </p>
            </div>
          </div>
        </div>

        {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        {loading ? (
          <LoadingState message="Calculating today's real performance metrics..." />
        ) : (
          <>
            {/* Real Counsellor Metrics Grid (12 Metrics) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="metric-card">
                <span className="metric-label">Leads Assigned</span>
                <span className="metric-value">{m.leadsAssigned}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #2563eb' }}>
                <span className="metric-label">Calls Made</span>
                <span className="metric-value">{m.callsMade}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <span className="metric-label">Interested Calls</span>
                <span className="metric-value">{m.interested}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #d97706' }}>
                <span className="metric-label">Follow-ups</span>
                <span className="metric-value">{m.followUps}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
                <span className="metric-label">Inquiries</span>
                <span className="metric-value">{m.inquiries}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
                <span className="metric-label">Not Interested</span>
                <span className="metric-value">{m.notInterested}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #9333ea' }}>
                <span className="metric-label">No Response</span>
                <span className="metric-value">{m.noResponse}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #15803d' }}>
                <span className="metric-label">Converted</span>
                <span className="metric-value">{m.converted}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <span className="metric-label">Pending Tasks</span>
                <span className="metric-value">{m.pendingTasks}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <span className="metric-label">Completed Tasks</span>
                <span className="metric-value">{m.completedTasks}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
                <span className="metric-label">Overdue Tasks</span>
                <span className="metric-value">{m.overdueTasks}</span>
              </div>
              <div className="metric-card" style={{ borderLeft: '4px solid #475569' }}>
                <span className="metric-label">Session Duration</span>
                <span className="metric-value" style={{ fontSize: '1.1rem', marginTop: '0.4rem' }}>
                  {formatDuration(att.totalMins)}
                </span>
              </div>
            </div>

            {/* Split Section: Today's Tasks & Recent Assigned Leads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Tasks Summary */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <h3 className="crm-card-title">My Tasks & Action Items</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tasks')}>
                    View All Tasks →
                  </button>
                </div>

                {!lists.todaysTasks || lists.todaysTasks.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                    No pending tasks scheduled for today.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {lists.todaysTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong
                            style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                            onClick={() => onNavigate('task_details', { id: t.id })}
                          >
                            {t.title}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            Due: {new Date(t.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            {t.lead && ` • Prospect: ${t.lead.name}`}
                          </div>
                        </div>
                        <button
                          className={`btn btn-sm ${t.status === 'COMPLETED' ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => handleTaskStatusToggle(t.id, t.status)}
                        >
                          {t.status === 'COMPLETED' ? '✓ Done' : 'Mark Done'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Assigned Leads */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <h3 className="crm-card-title">My Assigned Leads</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leads')}>
                    View Lead Directory →
                  </button>
                </div>

                {!lists.recentLeads || lists.recentLeads.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                    No leads currently assigned.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {lists.recentLeads.map((l) => (
                      <div
                        key={l.id}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong
                            style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                            onClick={() => onNavigate('lead_details', { id: l.id })}
                          >
                            {l.name}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            {l.course || 'No course'} • {l.phone}
                          </div>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // ADMIN / MANAGER OVERVIEW VIEW
  // ----------------------------------------------------
  return (
    <div>
      {/* Welcome Banner Card */}
      <div className="crm-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Corporate overview of team leads, task assignments, and conversion progress.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('tasks')}>
              Manage Tasks →
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('leads')}>
              Manage Leads →
            </button>
          </div>
        </div>
      </div>

      {/* Real Summary Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Leads</span>
          <span className="metric-value">{loading ? '—' : metrics.total}</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <span className="metric-label">New Enquiries</span>
          <span className="metric-value">{loading ? '—' : metrics.new}</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="metric-label">In Contact / Follow-up</span>
          <span className="metric-value">{loading ? '—' : metrics.contacted}</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #22c55e' }}>
          <span className="metric-label">Converted Leads</span>
          <span className="metric-value">{loading ? '—' : metrics.converted}</span>
        </div>
      </div>

      {/* Recent Leads Table Card */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h3 className="crm-card-title">Recent Lead Activity</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leads')}>
            View All Leads
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading summary activity..." />
        ) : error ? (
          <div className="alert-banner alert-error">{error}</div>
        ) : recentLeads.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No recent lead activity recorded.
          </p>
        ) : (
          <div className="crm-table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Contact Phone</th>
                  <th>Course</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Assigned Counsellor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong
                        style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onNavigate('lead_details', { id: lead.id })}
                      >
                        {lead.name}
                      </strong>
                    </td>
                    <td>{lead.phone}</td>
                    <td>{lead.course || '—'}</td>
                    <td>{lead.city || '—'}</td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td>{lead.assignedTo?.name || <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate('lead_details', { id: lead.id })}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
