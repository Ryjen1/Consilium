"use client";
import type { PortfolioResp } from "@/lib/api";
import clsx from "clsx";

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function PortfolioCard({ data }: { data: PortfolioResp | null }) {
  const positions = data?.positions ?? [];
  const gross = data?.gross_exposure_usd ?? 0;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-long" />
          <span className="mono text-[11px] uppercase tracking-wider">PORTFOLIO</span>
        </div>
        <span className="label">gross {fmtUsd(gross)}</span>
      </div>

      {positions.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          No open positions.
        </div>
      ) : (
        <div className="flex flex-col">
          {positions
            .slice()
            .sort((a, b) => Math.abs(b.net_exposure_usd) - Math.abs(a.net_exposure_usd))
            .map((p) => {
              const long = p.net_exposure_usd >= 0;
              const pct = gross > 0 ? (Math.abs(p.net_exposure_usd) / gross) * 100 : 0;
              return (
                <div
                  key={p.symbol}
                  className="px-4 py-2.5 border-b border-border/40 last:border-0 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="mono font-semibold">{p.symbol}</span>
                      <span
                        className={clsx(
                          "pill border",
                          long
                            ? "bg-long/10 text-long border-long/20"
                            : "bg-short/10 text-short border-short/20"
                        )}
                      >
                        {long ? "long" : "short"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "mono font-semibold",
                          long ? "text-long" : "text-short"
                        )}
                      >
                        {long ? "+" : "−"}
                        {fmtUsd(Math.abs(p.net_exposure_usd))}
                      </span>
                      <span className="mono text-[11px] text-muted w-10 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-panel2 rounded overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded",
                        long
                          ? "bg-gradient-to-r from-long/50 to-long"
                          : "bg-gradient-to-r from-short/50 to-short"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
