import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Globe, Settings, Upload, Bell, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/* ── Project list with emoji icons ─────────────────────────────────────── */
const PROJECTS = [
  { id: 'churned-customer', emoji: '👤', bg: '#f1f5f9', en: 'Churned Customers',    ar: 'العملاء المفقودين'   },
  { id: 'yusur',            emoji: '🚀', bg: '#fce7f3', en: 'YUSUR',                ar: 'مشروع يسر'           },
  { id: 'medical-devices',  emoji: '⚕️', bg: '#dcfce7', en: 'Medical Devices',      ar: 'الأجهزة الطبية'      },
  { id: 'high-value',       emoji: '💎', bg: '#f3e8ff', en: 'High Value',           ar: 'القيمة العالية'       },
  { id: 'vip-files',        emoji: '🔄', bg: '#e0f2fe', en: 'AL-Dawaa Refill',      ar: 'إعادة تعبئة الدواء'  },
  { id: 'pill-pack',        emoji: '📦', bg: '#fef3c7', en: 'Pill Pack',            ar: 'الحزمة الدوائية'      },
  { id: 'p2p',              emoji: '↔️', bg: '#e0e7ff', en: 'P2P',                  ar: 'نقل بين الفروع'       },
  { id: 'hybrid-pharmacy',  emoji: '🏥', bg: '#ccfbf1', en: 'Hybrid Pharmacy',      ar: 'صيدليات هايبرد'       },
];

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Sidebar() {
  const { user, lang, t, clearAuth, toggleLang, sidebarCollapsed, toggleSidebar } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const isActive  = (path: string) => location.pathname === path;
  const isProject = (id: string)   => location.pathname === `/projects/${id}`;
  const logout    = () => { clearAuth(); navigate('/login'); };
  const isEn      = lang === 'en';

  const collapsed = sidebarCollapsed;
  const w         = collapsed ? 72 : 256;

  /* ── Sidebar item styles ─────────────────────────────────────────────── */
  const itemBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s ease',
    fontSize: 13, fontWeight: 500, color: '#6b7280',
    background: 'transparent', border: 'none',
    width: '100%', textAlign: isEn ? 'left' : 'right',
  };
  const itemActive: React.CSSProperties = {
    ...itemBase,
    background: 'rgba(0,37,68,0.07)', color: '#002544',
    fontWeight: 700,
    ...(isEn
      ? { borderRight: '3px solid #FFC200', paddingRight: 9 }
      : { borderLeft:  '3px solid #FFC200', paddingLeft:  9 }),
  };

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string; icon?: React.ElementType; label: string; badge?: React.ReactNode }) => {
    const active = isActive(to);
    return (
      <button
        style={active ? itemActive : itemBase}
        onClick={() => navigate(to)}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0,37,68,0.04)'; e.currentTarget.style.color = '#002544'; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}}
      >
        {Icon && <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />}
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
        {!collapsed && badge}
      </button>
    );
  };

  const ProjectItem = ({ id, emoji, bg, label }: { id: string; emoji: string; bg: string; label: string }) => {
    const active = isProject(id);
    return (
      <button
        style={active ? { ...itemActive } : itemBase}
        onClick={() => navigate(`/projects/${id}`)}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0,37,68,0.04)'; e.currentTarget.style.color = '#002544'; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          {emoji}
        </div>
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{label}</span>}
      </button>
    );
  };

  return (
    <aside style={{
      width: w, minWidth: w, maxWidth: w,
      background: '#ffffff',
      borderRight: isEn ? '1px solid #e5e7eb' : 'none',
      borderLeft:  isEn ? 'none' : '1px solid #e5e7eb',
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      userSelect: 'none',
    }}>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#002544', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC200', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
              D
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#002544' }}>AL-Dawaa</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Analytics</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#002544', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC200', fontWeight: 900, fontSize: 13, margin: '0 auto' }}>
            D
          </div>
        )}
        <button
          onClick={toggleSidebar}
          style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          {collapsed ? <Menu size={15} /> : <X size={15} />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Dashboard */}
        <NavItem to="/" icon={LayoutDashboard} label={isEn ? 'Dashboard' : 'لوحة القيادة'} />

        {/* ── Projects section ───────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '12px 8px 4px', marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isEn ? 'Projects' : 'المشاريع'}
            </span>
          </div>
        )}

        {!collapsed ? (
          <div>
            <button
              style={{ ...itemBase, justifyContent: 'space-between', width: '100%' }}
              onClick={() => setProjectsOpen(v => !v)}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                {isEn ? 'All Projects' : 'جميع المشاريع'}
              </span>
              <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: projectsOpen ? 'rotate(180deg)' : 'none', color: '#9ca3af' }} />
            </button>
            {projectsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                {PROJECTS.map(p => (
                  <ProjectItem key={p.id} id={p.id} emoji={p.emoji} bg={p.bg} label={isEn ? p.en : p.ar} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PROJECTS.map(p => (
              <ProjectItem key={p.id} id={p.id} emoji={p.emoji} bg={p.bg} label={isEn ? p.en : p.ar} />
            ))}
          </div>
        )}

        {/* ── Operations ─────────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '12px 8px 4px', marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isEn ? 'Operations' : 'العمليات'}
            </span>
          </div>
        )}
        {collapsed && <div style={{ height: 12 }} />}

        <NavItem
          to="/alerts" icon={Bell}
          label={isEn ? 'Alerts' : 'التنبيهات'}
          badge={<span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', borderRadius: 999, padding: '2px 7px' }}>2</span>}
        />

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <NavItem to="/upload" icon={Upload} label={isEn ? 'Upload Data' : 'رفع البيانات'} />
        )}

        <NavItem to="/settings" icon={Settings} label={isEn ? 'Settings' : 'الإعدادات'} />
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #f3f4f6' }}>
        {/* Language toggle */}
        <button
          style={{ ...itemBase, gap: 8, marginBottom: 4 }}
          onClick={toggleLang}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <Globe size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>{isEn ? 'عربي' : 'English'}</span>}
        </button>

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #FFC200 0%, #E6AE00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002544', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isEn ? user?.fullName : user?.fullNameAr || user?.fullName}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
