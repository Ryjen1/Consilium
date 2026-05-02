"""RiskManager: aggregates multi-agent signals into sized target positions.

Rules (Wave 1):
    - Per-symbol target weight = aggregate_confidence * direction_vote * MAX_PER_NAME
    - Signals for same symbol with opposing directions cancel proportionally
    - Cap any single position at MAX_PER_NAME (10%)
    - Cap gross exposure at MAX_GROSS (120%)
"""
from __future__ import annotations

from collections import defaultdict

from .state import FundState

MAX_PER_NAME = 0.10
MAX_GROSS = 1.20


async def risk_manager(state: FundState) -> FundState:
    signals = state.get("signals", [])
    by_symbol: dict[str, list] = defaultdict(list)
    for s in signals:
        by_symbol[s.symbol].append(s)

    sized: dict = {}
    for sym, sigs in by_symbol.items():
        # Directional vote weighted by confidence (long=+1, short=-1, flat=0)
        score = sum(
            {"long": 1, "short": -1, "flat": 0}[s.direction] * s.confidence for s in sigs
        )
        # Normalize by number of agents voting on this symbol
        norm_score = score / max(1, len(sigs))
        target = norm_score * MAX_PER_NAME
        if abs(target) < 0.005:  # <0.5% is noise, skip
            continue
        sized[sym] = {
            "target_weight": round(target, 4),
            "direction": "long" if target > 0 else "short",
            "contributing_agents": [s.agent for s in sigs],
            "avg_confidence": round(
                sum(s.confidence for s in sigs) / len(sigs), 3
            ),
            "reasoning": " | ".join(s.reasoning for s in sigs),
        }

    # Enforce gross cap
    gross = sum(abs(v["target_weight"]) for v in sized.values())
    if gross > MAX_GROSS:
        scale = MAX_GROSS / gross
        for v in sized.values():
            v["target_weight"] = round(v["target_weight"] * scale, 4)

    return {**state, "sized_positions": sized}
