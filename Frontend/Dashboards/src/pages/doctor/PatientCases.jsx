import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { EmptyState, ErrorState, PageHeader, Spinner, fmtDate } from "../../components/ui";
import { CaseStatus } from "../../components/doctor/badges";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Needs review" },
  { id: "reviewed", label: "Reviewed" },
  { id: "verified", label: "Verified" },
];

export default function PatientCases() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [status, setStatus] = useState("all");

  // wait until the doctor stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAsync(() => api.docListCases({ q: dq, status }), [dq, status]);

  return (
    <>
      <PageHeader title="Patient cases" text="Search patients and open a report to review." />

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="search">Search patients or reports</label>
        <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by patient name, ID, or report"
          className="min-h-[44px] w-full max-w-md rounded-lg border border-line bg-white px-3 text-base focus:border-brand" />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={status === f.id} onClick={() => setStatus(f.id)}
              className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${status === f.id ? "border-brand bg-brand-tint text-brand-dark" : "border-line bg-white text-ink-soft"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading && <Spinner label="Loading cases" />}
        {error && <ErrorState error={error} onRetry={reload} title="Could not load cases" />}
        {data && data.length === 0 && (
          <EmptyState title="No matching cases" text="Try a different name or status filter." />
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Report</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((r) => (
                  <tr key={r.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.patient.name}</p>
                      <p className="text-xs text-ink-soft">{r.patient.code} - {r.patient.age}, {r.patient.sex}</p>
                    </td>
                    <td className="px-4 py-3">{r.title}<p className="text-xs text-ink-soft">{r.lab} - {fmtDate(r.reportDate)}</p></td>
                    <td className="px-4 py-3 text-ink-soft">{fmtDate(r.uploadedAt)}</td>
                    <td className="px-4 py-3"><CaseStatus status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/doctor/reports/${r.id}`} className="mr-4 font-semibold text-brand-dark underline">
                        {r.status === "pending" ? "Review" : "Open"}
                      </Link>
                      <Link to={`/doctor/history?patient=${r.patient.id}`} className="font-semibold text-brand-dark underline">History</Link>
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
