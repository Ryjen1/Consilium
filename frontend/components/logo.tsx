import clsx from "clsx";

/**
 * Consilium mark.
 *
 * Visual concept: three analyst nodes on an arc converging on one decision
 * node through a deliberation ring. Reads as a distinct symbol at 20px and
 * scales cleanly. Uses currentColor so it inherits whatever the caller sets.
 */
export function LogoMark({
  size = 28,
  className,
  title = "Consilium",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cns-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a48bff" />
          <stop offset="100%" stopColor="#6a4aff" />
        </linearGradient>
        <radialGradient id="cns-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a48bff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a48bff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo (reads as 'council presence'). */}
      <circle cx="16" cy="16" r="15" fill="url(#cns-r)" />

      {/* Deliberation ring — 3/4 arc, leaves the right open for convergence lines. */}
      <path
        d="M26 16a10 10 0 1 0-5 8.66"
        stroke="url(#cns-g)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Three analyst nodes on the arc. */}
      <circle cx="7.6" cy="11.3" r="2" fill="url(#cns-g)" />
      <circle cx="7.6" cy="20.7" r="2" fill="url(#cns-g)" />
      <circle cx="14" cy="5.3" r="2" fill="url(#cns-g)" />

      {/* Convergence lines into the decision node. */}
      <path
        d="M9.2 12L14.5 15.2M9.2 20L14.5 16.8M15 6.8L15.4 14.2"
        stroke="url(#cns-g)"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Decision node — the 'one sized trade'. */}
      <circle cx="16" cy="16" r="3.2" fill="#ffffff" />
      <circle cx="16" cy="16" r="3.2" fill="url(#cns-g)" opacity="0.9" />
      <circle cx="16" cy="16" r="1.2" fill="#ffffff" />
    </svg>
  );
}

/**
 * Full logo lockup: mark + wordmark + optional subtitle. Used in the landing
 * header and the dapp topbar.
 */
export function Logo({
  size = 28,
  subtitle,
  className,
}: {
  size?: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className="font-semibold tracking-[-0.02em] text-[15px] leading-none text-text"
          style={{ fontFeatureSettings: '"ss01", "cv11"' }}
        >
          Consilium
        </span>
        {subtitle && (
          <span className="hidden md:inline-block label border-l border-border pl-2 leading-none">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
