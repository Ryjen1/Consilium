"""Agent base types. Each agent emits Signals that the RiskManager aggregates."""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

Direction = Literal["long", "short", "flat"]


class Signal(BaseModel):
    agent: str
    symbol: str
    direction: Direction
    confidence: float = Field(ge=0, le=1)
    reasoning: str
    evidence: dict = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Agent(ABC):
    """Agents are stateless. They read from the SoSoValue client and emit Signals."""

    name: str = "base"
    description: str = ""

    @abstractmethod
    async def run(self, universe: list[str]) -> list[Signal]:
        """Return zero or more signals for the given symbol universe."""
