"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BacktestResp } from "@/lib/api";

export function PnLChart({ data }: { data: BacktestResp | null }) {
  const series = data?.equity_curve ?? [];
  const final = data?.ending_capital ?? 0;
  const start = data?.starting_capital ?? 100000;
  const retPct = data?.total_return_pct ?? 0;
  const positive = retPct >= 0;
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Backtest — Equity Curve ({data?.days ?? 0}d)</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            ${start.toLocaleString()} → ${final.toLocaleString()}
          </span>
          <span
            className={`pill ${
              positive ? "bg-long/20 text-long" : "bg-short/20 text-short"
            }`}
          >
            {positive ? "+" : ""}
            {retPct.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="h-56">
        {series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted italic">
            No backtest yet. Click "Run Backtest" below.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={positive ? "#22c55e" : "#ef4444"}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={positive ? "#22c55e" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#8a93a6", fontSize: 11 }} stroke="#242a38" />
              <YAxis
                tick={{ fill: "#8a93a6", fontSize: 11 }}
                stroke="#242a38"
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#141821",
                  border: "1px solid #242a38",
                  borderRadius: 8,
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={positive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill="url(#eq)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
