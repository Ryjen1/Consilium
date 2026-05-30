"use client";
import type { Trade } from "@/lib/api";
import clsx from "clsx";

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtAgents(agents: string[]): string {
  return (agents || [])
    .map((a) =>
      a
        .replace(/ /g, "")
        .replace("ETFFlow", "ETF")
        .replace("UnlockRisk", "UNL")
        .replace("KOLNarrative", "KOL")
        .replace("Macro", "MCR")
    )
    .join(" · ");
}

function tradeMode(t: Trade): "paper" | "sodex" {
  return t.rationale?.startsWith("[sodex:") ? "sodex" : "paper";
}

function MacroLabel({ mode }: { mode: "paper" | "sodex" }) {
  return (
    <span
      className={clsx(
        "pill border inline-flex items-center gap-1",
        mode === "sodex"
          ? "bg-long/10 text-long border-long/20"
          : "bg-panel2 text-muted/70 border-border"
      )}
    >
      {mode === "sodex" ? "SODEX" : "PAPER"}
    </span>
  );
}

export function DecisionLog({ trades }: { trades: Trade[] }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          <span className="mono text-[11px] uppercase tracking-wider">
            NETWORK_ACTIVITY
          </span>
        </div>
        <span className="label">{trades.length} runs</span>
      </div>

      {trades.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          Quiet on the network. Click <span className="text-brand">Run Cycle</span> to fire one.
        </div>
      ) : (
        <div className="overflow-auto max-h-[340px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-panel2 border-b border-border">
              <tr className="label">
                <th className="text-left px-3 py-2 font-normal">Time</th>
                <th className="text-left px-2 py-2 font-normal">Mode</th>
                <th className="text-left px-2 py-2 font-normal">Side</th>
                <th className="text-left px-2 py-2 font-normal">Sym</th>
                <th className="text-right px-2 py-2 font-normal">Size</th>
                <th className="text-right px-2 py-2 font-normal">Conf</th>
                <th className="text-left px-3 py-2 font-normal">Agents</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={t.id ?? i}
                  className={clsx(
                    "border-b border-border/30 hover:bg-panel2/60 transition",
                    i % 2 === 1 && "bg-panel2/20"
                  )}
                >
                  <td className="px-3 py-2 mono text-[11px] text-muted">
                    {fmtTime(t.executed_at)}
                  </td>
                  <td className="px-2 py-2">
                    <MacroLabel mode={tradeMode(t)} />
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={clsx(
                        "pill border",
                        t.side === "buy"
                          ? "bg-long/10 text-long border-long/20"
                          : "bg-short/10 text-short border-short/20"
                      )}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="px-2 py-2 mono text-sm font-semibold">
                    {t.symbol}
                  </td>
                  <td className="px-2 py-2 mono text-sm text-right">
                    $
                    {t.size_usd.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-2 py-2 mono text-sm text-right text-brand2">
                    {Math.round(t.confidence * 100)}%
                  </td>
                  <td className="px-3 py-2 mono text-[11px] text-muted">
                    {fmtAgents(t.agents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
