"use client";
import type { Signal } from "@/lib/api";
import clsx from "clsx";

export function AgentPanel({
  name,
  description,
  signals,
}: {
  name: string;
  description: string;
  signals: Signal[];
}) {
  const mine = signals.filter((s) => s.agent === name);
  return (
    <div className="card flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">{name}</h3>
          <span className="pill bg-panel2 text-muted">
            {mine.length} signal{mine.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        {mine.length === 0 && (
          <p className="text-xs text-muted italic">No active signals this cycle.</p>
        )}
        {mine.map((s, i) => (
          <div
            key={i}
            className="bg-panel2 rounded-lg p-3 border border-border flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{s.symbol}</span>
              <span
                className={clsx(
                  "pill",
                  s.direction === "long" && "bg-long/20 text-long",
                  s.direction === "short" && "bg-short/20 text-short",
                  s.direction === "flat" && "bg-panel2 text-muted"
                )}
              >
                {s.direction.toUpperCase()}
              </span>
              <span className="pill bg-brand/20 text-brand ml-auto">
                conf {Math.round(s.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-text/80 leading-relaxed">{s.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
