const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type Signal = {
  agent: string;
  symbol: string;
  direction: "long" | "short" | "flat";
  confidence: number;
  reasoning: string;
  evidence: Record<string, unknown>;
  generated_at: string;
};

export type Trade = {
  id?: number;
  cycle_id?: string;
  symbol: string;
  side: "buy" | "sell";
  size_usd: number;
  confidence: number;
  rationale: string;
  agents: string[];
  executed_at: string;
};

export type RunResult = {
  cycle_id: string | null;
  universe: string[];
  signals: Signal[];
  sized_positions: Record<string, any>;
  trades: Trade[];
  errors: string[];
};

export type Health = {
  status: string;
  mock_mode: boolean;
  llm_enabled: boolean;
  soso_quota_exhausted?: boolean;
  sodex?: {
    network: "testnet" | "mainnet";
    market_data: "live";
    execution_ready: boolean;
  };
  agents: { name: string; description: string }[];
};

export type ExecutionMode = "paper" | "sodex_testnet" | "sodex_mainnet";

export type PortfolioResp = {
  positions: { symbol: string; net_exposure_usd: number }[];
  gross_exposure_usd: number;
  trade_count: number;
};

export type BacktestResp = {
  starting_capital: number;
  ending_capital: number;
  total_return_pct: number;
  days: number;
  equity_curve: { day: number; equity: number; daily_pnl: number }[];
  trades: {
    symbol: string;
    side: string;
    size_usd: number;
    confidence: number;
    agents: string[];
  }[];
  ran_at: string;
};
