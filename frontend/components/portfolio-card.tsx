"use client";
import type { PortfolioResp } from "@/lib/api";
import clsx from "clsx";

export function PortfolioCard({ data }: { data: PortfolioResp | null }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Portfolio</h3>
        <span className="pill bg-panel2 text-muted">
          gross ${data ? data.gross_exposure_usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
        </span>
      </div>
      {!data || data.positions.length === 0 ? (
        <p className="text-sm text-muted italic">No open positions.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.positions
            .sort((a, b) => Math.abs(b.net_exposure_usd) - Math.abs(a.net_exposure_usd))
            .map((p) => {
              const long = p.net_exposure_usd >= 0;
              const pct = Math.min(100, (Math.abs(p.net_exposure_usd) / Math.max(data.gross_exposure_usd, 1)) * 100);
              return (
                <div key={p.symbol} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold">{p.symbol}</span>
                    <span
                      className={clsx(
                        "font-mono",
                        long ? "text-long" : "text-short"
                      )}
                    >
                      {long ? "+" : "−"}$
                      {Math.abs(p.net_exposure_usd).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="h-1.5 bg-panel2 rounded overflow-hidden">
                    <div
                      className={clsx("h-full", long ? "bg-long" : "bg-short")}
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
