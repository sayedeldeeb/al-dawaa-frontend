/**
 * ChurnedCustomerPage — Reference Design v2
 * Matches Refrence - Copy.html exactly
 * Used as design template for all project pages
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts';

/* ══════════════════════════════════════════════════════════════════════════
   SAMPLE DATA  (replace with real API data when backend connected)
══════════════════════════════════════════════════════════════════════════ */
const RAW_BASE_DATA = [
  { ph: 'P0201', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'Hossam Mostafa'         },
  { ph: 'P0463', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'Hayaa Al-Shemary'       },
  { ph: 'P0265', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'Soliman Auda'           },
  { ph: 'P0253', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'AbdulAziz Hadi'         },
  { ph: 'P0614', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'Mohamed Lotfy'          },
  { ph: 'P0436', region: 'Central',  district: 'Ekramy Hassan',      senior: 'Alsayed AlSeadawy', supervisor: 'Hossam Abdullah'        },
  { ph: 'P0270', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'AbdelAal Mohamed',  supervisor: 'Mohamed Gaad'           },
  { ph: 'P0291', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'AbdelAal Mohamed',  supervisor: 'Hossam Mowafy'          },
  { ph: 'P0262', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'AbdelAal Mohamed',  supervisor: 'Mostafa AbdelBaset'     },
  { ph: 'P0252', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'AbdelAal Mohamed',  supervisor: 'Mohamed Al-Manzalawy'   },
  { ph: 'N0011', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'AbdelAal Mohamed',  supervisor: 'Mohammed Mohyeldeen'    },
  { ph: 'P0245', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'Mohamed Metwaly',   supervisor: 'Mohamed AbdelMohsen'    },
  { ph: 'P0266', region: 'Central',  district: 'Mahmoud Mokhtar',    senior: 'Mohamed Metwaly',   supervisor: 'Adel Tawfik'            },
  { ph: 'P0104', region: 'Eastern',  district: 'Tamer Abo AlSaud',   senior: 'Wael Abdul Gaid',   supervisor: 'Ahmed Subhi'            },
  { ph: 'P0050', region: 'Eastern',  district: 'Tamer Abo AlSaud',   senior: 'Wael Abdul Gaid',   supervisor: 'Ahmed Magdi'            },
  { ph: 'P0013', region: 'Eastern',  district: 'Tamer Abo AlSaud',   senior: 'Wael Abdul Gaid',   supervisor: 'Ramy Damarany'          },
  { ph: 'P0021', region: 'Eastern',  district: 'Ahmed Raafat',       senior: 'Ahmed Raafat',      supervisor: 'Ayman Al-Nagar'         },
  { ph: 'P0002', region: 'Eastern',  district: 'Tamer Abo AlSaud',   senior: 'Ahmed Raafat',      supervisor: 'Ali Abo Seadah'         },
  { ph: 'P0020', region: 'Eastern',  district: 'Alaa Shaker',        senior: 'Abdullah Negm',     supervisor: 'Ibrahim Gamea'          },
  { ph: 'P0036', region: 'Eastern',  district: 'Alaa Shaker',        senior: 'Abdullah Negm',     supervisor: 'Mohamed Azab'           },
  { ph: 'P0141', region: 'Northern', district: 'Wael Helal',         senior: 'Mohamed Al-Shafey', supervisor: 'Mohamed El-Sayed'       },
  { ph: 'P0400', region: 'Northern', district: 'Wael Helal',         senior: 'Mohamed Al-Shafey', supervisor: 'Ali Al-Nagar'           },
  { ph: 'P0999', region: 'Western',  district: 'Hazem AbdelWahed',   senior: 'Mohamed Al-Khatib', supervisor: 'Ahmed El-Sharawy'       },
  { ph: 'P1022', region: 'Southern', district: 'Hazem AbdelWahed',   senior: 'Mohamed Al-Khatib', supervisor: 'Mohamed Ahmed Saleh'    },
  { ph: 'N0006', region: 'Western',  district: 'Mohamed Galal',      senior: 'Hany Nosir',        supervisor: 'Mahmoud Ellafy'         },
  { ph: 'N0010', region: 'Western',  district: 'Mohamed Galal',      senior: 'Hany Nosir',        supervisor: 'Ahmed Motawea'          },
];

