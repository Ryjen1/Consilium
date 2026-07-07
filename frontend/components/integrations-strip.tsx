"use client";
import clsx from "clsx";
import type { Health } from "@/lib/api";

export function IntegrationsStrip({ health }: { health: Health | null }) {
  const sosoLive = !!health && !health.mock_mode && !health.soso_quota_exhausted;
  const sosoTag = !health
    ? "connecting…"
    : health.soso_quota_exhausted
    ? "quota limit reached"
    : health.mock_mode
    ? "api key missing"
    : "8 endpoints";

  const items = [
    { name: "SoSoValue Terminal", tag: sosoTag, status: sosoLive ? ("live" as const) : ("planned" as const) },
    { name: "SoDEX · perps", tag: "EIP-712 signed", status: "live" as const },
    { name: "SoDEX · spot", tag: "market data", status: "live" as const },
    { name: "SSI Protocol", tag: "Post-buildathon", status: "planned" as const },
    { name: "ValueChain", tag: "Wave 3 audit log", status: "planned" as const },
    { name: "LangGraph", tag: "agent orchestration", status: "live" as const },
    { name: "eth-account", tag: "EIP-712", status: "live" as const },
  ];

  return (
    <div className="card px-5 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="label shrink-0">Integrated</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {items.map((it) => (
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
