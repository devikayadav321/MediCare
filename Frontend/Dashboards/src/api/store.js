// Shared demo database. Patient and doctor screens both read and write this one
// store, kept in localStorage so two tabs of the same browser see the same data.
// It stands in for the FastAPI backend until that is ready.

const KEY = "mt_store_v1";
export const DAY = 86400000;
export const PATIENT_ID = "u1";
export const DEMO_DOCTOR_EMAIL = "dr.chen@meditrace.health";

export const val = (id, name, value, unit, refLow, refHigh, line, status = "pending") => ({
  id, name, value, unit, refLow, refHigh, status, evidence: { page: 1, lineId: line },
});
export const sheet = (lab, title, rows) => [
  `${lab} - ${title}`, "Patient name on report: see header",
  "Test                 Result    Unit      Reference range", ...rows,
];

const mkReport = ({ id, owner, title, lab, date, ago, status = "pending", by = null, rows, vals }) => {
  const now = Date.now();
  return {
    id, ownerId: owner, title, lab, reportDate: date, status,
    reviewedBy: by, reviewedAt: by ? now - (ago - 2) * DAY : null,
    uploadedAt: now - ago * DAY, createdAt: now - ago * DAY,
    lines: sheet(lab, title, rows),
    values: vals.map(([name, value, unit, lo, hi, st], i) => val(`${id}v${i + 1}`, name, value, unit, lo, hi, 3 + i, st)),
  };
};

