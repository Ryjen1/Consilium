"use client";
import type { BacktestResp, Health, PortfolioResp, Trade } from "@/lib/api";

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function KpiStrip({
  portfolio,
  health,
  backtest,
  trades,
}: {
  portfolio: PortfolioResp | null;
  health: Health | null;
  backtest: BacktestResp | null;
  trades: Trade[];
}) {
  const gross = portfolio?.gross_exposure_usd ?? 0;
  const nPositions = portfolio?.positions.length ?? 0;
  const agents = health?.agents.length ?? 0;
  const lastTrade = trades[0]?.executed_at;
  const ret = backtest?.total_return_pct ?? null;

  const items = [
    { label: "Fund AUM", value: fmtUsd(gross), sub: `${nPositions} open names` },
    { label: "Gross Exposure", value: fmtUsd(gross), sub: "across universe" },
    {
      label: "Agents Active",
      value: `${agents}`,
      sub: health?.mock_mode
        ? "no api key configured"
        : health?.soso_quota_exhausted
        ? "quota limit reached"
        : `${agents} live feeds`,
    },
    {
      label: "Last Run",
      value: fmtTime(lastTrade),
      sub: trades.length === 0 ? "no runs yet" : `${trades.length} runs network-wide`,
    },
    {
      label: "30-Day Return",
      value:
        ret === null
          ? "—"
          : `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`,
      sub: backtest ? `${backtest.days}d via SoDEX` : "click backtest",
      positive: ret !== null ? ret >= 0 : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="card px-4 py-3 flex flex-col justify-between min-h-[76px]"
        >
          <div className="label">{it.label}</div>
          <div
            className={
              "mono text-lg font-semibold " +
              (it.positive === true
                ? "text-long"
                : it.positive === false
                ? "text-short"
                : "text-text")
            }
          >
            {it.value}
          </div>
          <div className="text-[11px] text-muted mt-0.5">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
