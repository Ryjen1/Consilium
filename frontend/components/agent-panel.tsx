"use client";
import type { Signal } from "@/lib/api";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const DIR_ICON = {
  long: <ArrowUpRight className="w-3 h-3" />,
  short: <ArrowDownRight className="w-3 h-3" />,
  flat: <Minus className="w-3 h-3" />,
};

const DIR_CLS = {
  long: "text-long bg-long/10 border-long/20",
  short: "text-short bg-short/10 border-short/20",
  flat: "text-muted bg-panel2 border-border",
};

export function AgentPanel({
  name,
  description,
  signals,
}: {
  name: string;
  description: string;
  signals: Signal[];
}) {
  const mine = signals.filter((s) => s.agent === name);
  const shortName = name.replace(/ /g, "_").toUpperCase();
  const idle = mine.length === 0;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full",
              idle ? "bg-muted/40" : "bg-long animate-pulse"
            )}
          />
          <span className="mono text-[11px] uppercase tracking-wider text-text">
            {shortName}
          </span>
        </div>
        <span className="label">
          {mine.length} sig
        </span>
      </div>

      <div className="px-4 py-1.5 text-[11px] text-muted leading-relaxed border-b border-border bg-panel2/30">
        {description}
      </div>

      <div className="flex flex-col">
        {idle && (
          <div className="px-4 py-6 text-xs text-muted/70 italic text-center">
            Awaiting next cycle…
          </div>
        )}
        {mine.map((s, i) => (
          <div
            key={i}
            className={clsx(
              "px-4 py-2.5 flex flex-col gap-1.5",
              i < mine.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="mono font-semibold text-sm tracking-tight">
                {s.symbol}
              </span>
              <span
                className={clsx(
                  "pill inline-flex items-center gap-1 border",
                  DIR_CLS[s.direction]
                )}
              >
                {DIR_ICON[s.direction]}
                {s.direction}
              </span>
              <span className="ml-auto mono text-[11px] text-brand2">
                {Math.round(s.confidence * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-text/80 leading-relaxed">
              {s.reasoning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
