"""Symbol <-> currency_id resolver.

SoSoValue uses long numeric IDs like "1673723677362319867" for currencies,
while agents work with human symbols like "BTC". This module caches the
/currencies mapping in memory so every agent run doesn't re-fetch it.
"""
from __future__ import annotations

import asyncio

from .sosovalue import SoSoValueClient, get_client

_cache: dict[str, str] | None = None
_lock = asyncio.Lock()


async def symbol_to_id(symbol: str, client: SoSoValueClient | None = None) -> str | None:
    """Return the SoSoValue currency_id for a given symbol (case-insensitive)."""
    mapping = await get_mapping(client)
    return mapping.get(symbol.upper())


async def get_mapping(client: SoSoValueClient | None = None) -> dict[str, str]:
    """Return the full symbol -> currency_id map, fetched once per process."""
    global _cache
    if _cache is not None:
        return _cache
    async with _lock:
        if _cache is not None:
            return _cache
        c = client or get_client()
        rows = await c.currencies()
        _cache = {
            str(r.get("symbol", "")).upper(): str(r.get("currency_id", ""))
            for r in rows
            if r.get("symbol") and r.get("currency_id")
        }
    return _cache


def clear_cache() -> None:
    """Test hook."""
    global _cache
    _cache = None
