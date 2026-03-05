import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Heart } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const campFields: FieldConfig[] = [
  { key: 'title_ar', label: 'العنوان بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'title_en', label: 'العنوان بالإنجليزي', type: 'text', showInTable: false },
  { key: 'description_ar', label: 'الوصف', type: 'text', showInTable: false },
  { key: 'location_name', label: 'الموقع', type: 'text', showInTable: true },
  { key: 'location_city', label: 'المدينة', type: 'text', showInTable: true },
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'draft', label: 'مسودة' },
    { value: 'published', label: 'منشور' },
    { value: 'active', label: 'نشط' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
  ]},
  { key: 'start_date', label: 'تاريخ البداية', type: 'date', showInTable: true },
  { key: 'end_date', label: 'تاريخ النهاية', type: 'date', showInTable: false },
  { key: 'total_capacity', label: 'السعة الكلية', type: 'number', showInTable: true },
  { key: 'is_free', label: 'مجاني', type: 'boolean', showInTable: true },
  { key: 'target_fund', label: 'الهدف التمويلي', type: 'number', showInTable: false, dir: 'ltr' },
  { key: 'raised_fund', label: 'المبلغ المحصّل', type: 'number', showInTable: false, dir: 'ltr' },
  { key: 'organizer_id', label: 'المنظم', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const scheduleFields: FieldConfig[] = [
  { key: 'schedule_date', label: 'التاريخ', type: 'date', required: true, showInTable: true },
  { key: 'start_time', label: 'وقت البداية', type: 'text', required: true, showInTable: true, dir: 'ltr' },
  { key: 'end_time', label: 'وقت النهاية', type: 'text', required: true, showInTable: true, dir: 'ltr' },
  { key: 'service_type', label: 'نوع الخدمة', type: 'text', showInTable: true },
  { key: 'total_slots', label: 'إجمالي المقاعد', type: 'number', showInTable: true },
  { key: 'available_slots', label: 'المقاعد المتاحة', type: 'number', showInTable: true },
  { key: 'location_note', label: 'ملاحظة الموقع', type: 'text', showInTable: false },
  { key: 'camp_id', label: 'الحدث', type: 'relation', required: true, showInTable: false, relationTable: 'medical_camps', relationLabelField: 'title_ar', relationValueField: 'id' },
];

const registrationFields: FieldConfig[] = [
  { key: 'case_code', label: 'كود الحالة', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'held', label: 'محجوز مؤقتاً' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'checked_in', label: 'تم الحضور' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'expired', label: 'منتهي' },
    { value: 'cancelled', label: 'ملغي' },
  ]},
  { key: 'notes', label: 'ملاحظات', type: 'text', showInTable: true },
  { key: 'camp_id', label: 'الحدث', type: 'relation', required: true, showInTable: false, relationTable: 'medical_camps', relationLabelField: 'title_ar', relationValueField: 'id' },
  { key: 'schedule_id', label: 'الجدول', type: 'relation', required: true, showInTable: false, relationTable: 'event_schedules', relationLabelField: 'schedule_date', relationValueField: 'id' },
  { key: 'booked_by', label: 'الحاجز', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const donationFields: FieldConfig[] = [
  { key: 'donor_name', label: 'اسم المتبرع', type: 'text', showInTable: true },
  { key: 'amount', label: 'المبلغ', type: 'number', required: true, showInTable: true, dir: 'ltr' },
  { key: 'payment_method', label: 'طريقة الدفع', type: 'select', showInTable: true, options: [
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'wallet', label: 'محفظة' },
    { value: 'cash', label: 'نقدي' },
  ]},
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'pledged', label: 'تعهد' },
    { value: 'received', label: 'مستلم' },
    { value: 'verified', label: 'موثق' },
    { value: 'refunded', label: 'مسترد' },
  ]},
  { key: 'payment_reference', label: 'مرجع الدفع', type: 'text', showInTable: false, dir: 'ltr' },
  { key: 'camp_id', label: 'الحدث', type: 'relation', showInTable: false, relationTable: 'medical_camps', relationLabelField: 'title_ar', relationValueField: 'id' },
];

const DashboardEventsAdmin = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الأحداث الطبية</h1>
        <p className="font-cairo text-sm text-muted-foreground">إنشاء وإدارة المخيمات الطبية والتسجيلات والتبرعات</p>
      </div>
      <Tabs defaultValue="camps" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="camps" className="font-cairo text-xs gap-1.5"><Calendar className="h-3.5 w-3.5" /> الأحداث</TabsTrigger>
          <TabsTrigger value="schedules" className="font-cairo text-xs gap-1.5"><Calendar className="h-3.5 w-3.5" /> الجداول</TabsTrigger>
          <TabsTrigger value="registrations" className="font-cairo text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> التسجيلات</TabsTrigger>
          <TabsTrigger value="donations" className="font-cairo text-xs gap-1.5"><Heart className="h-3.5 w-3.5" /> التبرعات</TabsTrigger>
        </TabsList>
        <TabsContent value="camps">
          <DynamicCrud tableName="medical_camps" title="حدث طبي" fields={campFields} nameField="title_ar" />
        </TabsContent>
        <TabsContent value="schedules">
          <DynamicCrud tableName="event_schedules" title="جدول" fields={scheduleFields} nameField="schedule_date" />
        </TabsContent>
        <TabsContent value="registrations">
          <DynamicCrud tableName="registrations" title="تسجيل" fields={registrationFields} nameField="case_code" />
        </TabsContent>
        <TabsContent value="donations">
          <DynamicCrud tableName="donations" title="تبرع" fields={donationFields} nameField="donor_name" />
        </TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
);

export default DashboardEventsAdmin;
