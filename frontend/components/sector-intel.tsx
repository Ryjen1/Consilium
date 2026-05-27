"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Minus,
} from "lucide-react";

type SectorRow = {
  name: string;
  change_pct_24h: number;
  marketcap_dom: number;
};

function fmtPct(n: number): string {
  const pct = n * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function fmtDom(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export function SectorIntel() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<SectorRow[]>("/api/sectors")
      .then((d) => {
        if (!cancelled) {
          setSectors(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    const id = setInterval(() => {
      api<SectorRow[]>("/api/sectors")
        .then((d) => {
          if (!cancelled) setSectors(d);
        })
        .catch(() => {});
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const sorted = [...sectors].sort(
    (a, b) => b.change_pct_24h - a.change_pct_24h,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-brand" />
          <span className="mono text-[11px] uppercase tracking-wider">
            SECTOR INTELLIGENCE
          </span>
          <span className="label opacity-60 hidden md:inline">
            · 24h from SoSoValue
          </span>
        </div>
        <span className="label">{sectors.length} sectors</span>
      </div>

      {loading && sectors.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          Loading sector data…
        </div>
      ) : (
        <>
          {/* Best/worst bar */}
          <div className="px-4 py-2.5 grid grid-cols-2 gap-3 border-b border-border/50">
            <div className="flex flex-col gap-0.5">
              <span className="label">Best 24h</span>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3 h-3 text-long" />
                <span className="mono text-sm font-semibold text-long">
                  {best?.name ?? "—"}
                </span>
                <span className="mono text-[11px] text-long">
                  {best ? fmtPct(best.change_pct_24h) : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="label">Worst 24h</span>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-3 h-3 text-short" />
                <span className="mono text-sm font-semibold text-short">
                  {worst?.name ?? "—"}
                </span>
                <span className="mono text-[11px] text-short">
                  {worst ? fmtPct(worst.change_pct_24h) : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Sector rows */}
          <div className="flex flex-col max-h-[260px] overflow-auto">
            {sorted.map((s, i) => {
              const up = s.change_pct_24h >= 0;
              const maxDom = Math.max(...sectors.map((x) => x.marketcap_dom), 0.001);
              const barPct = Math.min(100, (s.marketcap_dom / maxDom) * 100);
              return (
                <div
                  key={s.name}
                  className={clsx(
                    "px-4 py-2 flex items-center gap-3 text-[11px] border-b border-border/30",
                    i % 2 === 1 && "bg-panel2/20",
                  )}
                >
                  <span className="mono font-semibold text-text w-20 truncate shrink-0">
                    {s.name}
                  </span>
                  <span
                    className={clsx(
                      "mono w-16 text-right shrink-0",
                      up ? "text-long" : "text-short",
                    )}
                  >
                    {fmtPct(s.change_pct_24h)}
                  </span>
                  <div className="flex-1 h-1 bg-panel2 rounded overflow-hidden min-w-[60px]">
                    <div
                      className={clsx("h-full rounded", up ? "bg-long/60" : "bg-short/60")}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="mono text-muted w-12 text-right shrink-0">
                    {fmtDom(s.marketcap_dom)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
