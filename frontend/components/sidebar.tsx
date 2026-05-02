"use client";
import { Activity, BarChart3, LayoutDashboard, ScrollText, Settings2, Zap } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { id: "agents", label: "Agents", icon: Zap },
  { id: "backtest", label: "Backtest", icon: BarChart3 },
  { id: "log", label: "Execution", icon: ScrollText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[72px] flex-col items-center py-5 border-r border-border bg-panel/60 backdrop-blur-sm sticky top-0 h-screen">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand2 flex items-center justify-center text-white font-bold shadow-glow">
        S
      </div>
      <div className="mt-8 flex flex-col gap-1 w-full px-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              className={clsx(
                "h-10 w-full rounded-lg flex items-center justify-center transition",
                n.active
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:text-text hover:bg-panel2"
              )}
              title={n.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
      <div className="mt-auto text-[9px] uppercase tracking-widest text-muted rotate-90 origin-center py-2">
        Wave&nbsp;1
      </div>
    </aside>
  );
}
