import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, Trash2, CheckSquare, Square, Pencil, Check, X as XIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import * as XLSX from 'xlsx';

export interface Column<T> {
  key: string;
  header: string;
  headerAr?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onDelete?: (row: T) => void;
  onDeleteSelected?: (rows: T[]) => void;
  onEdit?: (row: T, updates: Partial<T>) => Promise<void>;
  loading?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  emptyMessage?: string;
}

function StatusBadge({ value }: { value: string }) {
  const v = String(value).toLowerCase();
  if (v.includes('delivered') || v.includes('dispensed') || v.includes('fulfilled')) return <span className="badge-green">{value}</span>;
  if (v.includes('failed') || v.includes('cancelled') || v.includes('not dispensed')) return <span className="badge-red">{value}</span>;
  if (v.includes('out for delivery') || v.includes('processing') || v.includes('allocated')) return <span className="badge-yellow">{value}</span>;
  if (v.includes('pending') || v.includes('unavailable')) return <span className="badge-gray">{value}</span>;
  return <span className="badge-blue">{value}</span>;
}

export { StatusBadge };

export default function DataTable<T extends Record<string, any>>({
  columns, data, total, page = 1, pageSize = 50, onPageChange,
  onDelete, onDeleteSelected, onEdit, loading, exportable = true, exportFilename = 'data', emptyMessage,
}: DataTableProps<T>) {
  const { t, lang, user } = useAuthStore();
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [saving, setSaving]       = useState(false);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av || '').localeCompare(String(bv || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // Clear selection when data changes
  React.useEffect(() => { setSelected(new Set()); }, [data]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const getRowId = (row: T, i: number) => String(row.id ?? row._id ?? i);

  const allSelected   = sorted.length > 0 && sorted.every((r, i) => selected.has(getRowId(r, i)));
  const someSelected  = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((r, i) => getRowId(r, i))));
    }
  };

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedRows = sorted.filter((r, i) => selected.has(getRowId(r, i)));

  const exportToExcel = (rows?: T[]) => {
    const exportData = rows ?? data;
    const ws = XLSX.utils.json_to_sheet(exportData.map(row => {
      const obj: any = {};
      columns.forEach(col => { obj[col.header] = row[col.key]; });
      return obj;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${exportFilename}${rows ? '_selected' : ''}.xlsx`);
  };

  const handleBulkDelete = () => {
    if (!onDeleteSelected && !onDelete) return;
    const msg = lang === 'ar'
      ? `هل تريد حذف ${selected.size} سجل؟ لا يمكن التراجع.`
      : `Delete ${selected.size} record(s)? This cannot be undone.`;
    if (!confirm(msg)) return;
    if (onDeleteSelected) {
      onDeleteSelected(selectedRows);
    } else if (onDelete) {
      selectedRows.forEach(r => onDelete(r));
    }
    setSelected(new Set());
  };

  const startEdit = (row: T, id: string) => {
    const draft: Record<string, any> = {};
    columns.forEach(col => { if (!col.render) draft[col.key] = row[col.key] ?? ''; });
    setEditDraft(draft);
    setEditingId(id);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async (row: T) => {
    if (!onEdit) return;
    setSaving(true);
    try {
      await onEdit(row, editDraft as Partial<T>);
      setEditingId(null);
      setEditDraft({});
    } catch { /* keep editing on error */ }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="chart-card">
      {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded mb-2 animate-pulse"></div>)}
    </div>
  );

  const totalPages = Math.ceil((total || data.length) / pageSize);
  const hasActions = !!(onDelete && user?.role === 'admin');
  const canEdit    = !!(onEdit && user?.role === 'admin');

  return (
    <div className="chart-card p-0">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <>
              <span className="text-sm font-semibold" style={{ color: '#002544' }}>
                {selected.size} {lang === 'ar' ? 'محدد' : 'selected'}
              </span>
              {/* Bulk delete */}
              {hasActions && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                >
                  <Trash2 size={12} />
                  {lang === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
                </button>
              )}
              {/* Export selected */}
              {exportable && (
                <button
                  onClick={() => exportToExcel(selectedRows)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: '#002544', color: '#FFC200', border: '1px solid rgba(255,194,0,0.2)' }}
                >
                  <Download size={12} />
                  {lang === 'ar' ? 'تصدير المحدد' : 'Export Selected'}
                </button>
              )}
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs px-2.5 py-1.5 rounded-lg border transition-all"
                style={{ color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                {lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All'}
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {t.showing} {Math.min((page - 1) * pageSize + 1, total || data.length)}–{Math.min(page * pageSize, total || data.length)} {t.of} {(total || data.length).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Select all button */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-50"
            style={{ color: '#374151', borderColor: '#e5e7eb' }}
          >
            {allSelected
              ? <CheckSquare size={13} style={{ color: '#002544' }} />
              : <Square size={13} style={{ color: '#9ca3af' }} />}
            {allSelected
              ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
              : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
          </button>

          {/* Export all */}
          {exportable && (
            <button
              onClick={() => exportToExcel()}
              className="flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#002544', borderColor: 'rgba(0,37,68,0.25)' }}
            >
              <Download size={13} /> {t.exportExcel}
            </button>
          )}
        </div>
      </div>

      {/* ── Horizontal-scrollable table ── */}
      <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              {/* Checkbox column */}
              {hasActions && (
                <th className="w-10 text-center" style={{ paddingLeft: 12, paddingRight: 8 }}>
                  <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {allSelected
                      ? <CheckSquare size={15} style={{ color: '#FFC200' }} />
                      : someSelected
                        ? <div style={{ width: 15, height: 15, background: 'rgba(255,194,0,0.5)', borderRadius: 3, border: '2px solid #FFC200' }} />
                        : <Square size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />}
                  </button>
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} className="whitespace-nowrap" style={{ width: col.width }}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}>
                  <div className="flex items-center gap-1 cursor-pointer select-none">
                    <span>{lang === 'ar' && col.headerAr ? col.headerAr : col.header}</span>
                    {sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                  </div>
                </th>
              ))}
              {(hasActions || canEdit) && <th className="w-20 text-center">{t.actions}</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 2 : 0) + (canEdit ? 1 : 0)}
                  className="text-center py-10 text-gray-400"
                >
                  {emptyMessage || t.noData}
                </td>
              </tr>
            ) : sorted.map((row, i) => {
              const rid = getRowId(row, i);
              const isSelected = selected.has(rid);
              const isEditing  = editingId === rid;
              return (
                <tr
                  key={rid}
                  className="hover:bg-blue-50 transition-colors"
                  style={{ background: isEditing ? 'rgba(255,194,0,0.06)' : isSelected ? 'rgba(0,37,68,0.04)' : undefined }}
                >
                  {/* Checkbox */}
                  {hasActions && (
                    <td className="text-center" style={{ paddingLeft: 12, paddingRight: 8 }}>
                      <button
                        onClick={() => toggleRow(rid)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isSelected
                          ? <CheckSquare size={15} style={{ color: '#002544' }} />
                          : <Square size={15} style={{ color: '#d1d5db' }} />}
                      </button>
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className="whitespace-nowrap max-w-xs">
                      {isEditing && !col.render ? (
                        <input
                          type="text"
                          value={editDraft[col.key] ?? ''}
                          onChange={e => setEditDraft(d => ({ ...d, [col.key]: e.target.value }))}
                          className="w-full px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1"
                          style={{ borderColor: '#FFC200', maxWidth: 140, background: '#fffbeb' }}
                        />
                      ) : (
                        <div className="truncate">
                          {col.render ? col.render(row) : col.key === 'status' ? <StatusBadge value={row[col.key]} /> : String(row[col.key] ?? '—')}
                        </div>
                      )}
                    </td>
                  ))}
                  {(hasActions || canEdit) && (
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(row)}
                              disabled={saving}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: '#16a34a', background: '#f0fdf4' }}
                              title={lang === 'ar' ? 'حفظ' : 'Save'}
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: '#dc2626', background: '#fef2f2' }}
                              title={lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            >
                              <XIcon size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <button
                                onClick={() => startEdit(row, rid)}
                                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={lang === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {hasActions && (
                              <button
                                onClick={() => { if (confirm(t.confirmDelete)) onDelete!(row); }}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title={lang === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Horizontal scroll hint bar ── */}
      <div style={{ overflowX: 'auto', padding: '0 16px', background: '#fafbfc', borderTop: '1px solid #f0f2f5' }}>
        <div style={{ display: 'flex', gap: 4, padding: '6px 0', fontSize: 10, color: '#b0bec5', alignItems: 'center' }}>
          <span>◀</span>
          <span style={{ flex: 1, height: 3, background: 'linear-gradient(to right, #002544, #FFC200)', borderRadius: 2, opacity: 0.3 }} />
          <span>▶</span>
          <span style={{ marginLeft: 6 }}>{lang === 'ar' ? 'مرر يميناً/يساراً' : 'Scroll left/right'}</span>
        </div>
      </div>

      {/* ── Pagination ── */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            {lang === 'ar' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {lang === 'ar' ? 'السابق' : 'Prev'}
          </button>
          <span className="text-sm text-gray-500">{t.page} {page} {t.of} {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            {lang === 'ar' ? 'التالي' : 'Next'}
            {lang === 'ar' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
