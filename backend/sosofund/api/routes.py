"""HTTP routes consumed by the Next.js frontend."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import desc, select

from ..agents import AGENTS
from ..backtest import backtest
from ..client import get_client
from ..config import get_settings
from ..execution.ledger import Decision, LedgerTrade, get_session
from ..graph import run_cycle

router = APIRouter(prefix="/api")


class RunRequest(BaseModel):
    universe: list[str] | None = None
    portfolio_value_usd: float = 100_000.0


class BacktestRequest(BaseModel):
    universe: list[str] | None = None
    days: int = 30
    starting_capital: float = 100_000.0


@router.get("/health")
async def health() -> dict:
    s = get_settings()
    c = get_client()
    return {
        "status": "ok",
        "mock_mode": s.mock_mode,
        "llm_enabled": s.llm_enabled,
        "soso_quota_exhausted": c.quota_exhausted,
        "sodex": {
            "network": s.sodex_network,
            "market_data": "live",  # always on, no key required
            "execution_ready": s.sodex_execution_ready,
        },
        "agents": [{"name": a.name, "description": a.description} for a in AGENTS],
    }


@router.post("/run")
async def run(req: RunRequest) -> dict[str, Any]:
    final = await run_cycle(universe=req.universe, portfolio_value_usd=req.portfolio_value_usd)
    return {
        "cycle_id": final.get("cycle_id"),
        "universe": final.get("universe"),
        "signals": [s.model_dump(mode="json") for s in final.get("signals", [])],
        "sized_positions": final.get("sized_positions", {}),
        "trades": [t.model_dump(mode="json") for t in final.get("trades", [])],
        "errors": final.get("errors", []),
    }


@router.get("/decisions")
async def decisions(limit: int = 50) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(Decision).order_by(desc(Decision.generated_at)).limit(limit)
        )
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "cycle_id": r.cycle_id,
                "agent": r.agent,
                "symbol": r.symbol,
                "direction": r.direction,
                "confidence": r.confidence,
                "reasoning": r.reasoning,
                "evidence": r.evidence,
                "generated_at": r.generated_at.isoformat(),
            }
            for r in rows
        ]


@router.get("/trades")
async def trades(limit: int = 50) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(LedgerTrade).order_by(desc(LedgerTrade.executed_at)).limit(limit)
        )
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "cycle_id": r.cycle_id,
                "symbol": r.symbol,
                "side": r.side,
                "size_usd": r.size_usd,
                "confidence": r.confidence,
                "rationale": r.rationale,
                "agents": r.agents,
                "executed_at": r.executed_at.isoformat(),
            }
            for r in rows
        ]


@router.get("/portfolio")
async def portfolio() -> dict:
    """Aggregate open net exposure by symbol (naive: sum buys − sum sells)."""
    async with get_session() as session:
        result = await session.execute(select(LedgerTrade))
        rows = result.scalars().all()
    positions: dict[str, float] = {}
    for r in rows:
        delta = r.size_usd if r.side == "buy" else -r.size_usd
        positions[r.symbol] = positions.get(r.symbol, 0.0) + delta
    total_gross = sum(abs(v) for v in positions.values())
    return {
        "positions": [
            {"symbol": k, "net_exposure_usd": round(v, 2)} for k, v in positions.items() if abs(v) > 0.01
        ],
        "gross_exposure_usd": round(total_gross, 2),
        "trade_count": len(rows),
    }


@router.post("/backtest")
async def run_backtest(req: BacktestRequest) -> dict:
    return await backtest(
        universe=req.universe, days=req.days, starting_capital=req.starting_capital
    )
