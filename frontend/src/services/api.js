/**
 * Centralized API service wrapper for KaushalSaathi Tracker frontend.
 * Automatically attaches Bearer JWT authentication header from localStorage.
 */

const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid session on 401
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.dispatchEvent(new Event('auth_expired'));
    }
    const errorMessage = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

export const leadService = {
  getLeads: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiFetch(`/leads?${query.toString()}`);
  },

  getLeadById: (id) => apiFetch(`/leads/${id}`),

  createLead: (payload) => apiFetch('/leads', { method: 'POST', body: JSON.stringify(payload) }),

  updateLead: (id, payload) => apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  updateStatus: (id, status) =>
    apiFetch(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  assignLead: (id, assignedToId) =>
    apiFetch(`/leads/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedToId }) }),

  reassignLead: (id, assignedToId) =>
    apiFetch(`/leads/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ assignedToId }) }),

  getCounsellors: () => apiFetch('/users/counsellors'),
};
