import React, { useEffect, useState, useCallback } from 'react';
import { dataApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { FilterState, KPIData } from '../../types';
import KPICard from '../../components/ui/KPICard';
import DataTable, { StatusBadge, Column } from '../../components/ui/DataTable';
import FilterPanel from '../../components/ui/FilterPanel';
import RankingWidget from '../../components/ui/RankingWidget';
import DashboardControls from '../../components/ui/DashboardControls';
import { Upload, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LabelList,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const FAIL_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4'];
const TOOLTIP_STYLE = { background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' };

/* ── Reference-style KPI tile ─────────────────────────────────────────── */
interface KPITileProps {
  label: string; count: number; pct?: number; pctLabel?: string;
  icon: string; iconBg: string; danger?: boolean; loading?: boolean;
}
function KPITile({ label, count, pct, pctLabel, icon, iconBg, danger, loading }: KPITileProps) {
  if (loading) return (
    <div className="ref-kpi-card" style={{ minHeight: 100 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3f4f6', animation: 'pulse 2s infinite', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '60%', marginBottom: 8 }} />
        <div style={{ height: 22, background: '#f3f4f6', borderRadius: 4, width: '40%' }} />
      </div>
    </div>
  );
  const pctColor = danger
    ? (pct! > 20 ? '#dc2626' : pct! > 10 ? '#d97706' : '#16a34a')
    : (pct! >= 80 ? '#16a34a' : pct! >= 60 ? '#d97706' : '#dc2626');

  return (
    <div className="ref-kpi-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <div className="ref-kpi-icon" style={{ background: iconBg }}>{icon}</div>
        <div>
          <div className="ref-kpi-label">{label}</div>
          <div className="ref-kpi-value">{count.toLocaleString()}</div>
        </div>
      </div>
      {pct !== undefined && (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: pctColor }}>{pct}%</span>
            {pctLabel && <span style={{ fontSize: 11, color: '#9ca3af' }}>{pctLabel}</span>}
          </div>
          <div style={{ height: 5, borderRadius: 99, background: '#f3f4f6' }}>
            <div style={{ height: 5, borderRadius: 99, width: `${Math.min(pct, 100)}%`, background: pctColor }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function YUSURPage() {
  const { t, lang, user } = useAuthStore();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [failureData, setFailureData] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({});
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { dataApi.filterOptions('yusur').then(r => setFilterOptions(r.data || {})); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [k, trend, region, fail, rank, recs] = await Promise.all([
        dataApi.kpis('yusur', filters),
        dataApi.chart('yusur', 'trend', filters),
        dataApi.chart('yusur', 'by-region', filters),
        dataApi.chart('yusur', 'failure-breakdown', filters),
        dataApi.rankings('yusur', 'pharmacy', filters),
        dataApi.records('yusur', filters, page),
      ]);
      setKpis(k.data);
      setTrendData((trend.data || []).map((d: any) => ({ ...d, name: d.month })));
      setRegionData((region.data || []).map((d: any) => ({ ...d, name: d.region })));
      setFailureData((fail.data || []).map((d: any) => ({ ...d, name: d.reason })));
      setRankings(rank.data);
      setRecords(recs.data || []);
      setTotal(recs.total || 0);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  /* Derived values */
  const totalOrders      = kpis?.totalOrders || 0;
  const unavailable      = kpis?.unavailableOrders || 0;
  const allocated        = kpis?.allocatedOrders || (totalOrders - unavailable);
  const allocLen         = allocated || 1;
  const fulfilled        = kpis?.fulfilledOrders || 0;
  const failures         = kpis?.failures || {} as any;
  const unavailablePct   = totalOrders > 0 ? Math.round(unavailable / totalOrders * 100) : 0;
  const fulfilledPct     = Math.round(fulfilled / allocLen * 100);
  const timeoutPct       = failures.timeoutPct  || (failures.timeout      ? Math.round(failures.timeout      / allocLen * 100) : 0);
  const branchPct        = failures.branchPct   || (failures.branchClosed ? Math.round(failures.branchClosed / allocLen * 100) : 0);
  const techPct          = failures.techPct     || (failures.technicalIssue ? Math.round(failures.technicalIssue / allocLen * 100) : 0);

  /* Trend highlights */
  const maxTrendMonth = trendData.length > 0 ? trendData.reduce((m, d) => d.count > m.count ? d : m, trendData[0]) : null;
  const minTrendMonth = trendData.length > 1 ? trendData.reduce((m, d) => d.count < m.count ? d : m, trendData[0]) : null;
  const renderTrendDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (maxTrendMonth && payload.name === maxTrendMonth.name)
      return <circle key={payload.name + '-max'} cx={cx} cy={cy} r={6} fill="#16a34a" stroke="#fff" strokeWidth={2} />;
    if (minTrendMonth && payload.name === minTrendMonth.name)
      return <circle key={payload.name + '-min'} cx={cx} cy={cy} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} />;
    return <circle key={payload.name} cx={cx} cy={cy} r={3} fill="#3b82f6" />;
  };

  const columns: Column<any>[] = [
    { key: 'orderNumber', header: lang === 'ar' ? 'رقم الطلب' : 'Order #', width: '110px' },
    { key: 'pharmacy', header: t.pharmacy, headerAr: 'الصيدلية' },
    { key: 'region', header: t.region, headerAr: 'المنطقة' },
    { key: 'orderDate', header: t.date, headerAr: 'التاريخ', width: '110px' },
    { key: 'status', header: t.status, headerAr: 'الحالة', render: row => <StatusBadge value={row.status} /> },
    { key: 'failureReason', header: lang === 'ar' ? 'سبب الفشل' : 'Failure Reason',
      render: row => row.failureReason
        ? <span className="ref-badge ref-badge-red">{row.failureReason}</span>
        : <span style={{ color: '#d1d5db' }}>—</span> },
    { key: 'value', header: t.value, headerAr: 'القيمة',
      render: row => <span>{(row.value || 0).toLocaleString()} <span style={{ fontSize: 11, color: '#9ca3af' }}>SAR</span></span> },
  ];

  const filterFields = [
    { key: 'status', labelEn: 'Status', labelAr: 'الحالة', type: 'multiselect' as const, options: (filterOptions.status || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'region', labelEn: 'Region', labelAr: 'المنطقة', type: 'multiselect' as const, options: (filterOptions.region || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'pharmacy', labelEn: 'Pharmacy', labelAr: 'الصيدلية', type: 'multiselect' as const, options: (filterOptions.pharmacy || []).map((v: string) => ({ value: v, label: v })) },
  ];

  return (
    <div className="ref-fade-in">

      {/* ── Page Header ── */}
      <div className="ref-card" style={{ padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🚀
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {lang === 'ar' ? 'يسر' : 'YUSUR'}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {lang === 'ar' ? 'تتبع طلبات الصيدليات وأداء التنفيذ' : 'Pharmacy order tracking and fulfillment performance'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
            <RefreshCw size={14} /> {t.refresh}
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/upload')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>
              <Upload size={14} /> {t.upload}
            </button>
          )}
        </div>
      </div>

      <FilterPanel fields={filterFields} filters={filters} onChange={f => { setFilters(f); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />

      {/* ── Orders KPIs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#3b82f6' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'تقرير الطلبات' : 'Orders Report'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KPITile label={lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}      count={totalOrders}                  icon="📋" iconBg="#dbeafe"  loading={loading} />
        <KPITile label={lang === 'ar' ? 'غير متاح'        : 'Unavailable'}       count={unavailable}  pct={unavailablePct} pctLabel={lang === 'ar' ? 'من الإجمالي' : 'of total'}   icon="🚫" iconBg="#fee2e2" danger loading={loading} />
        <KPITile label={lang === 'ar' ? 'انتهاء المهلة'   : 'Timeout'}           count={failures.timeout || 0} pct={timeoutPct} pctLabel={lang === 'ar' ? 'من المخصص' : 'of allocated'} icon="⏱️" iconBg="#fef3c7" danger loading={loading} />
        <KPITile label={lang === 'ar' ? 'منجز'             : 'Fulfilled'}         count={fulfilled}    pct={fulfilledPct}   pctLabel={lang === 'ar' ? 'من المخصص' : 'of allocated'}   icon="✅" iconBg="#dcfce7"  loading={loading} />
        <KPITile label={lang === 'ar' ? 'الفرع مغلق'       : 'Branch Closed'}     count={failures.branchClosed || 0} pct={branchPct} pctLabel={lang === 'ar' ? 'من المخصص' : 'of allocated'} icon="🔒" iconBg="#f3e8ff" danger loading={loading} />
        <KPITile label={lang === 'ar' ? 'مشكلة تقنية'      : 'Technical Issue'}   count={failures.technicalIssue || 0} pct={techPct} pctLabel={lang === 'ar' ? 'من المخصص' : 'of allocated'} icon="⚙️" iconBg="#e0f2fe" danger loading={loading} />
      </div>

      {/* ── BM / Invoices Report ── */}
      {kpis?.invoices && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 4, height: 20, borderRadius: 4, background: '#f59e0b' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'تقرير BM' : 'BM Report'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <KPITile label={lang === 'ar' ? 'إجمالي الفواتير' : 'Invoiced Count'}  count={kpis.invoices.count || 0}      icon="🧾" iconBg="#fef3c7" loading={loading} />
            <KPITile label={lang === 'ar' ? 'صافي القيمة'     : 'Net Value'}       count={kpis.invoices.totalValue || 0} icon="💰" iconBg="#dbeafe" loading={loading} />
            <KPITile label={lang === 'ar' ? 'قيمة السلة'      : 'Basket Value'}    count={kpis.invoices.basketValue || 0} icon="🛍️" iconBg="#dcfce7" loading={loading} />
          </div>
        </>
      )}

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#6366f1' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'التحليلات البيانية' : 'Analytics Charts'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Monthly Trend */}
        <div className="ref-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              {lang === 'ar' ? 'الاتجاه الشهري (عدد + قيمة)' : 'Monthly Trend (Count + Value)'}
            </h3>
            {!loading && maxTrendMonth && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  {lang === 'ar' ? 'أعلى' : 'Highest'}: <strong>{maxTrendMonth.name}</strong>
                </span>
                {minTrendMonth && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    {lang === 'ar' ? 'أدنى' : 'Lowest'}: <strong>{minTrendMonth.name}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
          {loading ? <div style={{ height: 220, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={trendData} margin={{ top: 30, right: 45, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#b45309' }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(val: any, name: string) => [
                    name === (lang === 'ar' ? 'القيمة' : 'Value (SAR)') ? (val as number).toLocaleString() + ' SAR' : val, name,
                  ]}
                />
                <Legend iconType="square" iconSize={10} />
                <Bar yAxisId="left" dataKey="count" name={lang === 'ar' ? 'الطلبات' : 'Orders'} fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={38}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#3b82f6', fontWeight: 700 }} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="value" name={lang === 'ar' ? 'القيمة' : 'Value (SAR)'}
                  stroke="#f59e0b" strokeWidth={2.5} dot={renderTrendDot} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Failure Breakdown Donut */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
            {lang === 'ar' ? 'توزيع أسباب الفشل' : 'Failure Breakdown'}
          </h3>
          {loading ? <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={failureData} cx="50%" cy="48%" innerRadius={42} outerRadius={70} dataKey="count" nameKey="name" paddingAngle={3}
                  label={({ midAngle, outerRadius, value, percent }) => {
                    if (!value) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 22;
                    const x = (outerRadius + 42) + radius * Math.cos(-midAngle * RADIAN);
                    const y = 100 + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="#111827" textAnchor="middle" fontSize={11} fontWeight={700}>
                        {`${value} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {failureData.map((_, i) => <Cell key={i} fill={FAIL_COLORS[i % FAIL_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: string) => [`${v} (${failureData.find(f => f.reason === n)?.pct || 0}%)`, n]} />
                <Legend iconType="circle" iconSize={9} formatter={v => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Failure detail bars */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
            {lang === 'ar' ? 'تفاصيل أسباب الفشل' : 'Failure Reason Detail'}
          </h3>
          {loading ? <div style={{ height: 160, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {failureData.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{f.reason}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: FAIL_COLORS[i % FAIL_COLORS.length] }}>{f.count}</span>
                      <span className="ref-badge ref-badge-red">{f.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: '#f3f4f6' }}>
                    <div style={{ height: 5, borderRadius: 99, width: `${f.pct}%`, background: FAIL_COLORS[i % FAIL_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RankingWidget title={lang === 'ar' ? 'ترتيب الصيدليات' : 'Pharmacy Rankings'} top5={rankings?.top5 || []} bottom5={rankings?.bottom5 || []} loading={loading} />
      </div>

      {/* ── Orders by Region ── */}
      <div className="ref-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
          {lang === 'ar' ? 'الطلبات حسب المنطقة' : 'Orders by Region'}
        </h3>
        {loading ? <div style={{ height: 160, background: '#f3f4f6', borderRadius: 8 }} /> : (
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={regionData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#374151' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Data Table ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#8b5cf6' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'سجل الطلبات' : 'Order Records'}</span>
      </div>
      <DataTable columns={columns} data={records} total={total} page={page} pageSize={50} onPageChange={setPage}
        onDelete={row => dataApi.deleteRecord('yusur', row.id).then(loadData)}
        onEdit={async (row, updates) => { await dataApi.updateRecord('yusur', row.id, updates); await loadData(); }}
        loading={loading} exportFilename="yusur-orders-export" />

      {/* ── Admin Dashboard Controls ── */}
      <DashboardControls projectId="yusur" />
    </div>
  );
}
