import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { FilterState } from '../../types';

interface FilterOption { value: string; label: string; }
interface FilterField {
  key: string; labelEn: string; labelAr: string;
  type: 'multiselect' | 'date' | 'search' | 'select' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  /** Optional label shown above date inputs, e.g. "Refill Date" */
  dateLabelEn?: string;
  dateLabelAr?: string;
}

// ── Dropdown multi-select ─────────────────────────────────────────────────────
function MultiSelect({
  label, options, selected, onChange,
}: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="filter-input flex items-center justify-between gap-2 text-left"
        style={{ color: selected.length > 0 ? '#1e2535' : '#adb5c2' }}
      >
        <span className="truncate text-sm">
          {selected.length > 0
            ? selected.length === 1
              ? selected[0]
              : `${selected.length} selected`
            : label}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selected.length > 0 && (
            <span
              className="rounded-full text-white flex items-center justify-center"
              style={{ background: '#002544', width: 16, height: 16, fontSize: 9, fontWeight: 700 }}
            >
              {selected.length}
            </span>
          )}
          <ChevronDown
            size={12}
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            style={{ color: '#adb5c2' }}
          />
        </div>
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-xl overflow-hidden"
          style={{
            background: '#fff',
            border: '1px solid #E4E8EF',
            boxShadow: '0 8px 24px rgba(30,37,53,0.12)',
            minWidth: 180,
          }}
        >
          {/* Search inside dropdown */}
          {options.length > 6 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={12} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full border border-gray-200 rounded-lg ps-7 pe-2 py-1.5 text-xs focus:outline-none focus:ring-2"
                  style={{ fontSize: 12 }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Clear all */}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2"
              style={{ fontSize: 12, color: '#dc2626', borderBottom: '1px solid #fef2f2' }}
            >
              <X size={11} /> Clear all ({selected.length})
            </button>
          )}

          {/* Options */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : filtered.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer"
                style={{ fontSize: 13 }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded"
                  style={{ accentColor: '#002544', width: 13, height: 13 }}
                />
                <span style={{ color: selected.includes(opt) ? '#002544' : '#4a5568' }}>{opt}</span>
                {selected.includes(opt) && (
                  <span className="ms-auto" style={{ color: '#00A651', fontSize: 10 }}>✓</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FilterPanel({ fields, filters, onChange, onReset, dateLabelEn, dateLabelAr }: FilterPanelProps) {
  const { t, lang } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // Count active filters
  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (filters.search)    activeFilters.push({ key: 'search',   label: 'Search', value: filters.search });
  if (filters.dateFrom)  activeFilters.push({ key: 'dateFrom', label: t.dateFrom, value: filters.dateFrom });
  if (filters.dateTo)    activeFilters.push({ key: 'dateTo',   label: t.dateTo, value: filters.dateTo });
  fields.forEach(f => {
    const vals = filters.columns?.[f.key] || [];
    vals.forEach(v => activeFilters.push({
      key: `col_${f.key}_${v}`,
      label: lang === 'ar' ? f.labelAr : f.labelEn,
      value: v,
    }));
  });

  const activeCount = activeFilters.length;

  const update        = (key: string, val: any) => onChange({ ...filters, [key]: val });
  const updateColumn  = (col: string, vals: string[]) =>
    onChange({ ...filters, columns: { ...(filters.columns || {}), [col]: vals } });
  const removeChip    = (chip: typeof activeFilters[0]) => {
    if (chip.key === 'search')    { update('search', '');   return; }
    if (chip.key === 'dateFrom')  { update('dateFrom', ''); return; }
    if (chip.key === 'dateTo')    { update('dateTo', '');   return; }
    if (chip.key.startsWith('col_')) {
      const parts = chip.key.split('_');
      const col   = parts[1];
      const val   = parts.slice(2).join('_');
      const curr  = filters.columns?.[col] || [];
      updateColumn(col, curr.filter(v => v !== val));
    }
  };

  return (
    <div className="filter-panel">
      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={15} style={{ color: '#002544' }} />
          <span className="font-semibold text-sm" style={{ color: '#1e2535' }}>
            {t.filters}
          </span>
          {activeCount > 0 && (
            <span
              className="rounded-full font-bold text-white"
              style={{ background: '#002544', fontSize: 10, padding: '1px 7px' }}
            >
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onReset(); }}
              className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 transition-colors"
              style={{ color: '#dc2626', background: '#fee2e2' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}
            >
              <X size={11} /> {t.resetFilters}
            </button>
          )}
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            style={{ color: '#adb5c2' }}
          />
        </div>
      </div>

      {/* ── Active filter chips ───────────────────────────────────────────── */}
      {activeCount > 0 && !collapsed && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pb-2.5" style={{ borderBottom: '1px solid #EEF1F6' }}>
          {activeFilters.map(chip => (
            <span key={chip.key} className="filter-chip">
              <span style={{ color: '#8a95a3', fontSize: 10, fontWeight: 400 }}>{chip.label}:</span>
              {chip.value}
              <button
                type="button"
                className="filter-chip-remove ms-0.5"
                onClick={e => { e.stopPropagation(); removeChip(chip); }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Filter inputs ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-3">
          {/* Search */}
          <div>
            <label className="filter-label">{t.search.replace('...', '')}</label>
            <div className="relative">
              <Search size={12} className="absolute start-2.5 top-1/2 -translate-y-1/2" style={{ color: '#adb5c2' }} />
              <input
                value={filters.search || ''}
                onChange={e => update('search', e.target.value)}
                placeholder={t.search}
                className="filter-input ps-8"
              />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label className="filter-label">
              {dateLabelEn
                ? (lang === 'ar'
                    ? `${dateLabelAr || dateLabelEn} — من`
                    : `${dateLabelEn} — From`)
                : t.dateFrom}
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={e => update('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="filter-label">
              {dateLabelEn
                ? (lang === 'ar'
                    ? `${dateLabelAr || dateLabelEn} — إلى`
                    : `${dateLabelEn} — To`)
                : t.dateTo}
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={e => update('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Dynamic fields */}
          {fields.map(f => (
            <div key={f.key}>
              <label className="filter-label">{lang === 'ar' ? f.labelAr : f.labelEn}</label>
              {f.type === 'multiselect' && f.options && (
                <MultiSelect
                  label={lang === 'ar' ? f.labelAr : f.labelEn}
                  options={f.options.map(o => o.value)}
                  selected={(filters.columns?.[f.key]) || []}
                  onChange={vals => updateColumn(f.key, vals)}
                />
              )}
              {f.type === 'text' && (
                <input
                  type="text"
                  value={(filters.columns?.[f.key])?.[0] || ''}
                  onChange={e => {
                    const v = e.target.value.trim();
                    updateColumn(f.key, v ? [v] : []);
                  }}
                  placeholder={f.placeholder || (lang === 'ar' ? f.labelAr : f.labelEn)}
                  className="filter-input"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FilterField, FilterOption };
