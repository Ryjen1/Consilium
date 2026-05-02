"""PortfolioManager: converts sized targets into Trade orders."""
from __future__ import annotations

from .state import FundState, Trade


async def portfolio_manager(state: FundState) -> FundState:
    sized = state.get("sized_positions", {})
    pv = state.get("portfolio_value_usd", 100_000.0)
    trades: list[Trade] = []
    for sym, pos in sized.items():
        size_usd = round(pv * abs(pos["target_weight"]), 2)
        if size_usd <= 0:
            continue
        trades.append(
            Trade(
                symbol=sym,
                side="buy" if pos["direction"] == "long" else "sell",
                size_usd=size_usd,
                rationale=pos["reasoning"],
                agents=pos["contributing_agents"],
                confidence=pos["avg_confidence"],
            )
        )
    return {**state, "trades": trades}
