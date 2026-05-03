"use client";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  type BacktestResp,
  type ExecutionMode,
  type Health,
  type PortfolioResp,
  type RunResult,
  type Signal,
  type Trade,
} from "@/lib/api";
import { AgentPanel } from "@/components/agent-panel";
import { DecisionLog } from "@/components/decision-log";
import { PortfolioCard } from "@/components/portfolio-card";
import { PnLChart } from "@/components/pnl-chart";
import { Topbar } from "@/components/topbar";
import { Sidebar } from "@/components/sidebar";
import { KpiStrip } from "@/components/kpi-strip";
import { Pipeline } from "@/components/pipeline";
import { IntegrationsStrip } from "@/components/integrations-strip";

export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioResp | null>(null);
  const [backtest, setBacktest] = useState<BacktestResp | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const [runningBt, setRunningBt] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<ExecutionMode>("paper");
  const [runErrors, setRunErrors] = useState<string[]>([]);

  const refreshLedger = useCallback(async () => {
    try {
      const [tr, pf] = await Promise.all([
        api<Trade[]>("/api/trades?limit=20"),
        api<PortfolioResp>("/api/portfolio"),
      ]);
      setTrades(tr);
      setPortfolio(pf);
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await api<Health>("/api/health");
      setHealth(h);
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshHealth();
      await refreshLedger();
    })();
  }, [refreshHealth, refreshLedger]);

  async function runCycle() {
    if (mode.startsWith("sodex")) {
      const ok = window.confirm(
        mode === "sodex_mainnet"
          ? "This will place REAL orders on SoDEX MAINNET. Continue?"
          : "This will place real orders on SoDEX TESTNET. Continue?"
      );
      if (!ok) return;
    }
    setRunningCycle(true);
    setErr(null);
    setRunErrors([]);
    try {
      const r = await api<RunResult>("/api/run", {
        method: "POST",
        body: JSON.stringify({
          universe: ["BTC", "ETH", "SOL", "ARB", "OP"],
          portfolio_value_usd: 100_000,
          mode,
        }),
      });
      setSignals(r.signals);
      setRunErrors(r.errors ?? []);
      if (r.errors?.length) setErr(r.errors.join(" · "));
      await Promise.all([refreshLedger(), refreshHealth()]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRunningCycle(false);
    }
  }

  async function runBacktest() {
    setRunningBt(true);
    setErr(null);
    try {
      const b = await api<BacktestResp>("/api/backtest", {
        method: "POST",
        body: JSON.stringify({
          universe: ["BTC", "ETH", "SOL", "ARB", "OP"],
          days: 30,
          starting_capital: 100_000,
        }),
      });
      setBacktest(b);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRunningBt(false);
    }
  }

  async function resetLedger() {
    if (!window.confirm("Clear all paper trades and agent decisions?")) return;
    try {
      await api("/api/reset", { method: "POST" });
      setSignals([]);
      setBacktest(null);
      setRunErrors([]);
      await refreshLedger();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        health={health}
        mode={mode}
        setMode={setMode}
        onRun={runCycle}
        onReset={resetLedger}
        running={runningCycle}
      />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 px-6 py-6 flex flex-col gap-5 max-w-[1400px] w-full mx-auto min-w-0">
        {err && (
          <div className="card border-short/40 bg-short/5 text-short text-xs px-4 py-2.5 flex items-start gap-2">
            <span className="mono uppercase tracking-wider opacity-70">err</span>
            <span className="flex-1">{err}</span>
            <button
              onClick={() => setErr(null)}
              className="opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1">
            <h1 className="text-xl font-semibold tracking-tight">
              A council of analysts trading{" "}
              <span className="text-brand">SoSoValue</span> signals onto{" "}
              <span className="text-brand">SoDEX</span>
            </h1>
            <span className="label hidden md:block">
              Wave 1 · shipped · buildathon submission
            </span>
          </div>
        </section>

        <KpiStrip
          portfolio={portfolio}
          health={health}
          backtest={backtest}
          trades={trades}
        />

        <Pipeline
          running={runningCycle}
          signals={signals}
          trades={trades}
          mode={mode}
          lastErrors={runErrors}
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PnLChart data={backtest} onRun={runBacktest} loading={runningBt} />
          </div>
          <PortfolioCard data={portfolio} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="label">Analyst Agents</h2>
            <span className="label">
              {signals.length} signals · last cycle
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(health?.agents ?? []).map((a) => (
              <AgentPanel
                key={a.name}
                name={a.name}
                description={a.description}
                signals={signals}
              />
            ))}
          </div>
        </section>

        <section>
          <DecisionLog trades={trades} />
        </section>

        <IntegrationsStrip />

        <footer className="pt-4 pb-6 flex items-center justify-between text-[11px] text-muted border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="mono">Consilium · Wave 1</span>
            <span className="opacity-40">·</span>
            <span>Built for the SoSoValue Buildathon</span>
          </div>
          <div className="flex items-center gap-3 mono hidden md:flex">
            <span>Research → Insight → Execution</span>
          </div>
        </footer>
        </main>
      </div>
    </div>
  );
}
