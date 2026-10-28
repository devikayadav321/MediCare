import { Button, FlagChip, flagOf, refText } from "../ui";
import { ValueStatus } from "./badges";

// One extracted value with the doctor's decision controls.
// decision: {action: "verify"|"correct"|"reject", correctedValue}
export default function ValueReviewRow({ value, previous, decision, onDecide, selected, onSelect, readOnly }) {
  const act = decision?.action;
  const btn = (key, label, tone) => (
    <button
      type="button" disabled={readOnly} aria-pressed={act === key}
      onClick={(e) => { e.stopPropagation(); onDecide({ action: key, correctedValue: decision?.correctedValue ?? value.value }); }}
      className={`min-h-[40px] rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
        act === key ? tone : "border-line bg-white text-ink hover:border-brand"}`}
    >{label}</button>
  );

  return (
    <li
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-4 transition-colors ${selected ? "border-brand bg-brand-tint/40" : "border-line bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{value.name}</p>
          <p className="text-sm text-ink-soft">Range in report: {refText(value)}</p>
        </div>
        <p className="text-right font-display text-2xl font-semibold leading-none">
          {value.value} <span className="font-sans text-sm font-medium text-ink-soft">{value.unit}</span>
          <span className="mt-1 block font-sans text-xs font-medium text-ink-soft">AI-extracted</span>
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ValueStatus status={readOnly ? value.status : act === "verify" ? "verified" : act === "correct" ? "corrected" : act === "reject" ? "rejected" : "pending"} />
        <FlagChip value={value} />
        {previous && (
          <span className="text-xs text-ink-soft">
            Previously verified: <strong>{previous.value} {previous.unit}</strong> ({previous.date})
          </span>
        )}
      </div>

      {readOnly ? (
        value.status === "corrected" && <p className="mt-2 text-sm">Corrected value: <strong>{value.verifiedValue} {value.unit}</strong></p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {btn("verify", "Matches report", "border-verified bg-verified-tint text-verified")}
          {btn("correct", "Correct value", "border-corrected bg-corrected-tint text-corrected")}
          {btn("reject", "Reject", "border-flag bg-flag-tint text-flag")}
          {act === "correct" && (
            <label className="flex items-center gap-2 text-sm font-semibold">
              Correct value
              <input
                type="number" step="any" inputMode="decimal" value={decision.correctedValue}
                onChange={(e) => onDecide({ action: "correct", correctedValue: e.target.value })}
                className="min-h-[40px] w-28 rounded-lg border border-line px-2 text-base"
              />
              <span className="font-normal text-ink-soft">{value.unit}</span>
            </label>
          )}
        </div>
      )}
    </li>
  );
}
