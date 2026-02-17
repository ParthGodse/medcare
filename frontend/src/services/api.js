import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  getShifts: (patientId) => api.get(`/patients/${patientId}/shifts`),
  getLatestHandoff: (patientId) => api.get(`/patients/${patientId}/latest-handoff`),
  deleteAllShifts: (patientId) => api.delete(`/patients/${patientId}/shifts`),
};

export const shiftsAPI = {
  create: (patientId, nurseName) => 
    api.post(`/shifts?patient_id=${patientId}&nurse_name=${nurseName}`),
  getById: (id) => api.get(`/shifts/${id}`),
};

export const entriesAPI = {
  create: (shiftId, data) => api.post(`/shifts/${shiftId}/entries`, data),
  getByShift: (shiftId) => api.get(`/shifts/${shiftId}/entries`),
};

export const handoffAPI = {
  generate: (shiftId) => api.post('/handoff/generate', { shift_id: shiftId }),
  getById: (id) => api.get(`/handoff/${id}`),
  getByShift: (shiftId) => api.get(`/shifts/${shiftId}/handoff`),
  publish: (handoffId) => api.post(`/handoff/${handoffId}/publish`),
  acknowledge: (handoffId, nurseName) => 
    api.post(`/handoff/${handoffId}/acknowledge?nurse_name=${nurseName}`),
  delete: (handoffId) => api.delete(`/handoff/${handoffId}`),
};

export const adminAPI = {
  clearAll: () => api.delete('/admin/clear-all'),
  getStats: () => api.get('/admin/database-stats'),
};
export default api;