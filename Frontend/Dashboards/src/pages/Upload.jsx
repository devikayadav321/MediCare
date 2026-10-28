import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Button, Card, Notice, PageHeader } from "../components/ui";

const OK = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 10;

export default function Upload() {
  const nav = useNavigate();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const pick = (f) => {
    setError("");
    if (!f) return;
    if (!OK.includes(f.type)) return setError("This file type isn't supported. Upload a PDF, PNG, or JPG.");
    if (f.size > MAX_MB * 1048576) return setError(`This file is larger than ${MAX_MB} MB. Upload a smaller file.`);
    setFile(f);
  };

  const submit = async () => {
    setError("");
    setProgress(0);
    try {
      const { id } = await api.uploadReport(file, setProgress);
      nav(`/reports/${id}/processing`);
    } catch (e) {
      setError(e.message);
      setProgress(null);
    }
  };

  const busy = progress !== null;

  return (
    <>
      <PageHeader title="Upload a medical report" text="We keep your original file safe and read the values from it. Nothing is shared until you choose." />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${drag ? "border-brand bg-brand-tint" : "border-line bg-white"}`}
      >
        <p className="font-display text-xl">{file ? file.name : "Drop your report here"}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {file ? `${(file.size / 1048576).toFixed(2)} MB` : `PDF, PNG, or JPG, up to ${MAX_MB} MB`}
        </p>
        <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" id="file"
          onChange={(e) => pick(e.target.files[0])} />
        <Button variant="secondary" className="mt-4" onClick={() => input.current.click()} disabled={busy}>
          {file ? "Choose a different file" : "Choose a file"}
        </Button>
      </div>

      {error && <div className="mt-4"><Notice tone="flag"><span role="alert">{error}</span></Notice></div>}

      <Card className="mt-6">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-brand" />
          <span>I'm uploading my own medical report and understand that AI-extracted values stay <strong>Pending Doctor Verification</strong> until a doctor confirms them. They are not a diagnosis.</span>
        </label>
      </Card>

      {busy && (
        <div className="mt-6" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Uploading... {progress}%</p>
        </div>
      )}

      <Button className="mt-6" disabled={!file || !consent || busy} onClick={submit}>
        {busy ? "Uploading..." : "Upload and process"}
      </Button>
    </>
  );
}
