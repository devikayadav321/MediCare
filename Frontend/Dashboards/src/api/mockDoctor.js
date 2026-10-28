// Doctor-side mock API. Reads and writes the same shared store as the patient side.
// A doctor sees a report only while an active, unexpired, unrevoked patient share covers it.
import { load, save, accessibleIds, reportSummary } from "./store.js";

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });
const session = () => JSON.parse(sessionStorage.getItem("mt_user") || "{}");

const visible = (db) => {
  const ids = accessibleIds(db, (session().email || "").toLowerCase());
  return db.reports.filter((r) => ids.has(r.id));
};
const findVisible = (db, id) => {
  const r = visible(db).find((x) => x.id === id);
  if (!r) throw fail("This report is not shared with you, or your access has ended.", 404);
  return r;
};
const shaped = (db, list) => list.map((r) => reportSummary(db, r));

export async function doctorLogin(email, password) {
  await wait();
  if (!email || !password) throw fail("Enter your email and password.", 401);
  const base = email.split("@")[0].replace(/^dr\.?/i, "");
  const name = "Dr. " + base.charAt(0).toUpperCase() + base.slice(1);
  return { token: "mock-doctor-token", user: { id: "doc1", name, email, role: "doctor" } };
}

export async function docDashboard() {
  await wait();
  const db = load();
  const list = visible(db);
  const count = (s) => list.filter((r) => r.status === s).length;
  return {
    pending: count("pending"), reviewed: count("reviewed"), verified: count("verified"),
    patients: new Set(list.map((r) => r.ownerId)).size, total: list.length, done: list.length - count("pending"),
    needsReview: shaped(db, list.filter((r) => r.status === "pending")).sort((a, b) => b.uploadedAt - a.uploadedAt),
  };
}

