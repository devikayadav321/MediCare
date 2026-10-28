import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui";

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user?.role === "doctor") return <Navigate to="/doctor" replace />;
  if (user) return <Navigate to={localStorage.getItem("mt_onboarded") ? "/" : "/welcome"} replace />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && f.password.length < 8) return setError("Use a password with at least 8 characters.");
    setBusy(true);
    try {
      mode === "login" ? await login(f.email, f.password) : await register(f);
      nav(mode === "login" && localStorage.getItem("mt_onboarded") ? "/" : "/welcome");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1 block min-h-[44px] w-full rounded-lg border border-line bg-white px-3 text-base focus:border-brand";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col justify-center bg-brand-dark px-8 py-12 text-white md:px-14">
        <p className="font-display text-4xl font-semibold">MediTrace</p>
        <h1 className="mt-6 max-w-md text-3xl font-semibold leading-snug">
          Your reports, organised, with a doctor checking every value.
        </h1>
        <p className="mt-4 max-w-md text-white/80">
          Upload a medical report. We read it, show you exactly where each value came from, and a doctor verifies it before it becomes part of your record.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h2 className="text-2xl font-semibold">{mode === "login" ? "Sign in" : "Create your account"}</h2>

          {mode === "register" && (
            <label className="mt-5 block text-sm font-semibold">Full name
              <input className={input} value={f.name} onChange={set("name")} autoComplete="name" required />
            </label>
          )}
          <label className="mt-4 block text-sm font-semibold">Email
            <input type="email" className={input} value={f.email} onChange={set("email")} autoComplete="email" required />
          </label>
          <label className="mt-4 block text-sm font-semibold">Password
            <input type="password" className={input} value={f.password} onChange={set("password")}
              autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </label>

          {error && <p role="alert" className="mt-4 rounded-lg bg-flag-tint px-3 py-2 text-sm text-flag">{error}</p>}

          <Button type="submit" className="mt-6 w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <p className="mt-5 text-sm text-ink-soft">
            {mode === "login" ? "New to MediTrace? " : "Already have an account? "}
            <button type="button" className="font-semibold text-brand-dark underline"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Are you a doctor? <Link to="/doctor/login" className="font-semibold text-brand-dark underline">Doctor sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
