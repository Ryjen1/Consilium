"""Tests for the risk manager."""
import asyncio
import pytest
from sosofund.agents.base import Signal
from sosofund.graph.risk_manager import risk_manager
from sosofund.graph.state import FundState


def _make_signal(agent: str, symbol: str, direction: str, confidence: float) -> Signal:
    return Signal(
        agent=agent,
        symbol=symbol,
        direction=direction,
        confidence=confidence,
        reasoning="test",
        evidence={},
    )


def _base_state(signals: list[Signal]) -> FundState:
    return {
        "universe": ["BTC"],
        "portfolio_value_usd": 100_000,
        "signals": signals,
        "sized_positions": {},
        "trades": [],
        "errors": [],
    }


@pytest.mark.asyncio
async def test_single_long_signal():
    sigs = [_make_signal("ETF Flow", "BTC", "long", 0.8)]
    result = await risk_manager(_base_state(sigs))
    pos = result["sized_positions"]
    assert "BTC" in pos
    assert pos["BTC"]["direction"] == "long"
    assert pos["BTC"]["consensus"] == "solo"


@pytest.mark.asyncio
async def test_opposing_signals_cancel():
    sigs = [
        _make_signal("ETF Flow", "BTC", "long", 0.8),
        _make_signal("Unlock Risk", "BTC", "short", 0.8),
    ]
    result = await risk_manager(_base_state(sigs))
    pos = result["sized_positions"]
    # With equal confidence opposing, net should be near zero or small
    if "BTC" in pos:
        assert abs(pos["BTC"]["target_weight"]) < 0.01


@pytest.mark.asyncio
async def test_consensus_boost():
    sigs = [
        _make_signal("Agent1", "BTC", "long", 0.8),
        _make_signal("Agent2", "BTC", "long", 0.8),
    ]
    result = await risk_manager(_base_state(sigs))
    pos = result["sized_positions"]
    assert pos["BTC"]["consensus"] == "duo"


@pytest.mark.asyncio
async def test_super_majority():
    sigs = [
        _make_signal("Agent1", "BTC", "long", 0.8),
        _make_signal("Agent2", "BTC", "long", 0.8),
        _make_signal("Agent3", "BTC", "long", 0.8),
    ]
    result = await risk_manager(_base_state(sigs))
    pos = result["sized_positions"]
    assert pos["BTC"]["consensus"] == "super_majority"


@pytest.mark.asyncio
async def test_per_name_cap():
    sigs = [_make_signal("Agent1", "BTC", "long", 1.0)]
    result = await risk_manager(_base_state(sigs))
    pos = result["sized_positions"]
    # Solo at 50% of 5% cap = 2.5%
    assert abs(pos["BTC"]["target_weight"]) <= 0.05


@pytest.mark.asyncio
async def test_custom_risk_config():
    sigs = [_make_signal("Agent1", "BTC", "long", 1.0)]
    state = _base_state(sigs)
    state["risk_config"] = {"max_per_name": 0.10, "solo_weight": 0.75}
    result = await risk_manager(state)
    pos = result["sized_positions"]
    # Solo at 75% of 10% cap = 7.5%
    assert abs(pos["BTC"]["target_weight"]) <= 0.10
    assert abs(pos["BTC"]["target_weight"]) > 0.05


@pytest.mark.asyncio
async def test_no_signals():
    result = await risk_manager(_base_state([]))
    assert result["sized_positions"] == {}
