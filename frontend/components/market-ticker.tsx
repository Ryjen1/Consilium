"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import { api } from "@/lib/api";

type Market = {
  symbol: string;
  full_symbol: string;
  price: number;
  change_pct_24h: number;
};

type Flash = "up" | "down" | null;

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(5)}`;
}

export function MarketTicker() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashes, setFlashes] = useState<Record<string, Flash>>({});
  const prevPrices = useRef<Record<string, number>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const m = await api<Market[]>("/api/markets");
        if (cancelled) return;

        // Detect price changes and trigger flashes.
        const nextFlashes: Record<string, Flash> = {};
        for (const row of m) {
          const prev = prevPrices.current[row.symbol];
          if (prev !== undefined && prev !== row.price) {
            nextFlashes[row.symbol] = row.price > prev ? "up" : "down";
            // Clear flash after 700ms so the glow fades naturally.
            clearTimeout(flashTimers.current[row.symbol]);
            flashTimers.current[row.symbol] = setTimeout(() => {
              setFlashes((f) => ({ ...f, [row.symbol]: null }));
            }, 700);
          }
          prevPrices.current[row.symbol] = row.price;
        }

        setMarkets(m);
        if (Object.keys(nextFlashes).length > 0) {
          setFlashes((f) => ({ ...f, ...nextFlashes }));
        }
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // Faster polling so the ticker feels live.
    const id = setInterval(load, 3_000);

    return () => {
      cancelled = true;
      clearInterval(id);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="card px-4 py-3 flex items-center gap-4 overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
        <span className="label">Live · SoDEX Testnet</span>
      </div>

      <div className="flex items-center gap-6">
        {loading && markets.length === 0 && (
          <span className="text-xs text-muted">Loading markets…</span>
        )}
        {!loading && markets.length === 0 && (
          <span className="text-xs text-muted">
            Start the backend to see live prices.
          </span>
        )}
        {markets.map((m) => {
          const up = m.change_pct_24h >= 0;
          const flash = flashes[m.symbol];
          return (
            <div
              key={m.symbol}
              className={clsx(
                "flex items-center gap-2 shrink-0 px-2 py-1 rounded-md transition-colors duration-700",
                flash === "up" && "bg-long/15",
                flash === "down" && "bg-short/15"
              )}
            >
              <span className="mono font-semibold text-sm text-text">
                {m.symbol}
              </span>
              <span
                className={clsx(
                  "mono text-sm transition-colors duration-500",
                  flash === "up"
                    ? "text-long"
                    : flash === "down"
                    ? "text-short"
                    : "text-text"
                )}
              >
                {fmtPrice(m.price)}
              </span>
              <span
                className={clsx(
                  "mono text-[11px] inline-flex items-center gap-0.5",
                  up ? "text-long" : "text-short"
                )}
              >
                {up ? (
                  <ArrowUp className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDown className="w-2.5 h-2.5" />
                )}
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
