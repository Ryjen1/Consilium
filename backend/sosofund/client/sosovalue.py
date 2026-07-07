"""Typed SoSoValue API client.

Covers the 8 endpoints SoSoFund needs for Wave 1:
    - /currencies
    - /currencies/{id}/market-snapshot
    - /currencies/{id}/klines
    - /currencies/{id}/token-economics
    - /etfs/summary-history
    - /etfs/{ticker}/history
    - /btc-treasuries
    - /btc-treasuries/{ticker}/purchase-history
    - /news

Runs in MOCK mode when SOSO_API_KEY is unset, returning deterministic fixtures
so the rest of the system (agents, graph, UI, backtester) is fully demo-able
with zero external dependencies.
"""
from __future__ import annotations

import asyncio
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import structlog

from ..config import get_settings

log = structlog.get_logger(__name__)


class _RateLimiter:
    """Process-wide rate limiter.

    SoSoValue demo-plan (as of May 2026): 10 req/min per key (6s spacing)
    and 10,000 calls/month. We stay safely under the per-minute cap at
    6.5s intervals to leave headroom for burst overlap between sequential
    awaits. Heavy cache TTLs elsewhere in this file keep the monthly
    count comfortably under 10k.
    """

    def __init__(self, min_interval_s: float = 6.5) -> None:
        self.min_interval = min_interval_s
        self._last = 0.0
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            wait = self.min_interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


_limiter = _RateLimiter()


class _TinyCache:
    """TTL cache for idempotent GETs."""

    def __init__(self) -> None:
        self._data: dict[str, tuple[float, Any]] = {}

    def get(self, key: str, ttl_s: float) -> Any | None:
        hit = self._data.get(key)
        if not hit:
            return None
        ts, value = hit
        if time.monotonic() - ts > ttl_s:
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._data[key] = (time.monotonic(), value)


_cache = _TinyCache()


