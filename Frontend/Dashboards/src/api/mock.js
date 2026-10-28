// Patient-side mock API (same function names as client.js). Uses the shared store.
import { load, save, PATIENT_ID, DAY, val, sheet } from "./store.js";

const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const STAGE_MS = 1500;
const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });
const stageOf = (r) => (r.status !== "processing" ? 4 : Math.min(4, Math.floor((Date.now() - r.createdAt) / STAGE_MS)));
const settle = (r) => { if (r.status === "processing" && stageOf(r) >= 4) r.status = "pending"; return r; };
const summary = (r) => {
  settle(r);
  return {
    id: r.id, title: r.title, lab: r.lab, reportDate: r.reportDate, uploadedAt: r.uploadedAt, status: r.status,
    stage: stageOf(r), verifiedBy: r.reviewedBy, verifiedAt: r.reviewedAt, valueCount: r.values.length,
  };
};
const mine = (db) => db.reports.filter((r) => r.ownerId === PATIENT_ID);
const own = (db, id) => {
  const r = mine(db).find((x) => x.id === id);
  if (!r) throw fail("This report could not be found.", 404);
  return r;
};

export async function login(email, password) {
  await wait();
  if (!email || !password) throw fail("Enter your email and password.", 401);
  return { token: "mock-token", user: { id: PATIENT_ID, name: email.split("@")[0], email, role: "patient" } };
}
export async function register({ name, email, password }) {
  await wait();
  if (!email || !password) throw fail("Enter your email and password.");
  return { token: "mock-token", user: { id: PATIENT_ID, name: name || email.split("@")[0], email, role: "patient" } };
}

export async function listReports() {
  await wait(400);
  const db = load();
  const list = mine(db).map(summary);
  save(db);
  return list.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function uploadReport(file, onProgress) {
  for (let p = 0; p <= 100; p += 20) { onProgress?.(p); await wait(150); }
  const db = load();
  const now = Date.now();
  const id = "r" + now;
  db.reports.push({
    id, ownerId: PATIENT_ID, title: file.name.replace(/\.[^.]+$/, ""), lab: "Uploaded report",
    reportDate: new Date().toISOString().slice(0, 10), uploadedAt: now, status: "processing",
    reviewedBy: null, reviewedAt: null, createdAt: now,
    lines: sheet("Uploaded report", "Complete blood count", [
      "Hemoglobin           12.8      g/dL      12.0 - 15.5",
      "WBC count            6.1       10^3/uL   4.0 - 11.0",
      "Platelet count       301       10^3/uL   150 - 410",
    ]),
    values: [val(id + "v1", "Hemoglobin", 12.8, "g/dL", 12, 15.5, 3), val(id + "v2", "WBC count", 6.1, "10^3/uL", 4, 11, 4), val(id + "v3", "Platelet count", 301, "10^3/uL", 150, 410, 5)],
  });
  db.log.unshift({ id: "l" + now, ownerId: PATIENT_ID, at: now, text: `You uploaded ${file.name}` });
  save(db);
  return { id };
}

export async function getReport(id) {
  await wait(250);
  const db = load();
  const s = summary(own(db, id));
  save(db);
  return s;
}

export async function getExtraction(id) {
  await wait(500);
  const db = load();
  const r = own(db, id);
  settle(r);
  save(db);
  if (r.status === "processing") throw fail("This report is still being processed.", 409);
  return {
    report: summary(r),
    pages: [{ page: 1, imageUrl: null, lines: r.lines.map((text, i) => ({ id: i, text })) }],
    values: r.values.map((v) => ({ ...v, evidence: { ...v.evidence, text: r.lines[v.evidence.lineId] } })),
  };
}

// Verified records: confirmed or corrected values only. Rejected values never reach the patient's record.
export async function listVerified() {
  await wait(400);
  return mine(load())
    .filter((r) => r.status === "verified" || r.status === "reviewed")
    .flatMap((r) =>
      r.values
        .filter((v) => v.status === "verified" || v.status === "corrected")
        .map((v) => ({
          ...v, value: v.verifiedValue ?? v.value, reportId: r.id, reportTitle: r.title,
          date: r.reportDate, verifiedBy: r.reviewedBy, verifiedAt: r.reviewedAt,
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listShares() {
  await wait(300);
  const db = load();
  const now = Date.now();
  db.shares.forEach((s) => { if (s.status === "active" && s.expiresAt < now) s.status = "expired"; });
  save(db);
  return db.shares.filter((s) => s.ownerId === PATIENT_ID).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createShare({ doctorEmail, reportIds, days }) {
  await wait(600);
  const email = (doctorEmail || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw fail("Enter a valid doctor email address.");
  if (!reportIds.length) throw fail("Choose at least one report to share.");
  const db = load();
  const shareable = reportIds.every((id) => mine(db).some((r) => r.id === id && (r.status === "pending" || r.status === "verified")));
  if (!shareable) throw fail("Only your processed reports can be shared.");
  const now = Date.now();
  const share = { id: "s" + now, ownerId: PATIENT_ID, doctorEmail: email, reportIds, status: "active", createdAt: now, expiresAt: now + days * DAY };
  db.shares.push(share);
  db.log.unshift({ id: "l" + now, ownerId: PATIENT_ID, at: now, text: `You shared ${reportIds.length} report(s) with ${email}` });
  save(db);
  return share;
}

export async function revokeShare(id) {
  await wait(400);
  const db = load();
  const s = db.shares.find((x) => x.id === id && x.ownerId === PATIENT_ID);
  if (!s) throw fail("This share could not be found.", 404);
  s.status = "revoked";
  db.log.unshift({ id: "l" + Date.now(), ownerId: PATIENT_ID, at: Date.now(), text: `You stopped sharing with ${s.doctorEmail}` });
  save(db);
  return s;
}

export async function listActivity() {
  await wait(300);
  return load().log.filter((l) => l.ownerId === PATIENT_ID).slice(0, 20);
}
