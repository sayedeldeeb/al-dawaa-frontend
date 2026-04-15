/**
 * AL-Dawaa Executive Intelligence Dashboard — Home Page
 * ======================================================
 * v4.0 — Sketch-based redesign
 *
 * STRUCTURE (per approved sketch):
 *  A. GLOBAL FILTER BAR      — date · range · project · region + active chips
 *  B. GLOBAL KPI STRIP       — 5 aggregate metrics (kept, not removed)
 *  C. PROJECT KPI CARDS      — per-project cards: invoiced + value + trend %
 *  D. MONTHLY TREND CHARTS   — Churned | Medical | YUSUR  (bar+line combo)
 *  E. DAILY TREND CHARTS     — Churned | Medical | YUSUR  (bar+line combo)
 *  F. EXTENDED PROJECTS      — High Value | AL-Dawaa Refill charts
 *  G. COMPARISON INSIGHTS    — Best · Lowest · Fastest Growth · Highest Value
 *  H. SMART INSIGHTS         — Auto-generated text insights from live data
 */
import React, {
  useEffect, useState, useCallback, useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, dataApi } from '../api/client';
import { Project } from '../types';
import { useAuthStore } from '../store/authStore';
import AlDawaaLogo from '../components/ui/AlDawaaLogo';
import {
  RefreshCw, Search, Filter, X,
  TrendingUp, TrendingDown, Download,
  ChevronUp, ChevronDown, Lightbulb, ArrowUpRight,
  Activity, Target, Award, CheckCircle2,
  AlertTriangle, Package, BarChart3, Layers,
  ShieldCheck, AlertCircle, Zap, BarChart2,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, AreaChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════════════════
export const PROJECT_COLORS: Record<string, string> = {
  'churned-customer': '#3b82f6',
  'yusur':            '#7c3aed',
  'medical-devices':  '#0891b2',
  'high-value':       '#d97706',
  'vip-files':        '#0ea5e9',
  'pill-pack':        '#f97316',
  'p2p':              '#4f46e5',
  'hybrid-pharmacy':  '#14b8a6',
};

const TERTIARY = '#00A651';

// The 5 primary projects shown in KPI Cards + chart grids
const PRIMARY_PROJECTS = ['churned-customer', 'medical-devices', 'yusur'];
const EXTENDED_PROJECTS = ['high-value', 'vip-files', 'hybrid-pharmacy'];

// ══════════════════════════════════════════════════════════════════════════════
// KPI EXTRACTION  (per project type — UNCHANGED)
// ══════════════════════════════════════════════════════════════════════════════
interface ProjectKPIs {
  orders:          number;
  invoiced:        number;
  invoicedLabel:   string;
  invoicedLabelAr: string;
  netValue:        number;
  successRate:     number;
}

function extractKPIs(projectId: string, kpi: any): ProjectKPIs {
  if (!kpi) return { orders: 0, invoiced: 0, invoicedLabel: 'Invoiced', invoicedLabelAr: 'مُصرَّف', netValue: 0, successRate: 0 };
  switch (projectId) {
    case 'medical-devices':
      return {
        orders:          kpi.totalPrescriptions || kpi.deliveredCount || 0,
        invoiced:        kpi.deliveredCount     || 0,
        invoicedLabel:   'Delivered',
        invoicedLabelAr: 'تم التسليم',
        netValue:        kpi.deliveredValue     || 0,
        successRate:     kpi.totalPrescriptions
          ? Math.round((kpi.deliveredCount / kpi.totalPrescriptions) * 100)
          : 0,
      };
    case 'yusur':
      return {
        orders:          kpi.totalOrders         || kpi.allocatedOrders || 0,
        invoiced:        kpi.invoices?.count      || kpi.fulfilledOrders || 0,
        invoicedLabel:   'BM Invoiced',
        invoicedLabelAr: 'فواتير BM',
        netValue:        kpi.invoices?.totalValue || 0,
        successRate:     kpi.fulfillmentRate      || (kpi.allocatedOrders
          ? Math.round(((kpi.fulfilledOrders || 0) / kpi.allocatedOrders) * 100)
          : 0),
      };
    case 'churned-customer':
    case 'hybrid-pharmacy':
    case 'vip-files':
    case 'high-value':
    case 'p2p':
    case 'pill-pack':
      return {
        orders:          kpi.uploaded        || kpi.totalUploaded  || 0,
        invoiced:        kpi.invoiced        || kpi.invoicedCount  || 0,
        invoicedLabel:   'Invoiced',
        invoicedLabelAr: 'مُفوتر',
        netValue:        kpi.netValue        || kpi.netValueTotal  || 0,
        successRate:     kpi.successRate     || 0,
      };
    default:
      return {
        orders:          kpi.totalUploaded   || kpi.totalDispensed || 0,
        invoiced:        kpi.totalDispensed  || 0,
        invoicedLabel:   'Invoiced',
        invoicedLabelAr: 'مُصرَّف',
        netValue:        kpi.netValue        || kpi.dispensedValue || 0,
        successRate:     kpi.successRate     || (kpi.totalUploaded
          ? Math.round(((kpi.totalDispensed || 0) / kpi.totalUploaded) * 100)
          : 0),
      };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS GENERATOR  (UNCHANGED)
// ══════════════════════════════════════════════════════════════════════════════
interface Insight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
  textEn: string;
  textAr: string;
}

function generateInsights(
  projects: Project[],
  kpiMap: Record<string, any>,
  trendMap: Record<string, any[]>,
): Insight[] {
  const insights: Insight[] = [];
  if (!projects.length) return insights;
  const withData = projects
    .map(p => ({ p, kpis: extractKPIs(p.id, kpiMap[p.id]) }))
    .filter(x => x.kpis.invoiced > 0);
  if (!withData.length) return insights;

  const top = [...withData].sort((a, b) => b.kpis.invoiced - a.kpis.invoiced)[0];
  insights.push({
    id: 'top', type: 'success', icon: '🏆',
    textEn: `${top.p.nameEn} leads with ${top.kpis.invoiced.toLocaleString()} invoiced`,
    textAr: `${top.p.nameAr} يتصدر بـ ${top.kpis.invoiced.toLocaleString()} سجل`,
  });

  const highVal = [...withData].sort((a, b) => b.kpis.netValue - a.kpis.netValue)[0];
  if (highVal && highVal.kpis.netValue > 0) {
    insights.push({
      id: 'highval', type: 'info', icon: '💰',
      textEn: `${highVal.p.nameEn} highest net value: ${highVal.kpis.netValue.toLocaleString()} SAR`,
      textAr: `أعلى صافي قيمة: ${highVal.p.nameAr} — ${highVal.kpis.netValue.toLocaleString()} ر.س`,
    });
  }

  const highRate = [...withData].sort((a, b) => b.kpis.successRate - a.kpis.successRate)[0];
  if (highRate && highRate.kpis.successRate > 0) {
    insights.push({
      id: 'rate', type: highRate.kpis.successRate >= 80 ? 'success' : 'warning',
      icon: highRate.kpis.successRate >= 80 ? '✅' : '⚠️',
      textEn: `${highRate.p.nameEn} highest success rate: ${highRate.kpis.successRate}%`,
      textAr: `أعلى معدل نجاح: ${highRate.p.nameAr} — ${highRate.kpis.successRate}%`,
    });
  }

  withData.forEach(({ p, kpis }) => {
    const trend = trendMap[p.id] || [];
    if (trend.length < 2) return;
    const latest = trend[trend.length - 1];
    const prev   = trend[trend.length - 2];
    if (!prev?.count || prev.count === 0) return;
    const change = ((latest.count - prev.count) / prev.count) * 100;
    if (change <= -10) {
      insights.push({
        id: `drop_${p.id}`, type: 'danger', icon: '📉',
        textEn: `${p.nameEn} dropped ${Math.abs(change).toFixed(0)}% vs previous period`,
        textAr: `${p.nameAr} انخفض بنسبة ${Math.abs(change).toFixed(0)}% مقارنة بالفترة السابقة`,
      });
    } else if (change >= 15) {
      insights.push({
        id: `rise_${p.id}`, type: 'success', icon: '📈',
        textEn: `${p.nameEn} grew ${change.toFixed(0)}% vs previous period`,
        textAr: `${p.nameAr} نما بنسبة ${change.toFixed(0)}% مقارنة بالفترة السابقة`,
      });
    }
  });

  const low = [...withData].sort((a, b) => a.kpis.invoiced - b.kpis.invoiced)[0];
  if (low && low.p.id !== top.p.id) {
    insights.push({
      id: 'lowest', type: 'warning', icon: '⚠️',
      textEn: `${low.p.nameEn} has lowest activity — needs review`,
      textAr: `${low.p.nameAr} أقل نشاطاً — يحتاج مراجعة`,
    });
  }
  return insights.slice(0, 7);
}

// ══════════════════════════════════════════════════════════════════════════════
// AGGREGATE TREND  (UNCHANGED)
// ══════════════════════════════════════════════════════════════════════════════
function buildAggregateTrend(trendMap: Record<string, any[]>, projectIds: string[]) {
  const map: Record<string, { name: string; count: number; value: number }> = {};
  projectIds.forEach(id => {
    (trendMap[id] || []).forEach((d: any) => {
      const k = d.month || d.name || '';
      if (!map[k]) map[k] = { name: k, count: 0, value: 0 };
      map[k].count += d.count || 0;
      map[k].value += d.value || 0;
    });
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const fmtVal = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 10_000    ? `${(n / 1_000).toFixed(1)}K` :
  n.toLocaleString();

const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(0)}K` :
  n.toLocaleString();

// ══════════════════════════════════════════════════════════════════════════════
// TREND BADGE  — shows ↑+X% or ↓-X%
// ══════════════════════════════════════════════════════════════════════════════
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null || pct === 0) return null;
  const up  = pct > 0;
  const abs = Math.abs(pct).toFixed(1);
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: up ? 'rgba(43,182,115,0.13)' : 'rgba(239,68,68,0.12)',
        color:      up ? '#166534' : '#991b1b',
      }}
    >
      {up ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
      {up ? '+' : ''}{abs}%
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOM CHART TOOLTIP  — shows date + count + value
// ══════════════════════════════════════════════════════════════════════════════
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e2535', border: 'none', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      color: '#fff', fontSize: 11, minWidth: 140,
    }}>
      <p style={{ fontWeight: 800, color: '#FFC200', marginBottom: 7, fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#fff', margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.65 }}>{p.name}:</span>
          <strong>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            {(p.name || '').toLowerCase().includes('value') || (p.name || '').includes('قيمة') ? ' SAR' : ''}
          </strong>
        </p>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT KPI CARD  (Section A)
// ══════════════════════════════════════════════════════════════════════════════
interface PKPICardProps {
  project:  Project;
  kpi:      any;
  trend:    any[];
  loading:  boolean;
  lang:     string;
  onClick:  () => void;
}
function ProjectKPICard({ project, kpi, trend, loading, lang, onClick }: PKPICardProps) {
  const color = PROJECT_COLORS[project.id] || '#3b82f6';
  const name  = lang === 'ar' ? project.nameAr : project.nameEn;
  const { invoiced, invoicedLabel, invoicedLabelAr, netValue, successRate, orders } = extractKPIs(project.id, kpi);

  // Trend % (last vs previous period)
  const last = trend?.[trend.length - 1];
  const prev = trend?.[trend.length - 2];
  const trendPct = (last && prev && prev.count > 0)
    ? ((last.count - prev.count) / prev.count) * 100
    : null;

  const valueTrendPct = (last && prev && prev.value > 0)
    ? ((last.value - prev.value) / prev.value) * 100
    : null;

  const hasData = invoiced > 0;

  return (
    <button
      onClick={onClick}
      className="project-tile-v3 w-full text-start"
      style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, background: color, width: '100%' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header: icon + name + status */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: color + '15' }}
          >
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate" style={{ color: '#1e2535' }}>{name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: hasData ? TERTIARY : '#d1d5db' }} />
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {hasData ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'لا بيانات' : 'No Data')}
              </span>
            </div>
          </div>
        </div>

        {/* Main KPIs */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 rounded-lg animate-pulse" style={{ background: '#f0f2f6', width: '70%' }} />
            <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f0f2f6', width: '55%' }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Invoiced */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9ca3af', letterSpacing: '0.06em' }}>
                {lang === 'ar' ? invoicedLabelAr : invoicedLabel}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black leading-none" style={{ fontSize: '2.2rem', color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                  {invoiced.toLocaleString()}
                </p>
                <TrendBadge pct={trendPct} />
              </div>
              <p className="text-xs mt-1" style={{ color: '#c8d0da' }}>
                {lang === 'ar' ? 'من' : 'of'} {orders.toLocaleString()} {lang === 'ar' ? 'طلب' : 'orders'}
              </p>
            </div>

            {/* Net Value */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9ca3af', letterSpacing: '0.06em' }}>
                {lang === 'ar' ? 'صافي القيمة' : 'Net Value'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black leading-none" style={{ fontSize: '1.8rem', color: '#1e2535', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                  {fmtShort(netValue)}
                  <span className="text-sm font-semibold ms-1" style={{ color: '#9ca3af' }}>SAR</span>
                </p>
                <TrendBadge pct={valueTrendPct} />
              </div>
            </div>
          </div>
        )}

        {/* Success rate bar */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {lang === 'ar' ? 'معدل النجاح' : 'Success Rate'}
              </span>
              <span
                className="text-sm font-black"
                style={{ color: successRate >= 80 ? TERTIARY : successRate >= 60 ? '#d97706' : '#ef4444' }}
              >
                {successRate}%
              </span>
            </div>
            <div style={{ height: 5, background: '#f0f2f6', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 10,
                width: `${Math.min(100, successRate)}%`,
                background: successRate >= 80 ? TERTIARY : successRate >= 60 ? '#FFC200' : '#ef4444',
                transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT CHART CARD  (Sections D/E/F)
// Dual-axis combo chart (bar = count, line = value)
// Peak & lowest highlighting • chart-type toggle • custom tooltip
// ══════════════════════════════════════════════════════════════════════════════
type ChartMode = 'combo' | 'bar' | 'line' | 'area';

interface ProjChartProps {
  project: Project;
  data:    any[];    // { name, count, value }
  period:  'monthly' | 'daily';
  lang:    string;
  loading: boolean;
}

function ProjectChartCard({ project, data, period, lang, loading }: ProjChartProps) {
  const [mode, setMode] = useState<ChartMode>('combo');
  const color = PROJECT_COLORS[project.id] || '#3b82f6';
  const name  = lang === 'ar' ? project.nameAr : project.nameEn;

  const chartData = data.slice(-24); // Cap at 24 points

  // Find peak and lowest indices
  const peakIdx = chartData.reduce((best, d, i) =>
    (d.count || 0) > (chartData[best]?.count || 0) ? i : best, 0);
  const minIdx  = chartData.reduce((best, d, i) =>
    (d.count || 0) < (chartData[best]?.count || 0) ? i : best, 0);

  const isEmpty = !loading && chartData.length === 0;

  const CHART_MODES: { id: ChartMode; labelEn: string; labelAr: string }[] = [
    { id: 'combo', labelEn: 'Combo',  labelAr: 'مدمج' },
    { id: 'bar',   labelEn: 'Bars',   labelAr: 'أعمدة' },
    { id: 'line',  labelEn: 'Lines',  labelAr: 'خطوط' },
    { id: 'area',  labelEn: 'Area',   labelAr: 'مساحة' },
  ];

  return (
    <div className="chart-v3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: color + '15' }}
          >
            {project.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: '#1e2535' }}>{name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {period === 'monthly'
                ? (lang === 'ar' ? 'الاتجاه الشهري' : 'Monthly trend')
                : (lang === 'ar' ? 'الاتجاه اليومي' : 'Daily trend')
              }
              {' · '}{lang === 'ar' ? 'عدد + قيمة' : 'count + value'}
            </p>
          </div>
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center gap-0.5 flex-shrink-0" style={{
          background: '#f4f6fa', borderRadius: 8, padding: 2,
        }}>
          {CHART_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="text-xs font-semibold px-2 py-1 rounded-md transition-all"
              style={{
                background:  mode === m.id ? '#3b82f6' : 'transparent',
                color:       mode === m.id ? '#fff' : '#9ca3af',
                fontSize:    10.5,
              }}
            >
              {lang === 'ar' ? m.labelAr : m.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3" style={{ fontSize: 11, color: '#9ca3af' }}>
        {(mode === 'combo' || mode === 'bar') && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ background: color }} />
            {lang === 'ar' ? 'العدد' : 'Count'}
          </span>
        )}
        {(mode === 'combo' || mode === 'line') && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed inline-block" style={{ borderColor: '#FFC200' }} />
            {lang === 'ar' ? 'القيمة (ر.س)' : 'Value (SAR)'}
          </span>
        )}
        {data.length > 0 && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FFC200', border: '2px solid white', boxShadow: '0 0 0 1px #FFC200' }} />
              {lang === 'ar' ? 'الذروة' : 'Peak'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#ef4444', border: '2px solid white', boxShadow: '0 0 0 1px #ef4444' }} />
              {lang === 'ar' ? 'الأدنى' : 'Low'}
            </span>
          </>
        )}
      </div>

      {/* Chart body */}
      {loading ? (
        <div className="rounded-xl animate-pulse" style={{ height: 210, background: '#f0f2f6' }} />
      ) : isEmpty ? (
        <div style={{ height: 210 }} className="flex flex-col items-center justify-center">
          <BarChart2 size={32} style={{ color: '#e5e7eb', marginBottom: 8 }} />
          <p className="text-sm" style={{ color: '#c8d0da' }}>
            {lang === 'ar' ? 'لا توجد بيانات' : 'No data yet — upload to see trends'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          {mode === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 18, right: 50, left: -10, bottom: 2 }}>
              <defs>
                <linearGradient id={`areaG_${project.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`areaV_${project.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FFC200" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FFC200" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right"
                tick={{ fontSize: 9, fill: '#b45309' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => fmtShort(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Area yAxisId="l" type="monotone" dataKey="count"
                name={lang === 'ar' ? 'العدد' : 'Count'}
                stroke={color} strokeWidth={2.5}
                fill={`url(#areaG_${project.id})`}
                dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
              <Area yAxisId="r" type="monotone" dataKey="value"
                name={lang === 'ar' ? 'القيمة' : 'Value (SAR)'}
                stroke="#FFC200" strokeWidth={2}
                fill={`url(#areaV_${project.id})`} strokeDasharray="5 3"
                dot={false} activeDot={{ r: 4, fill: '#FFC200', strokeWidth: 0 }} />
            </AreaChart>
          ) : mode === 'line' ? (
            <ComposedChart data={chartData} margin={{ top: 18, right: 50, left: -10, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right"
                tick={{ fontSize: 9, fill: '#b45309' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => fmtShort(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Line yAxisId="l" type="monotone" dataKey="count"
                name={lang === 'ar' ? 'العدد' : 'Count'}
                stroke={color} strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, index: i } = props;
                  if (i === peakIdx) return <circle key={cx} cx={cx} cy={cy} r={5} fill="#FFC200" stroke="white" strokeWidth={2} />;
                  if (i === minIdx)  return <circle key={cx} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />;
                  return <circle key={cx} cx={cx} cy={cy} r={2.5} fill={color} strokeWidth={0} />;
                }}
                activeDot={{ r: 5, fill: color, strokeWidth: 0 }} />
              <Line yAxisId="r" type="monotone" dataKey="value"
                name={lang === 'ar' ? 'القيمة' : 'Value (SAR)'}
                stroke="#FFC200" strokeWidth={2} strokeDasharray="5 3"
                dot={false} activeDot={{ r: 4, fill: '#FFC200', strokeWidth: 0 }} />
            </ComposedChart>
          ) : (
            /* combo or bar */
            <ComposedChart data={chartData} margin={{ top: 20, right: 50, left: -10, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right"
                tick={{ fontSize: 9, fill: '#b45309' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => fmtShort(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Bar yAxisId="l" dataKey="count"
                name={lang === 'ar' ? 'العدد' : 'Count'}
                radius={[4,4,0,0]} maxBarSize={34}>
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={
                    i === peakIdx ? '#FFC200' :
                    i === minIdx  ? '#ef4444' :
                    color
                  } />
                ))}
              </Bar>
              {mode === 'combo' && (
                <Line yAxisId="r" type="monotone" dataKey="value"
                  name={lang === 'ar' ? 'القيمة' : 'Value (SAR)'}
                  stroke="#FFC200" strokeWidth={2.5} strokeDasharray="6 3"
                  dot={(props: any) => {
                    const { cx, cy } = props;
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill="#FFC200" strokeWidth={0} />;
                  }}
                  activeDot={{ r: 5, fill: '#FFC200', stroke: 'white', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Peak / Low summary */}
      {!loading && chartData.length > 0 && (
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#FFC200' }} />
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              {lang === 'ar' ? 'ذروة:' : 'Peak:'}{' '}
              <strong style={{ color: '#1e2535' }}>{chartData[peakIdx]?.name}</strong>
              {' — '}{chartData[peakIdx]?.count?.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              {lang === 'ar' ? 'أدنى:' : 'Low:'}{' '}
              <strong style={{ color: '#1e2535' }}>{chartData[minIdx]?.name}</strong>
              {' — '}{chartData[minIdx]?.count?.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPARISON CARD  (Section G)
// ══════════════════════════════════════════════════════════════════════════════
interface CompCardProps {
  category:   string;
  categoryAr: string;
  Icon:       React.ElementType;
  iconColor:  string;
  project:    Project | null;
  metric:     string;
  metricSub:  string;
  lang:       string;
  trend?:     any[];
  onClick:    () => void;
}
function ComparisonCard({ category, categoryAr, Icon, iconColor, project, metric, metricSub, lang, trend, onClick }: CompCardProps) {
  const name = project ? (lang === 'ar' ? project.nameAr : project.nameEn) : '—';
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconColor + '15' }}
        >
          <Icon size={18} strokeWidth={1.8} style={{ color: iconColor }} />
        </div>
        {project && (
          <span className="text-xl">{project.icon}</span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
        {lang === 'ar' ? categoryAr : category}
      </p>
      <p className="text-sm font-bold mb-2" style={{ color: '#1e2535' }}>{name}</p>
      <p className="text-2xl font-black leading-none" style={{ color: iconColor, fontFeatureSettings: "'tnum'", letterSpacing: '-0.04em' }}>
        {metric}
      </p>
      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{metricSub}</p>
      {/* Mini sparkline */}
      {trend && trend.length > 2 && (
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={32}>
            <AreaChart data={trend.slice(-8)} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={`cg_${category.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={iconColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={iconColor} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count"
                stroke={iconColor} strokeWidth={1.8}
                fill={`url(#cg_${category.replace(/\s/g, '')})`}
                dot={false} activeDot={{ r: 2, fill: iconColor, strokeWidth: 0 }}
              />
              <Tooltip content={<ChartTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER  (v3 — with icon)
// ══════════════════════════════════════════════════════════════════════════════
function SectionHd({
  en, ar, sub, Icon, lang, action,
}: {
  en: string; ar: string; sub?: string;
  Icon: React.ElementType; lang: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-hd">
      <div className="section-hd-icon">
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="section-hd-title">{lang === 'ar' ? ar : en}</p>
        {sub && <p className="section-hd-sub">{sub}</p>}
      </div>
      {action && <div className="section-hd-action">{action}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { lang, user }  = useAuthStore();
  const navigate        = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────
  const [projects,   setProjects]   = useState<Project[]>([]);
  const [kpiMap,     setKpiMap]     = useState<Record<string, any>>({});
  const [trendMap,   setTrendMap]   = useState<Record<string, any[]>>({});
  const [dailyMap,   setDailyMap]   = useState<Record<string, any[]>>({});
  const [regionMap,  setRegionMap]  = useState<Record<string, any[]>>({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [regionFilter,  setRegionFilter]  = useState('');
  const [searchFilter,  setSearchFilter]  = useState('');
  const [selectedProjs, setSelectedProjs] = useState<string[]>([]);
  const [filterOpen,    setFilterOpen]    = useState(false);

  // ── Table sort ────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<'orders'|'invoiced'|'netValue'|'successRate'>('invoiced');
  const [sortAsc,   setSortAsc]   = useState(false);

  const apiFilters = useMemo(() => {
    const f: Record<string, any> = {};
    if (regionFilter.trim()) f.region = [regionFilter.trim()];
    return f;
  }, [regionFilter]);

  // ── Active filter chips ───────────────────────────────────────────────
  const activeFilters = useMemo(() => {
    const chips: { id: string; label: string }[] = [];
    if (dateFrom)               chips.push({ id: 'from',   label: `${lang === 'ar' ? 'من:' : 'From:'} ${dateFrom}` });
    if (dateTo)                 chips.push({ id: 'to',     label: `${lang === 'ar' ? 'إلى:' : 'To:'} ${dateTo}` });
    if (regionFilter)           chips.push({ id: 'region', label: `${lang === 'ar' ? 'المنطقة:' : 'Region:'} ${regionFilter}` });
    if (searchFilter)           chips.push({ id: 'search', label: `${lang === 'ar' ? 'بحث:' : 'Search:'} ${searchFilter}` });
    selectedProjs.forEach(id => {
      const p = projects.find(x => x.id === id);
      if (p) chips.push({ id: `proj_${id}`, label: lang === 'ar' ? p.nameAr : p.nameEn });
    });
    return chips;
  }, [dateFrom, dateTo, regionFilter, searchFilter, selectedProjs, projects, lang]);

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setRegionFilter('');
    setSearchFilter(''); setSelectedProjs([]);
  };

  const removeChip = (id: string) => {
    if (id === 'from')   { setDateFrom('');    return; }
    if (id === 'to')     { setDateTo('');      return; }
    if (id === 'region') { setRegionFilter(''); return; }
    if (id === 'search') { setSearchFilter(''); return; }
    if (id.startsWith('proj_')) {
      const pid = id.replace('proj_', '');
      setSelectedProjs(prev => prev.filter(x => x !== pid));
    }
  };

  const toggleProj = (id: string) =>
    setSelectedProjs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Load data ─────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (initial: boolean) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const projRes  = await projectsApi.list();
      const projs: Project[] = projRes.data || [];
      setProjects(projs);

      const results = await Promise.all(
        projs.map(async (p: Project) => {
          const [kpiRes, trendRes, regionRes, dailyRes] = await Promise.all([
            dataApi.kpis(p.id, apiFilters).catch(() => ({ data: null })),
            dataApi.chart(p.id, 'trend',  apiFilters).catch(() => ({ data: [] })),
            dataApi.chart(p.id, 'region', apiFilters).catch(() => ({ data: [] })),
            dataApi.chart(p.id, 'daily',  apiFilters).catch(() => ({ data: [] })),
          ]);
          const trend  = ((trendRes  as any).data || []).map((d: any) => ({ ...d, name: d.month || d.name }));
          const region = ((regionRes as any).data || []);
          const daily  = ((dailyRes  as any).data || []).map((d: any) => ({ ...d, name: d.date  || d.day || d.name }));
          return { id: p.id, kpi: (kpiRes as any).data, trend, region, daily };
        })
      );

      const km: Record<string, any>   = {};
      const tm: Record<string, any[]> = {};
      const rm: Record<string, any[]> = {};
      const dm: Record<string, any[]> = {};
      results.forEach(r => { km[r.id] = r.kpi; tm[r.id] = r.trend; rm[r.id] = r.region; dm[r.id] = r.daily; });
      setKpiMap(km); setTrendMap(tm); setRegionMap(rm); setDailyMap(dm);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [apiFilters]);

  useEffect(() => { loadDashboard(true); }, [loadDashboard]);

  // ── Client-side filtering ─────────────────────────────────────────────
  const filteredProjects = useMemo(() => projects.filter(p => {
    if (selectedProjs.length > 0 && !selectedProjs.includes(p.id)) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      if (!p.nameEn.toLowerCase().includes(q) && !(p.nameAr || '').includes(searchFilter)) return false;
    }
    return true;
  }), [projects, selectedProjs, searchFilter]);

  // ── Global KPIs (UNCHANGED — kept) ───────────────────────────────────
  const globalKPIs = useMemo(() => {
    let totalOrders   = 0;
    let totalInvoiced = 0;
    let totalNetValue = 0;
    let rateSum       = 0;
    let rateCount     = 0;
    let active        = 0;
    filteredProjects.forEach(p => {
      const k = extractKPIs(p.id, kpiMap[p.id]);
      totalOrders   += k.orders;
      totalInvoiced += k.invoiced;
      totalNetValue += k.netValue;
      if (k.successRate > 0) { rateSum += k.successRate; rateCount++; }
      if (k.invoiced > 0) active++;
    });
    return { totalOrders, totalInvoiced, totalNetValue, avgSuccessRate: rateCount > 0 ? Math.round(rateSum / rateCount) : 0, activeProjects: active };
  }, [filteredProjects, kpiMap]);

  // ── Aggregate trend (UNCHANGED — kept) ───────────────────────────────
  const aggregateTrend = useMemo(() =>
    buildAggregateTrend(trendMap, filteredProjects.map(p => p.id)),
    [filteredProjects, trendMap]
  );

  // ── Smart Insights (UNCHANGED) ────────────────────────────────────────
  const insights = useMemo(
    () => generateInsights(filteredProjects, kpiMap, trendMap),
    [filteredProjects, kpiMap, trendMap]
  );

  // ── Comparison data ───────────────────────────────────────────────────
  const comparisonData = useMemo(() => {
    const withData = filteredProjects.map(p => ({
      project: p,
      kpis:    extractKPIs(p.id, kpiMap[p.id]),
      trend:   trendMap[p.id] || [],
    })).filter(x => x.kpis.invoiced > 0);
    if (!withData.length) return null;

    const sorted     = [...withData].sort((a, b) => b.kpis.invoiced - a.kpis.invoiced);
    const best       = sorted[0];
    const lowest     = sorted[sorted.length - 1];
    const highestVal = [...withData].sort((a, b) => b.kpis.netValue - a.kpis.netValue)[0];

    const withGrowth = withData.map(x => {
      const t    = x.trend;
      const last = t?.[t.length - 1];
      const prev = t?.[t.length - 2];
      const g    = (last && prev && prev.count > 0)
        ? ((last.count - prev.count) / prev.count) * 100 : 0;
      return { ...x, growth: g };
    }).filter(x => x.growth > 0);
    const fastest = withGrowth.sort((a, b) => b.growth - a.growth)[0] || { ...best, growth: 0 };

    return { best, lowest, highestVal, fastest };
  }, [filteredProjects, kpiMap, trendMap]);

  // ── Table rows (kept) ─────────────────────────────────────────────────
  const tableRows = useMemo(() => {
    return filteredProjects
      .map(p => {
        const k = extractKPIs(p.id, kpiMap[p.id]);
        return { project: p, orders: k.orders, invoiced: k.invoiced, netValue: k.netValue, successRate: k.successRate };
      })
      .sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return sortAsc ? diff : -diff;
      });
  }, [filteredProjects, kpiMap, sortField, sortAsc]);

  const toggleSort = (f: typeof sortField) => {
    if (sortField === f) setSortAsc(v => !v);
    else { setSortField(f); setSortAsc(false); }
  };

  // ── Export CSV ────────────────────────────────────────────────────────
  const exportTable = () => {
    const header = 'Rank,Project,Orders,Invoiced,Net Value (SAR),Success Rate (%),Last Update\n';
    const rows   = tableRows.map((r, i) =>
      `${i+1},"${r.project.nameEn}",${r.orders},${r.invoiced},${r.netValue},${r.successRate},"${r.project.lastUpdatedAt || '—'}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'al-dawaa-executive-summary.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const Sk = ({ h = 'h-10' }: { h?: string }) => (
    <div className={`animate-pulse rounded-xl ${h}`} style={{ background: '#f0f2f6' }} />
  );

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
      : <ChevronDown size={11} style={{ opacity: 0.3 }} />;

  const insightStyle = (type: Insight['type']) => ({
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    danger:  { bg: '#fff1f2', border: '#fecdd3', text: '#991b1b' },
  }[type]);

  // Helper: get project by id
  const getProject = (id: string) => filteredProjects.find(p => p.id === id);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen fade-in" style={{ background: '#f8fafc' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          EXECUTIVE CONTROL BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-3 max-w-[1700px] mx-auto">
          {/* Logo + title */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <AlDawaaLogo size={30} variant="pill" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-sm leading-tight tracking-tight" style={{ color: '#111827' }}>AL-Dawaa Analytics</p>
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#16a34a' }}>
                  <span className="live-dot" />LIVE
                </span>
              </div>
              <p className="text-xs" style={{ color: '#9ca3af', marginTop: 1 }}>
                {lang === 'ar' ? 'لوحة القيادة التنفيذية' : 'Executive Intelligence Platform'}
              </p>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9ca3af' }} />
              <input
                className="rounded-xl ps-8 pe-3 py-2 text-sm focus:outline-none transition-all"
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                  width: 200,
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid #3b82f6'; e.currentTarget.style.background = '#fff'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid #e5e7eb'; e.currentTarget.style.background = '#f9fafb'; }}
                placeholder={lang === 'ar' ? '🔍 ابحث في المشاريع...' : 'Search projects...'}
                value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
            </div>
            {/* Date from */}
            <input type="date" title={lang === 'ar' ? 'من' : 'From'}
              className="rounded-lg px-2 py-1.5 text-xs focus:outline-none w-[124px]"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            {/* Date to */}
            <input type="date" title={lang === 'ar' ? 'إلى' : 'To'}
              className="rounded-lg px-2 py-1.5 text-xs focus:outline-none w-[124px]"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
            {/* Region */}
            <input
              className="rounded-lg px-2.5 py-1.5 text-xs focus:outline-none w-[95px]"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              placeholder={lang === 'ar' ? 'المنطقة' : 'Region...'}
              value={regionFilter} onChange={e => setRegionFilter(e.target.value)} />
            {/* Projects filter toggle */}
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filterOpen || selectedProjs.length ? '#eff6ff' : '#f9fafb',
                border: filterOpen || selectedProjs.length ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                color: filterOpen || selectedProjs.length ? '#3b82f6' : '#6b7280',
              }}
            >
              <Filter size={11} />
              {selectedProjs.length ? `${selectedProjs.length} ${lang === 'ar' ? 'مشروع' : 'proj.'}` : (lang === 'ar' ? 'المشاريع' : 'Projects')}
            </button>
            {/* Reset filters */}
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
              >
                <X size={11} />
                {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
            {/* Refresh */}
            <button
              onClick={() => loadDashboard(false)} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all"
              style={{ color: '#6b7280', borderColor: '#e5e7eb', background: '#f9fafb' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {lang === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
            {/* User */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#e5a93d,#c98f2a)', color: '#fff' }}>
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium" style={{ color: '#374151' }}>{lang === 'ar' ? user?.fullNameAr : user?.fullName}</span>
              <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                style={{ background: '#eff6ff', color: '#3b82f6' }}>{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Project pill row (expandable) */}
        {filterOpen && (
          <div className="px-6 pb-3 pt-2.5 flex flex-wrap gap-1.5 max-w-[1700px] mx-auto"
            style={{ borderTop: '1px solid #f3f4f6' }}>
            {projects.map(p => {
              const on = selectedProjs.includes(p.id);
              const c  = PROJECT_COLORS[p.id] || '#3b82f6';
              return (
                <button key={p.id} onClick={() => toggleProj(p.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={on
                    ? { background: c, color: '#fff', borderColor: c }
                    : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
                  }
                >
                  <span>{p.icon}</span>
                  <span>{lang === 'ar' ? p.nameAr : p.nameEn}</span>
                  {on && <X size={9} />}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Page Body ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 max-w-[1700px] mx-auto space-y-8">

        {/* ── ACTIVE FILTER CHIPS ─────────────────────────────────────────── */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
              {lang === 'ar' ? 'فلاتر نشطة:' : 'Active filters:'}
            </span>
            {activeFilters.map(chip => (
              <span
                key={chip.id}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all"
                style={{ background: '#eff6ff', color: '#3b82f6', borderColor: '#bfdbfe' }}
              >
                {chip.label}
                <button onClick={() => removeChip(chip.id)} className="flex items-center" style={{ color: '#9ca3af' }}>
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            C. PROJECT KPI CARDS  (Churned · Medical · YUSUR · High Value · Refill)
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Project KPI Cards" ar="بطاقات مؤشرات المشاريع"
            sub={lang === 'ar' ? 'مُصرَّف · قيمة · اتجاه % لكل مشروع' : 'Invoiced · Net Value · Trend % per project'}
            Icon={BarChart3} lang={lang}
          />

          {/* KPI Cards: 5 primary projects (3 main + 2 extended) */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Sk key={i} h="h-52" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...PRIMARY_PROJECTS, ...EXTENDED_PROJECTS].map(pid => {
                const p = getProject(pid);
                if (!p) return null;
                return (
                  <ProjectKPICard
                    key={pid} project={p}
                    kpi={kpiMap[pid]} trend={trendMap[pid] || []}
                    loading={false} lang={lang}
                    onClick={() => navigate(`/projects/${pid}`)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            D. MONTHLY TREND CHARTS  —  Churned | Medical | YUSUR
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Monthly Trend Charts" ar="مخططات الاتجاه الشهري"
            sub={lang === 'ar' ? 'اتجاه شهري: عدد + قيمة · تحديد الذروة والأدنى تلقائياً' : 'Monthly trend — count + value · Peak & lowest auto-highlighted'}
            Icon={Activity} lang={lang}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {PRIMARY_PROJECTS.map(pid => {
              const p = getProject(pid);
              if (!p) return null;
              return (
                <ProjectChartCard
                  key={`monthly_${pid}`}
                  project={p}
                  data={trendMap[pid] || []}
                  period="monthly"
                  lang={lang}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            E. DAILY TREND CHARTS  —  Churned | Medical | YUSUR
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Daily Trend Charts" ar="مخططات الاتجاه اليومي"
            sub={lang === 'ar' ? 'اتجاه يومي: عدد + قيمة · نفس هيكل المخططات الشهرية' : 'Daily breakdown — count + value · Same structure as monthly'}
            Icon={Activity} lang={lang}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {PRIMARY_PROJECTS.map(pid => {
              const p = getProject(pid);
              if (!p) return null;
              const daily = dailyMap[pid] || [];
              // If no daily data, use monthly as fallback
              const data = daily.length > 0 ? daily : (trendMap[pid] || []);
              return (
                <ProjectChartCard
                  key={`daily_${pid}`}
                  project={p}
                  data={data}
                  period="daily"
                  lang={lang}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            F. EXTENDED PROJECTS  —  High Value | AL-Dawaa Refill
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Extended Projects" ar="المشاريع الممتدة"
            sub={lang === 'ar' ? 'High Value · إعادة تعبئة الدواء — اتجاه شهري ويومي' : 'High Value · AL-Dawaa Refill — monthly & daily trends'}
            Icon={Layers} lang={lang}
          />
          {/* Monthly */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
            {lang === 'ar' ? '● شهري' : '● Monthly'}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {EXTENDED_PROJECTS.map(pid => {
              const p = getProject(pid);
              if (!p) return null;
              return (
                <ProjectChartCard
                  key={`ext_m_${pid}`}
                  project={p}
                  data={trendMap[pid] || []}
                  period="monthly"
                  lang={lang}
                  loading={loading}
                />
              );
            })}
          </div>
          {/* Daily */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
            {lang === 'ar' ? '● يومي' : '● Daily'}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {EXTENDED_PROJECTS.map(pid => {
              const p = getProject(pid);
              if (!p) return null;
              const daily = dailyMap[pid] || [];
              const data  = daily.length > 0 ? daily : (trendMap[pid] || []);
              return (
                <ProjectChartCard
                  key={`ext_d_${pid}`}
                  project={p}
                  data={data}
                  period="daily"
                  lang={lang}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            G. COMPARISON INSIGHTS  (Best · Lowest · Fastest · Highest Value)
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Comparison Insights" ar="مقارنة الأداء"
            sub={lang === 'ar' ? 'الأفضل · الأضعف · الأسرع نمواً · الأعلى قيمة' : 'Best · Lowest · Fastest growth · Highest value'}
            Icon={Award} lang={lang}
          />
          {loading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Sk key={i} h="h-44" />)}
            </div>
          ) : !comparisonData ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
              <Zap size={32} className="mx-auto mb-3" style={{ color: '#e5e7eb' }} />
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {lang === 'ar' ? 'ارفع بيانات لعرض المقارنة' : 'Upload data to view comparison insights'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <ComparisonCard
                category="Best Performing"  categoryAr="الأفضل أداءً"
                Icon={Award} iconColor="#FFC200"
                project={comparisonData.best.project}
                metric={comparisonData.best.kpis.invoiced.toLocaleString()}
                metricSub={lang === 'ar' ? 'مُصرَّف (الأعلى)' : 'invoiced (highest)'}
                lang={lang} trend={trendMap[comparisonData.best.project.id]}
                onClick={() => navigate(`/projects/${comparisonData.best.project.id}`)}
              />
              <ComparisonCard
                category="Needs Attention" categoryAr="يحتاج مراجعة"
                Icon={AlertTriangle} iconColor="#ef4444"
                project={comparisonData.lowest.project}
                metric={comparisonData.lowest.kpis.invoiced.toLocaleString()}
                metricSub={lang === 'ar' ? 'مُصرَّف (الأدنى)' : 'invoiced (lowest)'}
                lang={lang} trend={trendMap[comparisonData.lowest.project.id]}
                onClick={() => navigate(`/projects/${comparisonData.lowest.project.id}`)}
              />
              <ComparisonCard
                category="Fastest Growth"  categoryAr="أسرع نمو"
                Icon={TrendingUp} iconColor={TERTIARY}
                project={comparisonData.fastest.project}
                metric={`+${comparisonData.fastest.growth?.toFixed(1)}%`}
                metricSub={lang === 'ar' ? 'نمو مقارنة بالسابق' : 'growth vs previous period'}
                lang={lang} trend={trendMap[comparisonData.fastest.project.id]}
                onClick={() => navigate(`/projects/${comparisonData.fastest.project.id}`)}
              />
              <ComparisonCard
                category="Highest Value"   categoryAr="أعلى قيمة"
                Icon={Target} iconColor="#7c3aed"
                project={comparisonData.highestVal.project}
                metric={`${fmtVal(comparisonData.highestVal.kpis.netValue)} SAR`}
                metricSub={lang === 'ar' ? 'صافي القيمة الأعلى' : 'highest net value (SAR)'}
                lang={lang} trend={trendMap[comparisonData.highestVal.project.id]}
                onClick={() => navigate(`/projects/${comparisonData.highestVal.project.id}`)}
              />
            </div>
          )}
        </div>

        {/* Smart Insights section removed per user request */}

        {/* ════════════════════════════════════════════════════════════════════
            EXECUTIVE SUMMARY TABLE  (kept — sortable, ranked, exportable)
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <SectionHd
            en="Executive Summary Table" ar="جدول الملخص التنفيذي"
            sub={lang === 'ar' ? 'فرز · تصفية · تصدير' : 'Sortable · Filterable · Exportable'}
            Icon={ShieldCheck} lang={lang}
            action={
              <button
                onClick={exportTable}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white hover:opacity-85 transition-opacity"
                style={{ background: '#3b82f6' }}
              >
                <Download size={13} />
                {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </button>
            }
          />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Sk key={i} h="h-12" />)}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th className="px-4 py-3 text-start" style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', width: 44 }}>#</th>
                    <th className="px-5 py-3 text-start" style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'المشروع' : 'Project'}
                    </th>
                    {([
                      ['orders',      'Total Orders',   'الطلبات'],
                      ['invoiced',    'Invoiced',       'المُصرَّف'],
                      ['netValue',    'Net Value',      'صافي القيمة'],
                      ['successRate', 'Success %',      'النجاح %'],
                    ] as [typeof sortField, string, string][]).map(([f, en, ar]) => (
                      <th key={f} onClick={() => toggleSort(f)}
                        className="px-5 py-3 text-end cursor-pointer select-none"
                        style={{ color: sortField === f ? '#3b82f6' : '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        <span className="inline-flex items-center justify-end gap-1">
                          {lang === 'ar' ? ar : en}<SortIcon field={f} />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-end" style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'آخر تحديث' : 'Last Update'}
                    </th>
                    <th className="px-5 py-3 text-center" style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'فتح' : 'Open'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color: '#9ca3af' }}>
                      {lang === 'ar' ? 'لا توجد بيانات — ارفع ملفات Excel للبدء' : 'No data — upload Excel files to begin'}
                    </td></tr>
                  ) : tableRows.map((row, idx) => {
                    const color   = PROJECT_COLORS[row.project.id] || '#3b82f6';
                    const pName   = lang === 'ar' ? row.project.nameAr : row.project.nameEn;
                    const rankCls = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                    const sPill   = row.invoiced === 0 ? 'success-pill success-pill-none' :
                      row.successRate >= 80 ? 'success-pill success-pill-excellent' :
                      row.successRate >= 60 ? 'success-pill success-pill-good' :
                      row.successRate >= 40 ? 'success-pill success-pill-fair' :
                      'success-pill success-pill-critical';
                    return (
                      <tr key={row.project.id} className="exec-table-row border-b" style={{ borderColor: '#f3f4f6' }}>
                        <td className="px-4 py-4">
                          <div className={`rank-badge ${rankCls} mx-auto`}>#{idx+1}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                              style={{ background: color + '15' }}>{row.project.icon}</div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: '#1e2535' }}>{pName}</p>
                              <p className="text-xs" style={{ color: '#c8d0da' }}>{row.project.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <p className="text-sm font-semibold" style={{ color: '#374151' }}>{row.orders.toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <p className="text-sm font-bold" style={{ color }}>{row.invoiced.toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <p className="text-sm font-semibold" style={{ color: '#374151' }}>
                            {row.netValue.toLocaleString()}
                            <span className="text-xs font-normal ms-1" style={{ color: '#9ca3af' }}>SAR</span>
                          </p>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 rounded-full overflow-hidden hidden sm:block" style={{ height: 4, background: '#f3f4f6' }}>
                              <div className="h-full rounded-full" style={{
                                width: `${Math.min(100, row.successRate)}%`,
                                background: row.successRate >= 80 ? TERTIARY : row.successRate >= 60 ? '#FFC200' : '#ef4444',
                              }} />
                            </div>
                            <span className={sPill}>{row.successRate > 0 ? `${row.successRate}%` : (lang === 'ar' ? 'لا بيانات' : 'No Data')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <span className="text-xs" style={{ color: '#9ca3af' }}>
                            {row.project.lastUpdatedAt
                              ? new Date(row.project.lastUpdatedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => navigate(`/projects/${row.project.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-80 transition-opacity"
                            style={{ background: color }}
                          >
                            {lang === 'ar' ? 'فتح' : 'Open'}<ArrowUpRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {tableRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
                      <td colSpan={2} className="px-5 py-3.5">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                          {lang === 'ar' ? 'الإجمالي' : 'Platform Total'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <span className="text-sm font-bold" style={{ color: '#1e2535' }}>{globalKPIs.totalOrders.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>{globalKPIs.totalInvoiced.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <span className="text-sm font-bold" style={{ color: '#1e2535' }}>
                          {globalKPIs.totalNetValue.toLocaleString()}
                          <span className="text-xs font-normal ms-1" style={{ color: '#9ca3af' }}>SAR</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <span className="text-sm font-bold" style={{ color: globalKPIs.avgSuccessRate >= 80 ? TERTIARY : globalKPIs.avgSuccessRate >= 60 ? '#d97706' : '#ef4444' }}>
                          {globalKPIs.avgSuccessRate}%
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#c8d0da' }}>
            AL-Dawaa Analytics Platform · v4.0 ·{' '}
            {lang === 'ar'
              ? 'لوحة تحكم تنفيذية — مدعومة بالبيانات الحية'
              : 'Executive Intelligence Dashboard — Powered by live data'}
          </p>
        </div>
      </div>
    </div>
  );
}
