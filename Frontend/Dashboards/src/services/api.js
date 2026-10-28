import axios from 'axios';

// Pointing to your FastAPI backend URL
const API_BASE_URL = "http://localhost:5173/";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT token to requests if the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- API Functions ---
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const uploadReport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const processReport = async (reportId) => {
  const response = await api.post(`/reports/${reportId}/process`);
  return response.data;
};

export const getReportExtraction = async (reportId) => {
  const response = await api.get(`/reports/${reportId}/extraction`);
  return response.data;
};

export const verifyReport = async (reportId, verificationData) => {
  const response = await api.post(`/reports/${reportId}/verify`, verificationData);
  return response.data;
};

export const getPatientRecords = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/records`);
  return response.data;
};

export default api;

import { verifyReport } from "../services/api";

// When the doctor clicks "Submit Verification"
async function handleDoctorSubmit(reportId, decisionData, clinicalNotes) {
  try {
    const payload = {
      verifications: [
        {
          extraction_id: decisionData.extractionId,
          is_verified: decisionData.action === "verify",
          corrected_value: decisionData.correctedValue || null
        }
      ],
      clinical_notes: clinicalNotes
    };

    const response = await verifyReport(reportId, payload);
    alert("Report verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}