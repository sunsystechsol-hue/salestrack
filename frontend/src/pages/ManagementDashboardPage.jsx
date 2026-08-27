import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function ManagementDashboardPage({ user, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [callReport, setCallReport] = useState(null);
  const [leadReport, setLeadReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range filter state
  const [range, setRange] = useState('TODAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const queryParams = { range, startDate, endDate };
      const [sumData, perfData, callsData, leadsData] = await Promise.all([
        reportService.getSummary(queryParams),
        reportService.getPerformance(queryParams),
        reportService.getCalls(queryParams),
        reportService.getLeads(),
      ]);

      setSummary(sumData.metrics || null);
      setPerformance(perfData.data || []);
      setCallReport(callsData.outcomes || null);
      setLeadReport(leadsData.statuses || null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range, startDate, endDate]);

  const metrics = summary || {};

  return (
    <div>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Executive Management Dashboard
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Real-time activity tracking, lead conversions, team presence, and counsellor performance metrics.
          </p>
        </div>

        {/* Date Filter & Refresh Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: '160px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>

          {range === 'CUSTOM' && (
            <>
              <input
                type="date"
                className="form-input"
                style={{ width: '135px', padding: '0.35rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '135px', padding: '0.35rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData()}
            title="Refresh Metrics"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {loading ? (
        <LoadingState message="Loading management intelligence metrics..." />
      ) : (
        <>
          {/* Executive KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Total Leads / New
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.3rem' }}>
                {metrics.totalLeads || 0}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', marginLeft: '0.4rem' }}>
                  ({metrics.newLeads || 0} new)
                </span>
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Calls Made
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '0.3rem' }}>
                {metrics.callsMade || 0}
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Converted Leads
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '0.3rem' }}>
                {metrics.convertedLeads || 0}
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Pending / Overdue Follow-ups
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '0.3rem' }}>
                {metrics.pendingFollowUps || 0}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', marginLeft: '0.4rem' }}>
                  ({metrics.overdueFollowUps || 0} overdue)
                </span>
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Active Tasks / Overdue
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', marginTop: '0.3rem' }}>
                {metrics.pendingTasks || 0}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', marginLeft: '0.4rem' }}>
                  ({metrics.overdueTasks || 0} overdue)
                </span>
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Team Live Presence
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a' }}>🟢 {metrics.employeesLiveActive || 0} Active</span>
                <span style={{ color: '#d97706' }}>🟡 {metrics.employeesInactiveIdle || 0} Idle</span>
                <span style={{ color: '#64748b' }}>⚪ {metrics.employeesLoggedOut || 0} Off</span>
              </div>
            </div>
          </div>

          {/* Counsellor Performance Comparison Table */}
          <div className="crm-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Counsellor Performance Comparison
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Real database metrics connecting employee attendance, call activity, and lead conversion rates.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate && onNavigate('reports')}
              >
                View Full Reports
              </button>
            </div>

            {performance.length === 0 ? (
              <EmptyState title="No active counsellors found" description="No performance metrics available for the selected period." />
            ) : (
              <div className="crm-table-container">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Counsellor</th>
                      <th>Presence Status</th>
                      <th>Assigned Leads</th>
                      <th>Calls Made</th>
                      <th>Interested</th>
                      <th>Inquiries</th>
                      <th>Follow-ups</th>
                      <th>Converted</th>
                      <th>Conversion Rate</th>
                      <th>Pending Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.userId}>
                        <td>
                          <strong style={{ color: 'var(--color-text-main)' }}>{p.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                        </td>
                        <td>
                          {p.isLiveActive ? (
                            <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                              🟢 LIVE ACTIVE
                            </span>
                          ) : p.presenceStatus === 'INACTIVE' ? (
                            <span className="badge-status" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                              🟡 INACTIVE
                            </span>
                          ) : (
                            <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                              ⚪ LOGGED OUT
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.leadsAssigned}</td>
                        <td>{p.callsMade}</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>{p.interested}</td>
                        <td>{p.inquiries}</td>
                        <td>{p.followUps}</td>
                        <td style={{ color: '#2563eb', fontWeight: 700 }}>{p.converted}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                              <div
                                style={{
                                  width: `${Math.min(p.conversionRate, 100)}%`,
                                  backgroundColor: p.conversionRate > 20 ? '#16a34a' : p.conversionRate > 10 ? '#2563eb' : '#d97706',
                                  height: '100%',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.conversionRate}%</span>
                          </div>
                        </td>
                        <td>{p.pendingTasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Visual Analytics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Call Outcome Distribution */}
            <div className="crm-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                Call Outcomes Distribution
              </h3>
              {callReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Object.entries(callReport).map(([outcome, count]) => {
                    const total = Object.values(callReport).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={outcome}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontWeight: 500 }}>{outcome.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ backgroundColor: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: outcome === 'INTERESTED' || outcome === 'CONVERTED' ? '#16a34a' : outcome === 'NOT_INTERESTED' ? '#dc2626' : '#2563eb',
                              height: '100%',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No call logs" description="No call activity recorded for this period." />
              )}
            </div>

            {/* Lead Status Distribution */}
            <div className="crm-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                Lead Status Distribution
              </h3>
              {leadReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Object.entries(leadReport).map(([status, count]) => {
                    const total = Object.values(leadReport).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontWeight: 500 }}>{status}</span>
                          <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ backgroundColor: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: status === 'CONVERTED' ? '#16a34a' : status === 'LOST' || status === 'NOT_INTERESTED' ? '#dc2626' : '#4f46e5',
                              height: '100%',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No leads found" description="No lead data available." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