export async function docListCases({ q = "", status = "all" } = {}) {
  await wait(350);
  const db = load();
  const s = q.trim().toLowerCase();
  return shaped(db, visible(db).filter((r) => status === "all" || r.status === status))
    .filter((r) => !s || r.patient.name.toLowerCase().includes(s) || r.patient.code.toLowerCase().includes(s) || r.title.toLowerCase().includes(s))
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function docListPatients() {
  await wait(250);
  const db = load();
  return [...new Set(visible(db).map((r) => r.ownerId))].map((id) => db.patients[id]);
}

export async function docGetReview(id) {
  await wait(500);
  const db = load();
  const r = findVisible(db, id);
  const earlier = visible(db)
    .filter((x) => x.ownerId === r.ownerId && x.id !== r.id && x.reportDate < r.reportDate)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  const previous = {};
  earlier.forEach((x) => x.values.forEach((v) => {
    if ((v.status === "verified" || v.status === "corrected") && !previous[v.name])
      previous[v.name] = { value: v.verifiedValue ?? v.value, unit: v.unit, date: x.reportDate };
  }));
  return {
    report: reportSummary(db, r),
    pages: [{ page: 1, imageUrl: null, lines: r.lines.map((text, i) => ({ id: i, text })) }],
    values: r.values.map((v) => ({ ...v, evidence: { ...v.evidence, text: r.lines[v.evidence.lineId] } })),
    previous,
  };
}

// decisions: [{id, action: "verify" | "correct" | "reject", correctedValue?}]
export async function docSaveVerification(id, decisions) {
  await wait(700);
  const db = load();
  const r = findVisible(db, id);
  if (r.status !== "pending") throw fail("This report was already reviewed.", 409);
  // Check every decision first, so a bad entry never leaves the report half-saved
  const updated = r.values.map((v) => {
    const d = decisions.find((x) => x.id === v.id);
    if (!d) throw fail("Decide on every value before saving.");
    if (d.action === "correct") {
      if (d.correctedValue === "" || Number.isNaN(Number(d.correctedValue))) throw fail(`Enter a corrected number for ${v.name}.`);
      return { ...v, status: "corrected", verifiedValue: Number(d.correctedValue) };
    }
    return { ...v, status: d.action === "verify" ? "verified" : "rejected" };
  });
  const who = session().name || "Doctor";
  const t = Date.now();
  r.values = updated;
  r.status = updated.some((x) => x.status === "rejected") ? "reviewed" : "verified";
  r.reviewedBy = who;
  r.reviewedAt = t;
  updated.forEach((v, i) => {
    const word = { verified: "Verified", corrected: `Corrected to ${v.verifiedValue}`, rejected: "Rejected" }[v.status];
    db.audit.unshift({ id: `a${t}${i}`, at: t, actor: who, action: v.status, reportId: id, text: `${word}: ${v.name}` });
  });
  db.audit.unshift({ id: `a${t}s`, at: t, actor: who, action: "status_change", reportId: id, text: `Report status changed: pending to ${r.status}` });
  db.log.unshift({ id: `l${t}`, ownerId: r.ownerId, at: t, text: `${who} reviewed your ${r.title}: ${r.status === "verified" ? "all values verified" : "some values not confirmed"}` });
  save(db);
  return reportSummary(db, r);
}

export async function docHistory(patientId) {
  await wait(450);
  const db = load();
  const mineList = visible(db).filter((r) => r.ownerId === patientId);
  const verified = mineList
    .filter((r) => r.status !== "pending")
    .flatMap((r) => r.values
      .filter((v) => v.status === "verified" || v.status === "corrected")
      .map((v) => ({ ...v, value: v.verifiedValue ?? v.value, reportId: r.id, reportTitle: r.title, date: r.reportDate, verifiedBy: r.reviewedBy })))
    .sort((a, b) => b.date.localeCompare(a.date));
  const newest = mineList.filter((r) => r.status === "pending").sort((a, b) => b.reportDate.localeCompare(a.reportDate))[0] || null;
  return {
    patient: db.patients[patientId],
    verified,
    newest: newest && { id: newest.id, title: newest.title, date: newest.reportDate, values: newest.values },
    reports: shaped(db, mineList).sort((a, b) => b.reportDate.localeCompare(a.reportDate)),
  };
}

export async function docListNotes(patientId) {
  await wait(300);
  const db = load();
  const allowed = new Set(visible(db).map((r) => r.ownerId));
  return db.notes
    .filter((n) => allowed.has(n.patientId) && (!patientId || n.patientId === patientId))
    .sort((a, b) => b.at - a.at)
    .map((n) => ({ ...n, patientName: db.patients[n.patientId]?.name, reportTitle: db.reports.find((r) => r.id === n.reportId)?.title }));
}

export async function docAddNote({ patientId, reportId, text }) {
  await wait(500);
  const db = load();
  if (!patientId || !visible(db).some((r) => r.ownerId === patientId)) throw fail("Choose a patient whose reports are shared with you.");
  if (!text.trim()) throw fail("Write a note before saving.");
  if (reportId && !visible(db).some((r) => r.id === reportId)) throw fail("That report is not shared with you.");
  const n = { id: "n" + Date.now(), patientId, reportId: reportId || null, at: Date.now(), author: session().name || "Doctor", text: text.trim() };
  db.notes.push(n);
  db.audit.unshift({ id: "a" + n.id, at: n.at, actor: n.author, action: "note_added", reportId: n.reportId, text: `Added a clinical note for ${db.patients[patientId]?.name}` });
  save(db);
  return n;
}

export async function docListAudit({ action = "all" } = {}) {
  await wait(350);
  const db = load();
  const ids = new Set(visible(db).map((r) => r.id));
  return db.audit
    .filter((a) => ids.has(a.reportId) && (action === "all" || a.action === action))
    .sort((a, b) => b.at - a.at)
    .map((a) => {
      const r = db.reports.find((x) => x.id === a.reportId);
      return { ...a, patientName: db.patients[r?.ownerId]?.name, reportTitle: r?.title };
    });
}
