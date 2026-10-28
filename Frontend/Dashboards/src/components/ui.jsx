import { STATUS, FLAG_LABEL } from "../constants/wording";

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const refText = (v) => {
  if (v.refLow != null && v.refHigh != null) return `${v.refLow} - ${v.refHigh} ${v.unit}`;
  if (v.refHigh != null) return `below ${v.refHigh} ${v.unit}`;
  if (v.refLow != null) return `above ${v.refLow} ${v.unit}`;
  return "Not given in report";
};

// "below" | "above" | null  (only compares with the range printed in the report)
export const flagOf = (v) => {
  if (v.refLow != null && v.value < v.refLow) return "below";
  if (v.refHigh != null && v.value > v.refHigh) return "above";
  return null;
};

const TONES = {
  neutral: "bg-line/60 text-ink-soft",
  pending: "bg-pending-tint text-pending",
  verified: "bg-verified-tint text-verified",
  corrected: "bg-corrected-tint text-corrected",
  flag: "bg-flag-tint text-flag",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.processing;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function FlagChip({ value }) {
  const f = flagOf(value);
  if (!f) return null;
  return <Badge tone="flag">{FLAG_LABEL[f]}</Badge>;
}

export function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-ink-soft/40",
    secondary: "border border-line bg-white text-ink hover:border-brand hover:text-brand-dark disabled:opacity-50",
    danger: "border border-flag/40 bg-white text-flag hover:bg-flag-tint disabled:opacity-50",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <section {...rest} className={`rounded-xl border border-line bg-white p-5 ${className}`}>
      {children}
    </section>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-ink-soft">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="text-sm">{label}...</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }) {
  return (
    <div role="alert" className="rounded-xl border border-flag/30 bg-flag-tint p-5">
      <p className="font-semibold text-flag">{title}</p>
      <p className="mt-1 text-sm text-ink">{error?.message || "Try again in a moment."}</p>
      {onRetry && <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "pending", children }) {
  const t = { pending: "border-pending/30 bg-pending-tint", verified: "border-verified/30 bg-verified-tint", flag: "border-flag/30 bg-flag-tint" }[tone];
  return <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${t}`}>{children}</div>;
}

export function PageHeader({ title, text, action }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        {text && <p className="mt-1 max-w-2xl text-ink-soft">{text}</p>}
      </div>
      {action}
    </header>
  );
}
