import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/doctor", label: "Dashboard", end: true },
  { to: "/doctor/cases", label: "Patient cases" },
  { to: "/doctor/history", label: "Historical records" },
  { to: "/doctor/notes", label: "Clinical notes" },
  { to: "/doctor/audit", label: "Audit history" },
];

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? "bg-ink text-white" : "text-ink-soft hover:bg-paper hover:text-ink"
  }`;

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/doctor/login" replace />;
  if (user.role !== "doctor") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white p-4 md:flex">
        <div className="px-3 pb-6 pt-2">
          <p className="font-display text-2xl font-semibold text-ink">MediTrace</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">Doctor workspace</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Doctor">
          {NAV.map((n) => <NavLink key={n.to} {...n} className={linkClass}>{n.label}</NavLink>)}
        </nav>
        <div className="border-t border-line px-3 pt-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <button onClick={logout} className="mt-2 text-sm font-semibold text-brand-dark underline">Sign out</button>
        </div>
      </aside>

      <div className="flex-1 pb-20 md:pb-0">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
          <p className="font-display text-xl font-semibold">MediTrace <span className="text-sm text-brand-dark">Doctor</span></p>
          <button onClick={logout} className="text-sm font-semibold text-brand-dark underline">Sign out</button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10"><Outlet /></main>
      </div>

      <nav aria-label="Doctor" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white md:hidden">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `px-1 py-3 text-center text-[11px] font-semibold leading-tight ${isActive ? "text-brand-dark" : "text-ink-soft"}`}>
            {n.label.replace("Patient ", "").replace(" records", "").replace(" history", "").replace("Clinical ", "")}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
