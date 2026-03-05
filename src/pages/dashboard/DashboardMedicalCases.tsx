import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const caseFields: FieldConfig[] = [
  { key: 'case_code', label: 'كود الحالة', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'diagnosis_summary', label: 'ملخص التشخيص', type: 'text', showInTable: true },
  { key: 'treatment_plan', label: 'خطة العلاج', type: 'text', showInTable: false },
  { key: 'estimated_cost', label: 'التكلفة المقدرة', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'funded_amount', label: 'المبلغ الممول', type: 'number', showInTable: false, dir: 'ltr' },
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'open', label: 'مفتوحة' },
    { value: 'funded', label: 'ممولة' },
    { value: 'partially_funded', label: 'ممولة جزئياً' },
    { value: 'in_treatment', label: 'قيد العلاج' },
    { value: 'closed', label: 'مغلقة' },
  ]},
  { key: 'is_anonymous', label: 'مجهول الهوية', type: 'boolean', showInTable: true },
  { key: 'patient_age', label: 'عمر المريض', type: 'number', showInTable: true },
  { key: 'patient_gender', label: 'جنس المريض', type: 'select', showInTable: false, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'created_by', label: 'المنشئ', type: 'relation', required: true, showInTable: true, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
  { key: 'registration_id', label: 'التسجيل', type: 'relation', showInTable: false, relationTable: 'registrations', relationLabelField: 'case_code', relationValueField: 'id' },
];

const DashboardMedicalCases = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">الحالات الطبية</h1>
        <p className="font-cairo text-sm text-muted-foreground">إدارة الحالات الطبية والتشخيصات وخطط العلاج</p>
      </div>
      <DynamicCrud tableName="medical_cases" title="حالة طبية" fields={caseFields} nameField="case_code" />
    </div>
  </DashboardLayout>
);

export default DashboardMedicalCases;
