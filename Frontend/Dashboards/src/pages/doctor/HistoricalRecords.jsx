import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { COMPARE_DISCLAIMER } from "../../constants/wording";
import TrendChart from "../../components/TrendChart";
import { CaseStatus } from "../../components/doctor/badges";
import { Card, EmptyState, ErrorState, Notice, PageHeader, Spinner, fmtDate } from "../../components/ui";

const sel = "min-h-[44px] rounded-lg border border-line bg-white px-3 text-sm";

export default function HistoricalRecords() {
  const [params, setParams] = useSearchParams();
  const patients = useAsync(() => api.docListPatients(), []);
  const pid = params.get("patient") || patients.data?.[0]?.id;
  const hist = useAsync(() => (pid ? api.docHistory(pid) : Promise.resolve(null)), [pid]);
  const [test, setTest] = useState("");

  const tests = useMemo(() => {
    const map = {};
    (hist.data?.verified || []).forEach((x) => {
      const val = x.status === "corrected" ? x.verifiedValue : x.value;
      (map[x.name] ||= { unit: x.unit, refLow: x.refLow, refHigh: x.refHigh, points: [] })
        .points.push({ date: x.date, label: fmtDate(x.date), value: val });
    });
    Object.values(map).forEach((t) => t.points.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [hist.data]);

  const charted = Object.keys(tests).filter((k) => tests[k].points.length >= 2);
  const current = test && tests[test]?.points.length >= 2 ? test : charted[0];
  const newest = hist.data?.newest;

  const lastVerified = (name) => {
    const t = tests[name];
    return t ? t.points[t.points.length - 1] : null;
  };

  const changeText = (now, before) => {
    if (before == null) return "No earlier verified value";
    const d = Math.round((now - before) * 100) / 100;
    return d === 0 ? "Same as previous" : d > 0 ? `Higher than previous (+${d})` : `Lower than previous (${d})`;
  };

  return (
    <>
      <PageHeader title="Historical records" text="Compare a patient's earlier verified values with their newest report." />

      {patients.loading && <Spinner label="Loading patients" />}
      {patients.error && <ErrorState error={patients.error} onRetry={patients.reload} title="Could not load patients" />}

      {patients.data && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="patient" className="text-sm font-semibold">Patient</label>
          <select id="patient" className={sel} value={pid} onChange={(e) => { setParams({ patient: e.target.value }); setTest(""); }}>
            {patients.data.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </div>
      )}

      {hist.loading && <Spinner label="Loading history" />}
      {hist.error && <ErrorState error={hist.error} onRetry={hist.reload} title="Could not load history" />}

      {hist.data && (
        <>
          <div className="mt-5"><Notice tone="pending">{COMPARE_DISCLAIMER}</Notice></div>

          <h2 className="mb-3 mt-8 text-2xl font-semibold">Newest report vs previous verified</h2>
          {!newest ? (
            <EmptyState title="No new report waiting" text="This patient has no unverified report to compare." />
          ) : (
            <Card className="!p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <p className="font-semibold">{newest.title} - {fmtDate(newest.date)}</p>
                <Link to={`/doctor/reports/${newest.id}`} className="text-sm font-semibold text-brand-dark underline">Open for review</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-paper text-ink-soft">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Test</th>
                      <th className="px-5 py-3 font-semibold">Previous verified</th>
                      <th className="px-5 py-3 font-semibold">New (unverified, AI-extracted)</th>
                      <th className="px-5 py-3 font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {newest.values.map((x) => {
                      const prev = lastVerified(x.name);
                      return (
                        <tr key={x.id}>
                          <td className="px-5 py-3 font-semibold">{x.name}</td>
                          <td className="px-5 py-3">{prev ? <>{prev.value} {x.unit} <span className="text-ink-soft">({prev.label})</span></> : <span className="text-ink-soft">None</span>}</td>
                          <td className="px-5 py-3">{x.value} {x.unit}</td>
                          <td className="px-5 py-3 text-ink-soft">{changeText(x.value, prev?.value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <h2 className="mb-3 mt-10 text-2xl font-semibold">Trend in verified values</h2>
          {charted.length === 0 ? (
            <EmptyState title="Not enough verified results for a trend" text="A trend needs the same test verified in at least two reports." />
          ) : (
            <Card>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <label htmlFor="test" className="text-sm font-semibold">Test</label>
                <select id="test" className={sel} value={current} onChange={(e) => setTest(e.target.value)}>
                  {charted.map((t) => <option key={t}>{t}</option>)}
                </select>
                <span className="text-sm text-ink-soft">Unit: {tests[current].unit}</span>
              </div>
              <TrendChart points={tests[current].points} unit={tests[current].unit} refLow={tests[current].refLow} refHigh={tests[current].refHigh} />
              <p className="mt-2 text-xs text-ink-soft">Shaded band = range printed in the report.</p>
            </Card>
          )}

          <h2 className="mb-3 mt-10 text-2xl font-semibold">All reports for this patient</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {hist.data.reports.map((r) => (
              <li key={r.id}>
                <Link to={`/doctor/reports/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-paper">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm text-ink-soft">{r.lab} - {fmtDate(r.reportDate)}</p>
                  </div>
                  <CaseStatus status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
