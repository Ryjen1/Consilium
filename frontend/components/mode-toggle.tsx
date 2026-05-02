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

  const options: {
    value: ExecutionMode;
    label: string;
    disabled?: boolean;
    hint?: string;
  }[] = [
    { value: "paper", label: "Paper" },
    {
      value: "sodex_testnet",
      label: `SoDEX ${network}`,
      disabled: !sodexReady,
      hint: sodexReady
        ? "signs real testnet orders"
        : "set SODEX_EVM_PRIVATE_KEY to enable",
    },
  ];

  return (
    <div className="hidden md:inline-flex items-center gap-1 h-9 px-1 bg-panel2 border border-border rounded-lg">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.hint}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-3 h-7 rounded-md text-[11px] font-medium tracking-wide transition",
            mode === o.value
              ? "bg-brand text-white shadow"
              : "text-muted hover:text-text",
            o.disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
