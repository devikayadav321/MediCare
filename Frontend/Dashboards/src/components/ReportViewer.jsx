import { useEffect, useRef } from "react";

// Shows the ORIGINAL report and highlights where the selected value came from.
// - If the backend sends page.imageUrl, we show the page image and draw the
//   evidence box (evidence.bbox = {x,y,w,h} in % of the page) on top.
// - Otherwise we show the OCR text lines and highlight evidence.lineId.
export default function ReportViewer({ page, evidence }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [evidence?.lineId, evidence?.bbox]);

  if (!page) return null;
  const box = evidence?.bbox;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft">
        <span>Original report</span>
        {evidence && <span>Source: page {evidence.page}</span>}
      </div>

      {page.imageUrl ? (
        <div className="relative">
          <img src={page.imageUrl} alt={`Report page ${page.page}`} className="block w-full" />
          {box && (
            <div
              ref={activeRef}
              aria-label="Source of the selected value"
              className="absolute rounded border-2 border-brand bg-brand/15"
              style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
            />
          )}
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto p-4 font-mono text-[13px] leading-7">
          {page.lines.map((l) => {
            const active = evidence?.lineId === l.id;
            return (
              <div
                key={l.id}
                ref={active ? activeRef : null}
                className={`whitespace-pre-wrap rounded px-2 ${active ? "border-l-4 border-brand bg-brand-tint font-semibold" : ""}`}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
