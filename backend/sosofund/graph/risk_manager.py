"""RiskManager: aggregates multi-agent signals into sized target positions.

Wave 1 sizing rules:

1. **Confidence-weighted voting per symbol.** Each agent votes long/short/flat
   scaled by its own confidence. Opposing votes cancel proportionally.

2. **Consensus boost.** A single agent voting alone sizes at SOLO_WEIGHT (50%)
   of the per-name cap. Two agents agreeing on direction size at 100% of the
   cap. Three agents agreeing get the full SUPER_MAJORITY bonus (1.25x cap).
   Rationale: the pitch is 'multiple specialists agree' - sizing should
   reflect that.

3. **Per-name cap** of MAX_PER_NAME (5% of book). Aggressive enough to matter,
   conservative enough that a single bad call doesn't blow up the book.

4. **Gross exposure cap** of MAX_GROSS (100% - fully invested, no leverage).
"""
from __future__ import annotations

from collections import defaultdict

from .state import FundState

# Per-name / gross caps (as fraction of portfolio value).
MAX_PER_NAME = 0.05       # 5% cap per symbol
MAX_GROSS = 1.00          # 100% gross (no leverage in Wave 1)

# Consensus multipliers: scales the per-name cap by number of agents agreeing.
SOLO_WEIGHT = 0.5         # 1 agent -> 50% of cap
DUO_WEIGHT = 1.0          # 2 agents -> 100% of cap
SUPER_MAJORITY = 1.25     # 3+ agents -> 125% of cap (still capped by MAX_PER_NAME * 1.25)

NOISE_THRESHOLD = 0.003   # <0.3% target weight is noise, skip


async def risk_manager(state: FundState) -> FundState:
    signals = state.get("signals", [])
    by_symbol: dict[str, list] = defaultdict(list)
    for s in signals:
        by_symbol[s.symbol].append(s)

    sized: dict = {}
    for sym, sigs in by_symbol.items():
        # 1. Confidence-weighted directional vote.
        #    long=+1, short=-1, flat=0; each scaled by its agent's confidence.
        directional_score = sum(
            {"long": 1, "short": -1, "flat": 0}[s.direction] * s.confidence
            for s in sigs
        )
        # Normalize by the number of agents voting on this symbol so the
        # score stays in [-1, +1] regardless of how many voted.
        norm_score = directional_score / max(1, len(sigs))

        # 2. Consensus boost: how many agents actually agreed on the dominant
        #    direction? More agreement -> larger position.
        dominant_dir = "long" if norm_score > 0 else "short"
        agreeing = [s for s in sigs if s.direction == dominant_dir]
        n_agree = len(agreeing)

        if n_agree == 0:
            # Edge case: pure flat consensus, no directional exposure.
            continue
        elif n_agree == 1:
            consensus = SOLO_WEIGHT
        elif n_agree == 2:
            consensus = DUO_WEIGHT
        else:
            consensus = SUPER_MAJORITY

        # 3. Target weight = normalized directional score * per-name cap
        #    * consensus multiplier.
        target = norm_score * MAX_PER_NAME * consensus

        if abs(target) < NOISE_THRESHOLD:
            continue

        sized[sym] = {
            "target_weight": round(target, 4),
            "direction": "long" if target > 0 else "short",
            "contributing_agents": [s.agent for s in sigs],
            "agreeing_agents": [s.agent for s in agreeing],
            "consensus": (
                "solo" if n_agree == 1
                else "duo" if n_agree == 2
                else "super_majority"
            ),
            "avg_confidence": round(
                sum(s.confidence for s in sigs) / len(sigs), 3
            ),
            "reasoning": " | ".join(s.reasoning for s in sigs),
        }

    # 4. Enforce gross-exposure cap: if all positions combined exceed
    #    MAX_GROSS of book, scale every position down proportionally.
    gross = sum(abs(v["target_weight"]) for v in sized.values())
    if gross > MAX_GROSS:
        scale = MAX_GROSS / gross
        for v in sized.values():
            v["target_weight"] = round(v["target_weight"] * scale, 4)

    return {**state, "sized_positions": sized}
