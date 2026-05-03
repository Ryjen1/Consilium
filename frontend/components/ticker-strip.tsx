"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import clsx from "clsx";

type Ticker = {
  symbol: string;
  last_price: number;
  change_pct_24h: number;
  mark_price: number;
  volume_24h: number;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function TickerStrip({ compact = false }: { compact?: boolean }) {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<Ticker[]>("/api/sodex/tickers");
        if (!cancelled) {
          setTickers(data);
          setErr(null);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "unreachable");
      }
    }
    load();
    const t = setInterval(load, 12_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (err && tickers.length === 0) {
    return (
      <div className={clsx(
        "flex items-center gap-2 text-xs text-muted overflow-hidden",
        compact ? "px-0 py-1" : "px-4 py-2 card"
      )}>
        <span className="label">sodex markets</span>
        <span className="text-[11px] opacity-70">waiting for backend…</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-5 overflow-x-auto no-scrollbar",
        compact ? "py-1" : "card px-4 py-2.5"
      )}
    >
      <span className="label shrink-0 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
        SODEX
      </span>
      <div className="flex items-center gap-5">
        {tickers.map((t) => {
          const up = t.change_pct_24h >= 0;
          const base = t.symbol.replace("-USD", "");
          return (
            <a
              key={t.symbol}
              href={`https://sodex.com/trade/spot/${base}_USDC`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 shrink-0 hover:opacity-80 transition"
            >
              <span className="mono text-[11px] font-semibold text-text tracking-tight">
                {base}
              </span>
              <span className="mono text-[11px] text-text">
                ${fmtPrice(t.last_price)}
              </span>
              <span
                className={clsx(
                  "mono text-[11px] tabular-nums",
                  up ? "text-long" : "text-short"
                )}
              >
                {up ? "+" : ""}
                {(t.change_pct_24h * 100).toFixed(2)}%
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
