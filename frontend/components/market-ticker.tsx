"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";

type Market = {
  symbol: string;
  full_symbol: string;
  price: number;
  change_pct_24h: number;
};

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(5)}`;
}

export function MarketTicker() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const m = await api<Market[]>("/api/markets");
        if (!cancelled) {
          setMarkets(m);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card px-4 py-3 flex items-center gap-4 overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
        <span className="label">Live · SoDEX Testnet</span>
      </div>

      <div className="flex items-center gap-6">
        {loading && (
          <span className="text-xs text-muted">Loading markets…</span>
        )}
        {!loading && markets.length === 0 && (
          <span className="text-xs text-muted">
            Start the backend to see live prices.
          </span>
        )}
        {markets.map((m) => {
          const up = m.change_pct_24h >= 0;
          return (
            <div
              key={m.symbol}
              className="flex items-center gap-2 shrink-0"
            >
              <span className="mono font-semibold text-sm text-text">
                {m.symbol}
              </span>
              <span className="mono text-sm text-text">{fmtPrice(m.price)}</span>
              <span
                className={clsx(
                  "mono text-[11px]",
                  up ? "text-long" : "text-short"
                )}
              >
                {up ? "+" : ""}
                {m.change_pct_24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
