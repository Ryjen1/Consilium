"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type BacktestResp, type ExecutionMode, type Health, type PortfolioResp, type RunResult, type Signal, type Trade } from "@/lib/api";
import { AgentPanel } from "@/components/agent-panel";
import { DecisionLog } from "@/components/decision-log";
import { PortfolioCard } from "@/components/portfolio-card";
import { PnLChart } from "@/components/pnl-chart";
import { RunCycleButton } from "@/components/run-cycle-button";
import { ModeToggle } from "@/components/mode-toggle";

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

  const refreshLedger = useCallback(async () => {
    try {
      const [tr, pf] = await Promise.all([
        api<Trade[]>("/api/trades?limit=30"),
        api<PortfolioResp>("/api/portfolio"),
      ]);
      setTrades(tr);
      setPortfolio(pf);
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const h = await api<Health>("/api/health");
        setHealth(h);
        await refreshLedger();
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [refreshLedger]);

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
      if (r.errors?.length) setErr(r.errors.join(" · "));
      await refreshLedger();
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

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            SoSo<span className="text-brand">Fund</span>
          </h1>
          <p className="text-sm text-muted">
            Crypto-native AI hedge fund · SoSoValue Terminal → SoDEX → ValueChain
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {health && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span
                className={
                  "pill " +
                  (health.mock_mode
                    ? "bg-panel2 text-muted"
                    : "bg-long/20 text-long")
                }
              >
                {health.mock_mode ? "MOCK SOSO" : "LIVE SOSO"}
              </span>
              {health.soso_quota_exhausted && (
                <span className="pill bg-short/20 text-short">SOSO QUOTA</span>
              )}
              {health.sodex && (
                <span
                  className={
                    "pill " +
                    (health.sodex.execution_ready
                      ? "bg-brand/20 text-brand"
                      : "bg-panel2 text-muted")
                  }
                >
                  SODEX {health.sodex.network.toUpperCase()}
                </span>
              )}
              <span className="pill bg-panel2 text-muted">
                LLM {health.llm_enabled ? "ON" : "OFF"}
              </span>
            </div>
          )}
          <ModeToggle mode={mode} onChange={setMode} health={health} />
          <RunCycleButton onRun={runCycle} loading={runningCycle} />
        </div>
      </header>

      {err && (
        <div className="card border-short/50 text-short text-sm">
          API error: {err}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(health?.agents ?? []).map((a) => (
          <AgentPanel
            key={a.name}
            name={a.name}
            description={a.description}
            signals={signals}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DecisionLog trades={trades} />
          <PnLChart data={backtest} />
          <div>
            <button
              onClick={runBacktest}
              disabled={runningBt}
              className="text-sm text-brand hover:underline disabled:opacity-50"
            >
              {runningBt ? "Running backtest…" : "Run 30-day backtest"}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <PortfolioCard data={portfolio} />
          <div className="card">
            <h3 className="font-semibold mb-2">Roadmap</h3>
            <ol className="text-xs text-muted space-y-2 leading-relaxed">
              <li>
                <span className="text-long font-mono">Wave 1 (now)</span> — 3 agents, paper
                trading, SQLite ledger, backtester.
              </li>
              <li>
                <span className="text-muted font-mono">Wave 2</span> — 4 more agents, SoDEX
                testnet execution, configurable risk.
              </li>
              <li>
                <span className="text-muted font-mono">Wave 3</span> — ValueChain
                on-chain audit log, multi-strategy portfolios.
              </li>
              <li>
                <span className="text-muted font-mono">Wave 4</span> — Public strategy
                marketplace on SSI.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <footer className="text-xs text-muted pt-4 border-t border-border">
        Built for SoSoValue Buildathon · Wave 1 · Powered by 8 SoSoValue endpoints
      </footer>
    </main>
  );
}
