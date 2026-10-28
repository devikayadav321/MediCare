// Browser storage stand-ins for Node
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();

const patient = await import("./meditrace-patient/src/api/mock.js");
const doctor = await import("./meditrace-patient/src/api/mockDoctor.js");

const asPatient = () => sessionStorage.setItem("mt_user", JSON.stringify({ id: "u1", name: "Umme", email: "umme@example.com", role: "patient" }));
const asDoctor = () => sessionStorage.setItem("mt_user", JSON.stringify({ id: "doc1", name: "Dr. Chen", email: "dr.chen@meditrace.health", role: "doctor" }));
const ids = (list) => list.map((x) => x.id).sort().join(",");
const failsWith = async (p) => { try { await p; return false; } catch { return true; } };

let failed = 0;
const check = (name, ok) => { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; };

// 1. Before any share: doctor sees only shared, unexpired reports (d3 share has expired)
asDoctor();
check("doctor sees d1,d2,d4,d5,d6 and not expired d3", ids(await doctor.docListCases()) === "d1,d2,d4,d5,d6");
check("doctor cannot open patient r1 (not shared)", await failsWith(doctor.docGetReview("r1")));

// 2. Patient shares pending report r2 with the doctor
asPatient();
const mineNow = await patient.listReports();
check("patient has r1, r2, r3", ids(mineNow) === "r1,r2,r3");
await patient.createShare({ doctorEmail: "dr.chen@meditrace.health", reportIds: ["r2"], days: 14 });

// 3. Doctor now sees r2 and can open it
asDoctor();
check("doctor sees r2 after patient shares it", (await doctor.docListCases()).some((c) => c.id === "r2"));
const review = await doctor.docGetReview("r2");
check("review opens with 3 values", review.values.length === 3);

// 4. Doctor save is all-or-nothing
check("incomplete decisions are rejected", await failsWith(doctor.docSaveVerification("r2", [{ id: "r2v1", action: "verify" }])));
check("failed save changes nothing", (await doctor.docGetReview("r2")).report.status === "pending");
check("empty correction is rejected", await failsWith(doctor.docSaveVerification("r2", [
  { id: "r2v1", action: "verify" }, { id: "r2v2", action: "correct", correctedValue: "" }, { id: "r2v3", action: "reject" },
])));

// 5. Doctor verifies: WBC corrected to 7.5, Platelet rejected -> status reviewed
const saved = await doctor.docSaveVerification("r2", [
  { id: "r2v1", action: "verify" }, { id: "r2v2", action: "correct", correctedValue: "7.5" }, { id: "r2v3", action: "reject" },
]);
check("report becomes reviewed (some values rejected)", saved.status === "reviewed");

// 6. Patient sees the result
asPatient();
check("patient sees r2 as reviewed", (await patient.getReport("r2")).status === "reviewed");
const verified = await patient.listVerified();
check("patient record has corrected WBC 7.5 from r2", verified.some((v) => v.reportId === "r2" && v.name === "WBC count" && v.value === 7.5));
check("rejected Platelet count is not in patient record", !verified.some((v) => v.reportId === "r2" && v.name === "Platelet count"));
check("patient activity shows doctor review", (await patient.listActivity()).some((l) => l.text.includes("reviewed your")));

// 7. Patient revokes access: doctor loses it immediately
const share = (await patient.listShares()).find((s) => s.reportIds.includes("r2"));
await patient.revokeShare(share.id);
asDoctor();
check("after revoke, doctor cannot open r2", await failsWith(doctor.docGetReview("r2")));
check("after revoke, doctor cannot add a note for Umme", await failsWith(doctor.docAddNote({ patientId: "u1", reportId: null, text: "test" })));

// 8. Audit trail: doctor sees entries for reports they can access
check("doctor audit includes d6 history", (await doctor.docListAudit()).some((a) => a.reportId === "d6"));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
