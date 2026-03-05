import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, FileText } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const categoryFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'icon', label: 'أيقونة', type: 'text', showInTable: false },
  { key: 'sort_order', label: 'الترتيب', type: 'number', showInTable: true },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const serviceFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'description_ar', label: 'الوصف', type: 'text', showInTable: false },
  { key: 'default_price', label: 'السعر الافتراضي', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'duration_min', label: 'المدة (دقيقة)', type: 'number', showInTable: true },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
  { key: 'category_id', label: 'التصنيف', type: 'relation', showInTable: true, relationTable: 'service_categories', relationLabelField: 'name_ar', relationValueField: 'id' },
];

const DashboardServices = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <div>
        <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الخدمات</h1>
        <p className="font-cairo text-sm text-muted-foreground">إضافة وتعديل الخدمات الطبية وتصنيفاتها</p>
      </div>
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="font-cairo">
          <TabsTrigger value="services" className="font-cairo gap-1.5"><FileText className="h-3.5 w-3.5" /> الخدمات</TabsTrigger>
          <TabsTrigger value="categories" className="font-cairo gap-1.5"><Layers className="h-3.5 w-3.5" /> التصنيفات</TabsTrigger>
        </TabsList>
        <TabsContent value="services"><DynamicCrud tableName="services" title="خدمة" fields={serviceFields} nameField="name_ar" /></TabsContent>
        <TabsContent value="categories"><DynamicCrud tableName="service_categories" title="تصنيف" fields={categoryFields} nameField="name_ar" /></TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
);

export default DashboardServices;
