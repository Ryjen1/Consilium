import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070912",
        panel: "#0f1420",
        panel2: "#141a28",
        panel3: "#1a2030",
        border: "#1f2636",
        text: "#e5e7eb",
        muted: "#7a8398",
        brand: "#8b6cff",
        brand2: "#a48bff",
        long: "#22c55e",
        short: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px -8px rgba(139, 108, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
