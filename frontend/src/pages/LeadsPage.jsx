import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function LeadsPage({ user, onNavigate }) {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counsellorFilter, setCounsellorFilter] = useState('');

  // Active counsellors for dropdown
  const [counsellors, setCounsellors] = useState([]);

  // Modal states
  const [selectedLead, setSelectedLead] = useState(null);
  const [assignCounsellorId, setAssignCounsellorId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // New Lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    course: '',
    city: '',
    notes: '',
  });

  const canManageAssignment = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await leadService.getLeads({
        page,
        limit: 20,
        search,
        status: statusFilter,
        assignedToId: counsellorFilter,
      });

      setLeads(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [statusFilter, counsellorFilter]);

  useEffect(() => {
    if (canManageAssignment) {
      leadService
        .getCounsellors()
        .then((data) => setCounsellors(data || []))
        .catch(() => {});
    }
  }, [canManageAssignment]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleOpenAssignModal = (lead) => {
    setSelectedLead(lead);
    setAssignCounsellorId(lead.assignedToId || '');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead || !assignCounsellorId) return;

    setModalSubmitting(true);
    try {
      if (selectedLead.assignedToId) {
        await leadService.reassignLead(selectedLead.id, assignCounsellorId);
      } else {
        await leadService.assignLead(selectedLead.id, assignCounsellorId);
      }
      setShowAssignModal(false);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      await leadService.createLead(newLead);
      setShowCreateModal(false);
      setNewLead({ name: '', phone: '', email: '', course: '', city: '', notes: '' });
      fetchLeads(1);
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header Toolbar & Primary Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Lead Directory</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {canManageAssignment
              ? 'View, search, assign, and track prospect enquiries across sales counsellors.'
              : 'View and track your assigned prospect enquiries.'}
          </p>
        </div>

        {canManageAssignment && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New Lead
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar Card */}
      <div className="toolbar-card">
        <form onSubmit={handleSearchSubmit} className="toolbar-grid">
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, phone, course, city, or response ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '170px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
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

          {canManageAssignment && (
            <div style={{ width: '190px' }}>
              <select
                className="form-select"
                value={counsellorFilter}
                onChange={(e) => setCounsellorFilter(e.target.value)}
              >
                <option value="">All Counsellors</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-secondary">
            Filter Results
          </button>
        </form>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Enterprise Data Table */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message="Fetching leads dataset..." />
        ) : leads.length === 0 ? (
          <EmptyState title="No leads match criteria" description="Try clearing search keywords or status filter." />
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Phone</th>
                <th>Course</th>
                <th>City</th>
                <th>Source</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong
                      style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                      onClick={() => onNavigate('lead_details', { id: lead.id })}
                    >
                      {lead.name}
                    </strong>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{lead.phone}</td>
                  <td>{lead.course || '—'}</td>
                  <td>{lead.city || '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td>
                    <StatusBadge status={lead.status} />
                  </td>
                  <td>
                    {lead.assignedTo?.name ? (
                      <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{lead.assignedTo.name}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate('lead_details', { id: lead.id })}
                      >
                        View
                      </button>
                      {canManageAssignment && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenAssignModal(lead)}
                        >
                          {lead.assignedToId ? 'Reassign' : 'Assign'}
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
      {!loading && leads.length > 0 && (
        <div className="pagination-container">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total} total records)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Assign / Reassign Modal */}
      <Modal
        isOpen={showAssignModal && !!selectedLead}
        onClose={() => setShowAssignModal(false)}
        title={selectedLead?.assignedToId ? 'Reassign Lead Record' : 'Assign Lead Record'}
      >
        <form onSubmit={handleAssignSubmit}>
          <p style={{ marginBottom: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Assigning Lead: <strong style={{ color: 'var(--color-text-main)' }}>{selectedLead?.name}</strong> ({selectedLead?.phone})
          </p>

          <FormField label="Select Target Sales Counsellor" required>
            <select
              className="form-select"
              value={assignCounsellorId}
              onChange={(e) => setAssignCounsellorId(e.target.value)}
              required
            >
              <option value="">-- Choose Active Counsellor --</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
              {modalSubmitting ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead Record"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Full Name" required>
              <input
                type="text"
                className="form-input"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Phone Number" required>
              <input
                type="text"
                className="form-input"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Email Address">
              <input
                type="email"
                className="form-input"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </FormField>

            <FormField label="Interested Course">
              <input
                type="text"
                className="form-input"
                value={newLead.course}
                onChange={(e) => setNewLead({ ...newLead, course: e.target.value })}
              />
            </FormField>

            <FormField label="City">
              <input
                type="text"
                className="form-input"
                value={newLead.city}
                onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Counsellor Notes">
            <textarea
              className="form-textarea"
              rows="3"
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              placeholder="Initial requirements, conversation background..."
            ></textarea>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
              {modalSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
