"""KOL Narrative Agent — social momentum from blue-verified Business accounts.

Logic:
    - Pull /news (category filters optional).
    - For each symbol in universe, count news items where:
        - matched_currencies contains the symbol
        - is_blue_verified == 1 AND verified_type == "Business"
        - posted within last 24h
    - If >= 2 such items AND combined impressions > 500k -> long signal.
    - Confidence scales with impressions.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from ..client import get_client
from .base import Agent, Signal


class KOLNarrativeAgent(Agent):
    name = "KOL Narrative"
    description = "Buy the narrative: blue-verified Business accounts amplifying a ticker."

    MIN_ITEMS = 2
    MIN_IMPRESSIONS = 500_000
    WINDOW_HOURS = 24

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        feed = await client.news(page_size=100)
        items = feed.get("list", [])

        cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=self.WINDOW_HOURS)
        universe_up = {s.upper() for s in universe}

        tallies: dict[str, dict] = {s: {"count": 0, "impressions": 0, "titles": []} for s in universe_up}

        for it in items:
            if not it.get("is_blue_verified"):
                continue
            if it.get("verified_type") != "Business":
                continue
            release = datetime.fromtimestamp(int(it.get("release_time", 0)) / 1000, tz=timezone.utc)
            if release < cutoff:
                continue
            for m in it.get("matched_currencies", []) or []:
                sym = str(m.get("name", "")).upper()
                if sym in tallies:
                    tallies[sym]["count"] += 1
                    tallies[sym]["impressions"] += int(it.get("impression_count", 0))
                    tallies[sym]["titles"].append(it.get("title", ""))

        signals: list[Signal] = []
        for sym, agg in tallies.items():
            if agg["count"] < self.MIN_ITEMS:
                continue
            if agg["impressions"] < self.MIN_IMPRESSIONS:
                continue
            confidence = min(1.0, agg["impressions"] / (self.MIN_IMPRESSIONS * 4))
            sample = agg["titles"][0] if agg["titles"] else ""
            thesis = (
                f"{sym} is trending across {agg['count']} Business-verified accounts in 24h "
                f"with {agg['impressions']/1e6:.1f}M impressions. Sample: \"{sample[:80]}\"."
            )
            signals.append(
                Signal(
                    agent=self.name,
                    symbol=sym,
                    direction="long",
                    confidence=round(confidence, 3),
                    reasoning=thesis,
                    evidence={
                        "kol_posts_24h": agg["count"],
                        "combined_impressions": agg["impressions"],
                    },
                )
            )
        return signals
