import React, { useEffect, useState, useCallback } from 'react';
import { dataApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { FilterState, KPIData } from '../../types';
import DataTable, { StatusBadge, Column } from '../../components/ui/DataTable';
import FilterPanel from '../../components/ui/FilterPanel';
import DashboardControls from '../../components/ui/DashboardControls';
import { Upload, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList, ComposedChart, Line
} from 'recharts';

const PRODUCT_COLORS: Record<string, string> = {
  Beds: '#3b82f6',
  Wheelchairs: '#f59e0b',
  Mattress: '#10b981',
};

const TOOLTIP_STYLE = { background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' };

/* ── Reference KPI Card ──────────────────────────────────────────────────── */
function RefKPI({ label, value, icon, iconBg, sub }: { label: string; value: string | number; icon: string; iconBg: string; sub?: string }) {
  return (
    <div className="ref-kpi-card">
      <div className="ref-kpi-icon" style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className="ref-kpi-label">{label}</div>
        <div className="ref-kpi-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function MedicalDevicesPage() {
  const { t, lang, user } = useAuthStore();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({});
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataApi.filterOptions('medical-devices').then(r => setFilterOptions(r.data || {}));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [k, cat, region, trend, recs] = await Promise.all([
        dataApi.medKpis(filters),
        dataApi.chart('medical-devices', 'by-category', filters),
        dataApi.chart('medical-devices', 'by-region', filters),
        dataApi.chart('medical-devices', 'trend', filters),
        dataApi.records('medical-devices', filters, page),
      ]);
      setKpis(k.data);
      setCategoryData(cat.data || []);
      setRegionData((region.data || []).map((d: any) => ({ ...d, name: d.region })));
      setTrendData((trend.data || []).map((d: any) => ({ ...d, name: d.month })));
      setRecords(recs.data || []);
      setTotal(recs.total || 0);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns: Column<any>[] = [
    { key: 'rxNumber', header: t.rxNumber, headerAr: 'رقم الوصفة', width: '110px' },
    { key: 'deviceType', header: t.deviceType, headerAr: 'نوع الجهاز' },
    { key: 'category', header: t.category, headerAr: 'الفئة' },
    { key: 'region', header: t.region, headerAr: 'المنطقة' },
    { key: 'status', header: t.status, headerAr: 'الحالة', render: row => <StatusBadge value={row.status} /> },
    { key: 'value', header: t.value, headerAr: 'القيمة', render: row => <span>{(row.value || 0).toLocaleString()} <span className="text-xs text-gray-400">SAR</span></span> },
    { key: 'prescriptionDate', header: t.date, headerAr: 'التاريخ', width: '110px' },
  ];

  const fields = [
    { key: 'status', labelEn: 'Status', labelAr: 'الحالة', type: 'multiselect' as const, options: (filterOptions.status || []).map((v: string) => ({ value: v, label: v })) },
    { key: 'region', labelEn: 'Region', labelAr: 'المنطقة', type: 'multiselect' as const, options: (filterOptions.region || []).map((v: string) => ({ value: v, label: v })) },
  ];

  return (
    <div className="ref-fade-in">

      {/* ── Page Header ── */}
      <div className="ref-card" style={{ padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            ⚕️
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
              {lang === 'ar' ? 'الأجهزة الطبية' : 'Medical Devices'}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {lang === 'ar' ? 'تتبع مبيعات الأجهزة الطبية والمخزون' : 'Track medical device sales and inventory'}
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

      {/* Filters */}
      <FilterPanel fields={fields} filters={filters} onChange={f => { setFilters(f); setPage(1); }} onReset={() => { setFilters({}); setPage(1); }} />

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <RefKPI label={lang === 'ar' ? 'إجمالي الوصفات'     : 'Total Prescriptions'}    value={kpis?.total || 0}                  icon="📋" iconBg="#dbeafe" />
        <RefKPI label={lang === 'ar' ? 'جاري التسليم (عدد)' : 'Out for Delivery'}        value={kpis?.outForDeliveryCount || 0}    icon="🚚" iconBg="#fef3c7" />
        <RefKPI label={lang === 'ar' ? 'تم التسليم (عدد)'   : 'Delivered Count'}         value={kpis?.deliveredCount || 0}         icon="✅" iconBg="#dcfce7" />
        <RefKPI label={lang === 'ar' ? 'قيمة جاري التسليم' : 'Out for Delivery Value'}  value={`${(kpis?.outForDeliveryValue || 0).toLocaleString()} SAR`} icon="📦" iconBg="#f3e8ff" />
      </div>

      {/* ── Section: Product Type Analysis ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#3b82f6' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'تحليل أنواع المنتجات' : 'Product Type Analysis'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Product type breakdown */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            {lang === 'ar' ? 'ملخص أنواع المنتجات' : 'Product Types Summary'}
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 56, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 2s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['Beds', 'Wheelchairs', 'Mattress'] as const).map(pt => {
                const d = categoryData.find(c => c.name === pt) || { count: 0, value: 0, pct: 0 };
                const color = PRODUCT_COLORS[pt];
                const labelAr: Record<string, string> = { Beds: 'أسرّة', Wheelchairs: 'كراسي متحركة', Mattress: 'مراتب' };
                return (
                  <div key={pt} style={{ borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${color}`, background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{lang === 'ar' ? labelAr[pt] : pt}</span>
                      <span className="ref-badge ref-badge-blue" style={{ background: color + '20', color }}>{d.pct}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                      <span>{lang === 'ar' ? 'عدد' : 'Count'}: <strong style={{ color: '#111827' }}>{d.count.toLocaleString()}</strong></span>
                      <span>{lang === 'ar' ? 'قيمة' : 'Value'}: <strong style={{ color: '#111827' }}>{d.value.toLocaleString()}</strong> SAR</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: '#f3f4f6' }}>
                      <div style={{ height: 5, borderRadius: 99, width: `${d.pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-series bar chart */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            {lang === 'ar' ? 'مقارنة العدد والقيمة' : 'Count & Value Comparison'}
          </h3>
          {loading ? <div style={{ height: 220, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 30, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="square" iconSize={10} />
                <Bar yAxisId="left" dataKey="count" name={lang === 'ar' ? 'عدد' : 'Count'} fill="#3b82f6" radius={[4,4,0,0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#3b82f6', fontWeight: 700 }} />
                </Bar>
                <Bar yAxisId="right" dataKey="value" name={lang === 'ar' ? 'قيمة' : 'Value (SAR)'} fill="#f59e0b" radius={[4,4,0,0]}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: '#b45309', fontWeight: 700 }} formatter={(v: any) => v?.toLocaleString()} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Section: Dimension Analysis ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#10b981' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'تحليل الأبعاد' : 'Dimension Analysis'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Region chart */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            {lang === 'ar' ? 'الوصفات حسب المنطقة' : 'Prescriptions by Region'}
          </h3>
          {loading ? <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#374151' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="ref-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            {lang === 'ar' ? 'الاتجاه الشهري (العدد + القيمة)' : 'Monthly Trend (Count + Value)'}
          </h3>
          {loading ? <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8 }} /> : (
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={trendData} margin={{ top: 28, right: 45, left: 0, bottom: 5 }}>
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
                <Bar yAxisId="left" dataKey="count" name={lang === 'ar' ? 'العدد' : 'Count'} fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={38}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#3b82f6', fontWeight: 700 }} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="value" name={lang === 'ar' ? 'القيمة' : 'Value (SAR)'}
                  stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: '#6366f1' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ar' ? 'سجل الوصفات' : 'Prescription Records'}</span>
      </div>
      <DataTable
        columns={columns}
        data={records}
        total={total}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        onDelete={row => dataApi.deleteRecord('medical-devices', row.id).then(loadData)}
        onEdit={async (row, updates) => { await dataApi.updateRecord('medical-devices', row.id, updates); await loadData(); }}
        loading={loading}
        exportFilename="medical-devices-export"
      />

      {/* ── Admin Dashboard Controls ── */}
      <DashboardControls projectId="medical-devices" />
    </div>
  );
}
