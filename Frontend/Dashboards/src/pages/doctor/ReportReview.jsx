import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { DOC_DISCLAIMER } from "../../constants/wording";
import ReportViewer from "../../components/ReportViewer";
import ValueReviewRow from "../../components/doctor/ValueReviewRow";
import { CaseStatus } from "../../components/doctor/badges";
import { Button, ErrorState, Notice, PageHeader, Spinner, fmtDate } from "../../components/ui";

export default function ReportReview() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.docGetReview(id), [id]);
  const [decisions, setDecisions] = useState({});
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) { setSelected(data.values[0]?.id); setDecisions({}); setSaved(false); }
  }, [data]);

  if (loading) return <Spinner label="Loading report for review" />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Could not load this report" />;

  const { report, values, pages, previous } = data;
  const readOnly = report.status !== "pending";
  const decided = values.filter((v) => decisions[v.id]).length;
  const counts = { verify: 0, correct: 0, reject: 0 };
  Object.values(decisions).forEach((d) => (counts[d.action] += 1));
  const missingCorrection = values.some((v) => decisions[v.id]?.action === "correct" && (decisions[v.id].correctedValue === "" || Number.isNaN(Number(decisions[v.id].correctedValue))));
  const ready = decided === values.length && !missingCorrection;
  const active = values.find((v) => v.id === selected);

  const save = async () => {
    setSaveError(""); setSaving(true);
    try {
      await api.docSaveVerification(id, values.map((v) => ({ id: v.id, ...decisions[v.id] })));
      setSaved(true);
      reload();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={report.title}
        text={`${report.patient.name} (${report.patient.code}) - ${report.lab} - report dated ${fmtDate(report.reportDate)}`}
        action={<CaseStatus status={report.status} />}
      />

      {saved && <div className="mb-4"><Notice tone="verified"><span role="status">Verification saved. Only verified and corrected values are now part of the patient's verified record.</span></Notice></div>}

      {readOnly ? (
        <Notice tone="verified">
          Reviewed by <strong>{report.reviewedBy}</strong> on {fmtDate(report.reviewedAt)}. This review is complete and cannot be changed here.
        </Notice>
      ) : (
        <Notice tone="pending">{DOC_DISCLAIMER}</Notice>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Extracted values</h2>
            {!readOnly && <p className="text-sm text-ink-soft">{decided} of {values.length} decided</p>}
          </div>
          <ul className="space-y-3">
            {values.map((v) => (
              <ValueReviewRow
                key={v.id} value={v} previous={previous[v.name]} readOnly={readOnly}
                decision={decisions[v.id]} selected={v.id === selected}
                onSelect={() => setSelected(v.id)}
                onDecide={(d) => { setSelected(v.id); setDecisions({ ...decisions, [v.id]: d }); }}
              />
            ))}
          </ul>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-2 text-xl font-semibold">Original report</h2>
          <ReportViewer page={pages.find((p) => p.page === active?.evidence.page) || pages[0]} evidence={active?.evidence} />
          {active && <p className="mt-2 text-sm text-ink-soft">Source line: <em>{active.evidence.text.replace(/\s+/g, " ")}</em></p>}
        </div>
      </div>

      {!readOnly && (
        <div className="mt-8 rounded-xl border border-line bg-white p-5">
          <p className="font-semibold">Finish verification</p>
          <p className="mt-1 text-sm text-ink-soft">
            {counts.verify} verified, {counts.correct} corrected, {counts.reject} rejected. Only verified and corrected values join the patient's verified record. Rejected values stay out of it.
          </p>
          {missingCorrection && <p role="alert" className="mt-2 text-sm text-flag">Enter a number for every corrected value.</p>}
          {saveError && <p role="alert" className="mt-2 rounded-lg bg-flag-tint px-3 py-2 text-sm text-flag">{saveError}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={save} disabled={!ready || saving}>{saving ? "Saving..." : "Save verification"}</Button>
            <Link to={`/doctor/history?patient=${report.patient.id}`}><Button variant="secondary">Compare with history</Button></Link>
            <Link to={`/doctor/notes?patient=${report.patient.id}&report=${report.id}`}><Button variant="secondary">Add clinical note</Button></Link>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`/doctor/history?patient=${report.patient.id}`}><Button variant="secondary">Compare with history</Button></Link>
          <Link to={`/doctor/notes?patient=${report.patient.id}&report=${report.id}`}><Button variant="secondary">Add clinical note</Button></Link>
        </div>
      )}
    </>
  );
}
