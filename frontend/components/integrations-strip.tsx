"use client";
import clsx from "clsx";

const ITEMS = [
  { name: "SoSoValue Terminal", tag: "8 endpoints", status: "live" as const },
  { name: "SoDEX · perps", tag: "EIP-712 signed", status: "live" as const },
  { name: "SoDEX · spot", tag: "market data", status: "live" as const },
  { name: "SSI Protocol", tag: "Wave 4", status: "planned" as const },
  { name: "ValueChain", tag: "Wave 3 audit log", status: "planned" as const },
  { name: "LangGraph", tag: "agent orchestration", status: "live" as const },
  { name: "eth-account", tag: "EIP-712", status: "live" as const },
];

export function IntegrationsStrip() {
  return (
    <div className="card px-5 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="label shrink-0">Integrated</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ITEMS.map((it) => (
            <div
              key={it.name}
              className={clsx(
                "flex items-center gap-1.5 pl-2 pr-2.5 h-6 rounded-full border text-[11px]",
                it.status === "live"
                  ? "border-long/30 bg-long/5"
                  : "border-border bg-panel2/50"
              )}
            >
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  it.status === "live" ? "bg-long animate-pulse" : "bg-muted/40"
                )}
              />
              <span className="mono text-text">{it.name}</span>
              <span className="text-muted opacity-80">· {it.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
