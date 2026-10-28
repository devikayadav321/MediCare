// API layer. Every screen talks to the backend ONLY through `api`.
// Swap between mock and real backend with VITE_USE_MOCK in .env
//
// Endpoints this file expects from the FastAPI backend:
//   POST   /auth/login            {email,password}            -> {token,user}
//   POST   /auth/register         {name,email,password}       -> {token,user}
//   GET    /reports                                           -> [reportSummary]
//   POST   /reports               multipart "file"            -> {id}
//   GET    /reports/{id}                                      -> reportSummary (status, stage 0-4)
//   GET    /reports/{id}/extraction                           -> {report, pages, values}
//   GET    /records/verified                                  -> [verifiedValue]
//   GET    /shares                                            -> [share]
//   POST   /shares                {doctorEmail,reportIds,days}-> share
//   DELETE /shares/{id}                                       -> share (revoked)
//   GET    /activity                                          -> [{id,at,text}]
//
// Doctor endpoints (see the "Doctor interface" block in `real` below):
//   POST /doctor/auth/login, GET /doctor/dashboard, GET /doctor/cases?q=&status=,
//   GET /doctor/patients, GET /doctor/reports/{id}/review,
//   POST /doctor/reports/{id}/verification {decisions}, GET /doctor/patients/{id}/history,
//   GET|POST /doctor/notes, GET /doctor/audit?action=

import * as mock from "./mock";
import * as mockDoctor from "./mockDoctor";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const token = () => sessionStorage.getItem("mt_token");

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Check your connection and try again."), { status: 0 });
  }
  if (res.status === 401 && token()) {
    sessionStorage.removeItem("mt_token");
    sessionStorage.removeItem("mt_user");
    window.location.assign("/login");
  }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail; } catch { /* ignore */ }
    throw Object.assign(new Error(detail || "Something went wrong. Try again."), { status: res.status });
  }
  return res.status === 204 ? null : res.json();
}

function upload(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", BASE + "/reports");
    if (token()) xhr.setRequestHeader("Authorization", `Bearer ${token()}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(JSON.parse(xhr.responseText));
      let detail = "";
      try { detail = JSON.parse(xhr.responseText).detail; } catch { /* ignore */ }
      reject(Object.assign(new Error(detail || "Upload failed. Try again."), { status: xhr.status }));
    };
    xhr.onerror = () => reject(Object.assign(new Error("Upload failed. Check your connection and try again."), { status: 0 }));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

const real = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (d) => request("/auth/register", { method: "POST", body: d }),
  listReports: () => request("/reports"),
  uploadReport: upload,
  getReport: (id) => request(`/reports/${id}`),
  getExtraction: (id) => request(`/reports/${id}/extraction`),
  listVerified: () => request("/records/verified"),
  listShares: () => request("/shares"),
  createShare: (d) => request("/shares", { method: "POST", body: d }),
  revokeShare: (id) => request(`/shares/${id}`, { method: "DELETE" }),
  listActivity: () => request("/activity"),

  // ---- Doctor interface ----
  doctorLogin: (email, password) => request("/doctor/auth/login", { method: "POST", body: { email, password } }),
  docDashboard: () => request("/doctor/dashboard"),
  docListCases: ({ q = "", status = "all" } = {}) => request(`/doctor/cases?q=${encodeURIComponent(q)}&status=${status}`),
  docListPatients: () => request("/doctor/patients"),
  docGetReview: (id) => request(`/doctor/reports/${id}/review`),
  docSaveVerification: (id, decisions) => request(`/doctor/reports/${id}/verification`, { method: "POST", body: { decisions } }),
  docHistory: (patientId) => request(`/doctor/patients/${patientId}/history`),
  docListNotes: (patientId) => request(`/doctor/notes${patientId ? `?patientId=${patientId}` : ""}`),
  docAddNote: (d) => request("/doctor/notes", { method: "POST", body: d }),
  docListAudit: ({ action = "all" } = {}) => request(`/doctor/audit?action=${action}`),
};

export const api = USE_MOCK ? { ...mock, ...mockDoctor } : real;
