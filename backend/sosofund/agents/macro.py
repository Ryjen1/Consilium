"""Macro Agent — risk-regime classifier and pre-event positioning signal.

Reads /macro/events for upcoming macro events and /macro/events/{name}/history
for recent actual-vs-forecast residuals. When a major macro event is within
48h, the agent fires a directional signal based on the historical pattern
of how the market reacted to similar residual surprises.

Risk regime classification:
    risk-on  — recent CPI/Fed surprises skew dovish, or strong labor data
    risk-off — recent CPI/Fed surprises skew hawkish, or labor weakening
    neutral  — mixed signals or no major event in the window

    For now the signal is event-driven (only fires within 48h of a major event).
    Future work can expand this to continuous regime classification.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import structlog

from ..client import get_client
from .base import Agent, Signal

log = structlog.get_logger(__name__)

# Event names as they appear in SoSoValue's /macro/events endpoint.
# We track the ones that historically move crypto the most.
_MACRO_EVENTS = [
    "CPI (MoM)",
    "Core CPI (MoM)",
    "Nonfarm Payrolls",
]

# How many hours before an event we start positioning.
_WINDOW_HOURS = 48


def _parse_residual(actual_s: str, forecast_s: str) -> float | None:
    """Compute (actual - forecast) as a float. Returns None if unparseable."""
    try:
        actual = float(actual_s.replace("%", "").replace(",", ""))
        forecast = float(forecast_s.replace("%", "").replace(",", ""))
        return actual - forecast
    except (ValueError, TypeError):
        return None


class MacroAgent(Agent):
    name = "Macro"
    description = (
        "Classifies macro risk regime and positions ahead of CPI/NFP events "
        "using actual-vs-forecast residuals."
    )

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        signals: list[Signal] = []
        now = datetime.now(tz=timezone.utc)
        horizon = now + timedelta(hours=_WINDOW_HOURS)

        # Step 1: get upcoming events in the next 48h
        try:
            raw_events = await client._get("/macro/events")
        except Exception as e:
            log.warning("macro_events_fetch_failed", error=str(e))
            return []
        if not isinstance(raw_events, list):
            return []

        upcoming: list[str] = []
        for ev in raw_events:
            if not isinstance(ev, dict):
                continue
            date_s = ev.get("date")
            if not date_s:
                continue
            try:
                ev_date = datetime.strptime(date_s, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                continue
            if now <= ev_date <= horizon:
                for name in ev.get("events", []):
                    if any(k in name for k in _MACRO_EVENTS):
                        upcoming.append(name)

        if not upcoming:
            return []

        # Step 2: for each upcoming event, get recent history and compute
        # the latest actual-vs-forecast residual.
        risk_score = 0.0  # positive = risk-on, negative = risk-off
        event_details: list[str] = []

        for event_name in upcoming:
            try:
                history = await client._get(
                    f"/macro/events/{event_name}/history", params={"limit": 3}
                )
            except Exception:
                continue
            if not isinstance(history, list) or not history:
                continue

            latest = history[0]
            actual_s = str(latest.get("actual") or "")
            forecast_s = str(latest.get("forecast") or "")
            residual = _parse_residual(actual_s, forecast_s)
            if residual is None:
                continue

            # For CPI / inflation metrics: actual > forecast = hawkish = risk-off
            # For employment: actual > forecast = strong labor = risk-on (ambiguous)
            # Simplified heuristic:
            if "CPI" in event_name or "Core" in event_name:
                if residual > 0:
                    risk_score -= 0.3  # hawkish
                    event_details.append(
                        f"{event_name} came in hot: actual {actual_s} vs forecast {forecast_s}"
                    )
                elif residual < 0:
                    risk_score += 0.3  # dovish
                    event_details.append(
                        f"{event_name} came in cool: actual {actual_s} vs forecast {forecast_s}"
                    )
            elif "Nonfarm" in event_name or "Payroll" in event_name:
                if residual > 0:
                    risk_score += 0.1  # strong labor, mild risk-on
                    event_details.append(
                        f"{event_name} strong: actual {actual_s} vs forecast {forecast_s}"
                    )
                elif residual < 0:
                    risk_score -= 0.1  # weak labor, mild risk-off
                    event_details.append(
                        f"{event_name} weak: actual {actual_s} vs forecast {forecast_s}"
                    )

        if not event_details:
            return []

        # Step 3: emit signal for the primary asset in the universe.
        # We pick the first symbol as the "macro trade" vehicle — typically BTC.
        sym = (universe[0] if universe else "BTC").upper()

        if risk_score > 0.1:
            direction = "long"
            confidence = min(1.0, abs(risk_score) / 0.5)
            thesis = f"Macro regime: RISK-ON. {'; '.join(event_details)}. Event in {_WINDOW_HOURS}h — positioning long."
        elif risk_score < -0.1:
            direction = "short"
            confidence = min(1.0, abs(risk_score) / 0.5)
            thesis = f"Macro regime: RISK-OFF. {'; '.join(event_details)}. Event in {_WINDOW_HOURS}h — positioning short."
        else:
            return []  # neutral, no signal

        signals.append(
            Signal(
                agent=self.name,
                symbol=sym,
                direction=direction,
                confidence=round(confidence, 3),
                reasoning=thesis,
                evidence={
                    "risk_score": round(risk_score, 3),
                    "upcoming_events": upcoming,
                    "event_details": event_details,
                    "window_hours": _WINDOW_HOURS,
                },
            )
        )
        return signals
