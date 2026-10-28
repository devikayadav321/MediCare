import { Link } from "react-router-dom";
import { api } from "../api/client";
import useAsync from "../hooks/useAsync";
import { SHORT_DISCLAIMER } from "../constants/wording";
import { Button, EmptyState, ErrorState, FlagChip, Notice, PageHeader, Spinner, StatusBadge, fmtDate, refText } from "../components/ui";

export default function Verified() {
  const { data, error, loading, reload } = useAsync(() => api.listVerified(), []);

  const grouped = (data || []).reduce((acc, v) => {
    (acc[v.reportId] ||= { title: v.reportTitle, date: v.date, by: v.verifiedBy, at: v.verifiedAt, items: [] }).items.push(v);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Verified health information"
        text="Only values a doctor has confirmed or corrected appear here. Anything still pending stays in its report." />

      {loading && <Spinner label="Loading verified information" />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load verified information" />}

      {data && data.length === 0 && (
        <EmptyState title="Nothing verified yet"
          text="Share a report with a doctor. Once they verify it, the confirmed values show up here."
          action={<Link to="/sharing"><Button>Share a report</Button></Link>} />
      )}

      {data && data.length > 0 && (
        <>
          <Notice tone="verified">{SHORT_DISCLAIMER}</Notice>
          <div className="mt-6 space-y-8">
            {Object.entries(grouped).map(([rid, g]) => (
              <section key={rid}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-semibold">{g.title}</h2>
                  <p className="text-sm text-ink-soft">Report dated {fmtDate(g.date)} - verified by {g.by} on {fmtDate(g.at)}</p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-line bg-white">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-line bg-paper text-ink-soft">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Test</th>
                        <th className="px-4 py-3 font-semibold">Verified result</th>
                        <th className="px-4 py-3 font-semibold">Range in report</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {g.items.map((v) => {
                        const shownValue = v.status === "corrected" ? v.verifiedValue : v.value;
                        return (
                          <tr key={v.id}>
                            <td className="px-4 py-3 font-semibold">{v.name}</td>
                            <td className="px-4 py-3">{shownValue} {v.unit}</td>
                            <td className="px-4 py-3 text-ink-soft">{refText(v)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <StatusBadge status={v.status} />
                                <FlagChip value={{ ...v, value: shownValue }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Link to={`/reports/${rid}`} className="mt-2 inline-block text-sm font-semibold text-brand-dark underline">View original report and sources</Link>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
