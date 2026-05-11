"""Unlock Risk Agent — supply-overhang warning via market-snapshot endpoint.

The original Wave-1 thesis was a 7-day forward unlock-window check using
SoSoValue's /currencies/{id}/token-economics endpoint, but that endpoint
returns null timestamps and null token_unlock summaries on the demo tier
for the major tokens, which makes any forward-window logic impossible.

We instead use /currencies/{id}/market-snapshot, which reliably returns:

    {
      "circulating_supply": <amount currently tradeable>,
      "max_supply":         <hard cap or projected total>,
      ...
    }

A token whose `(max_supply - circulating) / circulating` ratio is high
carries supply-overhang risk: future emissions, vesting cliffs, or staking
unlocks have to land somewhere, and they push price down whenever they do.
The agent fires a SHORT signal weighted by how far the overhang ratio
exceeds the threshold.

For tokens with no defined max_supply (ETH, SOL — both inflate), we cannot
compute overhang and the agent stays silent.
"""
from __future__ import annotations

from ..client import get_client, symbol_to_id
from .base import Agent, Signal


class UnlockRiskAgent(Agent):
    name = "Unlock Risk"
    description = (
        "Flags supply-overhang risk: tokens with a large fraction of supply "
        "still locked relative to their current circulating float."
    )

    # Overhang ratio = (max_supply - circulating) / circulating.
    # 0.4 means 40 locked tokens for every 100 in float — meaningful pressure.
    OVERHANG_THRESHOLD = 0.4

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        signals: list[Signal] = []

        for sym in universe:
            cid = await symbol_to_id(sym, client)
            if not cid:
                continue
            try:
                snap = await client.currency_snapshot(cid)
            except Exception:
                continue
            if not isinstance(snap, dict):
                continue

            try:
                circ = float(snap.get("circulating_supply") or 0)
                max_supply = float(snap.get("max_supply") or 0)
            except (TypeError, ValueError):
                continue
            # Need both numbers to compute overhang. Tokens with no defined
            # max (ETH, SOL — perpetual inflation) are skipped intentionally.
            if circ <= 0 or max_supply <= 0:
                continue

            locked = max(0.0, max_supply - circ)
            if locked <= 0:
                continue

            overhang = locked / circ
            if overhang < self.OVERHANG_THRESHOLD:
                continue

            confidence = min(1.0, overhang / (self.OVERHANG_THRESHOLD * 3))

            thesis = (
                f"{sym.upper()} carries {overhang*100:.0f}% supply overhang: "
                f"{locked/1e6:.1f}M tokens still locked vs {circ/1e6:.1f}M "
                f"in circulation. Expect structural sell pressure as cliffs unlock."
            )
            signals.append(
                Signal(
                    agent=self.name,
                    symbol=sym.upper(),
                    direction="short",
                    confidence=round(confidence, 3),
                    reasoning=thesis,
                    evidence={
                        "circulating_supply": circ,
                        "max_supply": max_supply,
                        "locked_estimate": locked,
                        "overhang_ratio": round(overhang, 3),
                        "threshold": self.OVERHANG_THRESHOLD,
                    },
                )
            )
        return signals
