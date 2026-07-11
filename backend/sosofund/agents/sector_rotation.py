"""Sector Rotation Agent — rotates into the strongest-performing sector.

Uses SoSoValue's /currencies/sector-spotlight endpoint to identify which
crypto sector (DeFi, L1, L2, AI, Meme, etc.) is outperforming today.

Logic:
    - Fetch sector performance from /currencies/sector-spotlight.
    - Rank sectors by 24h change.
    - If the top sector is up significantly (>2%), long the primary
      tokens in that sector from the universe.
    - If the top sector is down significantly (<-2%), stay flat.
    - Confidence scales with the sector's relative strength.
"""
from __future__ import annotations

from ..client import get_client
from .base import Agent, Signal

# Map sector names to likely universe tokens.
_SECTOR_TOKENS: dict[str, list[str]] = {
    "DeFi": ["ARB", "OP", "UNI", "AAVE"],
    "Layer 1": ["BTC", "ETH", "SOL", "AVAX", "SUI"],
    "Layer 2": ["ARB", "OP"],
    "AI": ["WLD"],
    "Meme": ["DOGE", "PEPE", "SHIB"],
    "Infrastructure": ["LINK"],
}


class SectorRotationAgent(Agent):
    name = "Sector Rotation"
    description = (
        "Rotates into the strongest-performing sector: longs tokens in "
        "the top sector by 24h performance from SoSoValue sector-spotlight."
    )

    # Minimum 24h sector change to trigger a signal.
    MIN_SECTOR_CHANGE_PCT = 1.5

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        signals: list[Signal] = []

        try:
            data = await client._get("/currencies/sector-spotlight")
        except Exception:
            return []

        if not isinstance(data, dict):
            return []

        sectors = data.get("sector") or []
        if not isinstance(sectors, list) or not sectors:
            return []

        # Rank by 24h change.
        ranked = sorted(
            [s for s in sectors if isinstance(s, dict)],
            key=lambda s: float(s.get("change_pct_24h") or 0),
            reverse=True,
        )

        if not ranked:
            return []

        top = ranked[0]
        top_name = str(top.get("name") or "")
        top_change = float(top.get("change_pct_24h") or 0)
        top_dom = float(top.get("marketcap_dom") or 0)

        if abs(top_change) < self.MIN_SECTOR_CHANGE_PCT:
            return []  # no strong sector rotation signal

        if top_change < 0:
            return []  # all sectors down, no long signal

        # Find universe tokens that belong to the top sector.
        universe_set = {s.upper() for s in universe}
        sector_tokens = _SECTOR_TOKENS.get(top_name, [])
        targets = [t for t in sector_tokens if t in universe_set]

        if not targets:
            # If no direct match, pick the strongest token from the universe
            # based on the sector's performance as a proxy.
            return []

        confidence = min(1.0, top_change / 5)

        for token in targets:
            signals.append(
                Signal(
                    agent=self.name,
                    symbol=token,
                    direction="long",
                    confidence=round(confidence, 3),
                    reasoning=(
                        f"{top_name} is the top-performing sector today at "
                        f"{top_change:+.1f}% (dominance {top_dom:.1f}%). "
                        f"Rotating into {token} as a sector proxy."
                    ),
                    evidence={
                        "sector": top_name,
                        "sector_change_24h": top_change,
                        "sector_dominance": top_dom,
                        "top_sectors": [
                            {"name": s.get("name"), "change": s.get("change_pct_24h")}
                            for s in ranked[:3]
                        ],
                    },
                )
            )

        return signals
