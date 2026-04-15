/**
 * DashboardControls — Project-level Admin Control Panel
 * ======================================================
 * Allows Admin users to fully configure project dashboards from inside
 * the platform UI without any coding.
 *
 * Sections:
 *  A) Component Management  — add/remove KPI cards, charts, sections; drag-reorder
 *  B) KPI Builder           — define KPI name, source, formula, format
 *  C) Table Controls        — add/remove/rename/reorder columns
 *  D) Filter Builder        — add/remove/rename filters, map to columns, set type
 *  E) Visual Controls       — color, font-size, spacing within AL-Dawaa palette
 *  F) Chart Builder         — data source, measure, dimension, aggregation
 *
 * All config is persisted to localStorage under key `dc_<projectId>`.
 */
import React, { useState, useCallback } from 'react';
import {
  Settings, ChevronDown, ChevronUp, Plus, Trash2, GripVertical,
  BarChart2, Target, Filter, Palette, Table2, Save, RotateCcw,
  Eye, EyeOff, MoveUp, MoveDown, Check, Sun, Moon, Zap, Briefcase,
} from 'lucide-react';
import { useAuthStore, AppTheme } from '../../store/authStore';

// ── Config changed event broadcaster ────────────────────────────────────────
export function broadcastConfigChange(projectId: string) {
  window.dispatchEvent(new CustomEvent('dc-changed', { detail: { projectId } }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface KPIConfig {
  id: string;
  name: string;
  nameAr: string;
  source: string;         // field name in data
  method: 'count' | 'sum' | 'average' | 'percentage';
  formula: string;        // free-form e.g. "invoiced / uploaded * 100"
  format: 'number' | 'currency' | 'percentage';
  color: string;
  visible: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  titleAr: string;
  source: string;
  measure: string;
  dimension: string;
  aggregation: 'count' | 'sum' | 'average' | 'min' | 'max';
  chartType: string;
  color: string;
  visible: boolean;
}

export interface ColumnConfig {
  id: string;
  field: string;
  label: string;
  labelAr: string;
  visible: boolean;
  order: number;
}

export interface FilterConfig {
  id: string;
  label: string;
  labelAr: string;
  field: string;
  type: 'dropdown' | 'multiselect' | 'daterange' | 'search';
  visible: boolean;
}

export interface VisualConfig {
  primaryColor: string;
  accentColor: string;
  fontSize: 'sm' | 'base' | 'lg';
  spacing: 'compact' | 'normal' | 'relaxed';
}

export interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ProjectDashboardConfig {
  kpis:     KPIConfig[];
  charts:   ChartConfig[];
  columns:  ColumnConfig[];
  filters:  FilterConfig[];
  visual:   VisualConfig;
  sections: SectionConfig[];
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'kpis',    label: 'KPI Cards',         visible: true, order: 0 },
  { id: 'filters', label: 'Filters',            visible: true, order: 1 },
  { id: 'charts',  label: 'Charts',             visible: true, order: 2 },
  { id: 'table',   label: 'Data Table',         visible: true, order: 3 },
  { id: 'ranking', label: 'Rankings & Insights',visible: true, order: 4 },
];

const DEFAULT_VISUAL: VisualConfig = {
  primaryColor: '#002544',
  accentColor:  '#FFC200',
  fontSize:     'base',
  spacing:      'normal',
};

function defaultConfig(): ProjectDashboardConfig {
  return { kpis: [], charts: [], columns: [], filters: [], visual: DEFAULT_VISUAL, sections: DEFAULT_SECTIONS };
}

// ── AL-Dawaa palette choices ──────────────────────────────────────────────────
const PALETTE = [
  '#002544', '#FFC200', '#10b981', '#0891b2',
  '#7c3aed', '#d97706', '#c2410c', '#4f46e5',
  '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
];

// ── Pill / Badge helpers ──────────────────────────────────────────────────────
const MethodBadge = ({ m }: { m: string }) => {
  const map: Record<string, string> = {
    count: 'bg-blue-100 text-blue-700',
    sum: 'bg-green-100 text-green-700',
    average: 'bg-yellow-100 text-yellow-700',
    percentage: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[m] || 'bg-gray-100 text-gray-600'}`}>
      {m}
    </span>
  );
};

const TypeBadge = ({ t }: { t: string }) => {
  const map: Record<string, string> = {
    dropdown: 'bg-sky-100 text-sky-700',
    multiselect: 'bg-indigo-100 text-indigo-700',
    daterange: 'bg-orange-100 text-orange-700',
    search: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[t] || 'bg-gray-100 text-gray-600'}`}>
      {t}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: A) Component Management (sections + ordering)
// ══════════════════════════════════════════════════════════════════════════════
function ComponentManager({ sections, onChange }: {
  sections: SectionConfig[];
  onChange: (s: SectionConfig[]) => void;
}) {
  const toggle  = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  const moveUp  = (idx: number) => {
    if (idx === 0) return;
    const arr = [...sections];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr.map((s, i) => ({ ...s, order: i })));
  };
  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return;
    const arr = [...sections];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Show/hide dashboard sections and drag to reorder their position.
      </p>
      {sections.map((s, idx) => (
        <div
          key={s.id}
          className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 border-gray-100 hover:bg-white transition-colors"
        >
          <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-gray-700">{s.label}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => moveUp(idx)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <MoveUp size={12} />
            </button>
            <button onClick={() => moveDown(idx)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <MoveDown size={12} />
            </button>
            <button
              onClick={() => toggle(s.id)}
              className={`p-1.5 rounded-lg transition-colors ${s.visible
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
              }`}
            >
              {s.visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: B) KPI Builder
// ══════════════════════════════════════════════════════════════════════════════
function KPIBuilder({ kpis, onChange }: { kpis: KPIConfig[]; onChange: (k: KPIConfig[]) => void }) {
  const [editing, setEditing] = useState<KPIConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blank = (): KPIConfig => ({
    id: Date.now().toString(), name: '', nameAr: '', source: '',
    method: 'count', formula: '', format: 'number', color: '#002544', visible: true,
  });

  const openNew  = () => { setEditing(blank()); setShowForm(true); };
  const openEdit = (k: KPIConfig) => { setEditing({ ...k }); setShowForm(true); };
  const cancel   = () => { setEditing(null); setShowForm(false); };

  const save = () => {
    if (!editing) return;
    const exists = kpis.find(k => k.id === editing.id);
    onChange(exists ? kpis.map(k => k.id === editing.id ? editing : k) : [...kpis, editing]);
    cancel();
  };

  const remove  = (id: string) => onChange(kpis.filter(k => k.id !== id));
  const toggleV = (id: string) => onChange(kpis.map(k => k.id === id ? { ...k, visible: !k.visible } : k));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Define KPI cards: name, data source, calculation, and display format.</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#002544' }}
        >
          <Plus size={12} /> Add KPI
        </button>
      </div>

      {/* KPI list */}
      <div className="space-y-2 mb-3">
        {kpis.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            No KPI cards configured yet. Click "Add KPI" to create one.
          </div>
        )}
        {kpis.map(k => (
          <div key={k.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${k.visible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{k.name || <em className="text-gray-400">Untitled</em>}</p>
              <p className="text-xs text-gray-400">{k.source} · <MethodBadge m={k.method} /></p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleV(k.id)} className={`p-1.5 rounded-lg ${k.visible ? 'text-green-600' : 'text-gray-400'}`}>
                {k.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button onClick={() => openEdit(k)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                <Settings size={13} />
              </button>
              <button onClick={() => remove(k.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {showForm && editing && (
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
            {kpis.find(k => k.id === editing.id) ? 'Edit KPI' : 'New KPI'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="filter-label">Name (EN)</label>
              <input className="filter-input text-xs" value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Success Rate" />
            </div>
            <div>
              <label className="filter-label">Name (AR)</label>
              <input className="filter-input text-xs" value={editing.nameAr}
                onChange={e => setEditing({ ...editing, nameAr: e.target.value })} placeholder="مثال: معدل النجاح" dir="rtl" />
            </div>
            <div>
              <label className="filter-label">Data Source (field)</label>
              <input className="filter-input text-xs" value={editing.source}
                onChange={e => setEditing({ ...editing, source: e.target.value })} placeholder="e.g. totalDispensed" />
            </div>
            <div>
              <label className="filter-label">Calculation Method</label>
              <select className="filter-input text-xs" value={editing.method}
                onChange={e => setEditing({ ...editing, method: e.target.value as KPIConfig['method'] })}>
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="average">Average</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            {editing.method === 'percentage' && (
              <div className="col-span-2">
                <label className="filter-label">Formula (for % calculations)</label>
                <input className="filter-input text-xs font-mono" value={editing.formula}
                  onChange={e => setEditing({ ...editing, formula: e.target.value })}
                  placeholder="e.g. invoiced / uploaded * 100" />
                <p className="text-xs text-blue-600 mt-1">Example: success_rate = invoiced / uploaded</p>
              </div>
            )}
            <div>
              <label className="filter-label">Display Format</label>
              <select className="filter-input text-xs" value={editing.format}
                onChange={e => setEditing({ ...editing, format: e.target.value as KPIConfig['format'] })}>
                <option value="number">Number</option>
                <option value="currency">Currency (SAR)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="filter-label">Color</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: editing.color === c ? '#374151' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex items-center gap-1.5 btn-primary text-xs py-1.5">
              <Save size={12} /> Save
            </button>
            <button onClick={cancel} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: C) Table Controls
// ══════════════════════════════════════════════════════════════════════════════
function TableControls({ columns, onChange }: { columns: ColumnConfig[]; onChange: (c: ColumnConfig[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel,  setNewLabel]  = useState('');
  const [newLabelAr, setNewLabelAr] = useState('');

  const addColumn = () => {
    const c: ColumnConfig = {
      id: Date.now().toString(), field: `col_${Date.now()}`,
      label: 'New Column', labelAr: 'عمود جديد', visible: true, order: columns.length,
    };
    onChange([...columns, c]);
    setEditingId(c.id);
    setNewLabel(c.label);
    setNewLabelAr(c.labelAr);
  };

  const removeCol = (id: string) => onChange(columns.filter(c => c.id !== id));
  const toggleV   = (id: string) => onChange(columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...columns];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr.map((c, i) => ({ ...c, order: i })));
  };
  const moveDown = (idx: number) => {
    if (idx === columns.length - 1) return;
    const arr = [...columns];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr.map((c, i) => ({ ...c, order: i })));
  };

  const saveLabel = (id: string) => {
    onChange(columns.map(c => c.id === id ? { ...c, label: newLabel, labelAr: newLabelAr } : c));
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Add, remove, rename, and reorder table columns. Sorting, filtering, and export remain active.</p>
        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#0891b2' }}
        >
          <Plus size={12} /> Add Column
        </button>
      </div>

      <div className="space-y-1.5">
        {columns.length === 0 && (
          <div className="text-center py-5 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            No column overrides. All original columns from your Excel upload are shown by default.
          </div>
        )}
        {columns.map((col, idx) => (
          <div key={col.id}
            className={`rounded-xl border p-2.5 transition-colors ${col.visible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
            {editingId === col.id ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  className="filter-input text-xs w-32" value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (EN)"
                />
                <input
                  className="filter-input text-xs w-32" value={newLabelAr}
                  onChange={e => setNewLabelAr(e.target.value)}
                  placeholder="Label (AR)" dir="rtl"
                />
                <button onClick={() => saveLabel(col.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                  <Check size={13} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                  <RotateCcw size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GripVertical size={13} className="text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">{col.label}</span>
                  <span className="text-xs text-gray-400 ms-2">{col.labelAr}</span>
                  <span className="text-xs text-gray-300 ms-2 font-mono">({col.field})</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => moveUp(idx)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                    <MoveUp size={11} />
                  </button>
                  <button onClick={() => moveDown(idx)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                    <MoveDown size={11} />
                  </button>
                  <button
                    onClick={() => { setEditingId(col.id); setNewLabel(col.label); setNewLabelAr(col.labelAr); }}
                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50"
                  >
                    <Settings size={12} />
                  </button>
                  <button onClick={() => toggleV(col.id)} className={`p-1.5 rounded ${col.visible ? 'text-green-600' : 'text-gray-400'}`}>
                    {col.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => removeCol(col.id)} className="p-1.5 rounded text-red-400 hover:bg-red-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: D) Filter Builder
// ══════════════════════════════════════════════════════════════════════════════
function FilterBuilder({ filters, onChange }: { filters: FilterConfig[]; onChange: (f: FilterConfig[]) => void }) {
  const [editing, setEditing] = useState<FilterConfig | null>(null);

  const blank = (): FilterConfig => ({
    id: Date.now().toString(), label: '', labelAr: '',
    field: '', type: 'dropdown', visible: true,
  });

  const openNew  = () => setEditing(blank());
  const openEdit = (f: FilterConfig) => setEditing({ ...f });
  const cancel   = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    const exists = filters.find(f => f.id === editing.id);
    onChange(exists ? filters.map(f => f.id === editing.id ? editing : f) : [...filters, editing]);
    cancel();
  };

  const remove  = (id: string) => onChange(filters.filter(f => f.id !== id));
  const toggleV = (id: string) => onChange(filters.map(f => f.id === id ? { ...f, visible: !f.visible } : f));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Define filters: label, mapped data field, and filter type.</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#7c3aed' }}
        >
          <Plus size={12} /> Add Filter
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {filters.length === 0 && (
          <div className="text-center py-5 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            No custom filters defined. Default filters from the project remain active.
          </div>
        )}
        {filters.map(f => (
          <div key={f.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${f.visible ? 'bg-white border-gray-100' : 'bg-gray-50 opacity-60 border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{f.label || <em className="text-gray-400">Untitled</em>}</p>
              <p className="text-xs text-gray-400 truncate">
                Field: <code className="bg-gray-100 px-1 rounded text-xs">{f.field || '—'}</code>
                &nbsp;·&nbsp;<TypeBadge t={f.type} />
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleV(f.id)} className={`p-1.5 rounded-lg ${f.visible ? 'text-green-600' : 'text-gray-400'}`}>
                {f.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                <Settings size={13} />
              </button>
              <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">
            {filters.find(f => f.id === editing.id) ? 'Edit Filter' : 'New Filter'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="filter-label">Label (EN)</label>
              <input className="filter-input text-xs" value={editing.label}
                onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Region" />
            </div>
            <div>
              <label className="filter-label">Label (AR)</label>
              <input className="filter-input text-xs" value={editing.labelAr}
                onChange={e => setEditing({ ...editing, labelAr: e.target.value })} placeholder="المنطقة" dir="rtl" />
            </div>
            <div>
              <label className="filter-label">Data Field (column name)</label>
              <input className="filter-input text-xs font-mono" value={editing.field}
                onChange={e => setEditing({ ...editing, field: e.target.value })} placeholder="e.g. region" />
            </div>
            <div>
              <label className="filter-label">Filter Type</label>
              <select className="filter-input text-xs" value={editing.type}
                onChange={e => setEditing({ ...editing, type: e.target.value as FilterConfig['type'] })}>
                <option value="dropdown">Dropdown (single select)</option>
                <option value="multiselect">Multi-Select</option>
                <option value="daterange">Date Range</option>
                <option value="search">Search (text)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex items-center gap-1.5 btn-primary text-xs py-1.5">
              <Save size={12} /> Save
            </button>
            <button onClick={cancel} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: E) Visual Controls
// ══════════════════════════════════════════════════════════════════════════════
function VisualControls({ visual, onChange }: { visual: VisualConfig; onChange: (v: VisualConfig) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        Customize appearance within the approved AL-Dawaa design system. Branding colors must remain consistent.
      </p>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="filter-label mb-2 block">Primary Color</label>
          <div className="flex flex-wrap gap-1.5">
            {['#002544', '#001d38', '#004020', '#003366', '#00A651'].map(c => (
              <button
                key={c}
                onClick={() => onChange({ ...visual, primaryColor: c })}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: visual.primaryColor === c ? '#FFC200' : 'transparent' }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Shades of AL-Dawaa green</p>
        </div>
        <div>
          <label className="filter-label mb-2 block">Accent Color</label>
          <div className="flex flex-wrap gap-1.5">
            {['#FFC200', '#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'].map(c => (
              <button
                key={c}
                onClick={() => onChange({ ...visual, accentColor: c })}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: visual.accentColor === c ? '#002544' : 'transparent' }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Gold yellow is the primary accent</p>
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="filter-label mb-2 block">Font Size</label>
        <div className="flex gap-2">
          {(['sm', 'base', 'lg'] as const).map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...visual, fontSize: s })}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                visual.fontSize === s
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={visual.fontSize === s ? { background: '#002544' } : {}}
            >
              {s === 'sm' ? 'Compact' : s === 'base' ? 'Normal' : 'Large'}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <label className="filter-label mb-2 block">Layout Spacing</label>
        <div className="flex gap-2">
          {(['compact', 'normal', 'relaxed'] as const).map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...visual, spacing: s })}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                visual.spacing === s
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={visual.spacing === s ? { background: '#002544' } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
        ⚠️ AL-Dawaa branding rules are enforced. Only pre-approved color shades and professional font sizes are available.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: F) Chart Builder (Advanced)
// ══════════════════════════════════════════════════════════════════════════════
const CHART_TYPES = [
  'bar', 'line', 'area', 'donut', 'pie', 'stacked', 'stacked-area',
  'combo', 'row', 'multibar', 'waterfall', 'progress', 'gauge',
  'histogram', 'scatter', 'funnel', 'sankey', 'number', 'trend',
];

const DIMENSIONS = [
  'region', 'city', 'district', 'senior', 'supervisor', 'pharmacy',
  'month', 'week', 'day', 'product', 'category',
];

const MEASURES = [
  'count', 'value', 'net_value', 'basket_value', 'success_rate',
  'fulfillment_rate', 'dispensed_value', 'totalDispensed',
];

function ChartBuilderPanel({ charts, onChange }: { charts: ChartConfig[]; onChange: (c: ChartConfig[]) => void }) {
  const [editing, setEditing] = useState<ChartConfig | null>(null);

  const blank = (): ChartConfig => ({
    id: Date.now().toString(), title: '', titleAr: '',
    source: 'default', measure: 'count', dimension: 'region',
    aggregation: 'sum', chartType: 'bar', color: '#002544', visible: true,
  });

  const openNew  = () => setEditing(blank());
  const openEdit = (c: ChartConfig) => setEditing({ ...c });
  const cancel   = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    const exists = charts.find(c => c.id === editing.id);
    onChange(exists ? charts.map(c => c.id === editing.id ? editing : c) : [...charts, editing]);
    cancel();
  };

  const remove  = (id: string) => onChange(charts.filter(c => c.id !== id));
  const toggleV = (id: string) => onChange(charts.map(c => c.id === id ? { ...c, visible: !c.visible } : c));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Build charts dynamically: select data source, measure, dimension, and aggregation.</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#10b981' }}
        >
          <Plus size={12} /> Add Chart
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {charts.length === 0 && (
          <div className="text-center py-5 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            No custom charts defined yet. Click "Add Chart" to create one.
          </div>
        )}
        {charts.map(c => (
          <div key={c.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${c.visible ? 'bg-white border-gray-100' : 'bg-gray-50 opacity-60 border-gray-100'}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ background: c.color }}>
              <BarChart2 size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{c.title || <em className="text-gray-400">Untitled</em>}</p>
              <p className="text-xs text-gray-400">
                {c.measure} by {c.dimension} · {c.aggregation} · {c.chartType}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleV(c.id)} className={`p-1.5 rounded-lg ${c.visible ? 'text-green-600' : 'text-gray-400'}`}>
                {c.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                <Settings size={13} />
              </button>
              <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="border border-green-200 rounded-xl p-4 bg-green-50 space-y-3">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
            {charts.find(c => c.id === editing.id) ? 'Edit Chart' : 'New Chart'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="filter-label">Title (EN)</label>
              <input className="filter-input text-xs" value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Orders by Region" />
            </div>
            <div>
              <label className="filter-label">Title (AR)</label>
              <input className="filter-input text-xs" value={editing.titleAr}
                onChange={e => setEditing({ ...editing, titleAr: e.target.value })} placeholder="الطلبات حسب المنطقة" dir="rtl" />
            </div>
            <div>
              <label className="filter-label">Measure</label>
              <select className="filter-input text-xs" value={editing.measure}
                onChange={e => setEditing({ ...editing, measure: e.target.value })}>
                {MEASURES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="filter-label">Dimension (group by)</label>
              <select className="filter-input text-xs" value={editing.dimension}
                onChange={e => setEditing({ ...editing, dimension: e.target.value })}>
                {DIMENSIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="filter-label">Aggregation</label>
              <select className="filter-input text-xs" value={editing.aggregation}
                onChange={e => setEditing({ ...editing, aggregation: e.target.value as ChartConfig['aggregation'] })}>
                <option value="sum">Sum</option>
                <option value="count">Count</option>
                <option value="average">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </div>
            <div>
              <label className="filter-label">Chart Type</label>
              <select className="filter-input text-xs" value={editing.chartType}
                onChange={e => setEditing({ ...editing, chartType: e.target.value })}>
                {CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="filter-label">Chart Color</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: editing.color === c ? '#374151' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex items-center gap-1.5 btn-primary text-xs py-1.5">
              <Save size={12} /> Save
            </button>
            <button onClick={cancel} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PANEL: G) Theme Switcher (inside Dashboard Controls)
// ══════════════════════════════════════════════════════════════════════════════
const THEME_DEFS: { id: AppTheme; nameEn: string; nameAr: string; primary: string; accent: string; bg: string; icon: React.ReactNode; desc: string; descAr: string }[] = [
  { id: 'classic',      nameEn: 'AL-Dawaa',     nameAr: 'الدواء',   primary: '#002544', accent: '#FFC200', bg: '#F4F7F5', icon: <Sun size={16} />,      desc: 'Official AL-Dawaa green & gold',        descAr: 'ألوان صيدلية الدواء الرسمية'         },
  { id: 'modern',       nameEn: 'Modern',       nameAr: 'عصري',     primary: '#0f2b5b', accent: '#00bcd4', bg: '#f0f4f8', icon: <Zap size={16} />,      desc: 'Clean minimal with teal accent',        descAr: 'تصميم نظيف مع لون تيل'             },
  { id: 'smart',        nameEn: 'Smart',        nameAr: 'ذكي',      primary: '#6c63ff', accent: '#00e5c3', bg: '#0d1117', icon: <Moon size={16} />,     desc: 'Dark glass-morphism — AI feel',         descAr: 'وضع مظلم بتأثير الذكاء الاصطناعي' },
  { id: 'professional', nameEn: 'Professional', nameAr: 'احترافي',  primary: '#1e293b', accent: '#22c55e', bg: '#f1f5f9', icon: <Briefcase size={16} />,desc: 'Slate corporate with green highlights',  descAr: 'تصميم مؤسسي بألوان خضراء'         },
];

function ThemePanel({ lang }: { lang: string }) {
  const { theme, setTheme } = useAuthStore();

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        {lang === 'ar'
          ? 'اختر تصميم المنصة. يتطبق فورًا على جميع الصفحات.'
          : 'Select the platform theme. Changes apply instantly across all pages.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEME_DEFS.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="relative text-start rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg"
            style={theme === t.id
              ? { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accent}30` }
              : { borderColor: '#e5e7eb' }
            }
          >
            {/* Theme color preview bar */}
            <div
              className="h-16 flex items-center justify-center gap-3 relative"
              style={{ background: t.bg }}
            >
              {/* Mini card previews */}
              <div className="flex gap-2">
                <div className="w-12 h-10 rounded-lg shadow flex items-center justify-center" style={{ background: t.primary }}>
                  <div className="w-6 h-1.5 rounded-full" style={{ background: t.accent }} />
                </div>
                <div className="w-10 h-10 rounded-lg shadow flex items-center justify-center" style={{ background: '#fff', border: `1px solid ${t.primary}20` }}>
                  <div className="space-y-1">
                    <div className="w-5 h-1 rounded-full" style={{ background: t.primary }} />
                    <div className="w-3 h-1 rounded-full" style={{ background: t.accent }} />
                  </div>
                </div>
                <div className="w-8 h-10 rounded-lg shadow" style={{ background: t.accent, opacity: 0.85 }} />
              </div>
              {/* Active badge */}
              {theme === t.id && (
                <div
                  className="absolute top-2 end-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                  style={{ background: t.accent }}
                >
                  <Check size={12} style={{ color: t.primary }} />
                </div>
              )}
            </div>

            {/* Theme info */}
            <div
              className="px-3 py-2.5 flex items-center gap-2.5"
              style={{ background: '#fff' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: t.primary, color: t.accent }}
              >
                {t.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800">
                  {lang === 'ar' ? t.nameAr : t.nameEn}
                  {theme === t.id && (
                    <span
                      className="ms-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: t.accent + '30', color: t.primary, fontSize: 10 }}
                    >
                      {lang === 'ar' ? 'نشط' : 'Active'}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {lang === 'ar' ? t.descAr : t.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-3 text-xs flex items-start gap-2.5"
        style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
        <span>✅</span>
        <span>
          {lang === 'ar'
            ? 'يتم حفظ التصميم تلقائيًا ويظهر في كل مرة تسجيل دخول.'
            : 'Theme is saved automatically and persists across sessions.'}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DashboardControls COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
interface DashboardControlsProps {
  projectId: string;
}

type Panel = 'components' | 'kpi' | 'table' | 'filters' | 'visual' | 'charts' | 'theme';

export default function DashboardControls({ projectId }: DashboardControlsProps) {
  const { user, lang } = useAuthStore();

  // Only admins see this
  if (user?.role !== 'admin') return null;

  const storageKey = `dc_${projectId}`;

  const [open,        setOpen]      = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>('components');
  const [config, setConfig] = useState<ProjectDashboardConfig>(
    () => loadLS<ProjectDashboardConfig>(storageKey, defaultConfig())
  );
  const [saved, setSaved] = useState(false);

  const updateConfig = useCallback((patch: Partial<ProjectDashboardConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveLS(storageKey, next);
      broadcastConfigChange(projectId);
      return next;
    });
  }, [storageKey, projectId]);

  const handleSave = () => {
    saveLS(storageKey, config);
    broadcastConfigChange(projectId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const fresh = defaultConfig();
    setConfig(fresh);
    saveLS(storageKey, fresh);
  };

  const PANELS: [Panel, React.ReactNode, string, string][] = [
    ['components', <Settings size={14} />,    'Components',  'المكونات'       ],
    ['kpi',        <Target size={14} />,       'KPI Builder', 'بناء KPI'       ],
    ['table',      <Table2 size={14} />,       'Table',       'الجدول'         ],
    ['filters',    <Filter size={14} />,       'Filters',     'الفلاتر'        ],
    ['charts',     <BarChart2 size={14} />,    'Charts',      'المخططات'       ],
    ['visual',     <Palette size={14} />,      'Visual',      'المظهر'         ],
    ['theme',      <Sun size={14} />,          'Themes',      'التصاميم'       ],
  ];

  return (
    <div className="mt-8 border-t-2 pt-6 no-print" style={{ borderColor: '#002544' + '20' }}>

      {/* ── Toggle header ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white transition-all hover:opacity-95"
        style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-80) 100%)' }}
      >
        <Settings size={16} className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
        <div className="flex-1 text-start">
          <p className="text-sm font-bold leading-tight">
            {lang === 'ar' ? '⚙️ لوحة تحكم المشروع' : '⚙️ Dashboard Controls'}
          </p>
          <p className="text-xs opacity-60 mt-0.5">
            {lang === 'ar'
              ? 'إضافة/حذف مخططات · تعديل جداول · تصاميم · فلاتر — للمشرف فقط'
              : 'Add/delete charts · Edit tables · Themes · Filters — Admin only'}
          </p>
        </div>
        {/* Live indicator */}
        <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: 'rgba(0,229,195,0.18)', color: '#00e5c3' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {lang === 'ar' ? 'مباشر' : 'Live'}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'var(--c-accent)', color: 'var(--c-primary)' }}
        >
          {lang === 'ar' ? 'مشرف' : 'Admin'}
        </span>
        {open ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
      </button>

      {/* ── Panel body ────────────────────────────────────────────────── */}
      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-in">

          {/* Panel tab strip */}
          <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
            {PANELS.map(([id, icon, labelEn, labelAr]) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activePanel === id
                    ? 'border-b-2 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                }`}
                style={activePanel === id
                  ? { background: 'var(--c-primary)', borderBottomColor: 'var(--c-accent)', color: '#fff' }
                  : {}}
              >
                {icon}
                {lang === 'ar' ? labelAr : labelEn}
                {/* Special badge for theme tab */}
                {id === 'theme' && (
                  <span className="ms-1 w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Active panel content */}
          <div className="p-5">
            {activePanel === 'components' && (
              <ComponentManager
                sections={config.sections}
                onChange={sections => updateConfig({ sections })}
              />
            )}
            {activePanel === 'kpi' && (
              <KPIBuilder
                kpis={config.kpis}
                onChange={kpis => updateConfig({ kpis })}
              />
            )}
            {activePanel === 'table' && (
              <TableControls
                columns={config.columns}
                onChange={columns => updateConfig({ columns })}
              />
            )}
            {activePanel === 'filters' && (
              <FilterBuilder
                filters={config.filters}
                onChange={filters => updateConfig({ filters })}
              />
            )}
            {activePanel === 'visual' && (
              <VisualControls
                visual={config.visual}
                onChange={visual => updateConfig({ visual })}
              />
            )}
            {activePanel === 'charts' && (
              <ChartBuilderPanel
                charts={config.charts}
                onChange={charts => updateConfig({ charts })}
              />
            )}
            {activePanel === 'theme' && (
              <ThemePanel lang={lang} />
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t flex items-center justify-between gap-3"
            style={{ background: 'var(--c-bg)', borderColor: 'var(--c-border-light)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {lang === 'ar' ? 'التغييرات تُطبَّق فورًا' : 'Changes apply instantly'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
                style={{ color: 'var(--c-text-3)', borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-3)'; }}
              >
                <RotateCcw size={12} />
                {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all ${saved ? 'bg-green-500' : ''}`}
                style={saved ? {} : { background: 'var(--c-primary)' }}
              >
                {saved ? <Check size={12} /> : <Save size={12} />}
                {saved
                  ? (lang === 'ar' ? '✓ تم الحفظ' : '✓ Saved')
                  : (lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
