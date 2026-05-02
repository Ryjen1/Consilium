"""End-to-end smoke test: init db -> run cycle -> run backtest -> print summary."""
from __future__ import annotations

import asyncio
import json

from .backtest import backtest
from .execution.ledger import init_db
from .graph import run_cycle


async def main() -> None:
    print("→ Initializing database…")
    await init_db()

    print("→ Running one live agent cycle (mock data)…")
    result = await run_cycle(universe=["BTC", "ETH", "SOL", "ARB", "OP"])
    print(f"  cycle_id: {result.get('cycle_id')}")
    print(f"  signals:  {len(result.get('signals', []))}")
    print(f"  trades:   {len(result.get('trades', []))}")
    print(f"  errors:   {result.get('errors', [])}")
    for t in result.get("trades", []):
        print(
            f"    {t.side.upper():<4} {t.symbol:<5} ${t.size_usd:>10,.0f} "
            f"conf={t.confidence} via {','.join(t.agents)}"
        )

    print("\n→ Running 30-day backtest…")
    bt = await backtest(days=30)
    print(
        f"  ${bt['starting_capital']:,.0f} → ${bt['ending_capital']:,.0f} "
        f"({bt['total_return_pct']:+.2f}%) over {bt['days']} days"
    )
    print(f"  trades sized: {len(bt['trades'])}")
    print("\n✓ Smoke test passed.")


if __name__ == "__main__":
    asyncio.run(main())
