import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import FormField from '../components/FormField';
import { LoadingState } from '../components/LoadingState';

export default function TaskDetailsPage({ taskId, user, onNavigate }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getTask(taskId);
      setTask(data);
      setStatus(data.status || 'PENDING');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setUpdating(true);
    try {
      const updated = await taskService.updateTaskStatus(taskId, newStatus);
      setTask(updated);
    } catch (err) {
      alert(`Failed to update task status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading task record details..." />;
  }

  if (error || !task) {
    return (
      <div>
        <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
          {error || 'Task record not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('tasks')}>
          ← Back to Task Directory
        </button>
      </div>
    );
  }

  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && new Date(task.dueAt) < new Date();

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tasks')}>
          ← Back to Task Directory
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Update Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={status}
            onChange={handleStatusChange}
            disabled={updating}
          >
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Main Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">{task.title}</h3>
              {isOverdue && (
                <span className="badge-status" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  OVERDUE
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Description</p>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>
                {task.description || 'No detailed description provided.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Due Date & Time (IST)</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: isOverdue ? '#dc2626' : 'var(--color-text-main)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {new Date(task.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Completed Date & Time</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  {task.completedAt ? new Date(task.completedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Linked Lead Details if present */}
          {task.lead && (
            <div className="crm-card">
              <div className="crm-card-header">
                <h3 className="crm-card-title">Linked Prospect Lead</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('lead_details', { id: task.lead.id })}
                >
                  View Full Lead Record →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Lead Name</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{task.lead.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phone Number</p>
                  <p style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>{task.lead.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Course</p>
                  <p style={{ fontSize: '0.95rem' }}>{task.lead.course || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>City</p>
                  <p style={{ fontSize: '0.95rem' }}>{task.lead.city || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="crm-card-header">
              <h3 className="crm-card-title">Assigned Employee</h3>
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {task.user?.name || 'Unassigned'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              {task.user?.email}
            </p>
            <p style={{ marginTop: '0.4rem' }}>
              <span className={`role-pill role-pill-${task.user?.role}`}>{task.user?.role}</span>
            </p>

            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Task Created: {new Date(task.createdAt).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Last Updated: {new Date(task.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
