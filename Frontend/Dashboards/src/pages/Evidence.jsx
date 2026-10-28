import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import useAsync from "../hooks/useAsync";
import { DISCLAIMER, SHORT_DISCLAIMER } from "../constants/wording";
import ReportViewer from "../components/ReportViewer";
import { Button, ErrorState, FlagChip, Notice, PageHeader, Spinner, StatusBadge, fmtDate, flagOf, refText } from "../components/ui";

const FILTERS = [
  { id: "all", label: "All values" },
  { id: "flagged", label: "Flagged for review" },
];

export default function Evidence() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.getExtraction(id), [id]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (data && !selected) setSelected(data.values[0]?.id);
  }, [data, selected]);

  if (loading) return <Spinner label="Loading extracted values" />;
  if (error?.status === 409) return (
    <ErrorState title="Still processing" error={error}
      onRetry={() => window.location.assign(`/reports/${id}/processing`)} />
  );
  if (error) return <ErrorState error={error} onRetry={reload} title="Could not load this report" />;

  const { report, values, pages } = data;
  const shown = filter === "flagged" ? values.filter((v) => flagOf(v)) : values;
  const active = values.find((v) => v.id === selected);
  const page = pages.find((p) => p.page === active?.evidence.page) || pages[0];
  const allVerified = report.status === "verified";

  return (
    <>
      <PageHeader
        title={report.title}
        text={`${report.lab} - report dated ${fmtDate(report.reportDate)}`}
        action={<StatusBadge status={report.status} />}
      />

      <Notice tone={allVerified ? "verified" : "pending"}>
        {allVerified
          ? <>Verified by <strong>{report.verifiedBy}</strong> on {fmtDate(report.verifiedAt)}. {SHORT_DISCLAIMER}</>
          : DISCLAIMER}
      </Notice>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter values">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${filter === f.id ? "border-brand bg-brand-tint text-brand-dark" : "border-line bg-white text-ink-soft"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <ul className="space-y-3">
          {shown.length === 0 && <li className="text-sm text-ink-soft">No values are outside the ranges printed in this report.</li>}
          {shown.map((v) => {
            const on = v.id === selected;
            return (
              <li key={v.id}>
                <button onClick={() => setSelected(v.id)} aria-pressed={on}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${on ? "border-brand bg-brand-tint/50" : "border-line bg-white hover:border-brand"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{v.name}</p>
                    <p className="font-display text-2xl font-semibold leading-none">
                      {v.value} <span className="font-sans text-sm font-medium text-ink-soft">{v.unit}</span>
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">Range in report: {refText(v)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={v.status} />
                    <FlagChip value={v} />
                  </div>
                  {v.status === "corrected" && (
                    <p className="mt-2 text-sm">Doctor-corrected value: <strong>{v.verifiedValue} {v.unit}</strong></p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-brand-dark">{on ? "Showing source in report" : "Show source in report"}</p>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-2 text-xl font-semibold">Where this came from</h2>
          <ReportViewer page={page} evidence={active?.evidence} />
          {active && (
            <p className="mt-2 text-sm text-ink-soft">
              Read from page {active.evidence.page}: <em>{active.evidence.text.replace(/\s+/g, " ")}</em>
            </p>
          )}
          <p className="mt-2 text-xs text-ink-soft">If this doesn't match your report, your doctor will correct it during verification.</p>
        </div>
      </div>

      {!allVerified && (
        <div className="mt-8"><Link to="/sharing"><Button>Share with a doctor to verify</Button></Link></div>
      )}
    </>
  );
}
