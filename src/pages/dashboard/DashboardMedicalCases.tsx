import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gavel, Loader2 } from 'lucide-react';
import { usePublishCaseAsAuction } from '@/hooks/useAuctionRequests';
import AuctionRequestDetail from '@/components/auction/AuctionRequestDetail';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const caseFields: FieldConfig[] = [
  { key: 'case_code', label: 'كود الحالة', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'title_ar', label: 'عنوان الحالة', type: 'text', showInTable: true },
  { key: 'diagnosis_summary', label: 'ملخص التشخيص', type: 'text', showInTable: true },
  { key: 'diagnosis_code', label: 'كود التشخيص (ICD-10)', type: 'text', showInTable: false, dir: 'ltr' },
  { key: 'treatment_plan', label: 'خطة العلاج', type: 'text', showInTable: false },
  { key: 'specialty', label: 'التخصص', type: 'text', showInTable: false },
  { key: 'city', label: 'المدينة', type: 'text', showInTable: false },
  { key: 'estimated_cost', label: 'التكلفة المقدرة', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'funded_amount', label: 'المبلغ الممول', type: 'number', showInTable: false, dir: 'ltr' },
  { key: 'medical_priority', label: 'الأولوية الطبية (1-5)', type: 'number', showInTable: true },
  { key: 'poverty_score', label: 'درجة الفقر (0-100)', type: 'number', showInTable: false },
  { key: 'anonymization_level', label: 'مستوى إخفاء الهوية (0-3)', type: 'number', showInTable: false },
  { key: 'status', label: 'الحالة', type: 'select', showInTable: true, options: [
    { value: 'open', label: 'مفتوحة' },
    { value: 'funded', label: 'ممولة' },
    { value: 'partially_funded', label: 'ممولة جزئياً' },
    { value: 'in_treatment', label: 'قيد العلاج' },
    { value: 'closed', label: 'مغلقة' },
  ]},
  { key: 'is_anonymous', label: 'مجهول الهوية', type: 'boolean', showInTable: true },
  { key: 'patient_age', label: 'عمر المريض', type: 'number', showInTable: false },
  { key: 'patient_gender', label: 'جنس المريض', type: 'select', showInTable: false, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'created_by', label: 'المنشئ', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
  { key: 'doctor_id', label: 'الطبيب المسؤول', type: 'relation', showInTable: false, relationTable: 'doctors', relationLabelField: 'name_ar', relationValueField: 'id' },
  { key: 'camp_id', label: 'مخيم طبي', type: 'relation', showInTable: false, relationTable: 'medical_camps', relationLabelField: 'title_ar', relationValueField: 'id' },
];

const DashboardMedicalCases = () => {
  const publishMutation = usePublishCaseAsAuction();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Map of case_id -> auction_request id (so we know which cases are already published)
  const { data: auctionMap = {} } = useQuery({
    queryKey: ['auction-requests-by-case'],
    queryFn: async () => {
      const { data, error } = await supabase.from('auction_requests').select('id, case_id, status');
      if (error) throw error;
      return Object.fromEntries((data || []).map(a => [a.case_id, { id: a.id, status: a.status }]));
    },
  });

  const handlePublish = async (caseId: string) => {
    const result = await publishMutation.mutateAsync(caseId);
    setSelectedRequestId(result.id);
  };

  const renderActions = (row: { id: string }) => {
    const existing = auctionMap[row.id];
    if (existing) {
      return (
        <Button size="sm" variant="outline" className="font-cairo gap-1" onClick={() => setSelectedRequestId(existing.id)}>
          <Gavel className="h-3.5 w-3.5" /> عرض المزاد
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline" className="font-cairo gap-1" onClick={() => handlePublish(row.id)} disabled={publishMutation.isPending}>
        {publishMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gavel className="h-3.5 w-3.5" />}
        نشر كمزاد
      </Button>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">الحالات الطبية</h1>
          <p className="font-cairo text-sm text-muted-foreground">
            نقطة الدخول الموحدة: أنشئ الحالة هنا، ثم انشرها كمزاد عكسي بضغطة زر.
          </p>
        </div>
        <DynamicCrud
          tableName="medical_cases"
          title="حالة طبية"
          fields={caseFields}
          nameField="case_code"
          extraActions={renderActions}
        />

        <Dialog open={!!selectedRequestId} onOpenChange={() => setSelectedRequestId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo">تفاصيل المزاد</DialogTitle>
            </DialogHeader>
            {selectedRequestId && <AuctionRequestDetail requestId={selectedRequestId} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardMedicalCases;
