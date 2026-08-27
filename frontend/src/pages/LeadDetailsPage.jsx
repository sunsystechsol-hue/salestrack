import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import { LoadingState } from '../components/LoadingState';

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
      setSuccessMsg('Lead status updated successfully');
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
      setSuccessMsg('Follow-up details and notes saved successfully');
    } catch (err) {
      alert(`Failed to save notes: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading lead record details..." />;
  }

  if (error || !lead) {
    return (
      <div>
        <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
          {error || 'Lead record not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('leads')}>
          ← Back to Lead Directory
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Action Toolbar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leads')}>
          ← Back to Lead Directory
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Status:</span>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {successMsg && <div className="alert-banner alert-success" style={{ marginBottom: '1.25rem' }}>{successMsg}</div>}

      {/* Record Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Contact Details Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">{lead.name}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID: {lead.id.slice(0, 8)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Phone Number</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {lead.phone}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email Address</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                  {lead.email || '—'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Interested Course</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                  {lead.course || '—'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>City / Location</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                  {lead.city || '—'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Lead Source</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                  {lead.source || '—'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Google Form Response ID</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {lead.formResponseId || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up & Notes Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Follow-up Schedule & Notes</h3>
            </div>

            <form onSubmit={handleSaveNotes}>
              <FormField label="Next Follow-up Date & Time">
                <input
                  type="datetime-local"
                  className="form-input"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                />
              </FormField>

              <FormField label="Counsellor Interaction Notes">
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record call discussions, prospect requirements, or next steps..."
                ></textarea>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Follow-up Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Updater Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Status Management</h3>
            </div>

            <FormField label="Update Lead Status">
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
            </FormField>
          </div>

          {/* Assignment Info Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Assigned Counsellor</h3>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                {lead.assignedTo?.name || 'Unassigned'}
              </p>
              {lead.assignedTo?.email && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  {lead.assignedTo.email}
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Created: {new Date(lead.createdAt).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Updated: {new Date(lead.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
