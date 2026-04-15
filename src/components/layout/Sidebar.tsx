import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Globe, Settings, Upload, Bell,
  LayoutDashboard, ChevronDown, Menu, X,
  BarChart2, Target, CheckSquare, Users,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/* ── Design tokens (Reference design — blue accent) ─────────────────────── */
const C = {
  active:    '#3b82f6',
  activeBg:  '#f0f4ff',
  hover:     '#f3f4f6',
  hoverText: '#374151',
  text:      '#6b7280',
  section:   '#9ca3af',
  border:    '#e5e7eb',
  bg:        '#ffffff',
};

/* ── Projects list ───────────────────────────────────────────────────────── */
const PROJECTS = [
  { id: 'churned-customer', emoji: '👤', bg: '#f1f5f9', en: 'Churned Customers',   ar: 'العملاء المتوقفون'  },
  { id: 'yusur',            emoji: '🚀', bg: '#fce7f3', en: 'YUSUR',               ar: 'مشروع يسر'          },
  { id: 'medical-devices',  emoji: '⚕️', bg: '#dcfce7', en: 'Medical Devices',     ar: 'الأجهزة الطبية'     },
  { id: 'high-value',       emoji: '💎', bg: '#f3e8ff', en: 'High Value',          ar: 'القيمة العالية'      },
  { id: 'vip-files',        emoji: '🔄', bg: '#e0f2fe', en: 'AL-Dawaa Refill',     ar: 'إعادة تعبئة الدواء' },
  { id: 'pill-pack',        emoji: '📦', bg: '#fef3c7', en: 'Pill Pack',           ar: 'الحزمة الدوائية'     },
  { id: 'p2p',              emoji: '↔️', bg: '#e0e7ff', en: 'P2P',                 ar: 'نقل بين الفروع'      },
  { id: 'hybrid-pharmacy',  emoji: '🏥', bg: '#ccfbf1', en: 'Hybrid Pharmacy',     ar: 'صيدليات هايبرد'      },
  { id: 'vip-customers',    emoji: '👑', bg: '#fed7aa', en: 'VIP Customers',       ar: 'كبار العملاء'        },
  { id: 'onboarding',       emoji: '📝', bg: '#cffafe', en: 'Onboarding Unit',     ar: 'وحدة الإعداد'        },
  { id: 'call-center',      emoji: '☎️', bg: '#ddd6fe', en: 'Call Center',         ar: 'مركز الاتصال'        },
  { id: 'rasd',             emoji: '📊', bg: '#d1fae5', en: 'Rasd',               ar: 'رصد'                 },
];

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════════════════ */
export default function Sidebar() {
  const { user, lang, clearAuth, toggleLang, sidebarCollapsed, toggleSidebar } = useAuthStore();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [projOpen, setProjOpen] = useState(true);

  const isEn      = lang === 'en';
  const collapsed = sidebarCollapsed;
  const w         = collapsed ? 68 : 256;

  const isActive  = (p: string) => location.pathname === p;
  const isProjAct = (id: string) => location.pathname === `/projects/${id}`;
  const logout    = () => { clearAuth(); navigate('/login'); };

  /* ── Shared style helpers ────────────────────────────────────────────── */
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    gap: 10, padding: '9px 12px',
    borderRadius: 8, cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: 13, fontWeight: 500,
    color: C.text, background: 'transparent',
    border: 'none', width: '100%',
    textAlign: isEn ? 'left' : 'right',
    borderLeft: '3px solid transparent',
    borderRight: '3px solid transparent',
  };

  const act: React.CSSProperties = {
    ...base,
    background: C.activeBg, color: C.active, fontWeight: 600,
    ...(isEn
      ? { borderLeft: `3px solid ${C.active}`, paddingLeft: 9 }
      : { borderRight: `3px solid ${C.active}`, paddingRight: 9 }),
  };

  /* ── NavItem ─────────────────────────────────────────────────────────── */
  function NavItem({
    to, icon: Icon, label, badge,
  }: { to: string; icon?: React.ElementType; label: string; badge?: React.ReactNode }) {
    const on = isActive(to);
    return (
      <button
        style={on ? act : base}
        onClick={() => navigate(to)}
        onMouseEnter={e => { if (!on) { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.hoverText; }}}
        onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}}
      >
        {Icon && <Icon size={16} strokeWidth={on ? 2.2 : 1.8} style={{ flexShrink: 0, color: on ? C.active : 'currentColor' }} />}
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
        {!collapsed && badge}
      </button>
    );
  }

  /* ── ProjectItem ─────────────────────────────────────────────────────── */
  function ProjectItem({ id, emoji, bg, label }: { id: string; emoji: string; bg: string; label: string }) {
    const on = isProjAct(id);
    return (
      <button
        style={on ? act : base}
        onClick={() => navigate(`/projects/${id}`)}
        onMouseEnter={e => { if (!on) { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.hoverText; }}}
        onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}}
      >
        <div style={{ width: 26, height: 26, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {emoji}
        </div>
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{label}</span>}
      </button>
    );
  }

  /* ── Section label ───────────────────────────────────────────────────── */
  function SectionLabel({ label }: { label: string }) {
    if (collapsed) return <div style={{ height: 6 }} />;
    return (
      <div style={{ padding: '12px 12px 4px', marginTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.section, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <aside style={{
      width: w, minWidth: w, maxWidth: w,
      background: C.bg,
      borderRight: isEn ? `1px solid ${C.border}` : 'none',
      borderLeft:  isEn ? 'none' : `1px solid ${C.border}`,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      userSelect: 'none', position: 'relative',
    }}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '18px 14px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#111827', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14, flexShrink: 0,
              fontFamily: 'Inter, sans-serif',
            }}>
              D
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', fontFamily: 'Inter, sans-serif' }}>AL-Dawaa HQ</div>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: C.section, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ANALYTICS PLATFORM
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: '#111827', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, fontFamily: 'Inter, sans-serif',
          }}>
            D
          </div>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            padding: 5, borderRadius: 7, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: '#9ca3af', display: 'flex', alignItems: 'center',
            ...(collapsed ? { position: 'absolute', top: 20, right: isEn ? -10 : undefined, left: isEn ? undefined : -10, width: 18, height: 18, borderRadius: '50%', border: `1px solid ${C.border}`, background: '#fff', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 10 } : {}),
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = collapsed ? '#fff' : 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          {collapsed ? <Menu size={11} /> : <X size={14} />}
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>

        {/* Main */}
        <NavItem to="/" icon={LayoutDashboard} label={isEn ? 'Dashboard' : 'لوحة القيادة'} />
        <NavItem
          to="/analytics" icon={BarChart2}
          label={isEn ? 'Analytics' : 'التحليلات'}
          badge={
            <span style={{ fontSize: 9, fontWeight: 800, background: '#dbeafe', color: C.active, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
              NEW
            </span>
          }
        />
        <NavItem to="/goals" icon={Target} label={isEn ? 'Goals & Targets' : 'الأهداف والمستهدفات'} />

        {/* Projects section */}
        <SectionLabel label={isEn ? 'Projects' : 'المشاريع'} />

        {!collapsed ? (
          <div>
            <button
              style={{ ...base, justifyContent: 'space-between', padding: '7px 12px' }}
              onClick={() => setProjOpen(v => !v)}
              onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                {isEn ? 'All Projects' : 'جميع المشاريع'}
              </span>
              <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: projOpen ? 'rotate(180deg)' : 'none', color: C.section }} />
            </button>
            {projOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
                {PROJECTS.map(p => (
                  <ProjectItem key={p.id} id={p.id} emoji={p.emoji} bg={p.bg} label={isEn ? p.en : p.ar} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {PROJECTS.map(p => (
              <ProjectItem key={p.id} id={p.id} emoji={p.emoji} bg={p.bg} label={isEn ? p.en : p.ar} />
            ))}
          </div>
        )}

        {/* Operations */}
        <SectionLabel label={isEn ? 'Operations' : 'العمليات'} />

        <NavItem
          to="/alerts" icon={Bell}
          label={isEn ? 'Alerts' : 'التنبيهات'}
          badge={
            <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', borderRadius: 999, padding: '1px 6px', flexShrink: 0 }}>
              2
            </span>
          }
        />
        <NavItem to="/tasks" icon={CheckSquare} label={isEn ? 'Tasks' : 'المهام'} />

        {/* Admin */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <>
            <SectionLabel label={isEn ? 'Admin' : 'الإدارة'} />
            <NavItem to="/upload"      icon={Upload}   label={isEn ? 'Upload Data' : 'رفع البيانات'} />
            <NavItem to="/admin/users" icon={Users}    label={isEn ? 'Users' : 'المستخدمون'} />
            <NavItem to="/admin/audit" icon={Activity} label={isEn ? 'Audit Log' : 'سجل العمليات'} />
          </>
        )}

        <NavItem to="/settings" icon={Settings} label={isEn ? 'Settings' : 'الإعدادات'} />
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${C.border}` }}>

        {/* Language toggle */}
        <button
          style={{ ...base, gap: 8, marginBottom: 4 }}
          onClick={toggleLang}
          onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.hoverText; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}
        >
          <Globe size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>{isEn ? 'عربي' : 'English'}</span>}
        </button>

        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: collapsed ? '6px' : '8px 10px',
          background: '#f9fafb', borderRadius: 10,
          border: `1px solid ${C.border}`,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#e5e7eb', color: '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, flexShrink: 0,
            fontFamily: 'Inter, sans-serif',
          }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isEn ? user?.fullName : (user as any)?.fullNameAr || user?.fullName}
                </div>
                <div style={{ fontSize: 10, color: C.section, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user?.role}
                </div>
              </div>
              <button
                onClick={logout}
                title={isEn ? 'Logout' : 'تسجيل خروج'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
              >
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
