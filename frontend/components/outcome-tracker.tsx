"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import clsx from "clsx";
import { CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";

type Outcome = "HIT" | "STOP" | "DRIFT" | "PENDING";

type OutcomeRow = {
  id: number;
  cycle_id: string;
  agent: string;
  symbol: string;
  direction: string;
  confidence: number;
  reasoning: string;
  generated_at: string;
  entry_price: number;
  outcome: Outcome;
  "7d_high": number;
  "7d_low": number;
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function OutcomeIcon({ o }: { o: Outcome }) {
  if (o === "HIT")
    return <CheckCircle2 className="w-3.5 h-3.5 text-long" />;
  if (o === "STOP")
    return <XCircle className="w-3.5 h-3.5 text-short" />;
  if (o === "DRIFT")
    return <MinusCircle className="w-3.5 h-3.5 text-muted" />;
  return <Activity className="w-3.5 h-3.5 text-muted/50" />;
}

export function OutcomeTracker() {
  const [rows, setRows] = useState<OutcomeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<OutcomeRow[]>("/api/signals/outcomes")
      .then((d) => {
        if (!cancelled) {
          setRows(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Aggregate stats
  const hits = rows.filter((r) => r.outcome === "HIT").length;
  const stops = rows.filter((r) => r.outcome === "STOP").length;
  const drifts = rows.filter((r) => r.outcome === "DRIFT").length;
  const total = rows.length;
  const winRate = total > 0 ? ((hits / total) * 100).toFixed(1) : "—";

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-brand" />
          <span className="mono text-[11px] uppercase tracking-wider">
            SIGNAL OUTCOMES
          </span>
          <span className="label opacity-60 hidden md:inline">
            · 7d lookback · SoDEX klines
          </span>
        </div>
        <span className="label">{total} evaluated</span>
      </div>

      {/* Summary stats */}
      {total > 0 && (
        <div className="px-4 py-2.5 grid grid-cols-4 gap-2 border-b border-border/50">
          <div className="flex flex-col items-center gap-0.5">
            <span className="mono text-lg font-semibold text-long">
              {winRate}%
            </span>
            <span className="label">Win rate</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="mono text-lg font-semibold text-long">{hits}</span>
            <span className="label">HIT</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="mono text-lg font-semibold text-short">
              {stops}
            </span>
            <span className="label">STOP</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="mono text-lg font-semibold text-muted">
              {drifts}
            </span>
            <span className="label">DRIFT</span>
          </div>
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          Evaluating signal outcomes…
        </div>
      ) : total === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          No signals old enough to evaluate yet (need 7 days of forward data).
        </div>
      ) : (
        <div className="flex flex-col max-h-[300px] overflow-auto">
          {rows.slice(0, 20).map((r, i) => (
            <div
              key={r.id}
              className={clsx(
                "px-4 py-2 flex items-center gap-3 text-[11px] border-b border-border/30",
                i % 2 === 1 && "bg-panel2/20",
              )}
            >
              <OutcomeIcon o={r.outcome} />
              <span className="mono font-semibold text-text w-10 shrink-0">
                {r.symbol}
              </span>
              <span
                className={clsx(
                  "mono w-10 shrink-0",
                  r.direction === "long" ? "text-long" : "text-short",
                )}
              >
                {r.direction}
              </span>
              <span className="mono text-muted w-8 shrink-0 text-right">
                {Math.round(r.confidence * 100)}%
              </span>
              <span className="text-muted truncate flex-1 min-w-0">
                {r.reasoning}
              </span>
              <span className="mono text-muted w-14 shrink-0 text-right">
                {fmtTime(r.generated_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
