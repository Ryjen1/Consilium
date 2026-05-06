"""ETF Flow Agent — institutional demand signal via spot ETF net flows.

Logic:
    - Pull last 7 trading days of /etfs/summary-history for BTC and ETH (US).
    - Compute 3-day rolling cumulative net inflow.
    - Strong inflow (>$500M cum over 3d) -> long underlying.
    - Strong outflow (< -$300M cum over 3d) -> short underlying.
    - Confidence scales with magnitude.
"""
from __future__ import annotations

from ..client import get_client
from .base import Agent, Signal


class ETFFlowAgent(Agent):
    name = "ETF Flow"
    description = "Institutional demand via spot ETF net inflows (US BTC/ETH)."

    LONG_THRESHOLD = 500_000_000  # $500M cumulative 3d
    SHORT_THRESHOLD = -300_000_000  # -$300M cumulative 3d

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        signals: list[Signal] = []
        for sym in {"BTC", "ETH"} & set(u.upper() for u in universe):
            try:
                rows = await client.etf_summary_history(symbol=sym, country_code="US", limit=7)
            except Exception:
                continue
            if not isinstance(rows, list) or not rows:
                continue
            # API returns reverse-chrono; take the 3 most recent
            recent = [r for r in rows[:3] if isinstance(r, dict)]
            if not recent:
                continue
            try:
                cum_3d = sum(float(r.get("total_net_inflow") or 0) for r in recent)
                total_assets = float(recent[0].get("total_net_assets") or 0)
            except (TypeError, ValueError):
                continue

            if cum_3d >= self.LONG_THRESHOLD:
                direction = "long"
                confidence = min(1.0, cum_3d / (self.LONG_THRESHOLD * 3))
                thesis = (
                    f"{sym} spot ETFs saw ${cum_3d/1e6:.0f}M net inflows over the last 3 trading days, "
                    f"signaling persistent institutional accumulation."
                )
            elif cum_3d <= self.SHORT_THRESHOLD:
                direction = "short"
                confidence = min(1.0, abs(cum_3d) / (abs(self.SHORT_THRESHOLD) * 3))
                thesis = (
                    f"{sym} spot ETFs bled ${abs(cum_3d)/1e6:.0f}M over 3 days — "
                    f"institutional risk-off. Fade rallies."
                )
            else:
                continue

            signals.append(
                Signal(
                    agent=self.name,
                    symbol=sym,
                    direction=direction,
                    confidence=round(confidence, 3),
                    reasoning=thesis,
                    evidence={
                        "cum_3d_net_inflow_usd": cum_3d,
                        "total_net_assets_usd": total_assets,
                        "days_sampled": len(recent),
                    },
                )
            )
        return signals
