import axios from "axios";

const instance = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
instance.interceptors.response.use((r) => r, (error) => {
  const detail = error.response?.data?.detail;
  error.message = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).filter(Boolean).join("; ") : error.message || "The server could not be reached.";
  error.status = error.response?.status;
  return Promise.reject(error);
});

const userFrom = async (email) => {
  const { data } = await instance.get("/auth/me");
  return { id: data.id, email: data.email || email, name: data.name || data.email?.split("@")[0] || email.split("@")[0], role: data.role };
};
const establishSession = async (data, email) => {
  localStorage.setItem("access_token", data.access_token);
  try {
    const user = await userFrom(email);
    localStorage.setItem("user_profile", JSON.stringify(user));
    return { token: data.access_token, user };
  } catch (e) {
    localStorage.removeItem("access_token");
    throw e;
  }
};
const reportSummary = (r) => ({ ...r, status: r.status === "processed" ? "pending" : r.status, reportDate: r.reportDate || r.uploadedAt, title: r.title || `Medical report #${r.id}`, lab: r.lab || "Uploaded report", stage: r.status === "uploaded" ? 1 : 3 });
const referenceBounds = (range = "") => {
  const value = String(range).trim();
  const pair = value.match(/(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (pair) return { refLow: Number(pair[1]), refHigh: Number(pair[2]) };
  const single = value.match(/(-?\d+(?:\.\d+)?)/);
  if (single && /below|less than|</i.test(value)) return { refLow: null, refHigh: Number(single[1]) };
  if (single && /above|greater than|>/i.test(value)) return { refLow: Number(single[1]), refHigh: null };
  return { refLow: null, refHigh: null };
};
const extractionShape = (data) => {
  const values = (data.extractions || []).map((x, i) => ({
    id: x.id, name: x.test_name, value: Number.isNaN(Number(x.result_value)) ? x.result_value : Number(x.result_value),
    unit: x.unit || "", reference_range: x.reference_range, ...referenceBounds(x.reference_range),
    status: x.corrected_value !== null && x.corrected_value !== undefined ? "corrected" : x.is_verified ? "verified" : "pending",
    verifiedValue: x.corrected_value, is_out_of_range: x.is_out_of_range,
    evidence: { page: 1, lineId: i, text: x.evidence_snippet || "No source excerpt was provided." },
  }));
  const lines = values.map((v) => v.evidence.text);
  return { ...data, report: reportSummary({ ...data, id: data.report_id }), values,
    pages: [{ page: 1, imageUrl: null, lines: lines.map((text, id) => ({ id, text })) }], extractions: data.extractions || [] };
};

export const api = {
  async login(email, password) { return establishSession((await instance.post("/auth/login", { email, password })).data, email); },
  async register({ name, email, password }) { return establishSession((await instance.post("/auth/register", { email, password, full_name: name, role: "patient" })).data, email); },
  async doctorLogin(email, password) {
    const session = await this.login(email, password);
    if (session.user.role !== "doctor") { this.logout(); throw new Error("This account does not have a doctor role."); }
    return session;
  },
  logout() { localStorage.removeItem("access_token"); localStorage.removeItem("user_profile"); },
  async currentUser() { return userFrom(""); },
  async listReports() { return (await instance.get("/reports")).data.map(reportSummary); },
  async getReport(id) { return reportSummary((await instance.get(`/reports/${id}`)).data); },
  async processReport(id) { return (await instance.post(`/reports/${id}/process`)).data; },
  async uploadReport(file, onProgress) {
    const form = new FormData(); form.append("file", file);
    const { data } = await instance.post("/reports/upload", form, { onUploadProgress: (e) => e.total && onProgress?.(Math.round(e.loaded * 100 / e.total)) });
    const id = data.report_id ?? data.id;
    await this.processReport(id);
    return { ...data, id };
  },
  async getExtraction(id) { return extractionShape((await instance.get(`/reports/${id}/extraction`)).data); },
  async listVerified() { return (await instance.get("/reports/verified")).data.map((v) => ({ ...v, ...referenceBounds(v.referenceRange) })); },
  async listShares() { return (await instance.get("/reports/shares")).data; },
  async listActivity() { return (await instance.get("/activity")).data; },
  async createShare({ doctorEmail, reportIds, days }) { return (await instance.post("/reports/shares", { doctor_email: doctorEmail, report_ids: reportIds, days })).data; },
  async revokeShare(id) { return (await instance.delete(`/reports/shares/${encodeURIComponent(id)}`)).data; },
  async docListCases({ q = "", status = "all" } = {}) {
    const rows = await this.listReports();
    return rows.filter((r) => status === "all" || r.status === status)
      .map((r) => ({ ...r, patient: { id: r.patient_id, name: r.patient_name || `Patient #${r.patient_id}`, code: `MT-${r.patient_id}`, age: "", sex: "" } }))
      .filter((r) => !q || `${r.title} ${r.patient.name} ${r.patient.code}`.toLowerCase().includes(q.toLowerCase()));
  },
  async docDashboard() { const cases = await this.docListCases({}); const needsReview = cases.filter((r) => r.status === "pending"); return { pending: needsReview.length, reviewed: cases.filter((r) => r.status === "reviewed").length, verified: cases.filter((r) => r.status === "verified").length, patients: new Set(cases.map((r) => r.patient.id)).size, total: cases.length, done: cases.length - needsReview.length, needsReview }; },
  async docGetReview(id) { const data = await this.getExtraction(id); const file = await instance.get(`/reports/${id}/file`, { responseType: "blob" }); const fileUrl = URL.createObjectURL(file.data); const report = { ...data.report, patient: { id: data.report.patient_id, name: data.report.patient_name || `Patient #${data.report.patient_id}`, code: `MT-${data.report.patient_id}` } }; return { report, values: data.values, pages: [{ ...data.pages[0], fileUrl, fileType: file.data.type }], previous: {} }; },
  async docSaveVerification(id, decisions) {
    const verifications = decisions.map((d) => ({ extraction_id: d.id, is_verified: d.action === "verify" || d.action === "correct", corrected_value: d.action === "correct" ? String(d.correctedValue) : null }));
    return (await instance.post(`/reports/${id}/verify`, { verifications })).data;
  },
  async docListPatients() { const cases = await this.docListCases({}); const byId = new Map(cases.map((r) => [r.patient.id, r.patient])); return [...byId.values()]; },
  async docHistory(patientId) { const [data, reports] = await Promise.all([instance.get(`/patients/${patientId}/records`), this.listReports()]); const mine = reports.filter((r) => String(r.patient_id) === String(patientId)); const trusted = data.data.trusted_records; const verified = trusted.flatMap((r) => r.verified_values.map((v) => ({ ...v, name: v.test_name, value: Number(v.result_value) || v.result_value, reportId: r.report_id, date: r.upload_date, status: v.corrected_value != null ? "corrected" : "verified", verifiedValue: v.corrected_value, ...referenceBounds(v.reference_range) }))); const newestReport = mine.find((r) => r.status === "pending"); const newestData = newestReport ? await this.getExtraction(newestReport.id) : null; return { patient: { id: patientId, name: `Patient #${patientId}` }, verified, reports: mine, newest: newestData ? { id: newestReport.id, title: newestReport.title, date: newestReport.reportDate, values: newestData.values } : null }; },
  async getPatientRecords(patientId = JSON.parse(localStorage.getItem("user_profile") || "null")?.id) { if (!patientId) throw new Error("Sign in to load patient records."); return (await instance.get(`/patients/${patientId}/records`)).data; },
  async docListNotes(patientId) { return (await instance.get("/doctor/notes", { params: patientId ? { patient_id: patientId } : {} })).data; },
  async docAddNote({ reportId, text }) { if (!reportId) throw new Error("Choose a related report before saving this note."); return (await instance.post(`/reports/${reportId}/notes`, { notes: text })).data; },
  async docListAudit({ action = "all" } = {}) { return (await instance.get("/doctor/audit", { params: { action } })).data; },
};

export default instance;
