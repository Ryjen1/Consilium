# Consilium — AKINDO Buildathon Submission (Wave 3)

> **Tagline:** Six specialist agents. Confidence-weighted consensus. Live on SoDEX, every cycle.
>
> **Category:** Opinion aggregation for on-chain trading.

## Links

- **Live demo:** https://consilium-sodex.vercel.app
- **API:** https://consilium-api-s9gw.onrender.com/api/health
- **Source code:** https://github.com/Ryjen1/Consilium
- **Demo video:** _TODO — record before deadline_

---

## 1. The pitch

**The smartest human traders don't follow one signal. They listen to many, weigh them against each other, and size accordingly. Consilium does that, automated, in three seconds — with six specialist agents.**

Every other "AI trading agent" in this buildathon gives you *one* opaque recommendation. Consilium gives you **six named specialist signals, shows you their disagreement, arbitrates a sized trade from their combined confidence, and executes it on-chain via SoDEX.** Auditability is the product.

### The six agents

| Agent | Data primitive | Thesis |
|---|---|---|
| **ETF Flow** | `/etfs/summary-history` | Longs BTC/ETH when 3-day cumulative US spot-ETF inflow > $500M. Shorts on persistent outflow. |
| **Unlock Risk** | `/currencies/{id}/market-snapshot` | Shorts tokens with high supply overhang (locked/circulating ratio > 40%). |
| **KOL Narrative** | `/news` with `matched_currencies` | Longs tokens amplified by blue-verified accounts with recent engagement. |
| **Macro** | `/macro/events` + `/macro/events/{name}/history` | Positions ahead of CPI/NFP based on actual-vs-forecast residuals. |
| **Liquidity Depth** | `/currencies/{id}/pairs` | Sizes based on orderbook depth; down-sizes thin books, flags asymmetric depth. |
| **Sector Rotation** | `/currencies/sector-spotlight` | Rotates into the top-performing crypto sector (DeFi, L1, L2, AI, Meme). |

Each agent emits a typed `Signal { symbol, direction, confidence, reasoning, evidence }`. The Risk Manager aggregates by confidence-weighted vote, cancels opposing directions proportionally, and caps position sizes. The Portfolio Manager emits one trade per surviving signal. One cycle, ~3 seconds, fully auditable.

### What makes Consilium different

| Competitor approach | Consilium approach |
|---|---|
| "AI reads the market and recommends a trade" | Six specialist agents with named theses. Each can be audited independently. |
| Single opaque signal | Multi-agent deliberation with visible disagreement and arbitration. |
| Execution "coming soon" | **Live SoDEX testnet execution** — real EIP-712 signed perps orders, real fills, real balance tracking. |
| Static risk parameters | **Configurable risk limits** — users adjust per-name cap, gross cap, and consensus weights from the UI. |
| "Signal-to-execution" | **Opinion aggregation → risk arbitration → execution.** Three-step loop, each auditable. |

### The Consilium Cycle

> *One round of: parallel 6-agent evaluation → confidence-weighted voting → risk-capped sizing → single-trade emission. Runs in ~3 seconds. Every decision is replayable via the stored agent-reasoning ledger.*

The name comes from the Roman *consilium* — a deliberative council of advisors whose collective judgement binds a decision. That is literally the architecture.

---

## 2. Target users

| Persona | Pain today | What Consilium gives them |
|---|---|---|
| **Solo crypto trader (500-10k portfolio)** | Reads 6 tabs of CT and Dune, misses ETF flow divergences, gets rekt by unlock cliffs. | One dashboard, one button. Agents surface the three signals that matter today with sized recommendations. |
| **Small prop desk / quant team (2-5 people)** | Building internal agents from scratch, burning weeks on plumbing. | Full open-source multi-agent hedge fund scaffolding they can fork and extend with their own agents. |
| **Crypto-native fund LP (post-buildathon)** | Wants passive exposure to an agentic strategy but won't run code. | Deposit USDC into a public Consilium strategy; SoDEX auto-executes; SSI tokenizes the position. |

---

## 3. Use case — a concrete user journey

> **Scenario.** It is Monday. BTC spot ETFs absorbed $647M over Friday–Saturday per `/etfs/summary-history`. ARB has a 57% supply overhang per `/currencies/{arb}/market-snapshot`. And 11 blue-verified Business KOLs posted about BTC in the last 24h per `/news`.

> **Without Consilium.** The user would need to manually fetch each of these, interpret, compare confidences, decide position sizes, and place orders — typically 30–45 minutes and 4+ tools.

> **With Consilium.** The user clicks "Run Cycle" once.
> - ETF Flow Agent emits BTC / LONG / 72% confidence
> - Unlock Risk Agent emits ARB / SHORT / 48% confidence
> - KOL Narrative Agent emits BTC / LONG / 100% confidence
> - Risk Manager sizes: BTC +1.80% book, ARB −1.38%
> - Portfolio Manager emits two trades, persisted to ledger, visible in UI
> - Total elapsed: ~3 seconds

