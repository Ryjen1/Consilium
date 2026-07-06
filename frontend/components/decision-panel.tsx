"use client";
import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CircleDashed,
  Minus,
  Scale,
  Sparkles,
} from "lucide-react";
import type {
  ConsensusLevel,
  Signal,
  SizedPosition,
  Trade,
} from "@/lib/api";

const CONSENSUS_META: Record<
  ConsensusLevel,
  { label: string; multiplier: string; color: string }
> = {
  solo: {
    label: "Solo",
    multiplier: "0.5×",
    color: "bg-warn/15 text-warn border-warn/30",
  },
  duo: {
    label: "Duo",
    multiplier: "1.0×",
    color: "bg-brand/15 text-brand border-brand/30",
  },
  super_majority: {
    label: "Super-majority",
    multiplier: "1.25×",
    color: "bg-long/15 text-long border-long/30",
  },
};

function dirIcon(direction: "long" | "short" | "flat") {
  if (direction === "long")
    return <ArrowUpRight className="w-3 h-3" />;
  if (direction === "short")
    return <ArrowDownRight className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

function dirCls(direction: "long" | "short" | "flat") {
  if (direction === "long") return "text-long";
  if (direction === "short") return "text-short";
  return "text-muted";
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function consensusExplanation(
  level: ConsensusLevel,
  agreeingAgents: string[],
): string {
  if (level === "solo") {
    const who = agreeingAgents[0] ?? "one agent";
    return `Only ${who} fired. Sized at half the per-name cap to reflect the lack of independent confirmation.`;
  }
  if (level === "duo") {
    const [a, b] = agreeingAgents;
    return `${a} and ${b} reached the same direction looking at independent data sources. Sized at the full per-name cap.`;
  }
  // super_majority
  return `All four agents agreed on direction. Sized at 1.25× the per-name cap as a consensus bonus.`;
}

export function DecisionPanel({
  signals,
  sized,
  trades,
  bookSize,
  agents,
}: {
  signals: Signal[];
  sized: Record<string, SizedPosition>;
  trades: Trade[];
  bookSize: number;
  agents: { name: string; description: string }[];
}) {
  const symbols = Object.keys(sized);
  const hasAnyDecision = symbols.length > 0;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-brand" />
          <span className="mono text-[11px] uppercase tracking-wider">
            DECISION
          </span>
          <span className="label opacity-60 hidden md:inline">
            · how the agents combined into one trade
          </span>
        </div>
        <span className="label">
          {symbols.length} {symbols.length === 1 ? "decision" : "decisions"}
        </span>
      </div>

      {!hasAnyDecision && (
        <div className="px-4 py-10 text-center text-xs text-muted italic">
          No decisions yet this cycle. Click{" "}
          <span className="text-brand font-medium">Run Cycle</span> to see the
          agents deliberate.
        </div>
      )}

      {hasAnyDecision && (
        <div className="flex flex-col">
          {symbols.map((sym, idx) => {
            const pos = sized[sym];
            const cmeta = CONSENSUS_META[pos.consensus];
            const trade = trades.find((t) => t.symbol === sym);
            const sizeUsd = trade?.size_usd ?? Math.abs(pos.target_weight) * bookSize;
            const targetPct = Math.abs(pos.target_weight) * 100;

            // Collect every signal that voted on this symbol so the panel
            // shows the full deliberation, not just the winning side.
            const symbolSignals = signals.filter((s) => s.symbol === sym);

            // Build a vote map keyed by agent name so a silent agent shows up
            // explicitly as "watching" rather than just being absent.
            const votesByAgent = new Map<string, Signal>(
              symbolSignals.map((s) => [s.agent, s]),
            );

            return (
              <div
                key={sym}
                className={clsx(
                  "px-4 py-4 flex flex-col gap-3",
                  idx < symbols.length - 1 && "border-b border-border/50",
                )}
              >
                {/* Header row: symbol + final direction + size */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="mono text-base font-semibold tracking-tight">
                      {sym}
                    </span>
                    <span
                      className={clsx(
                        "pill border inline-flex items-center gap-1",
                        pos.direction === "long"
                          ? "bg-long/10 text-long border-long/30"
                          : "bg-short/10 text-short border-short/30",
                      )}
                    >
                      {dirIcon(pos.direction)} {pos.direction}
                    </span>
                    <span
                      className={clsx(
                        "pill border inline-flex items-center gap-1",
                        cmeta.color,
                      )}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {cmeta.label} {cmeta.multiplier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted">
                      target{" "}
                      <span className="mono text-text">
                        {targetPct.toFixed(2)}%
                      </span>
                    </span>
                    <span className="opacity-30">·</span>
                    <span className="mono text-brand2 font-semibold">
                      {pos.direction === "long" ? "BUY" : "SELL"}{" "}
                      {fmtUsd(sizeUsd)}
                    </span>
                  </div>
                </div>

                {/* Vote ledger: one row per agent, including silent ones. */}
                <div className="bg-panel2/60 rounded-md border border-border/60 divide-y divide-border/40">
                  {agents.map((a) => {
                    const vote = votesByAgent.get(a.name);
                    const agreed =
                      vote && pos.agreeing_agents.includes(a.name);
                    return (
                      <div
                        key={a.name}
                        className="px-3 py-2 flex items-center gap-3 text-[11px]"
                      >
                        <Brain className="w-3 h-3 text-muted" />
                        <span className="mono uppercase tracking-wider w-32 shrink-0 text-muted">
                          {a.name.replace(/ /g, "_")}
                        </span>
                        {vote ? (
                          <>
                            <span
                              className={clsx(
                                "mono font-semibold inline-flex items-center gap-1",
                                dirCls(vote.direction),
                              )}
                            >
                              {dirIcon(vote.direction)} {vote.direction}
                            </span>
                            <span className="text-muted">
                              conf{" "}
                              <span className="mono text-text">
                                {(vote.confidence * 100).toFixed(0)}%
                              </span>
                            </span>
                            <span
                              className={clsx(
                                "pill ml-auto",
                                agreed
                                  ? "bg-long/10 text-long border border-long/30"
                                  : "bg-short/10 text-short border border-short/30",
                              )}
                            >
                              {agreed ? "agreed" : "dissented"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 text-muted/80">
                              <CircleDashed className="w-3 h-3" />
                              silent
                            </span>
                            <span className="text-muted/60 truncate">
                              thesis condition not met for {sym} this cycle
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Plain-language explanation of why the math came out this way. */}
                <p className="text-[11px] text-muted leading-relaxed">
                  <span className="text-text font-semibold">Why this size:</span>{" "}
                  {consensusExplanation(pos.consensus, pos.agreeing_agents)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
