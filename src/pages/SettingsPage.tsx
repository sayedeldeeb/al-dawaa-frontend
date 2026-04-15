import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import {
  Globe, Type, SlidersHorizontal, Users, Plus, Edit2, Trash2, Eye, EyeOff,
  RefreshCw, X, Check, LayoutDashboard, BarChart2, Target, Filter,
  FolderOpen, FileSpreadsheet, FileUp, History, Wrench, ChevronRight,
  GripVertical, Save, RotateCcw, Layers
} from 'lucide-react';

type Tab = 'language' | 'font' | 'filters' | 'users' | 'control';
type ControlSection =
  | 'dashboard-builder'
  | 'chart-builder'
  | 'kpi-builder'
  | 'filter-builder'
  | 'project-manager'
  | 'report-config'
  | 'upload-template'
  | 'version-control';

const FONTS = [
  { id: 'default', label: 'Default (Noto Sans)', labelAr: 'افتراضي', family: "'Noto Sans', 'Noto Kufi Arabic', sans-serif" },
  { id: 'large',   label: 'Large (Noto Sans)',   labelAr: 'كبير',     family: "'Noto Sans', sans-serif",     scale: '1.1' },
  { id: 'small',   label: 'Compact',             labelAr: 'مدمج',     family: "'Noto Sans', sans-serif",     scale: '0.95' },
  { id: 'serif',   label: 'Serif',               labelAr: 'مع عروق',  family: "'Georgia', 'Times New Roman', serif" },
];

const ROLE_COLORS: Record<string, string> = { admin: '#002544', manager: '#3b82f6', viewer: '#6b7280' };

const CHART_TYPES = ['bar', 'line', 'area', 'pie', 'donut', 'composed'];
const PROJECTS_LIST = [
  'medical-devices', 'yusur', 'churned-customer', 'vip-files', 'high-value', 'p2p', 'pill-pack'
];

