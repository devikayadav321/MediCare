import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { Button, Card, EmptyState, ErrorState, Notice, PageHeader, Spinner, fmtDate } from "../../components/ui";

const sel = "mt-1 block min-h-[44px] w-full rounded-lg border border-line bg-white px-3 text-base";

export default function ClinicalNotes() {
  const [params, setParams] = useSearchParams();
  const patients = useAsync(() => api.docListPatients(), []);
  const pid = params.get("patient") || "";
  const reportId = params.get("report") || "";
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const notes = useAsync(() => api.docListNotes(pid), [pid]);
  const hist = useAsync(() => (pid ? api.docHistory(pid) : Promise.resolve(null)), [pid]);

  const setPid = (v) => setParams(v ? { patient: v } : {});

  const save = async (e) => {
    e.preventDefault();
    setError(""); setDone(""); setBusy(true);
    try {
      await api.docAddNote({ patientId: pid, reportId, text });
      setText(""); setDone("Note saved.");
      notes.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Clinical notes" text="Record your consultation observations and assessment." />

      <Notice tone="pending">
        Clinical notes are your own documentation. They are kept separate from AI-extracted values and from the verified record.
      </Notice>

      <Card className="mt-6">
        <h2 className="text-xl font-semibold">New note</h2>
        {patients.loading && <Spinner label="Loading patients" />}
        {patients.error && <ErrorState error={patients.error} onRetry={patients.reload} title="Could not load patients" />}
        {patients.data && (
          <form onSubmit={save} className="mt-3" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Patient
                <select className={sel} value={pid} onChange={(e) => setPid(e.target.value)}>
                  <option value="">Choose a patient</option>
                  {patients.data.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Related report (optional)
                <select className={sel} value={reportId} disabled={!pid}
                  onChange={(e) => setParams({ patient: pid, ...(e.target.value ? { report: e.target.value } : {}) })}>
                  <option value="">None</option>
                  {(hist.data?.reports || []).map((r) => <option key={r.id} value={r.id}>{r.title} - {fmtDate(r.reportDate)}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold">Note
              <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Observations, assessment, and plan discussed with the patient"
                className="mt-1 block w-full rounded-lg border border-line bg-white p-3 text-base focus:border-brand" />
            </label>

            {error && <p role="alert" className="mt-3 rounded-lg bg-flag-tint px-3 py-2 text-sm text-flag">{error}</p>}
            {done && <p role="status" className="mt-3 rounded-lg bg-verified-tint px-3 py-2 text-sm text-verified">{done}</p>}
            <Button type="submit" className="mt-4" disabled={busy || !pid || !text.trim()}>{busy ? "Saving..." : "Save note"}</Button>
          </form>
        )}
      </Card>

      <h2 className="mb-3 mt-10 text-2xl font-semibold">{pid ? "Notes for this patient" : "All notes"}</h2>
      {notes.loading && <Spinner label="Loading notes" />}
      {notes.error && <ErrorState error={notes.error} onRetry={notes.reload} title="Could not load notes" />}
      {notes.data && (notes.data.length === 0 ? (
        <EmptyState title="No notes yet" text="Notes you save will be listed here, newest first." />
      ) : (
        <ul className="space-y-3">
          {notes.data.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{n.patientName}{n.reportTitle && <span className="font-normal text-ink-soft"> - {n.reportTitle}</span>}</p>
                <p className="text-sm text-ink-soft">{n.author} - {fmtDate(n.at)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
            </li>
          ))}
        </ul>
      ))}
    </>
  );
}
