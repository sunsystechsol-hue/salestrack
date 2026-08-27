import React, { useState, useEffect } from 'react';
import { callService } from '../services/api';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function CallsPage({ user, onNavigate }) {
  const [calls, setCalls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const fetchCalls = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await callService.getCalls({
        page,
        limit: 20,
        outcome: outcomeFilter,
      });
      setCalls(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(1);
  }, [outcomeFilter]);

  const formatOutcome = (outcome) => {
    if (!outcome) return '—';
    return outcome.replace(/_/g, ' ');
  };

  const getOutcomeBadgeStyle = (outcome) => {
    switch (outcome) {
      case 'INTERESTED':
      case 'CONVERTED':
        return { backgroundColor: '#dcfce7', color: '#15803d' };
      case 'NOT_INTERESTED':
      case 'WRONG_NUMBER':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      case 'FOLLOW_UP_REQUIRED':
      case 'CALL_BACK':
        return { backgroundColor: '#fef3c7', color: '#b45309' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Call Activity Log</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {user?.role === 'COUNSELLOR'
              ? 'View all call interactions logged for your assigned leads.'
              : 'Corporate overview of prospect call logs, call outcomes, and counsellor remarks.'}
          </p>
        </div>
      </div>

      {/* Outcome Filter Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-grid">
          <div style={{ width: '220px' }}>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>Filter Call Outcome</label>
            <select
              className="form-select"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
            >
              <option value="">All Call Outcomes</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="NOT_INTERESTED">NOT INTERESTED</option>
              <option value="FOLLOW_UP_REQUIRED">FOLLOW UP REQUIRED</option>
              <option value="INQUIRY">INQUIRY</option>
              <option value="CALL_BACK">CALL BACK</option>
              <option value="NO_RESPONSE">NO RESPONSE</option>
              <option value="WRONG_NUMBER">WRONG NUMBER</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Calls Table */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message="Loading call logs..." />
        ) : calls.length === 0 ? (
          <EmptyState title="No call logs found" description="No call activities match the selected outcome filter." />
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Lead Prospect</th>
                <th>Call Date & Time (IST)</th>
                <th>Duration</th>
                <th>Call Outcome</th>
                <th>Remarks</th>
                <th>Next Follow-up</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>
                    <strong
                      style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                      onClick={() => onNavigate('lead_details', { id: call.leadId })}
                    >
                      {call.lead?.name || 'Unknown Lead'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {call.lead?.phone}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {new Date(call.calledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td>{call.durationSec} secs ({Math.round(call.durationSec / 60)} mins)</td>
                  <td>
                    <span className="badge-status" style={getOutcomeBadgeStyle(call.outcome)}>
                      {formatOutcome(call.outcome)}
                    </span>
                  </td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'normal' }}>
                    {call.remarks || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {call.nextFollowUp ? (
                      new Date(call.nextFollowUp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{call.user?.name || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && calls.length > 0 && (
        <div className="pagination-container">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total} total records)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchCalls(pagination.page - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchCalls(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
