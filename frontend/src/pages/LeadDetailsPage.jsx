import React, { useState, useEffect } from 'react';
import { leadService, callService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { LoadingState } from '../components/LoadingState';

export default function LeadDetailsPage({ leadId, onNavigate }) {
  const [lead, setLead] = useState(null);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lead editing state
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Log Call Modal state
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [callForm, setCallForm] = useState({
    durationSec: 60,
    outcome: 'INTERESTED',
    remarks: '',
    nextFollowUp: '',
  });

  const fetchLeadDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [leadData, callData] = await Promise.all([
        leadService.getLeadById(leadId),
        callService.getCalls({ leadId, limit: 50 }),
      ]);
      setLead(leadData);
      setCalls(callData.data || []);
      setStatus(leadData.status || 'NEW');
      setNotes(leadData.notes || '');
      setNextFollowUp(leadData.nextFollowUp ? new Date(leadData.nextFollowUp).toISOString().slice(0, 16) : '');
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

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    setCallSubmitting(true);
    try {
      const payload = {
        leadId,
        durationSec: parseInt(callForm.durationSec, 10) || 0,
        outcome: callForm.outcome,
        remarks: callForm.remarks,
        nextFollowUp: callForm.nextFollowUp ? new Date(callForm.nextFollowUp).toISOString() : null,
      };

      await callService.createCall(payload);
      setShowLogCallModal(false);
      setCallForm({ durationSec: 60, outcome: 'INTERESTED', remarks: '', nextFollowUp: '' });
      fetchLeadDetails();
    } catch (err) {
      alert(`Failed to log call: ${err.message}`);
    } finally {
      setCallSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading lead record & call history..." />;
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
          <button className="btn btn-primary btn-sm" onClick={() => setShowLogCallModal(true)}>
            📞 Log Call Interaction
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status:</span>
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

          {/* Call History Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Call Log History ({calls.length})</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLogCallModal(true)}>
                + New Log
              </button>
            </div>

            {calls.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
                No calls logged for this lead yet.
              </p>
            ) : (
              <div className="crm-table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Date & Time (IST)</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Remarks</th>
                      <th>Next Follow-up</th>
                      <th>Counsellor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
                          {new Date(c.calledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td>{c.durationSec}s</td>
                        <td>
                          <span className="badge-status" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                            {c.outcome.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8rem' }}>
                          {c.remarks || '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
                          {c.nextFollowUp ? new Date(c.nextFollowUp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                        </td>
                        <td>{c.user?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

          {/* Scheduled Follow-up Summary Card */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Scheduled Follow-up</h3>
            </div>

            {lead.nextFollowUp ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Scheduled Date & Time:</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {new Date(lead.nextFollowUp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No follow-up date currently scheduled for this lead.
              </p>
            )}
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

      {/* Log Call Modal */}
      <Modal
        isOpen={showLogCallModal}
        onClose={() => setShowLogCallModal(false)}
        title={`Log Call Interaction for ${lead.name}`}
      >
        <form onSubmit={handleLogCallSubmit}>
          <FormField label="Call Outcome" required>
            <select
              className="form-select"
              value={callForm.outcome}
              onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
              required
            >
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
          </FormField>

          <FormField label="Call Duration (seconds)" required>
            <input
              type="number"
              min="0"
              className="form-input"
              value={callForm.durationSec}
              onChange={(e) => setCallForm({ ...callForm, durationSec: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Next Scheduled Follow-up (optional)">
            <input
              type="datetime-local"
              className="form-input"
              value={callForm.nextFollowUp}
              onChange={(e) => setCallForm({ ...callForm, nextFollowUp: e.target.value })}
            />
          </FormField>

          <FormField label="Remarks & Interaction Details">
            <textarea
              className="form-textarea"
              rows="3"
              value={callForm.remarks}
              onChange={(e) => setCallForm({ ...callForm, remarks: e.target.value })}
              placeholder="Enter key conversation points, requirements, or follow-up reason..."
            ></textarea>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowLogCallModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={callSubmitting}>
              {callSubmitting ? 'Logging...' : 'Save Call Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
