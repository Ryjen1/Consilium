"""Tests for the portfolio manager."""
import pytest
from sosofund.graph.portfolio_manager import portfolio_manager
from sosofund.graph.state import FundState


def _base_state(sized: dict, portfolio_usd: float = 100_000) -> FundState:
    return {
        "universe": ["BTC"],
        "portfolio_value_usd": portfolio_usd,
        "signals": [],
        "sized_positions": sized,
        "trades": [],
        "errors": [],
    }


@pytest.mark.asyncio
async def test_basic_trade_emission():
    sized = {
        "BTC": {
            "target_weight": 0.025,
            "direction": "long",
            "contributing_agents": ["ETF Flow"],
            "agreeing_agents": ["ETF Flow"],
            "consensus": "solo",
            "avg_confidence": 0.8,
            "reasoning": "test",
        }
    }
    result = await portfolio_manager(_base_state(sized))
    trades = result["trades"]
    assert len(trades) == 1
    assert trades[0].symbol == "BTC"
    assert trades[0].side == "buy"
    assert trades[0].size_usd == 2500.0


@pytest.mark.asyncio
async def test_short_trade():
    sized = {
        "ARB": {
            "target_weight": -0.02,
            "direction": "short",
            "contributing_agents": ["Unlock Risk"],
            "agreeing_agents": ["Unlock Risk"],
            "consensus": "solo",
            "avg_confidence": 0.6,
            "reasoning": "test",
        }
    }
    result = await portfolio_manager(_base_state(sized))
    trades = result["trades"]
    assert len(trades) == 1
    assert trades[0].side == "sell"
    assert trades[0].size_usd == 2000.0


@pytest.mark.asyncio
async def test_small_portfolio_skips_dust():
    sized = {
        "BTC": {
            "target_weight": 0.025,
            "direction": "long",
            "contributing_agents": ["ETF Flow"],
            "agreeing_agents": ["ETF Flow"],
            "consensus": "solo",
            "avg_confidence": 0.8,
            "reasoning": "test",
        }
    }
    # $25 * 0.025 = $0.625 — below $10 minimum
    result = await portfolio_manager(_base_state(sized, portfolio_usd=25))
    assert len(result["trades"]) == 0
    assert any("skipped" in e.lower() for e in result["errors"])


@pytest.mark.asyncio
async def test_no_sized_positions():
    result = await portfolio_manager(_base_state({}))
    assert len(result["trades"]) == 0
