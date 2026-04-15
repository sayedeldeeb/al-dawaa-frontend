/**
 * ChurnedCustomerPage — Dynamic API version
 * Connects to real backend via dataApi — Reference Design v2
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { dataApi } from '../../api/client';
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts';

const PROJECT_ID = 'churned-customer';

/* ══════════════════════════════════════════════════════════════════════════
   TRANSLATIONS
══════════════════════════════════════════════════════════════════════════ */
const T = {
  ar: {
    pageTitle: 'العملاء المفقودين', pageSub: 'نظرة عامة على الأداء',
    filter: 'تصفية', advFilter: 'تصفية متقدمة', clearFilters: 'مسح الفلاتر',
    exportReport: 'تصدير',
    uploaded: 'الإجمالي', dispensed: 'المصروف', pending: 'المعلق',
    success: 'نسبة النجاح', netValue: 'القيمة الصافية',
    detailedReport: 'تقرير مفصل', charts: 'الرسومات', rankings: 'التقييمات', topBottom: 'الأعلى / الأقل',
    region: 'المنطقة', senior: 'السينيور', supervisor: 'المشرف', district: 'مدير المنطقة',
    allRegions: 'جميع المناطق', allSeniors: 'جميع السينيور', allSupervisors: 'جميع المشرفين', allDistricts: 'جميع المدراء',
    search: 'بحث بالاسم، المرجع، الجوال، الصيدلية...', dateFrom: 'تاريخ من', dateTo: 'تاريخ إلى',
    showing: 'عرض', of: 'من', records: 'سجل',
    noData: 'لا توجد بيانات تطابق الفلتر.', loading: 'جاري التحميل...',
    date: 'التاريخ', mobile: 'رقم الجوال', value: 'القيمة', phCode: 'كود الصيدلية',
    rankBy: 'تصنيف حسب',
    bySupervisor: 'المشرف', bySenior: 'السينيور', byDistrict: 'مدير المنطقة', byRegion: 'المنطقة',
    top: 'الأعلى أداءً', bottom: 'الأقل أداءً',
  },
  en: {
    pageTitle: 'Churned Customers', pageSub: 'Performance Overview',
    filter: 'Filter', advFilter: 'Advanced Filter', clearFilters: 'Clear Filters',
    exportReport: 'Export',
    uploaded: 'Uploaded', dispensed: 'Dispensed', pending: 'Pending',
    success: 'Success %', netValue: 'Net Value',
    detailedReport: 'Detailed Report', charts: 'Charts', rankings: 'Rankings', topBottom: 'Top / Bottom',
    region: 'Region', senior: 'Senior', supervisor: 'Supervisor', district: 'District',
    allRegions: 'All Regions', allSeniors: 'All Seniors', allSupervisors: 'All Supervisors', allDistricts: 'All Districts',
    search: 'Search names, refs, mobile, PH...', dateFrom: 'Date From', dateTo: 'Date To',
    showing: 'Showing', of: 'of', records: 'records',
    noData: 'No data matches your filters.', loading: 'Loading...',
    date: 'Date', mobile: 'Mobile', value: 'Net Value', phCode: 'PH Code',
    rankBy: 'Rank by',
    bySupervisor: 'Supervisor', bySenior: 'Senior', byDistrict: 'District', byRegion: 'Region',
    top: 'Top Performers', bottom: 'Bottom Performers',
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */
const fmtValue = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return Number(n || 0).toLocaleString('en');
};
const fmtNum = (n: number) => Number(n || 0).toLocaleString('en');

/* ══════════════════════════════════════════════════════════════════════════
   SVG ICONS
══════════════════════════════════════════════════════════════════════════ */
const Ic = {
  Filter:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Export:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Chart:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>,
  Trophy:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Medal:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Spinner:  () => <svg viewBox="0 0 24 24" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#002544" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>,
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };
const localSort = <T extends Record<string, any>>(arr: T[], cfg: SortConfig): T[] =>
  [...arr].sort((a, b) => {
    let av = a[cfg.key]; let bv = b[cfg.key];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return cfg.direction === 'asc' ? -1 : 1;
    if (av > bv) return cfg.direction === 'asc' ? 1 : -1;
    return 0;
  });

function SortIcon({ col, cfg }: { col: string; cfg: SortConfig }) {
  if (cfg.key !== col) return <span className="ref-sort-icon">↕</span>;
  return <span className="ref-sort-icon active">{cfg.direction === 'asc' ? '↑' : '↓'}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════
   BADGE
══════════════════════════════════════════════════════════════════════════ */
function Badge({ region }: { region: string }) {
  const lower = (region || '').toLowerCase();
  const cls = lower === 'central' ? 'ref-badge-blue' : lower === 'western' ? 'ref-badge-purple'
    : lower === 'eastern' ? 'ref-badge-emerald' : lower === 'northern' ? 'ref-badge-yellow' : 'ref-badge-gray';
  return <span className={`ref-badge ${cls}`}>{region || '-'}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════
   LOADING SKELETON
══════════════════════════════════════════════════════════════════════════ */
function LoadingRow() {
  return (
    <tr>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i}><div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} /></td>
      ))}
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function ChurnedCustomerPage({ projectId }: { projectId?: string }) {
  const pid = projectId || PROJECT_ID;
  const { lang } = useAuthStore();
  const isEn = lang === 'en';
  const t = T[lang as 'ar' | 'en'] ?? T.en;

  /* ── UI State ────────────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState<'data' | 'charts' | 'ranking' | 'topbottom'>('data');
  const [rankType,     setRankType]     = useState<'supervisor' | 'senior' | 'district' | 'region'>('supervisor');
  const [showFilter,   setShowFilter]   = useState(false);
  const [dataPage,     setDataPage]     = useState(1);
  const [sortCfg,      setSortCfg]      = useState<SortConfig>({ key: 'net_value', direction: 'desc' });
  const [sortRank,     setSortRank]     = useState<SortConfig>({ key: 'tot_i', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState(new Set<string>());
  const PER = 15;

  const [filters, setFilters] = useState({
    search: '', region: '', senior: '', supervisor: '', district: '', dateFrom: '', dateTo: '',
  });

  /* ── API State ───────────────────────────────────────────────────────── */
  const [kpi,        setKpi]        = useState<any>(null);
  const [records,    setRecords]    = useState<any[]>([]);
  const [totalRecs,  setTotalRecs]  = useState(0);
  const [totalPgs,   setTotalPgs]   = useState(1);
  const [rankAll,    setRankAll]    = useState<any[]>([]);
  const [chartM,     setChartM]     = useState<any[]>([]);   // monthly uploaded vs dispensed + value
  const [chartSenior,setChartSenior]= useState<any[]>([]);
  const [chartRegion,setChartRegion]= useState<any[]>([]);
  const [filterOpts, setFilterOpts] = useState<{ regions: string[]; seniors: string[]; supervisors: string[]; districts: string[] }>({
    regions: [], seniors: [], supervisors: [], districts: [],
  });
  const [loadingRec, setLoadingRec] = useState(false);

  /* ── Reset page on filter/tab change ────────────────────────────────── */
  useEffect(() => { setDataPage(1); setSelectedRows(new Set()); }, [filters, activeTab]);

  /* ── Fetch filter options (once on mount) ────────────────────────────── */
  useEffect(() => {
    dataApi.filterOptions(pid).then(res => {
      if (res?.success) {
        setFilterOpts({
          regions:     res.data.region      || [],
          seniors:     res.data.senior      || [],
          supervisors: res.data.supervisor  || [],
          districts:   res.data.district    || [],
        });
      }
    }).catch(() => {});
  }, [pid]);

  /* ── Fetch KPIs ──────────────────────────────────────────────────────── */
  useEffect(() => {
    dataApi.kpis(pid, filters).then(res => {
      if (res?.success) setKpi(res.data);
    }).catch(() => {});
  }, [pid, JSON.stringify(filters)]);

  /* ── Fetch records (paged) ───────────────────────────────────────────── */
  useEffect(() => {
    setLoadingRec(true);
    dataApi.records(pid, filters, dataPage, PER).then(res => {
      if (res?.success) {
        setRecords(res.data || []);
        setTotalRecs(res.total || 0);
        setTotalPgs(res.totalPages || 1);
      }
    }).catch(() => {}).finally(() => setLoadingRec(false));
  }, [pid, JSON.stringify(filters), dataPage]);

  /* ── Fetch rankings ──────────────────────────────────────────────────── */
  useEffect(() => {
    dataApi.rankings(pid, rankType, filters).then(res => {
      if (res?.success) setRankAll(res.data.all || []);
    }).catch(() => {});
  }, [pid, rankType, JSON.stringify(filters)]);

  /* ── Fetch chart data ────────────────────────────────────────────────── */
  useEffect(() => {
    // Monthly uploaded vs dispensed
    dataApi.chart(pid, 'uploaded-vs-dispensed', filters).then(res => {
      if (res?.success) {
        const rows = (res.data || []).map((r: any) => ({
          name: r.month || '',
          uploaded:  r.uploaded  || 0,
          dispensed: r.dispensed || 0,
          rate: r.uploaded > 0 ? +((r.dispensed / r.uploaded) * 100).toFixed(1) : 0,
        }));
        // Merge with value trend
        dataApi.chart(pid, 'trend', filters).then(vRes => {
          if (vRes?.success) {
            const vMap: Record<string, number> = {};
            (vRes.data || []).forEach((r: any) => { vMap[r.month] = r.value || 0; });
            setChartM(rows.map((r: any) => ({ ...r, value: vMap[r.name] || 0 })));
          } else {
            setChartM(rows);
          }
        }).catch(() => setChartM(rows));
      }
    }).catch(() => {});

    // By senior
    dataApi.chart(pid, 'by-senior', filters).then(res => {
      if (res?.success) setChartSenior(res.data || []);
    }).catch(() => {});

    // By region
    dataApi.chart(pid, 'by-region', filters).then(res => {
      if (res?.success) setChartRegion(res.data || []);
    }).catch(() => {});
  }, [pid, JSON.stringify(filters)]);

  /* ── Derived KPI values ──────────────────────────────────────────────── */
  const totals = useMemo(() => ({
    tu:  kpi?.uploaded    || kpi?.totalUploaded  || 0,
    ti:  kpi?.invoiced    || kpi?.totalDispensed || 0,
    tp:  kpi?.pending     || 0,
    tv:  kpi?.netValue    || 0,
    pct: kpi ? (kpi.successRate || 0) / 100 : 0,
  }), [kpi]);

  /* ── Sorted rank data ────────────────────────────────────────────────── */
  const sortedRank = useMemo(() => localSort(rankAll, sortRank), [rankAll, sortRank]);

  /* ── Local sort on current page records ─────────────────────────────── */
  const displayRecords = useMemo(() =>
    localSort(records, sortCfg),
  [records, sortCfg]);

  const isFilterActive = Object.values(filters).some(v => v !== '');

  const toggleSort = (key: string, cfg: SortConfig, set: (c: SortConfig) => void) => {
    set({ key, direction: cfg.key === key && cfg.direction === 'desc' ? 'asc' : 'desc' });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = new Set(selectedRows);
    if (e.target.checked) displayRecords.forEach(r => s.add(r.id));
    else displayRecords.forEach(r => s.delete(r.id));
    setSelectedRows(s);
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 40 }} className="ref-fade-in">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{t.pageTitle}</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{fmtNum(totalRecs)} {t.records}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ref-sidebar-item" style={{ gap: 6, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, width: 'auto', color: '#374151', background: '#fff' }}>
            <Ic.Export /> {t.exportReport}
          </button>
          <button
            className="ref-sidebar-item"
            style={{ gap: 6, padding: '8px 14px', border: `1px solid ${showFilter || isFilterActive ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: 8, width: 'auto',
              color: showFilter || isFilterActive ? '#1d4ed8' : '#374151',
              background: showFilter || isFilterActive ? '#eff6ff' : '#fff' }}
            onClick={() => setShowFilter(v => !v)}
          >
            <Ic.Filter /> {t.filter}
            {isFilterActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />}
          </button>
        </div>
      </div>

      {/* ── Advanced Filter Panel ─────────────────────────────────────────── */}
      {showFilter && (
        <div className="ref-card ref-fade-in" style={{ padding: 20, marginBottom: 20, background: 'rgba(239,246,255,0.5)', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ic.Filter /> {t.advFilter}
            </h3>
            <button onClick={() => setFilters({ search:'',region:'',senior:'',supervisor:'',district:'',dateFrom:'',dateTo:'' })}
              style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              {t.clearFilters}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{isEn ? 'Search' : 'بحث عام'}</label>
              <input className="ref-filter-input" placeholder={t.search} value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.dateFrom}</label>
              <input type="date" className="ref-filter-input" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.dateTo}</label>
              <input type="date" className="ref-filter-input" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.region}</label>
              <select className="ref-filter-select" value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
                <option value="">{t.allRegions}</option>
                {filterOpts.regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.senior}</label>
              <select className="ref-filter-select" value={filters.senior} onChange={e => setFilters(f => ({ ...f, senior: e.target.value }))}>
                <option value="">{t.allSeniors}</option>
                {filterOpts.seniors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.supervisor}</label>
              <select className="ref-filter-select" value={filters.supervisor} onChange={e => setFilters(f => ({ ...f, supervisor: e.target.value }))}>
                <option value="">{t.allSupervisors}</option>
                {filterOpts.supervisors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.district}</label>
              <select className="ref-filter-select" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
                <option value="">{t.allDistricts}</option>
                {filterOpts.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '📊', bg: '#dbeafe', color: '#1e40af', val: fmtNum(totals.tu), lbl: t.uploaded },
          { icon: '✅', bg: '#dcfce7', color: '#166534', val: fmtNum(totals.ti), lbl: t.dispensed },
          { icon: '⏳', bg: '#fee2e2', color: '#991b1b', val: fmtNum(totals.tp), lbl: t.pending },
          { icon: '📈', bg: '#fef3c7', color: '#92400e', val: (totals.pct * 100).toFixed(1) + '%', lbl: t.success },
          { icon: '💰', bg: '#f3e8ff', color: '#6b21a8', val: fmtValue(totals.tv), lbl: t.netValue },
        ].map((k, i) => (
          <div key={i} className="ref-kpi-card">
            <div className="ref-kpi-icon" style={{ backgroundColor: k.bg, color: k.color }}>{k.icon}</div>
            <div>
              <div className="ref-kpi-value" style={{ fontFamily: 'Inter, sans-serif' }}>{k.val}</div>
              <div className="ref-kpi-label">{k.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 28, marginBottom: 20 }}>
        {([
          { id: 'data',      icon: <Ic.FileText />, lbl: t.detailedReport },
          { id: 'charts',    icon: <Ic.Chart />,    lbl: t.charts         },
          { id: 'ranking',   icon: <Ic.Trophy />,   lbl: t.rankings       },
          { id: 'topbottom', icon: <Ic.Medal />,    lbl: t.topBottom      },
        ] as const).map(tb => (
          <button key={tb.id} className={`ref-tab ${activeTab === tb.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tb.id)}>
            {tb.icon} {tb.lbl}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         TAB: DETAILED REPORT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'data' && (
        <div className="ref-card ref-fade-in">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ic.FileText /> {t.detailedReport}
            </h3>
            {loadingRec && <Ic.Spinner />}
          </div>
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }}
                      checked={displayRecords.length > 0 && displayRecords.every(r => selectedRows.has(r.id))}
                      onChange={handleSelectAll} />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('pharmacy_code', sortCfg, setSortCfg)}>{t.phCode} <SortIcon col="pharmacy_code" cfg={sortCfg}/></th>
                  <th className="sortable" onClick={() => toggleSort('record_date', sortCfg, setSortCfg)}>{t.date} <SortIcon col="record_date" cfg={sortCfg}/></th>
                  <th>{t.mobile}</th>
                  <th>REF</th>
                  <th className="sortable" onClick={() => toggleSort('uploaded_count', sortCfg, setSortCfg)}>{t.uploaded} <SortIcon col="uploaded_count" cfg={sortCfg}/></th>
                  <th className="sortable" onClick={() => toggleSort('dispensed_count', sortCfg, setSortCfg)}>{t.dispensed} <SortIcon col="dispensed_count" cfg={sortCfg}/></th>
                  <th className="sortable" onClick={() => toggleSort('net_value', sortCfg, setSortCfg)}>{t.value} <SortIcon col="net_value" cfg={sortCfg}/></th>
                  <th className="sortable" onClick={() => toggleSort('supervisor', sortCfg, setSortCfg)}>{t.supervisor} <SortIcon col="supervisor" cfg={sortCfg}/></th>
                  <th className="sortable" onClick={() => toggleSort('senior', sortCfg, setSortCfg)}>{t.senior} <SortIcon col="senior" cfg={sortCfg}/></th>
                  <th>{t.region}</th>
                </tr>
              </thead>
              <tbody>
                {loadingRec && [1,2,3,4,5].map(i => <LoadingRow key={i} />)}
                {!loadingRec && displayRecords.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>{t.noData}</td></tr>
                )}
                {!loadingRec && displayRecords.map(r => (
                  <tr key={r.id} style={selectedRows.has(r.id) ? { background: 'rgba(59,130,246,0.04)' } : {}}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }}
                        checked={selectedRows.has(r.id)}
                        onChange={e => {
                          const s = new Set(selectedRows);
                          e.target.checked ? s.add(r.id) : s.delete(r.id);
                          setSelectedRows(s);
                        }} />
                    </td>
                    <td style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{r.pharmacy_code || '-'}</td>
                    <td style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>{r.record_date || '-'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#6b7280', whiteSpace: 'nowrap' }}>{r.mobile || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{r.ref_number || '-'}</td>
                    <td style={{ fontFamily: 'Inter, sans-serif', color: '#374151' }}>{fmtNum(r.uploaded_count || 0)}</td>
                    <td style={{ fontFamily: 'Inter, sans-serif', color: '#16a34a', fontWeight: 600 }}>{fmtNum(r.dispensed_count || 0)}</td>
                    <td style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'Inter, sans-serif' }}>{fmtValue(r.net_value || 0)}</td>
                    <td style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.supervisor || '-'}</td>
                    <td style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{r.senior || '-'}</td>
                    <td><Badge region={r.region} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              {t.showing} {Math.min((dataPage - 1) * PER + 1, totalRecs)}–{Math.min(dataPage * PER, totalRecs)} {t.of} {fmtNum(totalRecs)} {t.records}
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => dataPage > 1 && setDataPage(p => p - 1)}
                style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#6b7280' }}>‹</button>
              {Array.from({ length: Math.min(totalPgs, 7) }, (_, i) => {
                const p = dataPage <= 4 ? i + 1 : dataPage + i - 3;
                if (p < 1 || p > totalPgs) return null;
                return (
                  <button key={p} onClick={() => setDataPage(p)}
                    style={{ padding: '4px 10px', border: `1px solid ${dataPage === p ? '#002544' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, cursor: 'pointer',
                      background: dataPage === p ? '#E8EEF4' : '#fff', color: dataPage === p ? '#002544' : '#6b7280', fontWeight: dataPage === p ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => dataPage < totalPgs && setDataPage(p => p + 1)}
                style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#6b7280' }}>›</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         TAB: CHARTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'charts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="ref-fade-in">

          {/* ── 1: Net Value by Month ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#f59e0b'}}>💰</span> {isEn ? 'Net Value by Month' : 'القيمة الصافية بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Monthly value trend' : 'الاتجاه الشهري للقيمة'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartM} margin={{ top:24, right:16, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="value" fill="#002544" radius={[6,6,0,0]} maxBarSize={56}>
                    <LabelList dataKey="value" position="top" style={{ fontSize:11, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 2: Dispensed Invoices by Month ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#10b981'}}>📋</span> {isEn ? 'Dispensed Invoices by Month' : 'الفواتير المصروفة بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Monthly dispensing count' : 'عدد الوصفات المصروفة شهرياً'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartM} margin={{ top:24, right:16, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtNum(v), isEn?'Dispensed':'المصروف']} />
                  <Bar dataKey="dispensed" fill="#10b981" radius={[6,6,0,0]} maxBarSize={56}>
                    <LabelList dataKey="dispensed" position="top" style={{ fontSize:11, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any)=>fmtNum(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 3: Net Value by Region ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#06b6d4'}}>🗺️</span> {isEn ? 'Net Value by Region' : 'صافي القيمة بالمنطقة'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Sorted by highest value' : 'مرتبة من الأعلى قيمة'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...chartRegion].sort((a,b)=>b.value-a.value).slice(0,8).map(r=>({ name: r.region || r.name, val: r.value }))}
                  layout="vertical" margin={{ top:4, right:60, left:4, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize:11, fill:'#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="val" radius={[0,6,6,0]} maxBarSize={26}>
                    {[...chartRegion].sort((a,b)=>b.value-a.value).slice(0,8).map((_r, idx) => (
                      <Cell key={idx} fill={idx===0?'#002544':'#e2e8f0'} />
                    ))}
                    <LabelList dataKey="val" position="right" style={{ fontSize:11, fontWeight:700, fill:'#374151', fontFamily:'Inter' }} formatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 4: Dispensed by Region ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#8b5cf6'}}>🗺️</span> {isEn ? 'Dispensed by Region' : 'المصروف بالمنطقة'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top regions by invoice count' : 'أعلى المناطق بعدد الفواتير'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...chartRegion].sort((a,b)=>b.count-a.count).slice(0,8).map(r=>({ name: r.region || r.name, val: r.count }))}
                  layout="vertical" margin={{ top:4, right:60, left:4, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize:11, fill:'#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtNum(v), isEn?'Dispensed':'المصروف']} />
                  <Bar dataKey="val" fill="#8b5cf6" radius={[0,6,6,0]} maxBarSize={26}>
                    <LabelList dataKey="val" position="right" style={{ fontSize:11, fontWeight:700, fill:'#374151', fontFamily:'Inter' }} formatter={(v:any)=>fmtNum(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 5: Net Value by Senior ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#FFC200'}}>👤</span> {isEn ? 'Net Value by Senior' : 'صافي القيمة بالسينيور'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top seniors by net value' : 'أعلى سينيور بالقيمة'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...chartSenior].sort((a,b)=>b.value-a.value).slice(0,8).map(r=>({ name: (r.name||'').split(' ').slice(0,2).join(' '), val:r.value }))}
                  margin={{ top:24, right:16, left:-8, bottom:30 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="val" fill="#002544" radius={[4,4,0,0]} maxBarSize={40}>
                    <LabelList dataKey="val" position="top" style={{ fontSize:10, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 6: Dispensed by Senior ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#10b981'}}>👤</span> {isEn ? 'Dispensed by Senior' : 'المصروف بالسينيور'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top seniors by invoice count' : 'أعلى سينيور بعدد الفواتير'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...chartSenior].sort((a,b)=>b.dispensed-a.dispensed).slice(0,8).map(r=>({ name: (r.name||'').split(' ').slice(0,2).join(' '), val:r.dispensed }))}
                  margin={{ top:24, right:16, left:-8, bottom:30 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtNum(v), isEn?'Dispensed':'المصروف']} />
                  <Bar dataKey="val" fill="#10b981" radius={[4,4,0,0]} maxBarSize={40}>
                    <LabelList dataKey="val" position="top" style={{ fontSize:10, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any)=>fmtNum(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 7: Invoices & Value by Month (Mixed) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#8b5cf6'}}>⚖️</span> {isEn ? 'Invoices & Value by Month' : 'الفواتير والقيمة بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Combined bar & line chart' : 'مخطط مزدوج — عمودي وخطي'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartM} margin={{ top:16, right:20, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:11, fontFamily:'Inter' }} formatter={(val:string) => val==='dispensed'?(isEn?'Dispensed':'المصروف'):(isEn?'Net Value':'القيمة')} />
                  <Bar yAxisId="left" dataKey="dispensed" fill="#10b981" radius={[4,4,0,0]} maxBarSize={50} name="dispensed" />
                  <Line yAxisId="right" type="monotone" dataKey="value" stroke="#FFC200" strokeWidth={2.5} dot={{ fill:'#fff', stroke:'#FFC200', strokeWidth:2, r:5 }} name="value" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 8: Success Rate by Month (Area) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#002544'}}>📈</span> {isEn ? 'Success Rate by Month' : 'معدل النجاح بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Dispensed / Uploaded ratio (%)' : 'نسبة المصروف من المرفوع'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartM} margin={{ top:28, right:16, left:-8, bottom:4 }}>
                  <defs>
                    <linearGradient id="rateGradCC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC200" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FFC200" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v+'%'} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [v+'%', isEn?'Success Rate':'معدل النجاح']} />
                  <Area type="monotone" dataKey="rate" stroke="#FFC200" strokeWidth={3} fill="url(#rateGradCC)"
                    dot={{ fill:'#ffffff', stroke:'#FFC200', strokeWidth:2, r:5 }} activeDot={{ r:6 }}>
                    <LabelList dataKey="rate" position="top" style={{ fontSize:12, fontWeight:700, fill:'#FFC200', fontFamily:'Inter' }} formatter={(v:any)=>v+'%'} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         TAB: RANKINGS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ranking' && (
        <div className="ref-fade-in">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', alignSelf: 'center' }}>{t.rankBy}:</span>
            {([
              { id: 'supervisor', lbl: t.bySupervisor },
              { id: 'senior',     lbl: t.bySenior     },
              { id: 'district',   lbl: t.byDistrict   },
              { id: 'region',     lbl: t.byRegion     },
            ] as const).map(rb => (
              <button key={rb.id} onClick={() => setRankType(rb.id)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${rankType === rb.id ? '#002544' : '#e5e7eb'}`,
                  background: rankType === rb.id ? '#E8EEF4' : '#fff',
                  color: rankType === rb.id ? '#002544' : '#6b7280',
                }}>
                {rb.lbl}
              </button>
            ))}
          </div>
          <div className="ref-card">
            <div className="ref-table-container">
              <table className="ref-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th className="sortable" onClick={() => toggleSort('name', sortRank, setSortRank)}>{isEn?'Name':'الاسم'} <SortIcon col="name" cfg={sortRank}/></th>
                    <th className="sortable" onClick={() => toggleSort('tot_u', sortRank, setSortRank)}>{t.uploaded} <SortIcon col="tot_u" cfg={sortRank}/></th>
                    <th className="sortable" onClick={() => toggleSort('tot_i', sortRank, setSortRank)}>{t.dispensed} <SortIcon col="tot_i" cfg={sortRank}/></th>
                    <th className="sortable" onClick={() => toggleSort('pct', sortRank, setSortRank)}>{t.success} <SortIcon col="pct" cfg={sortRank}/></th>
                    <th className="sortable" onClick={() => toggleSort('tot_v', sortRank, setSortRank)}>{t.netValue} <SortIcon col="tot_v" cfg={sortRank}/></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRank.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'#9ca3af' }}>{t.noData}</td></tr>
                  )}
                  {sortedRank.map((r, i) => (
                    <tr key={r.name}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: i < 3 ? '#FFC200' : '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{r.name}</td>
                      <td style={{ fontFamily: 'Inter, sans-serif' }}>{fmtNum(r.tot_u)}</td>
                      <td style={{ fontFamily: 'Inter, sans-serif', color: '#16a34a', fontWeight: 600 }}>{fmtNum(r.tot_i)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.pct * 100).toFixed(0)}%`, background: r.pct >= 0.5 ? '#10b981' : r.pct >= 0.3 ? '#FFC200' : '#ef4444', height: '100%', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: 'Inter, sans-serif', minWidth: 40 }}>{(r.pct * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'Inter, sans-serif' }}>{fmtValue(r.tot_v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         TAB: TOP / BOTTOM
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'topbottom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="ref-fade-in">
          {([
            { title: '🏆 ' + t.top,    data: [...rankAll].sort((a,b) => b.pct - a.pct).slice(0, 10), color: '#10b981' },
            { title: '⚠️ ' + t.bottom, data: [...rankAll].sort((a,b) => a.pct - b.pct).slice(0, 10), color: '#ef4444' },
          ]).map((section, si) => (
            <div key={si} className="ref-card">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{section.title}</h3>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.data.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>{t.noData}</p>
                )}
                {section.data.map((r, i) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', width: 20, textAlign: 'center', fontFamily: 'Inter' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
         