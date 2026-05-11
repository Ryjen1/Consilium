"""HTTP routes consumed by the Next.js frontend."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import delete, desc, select

from ..agents import AGENTS
from ..backtest import backtest
from ..client import get_client
from ..config import get_settings
from ..execution.ledger import Decision, LedgerTrade, get_session
from ..graph import run_cycle
from ..sodex import get_sodex_client

router = APIRouter(prefix="/api")


def _iso_utc(dt: datetime | None) -> str | None:
    """Serialize a datetime as a timezone-aware ISO-8601 string.

    SQLite strips timezone info on round-trip, so timestamps come back as
    naive datetimes even though we wrote them as UTC. We re-attach UTC on
    the way out so JavaScript's `new Date(...)` parses them correctly
    instead of treating them as local time.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class RunRequest(BaseModel):
    universe: list[str] | None = None
    portfolio_value_usd: float = 100_000.0
    mode: str = "paper"  # "paper" | "sodex_testnet" | "sodex_mainnet"


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
    mode = req.mode if req.mode in ("paper", "sodex_testnet", "sodex_mainnet") else "paper"
    s = get_settings()
    # Guard rails: SoDEX modes require execution credentials.
    if mode.startswith("sodex") and not s.sodex_execution_ready:
        return {
            "cycle_id": None,
            "universe": req.universe,
            "signals": [],
            "sized_positions": {},
            "trades": [],
            "errors": [
                "SoDEX execution requested but SODEX_EVM_PRIVATE_KEY / SODEX_EVM_ADDRESS not configured."
            ],
        }
    final = await run_cycle(
        universe=req.universe,
        portfolio_value_usd=req.portfolio_value_usd,
        mode=mode,  # type: ignore[arg-type]
    )
    return {
        "cycle_id": final.get("cycle_id"),
        "mode": mode,
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
                "generated_at": _iso_utc(r.generated_at),
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
                "executed_at": _iso_utc(r.executed_at),
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


@router.get("/sodex/tickers")
async def sodex_tickers() -> list[dict]:
    """Live SoDEX perps tickers for the ticker strip on the landing/dapp.

    Proxies through the backend so the frontend doesn't hit CORS on
    testnet-gw.sodex.dev directly.
    """
    want = {"BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "AVAX-USD", "DOGE-USD"}
    try:
        rows = await get_sodex_client().perps_tickers()
    except Exception:
        return []
    out: list[dict] = []
    for r in rows:
        sym = r.get("symbol")
        if sym not in want:
            continue
        try:
            out.append(
                {
                    "symbol": sym,
                    "last_price": float(r.get("lastPx") or 0),
                    "change_pct_24h": float(r.get("changePct") or 0),
                    "mark_price": float(r.get("markPrice") or 0),
                    "volume_24h": float(r.get("quoteVolume") or 0),
                }
            )
        except (TypeError, ValueError):
            continue
    # Preserve want order
    order = {s: i for i, s in enumerate(["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "AVAX-USD", "DOGE-USD"])}
    out.sort(key=lambda x: order.get(x["symbol"], 99))
    return out


@router.get("/markets")
async def markets() -> list[dict]:
    """Live market tickers via SoDEX (unsigned, high-quota).

    Aggregates two venues so the SoSoValue-ecosystem token shows up next
    to the rest of the market:
      - perps for BTC, ETH, SOL, XRP, AVAX, DOGE
      - spot  for SOSO (no perps market exists yet for this token)
    """
    from ..sodex import get_sodex_client

    client = get_sodex_client()

    # (display_symbol, sodex_symbol, market_type)
    # SOSO sits in the third slot, right after BTC and ETH, so the
    # SoSoValue ecosystem token is visible without scrolling the ticker.
    requests: list[tuple[str, str, str]] = [
        ("BTC", "BTC-USD", "perps"),
        ("ETH", "ETH-USD", "perps"),
        ("SOSO", "WSOSO_vUSDC", "spot"),
        ("SOL", "SOL-USD", "perps"),
        ("XRP", "XRP-USD", "perps"),
        ("AVAX", "AVAX-USD", "perps"),
        ("DOGE", "DOGE-USD", "perps"),
    ]
    out: list[dict] = []
    for display, sodex_sym, market in requests:
        try:
            rows = (
                await client.perps_tickers(sodex_sym)
                if market == "perps"
                else await client.spot_tickers(sodex_sym)
            )
            if not rows:
                continue
            t = rows[0]
            last = float(t.get("lastPx") or 0)
            # SoDEX returns changePct already as a percentage (0.59 = 0.59%).
            change_pct = float(t.get("changePct") or 0)
            # Thin testnet books can produce absurd 24h moves on a single fill.
            if change_pct > 100 or change_pct < -100:
                change_pct = max(-100.0, min(100.0, change_pct))
            out.append(
                {
                    "symbol": display,
                    "full_symbol": sodex_sym,
                    "market_type": market,
                    "price": last,
                    "change_pct_24h": change_pct,
                    # Mark price is a perps-only concept; spot tickers don't
                    # carry it. Default to last price for spot rows.
                    "mark_price": float(t.get("markPrice") or last or 0),
                    "bid": float(t.get("bidPx") or 0),
                    "ask": float(t.get("askPx") or 0),
                }
            )
        except Exception:
            continue
    return out


@router.post("/reset")
async def reset_ledger() -> dict:
    """Wipe the local paper-trading ledger. Handy for demos."""
    async with get_session() as session:
        await session.execute(delete(LedgerTrade))
        await session.execute(delete(Decision))
        await session.commit()
    return {"status": "ok", "cleared": True}
