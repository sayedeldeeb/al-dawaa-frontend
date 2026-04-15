import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: string;
  /** accent=true → yellow border highlight */
  accent?: boolean;
  loading?: boolean;
  /** custom left-border color (hex) */
  color?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Optional progress % (0-100) shown as bar at bottom */
  progress?: number;
}

// ── Shimmer skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="kpi-card-enterprise" style={{ borderLeftColor: '#e4e8ef' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <div className="skeleton h-2.5 w-24 rounded" />
          <div className="skeleton h-8 w-32 rounded" />
          <div className="skeleton h-2 w-16 rounded" />
        </div>
        <div className="skeleton rounded-xl" style={{ width: 42, height: 42, flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ── Trend badge ──────────────────────────────────────────────────────────────
function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="kpi-trend-up">
      <TrendingUp size={11} strokeWidth={2.5} />
      +{Math.abs(value).toFixed(1)}%
    </span>
  );
  if (value < 0) return (
    <span className="kpi-trend-down">
      <TrendingDown size={11} strokeWidth={2.5} />
      -{Math.abs(value).toFixed(1)}%
    </span>
  );
  return (
    <span className="kpi-trend-flat">
      <Minus size={11} strokeWidth={2.5} />
      0%
    </span>
  );
}

// ── Format large numbers (1.2M, 840K) ──────────────────────────────────────
function formatNumber(value: string | number): string {
  if (typeof value === 'string') return value;
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 10_000)    return (value / 1_000).toFixed(1) + 'K';
  return value.toLocaleString();
}

// ─────────────────────────────────────────────────────────────────────────────
export default function KPICard({
  title, value, subtitle, trend, icon,
  accent = false, loading = false, color, unit, size = 'md', progress,
}: KPICardProps) {

  if (loading) return <Skeleton />;

  // ── Color resolution ──────────────────────────────────────────────────────
  // accent   → golden/yellow accent  (#FFC200)
  // color    → custom provided hex
  // default  → primary navy
  const borderColor = accent ? '#FFC200' : (color || '#002544');
  const iconBg      = accent
    ? 'rgba(255,194,0,0.12)'
    : color
      ? `${color}18`
      : 'rgba(29,43,78,0.07)';
  const iconColor   = accent ? '#c89400' : (color || '#002544');

  // ── Value formatting ──────────────────────────────────────────────────────
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;
  const valueFontSize = size === 'lg' ? '3.2rem' : size === 'sm' ? '1.8rem' : '2.75rem';

  return (
    <div className="kpi-card-enterprise" style={{ borderLeftColor: borderColor }}>
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="kpi-label">{title}</p>

          {/* Value row */}
          <div className="flex items-end gap-2 mt-1.5">
            <span
              className="kpi-number"
              style={{ fontSize: valueFontSize, color: '#1e2535', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
            >
              {displayValue}
            </span>
            {unit && (
              <span className="kpi-unit-suffix pb-1 text-base font-semibold" style={{ color: '#6b7280' }}>{unit}</span>
            )}
          </div>

          {/* Trend + subtitle row */}
          {(trend !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {trend !== undefined && <TrendBadge value={trend} />}
              {subtitle && (
                <span style={{ fontSize: '11.5px', color: '#8a95a3' }}>{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon box */}
        {icon && (
          <div
            className="kpi-icon-box flex-shrink-0"
            style={{ background: iconBg, color: iconColor }}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Optional progress bar */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="progress-track" style={{ height: 4 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: borderColor,
                height: 4,
              }}
            />
          </div>
          <p style={{ fontSize: 10, color: '#8a95a3', marginTop: 3, textAlign: 'right' }}>
            {progress.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
