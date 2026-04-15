import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Lang } from '../types';
import { en, ar } from '../i18n/translations';

export type AppTheme = 'classic' | 'modern' | 'smart' | 'professional';

interface AuthState {
  user: User | null;
  token: string | null;
  lang: Lang;
  t: typeof en;
  sidebarCollapsed: boolean;
  theme: AppTheme;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  toggleLang: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: AppTheme) => void;
}

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      lang: 'ar',
      t: ar,
      sidebarCollapsed: false,
      theme: 'classic',
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleLang: () => {
        const next = get().lang === 'ar' ? 'en' : 'ar';
        document.documentElement.setAttribute('lang', next);
        document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
        set({ lang: next, t: next === 'ar' ? ar : en });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    { name: 'al-dawaa-auth', partialize: (s) => ({ token: s.token, user: s.user, lang: s.lang, sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }) }
  )
);
