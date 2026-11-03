// Backwards-compatible exports for screens that still import the service module.
import { api } from "../api/client";

export const loginUser = (credentials) => api.login(credentials.email, credentials.password);
export const registerUser = (userData) => api.register(userData);
export const uploadReport = (file, onProgress) => api.uploadReport(file, onProgress);
export const processReport = (reportId) => api.processReport(reportId);
export const getReportExtraction = (reportId) => api.getExtraction(reportId);
export const verifyReport = (reportId, verificationData) => api.docSaveVerification(reportId, verificationData.verifications.map((v) => ({ id: v.extraction_id, action: v.is_verified ? "verify" : "reject", correctedValue: v.corrected_value })));
export const getPatientRecords = (patientId) => api.getPatientRecords(patientId);
export default api;
