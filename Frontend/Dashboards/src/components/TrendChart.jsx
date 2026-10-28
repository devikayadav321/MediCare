import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// points: [{date, value}] oldest -> newest. Shaded band = range printed in the report.
export default function TrendChart({ points, unit, refLow, refHigh }) {
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals, refLow ?? Infinity);
  const hi = Math.max(...vals, refHigh ?? -Infinity);
  const pad = (hi - lo) * 0.2 || 1;

  return (
    <div className="h-64 w-full" role="img" aria-label={`Trend of verified values in ${unit}`}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#D6E0DD" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]} tick={{ fontSize: 12 }} width={44} />
          {(refLow != null || refHigh != null) && (
            <ReferenceArea y1={refLow ?? Math.floor(lo - pad)} y2={refHigh ?? Math.ceil(hi + pad)} fill="#0E7C7B" fillOpacity={0.1} />
          )}
          <Tooltip formatter={(v) => [`${v} ${unit}`, "Verified value"]} />
          <Line type="monotone" dataKey="value" stroke="#0A5C5B" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
