import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { PROCESS_STEPS } from "../constants/wording";
import { Button, Card, ErrorState, PageHeader, Spinner } from "../components/ui";

export default function Processing() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await api.getReport(id);
        if (stop) return;
        setReport(r);
        setError(null);
        if (r.status === "processing") timer.current = setTimeout(poll, 1500);
      } catch (e) {
        if (stop) return;
        setError(e);
      }
    };
    poll();
    return () => { stop = true; clearTimeout(timer.current); };
  }, [id, tick]);

  if (error) return <ErrorState error={error} onRetry={() => setTick(tick + 1)} title="Could not check processing status" />;
  if (!report) return <Spinner label="Checking your report" />;

  const failed = report.status === "failed";
  const done = report.status === "pending" || report.status === "verified";
  const stage = done ? PROCESS_STEPS.length - 1 : report.stage;

  return (
    <>
      <PageHeader title={failed ? "We couldn't process this report" : done ? "Your report is ready" : "Processing your report"}
        text={report.title} />

      <Card>
        <ol className="space-y-4" aria-live="polite">
          {PROCESS_STEPS.map((label, i) => {
            const state = failed && i >= stage ? "failed" : i < stage || done ? "done" : i === stage ? "active" : "todo";
            return (
              <li key={label} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  state === "done" ? "bg-verified text-white" : state === "active" ? "bg-brand text-white" : state === "failed" ? "bg-flag-tint text-flag" : "bg-line text-ink-soft"}`}>
                  {state === "done" ? "\u2713" : state === "failed" ? "!" : i + 1}
                </span>
                <span className={state === "todo" ? "text-ink-soft" : "font-semibold"}>{label}</span>
                {state === "active" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />}
              </li>
            );
          })}
        </ol>
      </Card>

      {failed && (
        <div className="mt-4">
          <ErrorState title="Processing failed" error={{ message: "The report may be blurry or unreadable. Upload a clearer copy and try again." }} />
          <Link to="/upload"><Button className="mt-4">Upload again</Button></Link>
        </div>
      )}

      {done && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-ink-soft">The values we found are marked <strong>Pending Doctor Verification</strong>. Review where each one came from in your original report.</p>
          <Link to={`/reports/${id}`}><Button>Review extracted values</Button></Link>
        </div>
      )}
    </>
  );
}