const REGIONS_EN = ['Central', 'Western', 'Eastern', 'Northern', 'Southern'];
const REGIONS_AR = ['الوسطى', 'الغربية', 'الشرقية', 'الشمالية', 'الجنوبية'];

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
    noData: 'لا توجد بيانات تطابق الفلتر.',
    date: 'التاريخ', mobile: 'رقم الجوال', value: 'القيمة',
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
    noData: 'No data matches your filters.',
    date: 'Date', mobile: 'Mobile', value: 'Net Value',
    rankBy: 'Rank by',
    bySupervisor: 'Supervisor', bySenior: 'Senior', byDistrict: 'District', byRegion: 'Region',
    top: 'Top Performers', bottom: 'Bottom Performers',
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */
const hsh = (s: string) => { let h = 5381; for (let i = 0; i < (s || '').length; i++) h = ((h << 5) + h) + s.charCodeAt(i) | 0; return Math.abs(h); };

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
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };
const sortData = <T extends Record<string, any>>(arr: T[], cfg: SortConfig): T[] =>
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
  const cls = region === 'Central' ? 'ref-badge-blue' : region === 'Western' ? 'ref-badge-purple'
    : region === 'Eastern' ? 'ref-badge-emerald' : region === 'Northern' ? 'ref-badge-yellow' : 'ref-badge-gray';
  return <span className={`ref-badge ${cls}`}>{region}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function ChurnedCustomerPage({ projectId }: { projectId?: string }) {
  const { lang } = useAuthStore();
  const isEn = lang === 'en';
  const t = T[lang as 'ar' | 'en'] ?? T.en;

  const [activeTab, setActiveTab]   = useState<'data' | 'charts' | 'ranking' | 'topbottom'>('data');
  const [rankType, setRankType]     = useState<'supervisor' | 'senior' | 'district' | 'region'>('supervisor');
  const [showFilter, setShowFilter] = useState(false);
  const [dataPage, setDataPage]     = useState(1);
  const [sortData2, setSortData2]   = useState<SortConfig>({ key: 'tot_v', direction: 'desc' });
  const [sortRank,  setSortRank]    = useState<SortConfig>({ key: 'tot_i', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState(new Set<string>());
  const PER = 15;

  const [filters, setFilters] = useState({
    search: '', region: '', senior: '', supervisor: '', district: '', dateFrom: '', dateTo: '',
  });

  /* ── Enrich data ─────────────────────────────────────────────────────── */
  const enriched = useMemo(() => RAW_BASE_DATA.map(r => {
    const h      = hsh(r.supervisor + r.ph);
    const jan_u  = 4000 + (h % 5000);
    const jan_i  = Math.round(jan_u * (0.2 + ((h % 50) / 100)));
    const feb_u  = 4500 + (h % 5000);
    const feb_i  = Math.round(feb_u * (0.2 + ((h % 50) / 100)));
    const mar_u  = 5000 + (h % 5000);
    const mar_i  = Math.round(mar_u * (0.2 + ((h % 50) / 100)));
    const tot_u  = jan_u + feb_u + mar_u;
    const tot_i  = jan_i + feb_i + mar_i;
    const tot_v  = tot_i * 180;
    const id     = '2' + String(h).padStart(9,'0').slice(0,9);
    const ref    = String.fromCharCode(97 + (h % 26)) + String(h * 13).padStart(7,'0').slice(0,7);
    const mobile = '05' + String(50000000 + (h % 40000000)).slice(0,8);
    return {
      ...r, _id: id, _ref: ref, _mobile: mobile,
      _refill_date: '08 Apr 2026',
      _regionEN: r.region,
      _region: isEn ? r.region : (REGIONS_AR[REGIONS_EN.indexOf(r.region)] ?? r.region),
      jan_u, jan_i, jan_v: jan_i * 180,
      feb_u, feb_i, feb_v: feb_i * 180,
      mar_u, mar_i, mar_v: mar_i * 180,
      tot_u, tot_i, tot_v,
      _pct: tot_u > 0 ? tot_i / tot_u : 0,
    };
  }), [isEn]);

  /* ── Filter options ──────────────────────────────────────────────────── */
  const opts = useMemo(() => ({
    regions:     [...new Set(enriched.map(r => r._regionEN))].sort(),
    seniors:     [...new Set(enriched.map(r => r.senior))].sort(),
    supervisors: [...new Set(enriched.map(r => r.supervisor))].sort(),
    districts:   [...new Set(enriched.map(r => r.district))].sort(),
  }), [enriched]);

  /* ── Apply filters ───────────────────────────────────────────────────── */
  const filtered = useMemo(() => enriched.filter(r => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!r.senior.toLowerCase().includes(s) && !r.supervisor.toLowerCase().includes(s) &&
          !r._mobile.includes(s) && !r.ph.toLowerCase().includes(s) && !r._ref.includes(s)) return false;
    }
    if (filters.region && r._regionEN !== filters.region) return false;
    if (filters.senior && r.senior !== filters.senior) return false;
    if (filters.supervisor && r.supervisor !== filters.supervisor) return false;
    if (filters.district && r.district !== filters.district) return false;
    return true;
  }), [enriched, filters]);

  useEffect(() => { setDataPage(1); setSelectedRows(new Set()); }, [filters, activeTab]);

  /* ── Totals ──────────────────────────────────────────────────────────── */
  const totals = useMemo(() => {
    const tu = filtered.reduce((s, r) => s + r.tot_u, 0);
    const ti = filtered.reduce((s, r) => s + r.tot_i, 0);
    const tv = filtered.reduce((s, r) => s + r.tot_v, 0);
    return { tu, ti, tp: tu - ti, tv, pct: tu > 0 ? ti / tu : 0 };
  }, [filtered]);

  /* ── Monthly totals ──────────────────────────────────────────────────── */
  const monthly = useMemo(() => ({
    jan: { u: filtered.reduce((s,r)=>s+r.jan_u,0), i: filtered.reduce((s,r)=>s+r.jan_i,0), v: filtered.reduce((s,r)=>s+r.jan_v,0) },
    feb: { u: filtered.reduce((s,r)=>s+r.feb_u,0), i: filtered.reduce((s,r)=>s+r.feb_i,0), v: filtered.reduce((s,r)=>s+r.feb_v,0) },
    mar: { u: filtered.reduce((s,r)=>s+r.mar_u,0), i: filtered.reduce((s,r)=>s+r.mar_i,0), v: filtered.reduce((s,r)=>s+r.mar_v,0) },
  }), [filtered]);

  const MN = isEn ? ['Jan','Feb','Mar'] : ['يناير','فبراير','مارس'];

  /* ── Group helper ────────────────────────────────────────────────────── */
  const grp = (keyFn: (r: typeof enriched[0]) => string) => {
    const acc: Record<string, { name: string; tot_u: number; tot_i: number; tot_v: number }> = {};
    filtered.forEach(r => {
      const k = keyFn(r); if (!k) return;
      if (!acc[k]) acc[k] = { name: k, tot_u: 0, tot_i: 0, tot_v: 0 };
      acc[k].tot_u += r.tot_u; acc[k].tot_i += r.tot_i; acc[k].tot_v += r.tot_v;
    });
    return Object.values(acc).map(r => ({ ...r, pct: r.tot_u > 0 ? r.tot_i / r.tot_u : 0 }));
  };

  const byRegion     = useMemo(() => grp(r => r._regionEN), [filtered]);
  const bySenior     = useMemo(() => grp(r => r.senior),    [filtered]);
  const bySupervisor = useMemo(() => grp(r => r.supervisor),[filtered]);
  const byDistrict   = useMemo(() => grp(r => r.district),  [filtered]);

  const getRankData = () => {
    const src = rankType === 'senior' ? bySenior : rankType === 'supervisor' ? bySupervisor
      : rankType === 'district' ? byDistrict : byRegion;
    return sortData(src, sortRank);
  };

  /* ── Sorted + paginated table data ───────────────────────────────────── */
  const sortedFiltered = useMemo(() => sortData(filtered, sortData2), [filtered, sortData2]);
  const totalPgs  = Math.ceil(sortedFiltered.length / PER);
  const pageData  = sortedFiltered.slice((dataPage - 1) * PER, dataPage * PER);
  const isFilterActive = Object.values(filters).some(v => v !== '');

  const toggleSort = (key: string, cfg: SortConfig, set: (c: SortConfig) => void) => {
    set({ key, direction: cfg.key === key && cfg.direction === 'desc' ? 'asc' : 'desc' });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = new Set(selectedRows);
    if (e.target.checked) pageData.forEach(r => s.add(r._id));
    else pageData.forEach(r => s.delete(r._id));
    setSelectedRows(s);
  };

  /* ── Chart data ──────────────────────────────────────────────────────── */
  const chartMonthly = [
    { name: MN[0], uploaded: monthly.jan.u, dispensed: monthly.jan.i, value: monthly.jan.v, rate: monthly.jan.u>0 ? +(monthly.jan.i/monthly.jan.u*100).toFixed(1) : 0 },
    { name: MN[1], uploaded: monthly.feb.u, dispensed: monthly.feb.i, value: monthly.feb.v, rate: monthly.feb.u>0 ? +(monthly.feb.i/monthly.feb.u*100).toFixed(1) : 0 },
    { name: MN[2], uploaded: monthly.mar.u, dispensed: monthly.mar.i, value: monthly.mar.v, rate: monthly.mar.u>0 ? +(monthly.mar.i/monthly.mar.u*100).toFixed(1) : 0 },
  ];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 40 }} className="ref-fade-in">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{t.pageTitle}</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{filtered.length} {t.records}</p>
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

      {/* ── Advanced Filter Panel ──────────────────────────────────────── */}
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
                {opts.regions.map(r => <option key={r} value={r}>{isEn ? r : (REGIONS_AR[REGIONS_EN.indexOf(r)] ?? r)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.senior}</label>
              <select className="ref-filter-select" value={filters.senior} onChange={e => setFilters(f => ({ ...f, senior: e.target.value }))}>
                <option value="">{t.allSeniors}</option>
                {opts.seniors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.supervisor}</label>
              <select className="ref-filter-select" value={filters.supervisor} onChange={e => setFilters(f => ({ ...f, supervisor: e.target.value }))}>
                <option value="">{t.allSupervisors}</option>
                {opts.supervisors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 6 }}>{t.district}</label>
              <select className="ref-filter-select" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
                <option value="">{t.allDistricts}</option>
                {opts.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
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

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 28, marginBottom: 20 }}>
        {([
          { id: 'data',     icon: <Ic.FileText />, lbl: t.detailedReport },
          { id: 'charts',   icon: <Ic.Chart />,    lbl: t.charts         },
          { id: 'ranking',  icon: <Ic.Trophy />,   lbl: t.rankings       },
          { id: 'topbottom',icon: <Ic.Medal />,    lbl: t.topBottom      },
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
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Ic.FileText /> {t.detailedReport}</h3>
          </div>
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }}
                      checked={pageData.length > 0 && pageData.every(r => selectedRows.has(r._id))}
                      onChange={handleSelectAll} />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('ph', sortData2, setSortData2)}>PH <SortIcon col="ph" cfg={sortData2}/></th>
                  <th>{t.date}</th>
                  <th className="sortable" onClick={() => toggleSort('_id', sortData2, setSortData2)}>ID <SortIcon col="_id" cfg={sortData2}/></th>
                  <th>{t.mobile}</th>
                  <th>REF</th>
                  <th className="sortable" onClick={() => toggleSort('tot_v', sortData2, setSortData2)}>{t.value} <SortIcon col="tot_v" cfg={sortData2}/></th>
                  <th className="sortable" onClick={() => toggleSort('supervisor', sortData2, setSortData2)}>{t.supervisor} <SortIcon col="supervisor" cfg={sortData2}/></th>
                  <th className="sortable" onClick={() => toggleSort('senior', sortData2, setSortData2)}>{t.senior} <SortIcon col="senior" cfg={sortData2}/></th>
                  <th>{t.district}</th>
                  <th>{t.region}</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>{t.noData}</td></tr>
                )}
                {pageData.map(r => (
                  <tr key={r._id} style={selectedRows.has(r._id) ? { background: 'rgba(59,130,246,0.04)' } : {}}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }}
                        checked={selectedRows.has(r._id)}
                        onChange={e => {
                          const s = new Set(selectedRows);
                          e.target.checked ? s.add(r._id) : s.delete(r._id);
                          setSelectedRows(s);
                        }} />
                    </td>
                    <td style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{r.ph}</td>
                    <td style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>{r._refill_date}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{r._id}</td>
                    <td style={{ fontFamily: 'monospace', color: '#6b7280', whiteSpace: 'nowrap' }}>{r._mobile}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{r._ref}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmtValue(r.tot_v)}</td>
                    <td style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.supervisor}</td>
                    <td style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{r.senior}</td>
                    <td><span className="ref-badge ref-badge-gray">{r.district}</span></td>
                    <td><Badge region={r._regionEN} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              {t.showing} {Math.min((dataPage - 1) * PER + 1, sortedFiltered.length)}–{Math.min(dataPage * PER, sortedFiltered.length)} {t.of} {sortedFiltered.length}
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                <button key="prev" onClick={() => dataPage > 1 && setDataPage(p => p - 1)}
                  style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#6b7280' }}>‹</button>,
                ...Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setDataPage(p)}
                    style={{ padding: '4px 10px', border: `1px solid ${dataPage === p ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, cursor: 'pointer',
                      background: dataPage === p ? '#eff6ff' : '#fff', color: dataPage === p ? '#2563eb' : '#6b7280', fontWeight: dataPage === p ? 700 : 400 }}>
                    {p}
                  </button>
                )),
                <button key="next" onClick={() => dataPage < totalPgs && setDataPage(p => p + 1)}
                  style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#6b7280' }}>›</button>,
              ]}
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
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#f59e0b'}}>💰</span> {isEn ? 'Net Value by Month' : 'القيمة الصافية بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Q1 2026 — Monthly trend' : 'الربع الأول 2026 — الاتجاه الشهري'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonthly} margin={{ top:24, right:16, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any) => v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} maxBarSize={56}>
                    <LabelList dataKey="value" position="top" style={{ fontSize:11, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any) => v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 2: Dispensed Invoices by Month ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#10b981'}}>📋</span> {isEn ? 'Invoices (Dispensed) by Month' : 'الفواتير (المصروفة) بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Monthly dispensing count' : 'عدد الوصفات المصروفة شهرياً'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonthly} margin={{ top:24, right:16, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtNum(v), isEn?'Dispensed':'المصروف']} />
                  <Bar dataKey="dispensed" fill="#10b981" radius={[6,6,0,0]} maxBarSize={56}>
                    <LabelList dataKey="dispensed" position="top" style={{ fontSize:11, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any) => fmtNum(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 3: Net Value by Region (Horizontal) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#06b6d4'}}>🗺️</span> {isEn ? 'Net Value by Region' : 'صافي القيمة بالمنطقة'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Sorted by highest value' : 'مرتبة من الأعلى قيمة'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...byRegion].sort((a,b)=>b.tot_v-a.tot_v).slice(0,6).map(r=>({ name: isEn?r.name:(REGIONS_AR[REGIONS_EN.indexOf(r.name)]??r.name), val:r.tot_v }))}
                  layout="vertical" margin={{ top:4, right:60, left:4, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize:11, fill:'#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="val" radius={[0,6,6,0]} maxBarSize={26}>
                    {[...byRegion].sort((a,b)=>b.tot_v-a.tot_v).slice(0,6).map((_r, idx) => (
                      <Cell key={idx} fill={idx===0?'#3b82f6':'#e2e8f0'} />
                    ))}
                    <LabelList dataKey="val" position="right" style={{ fontSize:11, fontWeight:700, fill:'#374151', fontFamily:'Inter' }} formatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 4: Dispensed Invoices by Region (Horizontal) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#8b5cf6'}}>🗺️</span> {isEn ? 'Invoices (Dispensed) by Region' : 'الفواتير (المصروفة) بالمنطقة'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top 6 regions by invoice count' : 'أعلى 6 مناطق بعدد الفواتير'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...byRegion].sort((a,b)=>b.tot_i-a.tot_i).slice(0,6).map(r=>({ name: isEn?r.name:(REGIONS_AR[REGIONS_EN.indexOf(r.name)]??r.name), val:r.tot_i }))}
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
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#8b5cf6'}}>👤</span> {isEn ? 'Net Value by Senior' : 'صافي القيمة بالسينيور'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top 8 seniors by net value' : 'أعلى 8 سينيور بالقيمة'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...bySenior].sort((a,b)=>b.tot_v-a.tot_v).slice(0,8).map(r=>({ name: r.name.split(' ').slice(0,2).join(' '), val:r.tot_v }))}
                  margin={{ top:24, right:16, left:-8, bottom:30 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [fmtValue(v), isEn?'Net Value':'القيمة']} />
                  <Bar dataKey="val" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={40}>
                    <LabelList dataKey="val" position="top" style={{ fontSize:10, fontWeight:700, fill:'#4b5563', fontFamily:'Inter' }} formatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 6: Dispensed by Senior ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#10b981'}}>👤</span> {isEn ? 'Invoices (Dispensed) by Senior' : 'الفواتير (المصروفة) بالسينيور'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Top 8 seniors by invoice count' : 'أعلى 8 سينيور بعدد الفواتير'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...bySenior].sort((a,b)=>b.tot_i-a.tot_i).slice(0,8).map(r=>({ name: r.name.split(' ').slice(0,2).join(' '), val:r.tot_i }))}
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

          {/* ── 7: Invoices & Value by Month (Mixed: Bar + Line) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#8b5cf6'}}>⚖️</span> {isEn ? 'Invoices & Value by Month' : 'الفواتير والقيمة بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Combined bar & line chart' : 'مخطط مزدوج — عمودي وخطي'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartMonthly} margin={{ top:16, right:20, left:-8, bottom:4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':String(v)} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:11, fontFamily:'Inter' }} formatter={(val:string) => val === 'dispensed' ? (isEn?'Dispensed':'المصروف') : (isEn?'Net Value':'القيمة')} />
                  <Bar yAxisId="left" dataKey="dispensed" fill="#10b981" radius={[4,4,0,0]} maxBarSize={50} name="dispensed" />
                  <Line yAxisId="right" type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill:'#fff', stroke:'#3b82f6', strokeWidth:2, r:5 }} name="value" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 8: Success Rate by Month (Area) ── */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(0,0,0,0.03)', padding:24 }}>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{color:'#3b82f6'}}>📈</span> {isEn ? 'Success Rate by Month' : 'معدل النجاح بالشهر'}
              </h3>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{isEn ? 'Dispensed / Uploaded ratio (%)' : 'نسبة المصروف من المرفوع'}</p>
            </div>
            <div style={{ height:256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonthly} margin={{ top:28, right:16, left:-8, bottom:4 }}>
                  <defs>
                    <linearGradient id="rateGradCC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v:any)=>v+'%'} />
                  <Tooltip contentStyle={{ background:'rgba(15,23,42,0.9)', border:'none', borderRadius:8, color:'#fff', fontSize:12 }} formatter={(v:any) => [v+'%', isEn?'Success Rate':'معدل النجاح']} />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} fill="url(#rateGradCC)"
                    dot={{ fill:'#ffffff', stroke:'#3b82f6', strokeWidth:2, r:5 }} activeDot={{ r:6 }}>
                    <LabelList dataKey="rate" position="top" style={{ fontSize:12, fontWeight:700, fill:'#3b82f6', fontFamily:'Inter' }} formatter={(v:any)=>v+'%'} />
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
                  border: `1px solid ${rankType === rb.id ? '#3b82f6' : '#e5e7eb'}`,
                  background: rankType === rb.id ? '#eff6ff' : '#fff',
                  color: rankType === rb.id ? '#2563eb' : '#6b7280',
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
                  {getRankData().map((r, i) => (
                    <tr key={r.name}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: i < 3 ? '#f59e0b' : '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{r.name}</td>
                      <td style={{ fontFamily: 'Inter, sans-serif' }}>{fmtNum(r.tot_u)}</td>
                      <td style={{ fontFamily: 'Inter, sans-serif', color: '#16a34a', fontWeight: 600 }}>{fmtNum(r.tot_i)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.pct * 100).toFixed(0)}%`, background: r.pct >= 0.5 ? '#10b981' : r.pct >= 0.3 ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: 4 }} />
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
            { title: '🏆 ' + t.top,    data: [...bySupervisor].sort((a,b) => b.pct - a.pct).slice(0,8),    color: '#10b981' },
            { title: '⚠️ ' + t.bottom, data: [...bySupervisor].sort((a,b) => a.pct - b.pct).slice(0,8),    color: '#ef4444' },
          ]).map((section, si) => (
            <div key={si} className="ref-card">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{section.title}</h3>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.data.map((r, i) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', width: 20, textAlign: 'center', fontFamily: 'Inter' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: section.color, fontFamily: 'Inter' }}>{(r.pct * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${(r.pct * 100).toFixed(0)}%`, background: section.color, height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
