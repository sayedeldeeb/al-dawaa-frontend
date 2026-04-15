/**
 * useProjectConfig — Hook for consuming Dashboard Controls configuration
 * =======================================================================
 * Reads the persisted config from localStorage and re-renders whenever
 * the admin changes anything in DashboardControls (via 'dc-changed' event).
 *
 * Usage in any project page:
 *   const { isSectionVisible, visualConfig, customCharts } = useProjectConfig(projectId);
 *   if (!isSectionVisible('charts')) return null; // hide charts section
 */
import { useState, useEffect, useCallback } from 'react';
import type { ProjectDashboardConfig, SectionConfig, ChartConfig, VisualConfig } from '../components/ui/DashboardControls';

// ── Defaults (mirrors DashboardControls defaults) ────────────────────────────
const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'kpis',    label: 'KPI Cards',          visible: true, order: 0 },
  { id: 'filters', label: 'Filters',             visible: true, order: 1 },
  { id: 'charts',  label: 'Charts',              visible: true, order: 2 },
  { id: 'table',   label: 'Data Table',          visible: true, order: 3 },
  { id: 'ranking', label: 'Rankings & Insights', visible: true, order: 4 },
];

const DEFAULT_VISUAL: VisualConfig = {
  primaryColor: '#002544',
  accentColor:  '#FFC200',
  fontSize:     'base',
  spacing:      'normal',
};

function loadConfig(projectId: string): ProjectDashboardConfig {
  try {
    const raw = localStorage.getItem(`dc_${projectId}`);
    if (!raw) return { kpis: [], charts: [], columns: [], filters: [], visual: DEFAULT_VISUAL, sections: DEFAULT_SECTIONS };
    return JSON.parse(raw) as ProjectDashboardConfig;
  } catch {
    return { kpis: [], charts: [], columns: [], filters: [], visual: DEFAULT_VISUAL, sections: DEFAULT_SECTIONS };
  }
}

// ── Font-size CSS classes ─────────────────────────────────────────────────────
const FONT_SIZE_CLASS: Record<string, string> = {
  sm:   'text-xs',
  base: 'text-sm',
  lg:   'text-base',
};

// ── Spacing CSS classes ───────────────────────────────────────────────────────
const SPACING_CLASS: Record<string, string> = {
  compact:  'gap-2 p-3',
  normal:   'gap-4 p-5',
  relaxed:  'gap-6 p-7',
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useProjectConfig(projectId: string) {
  const [config, setConfig] = useState<ProjectDashboardConfig>(() => loadConfig(projectId));

  // Reload on any config-change event
  const reload = useCallback(() => {
    setConfig(loadConfig(projectId));
  }, [projectId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Only reload if it's this project (or no projectId specified)
      if (!detail?.projectId || detail.projectId === projectId) {
        reload();
      }
    };
    window.addEventListener('dc-changed', handler);
    window.addEventListener('storage', reload); // cross-tab support
    return () => {
      window.removeEventListener('dc-changed', handler);
      window.removeEventListener('storage', reload);
    };
  }, [projectId, reload]);

  // ── Derived helpers ──────────────────────────────────────────────────────

  /** Returns true if a section should be shown (default: true for all) */
  const isSectionVisible = useCallback((sectionId: string): boolean => {
    const sections = config.sections?.length ? config.sections : DEFAULT_SECTIONS;
    const found = sections.find(s => s.id === sectionId);
    return found ? found.visible : true;
  }, [config]);

  /** Returns sections sorted by their configured order */
  const getSortedSections = useCallback((): SectionConfig[] => {
    const sections = config.sections?.length ? config.sections : DEFAULT_SECTIONS;
    return [...sections].sort((a, b) => a.order - b.order);
  }, [config]);

  /** Returns custom charts the admin added via chart builder */
  const customCharts = (config.charts || []).filter(c => c.visible);

  /** Returns the visual config with fallback to defaults */
  const visualConfig: VisualConfig = config.visual || DEFAULT_VISUAL;

  /** Tailwind classes for font size based on visual config */
  const fontSizeClass = FONT_SIZE_CLASS[visualConfig.fontSize] || 'text-sm';

  /** Tailwind classes for spacing based on visual config */
  const spacingClass = SPACING_CLASS[visualConfig.spacing] || 'gap-4 p-5';

  return {
    config,
    isSectionVisible,
    getSortedSections,
    customCharts,
    visualConfig,
    fontSizeClass,
    spacingClass,
  };
}