// ── localStorage helpers ─────────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── User Modal ──────────────────────────────────────────────────────────
function UserModal({ user: editUser, onClose, onSave, lang }: { user: any | null; onClose: () => void; onSave: (data: any) => void; lang: string }) {
  const [form, setForm] = useState({
    fullName: editUser?.fullName || '',
    fullNameAr: editUser?.fullNameAr || '',
    username: editUser?.username || '',
    password: '',
    role: editUser?.role || 'viewer',
    active: editUser?.active !== false,
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.fullName || !form.username) return;
    setSaving(true);
    const data: any = { ...form };
    if (!form.password) delete data.password;
    await onSave(data);
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{editUser ? (lang === 'ar' ? 'تعديل مستخدم' : 'Edit User') : (lang === 'ar' ? 'إضافة مستخدم' : 'Add User')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang === 'ar' ? 'الاسم (عربي)' : 'Full Name (Arabic)'}</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.fullNameAr} onChange={e => set('fullNameAr', e.target.value)} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Full Name (English)'}</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.username} onChange={e => set('username', e.target.value)} disabled={!!editUser} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{editUser ? (lang === 'ar' ? 'كلمة مرور جديدة (اتركه فارغاً)' : 'New Password (leave blank to keep)') : (lang === 'ar' ? 'كلمة المرور' : 'Password')}</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pe-10 focus:outline-none focus:border-blue-400" value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" className="absolute inset-y-0 end-2 flex items-center text-gray-400" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang === 'ar' ? 'الدور' : 'Role'}</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="admin">{lang === 'ar' ? 'مدير' : 'Admin'}</option>
                <option value="manager">{lang === 'ar' ? 'مشرف' : 'Manager'}</option>
                <option value="viewer">{lang === 'ar' ? 'مشاهد' : 'Viewer'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
                <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="inactive">{lang === 'ar' ? 'معطل' : 'Inactive'}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={saving || !form.fullName || !form.username} className="btn-primary flex items-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {lang === 'ar' ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ─────────────────────────────────────────────────
function ResetPasswordModal({ username, onClose, onReset, lang }: { username: string; onClose: () => void; onReset: (pwd: string) => void; lang: string }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-500 mb-3">{lang === 'ar' ? `تعيين كلمة مرور جديدة للمستخدم: ${username}` : `Set new password for: ${username}`}</p>
          <div className="relative">
            <input type={show ? 'text' : 'password'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pe-10 focus:outline-none focus:border-blue-400" placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New password'} value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="absolute inset-y-0 end-2 flex items-center text-gray-400" onClick={() => setShow(s => !s)}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={async () => { setSaving(true); await onReset(password); setSaving(false); }} disabled={!password || saving} className="btn-primary flex items-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {lang === 'ar' ? 'تعيين' : 'Set'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Platform Control Panel ───────────────────────────────────────────────
interface ControlPanelProps { lang: string; showToast: (m: string) => void; }

function ControlPanel({ lang, showToast }: ControlPanelProps) {
  const [section, setSection] = useState<ControlSection>('dashboard-builder');

  const sections: { id: ControlSection; labelEn: string; labelAr: string; icon: any; color: string }[] = [
    { id: 'dashboard-builder', labelEn: 'Dashboard Builder',    labelAr: 'بناء لوحة التحكم',  icon: LayoutDashboard, color: '#002544' },
    { id: 'chart-builder',     labelEn: 'Chart Builder',        labelAr: 'بناء المخططات',      icon: BarChart2,       color: '#3b82f6' },
    { id: 'kpi-builder',       labelEn: 'KPI Builder',          labelAr: 'بناء مؤشرات الأداء', icon: Target,          color: '#FFC200' },
    { id: 'filter-builder',    labelEn: 'Filter Builder',       labelAr: 'بناء الفلاتر',        icon: Filter,          color: '#8b5cf6' },
    { id: 'project-manager',   labelEn: 'Project Management',   labelAr: 'إدارة المشاريع',      icon: FolderOpen,      color: '#06b6d4' },
    { id: 'report-config',     labelEn: 'Report Configuration', labelAr: 'إعداد التقارير',      icon: FileSpreadsheet, color: '#f97316' },
    { id: 'upload-template',   labelEn: 'Upload Template',      labelAr: 'قالب الرفع',          icon: FileUp,          color: '#10b981' },
    { id: 'version-control',   labelEn: 'Version Control',      labelAr: 'التحكم بالإصدارات',  icon: History,         color: '#ef4444' },
  ];

  return (
    <div className="flex gap-4 min-h-[520px]">
      {/* Sub-nav */}
      <div className="w-52 flex-shrink-0 space-y-1">
        {sections.map(s => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              style={active ? { background: s.color } : {}}
            >
              <Icon size={15} />
              <span className="truncate">{lang === 'ar' ? s.labelAr : s.labelEn}</span>
              {active && <ChevronRight size={12} className="ms-auto opacity-70" />}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        {section === 'dashboard-builder'  && <DashboardBuilder lang={lang} showToast={showToast} />}
        {section === 'chart-builder'      && <ChartBuilderSection lang={lang} showToast={showToast} />}
        {section === 'kpi-builder'        && <KPIBuilderSection lang={lang} showToast={showToast} />}
        {section === 'filter-builder'     && <FilterBuilderSection lang={lang} showToast={showToast} />}
        {section === 'project-manager'    && <ProjectManagerSection lang={lang} showToast={showToast} />}
        {section === 'report-config'      && <ReportConfigSection lang={lang} showToast={showToast} />}
        {section === 'upload-template'    && <UploadTemplateSection lang={lang} showToast={showToast} />}
        {section === 'version-control'    && <VersionControlSection lang={lang} showToast={showToast} />}
      </div>
    </div>
  );
}

// ── Dashboard Builder ────────────────────────────────────────────────────
function DashboardBuilder({ lang, showToast }: ControlPanelProps) {
  const [dashboards, setDashboards] = useState<any[]>(() => loadLS('cp_dashboards', [
    { id: 'd1', name: 'Executive Overview', nameAr: 'نظرة تنفيذية شاملة', project: 'all', layout: '3-col', active: true },
    { id: 'd2', name: 'Medical Devices KPIs', nameAr: 'مؤشرات الأجهزة الطبية', project: 'medical-devices', layout: '2-col', active: true },
    { id: 'd3', name: 'YUSUR Analytics', nameAr: 'تحليلات يسر', project: 'yusur', layout: '2-col', active: false },
  ]));
  const [newName, setNewName] = useState('');
  const [newProject, setNewProject] = useState('all');
  const [newLayout, setNewLayout] = useState('2-col');

  const addDashboard = () => {
    if (!newName.trim()) return;
    const updated = [...dashboards, { id: `d${Date.now()}`, name: newName.trim(), nameAr: newName.trim(), project: newProject, layout: newLayout, active: true }];
    setDashboards(updated);
    saveLS('cp_dashboards', updated);
    setNewName('');
    showToast(lang === 'ar' ? 'تمت إضافة لوحة التحكم' : 'Dashboard added');
  };

  const toggleDashboard = (id: string) => {
    const updated = dashboards.map(d => d.id === id ? { ...d, active: !d.active } : d);
    setDashboards(updated);
    saveLS('cp_dashboards', updated);
  };

  const deleteDashboard = (id: string) => {
    const updated = dashboards.filter(d => d.id !== id);
    setDashboards(updated);
    saveLS('cp_dashboards', updated);
    showToast(lang === 'ar' ? 'تم حذف لوحة التحكم' : 'Dashboard removed');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <LayoutDashboard size={16} style={{ color: '#002544' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'بناء لوحات التحكم' : 'Dashboard Builder'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-5">{lang === 'ar' ? 'أنشئ وادر لوحات تحكم مخصصة لكل مشروع' : 'Create and manage custom dashboards per project'}</p>

      <div className="space-y-2 mb-5">
        {dashboards.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
            <GripVertical size={14} className="text-gray-300 cursor-grab" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{lang === 'ar' ? d.nameAr : d.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{d.project} · {d.layout}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {d.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Off')}
            </span>
            <button onClick={() => toggleDashboard(d.id)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
              {d.active ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => deleteDashboard(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-3">{lang === 'ar' ? 'إضافة لوحة جديدة' : 'Add New Dashboard'}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder={lang === 'ar' ? 'اسم لوحة التحكم...' : 'Dashboard name...'} value={newName} onChange={e => setNewName(e.target.value)} />
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={newProject} onChange={e => setNewProject(e.target.value)}>
            <option value="all">{lang === 'ar' ? 'جميع المشاريع' : 'All Projects'}</option>
            {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={newLayout} onChange={e => setNewLayout(e.target.value)}>
            <option value="1-col">1 Column</option>
            <option value="2-col">2 Columns</option>
            <option value="3-col">3 Columns</option>
            <option value="4-col">4 Columns</option>
          </select>
          <button onClick={addDashboard} className="btn-primary flex items-center justify-center gap-1 text-sm">
            <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chart Builder ────────────────────────────────────────────────────────
function ChartBuilderSection({ lang, showToast }: ControlPanelProps) {
  const [charts, setCharts] = useState<any[]>(() => loadLS('cp_charts', [
    { id: 'c1', title: 'Monthly Trend', project: 'churned-customer', dimension: 'uploadDate', measure: 'count', type: 'area', color: '#002544' },
    { id: 'c2', title: 'By Region',     project: 'yusur',            dimension: 'region',     measure: 'count', type: 'bar',  color: '#FFC200' },
  ]));
  const [form, setForm] = useState({ title: '', project: 'churned-customer', dimension: 'region', measure: 'count', type: 'bar', color: '#002544' });

  const addChart = () => {
    if (!form.title.trim()) return;
    const updated = [...charts, { ...form, id: `c${Date.now()}` }];
    setCharts(updated);
    saveLS('cp_charts', updated);
    setForm({ title: '', project: 'churned-customer', dimension: 'region', measure: 'count', type: 'bar', color: '#002544' });
    showToast(lang === 'ar' ? 'تمت إضافة المخطط' : 'Chart added');
  };

  const deleteChart = (id: string) => {
    const updated = charts.filter(c => c.id !== id);
    setCharts(updated);
    saveLS('cp_charts', updated);
  };

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={16} style={{ color: '#3b82f6' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'بناء المخططات' : 'Chart Builder'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'حدد مصدر البيانات والمقياس والبعد ونوع المخطط' : 'Define data source, measure, dimension and chart type'}</p>

      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {charts.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }}></div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-800 truncate block">{c.title}</span>
              <span className="text-xs text-gray-400">{c.project} · {c.dimension} · {c.type}</span>
            </div>
            <button onClick={() => deleteChart(c.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-600">{lang === 'ar' ? 'مخطط جديد' : 'New Chart'}</p>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          placeholder={lang === 'ar' ? 'عنوان المخطط...' : 'Chart title...'} value={form.title} onChange={e => sf('title', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'المشروع' : 'Project'}</label>
            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.project} onChange={e => sf('project', e.target.value)}>
              {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'نوع المخطط' : 'Chart Type'}</label>
            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.type} onChange={e => sf('type', e.target.value)}>
              {CHART_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'البُعد (المحور X)' : 'Dimension (X-axis)'}</label>
            <input className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="region, senior, date..." value={form.dimension} onChange={e => sf('dimension', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'المقياس (المحور Y)' : 'Measure (Y-axis)'}</label>
            <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.measure} onChange={e => sf('measure', e.target.value)}>
              <option value="count">Count</option>
              <option value="value">Value (SAR)</option>
              <option value="successRate">Success Rate %</option>
              <option value="netValue">Net Value</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'اللون' : 'Color'}</label>
            <input type="color" className="h-8 w-12 rounded-lg border border-gray-200 cursor-pointer" value={form.color} onChange={e => sf('color', e.target.value)} />
          </div>
          <button onClick={addChart} className="btn-primary flex items-center gap-1 text-sm ms-auto">
            <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add Chart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Builder ──────────────────────────────────────────────────────────
function KPIBuilderSection({ lang, showToast }: ControlPanelProps) {
  const [kpis, setKpis] = useState<any[]>(() => loadLS('cp_kpis', [
    { id: 'k1', name: 'Success Rate',    formula: 'invoiced / uploaded * 100', project: 'churned-customer', format: 'percent', color: '#16a34a' },
    { id: 'k2', name: 'Fulfillment Rate', formula: 'fulfilled / allocated * 100', project: 'yusur', format: 'percent', color: '#002544' },
    { id: 'k3', name: 'Net Value',        formula: 'sum(dispensedValue)',         project: 'all', format: 'currency', color: '#FFC200' },
  ]));
  const [form, setForm] = useState({ name: '', formula: '', project: 'churned-customer', format: 'number', color: '#002544' });
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addKPI = () => {
    if (!form.name.trim() || !form.formula.trim()) return;
    const updated = [...kpis, { ...form, id: `k${Date.now()}` }];
    setKpis(updated);
    saveLS('cp_kpis', updated);
    setForm({ name: '', formula: '', project: 'churned-customer', format: 'number', color: '#002544' });
    showToast(lang === 'ar' ? 'تمت إضافة مؤشر الأداء' : 'KPI added');
  };

  const FORMAT_BADGE: Record<string, string> = { number: 'bg-blue-100 text-blue-700', percent: 'bg-green-100 text-green-700', currency: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Target size={16} style={{ color: '#FFC200' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'بناء مؤشرات الأداء' : 'KPI Builder'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'عرّف صيغة حسابية مخصصة لكل مؤشر' : 'Define custom formulas and assign to dashboards'}</p>

      <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
        {kpis.map(k => (
          <div key={k.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: k.color }}></div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 block truncate">{k.name}</span>
              <code className="text-xs text-gray-400 truncate block">{k.formula}</code>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORMAT_BADGE[k.format] || 'bg-gray-100 text-gray-600'}`}>{k.format}</span>
            <button onClick={() => { const u = kpis.filter(x => x.id !== k.id); setKpis(u); saveLS('cp_kpis', u); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-600">{lang === 'ar' ? 'مؤشر جديد' : 'New KPI'}</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder={lang === 'ar' ? 'اسم المؤشر...' : 'KPI name...'} value={form.name} onChange={e => sf('name', e.target.value)} />
          <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.project} onChange={e => sf('project', e.target.value)}>
            <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
            {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
          placeholder="e.g. invoiced / uploaded * 100" value={form.formula} onChange={e => sf('formula', e.target.value)} />
        <div className="flex items-center gap-2">
          <select className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.format} onChange={e => sf('format', e.target.value)}>
            <option value="number">Number</option>
            <option value="percent">Percent %</option>
            <option value="currency">Currency SAR</option>
          </select>
          <input type="color" className="h-8 w-10 rounded-lg border border-gray-200 cursor-pointer" value={form.color} onChange={e => sf('color', e.target.value)} />
          <button onClick={addKPI} className="btn-primary flex items-center gap-1 text-sm">
            <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter Builder ───────────────────────────────────────────────────────
function FilterBuilderSection({ lang, showToast }: ControlPanelProps) {
  const [filterDefs, setFilterDefs] = useState<any[]>(() => loadLS('cp_filters', [
    { id: 'f1', field: 'region',     labelEn: 'Region',     labelAr: 'المنطقة',   type: 'multiselect', projects: ['all'] },
    { id: 'f2', field: 'pharmacy',   labelEn: 'Pharmacy',   labelAr: 'الصيدلية',  type: 'multiselect', projects: ['churned-customer', 'vip-files'] },
    { id: 'f3', field: 'supervisor', labelEn: 'Supervisor', labelAr: 'المشرف',    type: 'multiselect', projects: ['all'] },
    { id: 'f4', field: 'senior',     labelEn: 'Senior',     labelAr: 'المشرف الأول', type: 'multiselect', projects: ['all'] },
    { id: 'f5', field: 'status',     labelEn: 'Status',     labelAr: 'الحالة',    type: 'multiselect', projects: ['all'] },
    { id: 'f6', field: 'uploadDate', labelEn: 'Date Range', labelAr: 'نطاق التاريخ', type: 'daterange', projects: ['all'] },
  ]));
  const [form, setForm] = useState({ field: '', labelEn: '', labelAr: '', type: 'multiselect', projects: 'all' });
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addFilter = () => {
    if (!form.field.trim()) return;
    const updated = [...filterDefs, { ...form, id: `f${Date.now()}`, projects: [form.projects] }];
    setFilterDefs(updated);
    saveLS('cp_filters', updated);
    setForm({ field: '', labelEn: '', labelAr: '', type: 'multiselect', projects: 'all' });
    showToast(lang === 'ar' ? 'تمت إضافة الفلتر' : 'Filter added');
  };

  const TYPE_LABELS: Record<string, string> = { multiselect: 'Multi-select', daterange: 'Date Range', search: 'Search', select: 'Single Select' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Filter size={16} style={{ color: '#8b5cf6' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'بناء الفلاتر' : 'Filter Builder'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'أضف أو احذف أو عدّل حقول الفلترة لكل مشروع' : 'Add, remove, and configure filter fields per project'}</p>

      <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
        {filterDefs.map(f => (
          <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            <GripVertical size={13} className="text-gray-300 cursor-grab" />
            <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-mono">{f.field}</code>
            <span className="text-gray-700 font-medium flex-1 truncate">{lang === 'ar' ? f.labelAr : f.labelEn}</span>
            <span className="text-xs text-gray-400">{TYPE_LABELS[f.type] || f.type}</span>
            <button onClick={() => { const u = filterDefs.filter(x => x.id !== f.id); setFilterDefs(u); saveLS('cp_filters', u); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-600">{lang === 'ar' ? 'فلتر جديد' : 'New Filter'}</p>
        <div className="grid grid-cols-3 gap-2">
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="field key..." value={form.field} onChange={e => sf('field', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Label EN..." value={form.labelEn} onChange={e => sf('labelEn', e.target.value)} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="التسمية AR..." value={form.labelAr} onChange={e => sf('labelAr', e.target.value)} dir="rtl" />
        </div>
        <div className="flex gap-2">
          <select className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.type} onChange={e => sf('type', e.target.value)}>
            <option value="multiselect">Multi-select</option>
            <option value="select">Single Select</option>
            <option value="daterange">Date Range</option>
            <option value="search">Search Text</option>
          </select>
          <select className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.projects} onChange={e => sf('projects', e.target.value)}>
            <option value="all">All Projects</option>
            {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={addFilter} className="btn-primary flex items-center gap-1 text-sm">
            <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Management ───────────────────────────────────────────────────
function ProjectManagerSection({ lang, showToast }: ControlPanelProps) {
  const [projects, setProjects] = useState<any[]>(() => loadLS('cp_projects', [
    { id: 'medical-devices',  nameEn: 'Medical Devices',   nameAr: 'الأجهزة الطبية',      icon: '🏥', active: true, subprojects: [] },
    { id: 'yusur',            nameEn: 'YUSUR',             nameAr: 'يسر',                  icon: '💊', active: true, subprojects: [] },
    { id: 'churned-customer', nameEn: 'Churned Customer',  nameAr: 'العملاء المتوقفون',     icon: '📋', active: true, subprojects: [] },
    { id: 'vip-files',        nameEn: 'AL-Dawaa Refill',   nameAr: 'إعادة تعبئة الدواء',   icon: '🔄', active: true, subprojects: [] },
    { id: 'high-value',       nameEn: 'High Value',        nameAr: 'القيمة العالية',        icon: '💎', active: true, subprojects: [] },
    { id: 'p2p',              nameEn: 'P2P',               nameAr: 'نقل بين الفروع',        icon: '🔁', active: true, subprojects: [] },
    { id: 'pill-pack',        nameEn: 'Pill Pack',         nameAr: 'الحزمة الدوائية',       icon: '💉', active: true, subprojects: [] },
  ]));
  const [subInput, setSubInput] = useState<Record<string, string>>({});

  const toggleProject = (id: string) => {
    const u = projects.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setProjects(u); saveLS('cp_projects', u);
  };

  const addSubproject = (projectId: string) => {
    const name = subInput[projectId]?.trim();
    if (!name) return;
    const u = projects.map(p => p.id === projectId ? { ...p, subprojects: [...(p.subprojects || []), { id: Date.now(), name }] } : p);
    setProjects(u); saveLS('cp_projects', u);
    setSubInput(prev => ({ ...prev, [projectId]: '' }));
    showToast(lang === 'ar' ? 'تمت إضافة المشروع الفرعي' : 'Subproject added');
  };

  const removeSubproject = (projectId: string, subId: number) => {
    const u = projects.map(p => p.id === projectId ? { ...p, subprojects: p.subprojects.filter((s: any) => s.id !== subId) } : p);
    setProjects(u); saveLS('cp_projects', u);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-h-[520px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <FolderOpen size={16} style={{ color: '#06b6d4' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'إدارة المشاريع' : 'Project Management'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'تفعيل / تعطيل المشاريع وإضافة مشاريع فرعية' : 'Enable/disable projects and manage subprojects'}</p>

      <div className="space-y-3">
        {projects.map(p => (
          <div key={p.id} className={`rounded-xl border p-3 transition-opacity ${p.active ? 'border-gray-100 bg-gray-50' : 'border-dashed border-gray-200 opacity-60'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{lang === 'ar' ? p.nameAr : p.nameEn}</p>
                <p className="text-xs text-gray-400 font-mono">{p.id}</p>
              </div>
              <button onClick={() => toggleProject(p.id)} className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${p.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                {p.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Off')}
              </button>
            </div>
            {/* Subprojects */}
            {(p.subprojects || []).length > 0 && (
              <div className="ms-8 mb-2 space-y-1">
                {p.subprojects.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <Layers size={10} className="text-gray-300" />
                    <span>{s.name}</span>
                    <button onClick={() => removeSubproject(p.id, s.id)} className="ms-auto text-gray-300 hover:text-red-500"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 ms-8">
              <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                placeholder={lang === 'ar' ? 'اسم مشروع فرعي...' : 'Add subproject...'}
                value={subInput[p.id] || ''} onChange={e => setSubInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addSubproject(p.id); }} />
              <button onClick={() => addSubproject(p.id)} className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                <Plus size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Report Configuration ─────────────────────────────────────────────────
function ReportConfigSection({ lang, showToast }: ControlPanelProps) {
  const [configs, setConfigs] = useState<any[]>(() => loadLS('cp_report_configs', [
    { id: 'rc1', project: 'churned-customer', reportName: 'Hybrid Pharmacy Report', columns: ['pharmacy', 'uploaded', 'invoiced', 'pending', 'successRate', 'netValue'], groupBy: 'pharmacy' },
    { id: 'rc2', project: 'yusur', reportName: 'Orders Summary', columns: ['pharmacy', 'totalOrders', 'fulfilled', 'fulfillmentRate'], groupBy: 'pharmacy' },
  ]));
  const [selected, setSelected] = useState(configs[0]?.id || '');
  const current = configs.find(c => c.id === selected);
  const [newCol, setNewCol] = useState('');

  const addCol = () => {
    if (!newCol.trim() || !current) return;
    const u = configs.map(c => c.id === selected ? { ...c, columns: [...c.columns, newCol.trim()] } : c);
    setConfigs(u); saveLS('cp_report_configs', u);
    setNewCol('');
    showToast(lang === 'ar' ? 'تمت إضافة العمود' : 'Column added');
  };
  const removeCol = (col: string) => {
    const u = configs.map(c => c.id === selected ? { ...c, columns: c.columns.filter((x: string) => x !== col) } : c);
    setConfigs(u); saveLS('cp_report_configs', u);
  };
  const addConfig = () => {
    const id = `rc${Date.now()}`;
    const u = [...configs, { id, project: 'churned-customer', reportName: 'New Report', columns: ['pharmacy', 'uploaded', 'invoiced'], groupBy: 'pharmacy' }];
    setConfigs(u); saveLS('cp_report_configs', u);
    setSelected(id);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileSpreadsheet size={16} style={{ color: '#f97316' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'إعداد التقارير' : 'Report Configuration'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'حدد أعمدة التقارير ومصادر البيانات' : 'Define report columns, groupings, and data mappings'}</p>

      <div className="flex items-center gap-2 mb-4">
        <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={selected} onChange={e => setSelected(e.target.value)}>
          {configs.map(c => <option key={c.id} value={c.id}>{c.reportName}</option>)}
        </select>
        <button onClick={addConfig} className="btn-ghost flex items-center gap-1 text-sm"><Plus size={13} /> {lang === 'ar' ? 'جديد' : 'New'}</button>
      </div>

      {current && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'اسم التقرير' : 'Report Name'}</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                value={current.reportName}
                onChange={e => { const u = configs.map(c => c.id === selected ? { ...c, reportName: e.target.value } : c); setConfigs(u); saveLS('cp_report_configs', u); }} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{lang === 'ar' ? 'المشروع' : 'Project'}</label>
              <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400"
                value={current.project}
                onChange={e => { const u = configs.map(c => c.id === selected ? { ...c, project: e.target.value } : c); setConfigs(u); saveLS('cp_report_configs', u); }}>
                {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-600 mb-2">{lang === 'ar' ? 'أعمدة التقرير' : 'Report Columns'}</p>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
            {current.columns.map((col: string) => (
              <span key={col} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {col}
                <button onClick={() => removeCol(col)} className="hover:text-red-500"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder={lang === 'ar' ? 'اسم العمود...' : 'Column name...'} value={newCol} onChange={e => setNewCol(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCol(); }} />
            <button onClick={addCol} className="btn-primary flex items-center gap-1 text-sm">
              <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Upload Template Builder ──────────────────────────────────────────────
function UploadTemplateSection({ lang, showToast }: ControlPanelProps) {
  const [templates, setTemplates] = useState<any[]>(() => loadLS('cp_upload_templates', [
    { id: 'ut1', project: 'churned-customer', requiredCols: ['rxNumber', 'pharmacy', 'region', 'district', 'supervisor', 'senior', 'status', 'totalValue', 'uploadDate'], optionalCols: ['dispensedValue', 'notes'], dateFormat: 'YYYY-MM-DD' },
    { id: 'ut2', project: 'yusur', requiredCols: ['orderNumber', 'pharmacy', 'region', 'orderDate', 'status', 'value'], optionalCols: ['failureReason', 'invoiceNumber'], dateFormat: 'YYYY-MM-DD' },
    { id: 'ut3', project: 'medical-devices', requiredCols: ['rxNumber', 'deviceType', 'category', 'region', 'status', 'value', 'prescriptionDate'], optionalCols: [], dateFormat: 'YYYY-MM-DD' },
  ]));
  const [selectedId, setSelectedId] = useState(templates[0]?.id || '');
  const current = templates.find(t => t.id === selectedId);
  const [newCol, setNewCol] = useState('');
  const [colType, setColType] = useState<'required' | 'optional'>('required');

  const addCol = () => {
    if (!newCol.trim() || !current) return;
    const field = colType === 'required' ? 'requiredCols' : 'optionalCols';
    const u = templates.map(t => t.id === selectedId ? { ...t, [field]: [...t[field], newCol.trim()] } : t);
    setTemplates(u); saveLS('cp_upload_templates', u);
    setNewCol('');
    showToast(lang === 'ar' ? 'تمت الإضافة' : 'Column added');
  };
  const removeCol = (col: string, field: 'requiredCols' | 'optionalCols') => {
    const u = templates.map(t => t.id === selectedId ? { ...t, [field]: t[field].filter((c: string) => c !== col) } : t);
    setTemplates(u); saveLS('cp_upload_templates', u);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileUp size={16} style={{ color: '#10b981' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'قالب الرفع' : 'Upload Template Builder'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'حدد الأعمدة المطلوبة وتنسيق التاريخ لكل مشروع' : 'Define required columns and date format per project'}</p>

      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
        {templates.map(t => <option key={t.id} value={t.id}>{t.project}</option>)}
      </select>

      {current && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-red-600">{lang === 'ar' ? '🔴 أعمدة مطلوبة' : '🔴 Required Columns'}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <label>{lang === 'ar' ? 'تنسيق التاريخ:' : 'Date format:'}</label>
                <input className="border border-gray-200 rounded px-2 py-0.5 text-xs w-28 focus:outline-none" value={current.dateFormat}
                  onChange={e => { const u = templates.map(t => t.id === selectedId ? { ...t, dateFormat: e.target.value } : t); setTemplates(u); saveLS('cp_upload_templates', u); }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {current.requiredCols.map((col: string) => (
                <span key={col} className="flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200 font-mono">
                  {col}<button onClick={() => removeCol(col, 'requiredCols')} className="hover:text-red-900"><X size={9} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{lang === 'ar' ? '⚪ أعمدة اختيارية' : '⚪ Optional Columns'}</p>
            <div className="flex flex-wrap gap-1.5">
              {current.optionalCols.map((col: string) => (
                <span key={col} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-mono">
                  {col}<button onClick={() => removeCol(col, 'optionalCols')} className="hover:text-red-500"><X size={9} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" value={colType} onChange={e => setColType(e.target.value as any)}>
              <option value="required">{lang === 'ar' ? 'مطلوب' : 'Required'}</option>
              <option value="optional">{lang === 'ar' ? 'اختياري' : 'Optional'}</option>
            </select>
            <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
              placeholder="columnName..." value={newCol} onChange={e => setNewCol(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCol(); }} />
            <button onClick={addCol} className="btn-primary flex items-center gap-1 text-sm">
              <Plus size={13} /> {lang === 'ar' ? 'إضافة' : 'Add'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Version Control ──────────────────────────────────────────────────────
function VersionControlSection({ lang, showToast }: ControlPanelProps) {
  const [versions, setVersions] = useState<any[]>(() => loadLS('cp_versions', []));
  const [restoring, setRestoring] = useState<string | null>(null);

  const createSnapshot = () => {
    const snap = {
      id: `v${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: `Snapshot ${new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}`,
      data: {
        dashboards: loadLS('cp_dashboards', []),
        charts: loadLS('cp_charts', []),
        kpis: loadLS('cp_kpis', []),
        filters: loadLS('cp_filters', []),
        projects: loadLS('cp_projects', []),
        reportConfigs: loadLS('cp_report_configs', []),
        uploadTemplates: loadLS('cp_upload_templates', []),
      }
    };
    const updated = [snap, ...versions].slice(0, 10); // keep latest 10
    setVersions(updated);
    saveLS('cp_versions', updated);
    showToast(lang === 'ar' ? '✅ تم حفظ نسخة احتياطية' : '✅ Snapshot saved');
  };

  const restoreVersion = (v: any) => {
    setRestoring(v.id);
    try {
      saveLS('cp_dashboards', v.data.dashboards || []);
      saveLS('cp_charts', v.data.charts || []);
      saveLS('cp_kpis', v.data.kpis || []);
      saveLS('cp_filters', v.data.filters || []);
      saveLS('cp_projects', v.data.projects || []);
      saveLS('cp_report_configs', v.data.reportConfigs || []);
      saveLS('cp_upload_templates', v.data.uploadTemplates || []);
      showToast(lang === 'ar' ? '✅ تمت استعادة الإصدار' : '✅ Version restored — reload to apply');
    } finally { setRestoring(null); }
  };

  const deleteVersion = (id: string) => {
    const u = versions.filter(v => v.id !== id);
    setVersions(u); saveLS('cp_versions', u);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <History size={16} style={{ color: '#ef4444' }} />
        <h3 className="font-bold text-gray-800">{lang === 'ar' ? 'التحكم بالإصدارات' : 'Version Control'}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{lang === 'ar' ? 'احفظ الإعدادات الحالية كنقطة استعادة أو أعد تطبيق إصدار سابق' : 'Save current config as a restore point or roll back to a previous version'}</p>

      <button onClick={createSnapshot} className="btn-primary flex items-center gap-2 mb-5">
        <Save size={14} /> {lang === 'ar' ? 'حفظ نسخة احتياطية الآن' : 'Save Snapshot Now'}
      </button>

      {versions.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <History size={32} className="mx-auto mb-2 opacity-30" />
          {lang === 'ar' ? 'لا توجد نسخ محفوظة بعد' : 'No snapshots yet'}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {versions.map((v, idx) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {versions.length - idx}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{v.label}</p>
                <p className="text-xs text-gray-400">{new Date(v.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
              </div>
              {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{lang === 'ar' ? 'الأحدث' : 'Latest'}</span>}
              <button onClick={() => restoreVersion(v)} disabled={restoring === v.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors">
                {restoring === v.id ? <RefreshCw size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                {lang === 'ar' ? 'استعادة' : 'Restore'}
              </button>
              <button onClick={() => deleteVersion(v.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ───────────────────────────────────────────────────
export default function SettingsPage() {
  const { lang, toggleLang, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('language');
  const [selectedFont, setSelectedFont] = useState('default');
  const [fontSaved, setFontSaved] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['region', 'pharmacy', 'supervisor', 'senior', 'district', 'status']);
  const [newFilter, setNewFilter] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const loadUsers = async () => {
    setUserLoading(true);
    try { const r = await adminApi.users(); setUsers(r.data || []); } finally { setUserLoading(false); }
  };

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  const handleFontSave = () => {
    const f = FONTS.find(f => f.id === selectedFont);
    if (f) {
      document.documentElement.style.setProperty('--font-family', f.family);
      if (f.scale) document.documentElement.style.fontSize = `${parseFloat(f.scale) * 16}px`;
      else document.documentElement.style.fontSize = '16px';
    }
    setFontSaved(true);
    setTimeout(() => setFontSaved(false), 2000);
    showToast(lang === 'ar' ? 'تم حفظ إعدادات الخط' : 'Font settings saved');
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, data);
        showToast(lang === 'ar' ? 'تم تحديث المستخدم' : 'User updated');
      } else {
        await adminApi.createUser(data);
        showToast(lang === 'ar' ? 'تمت إضافة المستخدم' : 'User added');
      }
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Error');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(lang === 'ar' ? `هل تريد حذف المستخدم "${u.username}"؟` : `Delete user "${u.username}"?`)) return;
    await adminApi.deleteUser(u.id);
    showToast(lang === 'ar' ? 'تم حذف المستخدم' : 'User deleted');
    loadUsers();
  };

  const handleToggleActive = async (u: any) => {
    await adminApi.updateUser(u.id, { active: !u.active });
    showToast(u.active ? (lang === 'ar' ? 'تم تعطيل المستخدم' : 'User disabled') : (lang === 'ar' ? 'تم تفعيل المستخدم' : 'User enabled'));
    loadUsers();
  };

  const handleResetPassword = async (pwd: string) => {
    if (!resetTarget) return;
    const u = users.find(u => u.username === resetTarget);
    if (!u) return;
    await adminApi.updateUser(u.id, { password: pwd });
    showToast(lang === 'ar' ? 'تم تعيين كلمة المرور الجديدة' : 'Password reset successfully');
    setResetTarget(null);
  };

  const tabs: { id: Tab; label: string; labelAr: string; icon: any }[] = [
    { id: 'language', label: 'Language',       labelAr: 'اللغة',              icon: Globe },
    { id: 'font',     label: 'Font',            labelAr: 'الخط',               icon: Type },
    { id: 'filters',  label: 'Filters',         labelAr: 'الفلاتر',            icon: SlidersHorizontal },
    ...(user?.role === 'admin' ? [{ id: 'users' as Tab, label: 'User Management', labelAr: 'إدارة المستخدمين', icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ id: 'control' as Tab, label: 'Control Panel', labelAr: 'لوحة التحكم',         icon: Wrench }] : []),
  ];

  return (
    <div className="p-6 fade-in max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 end-4 z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in">
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#002544' }}>{lang === 'ar' ? 'الإعدادات' : 'Settings'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{lang === 'ar' ? 'تخصيص المنصة وإدارة المستخدمين والإعدادات المتقدمة' : 'Customize the platform, manage users, and configure advanced settings'}</p>
      </div>

      <div className="flex gap-6">
        {/* Side tabs */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isControl = tab.id === 'control';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                  style={activeTab === tab.id ? { background: isControl ? '#7c3aed' : '#002544' } : {}}
                >
                  <Icon size={16} />
                  {lang === 'ar' ? tab.labelAr : tab.label}
                  {isControl && <span className="ms-auto text-xs px-1.5 py-0.5 rounded-md font-bold" style={{ background: activeTab === 'control' ? 'rgba(255,255,255,0.2)' : '#f3f4f6', color: activeTab === 'control' ? '#fff' : '#7c3aed' }}>NEW</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* ── Language ── */}
          {activeTab === 'language' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-1">{lang === 'ar' ? 'اللغة والاتجاه' : 'Language & Direction'}</h2>
              <p className="text-gray-500 text-sm mb-6">{lang === 'ar' ? 'تغيير لغة المنصة بين العربية والإنجليزية' : 'Switch platform language between Arabic and English'}</p>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => lang !== 'ar' && toggleLang()} className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${lang === 'ar' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-3xl mb-2">🇸🇦</div>
                  <h3 className="font-bold text-gray-800 mb-0.5">العربية</h3>
                  <p className="text-xs text-gray-500">RTL — من اليمين إلى اليسار</p>
                  {lang === 'ar' && <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full text-yellow-800 bg-yellow-200">✓ نشط</span>}
                </div>
                <div onClick={() => lang !== 'en' && toggleLang()} className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${lang === 'en' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-3xl mb-2">🇬🇧</div>
                  <h3 className="font-bold text-gray-800 mb-0.5">English</h3>
                  <p className="text-xs text-gray-500">LTR — Left to Right</p>
                  {lang === 'en' && <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full text-yellow-800 bg-yellow-200">✓ Active</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── Font ── */}
          {activeTab === 'font' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-1">{lang === 'ar' ? 'إعدادات الخط' : 'Font Settings'}</h2>
              <p className="text-gray-500 text-sm mb-6">{lang === 'ar' ? 'اختر نمط الخط المناسب' : 'Select your preferred font style'}</p>
              <div className="space-y-3 mb-6">
                {FONTS.map(f => (
                  <div key={f.id} onClick={() => setSelectedFont(f.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedFont === f.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFont === f.id ? 'border-yellow-500 bg-yellow-400' : 'border-gray-300'}`}>
                      {selectedFont === f.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: f.family }}>{lang === 'ar' ? f.labelAr : f.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: f.family }}>
                        {lang === 'ar' ? 'نموذج: هذا مثال على الخط المحدد' : 'Sample: The quick brown fox jumps over the lazy dog'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleFontSave} className="btn-primary flex items-center gap-2">
                {fontSaved ? <Check size={14} /> : null}
                {lang === 'ar' ? 'حفظ إعدادات الخط' : 'Save Font Settings'}
              </button>
            </div>
          )}

          {/* ── Filters ── */}
          {activeTab === 'filters' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-1">{lang === 'ar' ? 'إدارة الفلاتر' : 'Manage Filters'}</h2>
              <p className="text-gray-500 text-sm mb-6">{lang === 'ar' ? 'تخصيص حقول الفلترة في لوحات التحليل' : 'Customize filter fields shown in dashboards'}</p>
              <div className="space-y-2 mb-5">
                {activeFilters.map(f => (
                  <div key={f} className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-700 capitalize">{f}</span>
                    <button onClick={() => setActiveFilters(prev => prev.filter(x => x !== f))} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder={lang === 'ar' ? 'اسم الفلتر الجديد...' : 'New filter field name...'}
                  value={newFilter} onChange={e => setNewFilter(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newFilter.trim()) { setActiveFilters(f => [...f, newFilter.trim()]); setNewFilter(''); } }} />
                <button className="btn-primary flex items-center gap-1" onClick={() => { if (newFilter.trim()) { setActiveFilters(f => [...f, newFilter.trim()]); setNewFilter(''); } }}>
                  <Plus size={14} /> {lang === 'ar' ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800">{lang === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
                <button className="btn-primary flex items-center gap-2" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                  <Plus size={14} /> {lang === 'ar' ? 'مستخدم جديد' : 'New User'}
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-5">{lang === 'ar' ? 'إدارة حسابات المستخدمين وصلاحياتهم' : 'Manage user accounts and permissions'}</p>
              {userLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse"></div>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {[lang === 'ar' ? 'الاسم' : 'Name', lang === 'ar' ? 'المستخدم' : 'Username', lang === 'ar' ? 'الدور' : 'Role', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'الإجراءات' : 'Actions'].map(h => (
                          <th key={h} className="text-start text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pe-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(u => (
                        <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                          <td className="py-3 pe-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: ROLE_COLORS[u.role] || '#6b7280' }}>
                                {(u.fullName || u.username)?.[0]?.toUpperCase()}
                              </div>
                              <p className="font-medium text-gray-800 text-xs">{lang === 'ar' ? (u.fullNameAr || u.fullName) : u.fullName}</p>
                            </div>
                          </td>
                          <td className="py-3 pe-4 text-gray-600 text-xs font-mono">{u.username}</td>
                          <td className="py-3 pe-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white capitalize" style={{ background: ROLE_COLORS[u.role] || '#6b7280' }}>{u.role}</span>
                          </td>
                          <td className="py-3 pe-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {u.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <button title={lang === 'ar' ? 'تعديل' : 'Edit'} onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={13} /></button>
                              <button title={lang === 'ar' ? (u.active ? 'تعطيل' : 'تفعيل') : (u.active ? 'Disable' : 'Enable')} onClick={() => handleToggleActive(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors">
                                {u.active ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                              <button title={lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'} onClick={() => setResetTarget(u.username)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"><RefreshCw size={13} /></button>
                              <button title={lang === 'ar' ? 'حذف' : 'Delete'} onClick={() => handleDeleteUser(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Platform Control Panel ── */}
          {activeTab === 'control' && user?.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-1">
                <Wrench size={18} style={{ color: '#7c3aed' }} />
                <h2 className="font-bold text-gray-800">{lang === 'ar' ? 'لوحة التحكم المتقدمة' : 'Platform Control Panel'}</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Admin Only</span>
              </div>
              <p className="text-gray-500 text-sm mb-5">{lang === 'ar' ? 'أدوات متقدمة لبناء لوحات التحكم والمخططات ومؤشرات الأداء والفلاتر وإدارة الإصدارات' : 'Advanced tools to build dashboards, charts, KPIs, filters, manage projects, reports, upload templates, and control versions'}</p>
              <ControlPanel lang={lang} showToast={showToast} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserModal && (
        <UserModal user={editingUser} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={handleSaveUser} lang={lang} />
      )}
      {resetTarget && (
        <ResetPasswordModal username={resetTarget} onClose={() => setResetTarget(null)} onReset={handleResetPassword} lang={lang} />
      )}
    </div>
  );
}
