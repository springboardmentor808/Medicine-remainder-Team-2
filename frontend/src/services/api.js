import axios from 'axios';

// Detect or fallback base URL for unified single-origin deployment
const API_URL = import.meta.env.VITE_API_URL || 'https://pillsync-3.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to dynamically inject simulation User/Patient ID
apiClient.interceptors.request.use(config => {
  const customPatientId = localStorage.getItem('medi-track-patient-id');
  if (customPatientId) {
    config.headers['X-Patient-Id'] = customPatientId;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Global response error cleaner
const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'API request failed';
  throw new Error(message);
};

export const api = {
  // Patients Directory CRUD
  getPatients: async (params = {}) => {
    try {
      const response = await apiClient.get('/patients', { params });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  getPatientById: async (patientId) => {
    try {
      const response = await apiClient.get(`/patients/${patientId}`);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  createPatient: async (data) => {
    try {
      const response = await apiClient.post('/patients', data);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  updatePatient: async (patientId, data) => {
    try {
      const response = await apiClient.put(`/patients/${patientId}`, data);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  deletePatient: async (patientId) => {
    try {
      const response = await apiClient.delete(`/patients/${patientId}`);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  // Medications CRUD
  getMedications: async (params = {}) => {
    try {
      const response = await apiClient.get('/medications', { params });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  getMedicationById: async (id, patientId) => {
    try {
      const response = await apiClient.get(`/medications/${id}`, { params: { patientId } });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  createMedication: async (data) => {
    try {
      const response = await apiClient.post('/medications', data);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  updateMedication: async (id, data) => {
    try {
      const response = await apiClient.put(`/medications/${id}`, data);
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  deleteMedication: async (id, patientId) => {
    try {
      const response = await apiClient.delete(`/medications/${id}`, { params: { patientId } });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  // Mark status logs
  markTaken: async (medicationId, { date, scheduledTime, notes, patientId }) => {
    try {
      const response = await apiClient.post(`/medications/${medicationId}/taken`, { date, scheduledTime, notes, patientId });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  markMissed: async (medicationId, { date, scheduledTime, notes, patientId }) => {
    try {
      const response = await apiClient.post(`/medications/${medicationId}/missed`, { date, scheduledTime, notes, patientId });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  markSkipped: async (medicationId, { date, scheduledTime, notes, patientId }) => {
    try {
      const response = await apiClient.post(`/medications/${medicationId}/skipped`, { date, scheduledTime, notes, patientId });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  // History logs
  getHistory: async (params = {}) => {
    try {
      const response = await apiClient.get('/history', { params });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  // Adherence analytics
  getAdherence: async (patientId) => {
    try {
      const response = await apiClient.get('/adherence', { params: { patientId } });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  // Dashboard aggregator
  getDashboard: async (patientId) => {
    try {
      const response = await apiClient.get('/dashboard', { params: { patientId } });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  },

  getClinicalDashboard: async () => {
    try {
      const response = await apiClient.get('/dashboard', { params: { global: true } });
      return response.data;
    } catch (e) {
      handleApiError(e);
    }
  }
};
