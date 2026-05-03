# Consilium — A Council of AI Analysts Trading on SoSoValue + SoDEX

> Crypto-native agentic hedge fund. Codebase / Python package still uses the
> internal name `sosofund` for historical reasons; the product identity is
> **Consilium**.

> Research → Insight → Execution, in one agent loop.
> Built for the **SoSoValue Buildathon** ($10k grant pool · AKINDO).

Consilium is a multi-agent AI hedge fund that reads the crypto market through
the **SoSoValue Terminal API**, reasons about it with specialized analyst
agents, and executes through **SoDEX** — SoSoValue's own on-chain DEX — with
a paper-trading fallback for safe development.

Two execution modes ship in Wave 1:

- **Paper** — trades go to a local SQLite ledger. Safe default.
- **SoDEX Testnet** — real EIP-712-signed perps orders posted to
  `testnet-gw.sodex.dev`. Same agent pipeline, same UI, real on-chain fills.

This is a direct answer to the Buildathon brief:
*"the market is no longer about access to information — it's about turning
information into execution."*

## The agents

Each agent is specialized around a different SoSoValue data primitive, so the
fund uses the API *broadly* rather than just one endpoint:

| Agent | Thesis | SoSoValue endpoint |
|---|---|---|
| **ETF Flow** | Institutional demand signal from US spot ETFs (BTC, ETH, SOL, …) | `/etfs/summary-history` |
| **Unlock Risk** | Shorts tokens with imminent >3% circulating-supply unlocks | `/currencies/{id}/token-economics` |
| **KOL Narrative** | Longs tokens amplified by blue-verified Business accounts with >500k impressions in 24h | `/news` (with `matched_currencies`) |

A **Risk Manager** aggregates cross-agent signals (opposing directions cancel,
gross exposure capped), a **Portfolio Manager** sizes trades, and a
**Paper Executor** logs everything to a local SQLite ledger. The full flow
runs through LangGraph.

## Architecture

```
     ┌─────────────────────────────┐     ┌───────────────────────────────┐
     │     SoSoValue Terminal      │     │           SoDEX               │
     │  ETF flows · unlocks · news │     │  perps klines · tickers       │
     └─────────────────────────────┘     └───────────────────────────────┘
                   │                                   │
          ┌────────┼────────┐                          │
          ▼        ▼        ▼                          │
    ┌─────────┐ ┌───────┐ ┌─────────────┐              │
    │ETF Flow │ │Unlock │ │   KOL       │              │
    │  Agent  │ │ Risk  │ │ Narrative   │              │
    └─────────┘ └───────┘ └─────────────┘              │
          │        │        │                          │
          └────────┼────────┘                          │
                   ▼                                   │
           ┌───────────────┐                           │
           │ Risk Manager  │  position sizing, caps    │
           └───────────────┘                           │
                   ▼                                   │
           ┌───────────────┐                           │
           │  Portfolio    │  → Trade orders           │
           └───────────────┘                           │
                   │                                   │
                   ▼                                   │
        ┌──────────┴──────────┐                        │
        ▼                     ▼                        │
  ┌───────────┐         ┌───────────────┐              │
  │  Paper    │         │    SoDEX      │◀─ mark px ───┘
  │ Executor  │         │   Executor    │     EIP-712 signed perps orders
  │  SQLite   │         │ testnet/mnet  │     → mainnet-gw.sodex.dev
  └───────────┘         └───────────────┘        (or testnet-gw.sodex.dev)
```

## Quick start

Requires Python 3.11+, Node 20+, `uv` and `pnpm`.

```bash
# 1. Install everything
make install

# 2. In terminal A — start the backend (default: MOCK mode, no API key needed)
make dev-backend

# 3. In terminal B — start the frontend
make dev-frontend

# 4. Open http://localhost:3000 and click "Run Cycle"
```

### Enabling live data and live execution

Edit `backend/.env`:

