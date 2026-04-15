import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '../../store/authStore';

export default function MainLayout() {
  const { lang, theme } = useAuthStore();

  React.useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Apply theme attribute to <html> on mount and when theme changes
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'classic');
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Sidebar — white/light design matching Reference */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Sticky top bar */}
        <TopBar />
        {/* Scrollable page content */}
        <main className="flex-1 overflow-auto" style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
