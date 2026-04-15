import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';

type ChartType = 'bar' | 'line' | 'area' | 'horizontal';

const ALL_SWITCHER: [ChartType, string, string][] = [
  ['bar',        '▦', 'Bar Chart'],
  ['line',       '↗', 'Line Chart'],
  ['area',       '◿', 'Area Chart'],
  ['horizontal', '≡', 'Horizontal Bar'],
];

interface ChartCardProps {
  title: string;
  data: any[];
  dataKey?: string;
  nameKey?: string;
  loading?: boolean;
  switchable?: boolean;
  color?: string;
}

const TOOLTIP_STYLE = {
  background: '#111827', border: 'none',
  borderRadius: '8px', color: '#fff', fontSize: '12px',
};

export default function ChartCard({
  title,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  loading = false,
  switchable = true,
  color = '#3b82f6',
}: ChartCardProps) {
  const [chartType, setChartType]     = useState<ChartType>('bar');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labelsOn, setLabelsOn]       = useState(true);
  const [tooltipsOn, setTooltipsOn]   = useState(true);

  const isFullWidthChart = false;

  function renderChart() {
    if (loading) return <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 2s infinite' }} />;
    if (!data.length) return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        No data available
      </div>
    );

    if (chartType === 'horizontal') {
      return (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis type="category" dataKey={nameKey} width={90} tick={{ fontSize: 10, fill: '#374151' }} />
            {tooltipsOn && <Tooltip contentStyle={TOOLTIP_STYLE} />}
            <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]}>
              {labelsOn && <LabelList dataKey={dataKey} position="right" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={data} margin={{ top: 18, right: 20, left: -10, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            {tooltipsOn && <Tooltip contentStyle={TOOLTIP_STYLE} />}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }}>
              {labelsOn && <LabelList dataKey={dataKey} position="top" style={{ fontSize: 11, fill: color, fontWeight: 700 }} />}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 18, right: 20, left: -10, bottom: 2 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            {tooltipsOn && <Tooltip contentStyle={TOOLTIP_STYLE} />}
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
              fill="url(#areaGrad)" activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // default: bar
    return (
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 24, right: 10, left: -10, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 10, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
          {tooltipsOn && <Tooltip contentStyle={TOOLTIP_STYLE} />}
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40}>
            {labelsOn && <LabelList dataKey={dataKey} position="top" style={{ fontSize: 12, fill: color, fontWeight: 700 }} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className={`ref-card p-5 flex flex-col ${isFullWidthChart ? 'overflow-hidden' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{title}</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(v => !v)}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: settingsOpen ? '#3b82f6' : '#f9fafb',
              color: settingsOpen ? '#fff' : '#6b7280',
              border: '1px solid #e5e7eb',
            }}
          >⚙</button>

          {/* Chart type switcher */}
          {switchable && (
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, gap: 2 }}>
              {ALL_SWITCHER.map(([type, icon, tip]) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  title={tip}
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: 'none',
                    background: chartType === type ? '#fff' : 'transparent',
                    color: chartType === type ? '#3b82f6' : '#9ca3af',
                    boxShadow: chartType === type ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: chartType === type ? 700 : 400,
                  }}
                >{icon}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={labelsOn} onChange={e => setLabelsOn(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: '#3b82f6' }} />
            <span style={{ color: '#374151' }}>Show data labels</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={tooltipsOn} onChange={e => setTooltipsOn(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: '#3b82f6' }} />
            <span style={{ color: '#374151' }}>Show tooltips</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginInlineStart: 'auto' }}>
            <span style={{ color: '#6b7280' }}>Type:</span>
            <select
              value={chartType}
              onChange={e => setChartType(e.target.value as ChartType)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#374151', background: '#fff' }}
            >
              {ALL_SWITCHER.map(([type, , tip]) => (
                <option key={type} value={type}>{tip}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Chart Body */}
      <div style={{ flex: 1, width: '100%', minHeight: 200 }}>
        {renderChart()}
      </div>
    </div>
  );
}
