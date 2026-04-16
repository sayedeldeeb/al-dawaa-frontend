/**
 * TemplateEditorModal.tsx
 * ═══════════════════════
 * Admin-only modal for customising the column template per project.
 * Changes are saved to localStorage and persist across sessions.
 */
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, RotateCcw, GripVertical } from 'lucide-react';
import {
  ProjectTemplate, TemplateField, getTemplate, saveTemplate, resetTemplate,
} from '../../config/projectTemplates';
import { useAuthStore } from '../../store/authStore';

interface Props {
  projectId: string;
  projectNameEn: string;
  projectNameAr: string;
  onClose: () => void;
}

const TYPES = ['text', 'number', 'date', 'phone'] as const;
const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  text:   { en: 'Text',   ar: 'نص' },
  number: { en: 'Number', ar: 'رقم' },
  date:   { en: 'Date',   ar: 'تاريخ' },
  phone:  { en: 'Phone',  ar: 'جوال' },
};

const TYPE_COLOR: Record<string, string> = {
  text: '#3b82f6', number: '#10b981', date: '#f59e0b', phone: '#8b5cf6',
};

function newField(): TemplateField {
  return {
    key:       `field_${Date.now()}`,
    labelEn:   '',
    labelAr:   '',
    type:      'text',
    required:  false,
    aliases:   [],
  };
}

export default function TemplateEditorModal({ projectId, projectNameEn, projectNameAr, onClose }: Props) {
  const { lang } = useAuthStore();
  const isAr = lang === 'ar';

  const [fields, setFields] = useState<TemplateField[]>(() => getTemplate(projectId).fields);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const update = (i: number, patch: Partial<TemplateField>) =>
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  const remove = (i: number) =>
    setFields(prev => prev.filter((_, idx) => idx !== i));

  const add = () =>
    setFields(prev => [...prev, newField()]);

  const handleSave = () => {
    const template: ProjectTemplate = {
      projectId,
      nameEn: projectNameEn,
      nameAr: projectNameAr,
      fields: fields.filter(f => f.key && f.labelEn),
    };
    saveTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (!confirm(isAr
      ? 'هل تريد إعادة ضبط القالب للإعدادات الافتراضية؟'
      : 'Reset template to default settings?')) return;
    resetTemplate(projectId);
    setFields(getTemplate(projectId).fields);
  };

  /* Drag reorder */
  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx == null || dragIdx === i) return;
    setFields(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(i, 0, item);
      return arr;
    });
    setDragIdx(i);
  };
  const onDragEnd = () => setDragIdx(null);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={16} color="#3b82f6" />
              {isAr ? `محرر القالب — ${projectNameAr}` : `Template Editor — ${projectNameEn}`}
            </h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {isAr ? 'خصص الأعمدة المتوقعة لهذا المشروع' : 'Customize expected columns for this project'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Column headers */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '24px 1fr 1fr 90px 80px 36px', gap: 8, flexShrink: 0 }}>
          {['', isAr ? 'اسم الحقل (EN)' : 'Field Name (EN)', isAr ? 'اسم الحقل (AR)' : 'Field Name (AR)', isAr ? 'النوع' : 'Type', isAr ? 'مطلوب' : 'Required', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {/* Fields list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {fields.map((f, i) => (
            <div
              key={f.key}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 1fr 90px 80px 36px', gap: 8, alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid #f3f4f6',
                opacity: dragIdx === i ? 0.5 : 1,
              }}
            >
              {/* Drag handle */}
              <div style={{ cursor: 'grab', color: '#d1d5db', display: 'flex', justifyContent: 'center' }}>
                <GripVertical size={14} />
              </div>

              {/* labelEn */}
              <input
                value={f.labelEn}
                onChange={e => update(i, { labelEn: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || f.key })}
                placeholder="e.g. Mobile"
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, color: '#374151', outline: 'none' }}
              />

              {/* labelAr */}
              <input
                value={f.labelAr}
                onChange={e => update(i, { labelAr: e.target.value })}
                placeholder="مثل: جوال"
                dir="rtl"
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, color: '#374151', outline: 'none', textAlign: 'right' }}
              />

              {/* Type */}
              <select
                value={f.type}
                onChange={e => update(i, { type: e.target.value as any })}
                style={{
                  padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${TYPE_COLOR[f.type]}40`,
                  background: TYPE_COLOR[f.type] + '12',
                  color: TYPE_COLOR[f.type],
                }}
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{isAr ? TYPE_LABELS[t].ar : TYPE_LABELS[t].en}</option>
                ))}
              </select>

              {/* Required toggle */}
              <button
                onClick={() => update(i, { required: !f.required })}
                style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: f.required ? '#fef2f2' : '#f3f4f6',
                  color: f.required ? '#dc2626' : '#9ca3af',
                }}
              >
                {f.required ? (isAr ? 'مطلوب' : 'Required') : (isAr ? 'اختياري' : 'Optional')}
              </button>

              {/* Remove */}
              <button
                onClick={() => remove(i)}
                style={{ padding: 6, borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add field button */}
          <button
            onClick={add}
            style={{
              marginTop: 12, width: '100%', padding: '9px', borderRadius: 8,
              border: '1.5px dashed #d1d5db', background: '#fafafa',
              fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={14} />
            {isAr ? 'إضافة حقل جديد' : 'Add New Field'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa' }}>
          <button
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}
          >
            <RotateCcw size={13} />
            {isAr ? 'إعادة ضبط' : 'Reset to Default'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: saved ? '#16a34a' : '#3b82f6',
                fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.2s',
              }}
            >
              {saved ? '✓' : <Save size={13} />}
              {saved ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ القالب' : 'Save Template')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
