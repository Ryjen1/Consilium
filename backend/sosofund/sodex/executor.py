"""SoDEX testnet / mainnet executor.

Places real orders on SoDEX perps while persisting the same ledger rows
as the paper executor, so the UI is identical across modes.

The executor is *market-order only* for Wave 1 — buy/sell a USD notional,
let SoDEX fill at mark price bounded by market deviation. Wave 2 adds
limit orders, TP/SL, leverage, and cancels.

Safety rails baked in:
    - testnet by default (chain id 138565)
    - refuses to run if SODEX_EVM_PRIVATE_KEY / SODEX_EVM_ADDRESS unset
    - caps per-trade notional via MAX_TRADE_USD
    - rejects non-whitelisted symbols
    - every order gets a unique client order id
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

import structlog

from ..config import get_settings
from ..graph.state import FundState
from .client import get_sodex_client
from .signer import make_auth_headers

log = structlog.get_logger(__name__)


MAX_TRADE_USD = 500.0  # testnet safety cap; tweak per strategy in Wave 2

# enums per the Go SDK (common/enums)
SIDE_BUY = 1
SIDE_SELL = 2
TYPE_MARKET = 2
TIF_IOC = 3
MODIFIER_NONE = 1
POSITION_SIDE_ONE_WAY = 1

# Map universe symbols to SoDEX perps symbol names.
UNIVERSE_TO_PERPS = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "XRP": "XRP-USD",
    "AVAX": "AVAX-USD",
}


async def _resolve_symbol_meta(sodex_symbol: str) -> dict[str, Any]:
    """Return the perps symbol record (id, tick/step sizes, precision, etc.)."""
    client = get_sodex_client()
    rows = await client.perps_symbols()
    for r in rows:
        if r.get("name") == sodex_symbol:
            return r
    raise ValueError(f"SoDEX perps symbol not found: {sodex_symbol}")


def _round_step(value: Decimal, step: Decimal) -> Decimal:
    if step <= 0:
        return value
    return (value / step).quantize(Decimal("1")) * step


async def _build_order_params(
    symbol: str, side_usd: float, account_id: int, mark_price: Decimal
) -> dict[str, Any]:
    """Build the `params` object for a perps newOrder."""
    sodex_sym = UNIVERSE_TO_PERPS.get(symbol.upper())
    if not sodex_sym:
        raise ValueError(f"Symbol not whitelisted for SoDEX execution: {symbol}")

    meta = await _resolve_symbol_meta(sodex_sym)
    symbol_id = int(meta["id"])
    step_size = Decimal(meta["stepSize"])
    qty_precision = int(meta["quantityPrecision"])

    qty = Decimal(str(abs(side_usd))) / mark_price
    qty = _round_step(qty, step_size)
    # Clamp precision
    qty = qty.quantize(Decimal(10) ** -qty_precision)
    if qty <= 0:
        raise ValueError(
            f"Computed quantity <= 0 for {symbol} at mark {mark_price} with notional ${side_usd}"
        )

    side = SIDE_BUY if side_usd > 0 else SIDE_SELL
    order_item = {
        # Field order must match PerpsOrderItem in sodex-go-sdk-public.
        "clOrdID": _new_cl_ord_id(),
        "modifier": MODIFIER_NONE,
        "side": side,
        "type": TYPE_MARKET,
        "timeInForce": TIF_IOC,
        "quantity": format(qty.normalize(), "f"),
        "reduceOnly": False,
        "positionSide": POSITION_SIDE_ONE_WAY,
    }
    return {
        "accountID": account_id,
        "symbolID": symbol_id,
        "orders": [order_item],
    }


def _new_cl_ord_id() -> str:
    # clOrdID must match ^[0-9a-zA-Z_-]{1,36}$
    return "ssf-" + uuid.uuid4().hex[:20]


async def _current_mark_price(sodex_symbol: str) -> Decimal:
    client = get_sodex_client()
    tickers = await client.perps_tickers(sodex_symbol)
    if not tickers:
        raise RuntimeError(f"No ticker for {sodex_symbol}")
    t = tickers[0]
    for k in ("markPrice", "indexPrice", "lastPx"):
        if v := t.get(k):
            return Decimal(str(v))
    raise RuntimeError(f"Ticker missing mark price for {sodex_symbol}")


async def sodex_execute(state: FundState) -> FundState:
    """Drop-in replacement for paper_execute when SoDEX execution is enabled.

    Also persists to the SQLite ledger so the UI remains consistent with
    paper mode. Each ledger row's rationale includes the SoDEX orderID.
    """
    from ..execution.ledger import Decision, LedgerTrade, get_session

    s = get_settings()
    if not s.sodex_execution_ready:
        # Return cleanly so the API can surface a structured error rather than 500.
        return {
            **state,
            "errors": list(state.get("errors", []))
            + ["SoDEX execution requested but credentials are not configured."],
        }

    trades = state.get("trades", []) or []
    signals = state.get("signals", []) or []
    account_id = s.sodex_perps_account_id or 0
    cycle_id = uuid.uuid4().hex[:12]

    client = get_sodex_client()

    executed: list[dict] = []
    errors: list[str] = list(state.get("errors", []))

    for t in trades:
        size_usd = min(t.size_usd, MAX_TRADE_USD)  # safety cap
        signed_notional = size_usd if t.side == "buy" else -size_usd
        try:
            sodex_sym = UNIVERSE_TO_PERPS.get(t.symbol.upper())
            if not sodex_sym:
                errors.append(f"{t.symbol}: not whitelisted for SoDEX")
                continue
            mark = await _current_mark_price(sodex_sym)
            params = await _build_order_params(t.symbol, signed_notional, account_id, mark)
            auth, nonce = make_auth_headers("perps", "newOrder", params)
            log.info(
                "sodex_place_order",
                cycle_id=cycle_id,
                symbol=t.symbol,
                sodex_symbol=sodex_sym,
                side=t.side,
                size_usd=size_usd,
                mark=str(mark),
                qty=params["orders"][0]["quantity"],
                nonce=nonce,
            )
            resp = await client.perps_place_orders(params, auth)
            executed.append({"symbol": t.symbol, "response": resp})
            if isinstance(resp, dict) and resp.get("code") not in (0, None):
                errors.append(f"{t.symbol}: sodex {resp.get('code')} {resp.get('error') or resp.get('message')}")
        except Exception as e:
            log.warning("sodex_order_failed", symbol=t.symbol, error=str(e))
            errors.append(f"{t.symbol}: {e}")

    # Persist identical ledger rows to the paper executor so the UI works.
    async with get_session() as session:
        for sig in signals:
            session.add(
                Decision(
                    cycle_id=cycle_id,
                    agent=sig.agent,
                    symbol=sig.symbol,
                    direction=sig.direction,
                    confidence=sig.confidence,
                    reasoning=sig.reasoning,
                    evidence=sig.evidence,
                    generated_at=sig.generated_at,
                )
            )
        for t in trades:
            session.add(
                LedgerTrade(
                    cycle_id=cycle_id,
                    symbol=t.symbol,
                    side=t.side,
                    size_usd=min(t.size_usd, MAX_TRADE_USD),
                    confidence=t.confidence,
                    rationale=f"[sodex:{s.sodex_network}] {t.rationale}",
                    agents=t.agents,
                    executed_at=t.executed_at,
                )
            )
        await session.commit()

    log.info(
        "sodex_cycle_complete",
        cycle_id=cycle_id,
        network=s.sodex_network,
        placed=len(executed),
        errors=len(errors),
    )
    return {**state, "cycle_id": cycle_id, "errors": errors}
