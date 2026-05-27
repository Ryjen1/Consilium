"""Signal outcome tracker — HIT / STOP / DRIFT classification.

After the fact, looks at each past decision and checks whether the trade
would have been profitable using SoDEX klines as truth.

Classification:
    HIT   — price moved in the trade's direction by ≥ 2% within 7 days
    STOP  — price moved against the trade by ≥ 2% within 7 days
    DRIFT — neither threshold hit within 7 days (flat / unclear)

This is NOT a real-time position tracker. It's a retrospective analytics
service that answers: "were our agents right?"

Used by:
    - /api/signals/outcomes endpoint for the dashboard
    - Wave 3: ValueChain audit log includes outcome in each tx
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

import structlog

from ..execution.ledger import Decision, get_session
from ..sodex import get_sodex_client

log = structlog.get_logger(__name__)

Outcome = Literal["HIT", "STOP", "DRIFT", "PENDING"]

# Thresholds for outcome classification.
HIT_THRESHOLD_PCT = 2.0   # move ≥2% in the correct direction
STOP_THRESHOLD_PCT = 2.0  # move ≥2% against the trade
LOOKBACK_DAYS = 7         # how far forward to look for outcome


def _classify(
    direction: str,
    entry_price: float,
    highest_price: float,
    lowest_price: float,
) -> Outcome:
    if direction == "long":
        upside = (highest_price - entry_price) / entry_price * 100
        downside = (entry_price - lowest_price) / entry_price * 100
        if upside >= HIT_THRESHOLD_PCT:
            return "HIT"
        if downside >= STOP_THRESHOLD_PCT:
            return "STOP"
    elif direction == "short":
        upside = (lowest_price - entry_price) / entry_price * 100
        downside = (highest_price - entry_price) / entry_price * 100
        if upside <= -HIT_THRESHOLD_PCT:
            return "HIT"
        if downside >= STOP_THRESHOLD_PCT:
            return "STOP"
    return "DRIFT"


async def compute_outcomes() -> list[dict]:
    """Evaluate all recent decisions against forward kline data."""
    from sqlalchemy import desc, select

    sodex_client = get_sodex_client()
    async with get_session() as session:
        result = await session.execute(
            select(Decision).order_by(desc(Decision.generated_at)).limit(50)
        )
        rows = result.scalars().all()

    if not rows:
        return []

    now = datetime.now(tz=timezone.utc)
    results: list[dict] = []

    for dec in rows:
        # Only evaluate signals that are at least LOOKBACK_DAYS old so we
        # have enough forward data to judge outcome.
        dec_time = dec.generated_at
        if dec_time.tzinfo is None:
            from datetime import timezone as tz
            dec_time = dec_time.replace(tzinfo=tz.utc)
        if (now - dec_time).days < LOOKBACK_DAYS:
            continue

        # Try to get klines from the decision date forward.
        # Use a safe symbol lookup; skip if not on SoDEX.
        sym_upper = dec.symbol.upper()
        # SoDEX perps naming pattern
        sodex_sym = f"{sym_upper}-USD"
        # Spot naming for SOSO and other spot-only tokens
        spot_map = {"SOSO": "WSOSO_vUSDC"}
        sodex_market = "perps"
        if sym_upper in spot_map:
            sodex_sym = spot_map[sym_upper]
            sodex_market = "spot"

        try:
            if sodex_market == "perps":
                klines = await sodex_client.perps_klines(
                    sodex_sym, interval="1D", limit=LOOKBACK_DAYS + 2
                )
            else:
                klines = await sodex_client.spot_klines(
                    sodex_sym, interval="1D", limit=LOOKBACK_DAYS + 2
                )
        except Exception:
            continue
        # SoDEX returns a list of dicts for valid symbols, or a single
        # error dict when the symbol isn't available on that market.
        if not isinstance(klines, list) or not klines:
            continue

        closes = [float(k["c"]) for k in klines if "c" in k]
        highs = [float(k["h"]) for k in klines if "h" in k]
        lows = [float(k["l"]) for k in klines if "l" in k]
        if len(closes) < 2:
            continue

        entry_price = closes[0]
        highest = max(highs[:LOOKBACK_DAYS]) if highs else entry_price
        lowest = min(lows[:LOOKBACK_DAYS]) if lows else entry_price

        outcome = _classify(dec.direction, entry_price, highest, lowest)

        results.append(
            {
                "id": dec.id,
                "cycle_id": dec.cycle_id,
                "agent": dec.agent,
                "symbol": dec.symbol,
                "direction": dec.direction,
                "confidence": dec.confidence,
                "reasoning": dec.reasoning[:120],
                "generated_at": dec_time.isoformat(),
                "entry_price": entry_price,
                "outcome": outcome,
                "7d_high": highest,
                "7d_low": lowest,
            }
        )

    return results
