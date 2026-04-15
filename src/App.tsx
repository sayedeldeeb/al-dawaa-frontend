import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MedicalDevicesPage from './pages/projects/MedicalDevicesPage';
import ChurnedCustomerPage from './pages/projects/ChurnedCustomerPage';
import HybridPharmacyPage from './pages/projects/HybridPharmacyPage';
import YUSURPage from './pages/projects/YUSURPage';
import UploadPage from './pages/UploadPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import { en, ar } from './i18n/translations';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AlertsPage() {
  const { lang } = useAuthStore();
  return (
    <div className="p-6 fade-in">
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#002544' }}>{lang === 'ar' ? 'لوحة التنبيهات' : 'Alerts Panel'}</h1>
      <div className="space-y-3">
        {[
          { title: lang === 'ar' ? 'مخزون CPAP Machine منخفض' : 'CPAP Machine stock critically low', detail: lang === 'ar' ? '12 وحدة متبقية في منطقة الرياض' : '12 units remaining in Riyadh region', type: 'critical', time: '2h ago' },
          { title: lang === 'ar' ? 'انخفاض معدل نجاح صيدلية الروابي' : 'Al-Rawabi Pharmacy success rate drop', detail: lang === 'ar' ? 'انخفض بنسبة 15% هذا الأسبوع' : 'Dropped 15% this week compared to last week', type: 'warning', time: '5h ago' },
          { title: lang === 'ar' ? 'معدل تنفيذ YUSUR تحت الهدف' : 'YUSUR fulfillment rate below target', detail: lang === 'ar' ? 'المعدل الحالي 55% والهدف 80%' : 'Current rate 55%, target is 80%', type: 'warning', time: '1d ago' },
        ].map((alert, i) => (
          <div key={i} className={`p-4 rounded-xl border ${alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-semibold text-sm ${alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>{alert.title}</p>
                <p className={`text-xs mt-1 ${alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>{alert.detail}</p>
              </div>
              <span className="text-xs text-gray-400">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { lang, token } = useAuthStore();

  useEffect(() => {
    const stored = localStorage.getItem('al-dawaa-auth');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.lang) {
          document.documentElement.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');
          document.documentElement.setAttribute('lang', state.lang);
          useAuthStore.setState({ t: state.lang === 'ar' ? ar : en });
        }
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      } catch {}
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />

          {/* Project pages */}
          <Route path="/projects/medical-devices" element={<MedicalDevicesPage />} />
          <Route path="/projects/yusur" element={<YUSURPage />} />
          <Route path="/projects/churned-customer" element={<ChurnedCustomerPage projectId="churned-customer" />} />
          {/* VIP Files renamed to AL-Dawaa Refill */}
          <Route path="/projects/vip-files" element={<ChurnedCustomerPage projectId="vip-files" />} />
          {/* High Value */}
          <Route path="/projects/high-value" element={<ChurnedCustomerPage projectId="high-value" />} />
          {/* P2P */}
          <Route path="/projects/p2p" element={<ChurnedCustomerPage projectId="p2p" />} />
          {/* Pill Pack */}
          <Route path="/projects/pill-pack" element={<ChurnedCustomerPage projectId="pill-pack" />} />
          {/* Hybrid Pharmacy */}
          <Route path="/projects/hybrid-pharmacy" element={<HybridPharmacyPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Alerts */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Upload */}
          <Route path="/upload" element={<ProtectedRoute roles={['admin']}><UploadPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AuditLogPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
