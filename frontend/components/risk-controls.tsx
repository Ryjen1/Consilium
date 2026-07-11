"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Settings } from "lucide-react";

type RiskConfig = {
  max_per_name: number;
  max_gross: number;
  solo_weight: number;
  duo_weight: number;
  super_majority: number;
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="text-muted w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-panel3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
      />
      <span className="mono text-text w-14 text-right">{format(value)}</span>
    </div>
  );
}

export function RiskControls({
  onConfigChange,
}: {
  onConfigChange?: (cfg: RiskConfig) => void;
}) {
  const [config, setConfig] = useState<RiskConfig>({
    max_per_name: 0.05,
    max_gross: 1.0,
    solo_weight: 0.5,
    duo_weight: 1.0,
    super_majority: 1.25,
  });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ risk_config: RiskConfig }>("/api/config")
      .then((r) => setConfig(r.risk_config))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/api/config", {
        method: "POST",
        body: JSON.stringify(config),
      });
      onConfigChange?.(config);
    } catch {}
    setSaving(false);
  }

  function update(key: keyof RiskConfig, value: number) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-panel2/50 transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-brand" />
          <span className="mono text-[11px] uppercase tracking-wider">
            Risk Controls
          </span>
        </div>
        <span className="label">{expanded ? "collapse" : "expand"}</span>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-border flex flex-col gap-3">
          <Slider
            label="Per-name cap"
            value={config.max_per_name}
            min={0.01}
            max={0.15}
            step={0.005}
            onChange={(v) => update("max_per_name", v)}
            format={(v) => `${(v * 100).toFixed(1)}%`}
          />
          <Slider
            label="Gross cap"
            value={config.max_gross}
            min={0.25}
            max={2.0}
            step={0.05}
            onChange={(v) => update("max_gross", v)}
            format={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <div className="hairline" />
          <Slider
            label="Solo weight"
            value={config.solo_weight}
            min={0.1}
            max={1.0}
            step={0.05}
            onChange={(v) => update("solo_weight", v)}
            format={(v) => `${v.toFixed(2)}x`}
          />
          <Slider
            label="Duo weight"
            value={config.duo_weight}
            min={0.5}
            max={1.5}
            step={0.05}
            onChange={(v) => update("duo_weight", v)}
            format={(v) => `${v.toFixed(2)}x`}
          />
          <Slider
            label="Super-majority"
            value={config.super_majority}
            min={0.75}
            max={2.0}
            step={0.05}
            onChange={(v) => update("super_majority", v)}
            format={(v) => `${v.toFixed(2)}x`}
          />
          <button
            onClick={save}
            disabled={saving}
            className="mt-1 px-3 py-1.5 rounded-lg bg-brand/20 text-brand text-[11px] font-medium hover:bg-brand/30 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Apply Risk Config"}
          </button>
        </div>
      )}
    </div>
  );
}
