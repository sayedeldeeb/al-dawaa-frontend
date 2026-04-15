import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Upload, Home, ChevronRight, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface PageHeaderProps {
  /** Project icon as emoji or React node */
  icon?: React.ReactNode;
  /** Page title (EN) */
  title: string;
  /** Page title (AR) */
  titleAr?: string;
  /** Short subtitle / description (EN) */
  subtitle?: string;
  /** Short subtitle / description (AR) */
  subtitleAr?: string;
  /** Last updated ISO string or label */
  lastUpdated?: string;
  /** Total record count to show in badge */
  recordCount?: number;
  /** Show upload button (admin only) */
  showUpload?: boolean;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Whether data is refreshing */
  refreshing?: boolean;
  /** Custom action buttons (right side) */
  actions?: React.ReactNode;
}

// ── Relative time label ────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PageHeader({
  icon, title, titleAr, subtitle, subtitleAr,
  lastUpdated, recordCount, showUpload = true, showRefresh = true,
  onRefresh, refreshing = false, actions,
}: PageHeaderProps) {
  const { lang, user } = useAuthStore();
  const navigate       = useNavigate();

  const displayTitle    = lang === 'ar' && titleAr    ? titleAr    : title;
  const displaySubtitle = lang === 'ar' && subtitleAr ? subtitleAr : subtitle;

  return (
    <div className="page-header-block">
      {/* Left: breadcrumb + title */}
      <div className="min-w-0">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-1.5">
          <button
            onClick={() => navigate('/')}
            className="hover:text-primary transition-colors flex items-center gap-1"
            style={{ color: '#8a95a3' }}
          >
            <Home size={11} strokeWidth={2} />
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <ChevronRight size={10} className="breadcrumb-sep flex-shrink-0" />
          <span className="breadcrumb-current">{displayTitle}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-center gap-3 flex-wrap">
          {icon && (
            <div
              className="flex items-center justify-center rounded-xl text-xl flex-shrink-0"
              style={{
                width: 44, height: 44,
                background: 'rgba(29,43,78,0.07)',
                color: '#002544',
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h1
              className="font-extrabold leading-tight"
              style={{ fontSize: 22, color: '#002544', letterSpacing: '-0.025em' }}
            >
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-sm mt-0.5" style={{ color: '#8a95a3' }}>{displaySubtitle}</p>
            )}
          </div>

          {/* Record count badge */}
          {recordCount !== undefined && recordCount > 0 && (
            <span
              className="rounded-full font-semibold text-xs self-start mt-1"
              style={{
                background: 'rgba(29,43,78,0.08)',
                color: '#002544',
                padding: '3px 10px',
              }}
            >
              {recordCount.toLocaleString()} {lang === 'ar' ? 'سجل' : 'records'}
            </span>
          )}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={11} style={{ color: '#adb5c2' }} />
            <span style={{ fontSize: 11, color: '#adb5c2' }}>
              {lang === 'ar' ? 'آخر تحديث:' : 'Last updated:'}{' '}
              <span style={{ color: '#8a95a3', fontWeight: 500 }}>
                {relativeTime(lastUpdated)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0 self-start pt-1">
        {/* Custom actions slot */}
        {actions}

        {/* Refresh */}
        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-ghost"
            title={lang === 'ar' ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw
              size={13}
              strokeWidth={2}
              className={refreshing ? 'animate-spin' : ''}
            />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        )}

        {/* Upload */}
        {showUpload && user?.role === 'admin' && (
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            <Upload size={13} strokeWidth={2} />
            {lang === 'ar' ? 'رفع بيانات' : 'Upload Data'}
          </button>
        )}
      </div>
    </div>
  );
}
