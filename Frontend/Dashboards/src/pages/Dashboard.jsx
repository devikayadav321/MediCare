import { Link } from "react-router-dom";
import { api } from "../api/client";
import useAsync from "../hooks/useAsync";
import { useAuth } from "../hooks/useAuth";
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner, StatusBadge, fmtDate } from "../components/ui";

const Stat = ({ n, label }) => (
  <Card className="!p-4">
    <p className="font-display text-3xl font-semibold">{n}</p>
    <p className="text-sm text-ink-soft">{label}</p>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const reports = useAsync(() => api.listReports(), []);
  const shares = useAsync(() => api.listShares(), []);
  const activity = useAsync(() => api.listActivity(), []);

  const list = reports.data || [];
  const stats = {
    total: list.length,
    pending: list.filter((r) => r.status === "pending").length,
    verified: list.filter((r) => r.status === "verified").length,
    shares: (shares.data || []).filter((s) => s.status === "active").length,
  };

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name}`}
        text="Your reports and their verification status."
        action={<Link to="/upload"><Button>Upload a report</Button></Link>}
      />

      {reports.loading && <Spinner label="Loading your reports" />}
      {reports.error && <ErrorState error={reports.error} onRetry={reports.reload} title="Could not load your reports" />}

      {!reports.loading && !reports.error && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat n={stats.total} label="Reports uploaded" />
            <Stat n={stats.pending} label="Pending Doctor Verification" />
            <Stat n={stats.verified} label="Verified by doctor" />
            <Stat n={stats.shares} label="Active shares" />
          </div>

          <h2 className="mb-3 mt-10 text-2xl font-semibold">Recent reports</h2>
          {list.length === 0 ? (
            <EmptyState title="No reports yet" text="Upload your first medical report to see its values and where they came from."
              action={<Link to="/upload"><Button>Upload a report</Button></Link>} />
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {list.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link to={r.status === "processing" ? `/reports/${r.id}/processing` : `/reports/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-paper">
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-ink-soft">{r.lab} - report dated {fmtDate(r.reportDate)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-10 text-2xl font-semibold">Recent activity</h2>
          {activity.loading && <Spinner label="Loading activity" />}
          {activity.error && <ErrorState error={activity.error} onRetry={activity.reload} />}
          {activity.data && (activity.data.length === 0
            ? <p className="text-sm text-ink-soft">Uploads and sharing changes will appear here.</p>
            : <ul className="space-y-2 text-sm">
                {activity.data.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded-lg bg-white px-4 py-3 border border-line">
                    {a.text} <span className="text-ink-soft">- {fmtDate(a.at)}</span>
                  </li>
                ))}
              </ul>)}
        </>
      )}
    </>
  );
}
