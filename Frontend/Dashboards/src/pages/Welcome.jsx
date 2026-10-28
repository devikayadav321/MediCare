import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui";

const STEPS = [
  { title: "Upload your report", text: "Add a PDF or photo of a lab report. Your original file is always kept exactly as you uploaded it." },
  { title: "See where every value came from", text: "AI reads the report and lists each test result. Click any value to see the exact spot in your original report." },
  { title: "A doctor verifies it", text: "Everything stays marked Pending Doctor Verification until a doctor you share it with confirms or corrects it. AI never gives a diagnosis or treatment advice." },
  { title: "You control who sees it", text: "Share reports with a doctor for a set time, and stop sharing whenever you like." },
];

export default function Welcome() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  if (!user) return <Navigate to="/login" replace />;
  const last = i === STEPS.length - 1;
  const s = STEPS[i];

  const next = () => {
    if (!last) return setI(i + 1);
    localStorage.setItem("mt_onboarded", "1");
    nav("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8">
        <p className="text-sm font-semibold text-brand-dark">Welcome, {user.name}</p>
        <div className="mt-6 min-h-[150px]" aria-live="polite">
          <h1 className="text-3xl font-semibold">{s.title}</h1>
          <p className="mt-3 leading-relaxed text-ink-soft">{s.text}</p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2" aria-hidden="true">
            {STEPS.map((_, n) => <span key={n} className={`h-2 w-8 rounded-full ${n <= i ? "bg-brand" : "bg-line"}`} />)}
          </div>
          <div className="flex gap-2">
            {i > 0 && <Button variant="secondary" onClick={() => setI(i - 1)}>Back</Button>}
            <Button onClick={next}>{last ? "Go to dashboard" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
