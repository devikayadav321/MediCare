import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui";

export default function DoctorLogin() {
  const { user, doctorLogin } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user?.role === "doctor") return <Navigate to="/doctor" replace />;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try { await doctorLogin(f.email, f.password); nav("/doctor"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const input = "mt-1 block min-h-[44px] w-full rounded-lg border border-line bg-white px-3 text-base focus:border-brand";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col justify-center bg-ink px-8 py-12 text-white md:px-14">
        <p className="font-display text-4xl font-semibold">MediTrace</p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand-tint">Doctor workspace</p>
        <h1 className="mt-6 max-w-md text-3xl font-semibold leading-snug">
          AI organises the report. You decide what goes in the record.
        </h1>
        <p className="mt-4 max-w-md text-white/80">
          Compare each extracted value with the original report, correct errors, and verify. Only values you confirm become part of the patient's verified record.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h2 className="text-2xl font-semibold">Doctor sign in</h2>
          <label className="mt-5 block text-sm font-semibold">Work email
            <input type="email" className={input} value={f.email} autoComplete="email"
              onChange={(e) => setF({ ...f, email: e.target.value })} required />
          </label>
          <label className="mt-4 block text-sm font-semibold">Password
            <input type="password" className={input} value={f.password} autoComplete="current-password"
              onChange={(e) => setF({ ...f, password: e.target.value })} required />
          </label>
          {error && <p role="alert" className="mt-4 rounded-lg bg-flag-tint px-3 py-2 text-sm text-flag">{error}</p>}
          <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Please wait..." : "Sign in"}</Button>
          <p className="mt-5 text-sm text-ink-soft">
            Are you a patient? <Link to="/login" className="font-semibold text-brand-dark underline">Patient sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
