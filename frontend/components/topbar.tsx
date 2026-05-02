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
    ? { label: "SOSO QUOTA", cls: "bg-short/20 text-short" }
    : health.mock_mode
    ? { label: "SOSO MOCK", cls: "bg-panel2 text-muted" }
    : { label: "SOSO LIVE", cls: "bg-long/20 text-long" };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="px-6 h-14 flex items-center gap-4">
        <div className="flex items-baseline gap-3">
          <div className="text-sm font-semibold tracking-tight">
            SoSo<span className="text-brand">Fund</span>
          </div>
          <div className="label hidden md:block">Agentic Hedge Fund</div>
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <span className={clsx("pill", sosoState.cls)}>{sosoState.label}</span>
          {health?.sodex && (
            <span
              className="pill bg-brand/15 text-brand2"
              title={`SoDEX ${health.sodex.network} · execution ${
                health.sodex.execution_ready ? "configured" : "not configured"
              }`}
            >
              SODEX {health.sodex.network.toUpperCase()}
            </span>
          )}
          <span className="pill bg-panel2 text-muted">
            LLM {health?.llm_enabled ? "ON" : "OFF"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
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
