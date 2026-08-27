import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';

export default function DashboardPage({ user, onLogout, onNavigate }) {
  const [metrics, setMetrics] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

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

    return () => {
      isMounted = false;
    };
  }, []);

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
              {user?.role === 'COUNSELLOR'
                ? 'Overview of your assigned enquiries and follow-ups.'
                : 'Corporate overview of team leads, assignment workflow, and conversion progress.'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('leads')}>
            Manage Leads →
          </button>
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
