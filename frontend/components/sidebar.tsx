"use client";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  ScrollText,
  Settings2,
  Users,
  Zap,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { id: "agents", label: "Agents", icon: Zap },
  { id: "sessions", label: "Sessions", icon: ScrollText },
  { id: "backtest", label: "Backtest", icon: BarChart3 },
  { id: "portfolio", label: "Portfolio", icon: Activity },
  { id: "leaderboard", label: "Leaderboard", icon: Users },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[68px] flex-col items-center py-4 border-r border-border bg-panel/50 backdrop-blur-sm sticky top-14 h-[calc(100vh-3.5rem)] shrink-0">
      <div className="flex flex-col gap-1 w-full px-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              title={n.label}
              className={clsx(
                "h-10 w-full rounded-lg flex items-center justify-center transition relative group",
                n.active
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:text-text hover:bg-panel2"
              )}
            >
              <Icon className="w-4 h-4" />
              {n.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-r" />
              )}
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-panel3 border border-border text-[11px] text-text opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition z-50">
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto text-[9px] uppercase tracking-[0.2em] text-muted/60 writing-mode-vertical pt-4 pb-2">
        W1
      </div>
    </aside>
  );
}
