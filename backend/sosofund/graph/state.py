"""Shared state flowing through the LangGraph pipeline."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, TypedDict

from pydantic import BaseModel, Field

from ..agents import Signal


class Trade(BaseModel):
    symbol: str
    side: Literal["buy", "sell"]
    size_usd: float
    rationale: str
    agents: list[str]
    confidence: float
    executed_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class FundState(TypedDict, total=False):
    universe: list[str]
    portfolio_value_usd: float
    signals: list[Signal]
    sized_positions: dict  # {symbol: {"target_weight": float, "direction": str, ...}}
    trades: list[Trade]
    errors: list[str]
    cycle_id: str
    # Debug fields set by the SoDEX executor and surfaced by the API.
    # Not used in the pipeline logic — purely diagnostic.
    _sodex_debug: dict
    _debug_sodex_responses: list[dict]
