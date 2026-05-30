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

  return (
    <div className="hidden md:inline-flex items-center gap-1 h-9 px-1 bg-panel2 border border-border rounded-lg">
      {/* Paper mode — neutral */}
      <button
        title="Paper mode — simulated trades, no real orders"
        onClick={() => onChange("paper")}
        className={clsx(
          "px-3 h-7 rounded-md text-[11px] font-medium tracking-wide transition flex items-center gap-1.5",
          mode === "paper"
            ? "bg-panel3 text-text shadow border border-border"
            : "text-muted hover:text-text"
        )}
      >
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            mode === "paper" ? "bg-muted" : "bg-muted/40"
          )}
        />
        Paper
      </button>

      {/* SoDEX testnet — green tint + pulsing dot when active */}
      <button
        title={
          sodexReady
            ? `SoDEX ${network} — signs real ${network} orders via EIP-712`
            : "Set SODEX_EVM_PRIVATE_KEY to enable"
        }
        disabled={!sodexReady}
        onClick={() => onChange("sodex_testnet")}
        className={clsx(
          "px-3 h-7 rounded-md text-[11px] font-medium tracking-wide transition flex items-center gap-1.5",
          mode === "sodex_testnet"
            ? "bg-long/15 text-long border border-long/30 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
            : sodexReady
            ? "text-muted hover:text-long hover:bg-long/5"
            : "text-muted/50 cursor-not-allowed opacity-40"
        )}
      >
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            mode === "sodex_testnet"
              ? "bg-long animate-pulse"
              : sodexReady
              ? "bg-long/50"
              : "bg-muted/40"
          )}
        />
        {network}
      </button>
    </div>
  );
}
