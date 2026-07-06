"""PortfolioManager: converts sized target weights into Trade orders.

Sizing adapts to the actual portfolio value the user passes in. A $100
book produces $5 positions; a $1M book produces $50k positions. The
math stays proportional.

Two guards:

- **MIN_NOTIONAL_USD** ($10) — positions below this are skipped, not
  emitted as a dust trade the exchange will reject. SoDEX perps min
  notional is $10 across all major pairs.

- **MIN_PORTFOLIO_USD** ($25) — below this, the agent can't meaningfully
  allocate any position at the 5% per-name cap.
"""
from __future__ import annotations

from .state import FundState, Trade

MIN_NOTIONAL_USD = 10.0
MIN_PORTFOLIO_USD = 25.0


async def portfolio_manager(state: FundState) -> FundState:
    sized = state.get("sized_positions", {})
    pv = float(state.get("portfolio_value_usd") or 0)
    errors = list(state.get("errors", []))
    trades: list[Trade] = []

    # Guard: portfolio too small to place any meaningful trade.
    if pv < MIN_PORTFOLIO_USD:
        errors.append(
            f"Portfolio of ${pv:.2f} is below the ${MIN_PORTFOLIO_USD:.0f} "
            f"minimum. Agents produced {len(sized)} sized positions but "
            f"no trades were emitted. Deposit more to activate execution."
        )
        return {**state, "trades": [], "errors": errors}

    skipped_dust = 0
    for sym, pos in sized.items():
        size_usd = round(pv * abs(pos["target_weight"]), 2)
        if size_usd < MIN_NOTIONAL_USD:
            skipped_dust += 1
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

    if skipped_dust > 0:
        errors.append(
            f"{skipped_dust} position(s) skipped: below ${MIN_NOTIONAL_USD:.0f} "
            f"notional minimum at this portfolio size."
        )

    return {**state, "trades": trades, "errors": errors}