class SoSoValueClient:
    """Async SoSoValue client with mock fallback, rate limiting and caching."""

    # TTL per path prefix. Tuned for demo freshness vs rate-limit budget.
    _CACHE_TTL: dict[str, float] = {
        "/currencies": 3600,
        "/btc-treasuries": 600,
        "/etfs/summary-history": 120,
        "/news": 45,
        # Market snapshot / klines / token-economics: 60s by default
    }
    _DEFAULT_TTL = 60.0

    def __init__(self, api_key: str = "", base_url: str = "") -> None:
        settings = get_settings()
        self.api_key = api_key or settings.soso_api_key
        self.base_url = (base_url or settings.soso_base_url).rstrip("/")
        self._http: httpx.AsyncClient | None = None
        self._quota_exhausted: bool = False  # latches once SoSoValue returns monthly-quota 429

    # ------------------------------------------------------------------ http
    @property
    def mock(self) -> bool:
        return False

    @property
    def quota_exhausted(self) -> bool:
        return self._quota_exhausted

    async def _client(self) -> httpx.AsyncClient:
        if self._http is None:
            self._http = httpx.AsyncClient(
                base_url=self.base_url,
                headers={"x-soso-api-key": self.api_key} if self.api_key else {},
                timeout=20.0,
            )
        return self._http

    async def close(self) -> None:
        if self._http is not None:
            await self._http.aclose()
            self._http = None

    def _ttl_for(self, path: str) -> float:
        for prefix, ttl in self._CACHE_TTL.items():
            if path.startswith(prefix):
                return ttl
        return self._DEFAULT_TTL

    @staticmethod
    def _cache_key(path: str, params: dict[str, Any]) -> str:
        return f"{path}?{sorted(params.items())}"

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        params = params or {}
        if not self.api_key:
            raise ValueError("SOSO_API_KEY is not configured. Real SoSoValue API is required.")

        key = self._cache_key(path, params)
        hit = _cache.get(key, self._ttl_for(path))
        if hit is not None:
            return hit

        client = await self._client()
        attempts = 5
        backoff_base = 0.8
        last_exc: Exception | None = None
        for i in range(attempts):
            await _limiter.acquire()
            try:
                r = await client.get(path, params=params)
                if r.status_code == 429:
                    # SoSoValue structured body: either {code, message, details.retry_after}
                    # (rate-limit) or {code, message: "...quota exceeded..."} (monthly cap).
                    body_msg = ""
                    retry_after = None
                    try:
                        body = r.json()
                        body_msg = str(body.get("message") or "").lower()
                        retry_after = (body.get("details") or {}).get("retry_after")
                    except Exception:
                        pass
                    # Monthly quota is unrecoverable for the rest of the window.
                    if "quota" in body_msg:
                        if not self._quota_exhausted:
                            log.warning(
                                "soso_quota_exhausted",
                                path=path,
                                message=body_msg,
                            )
                        self._quota_exhausted = True
                        r.raise_for_status()
                    if retry_after is None:
                        ra_hdr = r.headers.get("retry-after")
                        retry_after = float(ra_hdr) if ra_hdr else None
                    sleep_s = (
                        float(retry_after)
                        if retry_after is not None
                        else backoff_base * (2 ** i) + random.random()
                    )
                    log.warning(
                        "soso_rate_limited",
                        path=path,
                        attempt=i + 1,
                        sleep_s=round(sleep_s, 2),
                    )
                    last_exc = httpx.HTTPStatusError(
                        "429 Too Many Requests", request=r.request, response=r
                    )
                    await asyncio.sleep(min(sleep_s, 60.0))
                    continue
                r.raise_for_status()
                payload = r.json()
                # SoSoValue wraps successful responses as {code, message, data}.
                # Agents and the UI expect the unwrapped `data`.
                if isinstance(payload, dict) and "data" in payload and "code" in payload:
                    data = payload.get("data")
                else:
                    data = payload
                _cache.set(key, data)
                return data
            except httpx.HTTPStatusError as e:
                if 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                    raise
                last_exc = e
            except httpx.HTTPError as e:
                last_exc = e
            await asyncio.sleep(backoff_base * (2 ** i))
        if last_exc is None:
            last_exc = RuntimeError(f"exhausted retries for {path}")
        raise last_exc

    # ------------------------------------------------------------------ endpoints
    async def currencies(self) -> list[dict]:
        return await self._get("/currencies")

    async def currency_snapshot(self, currency_id: str) -> dict:
        return await self._get(f"/currencies/{currency_id}/market-snapshot")

    async def currency_klines(
        self, currency_id: str, interval: str = "1d", limit: int = 100
    ) -> list[dict]:
        return await self._get(
            f"/currencies/{currency_id}/klines",
            params={"interval": interval, "limit": limit},
        )

    async def token_economics(self, currency_id: str) -> dict:
        return await self._get(f"/currencies/{currency_id}/token-economics")

    async def etf_summary_history(
        self, symbol: str = "BTC", country_code: str = "US", limit: int = 30
    ) -> list[dict]:
        return await self._get(
            "/etfs/summary-history",
            params={"symbol": symbol, "country_code": country_code, "limit": limit},
        )

    async def etf_history(self, ticker: str, limit: int = 30) -> list[dict]:
        return await self._get(f"/etfs/{ticker}/history", params={"limit": limit})

    async def btc_treasuries(self) -> list[dict]:
        return await self._get("/btc-treasuries")

    async def btc_purchase_history(self, ticker: str, limit: int = 20) -> list[dict]:
        return await self._get(
            f"/btc-treasuries/{ticker}/purchase-history", params={"limit": limit}
        )

    async def news(
        self,
        category: int | None = None,
        currency_id: str | None = None,
        page_size: int = 50,
    ) -> dict:
        params: dict[str, Any] = {"page_size": page_size}
        if category is not None:
            params["category"] = category
        if currency_id:
            params["currency_id"] = currency_id
        return await self._get("/news", params=params)


