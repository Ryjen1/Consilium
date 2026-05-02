# SoSoFund — Crypto-Native AI Hedge Fund on SoSoValue

> Research → Insight → Execution, in one agent loop.
> Built for the **SoSoValue Buildathon** ($10k grant pool · AKINDO).

SoSoFund is a multi-agent AI hedge fund that reads the crypto market through
the **SoSoValue Terminal API**, reasons about it with specialized analyst
agents, and executes through a paper ledger today — with **SoDEX**
(execution layer) and **ValueChain** (on-chain audit log) as milestones on the
Wave 2–4 roadmap.

It is a direct answer to the Buildathon brief: *"the market is no longer about
access to information — it's about turning information into execution."*

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
         ┌─────────────────────────────────────────────────┐
         │                SoSoValue Terminal               │
         │   ETF flows · token economics · news · klines   │
         └─────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌───────────┐   ┌───────────┐    ┌───────────┐
        │  ETF Flow │   │  Unlock   │    │    KOL    │
        │   Agent   │   │   Risk    │    │ Narrative │
        └───────────┘   └───────────┘    └───────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                       ┌───────────────┐
                       │ Risk Manager  │  position sizing, caps
                       └───────────────┘
                               ▼
                       ┌───────────────┐
                       │   Portfolio   │  → Trade orders
                       └───────────────┘
                               ▼
                       ┌───────────────┐
                       │ Paper Executor│  SQLite ledger
                       │ (Wave 2: SoDEX)│
                       └───────────────┘
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

To use real SoSoValue data, set `SOSO_API_KEY` in `backend/.env`.
An optional `OPENAI_API_KEY` enriches agent reasoning with LLM summaries.

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
| **1 — shipped** | 3 agents, LangGraph pipeline, paper executor, SQLite ledger, FastAPI backend, Next.js dashboard, 30-day backtester. |
| **2** | +4 agents (Macro, mNAV Treasury Discount, Liquidity-Depth, Sector Rotation). SoDEX testnet execution. User-configurable risk limits. |
| **3** | ValueChain tx logging as the immutable audit trail for every decision. Strategy versioning, multi-strategy portfolios. |
| **4** | Public strategy marketplace built on SSI — users can deposit into any public SoSoFund strategy, auto-rebalanced through SoDEX. |

## Tech stack

- **Backend:** Python 3.11 · FastAPI · LangGraph · httpx · SQLAlchemy · SQLite · Pydantic v2
- **Frontend:** Next.js 14 · Tailwind · Recharts · TypeScript
- **Data:** SoSoValue Terminal API (32 endpoints catalogued, 8 integrated in Wave 1)
- **Execution:** Paper ledger today · SoDEX (Wave 2) · ValueChain audit (Wave 3)

## Project layout

```
sosofund/
├── backend/
│   └── sosofund/
│       ├── client/sosovalue.py      SoSoValue async client + mock fixtures
│       ├── agents/                  ETF Flow · Unlock Risk · KOL Narrative
│       ├── graph/                   LangGraph pipeline · RiskMgr · PortfolioMgr
│       ├── execution/               Paper executor · SQLite ledger
│       ├── backtest/                30-day replay on SoSo klines
│       └── api/                     FastAPI routes
└── frontend/
    ├── app/page.tsx                 Dashboard
    └── components/                  AgentPanel · DecisionLog · PortfolioCard · PnLChart
```

## Credits

Architecture inspired by `virattt/ai-hedge-fund` (multi-agent graph + risk
manager + portfolio manager pattern), rebuilt from the ground up for
**crypto-native** data and SoSoValue's ecosystem.

## License

MIT
