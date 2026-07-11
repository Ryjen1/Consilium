<p align="center">
  <img src="assets/logo-wordmark.svg" width="320" alt="Consilium" />
</p>

<h3 align="center">
  <b>6 AI agents. Confidence-weighted consensus. Real on-chain execution.</b><br/>
  <span style="color:#8b6cff">Every cycle. On SoDEX. In 3 seconds.</span>
</h3>

<p align="center">
  <sub><b>Consilium</b> — The world's first multi-agent AI hedge fund on SoSoValue + SoDEX</sub>
</p>

<p align="center">
  <a href="https://consilium-sodex.vercel.app"><strong>Live Demo</strong></a> ·
  <a href="https://consilium-api-s9gw.onrender.com/api/health"><strong>API Health</strong></a> ·
  <a href="https://github.com/Ryjen1/Consilium"><strong>Source</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/agents-6-purple" alt="6 agents"/>
  <img src="https://img.shields.io/badge/execution-live-green" alt="Live execution"/>
  <img src="https://img.shields.io/badge/SoDEX-testnet-blue" alt="SoDEX testnet"/>
  <img src="https://img.shields.io/badge/tests-16%2F16%20passing-brightgreen" alt="Tests passing"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="MIT License"/>
</p>

---

## What is Consilium?

**Consilium is a council of 6 AI specialists that read the crypto market through SoSoValue Terminal, debate each other's signals, and execute sized trades on SoDEX — all in one 3-second loop.**

This isn't another "AI recommends a trade" bot. This is **opinion aggregation at scale** — six independent analysts, each with their own data source and thesis, vote on what to do. The ones that agree get bigger positions. The ones that disagree cancel each other out. The result is a single, sized, auditable trade.

> *"The market is no longer about access to information — it's about turning information into execution."*
> — SoSoValue Buildathon brief

**Consilium is the answer.**

---

## The 6 Agents

Each agent reads a different SoSoValue data primitive. They don't see each other's output. They vote independently. The Risk Manager arbitrates.

| Agent | What it reads | What it does |
|---|---|---|
| **ETF Flow** | `/etfs/summary-history` | Longs BTC/ETH when US spot ETF inflows exceed $500M in 3 days. Shorts on persistent outflow. |
| **Unlock Risk** | `/currencies/{id}/market-snapshot` | Shorts tokens with >40% supply still locked — the cliff is coming. |
| **KOL Narrative** | `/news` | Longs tokens trending across blue-verified Business accounts with real engagement. |
| **Macro** | `/macro/events` | Positions ahead of CPI/NFP based on actual-vs-forecast residuals. |
| **Liquidity Depth** | `/currencies/{id}/pairs` | Flags asymmetric orderbook depth — cheap to dump, expensive to pump = short. |
| **Sector Rotation** | `/currencies/sector-spotlight` | Rotates into today's hottest sector (DeFi, L1, AI, Meme). |

**Every signal is typed, timestamped, and auditable.** You can trace exactly why a trade happened, which agents agreed, and how confident they were.

---

## The Consilium Cycle

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     CONSUMERS OF CONSENSUS                      │
 │                                                                  │
 │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
 │  │   ETF   │ │ Unlock  │ │   KOL   │ │  Macro  │ │ Sector  │  │
 │  │  Flow   │ │  Risk   │ │Narrative│ │         │ │Rotation │  │
 │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
 │       │           │           │            │           │         │
 │       └───────────┴───────────┴────────────┴───────────┘         │
 │                              │                                    │
 │                    ┌─────────▼─────────┐                         │
 │                    │   RISK MANAGER    │                         │
 │                    │ confidence-weighted│                         │
 │                    │  voting + caps    │                         │
 │                    └─────────┬─────────┘                         │
 │                              │                                    │
 │                    ┌─────────▼─────────┐                         │
 │                    │ PORTFOLIO MANAGER │                         │
 │                    │  sized trades     │                         │
 │                    └─────────┬─────────┘                         │
 │                              │                                    │
 │               ┌──────────────┴──────────────┐                    │
 │               ▼                             ▼                    │
 │     ┌─────────────────┐          ┌─────────────────┐            │
 │     │  PAPER LEDGER   │          │  SoDEX TESTNET  │            │
 │     │    (SQLite)     │          │  EIP-712 signed  │            │
 │     └─────────────────┘          └─────────────────┘            │
 │                                                                  │
 └──────────────────────────────────────────────────────────────────┘
