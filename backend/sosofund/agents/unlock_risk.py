"""Unlock Risk Agent — dilution warning via token-economics endpoint.

Logic:
    - For each alt token in universe, pull /currencies/{id}/token-economics.
    - Find unlocks in the next 7 days.
    - If unlock amount > 3% of circulating supply -> short signal.
    - Confidence proportional to unlock size relative to circulating.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from ..client import get_client, symbol_to_id
from .base import Agent, Signal


class UnlockRiskAgent(Agent):
    name = "Unlock Risk"
    description = "Flags imminent token unlocks that could dilute holders."

    WINDOW_DAYS = 7
    DILUTION_THRESHOLD = 0.03  # 3% of circulating

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        now = datetime.now(tz=timezone.utc)
        horizon = now + timedelta(days=self.WINDOW_DAYS)
        signals: list[Signal] = []

        for sym in universe:
            cid = await symbol_to_id(sym, client)
            if not cid:
                continue
            try:
                econ = await client.token_economics(cid)
            except Exception:
                continue

            circ = float(econ.get("token_unlock", {}).get("circulating_supply") or 0)
            if circ <= 0:
                continue

            imminent_unlock = 0.0
            labels: list[str] = []
            for row in econ.get("unlock_timeline") or []:
                ts = int(row.get("timestamp", 0))
                when = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
                if now <= when <= horizon:
                    for v in row.get("vestings", []):
                        imminent_unlock += float(v.get("amount", 0))
                        labels.append(str(v.get("label", "")))

            if imminent_unlock <= 0:
                continue

            dilution = imminent_unlock / circ
            if dilution < self.DILUTION_THRESHOLD:
                continue

            confidence = min(1.0, dilution / (self.DILUTION_THRESHOLD * 3))
            thesis = (
                f"{sym.upper()} faces a {dilution*100:.1f}% circulating-supply unlock "
                f"({', '.join(set(labels)) or 'mixed'}) within {self.WINDOW_DAYS} days — "
                f"expect supply-side pressure."
            )
            signals.append(
                Signal(
                    agent=self.name,
                    symbol=sym.upper(),
                    direction="short",
                    confidence=round(confidence, 3),
                    reasoning=thesis,
                    evidence={
                        "unlock_amount": imminent_unlock,
                        "circulating_supply": circ,
                        "dilution_pct": round(dilution, 4),
                        "window_days": self.WINDOW_DAYS,
                    },
                )
            )
        return signals
