"use client";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

const SUGGESTIONS = [
  "Hedge BTC exposure ahead of the next CPI print",
  "Long tokens with imminent whale accumulation + positive ETF flows",
  "Short high-dilution unlocks this week",
  "Rotate into names trending across verified KOLs",
];

export function HeroPrompt({
  onRun,
  running,
}: {
  onRun: () => void;
  running: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    // Wave 1: the prompt is demo-only — it triggers a regular cycle but we
    // echo the intent back so the run feels context-aware. Wave 2 will
    // parse the prompt into agent weights / universe filters.
    onRun();
  };

  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-brand/40 via-brand2/20 to-transparent opacity-30 blur-lg pointer-events-none" />
      <div className="relative card px-5 py-4 flex flex-col gap-3 border-brand/20">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span className="label">Describe a strategy</span>
          <span className="ml-auto label opacity-60">Wave 1 runs the full agent stack</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !running) submit();
            }}
            placeholder="e.g. Hedge my ETH exposure ahead of the CPI print"
            className="flex-1 bg-transparent text-sm placeholder:text-muted/70 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={running}
            className="h-9 px-3 rounded-lg bg-brand hover:bg-brand2 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition"
          >
            {running ? "Running…" : "Run"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className="text-[11px] text-muted hover:text-text bg-panel2/60 hover:bg-panel2 border border-border hover:border-brand/30 rounded-full px-2.5 py-1 transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