```

**One click. Three seconds. Fully auditable.**

---

## Live Execution on SoDEX

This isn't paper trading theater. Consilium places **real EIP-712 signed perps orders** on SoDEX testnet:

- **EIP-712 typed-data signing** — `0x01`-prefixed 66-byte signatures matching SoDEX's Go SDK format
- **Limit+IOC orders** quoted at bid/ask for guaranteed fills
- **$500 per-trade safety cap** on testnet
- **Symbol whitelist** — only whitelisted perps pairs
- **Live balance tracking** — see your vUSDC balance and open positions in the UI
- **Browser confirm dialog** before any on-chain submission

Switch between **Paper** (SQLite ledger) and **SoDEX Testnet** (real fills) with one toggle.

---

## What the Demo Shows

1. **6 agent panels** streaming live signals with reasoning and confidence scores
2. **Decision panel** showing the full vote ledger — who agreed, who dissented, why
3. **Pipeline visualization** with per-step status (Agents → Risk → Portfolio → Executor)
4. **Execution log** of every trade, color-coded by side, with contributing agents
5. **Portfolio card** showing open net exposure per symbol
6. **30-day backtest** with equity curve on real SoDEX klines
7. **Signal outcome tracker** classifying past signals as HIT / STOP / DRIFT
8. **SoDEX balance card** with live collateral and open positions
9. **Sector intelligence** showing top-performing crypto sectors
10. **Risk controls** — adjust per-name cap, gross cap, and consensus weights from the UI
11. **Configurable book size** — test with $100 or $1M
12. **Live market ticker** with real-time SoDEX prices

---

## Quick Start

**Requires:** Python 3.11+, Node 20+, `uv`, `pnpm`

```bash
# Install everything
make install

# Start backend (terminal A)
make dev-backend

# Start frontend (terminal B)
make dev-frontend

# Open http://localhost:3000 → Click "Run Cycle" → Watch 6 agents debate
```

### Going Live

Edit `backend/.env`:

```bash
# SoSoValue API key (free tier works, builder tier recommended)
SOSO_API_KEY=<your-key>

