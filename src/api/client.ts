import axios from 'axios';

// ══════════════════════════════════════════════════════════════
//  API BASE URL
//  Set VITE_API_URL in Netlify environment variables:
//    VITE_API_URL = https://your-app.up.railway.app
//
//  All requests go to:  <VITE_API_URL>/api/...
// ══════════════════════════════════════════════════════════════
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT on every request ────────────────────────────────
api.interceptors.request.use(cfg => {
  const stored = localStorage.getItem('al-dawaa-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) cfg.headers.Authorization = `Bearer ${state.token}`;
    } catch { /* ignore */ }
  }
  return cfg;
});

// ── Global 401 handler — redirect to login ─────────────────────
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('al-dawaa-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ══════════════════════════════════════════════════════════════
//  AUTH API
// ══════════════════════════════════════════════════════════════
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),

  me: () =>
    api.get('/auth/me').then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),
};

// ══════════════════════════════════════════════════════════════
//  PROJECTS API
// ══════════════════════════════════════════════════════════════
export const projectsApi = {
  list: () =>
    api.get('/projects').then(r => r.data),

  globalSummary: () =>
    api.get('/projects/global-summary').then(r => r.data),

  get: (id: string) =>
    api.get(`/projects/${id}`).then(r => r.data),

  create: (data: any) =>
    api.post('/projects', data).then(r => r.data),

  update: (id: string, data: any) =>
    api.put(`/projects/${id}`, data).then(r => r.data),
};

// ══════════════════════════════════════════════════════════════
//  DATA API
// ══════════════════════════════════════════════════════════════
export const dataApi = {
  records: (projectId: string, filters = {}, page = 1, pageSize = 50) =>
    api.get(`/data/${projectId}/records`, {
      params: { filters: JSON.stringify(filters), page, pageSize },
    }).then(r => r.data),

  kpis: (projectId: string, filters = {}) =>
    api.get(`/data/${projectId}/kpis`, {
      params: { filters: JSON.stringify(filters) },
    }).then(r => r.data),

  chart: (projectId: string, chartType: string, filters = {}) =>
    api.get(`/data/${projectId}/charts/${chartType}`, {
      params: { filters: JSON.stringify(filters) },
    }).then(r => r.data),

  filterOptions: (projectId: string) =>
    api.get(`/data/${projectId}/filter-options`).then(r => r.data),

  rankings: (projectId: string, groupBy = 'region', filters = {}) =>
    api.get(`/data/${projectId}/rankings`, {
      params: { groupBy, filters: JSON.stringify(filters) },
    }).then(r => r.data),

  dimensionChart: (projectId: string, dimension: string, filters = {}) =>
    api.get(`/data/${projectId}/charts/by-dimension`, {
      params: { dimension, filters: JSON.stringify(filters) },
    }).then(r => r.data),

  medKpis: (filters = {}) =>
    api.get('/data/medical-devices/kpis', {
      params: { filters: JSON.stringify(filters) },
    }).then(r => r.data),

  deleteRecord: (projectId: string, recordId: string) =>
    api.delete(`/data/${projectId}/records/${recordId}`).then(r => r.data),

  updateRecord: (projectId: string, recordId: string, data: any) =>
    api.put(`/data/${projectId}/records/${recordId}`, data).then(r => r.data),
};

// ══════════════════════════════════════════════════════════════
//  UPLOAD API
// ══════════════════════════════════════════════════════════════
export const uploadApi = {
  upload: (projectId: string, file: File, mode: string, columnMapping?: Record<string, string>) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', mode);
    if (columnMapping) fd.append('columnMapping', JSON.stringify(columnMapping));
    return api.post(`/upload/${projectId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    }).then(r => r.data);
  },

  batches: (projectId: string) =>
    api.get(`/upload/${projectId}/batches`).then(r => r.data),

  rollback: (batchId: string) =>
    api.post(`/upload/batches/${batchId}/rollback`).then(r => r.data),

  deleteBatch: (batchId: string) =>
    api.delete(`/upload/batches/${batchId}`).then(r => r.data),
};

// ══════════════════════════════════════════════════════════════
//  ADMIN API
// ══════════════════════════════════════════════════════════════
export const adminApi = {
  users: () =>
    api.get('/admin/users').then(r => r.data),

  createUser: (data: any) =>
    api.post('/admin/users', data).then(r => r.data),

  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data).then(r => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),

  deactivateUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),

  auditLogs: (page = 1) =>
    api.get('/admin/audit-logs', { params: { page } }).then(r => r.data),

  notes: (projectId: string) =>
    api.get(`/admin/notes/${projectId}`).then(r => r.data),

  addNote: (projectId: string, content: string, authorName: string) =>
    api.post(`/admin/notes/${projectId}`, { content, authorName }).then(r => r.data),
};
