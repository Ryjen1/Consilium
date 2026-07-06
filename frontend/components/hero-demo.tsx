"use client";
import { useState } from "react";
import { Loader2, Play, TrendingDown, TrendingUp, Minus } from "lucide-react";
import clsx from "clsx";
import { api, type RunResult, type Signal } from "@/lib/api";

const SYMBOLS = ["BTC", "ETH", "SOL"] as const;
type Symbol = (typeof SYMBOLS)[number];

type DemoResult = {
  symbol: string;
  direction: Signal["direction"];
  confidence: number;
  rationale: string;
  source: "live" | "fallback";
};

// Placeholder rendered only when the backend is unreachable so the demo
// never shows a dead end. Clearly labeled as "EXAMPLE" in the UI; numbers
// are generic and illustrative, not actual SoSoValue data.
const FALLBACK: Record<Symbol, DemoResult> = {
  BTC: {
    symbol: "BTC",
    direction: "long",
    confidence: 0.6,
      rationale:
        "Placeholder — when live, the ETF Flow, Unlock Risk, KOL Narrative, and Macro agents each analyze their own SoSoValue primitive for BTC and a risk manager arbitrates the combined signal.",
    source: "fallback",
  },
  ETH: {
    symbol: "ETH",
    direction: "flat",
    confidence: 0.5,
      rationale:
        "Placeholder — when live, opposing signals across the four agents would net to a flat position here, cancelled by the risk manager.",
    source: "fallback",
  },
  SOL: {
    symbol: "SOL",
    direction: "long",
    confidence: 0.6,
      rationale:
        "Placeholder — when live, each agent contributes its own thesis (flows, unlocks, KOL activity, macro events) and the risk manager produces a single sized signal.",
    source: "fallback",
  },
};

function dirMeta(d: Signal["direction"]) {
  if (d === "long")
    return {
      label: "LONG",
      cls: "text-long",
      bg: "bg-long/10 border-long/30",
      Icon: TrendingUp,
    };
  if (d === "short")
    return {
      label: "SHORT",
      cls: "text-short",
      bg: "bg-short/10 border-short/30",
      Icon: TrendingDown,
    };
  return {
    label: "FLAT",
    cls: "text-muted",
    bg: "bg-panel2 border-border",
    Icon: Minus,
  };
}

export function HeroDemo() {
  const [symbol, setSymbol] = useState<Symbol>("BTC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);

  async function run() {
    setLoading(true);
    try {
      const r = await api<RunResult>("/api/run", {
        method: "POST",
        body: JSON.stringify({
          universe: [symbol],
          portfolio_value_usd: 10_000,
          mode: "paper",
        }),
      });
      // Pick the aggregated / highest-confidence signal for the symbol.
      const picked =
        r.signals
          .filter((s) => s.symbol === symbol)
          .sort((a, b) => b.confidence - a.confidence)[0] ?? null;

      if (picked) {
        setResult({
          symbol,
          direction: picked.direction,
          confidence: picked.confidence,
          rationale: picked.reasoning,
          source: "live",
        });
      } else {
        setResult(FALLBACK[symbol]);
      }
    } catch {
      // API offline — show the fallback so the demo still lands.
      setResult(FALLBACK[symbol]);
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? dirMeta(result.direction) : null;

  return (
    <div
      id="hero-demo"
      className="card p-5 md:p-6 flex flex-col gap-4 w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
          <span className="label">Try a cycle · paper mode</span>
        </div>
        <span className="label opacity-60">no wallet · no funds</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-panel2 border border-border">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={clsx(
                "px-3 h-8 rounded-md text-xs font-mono font-semibold tracking-wider transition",
                symbol === s
                  ? "bg-brand/20 text-brand"
                  : "text-muted hover:text-text"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="h-10 px-5 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition shadow-glow ml-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          Try Free — Paper Trading
        </button>
      </div>

      <div
        className={clsx(
          "rounded-lg border p-4 flex flex-col gap-3 transition",
          meta ? meta.bg : "bg-panel2 border-border",
          loading && "opacity-60"
        )}
      >
        {!result && !loading && (
          <div className="text-sm text-muted flex items-center gap-2">
            <Minus className="w-4 h-4" />
            Pick a symbol and run a cycle. The four agents will deliberate and
            produce a sized signal in roughly three seconds.
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <div className="flex items-center gap-2 mono text-[11px] tracking-widest">
              <span>AGENTS</span>
              <span className="opacity-30">→</span>
              <span>RISK</span>
              <span className="opacity-30">→</span>
              <span>PORTFOLIO</span>
            </div>
          </div>
        )}

        {result && !loading && meta && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <meta.Icon className={clsx("w-5 h-5", meta.cls)} />
              <span className={clsx("mono font-bold tracking-widest", meta.cls)}>
                {result.symbol} · {meta.label}
              </span>
              <span className="label opacity-70">
                confidence {(result.confidence * 100).toFixed(0)}%
              </span>
              <span
                className={clsx(
                  "pill ml-auto",
                  result.source === "live"
                    ? "bg-long/15 text-long border border-long/30"
                    : "bg-warn/15 text-warn border border-warn/30"
                )}
              >
                {result.source === "live" ? "LIVE" : "EXAMPLE"}
              </span>
            </div>
            <p className="text-[13px] text-text leading-relaxed">
              {result.rationale}
            </p>
            {result.source === "fallback" && (
              <p className="text-[11px] text-warn bg-warn/10 border border-warn/30 rounded-md px-2 py-1.5">
                <span className="font-semibold">EXAMPLE output.</span> The
                backend is unreachable right now, so this is a placeholder
                cycle — not real SoSoValue data. Open the dapp or retry to
                run live.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
