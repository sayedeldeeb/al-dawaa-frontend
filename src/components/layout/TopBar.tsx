/**
 * TopBar — Global top navigation bar
 * ====================================
 * Shows on every authenticated page.
 * Contains: language toggle, 4-theme switcher, breadcrumb, and notifications.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Bell, ChevronRight, Palette, Check, Sun, Moon, Zap, Briefcase } from 'lucide-react';
import { useAuthStore, AppTheme } from '../../store/authStore';

// ── Theme definitions ──────────────────────────────────────────────────────────
const THEMES: {
  id: AppTheme;
  nameEn: string;
  nameAr: string;
  primary: string;
  accent: string;
  bg: string;
  icon: React.ReactNode;
  desc: string;
  descAr: string;
}[] = [
  {
    id: 'classic',
    nameEn: 'AL-Dawaa',
    nameAr: 'الدواء',
    primary: '#002544',
    accent:  '#FFC200',
    bg:      '#F4F7F5',
    icon:    <Sun size={14} />,
    desc:    'Official AL-Dawaa green & gold',
    descAr:  'ألوان صيدلية الدواء الرسمية',
  },
  {
    id: 'modern',
    nameEn: 'Modern',
    nameAr: 'عصري',
    primary: '#0f2b5b',
    accent:  '#00bcd4',
    bg:      '#f0f4f8',
    icon:    <Zap size={14} />,
    desc:    'Clean minimal with teal accent',
    descAr:  'تصميم نظيف بلون تيل',
  },
  {
    id: 'smart',
    nameEn: 'Smart',
    nameAr: 'ذكي',
    primary: '#6c63ff',
    accent:  '#00e5c3',
    bg:      '#0d1117',
    icon:    <Moon size={14} />,
    desc:    'Dark glass-morphism with AI feel',
    descAr:  'وضع مظلم بتأثير الذكاء الاصطناعي',
  },
  {
    id: 'professional',
    nameEn: 'Professional',
    nameAr: 'احترافي',
    primary: '#1e293b',
    accent:  '#22c55e',
    bg:      '#f1f5f9',
    icon:    <Briefcase size={14} />,
    desc:    'Slate corporate with green highlights',
    descAr:  'تصميم مؤسسي بألوان خضراء',
  },
];

// ── Breadcrumb map ─────────────────────────────────────────────────────────────
const ROUTE_MAP: Record<string, { en: string; ar: string }> = {
  '/': { en: 'Home', ar: 'الرئيسية' },
  '/projects/churned-customer': { en: 'Churned Customer', ar: 'العملاء المتوقفون' },
  '/projects/yusur':            { en: 'YUSUR', ar: 'يسر' },
  '/projects/medical-devices':  { en: 'Medical Devices', ar: 'الأجهزة الطبية' },
  '/projects/high-value':       { en: 'High Value', ar: 'القيمة العالية' },
  '/projects/vip-files':        { en: 'AL-Dawaa Refill', ar: 'إعادة تعبئة الدواء' },
  '/projects/pill-pack':        { en: 'Pill Pack', ar: 'الحزمة الدوائية' },
  '/projects/p2p':              { en: 'P2P', ar: 'نقل بين الفروع' },
  '/projects/hybrid-pharmacy':  { en: 'Hybrid Pharmacy', ar: 'صيدليات هايبرد' },
  '/upload':                    { en: 'Upload Data', ar: 'رفع البيانات' },
  '/settings':                  { en: 'Settings', ar: 'الإعدادات' },
  '/alerts':                    { en: 'Alerts', ar: 'التنبيهات' },
  '/admin/users':               { en: 'User Management', ar: 'إدارة المستخدمين' },
  '/admin/audit':               { en: 'Audit Log', ar: 'سجل العمليات' },
};

export default function TopBar() {
  const { lang, toggleLang, theme, setTheme } = useAuthStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const current = ROUTE_MAP[location.pathname];
  const isHome  = location.pathname === '/';
  const isProject = location.pathname.startsWith('/projects/');

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div
      className="topbar sticky top-0 z-30 flex items-center justify-between px-5 py-2.5"
      style={{ minHeight: 50 }}
    >
      {/* ── Left: Breadcrumb ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        {!isHome && (
          <>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--c-text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-3)')}
            >
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            <ChevronRight size={12} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />
          </>
        )}
        {current && (
          <span className="font-bold truncate" style={{ color: 'var(--c-primary)', fontSize: 14 }}>
            {lang === 'ar' ? current.ar : current.en}
          </span>
        )}
        {!current && location.pathname !== '/' && (
          <span className="font-semibold truncate" style={{ color: 'var(--c-primary)', fontSize: 14 }}>
            {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page'}
          </span>
        )}
      </div>

      {/* ── Right: Controls ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* ── Theme Switcher ─────────────────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
            style={{
              background: activeTheme.primary,
              borderColor: activeTheme.accent,
              color: '#fff',
            }}
            title={lang === 'ar' ? 'تغيير التصميم' : 'Change Theme'}
          >
            <span style={{ color: activeTheme.accent }}>{activeTheme.icon}</span>
            <span className="hidden sm:inline">{lang === 'ar' ? activeTheme.nameAr : activeTheme.nameEn}</span>
            <Palette size={12} style={{ opacity: 0.7 }} />
          </button>

          {showThemePicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemePicker(false)}
              />
              {/* Dropdown */}
              <div
                className="absolute end-0 top-full mt-2 z-50 rounded-2xl shadow-xl border overflow-hidden"
                style={{
                  background: 'var(--c-surface)',
                  borderColor: 'var(--c-border)',
                  minWidth: 260,
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'var(--c-border-light)', background: 'var(--c-bg)' }}
                >
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--c-primary)' }}>
                    {lang === 'ar' ? '🎨 اختر التصميم' : '🎨 Choose Theme'}
                  </p>
                </div>

                {/* Theme list */}
                <div className="p-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 last:mb-0 text-start"
                      style={theme === t.id
                        ? { background: t.primary + '12', border: `1.5px solid ${t.primary}30` }
                        : { border: '1.5px solid transparent' }
                      }
                      onMouseEnter={e => { if (theme !== t.id) e.currentTarget.style.background = 'var(--c-bg)'; }}
                      onMouseLeave={e => { if (theme !== t.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Color preview */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ background: t.primary, color: t.accent }}
                        >
                          {t.icon}
                        </div>
                        {/* Accent dot */}
                        <div
                          className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ background: t.accent }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>
                            {lang === 'ar' ? t.nameAr : t.nameEn}
                          </span>
                          {theme === t.id && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: t.accent, color: t.primary, fontSize: 10 }}
                            >
                              {lang === 'ar' ? 'نشط' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-text-3)' }}>
                          {lang === 'ar' ? t.descAr : t.desc}
                        </p>
                      </div>

                      {/* Check */}
                      {theme === t.id && (
                        <Check size={15} style={{ color: t.primary, flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Language Toggle ────────────────────────────────────────────── */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:shadow-sm"
          style={{
            background: 'var(--c-surface)',
            borderColor: 'var(--c-border)',
            color: 'var(--c-primary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--c-primary)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--c-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--c-surface)';
            e.currentTarget.style.color = 'var(--c-primary)';
            e.currentTarget.style.borderColor = 'var(--c-border)';
          }}
          title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Globe size={13} />
          <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <button
          className="relative p-2 rounded-xl border transition-all hover:shadow-sm"
          style={{
            background: 'var(--c-surface)',
            borderColor: 'var(--c-border)',
            color: 'var(--c-text-2)',
          }}
          onClick={() => navigate('/alerts')}
          title={lang === 'ar' ? 'التنبيهات' : 'Alerts'}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--c-primary)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--c-surface)';
            e.currentTarget.style.color = 'var(--c-text-2)';
          }}
        >
          <Bell size={14} />
          <span
            className="absolute top-1 end-1 w-2 h-2 rounded-full"
            style={{ background: '#ef4444' }}
          />
        </button>
      </div>
    </div>
  );
}
