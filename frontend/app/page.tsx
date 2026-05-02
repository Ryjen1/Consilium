import Link from "next/link";
import { ArrowRight, Brain, Network, Shield, Zap } from "lucide-react";

const STEPS = [
  {
    icon: Brain,
    title: "Agents read the market",
    body: "Three specialized analysts read SoSoValue Terminal: ETF flows, token-unlock risk, and KOL narrative momentum.",
  },
  {
    icon: Shield,
    title: "Risk manager sizes positions",
    body: "Multi-agent signals are aggregated, opposing directions cancel, and every position is capped at 10% of book.",
  },
  {
    icon: Network,
    title: "Portfolio manager routes trades",
    body: "Sized targets become orders against a paper ledger or directly onto SoDEX testnet.",
  },
  {
    icon: Zap,
    title: "SoDEX executes on-chain",
    body: "EIP-712-signed perps orders post to SoDEX testnet in one round-trip. Every decision is audited.",
  },
];

const FEATURES = [
  {
    title: "SoSoValue-native",
    body: "8 Terminal endpoints integrated across the agents, plus the full 32-endpoint surface catalogued in the client.",
  },
  {
    title: "Real on-chain execution",
    body: "EIP-712 signer + SoDEX perps executor. Not a paper-trading toy — real testnet orders with real fills.",
  },
  {
    title: "Research-to-execution loop",
    body: "One click runs agents, risk manager, portfolio manager, and executor. Closes in ~3 seconds.",
  },
  {
    title: "Backtesting on real prices",
    body: "30-day equity curve replayed on live SoDEX klines for BTC, ETH, SOL, XRP, AVAX.",
  },
  {
    title: "Multi-wave roadmap",
    body: "Wave 1 ships real execution. Waves 2-4 add more agents, leverage, ValueChain audit, and an SSI marketplace.",
  },
  {
    title: "Safety by default",
    body: "Testnet first, per-trade notional caps, whitelisted symbols, explicit confirm before any signed call.",
  },
];

const INTEGRATIONS = [
  { name: "SoSoValue Terminal", tag: "8 endpoints" },
  { name: "SoDEX Perps", tag: "EIP-712 signed" },
  { name: "SoDEX Spot", tag: "market data" },
  { name: "SSI Protocol", tag: "Wave 4" },
  { name: "ValueChain", tag: "Wave 3" },
  { name: "LangGraph", tag: "orchestration" },
];

const WAVES = [
  {
    label: "Wave 1",
    title: "Shipped",
    body: "3 agents, LangGraph pipeline, paper + SoDEX testnet execution, 30-day backtester, dashboard.",
    shipped: true,
  },
  {
    label: "Wave 2",
    title: "More agents, better orders",
    body: "+4 agents (Macro, mNAV, Liquidity, Sector). Limit orders, TP/SL, leverage, configurable risk.",
    shipped: false,
  },
  {
    label: "Wave 3",
    title: "On-chain audit log",
    body: "Every decision logged as a ValueChain tx. Strategy versioning, multi-strategy portfolios.",
    shipped: false,
  },
  {
    label: "Wave 4",
    title: "Strategy marketplace on SSI",
    body: "Users deposit into public SoSoFund strategies, auto-rebalanced through SoDEX.",
    shipped: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="px-6 h-14 flex items-center gap-4 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand2 flex items-center justify-center text-white text-sm font-bold shadow-glow">
              S
            </div>
            <div className="text-sm font-semibold tracking-tight">
              SoSo<span className="text-brand">Fund</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <a href="#how" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">How it works</a>
            <a href="#features" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Features</a>
            <a href="#integrations" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Integrations</a>
            <a href="#roadmap" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Roadmap</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="pill bg-long/15 text-long border border-long/30 hidden sm:inline-flex">
              Wave 1 · Live on Testnet
            </span>
            <Link
              href="/dapp"
              className="h-9 px-4 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand text-white text-sm font-medium flex items-center gap-1.5 shadow-glow transition"
            >
              Launch App
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6">
        <section className="pt-16 pb-20 flex flex-col items-center text-center gap-6">
          <span className="pill bg-brand/10 text-brand border border-brand/30">
            SoSoValue Buildathon · Wave 1 Submission
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.05]">
            AI agents that turn{" "}
            <span className="text-brand">SoSoValue research</span> into{" "}
            <span className="text-brand">SoDEX execution</span>.
          </h1>
          <p className="text-base md:text-lg text-muted max-w-2xl leading-relaxed">
            A crypto-native hedge fund run by specialized analyst agents. Reads the
            market through SoSoValue Terminal, sizes positions through a risk
            manager, and executes real EIP-712-signed perps orders on SoDEX — all
            in one agent loop.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/dapp"
              className="h-11 px-6 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand text-white text-sm font-medium flex items-center gap-2 shadow-glow transition"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="h-11 px-6 rounded-lg border border-border hover:border-brand text-text text-sm font-medium flex items-center gap-2 transition"
            >
              How it works
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
              3 agents live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
              SoDEX testnet execution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
              8 SoSoValue endpoints
            </span>
          </div>
        </section>

        <section id="how" className="py-16 border-t border-border/60">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <div className="label mb-2">How it works</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Research → Insight → Execution
              </h2>
            </div>
            <span className="label hidden md:block">closes in ~3 seconds</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="label">Step 0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="features" className="py-16 border-t border-border/60">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <div className="label mb-2">Features</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                What makes it different
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-5 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-text">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="integrations" className="py-16 border-t border-border/60">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <div className="label mb-2">Ecosystem</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Built on the SoSoValue stack
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {INTEGRATIONS.map((it) => (
              <div
                key={it.name}
                className="card px-4 py-5 flex flex-col items-center justify-center text-center gap-1"
              >
                <span className="font-semibold text-sm text-text">{it.name}</span>
                <span className="text-[11px] text-muted mono">{it.tag}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="roadmap" className="py-16 border-t border-border/60">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <div className="label mb-2">Roadmap</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Multi-wave delivery
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WAVES.map((w) => (
              <div
                key={w.label}
                className={
                  "card p-5 flex flex-col gap-3 " +
                  (w.shipped
                    ? "border-long/40 bg-long/5"
                    : "opacity-90")
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "pill " +
                      (w.shipped
                        ? "bg-long/15 text-long border border-long/30"
                        : "bg-panel2 text-muted border border-border")
                    }
                  >
                    {w.label}
                  </span>
                  {w.shipped && (
                    <span className="text-[10px] text-long uppercase tracking-wider">
                      shipped
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm">{w.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 border-t border-border/60 text-center flex flex-col items-center gap-5">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-xl">
            Turn SoSoValue signals into on-chain trades.
          </h2>
          <p className="text-muted max-w-lg text-sm leading-relaxed">
            Open the app, run one cycle, and watch three agents deliberate into a
            sized trade — on a paper ledger or directly on SoDEX testnet.
          </p>
          <Link
            href="/dapp"
            className="h-11 px-6 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand text-white text-sm font-medium flex items-center gap-2 shadow-glow transition"
          >
            Launch App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <footer className="py-8 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-2 mono">
            <span>SoSoFund · Wave 1</span>
            <span className="opacity-40">·</span>
            <span>Built for the SoSoValue Buildathon</span>
          </div>
          <div className="hidden md:flex items-center gap-3 mono">
            <span>Research → Insight → Execution</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
