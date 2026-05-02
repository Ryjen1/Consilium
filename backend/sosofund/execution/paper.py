"""PaperExecutor: writes sized trades + contributing signals to SQLite."""
from __future__ import annotations

import uuid

import structlog

from ..graph.state import FundState
from .ledger import Decision, LedgerTrade, get_session

log = structlog.get_logger(__name__)


async def paper_execute(state: FundState) -> FundState:
    cycle_id = uuid.uuid4().hex[:12]
    signals = state.get("signals", [])
    trades = state.get("trades", [])

    async with get_session() as session:
        for s in signals:
            session.add(
                Decision(
                    cycle_id=cycle_id,
                    agent=s.agent,
                    symbol=s.symbol,
                    direction=s.direction,
                    confidence=s.confidence,
                    reasoning=s.reasoning,
                    evidence=s.evidence,
                    generated_at=s.generated_at,
                )
            )
        for t in trades:
            session.add(
                LedgerTrade(
                    cycle_id=cycle_id,
                    symbol=t.symbol,
                    side=t.side,
                    size_usd=t.size_usd,
                    confidence=t.confidence,
                    rationale=t.rationale,
                    agents=t.agents,
                    executed_at=t.executed_at,
                )
            )
        await session.commit()

    log.info("paper_executed", cycle_id=cycle_id, trades=len(trades), signals=len(signals))
    return {**state, "cycle_id": cycle_id}
