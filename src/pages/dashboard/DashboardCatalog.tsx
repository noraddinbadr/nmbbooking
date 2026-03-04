import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Tag, Heart, Award } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const serviceCategoryFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'icon', label: 'الأيقونة', type: 'text', showInTable: false },
  { key: 'sort_order', label: 'الترتيب', type: 'number', showInTable: true },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const serviceFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'description_ar', label: 'الوصف', type: 'text', showInTable: false },
  { key: 'default_price', label: 'السعر الافتراضي', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'duration_min', label: 'المدة (دقيقة)', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const sponsorTypeFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'description_ar', label: 'الوصف', type: 'text', showInTable: false },
  { key: 'tier_level', label: 'مستوى الرعاية', type: 'number', showInTable: true },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const sponsorFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'contact_name', label: 'جهة الاتصال', type: 'text', showInTable: true },
  { key: 'contact_phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'contact_email', label: 'البريد', type: 'text', showInTable: false, dir: 'ltr' },
  { key: 'logo_url', label: 'رابط الشعار', type: 'text', showInTable: false },
  { key: 'is_active', label: 'الحالة', type: 'boolean', showInTable: true },
];

const DashboardCatalog = () => {
  const tabs = [
    { value: 'categories', label: 'تصنيفات الخدمات', icon: Layers },
    { value: 'services', label: 'الخدمات', icon: Tag },
    { value: 'sponsor_types', label: 'أنواع الرعاة', icon: Award },
    { value: 'sponsors', label: 'الرعاة', icon: Heart },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الكتالوج</h1>
          <p className="font-cairo text-sm text-muted-foreground">إدارة الخدمات والتصنيفات والرعاة</p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="font-cairo text-xs gap-1.5 data-[state=active]:bg-background">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="categories">
            <DynamicCrud tableName="service_categories" title="تصنيف خدمة" fields={serviceCategoryFields} nameField="name_ar" />
          </TabsContent>
          <TabsContent value="services">
            <DynamicCrud tableName="services" title="خدمة" fields={serviceFields} nameField="name_ar" />
          </TabsContent>
          <TabsContent value="sponsor_types">
            <DynamicCrud tableName="sponsor_types" title="نوع راعي" fields={sponsorTypeFields} nameField="name_ar" />
          </TabsContent>
          <TabsContent value="sponsors">
            <DynamicCrud tableName="sponsors" title="راعي" fields={sponsorFields} nameField="name_ar" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCatalog;
