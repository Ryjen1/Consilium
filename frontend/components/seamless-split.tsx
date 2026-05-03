"use client";
import { ArrowRight } from "lucide-react";

export function SeamlessSplit() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="label mb-2">Seamless experience</div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Research on SoSoValue. Execute on SoDEX.{" "}
          <span className="text-brand">In one agent loop.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4">
        <div className="card p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <div className="label">Source of truth</div>
            <h3 className="text-xl font-semibold tracking-tight">
              Know your investment targets
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Agents read ETF flows, token-unlock risk, and KOL narrative
              momentum via the SoSoValue Research Terminal. Signals arrive
              grounded in real market data, not vibes.
            </p>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-muted mono">
            <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
            8 Terminal endpoints live
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/40 flex items-center justify-center text-brand">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-long/10 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <div className="label">Execution layer</div>
            <h3 className="text-xl font-semibold tracking-tight">
              Invest in quality assets
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Sized positions become EIP-712-signed perps orders on SoDEX.
              Testnet by default with safety caps; same pipeline upgrades to
              mainnet when you flip the mode.
            </p>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-muted mono">
            <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
            SoDEX perps · EIP-712 signed
          </div>
        </div>
      </div>
    </div>
  );
}
