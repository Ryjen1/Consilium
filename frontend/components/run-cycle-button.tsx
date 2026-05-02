"use client";
import { Play, Loader2 } from "lucide-react";

export function RunCycleButton({
  onRun,
  loading,
  label = "Run Cycle",
}: {
  onRun: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onRun}
      disabled={loading}
      className="h-9 px-4 rounded-lg bg-gradient-to-b from-brand to-brand/80 hover:from-brand2 hover:to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 transition shadow-glow"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-white" />
      )}
      {label}
    </button>
  );
}
