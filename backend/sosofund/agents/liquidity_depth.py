"""Liquidity Depth Agent — cost-to-move sizing from orderbook depth.

Uses SoSoValue's /currencies/{id}/pairs endpoint which provides
cost_to_move_up_2pct and cost_to_move_down_2pct for each trading pair.

Logic:
    - For each symbol, fetch the cost-to-move metrics.
    - A token with thin books (low cost-to-move) is harder to exit and
      carries higher slippage risk → the agent down-sizes or skips.
    - A token with deep books (high cost-to-move) is liquid and safe
      to size into → the agent emits a long signal weighted by depth.
    - Short signals fire when the book is asymmetrically thin on the
      downside (cheap to dump, expensive to pump).
"""
from __future__ import annotations

from ..client import get_client, symbol_to_id
from .base import Agent, Signal


class LiquidityDepthAgent(Agent):
    name = "Liquidity Depth"
    description = (
        "Sizes positions based on orderbook depth: deep books = higher "
        "conviction, thin books = reduced sizing or skip."
    )

    # Minimum cost-to-move $2% in USD to consider a book "deep enough".
    MIN_DEPTH_USD = 50_000

    # Thresholds for asymmetric depth signals.
    # If up_2pct > down_2pct by this factor, book is bearish-asymmetric.
    ASYMMETRY_FACTOR = 2.0

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        signals: list[Signal] = []

        for sym in universe:
            cid = await symbol_to_id(sym, client)
            if not cid:
                continue
            try:
                pairs = await client._get(f"/currencies/{cid}/pairs")
            except Exception:
                continue
            if not isinstance(pairs, list) or not pairs:
                continue

            # Take the highest-liquidity pair (first USDT pair usually).
            pair = None
            for p in pairs:
                if isinstance(p, dict) and "USDT" in str(p.get("symbol", "")):
                    pair = p
                    break
            if not pair and isinstance(pairs[0], dict):
                pair = pairs[0]
            if not pair:
                continue

            try:
                up_cost = float(pair.get("cost_to_move_up_2pct") or 0)
                down_cost = float(pair.get("cost_to_move_down_2pct") or 0)
            except (TypeError, ValueError):
                continue

            avg_depth = (up_cost + down_cost) / 2
            if avg_depth < self.MIN_DEPTH_USD:
                continue  # book too thin to trade safely

            # Asymmetric depth: if it's much cheaper to push price down
            # than up, there's selling pressure / thin bid support → short.
            if down_cost > 0 and up_cost > 0:
                ratio = up_cost / down_cost
                if ratio > self.ASYMMETRY_FACTOR:
                    confidence = min(1.0, (ratio - 1) / 3)
                    signals.append(
                        Signal(
                            agent=self.name,
                            symbol=sym.upper(),
                            direction="short",
                            confidence=round(confidence, 3),
                            reasoning=(
                                f"{sym} book is bearish-asymmetric: "
                                f"cost to move up 2% is ${up_cost:,.0f} vs "
                                f"cost to move down 2% is ${down_cost:,.0f}. "
                                f"Cheaper to dump than pump."
                            ),
                            evidence={
                                "cost_to_move_up_2pct": up_cost,
                                "cost_to_move_down_2pct": down_cost,
                                "avg_depth_usd": avg_depth,
                                "asymmetry_ratio": round(ratio, 2),
                            },
                        )
                    )
                    continue
                if ratio < 1 / self.ASYMMETRY_FACTOR:
                    confidence = min(1.0, (1 / ratio - 1) / 3)
                    signals.append(
                        Signal(
                            agent=self.name,
                            symbol=sym.upper(),
                            direction="long",
                            confidence=round(confidence, 3),
                            reasoning=(
                                f"{sym} book is bullish-asymmetric: "
                                f"cost to move up 2% is ${up_cost:,.0f} vs "
                                f"cost to move down 2% is ${down_cost:,.0f}. "
                                f"Deep bids support price."
                            ),
                            evidence={
                                "cost_to_move_up_2pct": up_cost,
                                "cost_to_move_down_2pct": down_cost,
                                "avg_depth_usd": avg_depth,
                                "asymmetry_ratio": round(ratio, 2),
                            },
                        )
                    )
                    continue

        return signals
