/**
 * HybridPharmacyPage.tsx
 * Standalone dashboard for Hybrid Pharmacy project — Reference design
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';
import { dataApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterPanel from '../../components/ui/FilterPanel';
import { FilterState } from '../../types';

const PROJECT_ID = 'hybrid-pharmacy';
const GREEN  = '#16a34a';
const ORANGE = '#d97706';
const RED    = '#dc2626';

const BAR_COLORS = [
  '#3b82f6','#7c3aed','#0ea5e9','#16a34a','#f59e0b',
  '#f97316','#ec4899','#14b8a6','#6366f1','#84cc16',
];

const TOOLTIP_STYLE = { background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' };

const srColor = (v: number) => v >= 70 ? GREEN : v >= 50 ? ORANGE : RED;

function fmtK(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1)     + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1)         + 'K';
  return n.toLocaleString();
}

const Sk = ({ h = 160 }: { h?: number }) => (
  <div style={{ height: h, borderRadius: 10, background: '#f3f4f6', animation: 'pulse 2s infinite' }} />
);

const BarTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: p.fill || p.color }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

interface PharmRow { name: string; uploaded: number; invoiced: number; pending: number; successRate: number; netValue: number; }

function PharmacyTable({ data, loading, lang }: { data: PharmRow[]; loading: boolean; lang: string }) {
  const [pg, setPg] = useState(0);
  const perPage = 15;
  const paged = data.slice(pg * perPage, (pg + 1) * perPage);
  const total = data.reduce((s, r) => ({
    uploaded: s.uploaded + r.uploaded, invoiced: s.invoiced + r.invoiced,
    pending: s.pending + r.pending, netValue: s.netValue + r.netValue,
  }), { uploaded: 0, invoiced: 0, pending: 0, netValue: 0 });
  const totSr = total.uploaded > 0 ? parseFloat((total.invoiced / total.uploaded * 100).toFixed(1)) : 0;
  const totalPages = Math.ceil(data.length / perPage);

  if (loading) return <Sk h={240} />;
  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
      {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
    </div>
  );

  const headers = lang === 'ar'
    ? ['الصيدلية','المرفوع','المُفوتر','المعلق','معدل النجاح','القيمة الصافية']
    : ['Pharmacy','Uploaded','Invoiced','Pending','Success %','Net Value'];

  return (
    <div>
      <div className="ref-table-container">
        <table className="ref-table">
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const c = srColor(row.successRate);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{row.name}</td>
                  <td>{fmtK(row.uploaded)}</td>
                  <td><span style={{ fontWeight: 700, color: '#3b82f6' }}>{fmtK(row.invoiced)}</span></td>
                  <td style={{ color: '#6b7280' }}>{fmtK(row.pending)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 5, borderRadius: 99, background: '#f3f4f6', flexShrink: 0 }}>
                        <div style={{ width: `${Math.min(row.successRate, 100)}%`, height: 5, borderRadius: 99, background: c }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c, minWidth: 36 }}>{row.successRate}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{fmtK(row.netValue)}</span>
                    <span style={{ color: '#9ca3af', marginInlineStart: 4, fontSize: 11 }}>SAR</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#fffbeb', borderTop: '2px solid #fde68a' }}>
              <td style={{ fontWeight: 800, color: '#111827' }}>{lang === 'ar' ? 'الإجمالي' : 'Total'}</td>
              <td style={{ fontWeight: 700 }}>{fmtK(total.uploaded)}</td>
              <td style={{ fontWeight: 700, color: '#3b82f6' }}>{fmtK(total.invoiced)}</td>
              <td style={{ fontWeight: 700, color: '#6b7280' }}>{fmtK(total.pending)}</td>
              <td><span style={{ fontSize: 13, fontWeight: 800, color: srColor(totSr) }}>{totSr}%</span></td>
              <td style={{ fontWeight: 700 }}>{fmtK(total.netValue)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>SAR</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{data.length} {lang === 'ar' ? 'صيدلية' : 'pharmacies'}</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPg(i)}
                style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: pg === i ? '#3b82f6' : '#f3f4f6',
                  color: pg === i ? '#fff' : '#374151',
                }}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecHd({ en, ar, lang, color = '#3b82f6' }: { en: string; ar: string; lang: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 4, height: 20, borderRadius: 4, background: color }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? ar : en}</span>
    </div>
  );
}

export default function HybridPharmacyPage() {
  const { lang } = useAuthStore();
  const navigate = useNavigate();

  const [kpis, setKpis]           = useState<any>(null);
  const [trendData, setTrend]     = useState<any[]>([]);
  const [pharmData, setPharmData] = useState<PharmRow[]>([]);
  const [topNV, setTopNV]         = useState<PharmRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState<FilterState>({});
  const [filterOptions, setFOpts] = useState<any>({});
  const [records, setRecords]     = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);

  useEffect(() => {
    dataApi.filterOptions(PROJECT_ID).then(r => setFOpts(r.data || {}));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, pharmRes, recRes] = await Promise.all([
        dataApi.kpis(PROJECT_ID, filters),
        dataApi.chart(PROJECT_ID, 'trend', filters),
        dataApi.dimensionChart(PROJECT_ID, 'pharmacy', filters),
        dataApi.records(PROJECT_ID, filters, page, 50),
      ]);

      setKpis(kpiRes.data || null);

      const td = (trendRes.data || []).map((d: any) => ({
        month: d.month, count: d.count, value: Math.round(d.value / 1000),
      }));
      setTrend(td);

      const rows: PharmRow[] = (pharmRes.data || []).map((r: any) => ({
        name: r.name || r.dimension || '—',
        uploaded: r.uploaded || r.count || 0,
        invoiced: r.invoiced || 0,
        pending: (r.uploaded || r.count || 0) - (r.invoiced || 0),
        successRate: r.successRate || 0,
        netValue: Math.round(r.netValue || r.value || 0),
      })).sort((a: PharmRow, b: PharmRow) => b.netValue - a.netValue);

      setPharmData(rows);
      setTopNV(rows.slice(0, 10));
      setRecords(recRes.data || []);
      setTotal(recRes.total || 0);
    } catch (e) {
      console.error('HybridPharmacy load error', e);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const uploaded  = kpis?.uploaded  || kpis?.total || 0;
  const invoiced  = kpis?.invoiced  || kpis?.invoicedCount || 0;
  const netValue  = kpis?.netValue  || kpis?.netValueTotal || 0;
  const sr        = kpis?.successRate || 0;
  const pending   = kpis?.pending   || (uploaded - invoiced);
  const estimated = kpis?.estimatedValue || 0;
  const missed    = kpis?.missedValue    || 0;

  const donutData = [
    { name: lang === 'ar' ? 'مُفوتر' : 'Invoiced', value: invoiced, color: '#3b82f6' },
    { name: lang === 'ar' ? 'معلق'   : 'Pending',  value: pending,  color: '#e5e7eb' },
  ];

  const columns: Column<any>[] = [
    { key: 'drugCode',   header: lang === 'ar' ? 'كود الدواء'      : 'Drug Code',   width: '130px', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{r.drugCode || '—'}</span> },
    { key: 'drugName',   header: lang === 'ar' ? 'اسم الدواء'      : 'Drug Name',   render: r => <span style={{ fontSize: 12 }}>{r.drugName || '—'}</span> },
    { key: 'uploadDate', header: lang === 'ar' ? 'تاريخ الصرف'     : 'Refill Date', width: '100px', render: r => <span style={{ fontSize: 12, color: '#6b7280' }}>{r.uploadDate || '—'}</span> },
    { key: 'id',         header: lang === 'ar' ? 'الرقم'           : 'ID',          width: '120px', render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>{r.id || '—'}</span> },
    { key: 'ref',        header: lang === 'ar' ? 'المرجع'          : 'Ref #',       width: '95px',  render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>{r.ref || '—'}</span> },
    { key: 'pharmacy',   header: lang === 'ar' ? 'الفرع'           : 'Branch',      width: '75px',  render: r => <span style={{ fontSize: 12, fontWeight: 600 }}>{r.pharmacy || '—'}</span> },
    { key: 'license',    header: lang === 'ar' ? 'الترخيص'         : 'License',     width: '85px',  render: r => <span style={{ fontSize: 12, color: '#6b7280' }}>{r.license || '—'}</span> },
    { key: 'region',     header: lang === 'ar' ? 'المنطقة'         : 'Region',      render: r => <span style={{ fontSize: 12 }}>{r.region || '—'}</span> },
    { key: 'senior',     header: lang === 'ar' ? 'المسؤول'         : 'Senior',      render: r => <span style={{ fontSize: 12 }}>{r.senior || '—'}</span> },
    { key: 'netValue',   header: lang === 'ar' ? 'القيمة الصافية'  : 'Net Value',   width: '110px',
      render: r => {
        const v = r.netValue ?? 0;
        return <span style={{ fontWeight: 600, fontSize: 12, color: v > 0 ? '#3b82f6' : '#9ca3af' }}>{Number(v).toLocaleString()} <span style={{ color: '#9ca3af', fontWeight: 400 }}>SAR</span></span>;
      }
    },
  ];

  const fields = [
    { key: 'pharmacy',   labelEn: 'Branch',     labelAr: 'الفرع',    type: 'multiselect' as const, options: (filterOptions.pharmacy   || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'region',     labelEn: 'Region',     labelAr: 'المنطقة',  type: 'multiselect' as const, options: (filterOptions.region     || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'senior',     labelEn: 'Senior',     labelAr: 'المسؤول',  type: 'multiselect' as const, options: (filterOptions.senior     || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'supervisor', labelEn: 'Supervisor', labelAr: 'المشرف',   type: 'multiselect' as const, options: (filterOptions.supervisor || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'district',   labelEn: 'District',   labelAr: 'الحي',     type: 'multiselect' as const, options: (filterOptions.district   || []).map((v: string) => ({ value: v, label: v })) },
  ];

  return (
    <div className="ref-fade-in">

      {/* ── Page Header ── */}
      <div className="ref-card" style={{ padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🏥
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {lang === 'ar' ? 'صيدليات هايبرد' : 'Hybrid Pharmacy'}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {lang === 'ar' ? 'تحليل أداء الصيدليات' : 'Pharmacy Performance Analytics'}
            </p>
          </div>
        </div>
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e7ff', background: '#f8faff', fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
            <span>🏥</span>
            <span>{pharmData.length} {lang === 'ar' ? 'صيدلية' : 'pharmacies'}</span>
          </div>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <FilterPanel
        fields={fields}
        filters={filters}
        onChange={f => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters({}); setPage(1); }}
        dateLabelEn="Refill Date"
        dateLabelAr="تاريخ الصرف"
      />

      {/* ── 7 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#dbeafe' }}>📤</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'المرفوع' : 'Uploaded'}</div><div className="ref-kpi-value">{fmtK(uploaded)}</div></div>
        </div>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#dcfce7' }}>✅</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'المُفوترة' : 'Invoiced'}</div><div className="ref-kpi-value">{fmtK(invoiced)}</div></div>
        </div>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#fef3c7' }}>💰</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'القيمة الصافية' : 'Net Value'}</div><div className="ref-kpi-value" style={{ fontSize: 18 }}>{fmtK(netValue)}<span style={{ fontSize: 11, color: '#9ca3af', marginInlineStart: 4 }}>SAR</span></div></div>
        </div>
        {/* Success Rate special card */}
        <div className="ref-kpi-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="ref-kpi-icon" style={{ background: '#f0fdf4' }}>📈</div>
            <div className="ref-kpi-label">{lang === 'ar' ? 'معدل النجاح' : 'Success Rate'}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: srColor(sr), letterSpacing: '-0.02em' }}>{sr}%</div>
          <div style={{ width: '100%', height: 5, borderRadius: 99, background: '#f3f4f6' }}>
            <div style={{ width: `${sr}%`, height: 5, borderRadius: 99, background: srColor(sr) }} />
          </div>
        </div>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#fef3c7' }}>⏳</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'المعلقة' : 'Pending'}</div><div className="ref-kpi-value">{fmtK(pending)}</div></div>
        </div>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#e0e7ff' }}>📊</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'القيمة التقديرية' : 'Estimated'}</div><div className="ref-kpi-value" style={{ fontSize: 18 }}>{fmtK(estimated)}<span style={{ fontSize: 11, color: '#9ca3af', marginInlineStart: 4 }}>SAR</span></div></div>
        </div>
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon" style={{ background: '#fee2e2' }}>⚠️</div>
          <div><div className="ref-kpi-label">{lang === 'ar' ? 'القيمة الفائتة' : 'Missed Value'}</div><div className="ref-kpi-value" style={{ fontSize: 18, color: missed > 0 ? '#dc2626' : '#111827' }}>{missed > 0 ? fmtK(missed) : '0'}<span style={{ fontSize: 11, color: '#9ca3af', marginInlineStart: 4 }}>SAR</span></div></div>
        </div>
      </div>

      {/* ── Charts ── */}
      <SecHd en="Charts" ar="الرسوم البيانية" lang={lang} color="#3b82f6" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Bar: Top 10 Pharmacies by Net Value */}
        <div className="ref-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
            {lang === 'ar' ? 'أعلى 10 صيدليات بالقيمة الصافية' : 'Top 10 Pharmacies by Net Value'}
          </p>
          {loading ? <Sk h={240} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topNV} margin={{ top: 28, right: 8, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="netValue" name={lang === 'ar' ? 'القيمة الصافية' : 'Net Value'} radius={[4,4,0,0]}>
                  {topNV.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  <LabelList dataKey="netValue" position="top"
                    formatter={(v: any) => fmtK(Number(v))}
                    style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut: Invoiced vs Pending */}
        <div className="ref-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14, alignSelf: 'flex-start' }}>
            {lang === 'ar' ? 'المُفوتر مقابل المعلق' : 'Invoiced vs Pending'}
          </p>
          {loading ? <Sk h={240} /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{d.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>{Number(d.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Line: Trend */}
        <div className="ref-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
            {lang === 'ar' ? 'الاتجاه الزمني (الوصفات)' : 'Monthly Trend (Prescriptions)'}
          </p>
          {loading ? <Sk h={200} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="count" name={lang === 'ar' ? 'الوصفات' : 'Prescriptions'}
                  stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                  label={({ x, y, value }: any) => (
                    value ? <text x={x} y={y - 10} textAnchor="middle" fill="#3b82f6" fontSize={12} fontWeight={700}>{Number(value).toLocaleString()}</text> : null
                  )} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Uploaded vs Invoiced */}
        <div className="ref-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
            {lang === 'ar' ? 'المرفوع مقابل المُفوتر (أعلى 10)' : 'Uploaded vs Invoiced (Top 10)'}
          </p>
          {loading ? <Sk h={200} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topNV} margin={{ top: 28, right: 8, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip content={<BarTip />} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="uploaded" name={lang === 'ar' ? 'المرفوع' : 'Uploaded'} fill="#6366f1" radius={[3,3,0,0]}>
                  <LabelList dataKey="uploaded" position="top" formatter={(v: any) => fmtK(Number(v))} style={{ fontSize: 11, fontWeight: 700, fill: '#6366f1' }} />
                </Bar>
                <Bar dataKey="invoiced" name={lang === 'ar' ? 'المُفوتر' : 'Invoiced'} fill="#3b82f6" radius={[3,3,0,0]}>
                  <LabelList dataKey="invoiced" position="top" formatter={(v: any) => fmtK(Number(v))} style={{ fontSize: 11, fontWeight: 700, fill: '#3b82f6' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Pharmacy Summary Table ── */}
      <SecHd en="Pharmacy Performance Summary" ar="ملخص أداء الصيدليات" lang={lang} color="#10b981" />
      <div className="ref-card" style={{ padding: 20, marginBottom: 24 }}>
        <PharmacyTable data={pharmData} loading={loading} lang={lang} />
      </div>

      {/* ── Records Table ── */}
      <SecHd en="Prescription Records" ar="سجل الوصفات" lang={lang} color="#8b5cf6" />
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        total={total}
        page={page}
        pageSize={50}
        onPageChange={setPage}
      />
    </div>
  );
}
