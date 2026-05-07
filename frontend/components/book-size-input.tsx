"use client";
import { Wallet } from "lucide-react";

const PRESETS = [100, 1_000, 10_000, 100_000];

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function BookSizeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <Wallet className="w-3.5 h-3.5 text-brand" />
        <span className="label">Book Size</span>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="mono text-muted text-sm">$</span>
        <input
          type="number"
          min={25}
          step={50}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) onChange(n);
          }}
          className="bg-panel2 border border-border rounded-md px-3 h-8 text-sm mono tabular-nums focus:outline-none focus:border-brand/50 w-32"
        />
        <span className="text-xs text-muted hidden md:inline">
          the hypothetical portfolio the agents allocate against
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={
              "text-[11px] px-2.5 h-7 rounded-md border transition mono " +
              (value === p
                ? "bg-brand/15 border-brand/40 text-brand"
                : "bg-panel2 border-border text-muted hover:text-text hover:border-brand/30")
            }
          >
            {fmtShort(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
