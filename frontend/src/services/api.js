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

export const attendanceService = {
  heartbeat: () => apiFetch('/attendance/logout'.replace('logout', 'heartbeat'), { method: 'POST' }),

  logout: () => apiFetch('/attendance/logout', { method: 'POST' }),

  getAttendance: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiFetch(`/attendance?${query.toString()}`);
  },

  getMyAttendance: () => apiFetch('/attendance/me'),
};

export const callService = {
  createCall: (payload) => apiFetch('/calls', { method: 'POST', body: JSON.stringify(payload) }),

  getCalls: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiFetch(`/calls?${query.toString()}`);
  },
};

export const followupService = {
  getFollowUps: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiFetch(`/followups?${query.toString()}`);
  },

  completeFollowUp: (id) => apiFetch(`/followups/${id}/complete`, { method: 'PATCH' }),
};

export const taskService = {
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiFetch(`/tasks?${query.toString()}`);
  },

  getTask: (id) => apiFetch(`/tasks/${id}`),

  createTask: (payload) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  updateTask: (id, payload) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  updateTaskStatus: (id, status) =>
    apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  reassignTask: (id, userId) =>
    apiFetch(`/tasks/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
};

export const dashboardService = {
  getCounsellorDashboard: () => apiFetch('/dashboard/counsellor'),
};

export const reportService = {
  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/summary?${query.toString()}`);
  },

  getPerformance: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/performance?${query.toString()}`);
  },

  getCalls: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/calls?${query.toString()}`);
  },

  getLeads: () => apiFetch('/reports/management/leads'),

  getAttendance: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/attendance?${query.toString()}`);
  },

  getFollowups: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/followups?${query.toString()}`);
  },

  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return apiFetch(`/reports/management/tasks?${query.toString()}`);
  },

  exportCSVUrl: (type = 'performance', params = {}) => {
    const query = new URLSearchParams({ type, ...params });
    return `/api/reports/management/export?${query.toString()}`;
  },
};
