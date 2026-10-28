import axios from 'axios'

// Pointing to your running FastAPI backend
const API_BASE_URL = "http://127.0.0.1:8000";

const instance = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject JWT Bearer token into headers
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // --- AUTH ---
  async login(email, password) {
    const res = await instance.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
      // Mocking user profile object since your frontend expects user.name and user.role
      const role = email.includes('doc') || email.includes('smith') ? 'doctor' : 'patient';
      localStorage.setItem('user_profile', JSON.stringify({ name: email.split('@')[0], email, role }));
    }
    return res.data;
  },

  async register({ name, email, password }) {
    // Defaulting role to patient during signup form registration
    const res = await instance.post('/auth/register', { email, password, role: 'patient' });
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user_profile', JSON.stringify({ name, email, role: 'patient' }));
    }
    return res.data;
  },

  // --- REPORTS ---
  async listReports() {
    const res = await instance.get('/reports'); // Ensure your backend has a GET /reports route or adjust accordingly
    return res.data;
  },

  async getReport(id) {
    const res = await instance.get(`/reports/${id}/extraction`);
    return res.data;
  },

  async uploadReport(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await instance.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return res.data; // Expects { id, status }
  },

  async getExtraction(id) {
    const res = await instance.get(`/reports/${id}/extraction`);
    return res.data;
  },

  // --- SHARES & ACTIVITY (Mock/Placeholder endpoints if not built yet in backend) ---
  async listShares() {
    return { data: [] };
  },

  async listActivity() {
    return { data: [] };
  },

  async listVerified() {
    const res = await instance.get('/reports/verified'); // Adjust if needed
    return res.data;
  },

  async createShare(payload) {
    return { success: true };
  },

  async revokeShare(id) {
    return { success: true };
  }
};