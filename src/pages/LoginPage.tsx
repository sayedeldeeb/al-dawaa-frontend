import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

/* ── Brand ─────────────────────────────────────────────────────────────── */
const NAVY  = '#002544';   // Al-Dawaa official primary
const NAVY2 = '#001529';   // darker hover state
const GOLD  = '#FFC200';   // Al-Dawaa official gold

/* ── Inline SVG Icons ───────────────────────────────────────────────────── */
const IcGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);
const IcUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcEye = ({ open }: { open: boolean }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcArrow = ({ rtl }: { rtl: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17"
    style={{ transform: rtl ? 'rotate(180deg)' : 'none' }}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════════════════════ */
const T = {
  ar: {
    signIn: 'تسجيل الدخول',
    loginSub: 'مرحباً بك في منصة تحليلات الدواء',
    username: 'اسم المستخدم / البريد الإلكتروني',
    usernamePh: 'أدخل بياناتك هنا',
    password: 'كلمة المرور',
    passwordPh: 'أدخل كلمة المرور',
    remember: 'تذكر بياناتي',
    forgot: 'نسيت كلمة المرور؟',
    btnSubmit: 'دخول للمنصة',
    loading: 'جاري تسجيل الدخول...',
    error: 'بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.',
  },
  en: {
    signIn: 'Sign In',
    loginSub: 'Welcome to AL-Dawaa Analytics Platform',
    username: 'Employee ID / Email',
    usernamePh: 'Enter your credentials',
    password: 'Password',
    passwordPh: 'Enter your password',
    remember: 'Remember me',
    forgot: 'Forgot Password?',
    btnSubmit: 'Login',
    loading: 'Signing in...',
    error: 'Invalid credentials. Please try again.',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [lang, setLang]         = useState<'ar' | 'en'>('ar');

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const t           = T[lang];
  const isEn        = lang === 'en';

  useEffect(() => {
    document.documentElement.setAttribute('dir', isEn ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', lang);
  }, [lang, isEn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      if (res.success) {
        setAuth(res.data.user, res.data.token);
        navigate('/');
      } else {
        setError(t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card" style={{ background: '#f1f5f9', fontFamily: isEn ? "'Inter', sans-serif" : "'Tajawal', 'Inter', sans-serif" }}>

      {/* Subtle background blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 384, height: 384, background: NAVY, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.04, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 384, height: 384, background: GOLD, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.04, pointerEvents: 'none' }} />

      {/* ── Card ── */}
      <div className="login-card-inner" style={{ direction: isEn ? 'ltr' : 'rtl' }}>

        {/* Language toggle */}
        <div style={{ position: 'absolute', top: 20, ...(isEn ? { right: 20 } : { left: 20 }) }}>
          <button
            onClick={() => setLang(isEn ? 'ar' : 'en')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: '#f9fafb',
              border: '1px solid #e5e7eb', borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: '#6b7280',
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          >
            {isEn ? 'عربي' : 'English'} <IcGlobe />
          </button>
        </div>

        {/* Brand */}
        <div style={{ marginTop: 28, marginBottom: 36, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: NAVY, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Wasfaty <span style={{ color: GOLD }}>Team</span>
          </h1>
          <div style={{ height: 3, width: 36, background: GOLD, borderRadius: 4, margin: '0 auto 20px', opacity: 0.85 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{t.signIn}</h2>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{t.loginSub}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.username}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', ...(isEn ? { left: 14 } : { right: 14 }), color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                <IcUser />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder={t.usernamePh}
                className="login-input-focus"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 14px',
                  ...(isEn ? { paddingLeft: 42 } : { paddingRight: 42 }),
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 12, fontSize: 14, color: '#111827',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = GOLD)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.password}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', ...(isEn ? { left: 14 } : { right: 14 }), color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                <IcLock />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={t.passwordPh}
                className="login-input-focus"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 42px',
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 12, fontSize: 14, color: '#111827',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = GOLD)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  ...(isEn ? { right: 14 } : { left: 14 }),
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center',
                }}
              >
                <IcEye open={showPw} />
              </button>
            </div>
          </div>

          {/* Remember / Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 15, height: 15, cursor: 'pointer', accentColor: NAVY }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{t.remember}</span>
            </label>
            <a href="#" style={{ fontSize: 12, fontWeight: 700, color: GOLD, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = NAVY)}
              onMouseLeave={e => (e.currentTarget.style.color = GOLD)}>
              {t.forgot}
            </a>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fff2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px 20px',
              background: loading ? '#6b7280' : NAVY,
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: loading ? 'none' : `0 8px 20px rgba(26,43,76,0.18)`,
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = NAVY2); }}
            onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = NAVY); }}
          >
            {loading ? t.loading : t.btnSubmit}
            {!loading && <IcArrow rtl={!isEn} />}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          © {new Date().getFullYear()} AL-Dawaa Pharmacies — Internal Use Only
        </p>
      </div>
    </div>
  );
}
