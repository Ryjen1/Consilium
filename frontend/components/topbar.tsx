"use client";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";
import type { ExecutionMode, Health } from "@/lib/api";
import { ModeToggle } from "./mode-toggle";
import { RunCycleButton } from "./run-cycle-button";

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
      <div className="px-6 h-14 flex items-center gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand2 flex items-center justify-center text-white text-sm font-bold shadow-glow">
            S
          </div>
          <div className="text-sm font-semibold tracking-tight">
            SoSo<span className="text-brand">Fund</span>
          </div>
          <div className="label hidden md:block ml-2 border-l border-border pl-3">
            Agentic Hedge Fund · Wave 1
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://sosovalue.com"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex h-9 px-3 rounded-lg border border-border hover:border-brand/40 text-xs text-muted hover:text-text items-center gap-1.5 transition"
            title="Open SoSoValue Research Terminal"
          >
            Research Terminal ↗
          </a>
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
