/**
 * AlDawaaLogo — Official platform logo component
 * Renders a clean SVG pill-shaped logo in AL-Dawaa brand colors (navy + gold).
 * Colors verified from al-dawaa.com: #002544 navy, #FFC200 gold.
 */
import React from 'react';

interface Props {
  /** Overall width in px. Height is auto-proportional (width × 0.65). */
  size?: number;
  /** Variant: full pill or compact circle for tight spaces */
  variant?: 'pill' | 'circle';
}

export default function AlDawaaLogo({ size = 36, variant = 'pill' }: Props) {
  if (variant === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="AL-Dawaa">
        <circle cx="20" cy="20" r="19" fill="#002544" />
        <circle cx="20" cy="20" r="19" fill="url(#cgrad)" />
        <defs>
          <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* White cross — universal pharmacy symbol */}
        <rect x="16" y="8"  width="8"  height="24" rx="3" fill="white" opacity="0.95" />
        <rect x="8"  y="16" width="24" height="8"  rx="3" fill="white" opacity="0.95" />
        {/* Navy center block */}
        <rect x="16" y="16" width="8" height="8" rx="2" fill="#001529" opacity="0.85" />
        {/* Gold dot — brand accent */}
        <circle cx="20" cy="20" r="2.5" fill="#FFC200" />
      </svg>
    );
  }

  // Pill variant (default — horizontal, wider)
  const w = size * 1.65;
  const h = size;
  return (
    <svg width={w} height={h} viewBox="0 0 54 32" fill="none" aria-label="AL-Dawaa">
      <defs>
        <linearGradient id="pillgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.20" />
          <stop offset="100%" stopColor="white" stopOpacity="0"    />
        </linearGradient>
        <clipPath id="pillclip">
          <rect x="1" y="1" width="52" height="30" rx="15" />
        </clipPath>
      </defs>

      {/* Pill body — Al-Dawaa navy */}
      <rect x="1" y="1" width="52" height="30" rx="15" fill="#002544" />
      {/* Top highlight */}
      <rect x="1" y="1" width="52" height="14" rx="15" fill="url(#pillgrad)" />
      {/* Divider */}
      <line x1="27" y1="1" x2="27" y2="31" stroke="white" strokeWidth="1.5" opacity="0.35" />

      {/* Left half: cross symbol */}
      <g clipPath="url(#pillclip)">
        {/* Vertical bar */}
        <rect x="10" y="9"  width="5" height="14" rx="2" fill="white" opacity="0.9" />
        {/* Horizontal bar */}
        <rect x="7"  y="13" width="11" height="5" rx="2" fill="white" opacity="0.9" />
        {/* Gold center dot */}
        <circle cx="12.5" cy="15.5" r="2" fill="#FFC200" />
      </g>

      {/* Right half: "D" (Al-Dawaa initial) */}
      <text
        x="39" y="21"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="900"
        fontFamily="Inter, sans-serif"
        opacity="0.95"
      >
        D
      </text>

      {/* Border */}
      <rect x="1" y="1" width="52" height="30" rx="15" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
    </svg>
  );
}
