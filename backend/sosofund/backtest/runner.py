"""Very simple backtester for Wave 1.

Replays the agent pipeline over the last N days of klines.
Each day we:
    - snapshot "today" context (mocked slice of historical data)
    - run agents -> trades
    - mark-to-market using next-day close
    - track cumulative PnL

This is deliberately lightweight; Wave 2 swaps it for proper event-driven replay.
"""
from __future__ import annotations

from datetime import datetime, timezone

from ..agents import AGENTS
from ..graph.portfolio_manager import portfolio_manager
from ..graph.risk_manager import risk_manager
from ..graph.state import FundState
from ..sodex import get_sodex_client


# Map SoSoFund universe symbols to SoDEX markets.
# Most majors are perps; SOSO only has a spot market today, so it routes
# through the spot kline endpoint instead.
_SODEX_PERPS_SYMBOL = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "XRP": "XRP-USD",
    "AVAX": "AVAX-USD",
    "ADA": "ADA-USD",
    "LINK": "LINK-USD",
    "BNB": "BNB-USD",
    "DOGE": "DOGE-USD",
    "SUI": "SUI-USD",
    "AAVE": "AAVE-USD",
    "UNI": "UNI-USD",
    "HYPE": "HYPE-USD",
    "LTC": "LTC-USD",
    "ZEC": "ZEC-USD",
    "ENA": "ENA-USD",
    "ONDO": "ONDO-USD",
    "WLD": "WLD-USD",
    "WLFI": "WLFI-USD",
    "PENGU": "PENGU-USD",
    "TON": "TON-USD",
    "SHIB": "1000SHIB-USD",
    "PEPE": "1000PEPE-USD",
    "XAUT": "XAUT-USD",
}
_SODEX_SPOT_SYMBOL = {
    "SOSO": "WSOSO_vUSDC",
}


async def _price_series(symbol: str, limit: int = 60) -> list[tuple[int, float]]:
    """Daily close series for a universe symbol via the appropriate SoDEX market.

    Routes through perps for the major USD pairs and through spot for tokens
    that only have a spot market on SoDEX testnet (currently just SOSO). Both
    paths are unsigned and high-quota, so this never costs a SoSoValue call.
    """
    upper = symbol.upper()
    client = get_sodex_client()
    if upper in _SODEX_PERPS_SYMBOL:
        rows = await client.perps_klines(
            _SODEX_PERPS_SYMBOL[upper], interval="1D", limit=limit
        )
    elif upper in _SODEX_SPOT_SYMBOL:
        rows = await client.spot_klines(
            _SODEX_SPOT_SYMBOL[upper], interval="1D", limit=limit
        )
    else:
        return []

    out: list[tuple[int, float]] = []
    for r in rows:
        try:
            out.append((int(r["t"]), float(r["c"])))
        except (KeyError, ValueError, TypeError):
            continue
    return sorted(out, key=lambda x: x[0])


async def backtest(
    universe: list[str] | None = None,
    days: int = 30,
    starting_capital: float = 100_000.0,
) -> dict:
    universe = universe or ["BTC", "ETH", "SOL", "ARB", "OP"]
    series = {s: await _price_series(s, limit=days + 1) for s in universe}

    capital = starting_capital
    equity_curve: list[dict] = []
    trade_log: list[dict] = []

    # Run one "cycle" per day; we don't have snapshot-in-time mocks, so we treat
    # signals as stable but PnL reflects actual kline moves.
    # (Wave 2 will feed agents windowed historical data.)
    import asyncio

    tasks = [a.run(universe) for a in AGENTS]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    signals = [s for r in results if not isinstance(r, Exception) for s in r]

    state: FundState = {
        "universe": universe,
        "portfolio_value_usd": capital,
        "signals": signals,
        "sized_positions": {},
        "trades": [],
        "errors": [],
    }
    state = await risk_manager(state)
    state = await portfolio_manager(state)

    # Walk forward day by day
    n = min(days, *(len(series[s]) - 1 for s in universe if series[s])) if series else 0
    for i in range(n):
        day_pnl = 0.0
        for t in state.get("trades", []):
            ser = series.get(t.symbol, [])
            if i + 1 >= len(ser):
                continue
            p0 = ser[i][1]
            p1 = ser[i + 1][1]
            ret = (p1 - p0) / p0 if p0 else 0
            if t.side == "sell":
                ret = -ret
            day_pnl += t.size_usd * ret
        capital += day_pnl
        equity_curve.append(
            {
                "day": i,
                "equity": round(capital, 2),
                "daily_pnl": round(day_pnl, 2),
            }
        )

    for t in state.get("trades", []):
        trade_log.append(
            {
                "symbol": t.symbol,
                "side": t.side,
                "size_usd": t.size_usd,
                "confidence": t.confidence,
                "agents": t.agents,
            }
        )

    return {
        "starting_capital": starting_capital,
        "ending_capital": round(capital, 2),
        "total_return_pct": round((capital / starting_capital - 1) * 100, 2),
        "days": n,
        "equity_curve": equity_curve,
        "trades": trade_log,
        "ran_at": datetime.now(tz=timezone.utc).isoformat(),
    }