```bash
# Real SoSoValue data (optional; free tier works, or use mock fallback)
SOSO_API_KEY=<your-key>

# Real SoDEX testnet trades (optional, opt-in per run via UI toggle)
SODEX_NETWORK=testnet
SODEX_EVM_PRIVATE_KEY=<0x...the private key of a testnet wallet>
SODEX_EVM_ADDRESS=<0x...the matching 0x address>
SODEX_PERPS_ACCOUNT_ID=0

# LLM reasoning (optional)
OPENAI_API_KEY=<your-key>
```

Generate a fresh EVM wallet for testnet — **never reuse a mainnet key**.
Fund it from a SoDEX testnet faucet (ask in the Buildathon chat for the link).

## What the demo shows

1. Three live agent panels, each streaming its own signals with
   reasoning and confidence scores.
2. An execution log of every sized trade, colored by side, with the
   contributing agents.
3. A portfolio card showing open net exposure per symbol.
4. A 30-day backtest with equity curve and total return.
5. A status pill making it explicit whether the fund is running on
   **MOCK** fixtures or **LIVE SOSO** data.

## Endpoints consumed (Wave 1)

- `/currencies`
- `/currencies/{id}/market-snapshot`
- `/currencies/{id}/klines`
- `/currencies/{id}/token-economics`
- `/etfs/summary-history`
- `/etfs/{ticker}/history`
- `/btc-treasuries`
- `/btc-treasuries/{ticker}/purchase-history`
- `/news`

## Roadmap — multi-wave milestones

The AKINDO Buildathon rewards continuous progress across waves. Our plan:

| Wave | Scope |
|---|---|
| **1 — shipped** | 3 agents, LangGraph pipeline, SQLite ledger, FastAPI backend, Next.js dashboard, 30-day backtester on SoDEX klines, **EIP-712 signed perps execution on SoDEX testnet**, user-selectable paper / testnet modes. |
| **2** | +4 agents (Macro, mNAV Treasury Discount, Liquidity-Depth, Sector Rotation). Limit orders + TP/SL + leverage management. User-configurable risk limits. |
| **3** | ValueChain tx logging as the immutable audit trail for every decision. Strategy versioning, multi-strategy portfolios. |
| **4** | Public strategy marketplace built on SSI — users can deposit into any public Consilium strategy, auto-rebalanced through SoDEX. |

## Tech stack

- **Backend:** Python 3.11 · FastAPI · LangGraph · httpx · SQLAlchemy · SQLite · Pydantic v2
- **Frontend:** Next.js 14 · Tailwind · Recharts · TypeScript
- **Data:** SoSoValue Terminal API (32 endpoints catalogued, 8 integrated) + SoDEX market data
- **Execution:** Paper ledger + **SoDEX testnet perps (EIP-712 signed)** · ValueChain audit (Wave 3)
- **Signing:** `eth-account` (EIP-712 typed data, 0x01-prefixed typed signatures)

## Project layout

```
sosofund/
├── backend/
│   └── sosofund/
│       ├── client/sosovalue.py      SoSoValue async client (mock + quota-aware fallback)
│       ├── client/resolver.py       Symbol → currency_id cache
│       ├── sodex/client.py          SoDEX REST client (spot + perps, testnet + mainnet)
│       ├── sodex/signer.py          EIP-712 typed-data signer
│       ├── sodex/executor.py        Perps testnet executor (market orders, safety caps)
│       ├── agents/                  ETF Flow · Unlock Risk · KOL Narrative
│       ├── graph/                   LangGraph pipeline · RiskMgr · PortfolioMgr · mode switch
│       ├── execution/               Paper executor · SQLite ledger
│       ├── backtest/                30-day replay on SoDEX perps klines
│       └── api/                     FastAPI routes with mode-aware /run
└── frontend/
    ├── app/page.tsx                 Dashboard with Paper / SoDEX toggle
    └── components/                  AgentPanel · DecisionLog · PortfolioCard · PnLChart · ModeToggle
```

## License

MIT
