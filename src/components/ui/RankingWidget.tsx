import React from 'react';
import { Trophy, TrendingDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface RankItem { name: string; total: number; dispensed: number; value: number; rate: number; }

interface RankingWidgetProps {
  title: string;
  top5: RankItem[];
  bottom5: RankItem[];
  loading?: boolean;
}

function RankTable({ items, type }: { items: RankItem[]; type: 'top' | 'bottom' }) {
  const { lang } = useAuthStore();
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${type === 'top' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-700 truncate">{item.name}</span>
              <span className={`text-xs font-bold ${type === 'top' ? 'text-green-600' : 'text-red-600'}`}>{item.rate}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${item.rate}%`, background: type === 'top' ? '#16a34a' : '#dc2626' }}></div>
            </div>
          </div>
          <span className="text-xs text-gray-400 w-12 text-end flex-shrink-0">{item.total.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function RankingWidget({ title, top5, bottom5, loading }: RankingWidgetProps) {
  const { t } = useAuthStore();
  const [view, setView] = React.useState<'top' | 'bottom'>('top');

  if (loading) return <div className="chart-card h-64 animate-pulse bg-gray-50"></div>;

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {view === 'top' ? <Trophy size={16} className="text-yellow-500" /> : <TrendingDown size={16} className="text-red-500" />}
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button onClick={() => setView('top')} className={`px-3 py-1 text-xs font-medium transition-colors ${view === 'top' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.top5}
          </button>
          <button onClick={() => setView('bottom')} className={`px-3 py-1 text-xs font-medium transition-colors ${view === 'bottom' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.bottom5}
          </button>
        </div>
      </div>
      <RankTable items={view === 'top' ? top5 : bottom5} type={view} />
    </div>
  );
}
