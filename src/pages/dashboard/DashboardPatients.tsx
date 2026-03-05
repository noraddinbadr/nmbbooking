import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const profileFields: FieldConfig[] = [
  { key: 'full_name', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'full_name_ar', label: 'الاسم بالعربي', type: 'text', showInTable: true },
  { key: 'phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'gender', label: 'الجنس', type: 'select', showInTable: true, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'date_of_birth', label: 'تاريخ الميلاد', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'avatar_url', label: 'رابط الصورة', type: 'text', showInTable: false, dir: 'ltr' },
];

const DashboardPatients = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة المرضى</h1>
        <p className="font-cairo text-sm text-muted-foreground">عرض وتعديل بيانات المرضى والمستخدمين</p>
      </div>
      <DynamicCrud tableName="profiles" title="مريض" fields={profileFields} nameField="full_name_ar" />
    </div>
  </DashboardLayout>
);

export default DashboardPatients;
