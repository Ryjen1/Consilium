"use client";
import type { Trade } from "@/lib/api";
import clsx from "clsx";

export function DecisionLog({ trades }: { trades: Trade[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Execution Log</h3>
        <span className="pill bg-panel2 text-muted">{trades.length} trades</span>
      </div>
      {trades.length === 0 ? (
        <p className="text-sm text-muted italic">
          No trades yet. Click "Run Cycle" to get going.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-border">
                <th className="text-left py-2 font-normal">Time</th>
                <th className="text-left py-2 font-normal">Symbol</th>
                <th className="text-left py-2 font-normal">Side</th>
                <th className="text-right py-2 font-normal">Size (USD)</th>
                <th className="text-right py-2 font-normal">Conf.</th>
                <th className="text-left py-2 font-normal">Agents</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={t.id ?? i} className="border-b border-border/40">
                  <td className="py-2 text-xs text-muted font-mono">
                    {new Date(t.executed_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 font-mono font-semibold">{t.symbol}</td>
                  <td className="py-2">
                    <span
                      className={clsx(
                        "pill",
                        t.side === "buy" ? "bg-long/20 text-long" : "bg-short/20 text-short"
                      )}
                    >
                      {t.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">
                    ${t.size_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2 text-right font-mono text-brand">
                    {Math.round(t.confidence * 100)}%
                  </td>
                  <td className="py-2 text-xs text-muted">
                    {(t.agents || []).join(", ")}
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
