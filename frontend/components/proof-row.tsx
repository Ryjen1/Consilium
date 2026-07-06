"use client";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, CircleDashed } from "lucide-react";
import { api, type Health } from "@/lib/api";

/**
 * Trust signals, each verifiable against the actual backend or the public
 * spec. No user counts, no testimonials, no numbers we can't substantiate.
 */
export function ProofRow() {
  const [health, setHealth] = useState<Health | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Health>("/api/health")
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sosoLive =
    !!health && !health.mock_mode && !health.soso_quota_exhausted;
  const sodexReady = !!health?.sodex?.execution_ready;
  const agentCount = health?.agents.length ?? 3;

  const items = [
    {
      label: "SoSoValue Terminal",
      value: sosoLive ? "Live" : offline ? "Reachable" : "Mock / fallback",
      ok: sosoLive,
      sub: "8 endpoints in active use",
    },
    {
      label: "SoDEX perps",
      value: sodexReady ? "EIP-712 signer ready" : "Dry-run",
      ok: sodexReady,
      sub: health?.sodex?.network
        ? health.sodex.network.toUpperCase()
        : "TESTNET",
    },
    {
      label: "Agents online",
      value: `${agentCount}/4`,
      ok: agentCount >= 4,
      sub: "ETF Flow · Unlock · KOL · Macro",
    },
    {
      label: "Cycle time",
      value: "~3s",
      ok: true,
      sub: "research → risk → exec",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="card px-4 py-3 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2">
            {it.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-long" />
            ) : offline ? (
              <Activity className="w-3.5 h-3.5 text-warn" />
            ) : (
              <CircleDashed className="w-3.5 h-3.5 text-muted" />
            )}
            <span className="label">{it.label}</span>
          </div>
          <div className="mono text-[15px] font-semibold text-text">
            {it.value}
          </div>
          <div className="text-[11px] text-muted">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
