import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { uploadApi, projectsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { UploadBatch, Project } from '../types';
import { Upload, CheckCircle, AlertCircle, RotateCcw, File, X, Trash2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';

export default function UploadPage() {
  const { lang, t, user } = useAuthStore();
  const [step, setStep] = useState<'select' | 'preview' | 'uploading' | 'done' | 'error'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('medical-devices');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [projects, setProjects] = useState<Project[]>([]);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.list().then(r => setProjects(r.data || []));
    loadBatches();
  }, []);

  useEffect(() => { loadBatches(); }, [projectId]);

  const loadBatches = async () => {
    try {
      const r = await uploadApi.batches(projectId);
      setBatches(r.data || []);
    } catch {}
  };

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length > 0) {
        setHeaders(rows[0] as string[]);
        const dataRows = rows.slice(1, 6).map(r =>
          Object.fromEntries((rows[0] as string[]).map((h, i) => [h, (r as any[])[i]]))
        );
        setPreviewRows(dataRows);
        setStep('preview');
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setStep('uploading');
    try {
      const r = await uploadApi.upload(projectId, file, mode);
      if (r.success) {
        setResult(r.data);
        setStep('done');
        await loadBatches();
      } else {
        setError(r.message || t.uploadError);
        setStep('error');
      }
    } catch (err: any) {
      let msg = t.uploadError;
      if (!err.response) {
        msg = lang === 'ar'
          ? 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الـ Backend على المنفذ 3001.'
          : 'Cannot connect to server. Make sure the backend is running on port 3001.';
      } else if (err.response.status === 401) {
        msg = lang === 'ar' ? 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.' : 'Session expired. Please log in again.';
      } else if (err.response.status === 403) {
        msg = lang === 'ar' ? 'ليس لديك صلاحية رفع الملفات.' : 'You do not have permission to upload files.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg); setStep('error');
    } finally {
      setUploading(false);
    }
  };

  const handleRollback = async (batchId: string) => {
    if (!confirm(lang === 'ar'
      ? 'هل أنت متأكد من التراجع عن هذا الرفع؟ سيتم حذف البيانات المرفوعة.'
      : 'Are you sure you want to rollback this upload? Uploaded data will be removed.')) return;
    await uploadApi.rollback(batchId);
    await loadBatches();
  };

  const handleDeleteBatch = async (batchId: string, fileName: string) => {
    if (!confirm(lang === 'ar'
      ? `هل تريد حذف "${fileName}" وجميع بياناتها نهائياً؟ لا يمكن التراجع.`
      : `Delete "${fileName}" and all its data permanently? This cannot be undone.`)) return;
    setDeletingId(batchId);
    try {
      await uploadApi.deleteBatch(batchId);
      await loadBatches();
    } catch (e) {
      alert(lang === 'ar' ? 'فشل الحذف. تأكد من الاتصال بالخادم.' : 'Delete failed. Check server connection.');
    } finally {
      setDeletingId(null);
    }
  };

  const reset = () => {
    setFile(null); setPreviewRows([]); setHeaders([]);
    setStep('select'); setResult(null); setError('');
  };

  const projects_labels: Record<string, { en: string; ar: string }> = {
    'medical-devices':  { en: 'Medical Devices',    ar: 'الأجهزة الطبية' },
    'yusur':            { en: 'YUSUR',               ar: 'يسر' },
    'churned-customer': { en: 'Churned Customer',    ar: 'العملاء المتوقفون' },
    'vip-files':        { en: 'AL-Dawaa Refill',     ar: 'إعادة تعبئة الدواء' },
    'p2p':              { en: 'P2P',                 ar: 'P2P' },
    'pill-pack':        { en: 'Pill Pack',            ar: 'الحزمة الدوائية' },
    'high-value':       { en: 'High Value',          ar: 'القيمة العالية' },
    'hybrid-pharmacy':  { en: 'Hybrid Pharmacy',     ar: 'هايبرد' },
  };

  return (
    <div className="p-6 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#002544' }}>
          {lang === 'ar' ? 'رفع البيانات' : 'Upload Data'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === 'ar' ? 'رفع ملفات Excel لأي مشروع' : 'Upload Excel files to any project'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Upload form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Settings card */}
          <div className="chart-card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#002544' }}>
              <Upload size={16} />
              {lang === 'ar' ? 'إعدادات الرفع' : 'Upload Settings'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="filter-label">{lang === 'ar' ? 'المشروع' : 'Project'}</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="filter-input mt-1"
                >
                  {Object.entries(projects_labels).map(([id, names]) => (
                    <option key={id} value={id}>{lang === 'ar' ? names.ar : names.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="filter-label">{t.uploadMode}</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setMode('append')}
                    className="flex-1 py-2 px-3 text-sm rounded-lg border font-semibold transition-colors"
                    style={mode === 'append'
                      ? { background: '#002544', color: '#FFC200', borderColor: '#002544' }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }}
                  >
                    ➕ {lang === 'ar' ? 'إضافة' : 'Append'}
                  </button>
                  <button
                    onClick={() => setMode('replace')}
                    className="flex-1 py-2 px-3 text-sm rounded-lg border font-semibold transition-colors"
                    style={mode === 'replace'
                      ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }}
                  >
                    🔄 {lang === 'ar' ? 'استبدال' : 'Replace'}
                  </button>
                </div>
                {mode === 'replace' && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                    <AlertTriangle size={12} />
                    {lang === 'ar' ? 'سيتم حذف جميع البيانات الموجودة قبل الرفع' : 'All existing data will be deleted before upload'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Select file */}
          {step === 'select' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#002544' }}>
                <Upload className="text-white" size={28} />
              </div>
              <p className="font-semibold text-gray-700 text-lg">{t.dragDrop}</p>
              <p className="text-gray-400 text-sm mt-2">{t.supportedFormats}</p>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && file && (
            <div className="chart-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,37,68,0.08)' }}>
                    <File className="text-navy" size={18} style={{ color: '#002544' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1e2535' }}>{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB · {headers.length} {lang === 'ar' ? 'عمود' : 'columns'}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {lang === 'ar' ? 'معاينة أول 5 صفوف' : 'Preview (first 5 rows)'}
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="data-table text-xs">
                  <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>{headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                <p className="text-xs text-gray-400">
                  {lang === 'ar'
                    ? `${previewRows.length} صفوف معاينة · ${headers.length} عمود · ${(file.size / 1024).toFixed(0)} KB`
                    : `${previewRows.length} preview rows · ${headers.length} columns · ${(file.size / 1024).toFixed(0)} KB`}
                </p>
                <div className="flex gap-3">
                  <button onClick={reset} className="btn-ghost">{t.cancel}</button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Upload size={14} /> {t.confirm}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div className="chart-card text-center py-12">
              <div className="w-14 h-14 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin"
                style={{ borderColor: 'rgba(0,37,68,0.2)', borderTopColor: '#002544' }} />
              <p className="font-semibold text-gray-700">{t.uploading}</p>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'replace'
                  ? (lang === 'ar' ? 'جارٍ مسح البيانات القديمة وإضافة الجديدة...' : 'Clearing old data and inserting new records...')
                  : (lang === 'ar' ? 'جارٍ إضافة البيانات...' : 'Inserting data...')}
              </p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && result && (
            <div className="chart-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">{t.uploadSuccess}</h3>
                  <p className="text-xs text-green-600 mt-0.5">
                    {mode === 'replace'
                      ? (lang === 'ar' ? 'تم استبدال البيانات بنجاح' : 'Data replaced successfully')
                      : (lang === 'ar' ? 'تم إضافة البيانات بنجاح' : 'Data appended successfully')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-black text-green-700">{result.totalRows?.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">{lang === 'ar' ? 'إجمالي الصفوف' : 'Total Rows'}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <p className="text-2xl font-black text-blue-700">{result.validRows?.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">{t.validRows}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                  <p className="text-2xl font-black text-red-700">{result.errorRows?.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">{t.errors}</p>
                </div>
              </div>
              <button onClick={reset} className="btn-primary w-full">
                {lang === 'ar' ? 'رفع ملف آخر' : 'Upload Another File'}
              </button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="chart-card border border-red-200 bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="text-red-600" size={20} />
                <p className="font-semibold text-red-800">{t.uploadError}</p>
              </div>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button onClick={reset} className="btn-primary">
                {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Upload History ── */}
        <div>
          <div className="chart-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: '#002544' }}>
                {lang === 'ar' ? 'سجل الرفع' : 'Upload History'}
              </h3>
              {batches.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,37,68,0.08)', color: '#002544' }}>
                  {batches.length}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {batches.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">{t.noData}</p>
              ) : batches.slice(0, 15).map(b => (
                <div
                  key={b.id}
                  className="rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: b.status === 'done' ? '#e5e7eb' : b.status === 'rolled_back' ? '#fde68a' : '#fecaca',
                    background: b.status === 'rolled_back' ? '#fffbeb' : '#fff',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: '#1e2535' }}>
                        {b.fileName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.uploadedBy} · {formatDistanceToNow(new Date(b.uploadedAt), {
                          addSuffix: true,
                          locale: lang === 'ar' ? arLocale : enUS,
                        })}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className="badge text-xs"
                          style={b.uploadMode === 'replace'
                            ? { background: '#fee2e2', color: '#991b1b' }
                            : { background: '#dbeafe', color: '#1e40af' }}
                        >
                          {b.uploadMode === 'replace' ? '🔄 Replace' : '➕ Append'}
                        </span>
                        <span
                          className="badge text-xs"
                          style={b.status === 'done'
                            ? { background: '#d1fae5', color: '#065f46' }
                            : b.status === 'rolled_back'
                              ? { background: '#fef3c7', color: '#92400e' }
                              : { background: '#fee2e2', color: '#991b1b' }}
                        >
                          {b.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {b.totalRows?.toLocaleString()} {t.rows}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {user?.role === 'admin' && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {b.status === 'done' && (
                          <button
                            onClick={() => handleRollback(b.id)}
                            className="p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs"
                            style={{ color: '#d97706', background: 'rgba(217,119,6,0.08)' }}
                            title={lang === 'ar' ? 'تراجع' : 'Rollback'}
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                        {/* DELETE batch button */}
                        <button
                          onClick={() => handleDeleteBatch(b.id, b.fileName)}
                          disabled={deletingId === b.id}
                          className="p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs"
                          style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}
                          title={lang === 'ar' ? 'حذف الرفع والبيانات نهائياً' : 'Delete upload and its data permanently'}
                        >
                          {deletingId === b.id
                            ? <div className="w-3 h-3 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
