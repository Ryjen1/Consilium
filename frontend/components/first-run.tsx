"use client";
import { Brain, Network, Play, Shield, Zap, Loader2, Shield as ShieldIcon } from "lucide-react";

const PREVIEW_STEPS = [
  {
    icon: Brain,
    label: "AGENTS",
    body: "Three analysts read SoSoValue: ETF flow, token-unlock risk, KOL narrative.",
  },
  {
    icon: Shield,
    label: "RISK",
    body: "Opposing signals cancel. Each position capped at 10% of book.",
  },
  {
    icon: Network,
    label: "PORTFOLIO",
    body: "Sized targets become orders against a paper ledger.",
  },
  {
    icon: Zap,
    label: "LEDGER",
    body: "Fills recorded. PnL, trades, and decisions appear in the dashboard.",
  },
];

/**
 * First-run panel. Replaces the empty-zeros dashboard on the user's first
 * visit. The empty state IS the tutorial: the user sees what a cycle does
 * and has exactly one primary button to click.
 */
export function FirstRun({
  onRun,
  running,
  bookSize,
}: {
  onRun: () => void;
  running: boolean;
  bookSize: number;
}) {
  const bookLabel =
    bookSize >= 1_000_000
      ? `$${(bookSize / 1_000_000).toFixed(1)}M`
      : bookSize >= 1_000
      ? `$${(bookSize / 1_000).toFixed(0)}k`
      : `$${bookSize.toFixed(0)}`;

  return (
    <div className="card p-6 md:p-8 flex flex-col gap-8">
      <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
        <div className="pill bg-brand/10 text-brand border border-brand/30">
          First run · Paper mode
        </div>
        <h2 className="display text-2xl md:text-3xl">
          Run one cycle. Watch the council deliberate.
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          A cycle queries SoSoValue, runs three agents, sizes positions against
          a <span className="mono text-text">{bookLabel}</span> paper book, and
          posts the fills to the ledger below. Roughly three seconds end-to-end.
        </p>

        <button
          onClick={onRun}
          disabled={running}
          className="mt-2 h-12 px-7 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 shadow-glow transition"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run your first cycle
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-muted mono">
          <ShieldIcon className="w-3 h-3" />
          Paper mode · no wallet · no funds · no on-chain activity
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PREVIEW_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative rounded-lg border border-border bg-panel2/40 p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="mono text-[11px] font-semibold tracking-wider text-muted">
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">{s.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
