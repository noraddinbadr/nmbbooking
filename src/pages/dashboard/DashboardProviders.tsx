import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const providerFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'provider_type', label: 'النوع', type: 'select', showInTable: true, options: [
    { value: 'lab', label: 'مختبر' },
    { value: 'pharmacy', label: 'صيدلية' },
    { value: 'imaging', label: 'أشعة' },
    { value: 'supplies', label: 'مستلزمات' },
  ]},
  { key: 'contact_phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const orderFields: FieldConfig[] = [
  { key: 'order_type', label: 'نوع الطلب', type: 'select', showInTable: true, options: [
    { value: 'lab_test', label: 'تحليل مخبري' },
    { value: 'medicine', label: 'دواء' },
    { value: 'imaging', label: 'أشعة' },
  ]},
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'pending', label: 'معلّق' },
    { value: 'received', label: 'مستلم' },
    { value: 'sample_taken', label: 'تم أخذ العينة' },
    { value: 'results_uploaded', label: 'تم رفع النتائج' },
    { value: 'delivered', label: 'تم التسليم' },
  ]},
  { key: 'notes', label: 'ملاحظات', type: 'text', showInTable: true },
  { key: 'results_url', label: 'رابط النتائج', type: 'text', showInTable: false, dir: 'ltr' },
  { key: 'provider_id', label: 'معرف المزود', type: 'text', required: true, showInTable: false, dir: 'ltr' },
];

const DashboardProviders = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">مزودو الخدمات</h1>
        <p className="font-cairo text-sm text-muted-foreground">إدارة المختبرات والصيدليات ومراكز الأشعة وطلباتها</p>
      </div>
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="font-cairo">
          <TabsTrigger value="providers" className="font-cairo gap-1.5"><Package className="h-3.5 w-3.5" /> المزودون</TabsTrigger>
          <TabsTrigger value="orders" className="font-cairo gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> الطلبات</TabsTrigger>
        </TabsList>
        <TabsContent value="providers">
          <DynamicCrud tableName="providers" title="مزود خدمة" fields={providerFields} nameField="name_ar" />
        </TabsContent>
        <TabsContent value="orders">
          <DynamicCrud tableName="provider_orders" title="طلب" fields={orderFields} nameField="order_type" />
        </TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
);

export default DashboardProviders;
