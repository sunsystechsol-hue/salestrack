import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';

export default function LeadDetailsPage({ leadId, onNavigate }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLeadDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await leadService.getLeadById(leadId);
      setLead(data);
      setStatus(data.status || 'NEW');
      setNotes(data.notes || '');
      setNextFollowUp(data.nextFollowUp ? new Date(data.nextFollowUp).toISOString().slice(0, 16) : '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setUpdating(true);
    setSuccessMsg('');
    try {
      const updated = await leadService.updateStatus(leadId, newStatus);
      setLead(updated);
      setSuccessMsg('Status updated successfully');
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');
    try {
      const payload = {
        notes,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      };
      const updated = await leadService.updateLead(leadId, payload);
      setLead(updated);
      setSuccessMsg('Lead notes and follow-up saved successfully');
    } catch (err) {
      alert(`Failed to save notes: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '3rem' }}>
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="app-container">
        <div className="error-banner">{error || 'Lead not found'}</div>
        <button className="btn-secondary" onClick={() => onNavigate('leads')}>
          ← Back to Leads List
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="controls-bar" style={{ marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => onNavigate('leads')}>
          ← Back to Leads List
        </button>
        <div>
          <span className={`badge-status badge-${lead.status}`}>{lead.status}</span>
        </div>
      </div>

      {successMsg && <div className="error-banner" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', color: '#4ade80' }}>{successMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Details */}
        <div>
          <div className="user-card" style={{ marginTop: 0 }}>
            <h2 className="brand-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'left' }}>
              {lead.name}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</p>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{lead.phone}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address</p>
                <p style={{ fontSize: '1rem' }}>{lead.email || '—'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interested Course</p>
                <p style={{ fontSize: '1rem' }}>{lead.course || '—'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>City</p>
                <p style={{ fontSize: '1rem' }}>{lead.city || '—'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lead Source</p>
                <p style={{ fontSize: '1rem' }}>{lead.source || '—'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Google Form Response ID</p>
                <p style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{lead.formResponseId || '—'}</p>
              </div>
            </div>
          </div>

          {/* Notes & Follow-up Form */}
          <div className="user-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Follow-up & Notes</h3>
            <form onSubmit={handleSaveNotes}>
              <div className="form-group">
                <label className="form-label">Next Follow-up Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Counsellor Notes</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details about call conversations, requirements, or status changes..."
                ></textarea>
              </div>

              <button type="submit" className="btn-primary" disabled={updating}>
                {updating ? 'Saving...' : 'Save Notes & Follow-up'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Status & Assignment */}
        <div>
          <div className="user-card" style={{ marginTop: 0 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Lead Management</h3>

            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={status} onChange={handleStatusChange} disabled={updating}>
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="INTERESTED">INTERESTED</option>
                <option value="NOT_INTERESTED">NOT INTERESTED</option>
                <option value="FOLLOW_UP">FOLLOW UP</option>
                <option value="INQUIRY">INQUIRY</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="LOST">LOST</option>
              </select>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Assigned Counsellor</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                {lead.assignedTo?.name || 'Unassigned'}
              </p>
              {lead.assignedTo?.email && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lead.assignedTo.email}</p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Created: {new Date(lead.createdAt).toLocaleString()}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Updated: {new Date(lead.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
