/**
 * projectTemplates.ts
 * ════════════════════
 * Defines the expected column structure for each project.
 * Admins can customise these per-project via the Template Editor modal.
 * Templates are saved to localStorage so they persist without a backend change.
 */

export interface TemplateField {
  key: string;          // internal key sent to backend
  labelEn: string;      // English column header
  labelAr: string;      // Arabic column header
  type: 'text' | 'number' | 'date' | 'phone';
  required: boolean;
  aliases: string[];    // common alternative names that auto-map
  description?: string;
}

export interface ProjectTemplate {
  projectId: string;
  nameEn: string;
  nameAr: string;
  fields: TemplateField[];
}

/* ── Default templates ─────────────────────────────────────────────────── */
export const DEFAULT_TEMPLATES: Record<string, ProjectTemplate> = {
  'churned-customer': {
    projectId: 'churned-customer',
    nameEn: 'Churned Customers',
    nameAr: 'العملاء المتوقفون',
    fields: [
      { key: 'mobile',      labelEn: 'Mobile',       labelAr: 'رقم الجوال',    type: 'phone',  required: true,  aliases: ['mobile', 'phone', 'جوال', 'موبايل', 'هاتف'] },
      { key: 'ph_code',     labelEn: 'PH Code',      labelAr: 'كود الصيدلية',  type: 'text',   required: true,  aliases: ['ph_code', 'ph code', 'phcode', 'pharmacy', 'صيدلية'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة', 'المنطقة'] },
      { key: 'senior',      labelEn: 'Senior',       labelAr: 'السينيور',      type: 'text',   required: false, aliases: ['senior', 'سينيور'] },
      { key: 'supervisor',  labelEn: 'Supervisor',   labelAr: 'المشرف',        type: 'text',   required: false, aliases: ['supervisor', 'مشرف', 'المشرف'] },
      { key: 'district',    labelEn: 'District',     labelAr: 'مدير المنطقة',  type: 'text',   required: false, aliases: ['district', 'area manager', 'مدير'] },
      { key: 'uploaded',    labelEn: 'Uploaded',     labelAr: 'الإجمالي',      type: 'number', required: true,  aliases: ['uploaded', 'total', 'الإجمالي', 'مرفوع'] },
      { key: 'dispensed',   labelEn: 'Dispensed',    labelAr: 'المصروف',       type: 'number', required: true,  aliases: ['dispensed', 'صرف', 'المصروف'] },
      { key: 'net_value',   labelEn: 'Net Value',    labelAr: 'القيمة الصافية',type: 'number', required: false, aliases: ['net value', 'net_value', 'value', 'قيمة'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ', 'التاريخ'] },
    ],
  },

  'medical-devices': {
    projectId: 'medical-devices',
    nameEn: 'Medical Devices',
    nameAr: 'الأجهزة الطبية',
    fields: [
      { key: 'device_name', labelEn: 'Device Name',  labelAr: 'اسم الجهاز',   type: 'text',   required: true,  aliases: ['device', 'device name', 'جهاز', 'اسم الجهاز'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'quantity',    labelEn: 'Quantity',     labelAr: 'الكمية',        type: 'number', required: true,  aliases: ['quantity', 'qty', 'كمية', 'الكمية'] },
      { key: 'target',      labelEn: 'Target',       labelAr: 'المستهدف',      type: 'number', required: false, aliases: ['target', 'goal', 'مستهدف'] },
      { key: 'sold',        labelEn: 'Sold',         labelAr: 'المباع',        type: 'number', required: true,  aliases: ['sold', 'sales', 'مباع', 'مبيعات'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'yusur': {
    projectId: 'yusur',
    nameEn: 'YUSUR',
    nameAr: 'مشروع يسر',
    fields: [
      { key: 'mobile',      labelEn: 'Mobile',       labelAr: 'رقم الجوال',    type: 'phone',  required: true,  aliases: ['mobile', 'phone', 'جوال'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'uploaded',    labelEn: 'Uploaded',     labelAr: 'الإجمالي',      type: 'number', required: true,  aliases: ['uploaded', 'الإجمالي'] },
      { key: 'dispensed',   labelEn: 'Dispensed',    labelAr: 'المصروف',       type: 'number', required: true,  aliases: ['dispensed', 'المصروف'] },
      { key: 'supervisor',  labelEn: 'Supervisor',   labelAr: 'المشرف',        type: 'text',   required: false, aliases: ['supervisor', 'مشرف'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'vip-files': {
    projectId: 'vip-files',
    nameEn: 'AL-Dawaa Refill',
    nameAr: 'إعادة تعبئة الدواء',
    fields: [
      { key: 'mobile',      labelEn: 'Mobile',       labelAr: 'رقم الجوال',    type: 'phone',  required: true,  aliases: ['mobile', 'phone', 'جوال'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'uploaded',    labelEn: 'Uploaded',     labelAr: 'الإجمالي',      type: 'number', required: true,  aliases: ['uploaded', 'الإجمالي'] },
      { key: 'dispensed',   labelEn: 'Dispensed',    labelAr: 'المصروف',       type: 'number', required: true,  aliases: ['dispensed', 'المصروف'] },
      { key: 'supervisor',  labelEn: 'Supervisor',   labelAr: 'المشرف',        type: 'text',   required: false, aliases: ['supervisor', 'مشرف'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'high-value': {
    projectId: 'high-value',
    nameEn: 'High Value',
    nameAr: 'القيمة العالية',
    fields: [
      { key: 'mobile',      labelEn: 'Mobile',       labelAr: 'رقم الجوال',    type: 'phone',  required: true,  aliases: ['mobile', 'جوال'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'uploaded',    labelEn: 'Uploaded',     labelAr: 'الإجمالي',      type: 'number', required: true,  aliases: ['uploaded', 'الإجمالي'] },
      { key: 'dispensed',   labelEn: 'Dispensed',    labelAr: 'المصروف',       type: 'number', required: true,  aliases: ['dispensed', 'المصروف'] },
      { key: 'net_value',   labelEn: 'Net Value',    labelAr: 'القيمة الصافية',type: 'number', required: false, aliases: ['net value', 'value', 'قيمة'] },
      { key: 'supervisor',  labelEn: 'Supervisor',   labelAr: 'المشرف',        type: 'text',   required: false, aliases: ['supervisor', 'مشرف'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'pill-pack': {
    projectId: 'pill-pack',
    nameEn: 'Pill Pack',
    nameAr: 'الحزمة الدوائية',
    fields: [
      { key: 'mobile',      labelEn: 'Mobile',       labelAr: 'رقم الجوال',    type: 'phone',  required: true,  aliases: ['mobile', 'جوال'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'uploaded',    labelEn: 'Uploaded',     labelAr: 'الإجمالي',      type: 'number', required: true,  aliases: ['uploaded', 'الإجمالي'] },
      { key: 'dispensed',   labelEn: 'Dispensed',    labelAr: 'المصروف',       type: 'number', required: true,  aliases: ['dispensed', 'المصروف'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'p2p': {
    projectId: 'p2p',
    nameEn: 'P2P',
    nameAr: 'نقل بين الفروع',
    fields: [
      { key: 'from_branch', labelEn: 'From Branch',  labelAr: 'من الفرع',      type: 'text',   required: true,  aliases: ['from', 'from branch', 'من'] },
      { key: 'to_branch',   labelEn: 'To Branch',    labelAr: 'إلى الفرع',     type: 'text',   required: true,  aliases: ['to', 'to branch', 'إلى'] },
      { key: 'quantity',    labelEn: 'Quantity',     labelAr: 'الكمية',        type: 'number', required: true,  aliases: ['quantity', 'qty', 'كمية'] },
      { key: 'value',       labelEn: 'Value',        labelAr: 'القيمة',        type: 'number', required: false, aliases: ['value', 'قيمة'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },

  'hybrid-pharmacy': {
    projectId: 'hybrid-pharmacy',
    nameEn: 'Hybrid Pharmacy',
    nameAr: 'صيدليات هايبرد',
    fields: [
      { key: 'pharmacy',    labelEn: 'Pharmacy',     labelAr: 'الصيدلية',      type: 'text',   required: true,  aliases: ['pharmacy', 'صيدلية'] },
      { key: 'region',      labelEn: 'Region',       labelAr: 'المنطقة',       type: 'text',   required: true,  aliases: ['region', 'منطقة'] },
      { key: 'online',      labelEn: 'Online Orders',labelAr: 'طلبات أونلاين', type: 'number', required: true,  aliases: ['online', 'أونلاين'] },
      { key: 'offline',     labelEn: 'Walk-in',      labelAr: 'حضوري',         type: 'number', required: true,  aliases: ['offline', 'walk-in', 'حضوري'] },
      { key: 'date',        labelEn: 'Date',         labelAr: 'التاريخ',       type: 'date',   required: false, aliases: ['date', 'تاريخ'] },
    ],
  },
};

/* ── LocalStorage helpers ──────────────────────────────────────────────── */
const STORAGE_KEY = 'al-dawaa-templates';

export function getTemplate(projectId: string): ProjectTemplate {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all: Record<string, ProjectTemplate> = JSON.parse(stored);
      if (all[projectId]) return all[projectId];
    }
  } catch {}
  return DEFAULT_TEMPLATES[projectId] || {
    projectId,
    nameEn: projectId,
    nameAr: projectId,
    fields: [
      { key: 'col1', labelEn: 'Column 1', labelAr: 'عمود 1', type: 'text', required: true, aliases: [] },
    ],
  };
}

export function saveTemplate(template: ProjectTemplate): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, ProjectTemplate> = stored ? JSON.parse(stored) : {};
    all[template.projectId] = template;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function resetTemplate(projectId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all: Record<string, ProjectTemplate> = JSON.parse(stored);
      delete all[projectId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch {}
}

/* ── Auto-map file columns to template fields ──────────────────────────── */
export function autoMapColumns(
  fileColumns: string[],
  template: ProjectTemplate
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of template.fields) {
    const match = fileColumns.find(col => {
      const c = col.toLowerCase().trim();
      return (
        c === field.key ||
        c === field.labelEn.toLowerCase() ||
        c === field.labelAr ||
        field.aliases.some(a => c === a.toLowerCase())
      );
    });
    if (match) mapping[field.key] = match;
  }
  return mapping;
}
