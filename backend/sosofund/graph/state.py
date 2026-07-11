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


class RiskConfig(BaseModel):
    max_per_name: float = 0.05
    max_gross: float = 1.00
    solo_weight: float = 0.5
    duo_weight: float = 1.0
    super_majority: float = 1.25


class FundState(TypedDict, total=False):
    universe: list[str]
    portfolio_value_usd: float
    signals: list[Signal]
    sized_positions: dict  # {symbol: {"target_weight": float, "direction": str, ...}}
    trades: list[Trade]
    errors: list[str]
    cycle_id: str
    risk_config: dict  # RiskConfig as dict for TypedDict compatibility
