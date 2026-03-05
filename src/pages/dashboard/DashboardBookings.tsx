import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const bookingFields: FieldConfig[] = [
  { key: 'booking_date', label: 'تاريخ الحجز', type: 'date', required: true, showInTable: true },
  { key: 'start_time', label: 'وقت البداية', type: 'time', showInTable: true, dir: 'ltr' },
  { key: 'end_time', label: 'وقت النهاية', type: 'time', showInTable: false, dir: 'ltr' },
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'pending', label: 'معلّق' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
  ]},
  { key: 'booking_type', label: 'نوع الحجز', type: 'select', showInTable: true, options: [
    { value: 'clinic', label: 'عيادة' },
    { value: 'hospital', label: 'مستشفى' },
    { value: 'home', label: 'منزلي' },
    { value: 'video', label: 'فيديو' },
    { value: 'voice', label: 'صوتي' },
    { value: 'lab', label: 'مختبر' },
  ]},
  { key: 'final_price', label: 'السعر النهائي', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'funding_amount', label: 'مبلغ التمويل', type: 'number', showInTable: false, dir: 'ltr' },
  { key: 'is_free_case', label: 'حالة مجانية', type: 'boolean', showInTable: true },
  { key: 'queue_position', label: 'ترتيب الطابور', type: 'number', showInTable: false },
  { key: 'notes', label: 'ملاحظات', type: 'text', showInTable: false },
  { key: 'patient_id', label: 'المريض', type: 'relation', required: true, showInTable: true, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
  { key: 'doctor_id', label: 'الطبيب', type: 'relation', required: true, showInTable: true, relationTable: 'doctors', relationLabelField: 'name_ar', relationValueField: 'id' },
];

const DashboardBookings = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الحجوزات</h1>
        <p className="font-cairo text-sm text-muted-foreground">عرض وإدارة جميع الحجوزات</p>
      </div>
      <DynamicCrud tableName="bookings" title="حجز" fields={bookingFields} nameField="booking_date" />
    </div>
  </DashboardLayout>
);

export default DashboardBookings;