# ----------------------------------------------------------------------
# Mock fixtures — deterministic-enough for demos. Seeded per-call by path.
# ----------------------------------------------------------------------
_UNIVERSE = [
    {"currency_id": "btc", "symbol": "BTC", "name": "Bitcoin"},
    {"currency_id": "eth", "symbol": "ETH", "name": "Ethereum"},
    {"currency_id": "sol", "symbol": "SOL", "name": "Solana"},
    {"currency_id": "arb", "symbol": "ARB", "name": "Arbitrum"},
    {"currency_id": "op", "symbol": "OP", "name": "Optimism"},
]


def _seeded(path: str) -> random.Random:
    return random.Random(hash(path) & 0xFFFFFFFF)


def _mock_response(path: str, params: dict[str, Any]) -> Any:
    rng = _seeded(path + str(sorted(params.items())))

    if path == "/currencies":
        return _UNIVERSE

    if path.endswith("/market-snapshot"):
        base = rng.uniform(0.5, 70000)
        return {
            "price": round(base, 2),
            "change_pct_24h": round(rng.uniform(-0.08, 0.08), 4),
            "turnover_24h": round(rng.uniform(1e8, 5e10), 2),
            "marketcap": round(base * rng.uniform(1e7, 2e10), 2),
            "marketcap_rank": rng.randint(1, 100),
            "down_from_ath": round(rng.uniform(-0.8, -0.05), 3),
            "up_from_cycle_low": round(rng.uniform(0.1, 3.0), 3),
        }

    if path.endswith("/klines"):
        limit = int(params.get("limit", 100))
        now = datetime.now(tz=timezone.utc)
        price = rng.uniform(10, 70000)
        out = []
        for i in range(limit):
            ts = int((now - timedelta(days=limit - i)).timestamp() * 1000)
            drift = rng.uniform(-0.04, 0.05)
            price = max(0.01, price * (1 + drift))
            high = price * (1 + abs(rng.uniform(0, 0.03)))
            low = price * (1 - abs(rng.uniform(0, 0.03)))
            out.append(
                {
                    "timestamp": ts,
                    "open": round(price / (1 + drift), 2),
                    "high": round(high, 2),
                    "low": round(low, 2),
                    "close": round(price, 2),
                    "volume": round(rng.uniform(1e6, 5e9), 2),
                }
            )
        return out

    if path.endswith("/token-economics"):
        # Inject a realistic unlock cliff 2-10 days out
        days_out = rng.randint(2, 10)
        unlock_ts = int((datetime.now(tz=timezone.utc) + timedelta(days=days_out)).timestamp() * 1000)
        circ = rng.uniform(1e8, 5e9)
        unlock_amt = circ * rng.uniform(0.005, 0.06)
        return {
            "token_allocation": [
                {"holder": "Community", "percentage": 38},
                {"holder": "Team", "percentage": 18},
                {"holder": "Investors", "percentage": 22},
                {"holder": "Treasury", "percentage": 22},
            ],
            "token_unlock": {
                "unlocked": str(int(circ * 0.6)),
                "total_locked": str(int(circ * 0.4)),
                "circulating_supply": str(int(circ)),
            },
            "unlock_timeline": [
                {
                    "timestamp": str(unlock_ts),
                    "vestings": [
                        {"label": "Team", "amount": unlock_amt * 0.6},
                        {"label": "Investors", "amount": unlock_amt * 0.4},
                    ],
                }
            ],
        }

    if path == "/etfs/summary-history":
        limit = int(params.get("limit", 30))
        now = datetime.now(tz=timezone.utc)
        out = []
        cum = rng.uniform(1e10, 2e10)
        for i in range(limit):
            net = rng.uniform(-3e8, 5e8)
            cum += net
            out.append(
                {
                    "date": (now - timedelta(days=limit - i)).strftime("%Y-%m-%d"),
                    "total_net_inflow": round(net, 2),
                    "total_value_traded": round(rng.uniform(1e9, 5e9), 2),
                    "total_net_assets": round(rng.uniform(5e10, 8e10), 2),
                    "cum_net_inflow": round(cum, 2),
                }
            )
        # Reverse chronological per API contract
        return list(reversed(out))

    if path.startswith("/etfs/") and path.endswith("/history"):
        limit = int(params.get("limit", 30))
        now = datetime.now(tz=timezone.utc)
        return [
            {
                "date": int((now - timedelta(days=i)).timestamp() * 1000),
                "ticker": path.split("/")[2],
                "net_inflow": round(rng.uniform(-5e7, 1.5e8), 2),
                "cum_inflow": round(rng.uniform(1e9, 2e10), 2),
                "net_assets": round(rng.uniform(1e10, 3e10), 2),
                "value_traded": round(rng.uniform(1e8, 1e9), 2),
                "volume": rng.randint(100_000, 5_000_000),
            }
            for i in range(limit)
        ]

    if path == "/btc-treasuries":
        return [
            {"ticker": "MSTR", "name": "MicroStrategy", "list_location": "US"},
            {"ticker": "MARA", "name": "Marathon Digital", "list_location": "US"},
            {"ticker": "RIOT", "name": "Riot Platforms", "list_location": "US"},
            {"ticker": "3350.T", "name": "Metaplanet", "list_location": "JP"},
        ]

    if path.startswith("/btc-treasuries/") and path.endswith("/purchase-history"):
        ticker = path.split("/")[2]
        now = datetime.now(tz=timezone.utc)
        holding = rng.uniform(1_000, 750_000)
        out = []
        for i in range(5):
            acq = rng.uniform(50, 5_000)
            holding += acq
            out.append(
                {
                    "date": (now - timedelta(days=i * 14)).strftime("%Y-%m-%d"),
                    "ticker": ticker,
                    "btc_holding": round(holding, 2),
                    "btc_acq": round(acq, 2),
                    "acq_cost": round(acq * rng.uniform(50_000, 90_000), 2),
                    "avg_btc_cost": round(rng.uniform(50_000, 90_000), 2),
                }
            )
        return out

    if path == "/news":
        items = []
        symbols = ["BTC", "ETH", "SOL", "ARB", "OP"]
        for i in range(int(params.get("page_size", 20))):
            sym = rng.choice(symbols)
            items.append(
                {
                    "id": f"mock-news-{i}",
                    "title": f"{sym} sees {'renewed' if rng.random() > 0.5 else 'cautious'} institutional interest",
                    "release_time": int(
                        (datetime.now(tz=timezone.utc) - timedelta(hours=rng.randint(0, 36))).timestamp()
                        * 1000
                    ),
                    "author": rng.choice(["CoinDeskPro", "LaurenPaulsen", "HFAnalyst", "OnchainWhisper"]),
                    "nick_name": "Verified Desk",
                    "is_blue_verified": rng.choice([1, 1, 1, 0]),
                    "verified_type": rng.choice(["Business", "Business", "Blue"]),
                    "impression_count": rng.randint(1_000, 2_000_000),
                    "like_count": rng.randint(10, 20_000),
                    "matched_currencies": [{"id": sym.lower(), "name": sym, "full_name": sym}],
                    "category": rng.choice([1, 2, 3, 4]),
                    "tags": [sym, "ETF", "MACRO"],
                }
            )
        return {"page": 1, "page_size": len(items), "total": len(items), "list": items}

    raise NotImplementedError(f"Mock fixture not implemented for {path}")


# ----------------------------------------------------------------------
_singleton: SoSoValueClient | None = None


def get_client() -> SoSoValueClient:
    global _singleton
    if _singleton is None:
        _singleton = SoSoValueClient()
    return _singleton
