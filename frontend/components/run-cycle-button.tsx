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
      className="flex items-center gap-2 bg-brand hover:bg-brand/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
