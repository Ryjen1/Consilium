"use client";
import clsx from "clsx";
import { Brain, Network, Shield, Zap } from "lucide-react";
import type { ExecutionMode, Signal, Trade } from "@/lib/api";

type StepState = "idle" | "active" | "done" | "err";

export function Pipeline({
  running,
  signals,
  trades,
  mode,
  lastErrors,
}: {
  running: boolean;
  signals: Signal[];
  trades: Trade[];
  mode: ExecutionMode;
  lastErrors: string[];
}) {
  const hasSignals = signals.length > 0;
  const hasTrades = trades.length > 0;
  const hasErr = lastErrors.length > 0;

  const steps = [
    {
      id: "agents",
      label: "AGENTS",
      icon: Brain,
      detail: hasSignals ? `${signals.length} signals` : "4 analysts idle",
      state: (running
        ? "active"
        : hasSignals
        ? "done"
        : "idle") as StepState,
    },
    {
      id: "risk",
      label: "RISK",
      icon: Shield,
      detail: hasSignals ? "caps applied" : "awaiting input",
      state: (running ? "active" : hasSignals ? "done" : "idle") as StepState,
    },
    {
      id: "portfolio",
      label: "PORTFOLIO",
      icon: Network,
      detail: hasTrades ? `${trades.length} trades sized` : "—",
      state: (running ? "active" : hasTrades ? "done" : "idle") as StepState,
    },
    {
      id: "executor",
      label: mode === "paper" ? "PAPER LEDGER" : "SODEX TESTNET",
      icon: Zap,
      detail: hasErr ? "error" : hasTrades ? "executed" : "—",
      state: (hasErr
        ? "err"
        : running
        ? "active"
        : hasTrades
        ? "done"
        : "idle") as StepState,
    },
  ];

  return (
    <div className="card px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="label">Run Pipeline</span>
        <span className="ml-auto label opacity-60">
          {running ? "processing…" : hasTrades ? "idle · last cycle complete" : "ready"}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const cls =
            s.state === "done"
              ? "bg-long/10 border-long/30 text-long"
              : s.state === "active"
              ? "bg-brand/10 border-brand/30 text-brand animate-pulse"
              : s.state === "err"
              ? "bg-short/10 border-short/30 text-short"
              : "bg-panel2 border-border text-muted";
          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition",
                  cls
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <div className="flex flex-col">
                  <span className="mono text-[11px] font-semibold tracking-wider">
                    {s.label}
                  </span>
                  <span className="text-[10px] opacity-80">{s.detail}</span>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center gap-0.5 text-muted/40">
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span className="w-1 h-1 rounded-full bg-current" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
