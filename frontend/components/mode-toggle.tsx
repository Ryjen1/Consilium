"use client";
import clsx from "clsx";
import type { ExecutionMode, Health } from "@/lib/api";

export function ModeToggle({
  mode,
  onChange,
  health,
}: {
  mode: ExecutionMode;
  onChange: (m: ExecutionMode) => void;
  health: Health | null;
}) {
  const sodexReady = !!health?.sodex?.execution_ready;
  const network = health?.sodex?.network ?? "testnet";

  const options: { value: ExecutionMode; label: string; disabled?: boolean; hint?: string }[] = [
    { value: "paper", label: "Paper" },
    {
      value: "sodex_testnet",
      label: `SoDEX ${network}`,
      disabled: !sodexReady,
      hint: sodexReady ? "signs real testnet orders" : "set SODEX_EVM_PRIVATE_KEY to enable",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Execution:</span>
      <div className="inline-flex bg-panel2 border border-border rounded-lg p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            title={o.hint}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={clsx(
              "px-3 py-1 rounded-md text-xs font-medium transition",
              mode === o.value
                ? "bg-brand text-white"
                : "text-muted hover:text-text",
              o.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
