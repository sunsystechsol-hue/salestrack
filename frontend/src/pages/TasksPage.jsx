import React, { useState, useEffect } from 'react';
import { taskService, leadService } from '../services/api';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { LoadingState, EmptyState } from '../components/LoadingState';

export default function TasksPage({ user, onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dueFilter, setDueFilter] = useState('');

  // Modals & Counsellors list
  const [counsellors, setCounsellors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    dueAt: '',
    userId: '',
    leadId: '',
  });
  const [reassignUserId, setReassignUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchTasks = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getTasks({
        page,
        limit: 20,
        search,
        status: statusFilter,
        due: dueFilter,
      });
      setTasks(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    if (!isAdminOrManager) return;
    try {
      const [counsellorData, leadData] = await Promise.all([
        leadService.getCounsellors(),
        leadService.getLeads({ limit: 100 }),
      ]);
      setCounsellors(counsellorData || []);
      setLeads(leadData.data || []);
    } catch (err) {
      console.warn('Failed to load counsellors/leads for task assignment:', err.message);
    }
  };

  useEffect(() => {
    fetchTasks(1);
    fetchAuxiliaryData();
  }, [statusFilter, dueFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks(1);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      fetchTasks(pagination.page);
    } catch (err) {
      alert(`Failed to update task status: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: createForm.title,
        description: createForm.description || null,
        dueAt: new Date(createForm.dueAt).toISOString(),
        userId: createForm.userId,
        leadId: createForm.leadId || null,
      };

      await taskService.createTask(payload);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', dueAt: '', userId: '', leadId: '' });
      fetchTasks(1);
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask || !reassignUserId) return;
    setSubmitting(true);
    try {
      await taskService.reassignTask(selectedTask.id, reassignUserId);
      setShowReassignModal(false);
      setSelectedTask(null);
      setReassignUserId('');
      fetchTasks(pagination.page);
    } catch (err) {
      alert(`Failed to reassign task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { backgroundColor: '#dcfce7', color: '#15803d' };
      case 'IN_PROGRESS':
        return { backgroundColor: '#eff6ff', color: '#1d4ed8' };
      case 'CANCELLED':
        return { backgroundColor: '#f1f5f9', color: '#64748b' };
      default: // PENDING
        return { backgroundColor: '#fef3c7', color: '#b45309' };
    }
  };

  const isOverdue = (task) => {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    return new Date(task.dueAt) < new Date();
  };

  return (
    <div>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Task Directory</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {isAdminOrManager
              ? 'Assign, reassign, and track employee task deliverables.'
              : 'View and update status for your assigned daily tasks.'}
          </p>
        </div>

        {isAdminOrManager && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New Task
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar-card">
        <form onSubmit={handleSearchSubmit} className="toolbar-grid">
          <div>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>Search Tasks</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, description, or lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>Status Filter</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>Due Status Filter</label>
            <select
              className="form-select"
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
            >
              <option value="">All Due Dates</option>
              <option value="TODAY">TODAY</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Tasks Table */}
      <div className="crm-table-container">
        {loading ? (
          <LoadingState message="Loading tasks directory..." />
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks found" description="No task records match your search or filter criteria." />
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned Employee</th>
                <th>Linked Lead</th>
                <th>Due Date (IST)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <tr key={task.id}>
                    <td>
                      <strong
                        style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onNavigate('task_details', { id: task.id })}
                      >
                        {task.title}
                      </strong>
                      {task.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '250px', whiteSpace: 'normal' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{task.user?.name || '—'}</span>
                    </td>
                    <td>
                      {task.lead ? (
                        <span
                          style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                          onClick={() => onNavigate('lead_details', { id: task.leadId })}
                        >
                          {task.lead.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      <span style={{ color: overdue ? '#dc2626' : 'var(--color-text-main)', fontWeight: overdue ? 700 : 500 }}>
                        {new Date(task.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                      {overdue && (
                        <span className="badge-status" style={{ backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onNavigate('task_details', { id: task.id })}
                        >
                          Details
                        </button>
                        {isAdminOrManager && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setReassignUserId(task.userId);
                              setShowReassignModal(true);
                            }}
                          >
                            Reassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && tasks.length > 0 && (
        <div className="pagination-container">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total} total records)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchTasks(pagination.page - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTasks(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Task">
        <form onSubmit={handleCreateSubmit}>
          <FormField label="Task Title" required>
            <input
              type="text"
              className="form-input"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Call prospect for course fee discussion"
              required
            />
          </FormField>

          <FormField label="Assign To Employee" required>
            <select
              className="form-select"
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              required
            >
              <option value="">Select Employee / Counsellor...</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Due Date & Time" required>
            <input
              type="datetime-local"
              className="form-input"
              value={createForm.dueAt}
              onChange={(e) => setCreateForm({ ...createForm, dueAt: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Linked Lead (Optional)">
            <select
              className="form-select"
              value={createForm.leadId}
              onChange={(e) => setCreateForm({ ...createForm, leadId: e.target.value })}
            >
              <option value="">Select Linked Lead (Optional)...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} - {l.course || 'No course'} ({l.phone})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Task Description">
            <textarea
              className="form-textarea"
              rows="3"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Enter task requirements or discussion points..."
            ></textarea>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Task Modal */}
      <Modal isOpen={showReassignModal} onClose={() => setShowReassignModal(false)} title="Reassign Task">
        <form onSubmit={handleReassignSubmit}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>
            Reassigning task: <strong>{selectedTask?.title}</strong>
          </p>

          <FormField label="Target Employee" required>
            <select
              className="form-select"
              value={reassignUserId}
              onChange={(e) => setReassignUserId(e.target.value)}
              required
            >
              <option value="">Select Employee...</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowReassignModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Reassigning...' : 'Reassign Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