In paper mode those trades land in a SQLite ledger. In SoDEX testnet mode the same trade set hits SoDEX as signed perps orders with real fills.

---

## 4. Wave 3 progress

### What's new in Wave 3

| Feature | Status | Evidence |
|---|---|---|
| **6 agents (was 4)** | Live | Liquidity Depth + Sector Rotation agents added. Full pipeline verified with live SoSoValue data. |
| **Configurable risk limits** | Live | UI sliders for per-name cap, gross cap, consensus weights. POST /api/config endpoint. |
| **Live SoSoValue API** | Live | Real API key, real data. 10+ endpoints integrated. Quota-aware with mock fallback. |
| **Live SoDEX testnet execution** | Live | Real EIP-712 signed orders, real fills on SoDEX testnet. Balance card shows live collateral. |
| **Mock fallback restored** | Live | App works with or without API key. Deterministic fixtures when quota exhausted. |
| **UX polish** | Live | Quota/expiry banners, empty state messaging, 6-agent grid, updated landing page. |
| **16 unit tests** | Passing | Signer (5), risk_manager (7), portfolio_manager (4). All core logic verified. |
| **Dockerfile** | Ready | Production container for backend deployment. |

### SoSoValue API integration (10+ endpoints)

| Endpoint | Used by |
|---|---|
| `/currencies` | Symbol resolver |
| `/currencies/{id}/market-snapshot` | Unlock Risk agent |
| `/currencies/{id}/klines` | Agent context |
| `/currencies/{id}/token-economics` | Unlock Risk agent |
| `/currencies/{id}/pairs` | Liquidity Depth agent |
| `/currencies/sector-spotlight` | Sector Rotation agent |
| `/etfs/summary-history` | ETF Flow agent |
| `/macro/events` | Macro agent |
| `/macro/events/{name}/history` | Macro agent |
| `/news` | KOL Narrative agent |

### SoDEX integration

| Endpoint | Used by |
|---|---|
| `GET /markets/tickers` | Live market ticker, backtester |
| `GET /markets/{symbol}/klines` | 30-day backtester |
| `GET /accounts/{addr}/state` | Balance card, position display |
| `POST /trade/orders` | EIP-712 signed perps execution |
| `DELETE /trade/orders` | Order cancellation (backend ready) |

---

## 5. Tech stack

- **Backend** · Python 3.11 · FastAPI · LangGraph · httpx · SQLAlchemy · Pydantic v2
- **Signing** · `eth-account` (EIP-712 typed data, `0x01`-prefixed signatures)
- **Data** · SoSoValue Terminal (10+ endpoints) + SoDEX market data
- **Execution** · Paper SQLite ledger + SoDEX perps testnet (EIP-712 signed)
- **Frontend** · Next.js 14 · Tailwind · Recharts · TypeScript
- **Tests** · pytest · pytest-asyncio (16 tests)
- **Deploy** · Docker · Vercel · Render
- **Open source** · MIT license

---

## 6. How to run locally

```bash
# 1. Install
make install

# 2. Backend (mock-fallback works with no keys)
make dev-backend

# 3. Frontend, in a separate terminal
make dev-frontend

# 4. Open http://localhost:3000, click Launch App, click Run Cycle
```

Optional env vars in `backend/.env`:

```bash
SOSO_API_KEY=                 # Builder-tier recommended; free tier works but quota-limited
SODEX_NETWORK=testnet
SODEX_EVM_PRIVATE_KEY=        # Only for live execution; leave blank for paper mode
SODEX_EVM_ADDRESS=
```

---

## 7. Bonus items

| Bonus | Status |
|---|---|
| **Integration with SoDEX API** | Live market data + live testnet execution with EIP-712 signing |
| **AI-enhanced functionality** | 6 specialized AI agents with grounded reasoning |
| **Opportunity / signal generation** | Every cycle produces typed Signal objects with confidence, evidence, reasoning |
| **Risk control** | Per-name 5% cap, gross 100% cap, configurable from UI, confidence-weighted consensus |
| **Confirmation mechanism** | Browser confirm() before any SoDEX order submission |
| **Research-to-action flow** | End-to-end in ~3 seconds; demoable every click |
| **Product experience** | Landing page + dapp; live ticker; status pills; pipeline ribbon; backtest chart; risk controls |
| **Backtesting** | 30-day equity curve on real SoDEX klines + signal outcome tracker (HIT/STOP/DRIFT) |
| **Multi-agent consensus** | 6 specialists with solo/duo/super-majority sizing and visible vote ledger |

---

## 8. Team

Solo build. One-person-business-empire in the spirit of the buildathon brief.
