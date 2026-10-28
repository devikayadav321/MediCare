// All patient-facing status wording lives here so AI output is never
// presented as a diagnosis. Change wording in ONE place only.

export const STATUS = {
  processing: { label: "Processing report", tone: "neutral" },
  pending: { label: "Pending Doctor Verification", tone: "pending" },
  verified: { label: "Verified by doctor", tone: "verified" },
  reviewed: { label: "Reviewed by doctor (some values not confirmed)", tone: "corrected" },
  corrected: { label: "Corrected by doctor", tone: "corrected" },
  failed: { label: "Could not process", tone: "flag" },
};

export const FLAG_LABEL = {
  below: "Below range in report",
  above: "Above range in report",
};

export const DISCLAIMER =
  "Values below were read from your report by AI and are Pending Doctor Verification. They are not a diagnosis and not treatment advice. Your original report is the source of truth.";

export const SHORT_DISCLAIMER =
  "Review flags only point to values that sit outside the range printed in your report. They are not a diagnosis.";

export const PROCESS_STEPS = [
  "Report uploaded",
  "Reading the document",
  "Extracting values",
  "Linking each value to its source",
  "Ready for doctor verification",
];

// ---- Doctor interface wording ----
export const DOC_STATUS = {
  pending: { label: "Needs review", tone: "pending" },
  reviewed: { label: "Reviewed (some values rejected)", tone: "corrected" },
  verified: { label: "Verified", tone: "verified" },
};

export const VALUE_STATUS = {
  pending: { label: "Unverified (AI-extracted)", tone: "pending" },
  verified: { label: "Verified", tone: "verified" },
  corrected: { label: "Corrected", tone: "corrected" },
  rejected: { label: "Rejected", tone: "flag" },
};

export const AUDIT_ACTIONS = {
  uploaded: "Report uploaded",
  verified: "Value verified",
  corrected: "Value corrected",
  rejected: "Value rejected",
  status_change: "Status change",
  note_added: "Clinical note added",
};

export const DOC_DISCLAIMER =
  "Values were extracted by AI and are unverified until you confirm them against the original report. MediTrace does not diagnose or recommend treatment.";

export const COMPARE_DISCLAIMER =
  "Comparison is shown to support your review. It does not determine disease or recommend treatment.";
