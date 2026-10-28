import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import useAsync from "../hooks/useAsync";
import TrendChart from "../components/TrendChart";
import { Button, Card, EmptyState, ErrorState, Notice, PageHeader, Spinner, StatusBadge, fmtDate } from "../components/ui";

export default function Records() {
  const reports = useAsync(() => api.listReports(), []);
  const verified = useAsync(() => api.listVerified(), []);
  const [test, setTest] = useState("");

  // Trends use ONLY doctor-verified values.
  const tests = useMemo(() => {
    const map = {};
    (verified.data || []).forEach((v) => {
      const val = v.status === "corrected" ? v.verifiedValue : v.value;
      (map[v.name] ||= { unit: v.unit, refLow: v.refLow, refHigh: v.refHigh, points: [] })
        .points.push({ date: v.date, label: fmtDate(v.date), value: val });
    });
    Object.values(map).forEach((t) => t.points.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [verified.data]);

  const trendable = Object.keys(tests).filter((k) => tests[k].points.length >= 2);
  const current = test && tests[test] ? test : trendable[0];

  return (
    <>
      <PageHeader title="Previous records" text="Every report you've uploaded, and how verified values have changed over time."
        action={<Link to="/upload"><Button variant="secondary">Upload a report</Button></Link>} />

      <h2 className="mb-3 text-2xl font-semibold">Trends in verified values</h2>
      {verified.loading && <Spinner label="Loading trends" />}
      {verified.error && <ErrorState error={verified.error} onRetry={verified.reload} title="Could not load trends" />}
      {verified.data && (trendable.length === 0 ? (
        <EmptyState title="Not enough verified results for a trend"
          text="A trend needs the same test verified in at least two reports." />
      ) : (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label htmlFor="test" className="text-sm font-semibold">Test</label>
            <select id="test" value={current} onChange={(e) => setTest(e.target.value)}
              className="min-h-[44px] rounded-lg border border-line bg-white px-3 text-sm">
              {trendable.map((t) => <option key={t}>{t}</option>)}
            </select>
            <span className="text-sm text-ink-soft">Unit: {tests[current].unit}</span>
          </div>
          <TrendChart points={tests[current].points} unit={tests[current].unit}
            refLow={tests[current].refLow} refHigh={tests[current].refHigh} />
          <div className="mt-3">
            <Notice tone="pending">The shaded band is the range printed in your reports. A change over time is not a diagnosis. Talk to your doctor about what it means.</Notice>
          </div>
        </Card>
      ))}

      <h2 className="mb-3 mt-10 text-2xl font-semibold">All reports</h2>
      {reports.loading && <Spinner label="Loading reports" />}
      {reports.error && <ErrorState error={reports.error} onRetry={reports.reload} title="Could not load reports" />}
      {reports.data && (reports.data.length === 0 ? (
        <EmptyState title="No reports yet" text="Reports you upload will be listed here, newest first."
          action={<Link to="/upload"><Button>Upload a report</Button></Link>} />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {reports.data.map((r) => (
            <li key={r.id}>
              <Link to={r.status === "processing" ? `/reports/${r.id}/processing` : `/reports/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-paper">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-ink-soft">
                    {r.lab} - report dated {fmtDate(r.reportDate)} - uploaded {fmtDate(r.uploadedAt)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </>
  );
}
