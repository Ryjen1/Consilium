"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import clsx from "clsx";
import { Wallet } from "lucide-react";

type Position = {
  symbol: string;
  size: number;
  side: "long" | "short";
  entry_price: number;
  unrealized_pnl: number;
  notional: number;
};

type Balance = {
  available: number;
  collateral: number;
  total: number;
  positions: Position[];
};

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export function SodexBalanceCard() {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const b = await api<Balance>("/api/sodex/balance");
        if (!cancelled) {
          setData(b);
          setLoading(false);
          // If all zeros, SoDEX isn't configured
          if (b.total === 0 && b.available === 0 && b.positions.length === 0) {
            setError(true);
          }
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (error || (!loading && (!data || data.total === 0))) {
    return (
      <div className="card px-4 py-3 flex items-center gap-2 text-muted text-xs">
        <Wallet className="w-3.5 h-3.5" />
        <span className="label">SoDEX testnet not connected</span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-long" />
          <span className="mono text-[11px] uppercase tracking-wider">
            SODEX WALLET
          </span>
          <span className="label opacity-60 hidden md:inline">· testnet</span>
        </div>
        {data && (
          <span className="mono text-xs text-long">
            {fmtUsd(data.total)}
          </span>
        )}
      </div>

      {loading && !data ? (
        <div className="px-4 py-6 text-center text-xs text-muted italic">
          Loading wallet…
        </div>
      ) : data ? (
        <>
          {/* Balance summary row */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-border/50">
            <div className="flex flex-col">
              <span className="label">Balance</span>
              <span className="mono text-sm font-semibold text-text">
                {fmtUsd(data.total)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="label">Margin Used</span>
              <span className="mono text-sm font-semibold text-brand">
                {fmtUsd(data.collateral)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="label">Available</span>
              <span className="mono text-sm font-semibold text-long">
                {fmtUsd(data.available)}
              </span>
            </div>
          </div>

          {/* Open positions */}
          <div className="flex flex-col max-h-[200px] overflow-auto">
            {data.positions.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-muted italic">
                No open positions.
              </div>
            ) : (
              data.positions.map((p, i) => (
                <div
                  key={i}
                  className={clsx(
                    "px-4 py-2.5 flex items-center gap-3 text-[11px] border-b border-border/30",
                    i % 2 === 1 && "bg-panel2/20",
                  )}
                >
                  <span className="mono font-semibold text-text w-16 shrink-0">
                    {p.symbol}
                  </span>
                  <span
                    className={clsx(
                      "pill w-14 text-center border",
                      p.side === "long"
                        ? "bg-long/10 text-long border-long/30"
                        : "bg-short/10 text-short border-short/30",
                    )}
                  >
                    {p.side}
                  </span>
                  <span className="mono text-muted w-16 shrink-0">
                    {p.size}
                  </span>
                  <span className="mono text-muted w-20 shrink-0">
                    @ ${p.entry_price.toLocaleString()}
                  </span>
                  <span
                    className={clsx(
                      "mono font-semibold ml-auto shrink-0",
                      p.unrealized_pnl >= 0 ? "text-long" : "text-short",
                    )}
                  >
                    {p.unrealized_pnl >= 0 ? "+" : ""}
                    {fmtUsd(p.unrealized_pnl)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
