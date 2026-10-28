import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { AUDIT_ACTIONS } from "../../constants/wording";
import { Badge, EmptyState, ErrorState, PageHeader, Spinner } from "../../components/ui";

const TONE = { verified: "verified", corrected: "corrected", rejected: "flag", status_change: "pending", uploaded: "neutral", note_added: "neutral" };
const when = (t) => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AuditHistory() {
  const [action, setAction] = useState("all");
  const { data, error, loading, reload } = useAsync(() => api.docListAudit({ action }), [action]);

  return (
    <>
      <PageHeader title="Audit history" text="Who reviewed what, which values were corrected, and when status changed." />

      <div className="flex items-center gap-3">
        <label htmlFor="action" className="text-sm font-semibold">Show</label>
        <select id="action" value={action} onChange={(e) => setAction(e.target.value)}
          className="min-h-[44px] rounded-lg border border-line bg-white px-3 text-sm">
          <option value="all">All activity</option>
          {Object.entries(AUDIT_ACTIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      <div className="mt-5">
        {loading && <Spinner label="Loading audit history" />}
        {error && <ErrorState error={error} onRetry={reload} title="Could not load audit history" />}
        {data && data.length === 0 && <EmptyState title="Nothing to show" text="No activity matches this filter." />}
        {data && data.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Who</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">Patient / report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{when(a.at)}</td>
                    <td className="px-4 py-3">{a.actor}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[a.action] || "neutral"}>{AUDIT_ACTIONS[a.action] || a.action}</Badge></td>
                    <td className="px-4 py-3">{a.text}</td>
                    <td className="px-4 py-3">
                      {a.reportId ? (
                        <Link to={`/doctor/reports/${a.reportId}`} className="font-semibold text-brand-dark underline">
                          {a.patientName} - {a.reportTitle}
                        </Link>
                      ) : <span className="text-ink-soft">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