function seed() {
  const now = Date.now();
  const share = (id, ownerId, reportIds, expiresIn) => ({
    id, ownerId, doctorEmail: DEMO_DOCTOR_EMAIL, reportIds, status: "active", createdAt: now, expiresAt: now + expiresIn,
  });
  const cbc = ["Hemoglobin           10.9      g/dL      12.0 - 15.5", "WBC count            7.2       10^3/uL   4.0 - 11.0", "Platelet count       412       10^3/uL   150 - 410"];
  const cbcVals = (h, w, p, st = "pending") => [["Hemoglobin", h, "g/dL", 12, 15.5, st], ["WBC count", w, "10^3/uL", 4, 11, st], ["Platelet count", p, "10^3/uL", 150, 410, st]];
  const lipid = (tc, hdl, tg, st = "pending") => [["Total cholesterol", tc, "mg/dL", null, 200, st], ["HDL cholesterol", hdl, "mg/dL", 40, null, st], ["Triglycerides", tg, "mg/dL", null, 150, st]];
  const lipidRows = (tc, hdl, tg) => [`Total cholesterol    ${tc}       mg/dL     below 200`, `HDL cholesterol      ${hdl}        mg/dL     above 40`, `Triglycerides        ${tg}       mg/dL     below 150`];

  const reports = [
    // Patient Umme's reports (the patient side logs in as u1)
    mkReport({ id: "r1", owner: "u1", title: "Lipid profile", lab: "Apollo Diagnostics", date: "2026-06-14", ago: 120, status: "verified", by: "Dr. Anand Rao", rows: lipidRows(214, 52, 148), vals: lipid(214, 52, 148, "verified") }),
    mkReport({ id: "r3", owner: "u1", title: "Complete blood count", lab: "Apollo Diagnostics", date: "2026-03-09", ago: 220, status: "verified", by: "Dr. Anand Rao", rows: ["Hemoglobin           11.6      g/dL      12.0 - 15.5", "WBC count            6.8       10^3/uL   4.0 - 11.0", "Platelet count       398       10^3/uL   150 - 410"], vals: cbcVals(11.6, 6.8, 398, "verified") }),
    mkReport({ id: "r2", owner: "u1", title: "Complete blood count", lab: "Apollo Diagnostics", date: "2026-09-12", ago: 5, rows: cbc, vals: cbcVals(10.9, 7.2, 412) }),
    // Other patients' reports (doctor side)
    mkReport({ id: "d1", owner: "p1", title: "Complete blood count", lab: "Apollo Diagnostics", date: "2026-09-12", ago: 2, rows: cbc, vals: cbcVals(10.9, 7.2, 412) }),
    mkReport({ id: "d2", owner: "p2", title: "Lipid profile", lab: "Lal PathLabs", date: "2026-10-01", ago: 1, rows: lipidRows(231, 38, 176), vals: lipid(231, 38, 176) }),
    mkReport({ id: "d3", owner: "p3", title: "Blood sugar panel", lab: "Apollo Diagnostics", date: "2026-10-10", ago: 0.25, rows: ["Fasting glucose      112       mg/dL     70 - 99", "HbA1c                5.9       %         below 5.7"], vals: [["Fasting glucose", 112, "mg/dL", 70, 99, "pending"], ["HbA1c", 5.9, "%", null, 5.7, "pending"]] }),
    mkReport({ id: "d4", owner: "p1", title: "Complete blood count", lab: "Apollo Diagnostics", date: "2026-03-09", ago: 220, status: "verified", by: "Dr. Anand Rao", rows: ["Hemoglobin           11.6      g/dL      12.0 - 15.5", "WBC count            6.8       10^3/uL   4.0 - 11.0", "Platelet count       398       10^3/uL   150 - 410"], vals: cbcVals(11.6, 6.8, 398, "verified") }),
    mkReport({ id: "d5", owner: "p2", title: "Lipid profile", lab: "Lal PathLabs", date: "2026-05-02", ago: 150, status: "verified", by: "Dr. Anand Rao", rows: lipidRows(219, 41, 160), vals: lipid(219, 41, 160, "verified") }),
    mkReport({ id: "d6", owner: "p4", title: "Thyroid profile", lab: "Metropolis", date: "2026-09-28", ago: 9, status: "reviewed", by: "Dr. Anand Rao", rows: ["TSH                  3.1       uIU/mL    0.4 - 4.0", "Free T4              1.1       ng/dL     0.8 - 1.8"], vals: [["TSH", 3.1, "uIU/mL", 0.4, 4, "verified"], ["Free T4", 1.1, "ng/dL", 0.8, 1.8, "rejected"]] }),
  ];

  return {
    patients: {
      u1: { id: "u1", code: "MT-0001", name: "Umme", age: 34, sex: "Female" },
      p1: { id: "p1", code: "MT-1001", name: "Ananya Rao", age: 34, sex: "Female" },
      p2: { id: "p2", code: "MT-1002", name: "Rahul Verma", age: 52, sex: "Male" },
      p3: { id: "p3", code: "MT-1003", name: "Sana Khan", age: 45, sex: "Female" },
      p4: { id: "p4", code: "MT-1004", name: "Imran Ali", age: 61, sex: "Male" },
    },
    reports,
    // d3 is shared but the share has already expired, so the doctor must not see it
    shares: [share("s1", "p1", ["d1", "d4"], 30 * DAY), share("s2", "p2", ["d2", "d5"], 30 * DAY), share("s3", "p3", ["d3"], -DAY), share("s4", "p4", ["d6"], 30 * DAY)],
    audit: [
      { id: "a1", at: now - 8 * DAY, actor: "Dr. Anand Rao", action: "rejected", reportId: "d6", text: "Rejected Free T4 (value did not match source)" },
      { id: "a2", at: now - 8 * DAY, actor: "Dr. Anand Rao", action: "verified", reportId: "d6", text: "Verified TSH" },
      { id: "a3", at: now - 8 * DAY, actor: "Dr. Anand Rao", action: "status_change", reportId: "d6", text: "Report status changed: pending to reviewed" },
      { id: "a4", at: now - 2 * DAY, actor: "System", action: "uploaded", reportId: "d1", text: "Patient uploaded report; AI extraction completed" },
      { id: "a5", at: now - 1 * DAY, actor: "System", action: "uploaded", reportId: "d2", text: "Patient uploaded report; AI extraction completed" },
    ],
    notes: [
      { id: "n1", patientId: "p4", reportId: "d6", at: now - 8 * DAY, author: "Dr. Anand Rao", text: "Reviewed thyroid profile with patient. Free T4 on the printout did not match the extracted value, so it was rejected. Requested a clearer copy of the report." },
    ],
    log: [],
  };
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.reports) return d;
  } catch { /* fall through and reseed */ }
  const d = seed();
  save(d);
  return d;
}

export function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

// Clear all demo data (use from the browser console: localStorage.removeItem("mt_store_v1"))
export function resetDemo() {
  localStorage.removeItem(KEY);
}

// Report ids a doctor may open right now: active, unexpired, unrevoked shares only
export function accessibleIds(db, email) {
  const now = Date.now();
  const ids = new Set();
  db.shares.forEach((s) => {
    if (s.status === "active" && s.expiresAt > now && s.doctorEmail === email) s.reportIds.forEach((id) => ids.add(id));
  });
  return ids;
}

export const reportSummary = (db, r) => ({
  id: r.id, title: r.title, lab: r.lab, reportDate: r.reportDate, uploadedAt: r.uploadedAt, status: r.status,
  reviewedBy: r.reviewedBy, reviewedAt: r.reviewedAt, valueCount: r.values.length, patient: db.patients[r.ownerId],
});
