import { Link } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner, fmtDate } from "../../components/ui";
import { CaseStatus } from "../../components/doctor/badges";

const Stat = ({ n, label, tone = "" }) => (
  <Card className="!p-4">
    <p className={`font-display text-3xl font-semibold ${tone}`}>{n}</p>
    <p className="text-sm text-ink-soft">{label}</p>
  </Card>
);

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.docDashboard(), []);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} text="Reports waiting for your verification, and your progress."
        action={<Link to="/doctor/cases"><Button variant="secondary">All patient cases</Button></Link>} />

      {loading && <Spinner label="Loading your workspace" />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load the dashboard" />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat n={data.pending} label="Reports needing review" tone="text-pending" />
            <Stat n={data.reviewed} label="Reviewed (some rejected)" />
            <Stat n={data.verified} label="Fully verified" tone="text-verified" />
            <Stat n={data.patients} label="Patients" />
          </div>

          <Card className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">Verification progress</p>
              <p className="text-sm text-ink-soft">{data.done} of {data.total} reports reviewed</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-line" role="progressbar"
              aria-valuenow={data.done} aria-valuemin={0} aria-valuemax={data.total} aria-label="Reports reviewed">
              <div className="h-full bg-verified transition-all" style={{ width: `${data.total ? (data.done / data.total) * 100 : 0}%` }} />
            </div>
          </Card>

          <h2 className="mb-3 mt-10 text-2xl font-semibold">Needs your review</h2>
          {data.needsReview.length === 0 ? (
            <EmptyState title="You're all caught up" text="New patient reports will appear here when they are shared with you." />
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {data.needsReview.map((r) => (
                <li key={r.id}>
                  <Link to={`/doctor/reports/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-paper">
                    <div>
                      <p className="font-semibold">{r.patient.name} <span className="font-normal text-ink-soft">({r.patient.code})</span></p>
                      <p className="text-sm text-ink-soft">{r.title} - {r.lab} - uploaded {fmtDate(r.uploadedAt)} - {r.valueCount} values</p>
                    </div>
                    <CaseStatus status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
