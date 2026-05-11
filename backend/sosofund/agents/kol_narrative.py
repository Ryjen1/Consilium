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
    # SoSoValue's `impression_count` field is closer to per-post engagement
    # than Twitter-style raw impressions. Calibrated empirically against the
    # live /news feed: 100 keeps the agent selective without being so strict
    # that genuine narrative momentum gets missed.
    MIN_IMPRESSIONS = 100
    WINDOW_HOURS = 24

    # SoSoValue's `matched_currencies` field is a quirk: the per-item objects
    # use `name` for the FULL project name ("BITCOIN", "ETHEREUM", "SOLANA")
    # and `full_name` for the ticker ("BTC", "ETH", "SOL"). The original
    # implementation matched on `m.name` against tickers, which never hit.
    # We now match on either field, and also map common project names to
    # their tickers so a "BITCOIN"-tagged post correctly attributes to BTC.
    _NAME_TO_TICKER = {
        "BITCOIN": "BTC",
        "ETHEREUM": "ETH",
        "SOLANA": "SOL",
        "ARBITRUM": "ARB",
        "OPTIMISM": "OP",
        "AVALANCHE": "AVAX",
        "RIPPLE": "XRP",
        "DOGECOIN": "DOGE",
        "CHAINLINK": "LINK",
        "POLYGON": "MATIC",
        "TRON": "TRX",
        "BINANCE COIN": "BNB",
    }

    async def run(self, universe: list[str]) -> list[Signal]:
        client = get_client()
        try:
            feed = await client.news(page_size=100)
        except Exception:
            return []

        if not isinstance(feed, dict):
            return []
        items = feed.get("list") or []
        if not isinstance(items, list):
            return []

        cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=self.WINDOW_HOURS)
        universe_up = {s.upper() for s in universe}

        tallies: dict[str, dict] = {s: {"count": 0, "impressions": 0, "titles": []} for s in universe_up}

        for it in items:
            if not isinstance(it, dict):
                continue
            if not it.get("is_blue_verified"):
                continue
            if it.get("verified_type") != "Business":
                continue
            try:
                release_ts = int(it.get("release_time") or 0)
            except (TypeError, ValueError):
                continue
            if release_ts <= 0:
                continue
            release = datetime.fromtimestamp(release_ts / 1000, tz=timezone.utc)
            if release < cutoff:
                continue
            for m in it.get("matched_currencies") or []:
                if not isinstance(m, dict):
                    continue
                # Try every plausible identifier on the matched-currency object.
                # SoSoValue's `name` is the project name (e.g. "BITCOIN"), and
                # `full_name` is the ticker (e.g. "BTC"). We also fall back to
                # mapping known project names to tickers.
                candidates = {
                    str(m.get("name") or "").upper(),
                    str(m.get("full_name") or "").upper(),
                    str(m.get("symbol") or "").upper(),
                }
                # Resolve project-name -> ticker via the static map.
                for c in list(candidates):
                    if c in self._NAME_TO_TICKER:
                        candidates.add(self._NAME_TO_TICKER[c])
                # Find the first candidate that matches our universe.
                hit = next((c for c in candidates if c in tallies), None)
                if not hit:
                    continue
                tallies[hit]["count"] += 1
                try:
                    tallies[hit]["impressions"] += int(it.get("impression_count") or 0)
                except (TypeError, ValueError):
                    pass
                tallies[hit]["titles"].append(str(it.get("title") or ""))

        signals: list[Signal] = []
        for sym, agg in tallies.items():
            if agg["count"] < self.MIN_ITEMS:
                continue
            if agg["impressions"] < self.MIN_IMPRESSIONS:
                continue
            confidence = min(1.0, agg["impressions"] / (self.MIN_IMPRESSIONS * 4))
            # First non-empty sample title, truncated for readability.
            sample = next((t for t in agg["titles"] if t), "")
            # Smart-format engagement: M for >=1M, k for >=1k, raw otherwise.
            imp = agg["impressions"]
            if imp >= 1_000_000:
                imp_str = f"{imp / 1e6:.1f}M"
            elif imp >= 1_000:
                imp_str = f"{imp / 1e3:.1f}k"
            else:
                imp_str = f"{imp}"
            sample_part = f" Sample: \"{sample[:80]}\"." if sample else ""
            thesis = (
                f"{sym} is trending across {agg['count']} Business-verified accounts in 24h "
                f"with {imp_str} engagement.{sample_part}"
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
