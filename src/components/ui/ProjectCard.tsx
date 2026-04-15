import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Database } from 'lucide-react';
import { Project } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { lang, t } = useAuthStore();
  const name = lang === 'ar' ? project.nameAr : project.nameEn;
  const desc = lang === 'ar' ? project.descriptionAr : project.descriptionEn;
  const kpi = (project as any).kpiSummary;

  const timeAgo = project.lastBatch?.uploadedAt
    ? formatDistanceToNow(new Date(project.lastBatch.uploadedAt), { addSuffix: true, locale: lang === 'ar' ? arLocale : enUS })
    : null;

  const lastUpdateFull = project.lastBatch?.uploadedAt
    ? new Date(project.lastBatch.uploadedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: project.color + '15' }}>
            {project.icon}
          </div>
          {timeAgo && (
            <span className="badge-yellow flex items-center gap-1 text-xs">
              <Clock size={10} /> {timeAgo}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-base mb-1">{name}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-1 mb-3">{desc}</p>

        {/* Main KPI */}
        {kpi && (
          <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: '#f0f4ff' }}>
            <p className="text-xs text-gray-500 mb-0.5">{lang === 'ar' ? kpi.mainLabelAr : kpi.mainLabel}</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold" style={{ color: '#002544' }}>
                {typeof kpi.main === 'number' ? kpi.main.toLocaleString() : kpi.main}
              </span>
              {kpi.unit && <span className="text-xs text-gray-400 mb-0.5 font-semibold">{kpi.unit}</span>}
            </div>
            {kpi.secondary !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-400">{lang === 'ar' ? kpi.secondaryLabelAr : kpi.secondaryLabel}:</span>
                <span className="text-xs font-bold text-gray-600">
                  {typeof kpi.secondary === 'number' ? kpi.secondary.toLocaleString() : kpi.secondary}
                  {kpi.unit && <span className="text-gray-400 font-normal ms-0.5">{kpi.unit}</span>}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="py-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Database size={13} className="text-gray-400" />
              <span className="font-semibold text-gray-700 text-sm">{project.recordCount.toLocaleString()}</span>
              <span className="text-gray-400 text-xs">{t.records}</span>
            </div>
          </div>
          {lastUpdateFull && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              <span>{lang === 'ar' ? 'آخر تحديث:' : 'Last update:'}</span>
              <span className="font-medium text-gray-500">{lastUpdateFull}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-4">
        <button className="w-full btn-primary flex items-center justify-center gap-2 group-hover:bg-yellow-400">
          {t.openDashboard}
          <ArrowRight size={14} className={lang === 'ar' ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
}
