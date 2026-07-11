"""LangGraph assembly for SoSoFund.

Flow:
    parallel( ETFFlow, UnlockRisk, KOLNarrative )  →  RiskManager  →  PortfolioManager  →  Executor

Executor is selectable via `mode`:
    - "paper"         — write trades to SQLite only (default)
    - "sodex_testnet" — place real orders on SoDEX testnet via EIP-712
    - "sodex_mainnet" — same, against mainnet (guarded by explicit opt-in)
"""
from __future__ import annotations

import asyncio
from typing import Literal

import structlog
from langgraph.graph import END, StateGraph

from ..agents import AGENTS
from ..execution.paper import paper_execute
from .portfolio_manager import portfolio_manager
from .risk_manager import risk_manager
from .state import FundState

log = structlog.get_logger(__name__)

ExecutionMode = Literal["paper", "sodex_testnet", "sodex_mainnet"]


async def run_agents(state: FundState) -> FundState:
    """Fan out to all agents in parallel, collect signals."""
    universe = state.get("universe", ["BTC", "ETH", "SOL", "ARB", "OP"])
    tasks = [a.run(universe) for a in AGENTS]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    signals = []
    errors = list(state.get("errors", []))
    for agent, res in zip(AGENTS, results):
        if isinstance(res, Exception):
            errors.append(f"{agent.name}: {res}")
            log.warning("agent_failed", agent=agent.name, error=str(res))
            continue
        signals.extend(res)
    return {**state, "signals": signals, "errors": errors}


def _executor_for(mode: ExecutionMode):
    if mode == "paper":
        return paper_execute
    # Import lazily so paper-mode runs don't pull eth-account etc unnecessarily
    from ..sodex.executor import sodex_execute

    return sodex_execute


def build_graph(mode: ExecutionMode = "paper"):
    graph = StateGraph(FundState)
    graph.add_node("agents", run_agents)
    graph.add_node("risk", risk_manager)
    graph.add_node("portfolio", portfolio_manager)
    graph.add_node("executor", _executor_for(mode))

    graph.set_entry_point("agents")
    graph.add_edge("agents", "risk")
    graph.add_edge("risk", "portfolio")
    graph.add_edge("portfolio", "executor")
    graph.add_edge("executor", END)
    return graph.compile()


async def run_cycle(
    universe: list[str] | None = None,
    portfolio_value_usd: float = 100_000,
    mode: ExecutionMode = "paper",
    risk_config: dict | None = None,
) -> FundState:
    app = build_graph(mode=mode)
    initial: FundState = {
        "universe": universe or ["BTC", "ETH", "SOL", "ARB", "OP"],
        "portfolio_value_usd": portfolio_value_usd,
        "signals": [],
        "sized_positions": {},
        "trades": [],
        "errors": [],
        "risk_config": risk_config or {},
    }
    final = await app.ainvoke(initial)
    return final
