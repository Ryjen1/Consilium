import Link from "next/link";
import { ArrowRight, Brain, Network, Shield, Zap } from "lucide-react";
import { MarketTicker } from "@/components/market-ticker";
import { SeamlessSplit } from "@/components/seamless-split";

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
    body: "8 Terminal endpoints in active use, the full 32-endpoint surface catalogued in the client.",
  },
  {
    title: "Real on-chain execution",
    body: "EIP-712 signer and SoDEX perps executor. Real testnet orders, real fills.",
  },
  {
    title: "Research-to-execution loop",
    body: "One click runs agents, risk, portfolio, and executor. Closes in about three seconds.",
  },
  {
    title: "Backtesting on real prices",
    body: "30-day equity curve replayed on live SoDEX klines for BTC, ETH, SOL, XRP, AVAX.",
  },
];

const WAVES = [
  {
    q: "Wave 1",
    tag: "We are here",
    title: "Shipped",
    body: "3 agents, LangGraph pipeline, paper ledger, backtester, dashboard. EIP-712 signer and SoDEX testnet executor wired.",
    shipped: true,
  },
  {
    q: "Wave 2",
    tag: "",
    title: "Live execution + more agents",
    body: "Activate live SoDEX testnet fills. Macro, BTC Treasury, Sector Rotation agents. Limit orders, TP/SL, leverage.",
    shipped: false,
  },
  {
    q: "Wave 3",
    tag: "",
    title: "On-chain audit + UX pass",
    body: "Every decision logged as a ValueChain tx. Full UX refinement: motion, mobile, onboarding, accessibility.",
    shipped: false,
  },
  {
    q: "Wave 4",
    tag: "",
    title: "Marketplace on SSI",
    body: "LPs deposit into public Consilium strategies, auto-rebalanced through SoDEX.",
    shipped: false,
  },
];

const PARTNERS = [
  { name: "SoSoValue Terminal" },
  { name: "SoDEX" },
  { name: "ValueChain" },
  { name: "SSI Protocol" },
  { name: "LangGraph" },
  { name: "eth-account" },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="px-6 h-14 flex items-center gap-4 max-w-[1200px] mx-auto w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand2 flex items-center justify-center text-white text-sm font-bold shadow-glow">
              C
            </div>
            <div className="text-sm font-semibold tracking-tight">
              Consi<span className="text-brand">lium</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <a href="#how" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">How it works</a>
            <a href="#seamless" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Experience</a>
            <a href="#features" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Features</a>
            <a href="#roadmap" className="px-3 h-8 rounded-md text-[12px] text-muted hover:text-text flex items-center transition">Roadmap</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://sosovalue.com"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex h-9 px-3 rounded-lg border border-border hover:border-brand/40 text-xs text-muted hover:text-text items-center gap-1.5 transition"
            >
              Research Terminal
              <ArrowRight className="w-3 h-3" />
            </a>
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
        <section className="pt-20 md:pt-28 pb-12 flex flex-col items-center text-center gap-7">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.02]">
            Three specialist agents.{" "}
            <span className="text-brand">One aggregated trade.</span>
          </h1>
          <p className="text-base md:text-lg text-muted max-w-2xl leading-relaxed">
            <span className="text-text">ETF Flow</span>,{" "}
            <span className="text-text">Unlock Risk</span>, and{" "}
            <span className="text-text">KOL Narrative</span> agents debate
            SoSoValue data. A risk manager arbitrates. A portfolio manager
            emits one sized trade on SoDEX. Every cycle. In three seconds.
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
        </section>

        <section className="pb-16">
          <MarketTicker />
        </section>

        <section id="seamless" className="py-16 border-t border-border/60">
          <SeamlessSplit />
        </section>

        <section id="how" className="py-16 border-t border-border/60">
          <div className="text-center mb-12">
            <div className="label mb-2">How it works</div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Research → Insight → Execution
            </h2>
            <p className="text-sm text-muted mt-3">Closes in roughly three seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="card p-5 flex flex-col gap-3 hover:border-brand/30 transition">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="label">Step 0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-[15px]">{s.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="features" className="py-16 border-t border-border/60">
          <div className="text-center mb-12">
            <div className="label mb-2">Features</div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              What makes Consilium different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-5 flex flex-col gap-2 hover:border-brand/30 transition">
                <h3 className="font-semibold text-[15px] text-text">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="roadmap" className="py-16 border-t border-border/60">
          <div className="text-center mb-12">
            <div className="label mb-2">Roadmap</div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Multi-wave delivery
            </h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-0 right-0 top-10 h-px bg-gradient-to-r from-brand/40 via-border to-transparent" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {WAVES.map((w) => (
                <div key={w.q} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 h-5">
                    <span
                      className={
                        "w-3 h-3 rounded-full border-2 " +
                        (w.shipped
                          ? "bg-long border-long"
                          : "bg-panel border-border")
                      }
                    />
                    <span className="mono text-[11px] uppercase tracking-widest text-muted">
                      {w.q}
                    </span>
                    {w.tag && (
                      <span className="pill bg-brand/15 text-brand border border-brand/30 ml-auto">
                        {w.tag}
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      "card p-4 flex flex-col gap-2 " +
                      (w.shipped ? "border-long/30 bg-long/5" : "")
                    }
                  >
                    <h3 className="font-semibold text-sm">{w.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{w.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border/60">
          <div className="label text-center mb-6">Built on</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="px-4 py-2 rounded-lg border border-border bg-panel/40 text-sm text-muted hover:text-text hover:border-brand/30 transition"
              >
                {p.name}
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 text-center flex flex-col items-center gap-5">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
            Turn SoSoValue signals into on-chain trades.
          </h2>
          <p className="text-muted max-w-lg text-sm leading-relaxed">
            Open Consilium, run one cycle, and watch three agents deliberate
            into a sized trade — on a paper ledger or directly on SoDEX testnet.
          </p>
          <Link
            href="/dapp"
            className="h-11 px-6 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand text-white text-sm font-medium flex items-center gap-2 shadow-glow transition mt-2"
          >
            Launch App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <footer className="py-8 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-2 mono">
            <span>Consilium</span>
            <span className="opacity-40">·</span>
            <span>Built for the SoSoValue Buildathon</span>
          </div>
          <a
            href="#"
            className="hidden md:flex items-center gap-1 mono hover:text-text transition"
          >
            Back to top ↑
          </a>
        </footer>
      </main>
    </div>
  );
}
