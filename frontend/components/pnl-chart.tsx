"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BacktestResp } from "@/lib/api";
import clsx from "clsx";

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function PnLChart({
  data,
  onRun,
  loading,
}: {
  data: BacktestResp | null;
  onRun: () => void;
  loading: boolean;
}) {
  const series = data?.equity_curve ?? [];
  const start = data?.starting_capital ?? 100_000;
  const final = data?.ending_capital ?? start;
  const retPct = data?.total_return_pct ?? 0;
  const positive = retPct >= 0;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="mono text-[11px] uppercase tracking-wider">
            BACKTEST · EQUITY CURVE
          </span>
          {data && (
            <span className="label">{data.days}D · SoDEX</span>
          )}
        </div>
        <button
          onClick={onRun}
          disabled={loading}
          className="text-[11px] uppercase tracking-wider text-brand hover:text-brand2 transition disabled:opacity-50"
        >
          {loading ? "Running…" : data ? "Re-run" : "Run backtest"}
        </button>
      </div>

      {data && (
        <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-border">
          <Stat label="Start" value={fmtUsd(start)} />
          <Stat label="End" value={fmtUsd(final)} positive={positive} />
          <Stat
            label="Return"
            value={`${positive ? "+" : ""}${retPct.toFixed(2)}%`}
            positive={positive}
          />
        </div>
      )}

      <div className="h-60">
        {series.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-muted italic gap-3">
            <span>No backtest yet.</span>
            <button
              onClick={onRun}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-brand text-brand transition"
            >
              {loading ? "Running…" : "Run 30-day backtest"}
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: "#7a8398", fontSize: 10 }}
                stroke="#1f2636"
                tickLine={false}
                tickFormatter={(d) => `d${d}`}
              />
              <YAxis
                tick={{ fill: "#7a8398", fontSize: 10 }}
                stroke="#1f2636"
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => fmtUsd(v)}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f1420",
                  border: "1px solid #1f2636",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [fmtUsd(v), "Equity"]}
                labelFormatter={(d) => `Day ${d}`}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={color}
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

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="label">{label}</span>
      <span
        className={clsx(
          "mono text-base font-semibold",
          positive === true && "text-long",
          positive === false && "text-short"
        )}
      >
        {value}
      </span>
    </div>
  );
}
