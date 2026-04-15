import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';
import { UserPlus, Edit2, UserX } from 'lucide-react';

export default function UsersPage() {
  const { lang, t } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', fullNameAr: '', role: 'viewer', email: '' });

  const load = () => adminApi.users().then(r => { setUsers(r.data || []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await adminApi.updateUser(editing.id, form);
    else await adminApi.createUser(form);
    setShowModal(false); setEditing(null); setForm({ username: '', password: '', fullName: '', fullNameAr: '', role: 'viewer', email: '' });
    load();
  };

  const openEdit = (u: any) => { setEditing(u); setForm({ ...u, password: '' }); setShowModal(true); };
  const deactivate = async (id: string) => { if (confirm(lang === 'ar' ? 'تعطيل المستخدم?' : 'Deactivate user?')) { await adminApi.deactivateUser(id); load(); } };

  const ROLE_COLORS: Record<string, string> = { admin: 'badge-red', manager: 'badge-blue', viewer: 'badge-gray' };

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#002544' }}>{lang === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} {lang === 'ar' ? 'مستخدم مسجل' : 'registered users'}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <UserPlus size={14} /> {t.addUser}
        </button>
      </div>

      <div className="chart-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                <th>{t.email}</th>
                <th>{t.role}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#002544' }}>
                        {u.fullName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.fullName}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">{u.email}</td>
                  <td><span className={ROLE_COLORS[u.role] || 'badge-gray'}>{u.role}</span></td>
                  <td><span className={u.isActive ? 'badge-green' : 'badge-gray'}>{u.isActive ? t.active : t.inactive}</span></td>
                  <td className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="text-blue-500 hover:text-blue-700 p-1 rounded"><Edit2 size={14} /></button>
                      {u.isActive && <button onClick={() => deactivate(u.id)} className="text-red-400 hover:text-red-600 p-1 rounded"><UserX size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#002544' }}>{editing ? t.editUser : t.addUser}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {!editing && (
                <div>
                  <label className="filter-label">{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="filter-input mt-1" required />
                </div>
              )}
              <div>
                <label className="filter-label">{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Full Name (English)'}</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="filter-input mt-1" required />
              </div>
              <div>
                <label className="filter-label">{lang === 'ar' ? 'الاسم (عربي)' : 'Full Name (Arabic)'}</label>
                <input value={form.fullNameAr} onChange={e => setForm({ ...form, fullNameAr: e.target.value })} className="filter-input mt-1" />
              </div>
              <div>
                <label className="filter-label">{t.email}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="filter-input mt-1" />
              </div>
              <div>
                <label className="filter-label">{t.role}</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="filter-input mt-1">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="filter-label">{editing ? (lang === 'ar' ? 'كلمة مرور جديدة (اختياري)' : 'New Password (optional)') : t.password}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="filter-input mt-1" required={!editing} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">{t.cancel}</button>
                <button type="submit" className="btn-primary flex-1">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
