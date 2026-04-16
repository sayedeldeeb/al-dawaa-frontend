/**
 * UploadModal.tsx
 * ════════════════
 * Reusable upload modal that can be embedded in any project page.
 * Key improvements:
 *   - xlsx is LAZY LOADED (dynamic import) — only fetched when a file is dropped
 *   - Column auto-mapping against project template
 *   - Manual column mapping UI if auto-map misses fields
 *   - Template view showing expected structure
 *   - Per-project template awareness
 */
import React, { useState, useCallback, useRef } from 'react';
import { uploadApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  X, Upload, FileText, CheckCircle, AlertCircle,
  ChevronRight, RotateCcw, Settings, Eye, EyeOff, Info,
} from 'lucide-react';
import {
  getTemplate, autoMapColumns, ProjectTemplate, TemplateField,
} from '../../config/projectTemplates';

/* ── Types ─────────────────────────────────────────────────────────────── */
type Step = 'drop' | 'mapping' | 'preview' | 'uploading' | 'done' | 'error';

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

/* ── Colour helpers ─────────────────────────────────────────────────────── */
const TYPE_COLOR: Record<string, string> = {
  text:   '#3b82f6',
  number: '#10b981',
  date:   '#f59e0b',
  phone:  '#8b5cf6',
};

/* ══════════════════════════════════════════════════════════════════════════
   UPLOAD MODAL
══════════════════════════════════════════════════════════════════════════ */
export default function UploadModal({ projectId, onClose, onSuccess }: Props) {
  const { lang, user } = useAuthStore();
  const isAr = lang === 'ar';

  const [step, setStep]           = useState<Step>('drop');
  const [template]                = useState<ProjectTemplate>(() => getTemplate(projectId));
  const [file, setFile]           = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [allRows, setAllRows]     = useState<any[][]>([]);   // raw rows from xlsx
  const [mapping, setMapping]     = useState<Record<string, string>>({});  // fieldKey → fileColumn
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [mode, setMode]           = useState<'append' | 'replace'>('append');
  const [error, setError]         = useState('');
  const [result, setResult]       = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Parse file (lazy-load xlsx) ────────────────────────────────────── */
  const parseFile = useCallback(async (f: File) => {
    setLoadingFile(true);
    try {
      // Dynamic import — xlsx NOT in the initial bundle
      const XLSX = await import('xlsx');
      const buf  = await f.arrayBuffer();
      const wb   = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (!rows.length) { setError(isAr ? 'الملف فارغ' : 'File is empty'); setStep('error'); return; }

      const headers = (rows[0] as string[]).map(h => String(h ?? '').trim()).filter(Boolean);
      const dataRows = rows.slice(1).filter(r => (r as any[]).some(c => c !== '' && c != null));

      setFile(f);
      setFileColumns(headers);
      setAllRows(dataRows);

      // Auto-map columns
      const autoMap = autoMapColumns(headers, template);
      setMapping(autoMap);
      setStep('mapping');
    } catch {
      setError(isAr ? 'فشل قراءة الملف. تأكد من صحة الصيغة.' : 'Failed to read file. Ensure it is a valid Excel/CSV file.');
      setStep('error');
    } finally {
      setLoadingFile(false);
    }
  }, [template, isAr]);

  /* ── Drop handlers ──────────────────────────────────────────────────── */
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }, [parseFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  /* ── Build preview from mapping ─────────────────────────────────────── */
  const buildPreview = () => {
    const rows = allRows.slice(0, 5).map(row => {
      const obj: Record<string, any> = {};
      for (const field of template.fields) {
        const colName = mapping[field.key];
        const colIdx  = fileColumns.indexOf(colName);
        obj[field.key] = colIdx >= 0 ? row[colIdx] : '';
      }
      return obj;
    });
    setPreviewRows(rows);
    setStep('preview');
  };

  /* ── Upload ─────────────────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!file) return;
    setStep('uploading');
    try {
      const r = await uploadApi.upload(projectId, file, mode);
      if (r.success) {
        setResult(r.data);
        setStep('done');
        onSuccess?.(r.data);
      } else {
        setError(r.message || (isAr ? 'فشل الرفع' : 'Upload failed'));
        setStep('error');
      }
    } catch (err: any) {
      let msg = isAr ? 'فشل الاتصال بالخادم' : 'Could not connect to server';
      if (err.response?.status === 403) msg = isAr ? 'ليس لديك صلاحية' : 'No permission';
      if (err.response?.data?.message) msg = err.response.data.message;
      setError(msg);
      setStep('error');
    }
  };

  /* ── Unmapped required fields check ────────────────────────────────── */
  const unmappedRequired = template.fields.filter(f => f.required && !mapping[f.key]);

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 680,
          maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>
              {isAr ? `رفع بيانات — ${template.nameAr}` : `Upload Data — ${template.nameEn}`}
            </h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
              {isAr ? 'Excel / CSV' : 'Excel / CSV files accepted'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Template toggle */}
            <button
              onClick={() => setShowTemplate(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: showTemplate ? '#f0f4ff' : '#fff', color: showTemplate ? '#3b82f6' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {showTemplate ? <EyeOff size={13} /> : <Eye size={13} />}
              {isAr ? 'القالب' : 'Template'}
            </button>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Template panel ─────────────────────────────────────────── */}
        {showTemplate && (
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {isAr ? 'الأعمدة المتوقعة' : 'Expected Columns'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {template.fields.map(f => (
                <span key={f.key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: TYPE_COLOR[f.type] + '14',
                  color: TYPE_COLOR[f.type],
                  border: `1px solid ${TYPE_COLOR[f.type]}30`,
                }}>
                  {f.required && <span style={{ color: '#ef4444', fontSize: 10 }}>*</span>}
                  {isAr ? f.labelAr : f.labelEn}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>({f.type})</span>
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              <span style={{ color: '#ef4444' }}>*</span> {isAr ? 'مطلوب' : 'Required'}
            </p>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── STEP: DROP ─────────────────────────────────────────── */}
          {step === 'drop' && (
            <div>
              {/* Mode selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['append', 'replace'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${mode === m ? (m === 'replace' ? '#dc2626' : '#3b82f6') : '#e5e7eb'}`,
                      background: mode === m ? (m === 'replace' ? '#fef2f2' : '#f0f4ff') : '#fff',
                      color: mode === m ? (m === 'replace' ? '#dc2626' : '#3b82f6') : '#9ca3af',
                      cursor: 'pointer',
                    }}
                  >
                    {m === 'append'
                      ? (isAr ? '➕ إضافة للبيانات' : '➕ Append to existing')
                      : (isAr ? '🔄 استبدال البيانات' : '🔄 Replace all data')}
                  </button>
                ))}
              </div>
              {mode === 'replace' && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626', marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <AlertCircle size={13} />
                  {isAr ? 'تحذير: سيتم حذف جميع البيانات الحالية وإحلالها بالملف الجديد' : 'Warning: All current data will be deleted and replaced by this file'}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragOver ? '#f0f4ff' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={onFileInput} />
                {loadingFile ? (
                  <div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: '#6b7280' }}>{isAr ? 'جاري قراءة الملف...' : 'Reading file...'}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Upload size={24} color="#fff" />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                      {isAr ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag & drop your file or click to browse'}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>
                      {isAr ? 'يدعم: Excel (.xlsx, .xls) و CSV' : 'Supports: Excel (.xlsx, .xls) and CSV'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: MAPPING ──────────────────────────────────────── */}
          {step === 'mapping' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <FileText size={16} color="#3b82f6" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{file?.name}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  · {fileColumns.length} {isAr ? 'عمود' : 'columns'} · {allRows.length.toLocaleString()} {isAr ? 'صف' : 'rows'}
                </span>
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                {isAr ? 'ربط الأعمدة — تأكد من الربط الصحيح:' : 'Column Mapping — verify each field matches:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {template.fields.map(field => (
                  <div key={field.key} style={{
                    display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: 8, alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8,
                    background: mapping[field.key] ? '#f0fdf4' : (field.required ? '#fef2f2' : '#f9fafb'),
                    border: `1px solid ${mapping[field.key] ? '#bbf7d0' : (field.required ? '#fecaca' : '#f3f4f6')}`,
                  }}>
                    {/* Template field */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[field.type], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        {isAr ? field.labelAr : field.labelEn}
                        {field.required && <span style={{ color: '#ef4444', marginInlineStart: 2 }}>*</span>}
                      </span>
                    </div>

                    <ChevronRight size={14} color="#9ca3af" style={{ justifySelf: 'center' }} />

                    {/* File column selector */}
                    <select
                      value={mapping[field.key] || ''}
                      onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        padding: '5px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${mapping[field.key] ? '#86efac' : '#d1d5db'}`,
                        background: '#fff', color: mapping[field.key] ? '#15803d' : '#6b7280',
                        width: '100%',
                      }}
                    >
                      <option value="">{isAr ? '— اختر عمود —' : '— Select column —'}</option>
                      {fileColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {unmappedRequired.length > 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {isAr
                      ? `الأعمدة المطلوبة غير مربوطة: ${unmappedRequired.map(f => f.labelAr).join('، ')}`
                      : `Required fields not mapped: ${unmappedRequired.map(f => f.labelEn).join(', ')}`}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => { setStep('drop'); setFile(null); setFileColumns([]); }}
                  style={{ flex: 1, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={buildPreview}
                  disabled={unmappedRequired.length > 0}
                  style={{
                    flex: 2, padding: '9px 16px', borderRadius: 10, border: 'none',
                    background: unmappedRequired.length > 0 ? '#e5e7eb' : '#3b82f6',
                    color: unmappedRequired.length > 0 ? '#9ca3af' : '#fff',
                    fontSize: 13, fontWeight: 700, cursor: unmappedRequired.length > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Eye size={14} />
                  {isAr ? 'معاينة البيانات' : 'Preview Data'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: PREVIEW ──────────────────────────────────────── */}
          {step === 'preview' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {isAr ? `معاينة — أول 5 صفوف من ${allRows.length.toLocaleString()}` : `Preview — first 5 of ${allRows.length.toLocaleString()} rows`}
                </p>
                <button
                  onClick={() => setStep('mapping')}
                  style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RotateCcw size={12} /> {isAr ? 'تعديل الربط' : 'Edit mapping'}
                </button>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {template.fields.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                          {isAr ? f.labelAr : f.labelEn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {template.fields.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} style={{ padding: '7px 10px', color: '#374151' }}>
                            {String(row[f.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary stats */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#f0f4ff', border: '1px solid #dbeafe', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', fontFamily: 'Inter' }}>{allRows.length.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{isAr ? 'إجمالي الصفوف' : 'Total Rows'}</p>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', fontFamily: 'Inter' }}>
                    {template.fields.filter(f => mapping[f.key]).length}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{isAr ? 'أعمدة مربوطة' : 'Mapped Columns'}</p>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: mode === 'replace' ? '#fef2f2' : '#f8fafc', border: `1px solid ${mode === 'replace' ? '#fecaca' : '#e5e7eb'}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: mode === 'replace' ? '#dc2626' : '#374151' }}>
                    {mode === 'replace' ? (isAr ? 'استبدال' : 'Replace') : (isAr ? 'إضافة' : 'Append')}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{isAr ? 'وضع الرفع' : 'Upload mode'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setStep('mapping')}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
                >
                  {isAr ? 'رجوع' : 'Back'}
                </button>
                <button
                  onClick={handleUpload}
                  style={{ flex: 2, padding: '10px 16px', borderRadius: 10, border: 'none', background: mode === 'replace' ? '#dc2626' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Upload size={14} />
                  {mode === 'replace'
                    ? (isAr ? '⚠️ استبدال وحفظ' : '⚠️ Replace & Save')
                    : (isAr ? 'رفع البيانات' : 'Upload Data')}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: UPLOADING ────────────────────────────────────── */}
          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>
                {isAr ? 'جاري الرفع...' : 'Uploading...'}
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                {isAr ? 'الرجاء الانتظار' : 'Please wait'}
              </p>
            </div>
          )}

          {/* ── STEP: DONE ─────────────────────────────────────────── */}
          {step === 'done' && result && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckCircle size={28} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>
                {isAr ? 'تم الرفع بنجاح!' : 'Upload Successful!'}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                {mode === 'replace'
                  ? (isAr ? 'تم استبدال البيانات بالكامل' : 'All data has been replaced')
                  : (isAr ? 'تمت إضافة البيانات الجديدة' : 'New data has been appended')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { v: result.totalRows, label: isAr ? 'إجمالي' : 'Total', color: '#3b82f6', bg: '#f0f4ff' },
                  { v: result.validRows, label: isAr ? 'صالح' : 'Valid', color: '#16a34a', bg: '#f0fdf4' },
                  { v: result.errorRows, label: isAr ? 'أخطاء' : 'Errors', color: '#dc2626', bg: '#fef2f2' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 8px', borderRadius: 10, background: item.bg, textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: item.color, fontFamily: 'Inter' }}>{(item.v || 0).toLocaleString()}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setStep('drop'); setFile(null); setFileColumns([]); setResult(null); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                >
                  {isAr ? 'رفع ملف آخر' : 'Upload Another'}
                </button>
                <button
                  onClick={onClose}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#3b82f6', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: ERROR ────────────────────────────────────────── */}
          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <AlertCircle size={28} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>
                {isAr ? 'حدث خطأ' : 'Upload Failed'}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{error}</p>
              <button
                onClick={() => setStep('drop')}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {isAr ? 'حاول مرة أخرى' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
