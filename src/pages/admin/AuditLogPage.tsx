import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { AuditLog } from '../../types';
import { Shield } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'badge-green', UPLOAD: 'badge-blue', DELETE_RECORD: 'badge-red',
  EXPORT: 'badge-yellow', ROLLBACK: 'badge-red', UPDATE: 'badge-yellow',
};

export default function AuditLogPage() {
  const { lang, t } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    adminApi.auditLogs(page).then(r => { setLogs(r.data || []); setTotal(r.total || 0); setLoading(false); });
  }, [page]);

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-primary" size={24} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#002544' }}>{lang === 'ar' ? 'سجل المراجعة' : 'Audit Log'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} {lang === 'ar' ? 'إجراء مسجل' : 'logged actions'}</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                <th>{t.action}</th>
                <th>{t.resource}</th>
                <th>{t.detail}</th>
                <th>{lang === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>
                ))
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td><span className="font-medium text-sm">@{log.userId}</span></td>
                  <td><span className={ACTION_COLORS[log.action] || 'badge-gray'}>{log.action}</span></td>
                  <td><span className="text-sm text-gray-600">{log.resource}</span></td>
                  <td className="max-w-xs"><p className="text-xs text-gray-600 truncate" title={log.detail}>{log.detail}</p></td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost disabled:opacity-40">{lang === 'ar' ? 'السابق' : 'Prev'}</button>
          <span className="text-sm text-gray-500">{t.page} {page}</span>
          <button disabled={logs.length < 50} onClick={() => setPage(p => p + 1)} className="btn-ghost disabled:opacity-40">{lang === 'ar' ? 'التالي' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