# SoDEX testnet execution (optional — leave blank for paper mode)
SODEX_NETWORK=testnet
SODEX_EVM_PRIVATE_KEY=<0x...fresh testnet wallet>
SODEX_EVM_ADDRESS=<0x...matching address>
SODEX_PERPS_ACCOUNT_ID=0
```

**Generate a fresh EVM wallet for testnet. Never reuse a mainnet key.**

---

## SoSoValue Integration

Consilium uses **10+ SoSoValue Terminal endpoints** across its 6 agents:

| Endpoint | Used by |
|---|---|
| `/currencies` | Symbol → currency_id resolver |
| `/currencies/{id}/market-snapshot` | Unlock Risk agent |
| `/currencies/{id}/klines` | Agent context |
| `/currencies/{id}/pairs` | Liquidity Depth agent |
| `/currencies/sector-spotlight` | Sector Rotation agent |
| `/etfs/summary-history` | ETF Flow agent |
| `/macro/events` | Macro agent |
| `/macro/events/{name}/history` | Macro agent |
| `/news` | KOL Narrative agent |

**SoSoValue is not just a data source — it's the nervous system of Consilium.** Every agent reads a different endpoint, and the combined signal covers ETF flows, token unlocks, social momentum, macro events, liquidity, and sector rotation.

---

## SoDEX Integration

| Feature | Status |
|---|---|
| Public market data (tickers, klines, orderbook) | **Live** — unsigned, high-quota |
| EIP-712 typed-data signing | **Verified** — 0x01-prefixed, correct domain |
| Perps order placement | **Live** — Limit+IOC at bid/ask |
| Account state / positions | **Live** — balance card in UI |
| Order cancellation | **Backend ready** — UI button pending |
| Spot market | **Integrated** — SOSO ticker on landing page |

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Backend** | Python 3.11 · FastAPI · LangGraph · httpx · SQLAlchemy · Pydantic v2 |
| **Frontend** | Next.js 14 · Tailwind · Recharts · TypeScript |
| **Data** | SoSoValue Terminal (10+ endpoints) + SoDEX market data |
| **Execution** | Paper ledger (SQLite) + SoDEX testnet (EIP-712 signed perps) |
| **Signing** | `eth-account` — EIP-712 typed data, `0x01`-prefixed signatures |
| **Tests** | pytest · pytest-asyncio (16 unit tests, all passing) |
| **Deploy** | Docker · Vercel · Render |
| **License** | MIT |

---

## Architecture

```
sosofund/
├── backend/
│   ├── Dockerfile                         Production container
│   ├── tests/                             16 unit tests
│   └── sosofund/
│       ├── client/sosovalue.py            SoSoValue async client (live + mock fallback)
│       ├── client/resolver.py             Symbol → currency_id cache
│       ├── sodex/client.py                SoDEX REST client (spot + perps)
│       ├── sodex/signer.py                EIP-712 typed-data signer
│       ├── sodex/executor.py              Perps testnet executor
│       ├── agents/                        6 specialist agents
│       │   ├── etf_flow.py                ETF Flow
│       │   ├── unlock_risk.py             Unlock Risk
│       │   ├── kol_narrative.py           KOL Narrative
│       │   ├── macro.py                   Macro
│       │   ├── liquidity_depth.py         Liquidity Depth
│       │   └── sector_rotation.py         Sector Rotation
│       ├── graph/                         LangGraph pipeline
│       │   ├── pipeline.py                Agent fan-out → Risk → Portfolio → Execute
│       │   ├── risk_manager.py            Configurable consensus + caps
│       │   └── portfolio_manager.py       Sizing engine
│       ├── execution/                     Paper executor + SQLite ledger
│       ├── backtest/                      30-day replay + outcome tracker
│       └── api/                           FastAPI routes (12 endpoints)
└── frontend/
    ├── app/page.tsx                       Landing page with live market ticker
    ├── app/dapp/page.tsx                  Full dashboard
    └── components/                        15+ production components
```

---

## Roadmap

| Wave | Status | What shipped |
|---|---|---|
| **Wave 1** | **Done** | 3 agents, LangGraph pipeline, paper ledger, backtester, dashboard, EIP-712 signer |
| **Wave 2** | **Done** | SoDEX testnet execution, Macro + KOL agents, balance card, outcome tracker |
| **Wave 3** | **Done** | 6 agents, configurable risk limits, live SoSoValue + SoDEX, tests, Docker |
| **Post-Buildathon** | Planned | Strategy marketplace on SSI, public strategies, auto-rebalancing |

---

## Built for the SoSoValue Buildathon

**Category:** Opinion aggregation for on-chain trading

**What we built:** A multi-agent AI hedge fund that reads 10+ SoSoValue endpoints, runs 6 specialist agents in parallel, arbitrates their signals through confidence-weighted voting, and executes sized trades on SoDEX via EIP-712 signed perps orders — all in one 3-second loop.

**Why it wins:**
- **6 SoSoValue endpoints** actively used (not just one API call)
- **Real on-chain execution** (not just signals)
- **Full auditability** — every decision traceable to agent reasoning
- **Configurable risk** — users control the fund's parameters
- **Production-ready** — tests, Docker, live deployment

---

<p align="center">
  <b>Consilium</b> — Where AI meets on-chain execution.<br/>
  <sub>Research → Insight → Execution. One cycle. Three seconds. Every time.</sub>
</p>
