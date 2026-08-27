import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';

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
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await leadService.createLead(newLead);
      setShowCreateModal(false);
      setNewLead({ name: '', phone: '', email: '', course: '', city: '', notes: '' });
      fetchLeads(1);
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      <div className="controls-bar">
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            Lead Management
          </h1>
          <p className="brand-subtitle">Phase 2 — Leads Overview & Workflow</p>
        </div>

        {canManageAssignment && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New Lead
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <form onSubmit={handleSearchSubmit} className="controls-bar" style={{ background: 'rgba(15,23,42,0.4)', padding: '1rem', borderRadius: '12px' }}>
        <div className="filters-group">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by name, phone, course, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: '160px' }}
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

          {canManageAssignment && (
            <select
              className="form-select"
              style={{ width: '180px' }}
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
          )}

          <button type="submit" className="btn-secondary">
            Search
          </button>
        </div>
      </form>

      {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

      {/* Leads Table */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No leads found matching criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
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
                      style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                      onClick={() => onNavigate('lead_details', { id: lead.id })}
                    >
                      {lead.name}
                    </strong>
                  </td>
                  <td>{lead.phone}</td>
                  <td>{lead.course || '—'}</td>
                  <td>{lead.city || '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td>
                    <span className={`badge-status badge-${lead.status}`}>{lead.status}</span>
                  </td>
                  <td>{lead.assignedTo?.name || <span style={{ opacity: 0.5 }}>Unassigned</span>}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                      onClick={() => onNavigate('lead_details', { id: lead.id })}
                    >
                      View
                    </button>
                    {canManageAssignment && (
                      <button
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleOpenAssignModal(lead)}
                      >
                        {lead.assignedToId ? 'Reassign' : 'Assign'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <div>
          Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total leads)
        </div>
        <div className="pagination-controls">
          <button
            className="btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => fetchLeads(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchLeads(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Assign/Reassign Modal */}
      {showAssignModal && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedLead.assignedToId ? 'Reassign Lead' : 'Assign Lead'}</h3>
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Lead: <strong>{selectedLead.name}</strong> ({selectedLead.phone})
              </p>
              <div className="form-group">
                <label className="form-label">Select Active Counsellor</label>
                <select
                  className="form-select"
                  value={assignCounsellorId}
                  onChange={(e) => setAssignCounsellorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Counsellor --</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Assignment</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create New Lead</h3>
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLead.course}
                    onChange={(e) => setNewLead({ ...newLead, course: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Lead</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
