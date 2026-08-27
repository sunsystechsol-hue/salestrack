import React, { useState, useEffect } from 'react';
import { followupService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function FollowUpsPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | TODAY | OVERDUE | COMPLETED
  const [followups, setFollowups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFollowups = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await followupService.getFollowUps({
        page,
        limit: 20,
        status: activeTab,
      });
      setFollowups(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups(1);
  }, [activeTab]);

  const handleMarkComplete = async (id) => {
    try {
      await followupService.completeFollowUp(id);
      fetchFollowups(pagination.page);
    } catch (err) {
      alert(`Failed to complete follow-up: ${err.message}`);
    }
  };

  const getTabBadge = (tabKey) => {
    switch (tabKey) {
      case 'OVERDUE':
        return { color: '#dc2626', bg: '#fee2e2' };
      case 'TODAY':
        return { color: '#d97706', bg: '#fef3c7' };
      case 'COMPLETED':
        return { color: '#16a34a', bg: '#dcfce7' };
      default:
        return { color: '#2563eb', bg: '#eff6ff' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Follow-up Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {user?.role === 'COUNSELLOR'
              ? 'Track scheduled, pending, and overdue follow-up calls for your assigned leads.'
              : 'Corporate tracking of pending, today’s, and overdue prospect follow-ups.'}
          </p>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="toolbar-card" style={{ padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['PENDING', 'TODAY', 'OVERDUE', 'COMPLETED'].map((tab) => {
            const badgeStyle = getTabBadge(tab);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.45rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  ...(isActive ? {} : { border: 'none' }),
                }}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Follow-ups Data Table */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message={`Fetching ${activeTab.toLowerCase()} follow-ups...`} />
        ) : followups.length === 0 ? (
          <EmptyState
            title={`No ${activeTab.toLowerCase()} follow-ups`}
            description={`No scheduled follow-ups found under the ${activeTab} filter.`}
          />
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Lead Prospect</th>
                <th>Course</th>
                <th>City</th>
                <th>Follow-up Date & Time (IST)</th>
                <th>Assigned Counsellor</th>
                <th>Call Outcome & Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong
                      style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                      onClick={() => onNavigate('lead_details', { id: item.leadId })}
                    >
                      {item.lead?.name || 'Unknown Lead'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {item.lead?.phone}
                    </div>
                  </td>
                  <td>{item.lead?.course || '—'}</td>
                  <td>{item.lead?.city || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    <strong style={{ color: activeTab === 'OVERDUE' ? '#dc2626' : 'var(--color-text-main)' }}>
                      {item.nextFollowUp ? new Date(item.nextFollowUp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>
                      {item.lead?.assignedTo?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '220px', whiteSpace: 'normal', fontSize: '0.8rem' }}>
                    <strong>{item.outcome ? item.outcome.replace(/_/g, ' ') : '—'}</strong>
                    {item.remarks && <div style={{ color: 'var(--color-text-muted)' }}>{item.remarks}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate('lead_details', { id: item.leadId })}
                      >
                        View Lead
                      </button>

                      {!item.isCompleted && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => handleMarkComplete(item.id)}
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && followups.length > 0 && (
        <div className="pagination-container">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total} total records)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchFollowups(pagination.page - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchFollowups(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
