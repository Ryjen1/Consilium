"use client";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";
import type { ExecutionMode, Health } from "@/lib/api";
import { ModeToggle } from "./mode-toggle";
import { RunCycleButton } from "./run-cycle-button";

const NAV = [
  { id: "dashboard", label: "Dashboard", active: true },
  { id: "agents", label: "Agents" },
  { id: "sessions", label: "Sessions" },
  { id: "backtest", label: "Backtest" },
  { id: "portfolio", label: "Portfolio" },
  { id: "leaderboard", label: "Leaderboard" },
];

export function Topbar({
  health,
  mode,
  setMode,
  onRun,
  onReset,
  running,
}: {
  health: Health | null;
  mode: ExecutionMode;
  setMode: (m: ExecutionMode) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
}) {
  const sosoState = !health
    ? { label: "…", cls: "bg-panel2 text-muted" }
    : health.soso_quota_exhausted
    ? { label: "SOSO QUOTA", cls: "bg-short/20 text-short border border-short/30" }
    : health.mock_mode
    ? { label: "SOSO MOCK", cls: "bg-panel2 text-muted border border-border" }
    : {
        label: "SOSO LIVE",
        cls: "bg-long/15 text-long border border-long/30",
      };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-xl">
      {/* Row 1: brand + nav + wallet/actions */}
      <div className="px-6 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand2 flex items-center justify-center text-white text-sm font-bold shadow-glow">
            S
          </div>
          <div className="text-sm font-semibold tracking-tight">
            SoSo<span className="text-brand">Fund</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={clsx(
                "px-3 h-8 rounded-md text-[12px] font-medium tracking-tight transition",
                n.active
                  ? "text-text bg-panel2"
                  : "text-muted hover:text-text hover:bg-panel2/50"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={clsx("pill", sosoState.cls)}>{sosoState.label}</span>
            {health?.sodex && (
              <span
                className="pill bg-brand/15 text-brand2 border border-brand/30"
                title={`SoDEX ${health.sodex.network} · execution ${
                  health.sodex.execution_ready ? "configured" : "not configured"
                }`}
              >
                SODEX {health.sodex.network.toUpperCase()}
              </span>
            )}
          </div>

          <ModeToggle mode={mode} onChange={setMode} health={health} />
          <RunCycleButton onRun={onRun} loading={running} />
          <button
            onClick={onReset}
            title="Reset ledger"
            className="h-9 w-9 rounded-lg border border-border text-muted hover:text-short hover:border-short/40 flex items-center justify-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
