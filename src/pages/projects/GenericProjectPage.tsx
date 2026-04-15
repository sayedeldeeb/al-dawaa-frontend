import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Construction } from 'lucide-react';
import DashboardControls from '../../components/ui/DashboardControls';

const PROJECT_INFO: Record<string, { nameEn: string; nameAr: string; icon: string; descEn: string; descAr: string; bg: string }> = {
  'p2p':        { nameEn: 'P2P Transfers',    nameAr: 'نقل بين الفروع',   icon: '↔️', bg: '#e0e7ff', descEn: 'Peer-to-peer transfer tracking between branches.',        descAr: 'تتبع التحويلات بين الفروع.' },
  'pill-pack':  { nameEn: 'Pill Pack',         nameAr: 'الحزمة الدوائية', icon: '📦', bg: '#fef3c7', descEn: 'Pill pack dispensing performance monitoring.',             descAr: 'مراقبة أداء صرف الحزم الدوائية.' },
  'high-value': { nameEn: 'High Value',        nameAr: 'القيمة العالية',  icon: '💎', bg: '#f3e8ff', descEn: 'High-value prescription management.',                      descAr: 'إدارة الوصفات عالية القيمة.' },
};

interface Props { projectId: string; }

export default function GenericProjectPage({ projectId }: Props) {
  const { lang } = useAuthStore();
  const info = PROJECT_INFO[projectId] || { nameEn: projectId, nameAr: projectId, icon: '📊', bg: '#f1f5f9', descEn: '', descAr: '' };

  return (
    <div className="ref-fade-in">

      {/* Page Header */}
      <div className="ref-card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: info.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {info.icon}
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
            {lang === 'ar' ? info.nameAr : info.nameEn}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {lang === 'ar' ? info.descAr : info.descEn}
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="ref-card" style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: '#fef3c7', border: '2px solid #fde68a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Construction size={32} color="#d97706" />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          {lang === 'ar' ? 'هذا المشروع جاهز للبيانات' : 'This project is ready for data'}
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
          {lang === 'ar'
            ? 'يمكن للمشرف رفع ملفات Excel لهذا المشروع من صفحة الرفع'
            : 'An admin can upload Excel files for this project from the Upload page.'}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="ref-badge ref-badge-yellow">
            {lang === 'ar' ? 'قيد التطوير' : 'In Development'}
          </span>
          <span className="ref-badge ref-badge-blue">
            {lang === 'ar' ? 'قريباً' : 'Coming Soon'}
          </span>
        </div>
      </div>

      {/* Admin Dashboard Controls */}
      <DashboardControls projectId={projectId} />
    </div>
  );
}
