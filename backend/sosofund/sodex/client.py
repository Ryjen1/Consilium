"""SoDEX REST client.

Covers what SoSoFund needs in Wave 1:

Public market data (unsigned, 1200 weight/min per IP):
    - GET /markets/symbols
    - GET /markets/tickers
    - GET /markets/{symbol}/klines
    - GET /markets/{symbol}/orderbook

Signed writes (auth delegated to sodex.executor):
    - POST /trade/orders            (perps: place orders)
    - POST /trade/orders/batch      (spot)
    - DELETE /trade/orders[/batch]  (cancel)

Both mainnet and testnet are supported; testnet is default and safe.
"""
from __future__ import annotations

import asyncio
import time
from typing import Any, Literal

import httpx
import structlog

from ..config import get_settings

log = structlog.get_logger(__name__)

Market = Literal["spot", "perps"]


_ENDPOINTS: dict[tuple[str, Market], str] = {
    ("mainnet", "spot"): "https://mainnet-gw.sodex.dev/api/v1/spot",
    ("mainnet", "perps"): "https://mainnet-gw.sodex.dev/api/v1/perps",
    ("testnet", "spot"): "https://testnet-gw.sodex.dev/api/v1/spot",
    ("testnet", "perps"): "https://testnet-gw.sodex.dev/api/v1/perps",
}


class SodexClient:
    """Async SoDEX client.

    Public GETs are unsigned. Signed writes require the caller to supply
    X-API-Key / X-API-Sign / X-API-Nonce headers (see sodex.signer).
    """

    def __init__(self, network: str = "testnet") -> None:
        self.network = network
        self._http: dict[Market, httpx.AsyncClient] = {}

    # ------------------------------------------------------------------ http
    def base_url(self, market: Market) -> str:
        return _ENDPOINTS[(self.network, market)]

    def _client(self, market: Market) -> httpx.AsyncClient:
        if market not in self._http:
            self._http[market] = httpx.AsyncClient(
                base_url=self.base_url(market),
                headers={"Accept": "application/json"},
                timeout=15.0,
            )
        return self._http[market]

    async def close(self) -> None:
        for c in self._http.values():
            await c.aclose()
        self._http.clear()

    async def _get(self, market: Market, path: str, params: dict[str, Any] | None = None) -> Any:
        c = self._client(market)
        # Simple retry loop for transient hiccups; SoDEX gives us 1200 weight/min
        # per IP so rate limits are unlikely to matter here.
        last_exc: Exception | None = None
        for i in range(3):
            try:
                r = await c.get(path, params=params or {})
                r.raise_for_status()
                payload = r.json()
                if isinstance(payload, dict) and "code" in payload and "data" in payload:
                    return payload.get("data")
                return payload
            except httpx.HTTPError as e:
                last_exc = e
                await asyncio.sleep(0.3 * (2 ** i))
        assert last_exc is not None
        raise last_exc

    async def _post(
        self,
        market: Market,
        path: str,
        body: dict[str, Any],
        auth: dict[str, str],
    ) -> Any:
        """Signed POST. `auth` must provide X-API-Key, X-API-Sign, X-API-Nonce."""
        c = self._client(market)
        r = await c.post(
            path,
            json=body,
            headers={
                "Content-Type": "application/json",
                **auth,
            },
        )
        # Don't raise on non-2xx here — SoDEX returns structured errors with useful codes.
        try:
            payload = r.json()
        except Exception:
            r.raise_for_status()
            raise
        return payload

    async def _delete(
        self,
        market: Market,
        path: str,
        body: dict[str, Any],
        auth: dict[str, str],
    ) -> Any:
        c = self._client(market)
        r = await c.request(
            "DELETE",
            path,
            json=body,
            headers={
                "Content-Type": "application/json",
                **auth,
            },
        )
        try:
            return r.json()
        except Exception:
            r.raise_for_status()
            raise

    # ------------------------------------------------------------------ market data
    async def spot_symbols(self) -> list[dict]:
        return await self._get("spot", "/markets/symbols") or []

    async def perps_symbols(self) -> list[dict]:
        return await self._get("perps", "/markets/symbols") or []

    async def spot_tickers(self, symbol: str | None = None) -> list[dict]:
        params = {"symbol": symbol} if symbol else None
        return await self._get("spot", "/markets/tickers", params) or []

    async def perps_tickers(self, symbol: str | None = None) -> list[dict]:
        params = {"symbol": symbol} if symbol else None
        return await self._get("perps", "/markets/tickers", params) or []

    async def spot_klines(
        self,
        symbol: str,
        interval: str = "1D",
        limit: int = 100,
        start_time: int | None = None,
        end_time: int | None = None,
    ) -> list[dict]:
        params: dict[str, Any] = {"interval": interval, "limit": limit}
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        return await self._get("spot", f"/markets/{symbol}/klines", params) or []

    async def perps_klines(
        self,
        symbol: str,
        interval: str = "1D",
        limit: int = 100,
        start_time: int | None = None,
        end_time: int | None = None,
    ) -> list[dict]:
        params: dict[str, Any] = {"interval": interval, "limit": limit}
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        return await self._get("perps", f"/markets/{symbol}/klines", params) or []

    async def spot_orderbook(self, symbol: str, limit: int = 20) -> dict:
        return await self._get("spot", f"/markets/{symbol}/orderbook", {"limit": limit}) or {}

    async def perps_orderbook(self, symbol: str, limit: int = 20) -> dict:
        return await self._get("perps", f"/markets/{symbol}/orderbook", {"limit": limit}) or {}

    # ------------------------------------------------------------------ signed writes
    async def perps_place_orders(
        self,
        body: dict[str, Any],
        auth: dict[str, str],
    ) -> Any:
        """POST /trade/orders with EIP-712 signature headers."""
        return await self._post("perps", "/trade/orders", body, auth)

    async def perps_cancel_orders(
        self,
        body: dict[str, Any],
        auth: dict[str, str],
    ) -> Any:
        return await self._delete("perps", "/trade/orders", body, auth)

    async def perps_balances(self, user_address: str, account_id: int | None = None) -> dict:
        params = {"accountID": account_id} if account_id else None
        return await self._get("perps", f"/accounts/{user_address}/balances", params) or {}

    async def perps_positions(self, user_address: str, account_id: int | None = None) -> list[dict]:
        params = {"accountID": account_id} if account_id else None
        data = await self._get("perps", f"/accounts/{user_address}/positions", params)
        if isinstance(data, dict):
            return data.get("positions", []) or []
        return data or []


# ----------------------------------------------------------------------
_singleton: SodexClient | None = None


def get_sodex_client() -> SodexClient:
    global _singleton
    if _singleton is None:
        _singleton = SodexClient(network=get_settings().sodex_network)
    return _singleton
