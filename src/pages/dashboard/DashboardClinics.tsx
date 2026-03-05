import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, UserCog, Stethoscope } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const clinicFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'city', label: 'المدينة', type: 'text', showInTable: true },
  { key: 'address', label: 'العنوان', type: 'text', showInTable: false },
  { key: 'phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'owner_id', label: 'المالك', type: 'relation', required: true, showInTable: true, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const doctorFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: false },
  { key: 'specialty_ar', label: 'التخصص', type: 'text', showInTable: true },
  { key: 'city_ar', label: 'المدينة', type: 'text', showInTable: true },
  { key: 'gender', label: 'الجنس', type: 'select', showInTable: true, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'base_price', label: 'السعر الأساسي', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'years_experience', label: 'سنوات الخبرة', type: 'number', showInTable: false },
  { key: 'is_verified', label: 'موثق', type: 'boolean', showInTable: true },
  { key: 'available_today', label: 'متاح اليوم', type: 'boolean', showInTable: false },
  { key: 'about_ar', label: 'نبذة بالعربي', type: 'text', showInTable: false },
  { key: 'clinic_id', label: 'العيادة', type: 'relation', required: true, showInTable: true, relationTable: 'clinics', relationLabelField: 'name_ar', relationValueField: 'id' },
  { key: 'user_id', label: 'المستخدم', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const staffFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'staff_role', label: 'الدور', type: 'select', required: true, showInTable: true, options: [
    { value: 'doctor', label: 'طبيب' },
    { value: 'assistant', label: 'مساعد' },
    { value: 'receptionist', label: 'موظف استقبال' },
  ]},
  { key: 'is_active', label: 'نشط', type: 'boolean', showInTable: true },
  { key: 'clinic_id', label: 'العيادة', type: 'relation', required: true, showInTable: true, relationTable: 'clinics', relationLabelField: 'name_ar', relationValueField: 'id' },
  { key: 'user_id', label: 'المستخدم', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const DashboardClinics = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة العيادات</h1>
        <p className="font-cairo text-sm text-muted-foreground">إدارة العيادات والأطباء والموظفين</p>
      </div>
      <Tabs defaultValue="clinics" className="w-full">
        <TabsList className="font-cairo">
          <TabsTrigger value="clinics" className="font-cairo gap-1.5"><Building className="h-3.5 w-3.5" /> العيادات</TabsTrigger>
          <TabsTrigger value="doctors" className="font-cairo gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> الأطباء</TabsTrigger>
          <TabsTrigger value="staff" className="font-cairo gap-1.5"><UserCog className="h-3.5 w-3.5" /> الموظفون</TabsTrigger>
        </TabsList>
        <TabsContent value="clinics"><DynamicCrud tableName="clinics" title="عيادة" fields={clinicFields} nameField="name_ar" /></TabsContent>
        <TabsContent value="doctors"><DynamicCrud tableName="doctors" title="طبيب" fields={doctorFields} nameField="name_ar" /></TabsContent>
        <TabsContent value="staff"><DynamicCrud tableName="staff_members" title="موظف" fields={staffFields} nameField="name_ar" /></TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
);

export default DashboardClinics;
