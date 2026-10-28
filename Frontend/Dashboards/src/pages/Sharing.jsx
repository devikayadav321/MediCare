import { useState } from "react";
import { api } from "../api/client";
import useAsync from "../hooks/useAsync";
import { Badge, Button, Card, EmptyState, ErrorState, Notice, PageHeader, Spinner, StatusBadge, fmtDate } from "../components/ui";

const DAYS = [7, 14, 30, 90];

export default function Sharing() {
  const reports = useAsync(() => api.listReports(), []);
  const shares = useAsync(() => api.listShares(), []);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(14);
  const [chosen, setChosen] = useState([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [revoking, setRevoking] = useState(null);

  const shareable = (reports.data || []).filter((r) => r.status === "pending" || r.status === "verified");
  const titleOf = (id) => reports.data?.find((r) => r.id === id)?.title || "Report";
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setDone("");
    setBusy(true);
    try {
      await api.createShare({ doctorEmail: email.trim(), reportIds: chosen, days });
      setDone(`Shared with ${email.trim()} for ${days} days.`);
      setEmail(""); setChosen([]); setConsent(false);
      shares.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    setRevoking(id);
    try { await api.revokeShare(id); shares.reload(); }
    catch (err) { setError(err.message); }
    finally { setRevoking(null); }
  };

  const input = "mt-1 block min-h-[44px] w-full rounded-lg border border-line bg-white px-3 text-base focus:border-brand";

  return (
    <>
      <PageHeader title="Secure sharing" text="Give a doctor temporary access to chosen reports so they can verify the values. You can stop sharing at any time." />

      <Card>
        <h2 className="text-xl font-semibold">Share reports with a doctor</h2>
        {reports.loading && <Spinner label="Loading your reports" />}
        {reports.error && <ErrorState error={reports.error} onRetry={reports.reload} title="Could not load your reports" />}

        {reports.data && shareable.length === 0 && (
          <p className="mt-3 text-sm text-ink-soft">Upload and process a report first. Then you can share it here.</p>
        )}

        {reports.data && shareable.length > 0 && (
          <form onSubmit={submit} className="mt-4" noValidate>
            <fieldset>
              <legend className="text-sm font-semibold">Reports to share</legend>
              <div className="mt-2 space-y-2">
                {shareable.map((r) => (
                  <label key={r.id} className="flex min-h-[44px] items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-brand" checked={chosen.includes(r.id)} onChange={() => toggle(r.id)} />
                    <span className="flex-1"><strong>{r.title}</strong> <span className="text-ink-soft">- {fmtDate(r.reportDate)}</span></span>
                    <StatusBadge status={r.status} />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Doctor's email
                <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@hospital.com" />
              </label>
              <label className="block text-sm font-semibold">Access lasts
                <select className={input} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to let this doctor view the selected reports until access ends. I can stop sharing at any time.</span>
            </label>

            {error && <p role="alert" className="mt-4 rounded-lg bg-flag-tint px-3 py-2 text-sm text-flag">{error}</p>}
            {done && <p role="status" className="mt-4 rounded-lg bg-verified-tint px-3 py-2 text-sm text-verified">{done}</p>}

            <Button type="submit" className="mt-4" disabled={busy || !consent || !email || chosen.length === 0}>
              {busy ? "Sharing..." : "Share with doctor"}
            </Button>
          </form>
        )}
      </Card>

      <h2 className="mb-3 mt-10 text-2xl font-semibold">Who has access</h2>
      {shares.loading && <Spinner label="Loading shares" />}
      {shares.error && <ErrorState error={shares.error} onRetry={shares.reload} title="Could not load shares" />}
      {shares.data && (shares.data.length === 0 ? (
        <EmptyState title="You haven't shared anything" text="Reports you share will be listed here with their expiry date." />
      ) : (
        <ul className="space-y-3">
          {shares.data.map((s) => (
            <li key={s.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.doctorEmail}</p>
                  <p className="text-sm text-ink-soft">{s.reportIds.map(titleOf).join(", ")}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {s.status === "active" ? `Access ends ${fmtDate(s.expiresAt)}` : s.status === "revoked" ? "You stopped sharing" : `Access ended ${fmtDate(s.expiresAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.status === "active" ? "verified" : "neutral"}>
                    {s.status === "active" ? "Active" : s.status === "revoked" ? "Stopped" : "Expired"}
                  </Badge>
                  {s.status === "active" && (
                    <Button variant="danger" disabled={revoking === s.id} onClick={() => revoke(s.id)}>
                      {revoking === s.id ? "Stopping..." : "Stop sharing"}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ))}

      <div className="mt-8">
        <Notice tone="pending">Doctors can verify or correct values. Only they can change a value's status to verified.</Notice>
      </div>
    </>
  );
}
