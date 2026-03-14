import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Users, Gavel, Save, Loader2 } from 'lucide-react';
import { useAuctionSettings } from '@/hooks/useAuctionSettings';

const DashboardAuctionSettings = () => {
  const { settings, isLoading, updateSettings } = useAuctionSettings();
  const [form, setForm] = useState({
    can_patient_post_directly: false,
    require_doctor_signature: true,
    require_patient_otp_consent: true,
    require_social_report: false,
    auto_publish_after_verify: false,
    default_patient_action: 'require_doctor',
    bid_duration_hours: 72,
    max_bids_per_request: 10,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        can_patient_post_directly: settings.can_patient_post_directly,
        require_doctor_signature: settings.require_doctor_signature,
        require_patient_otp_consent: settings.require_patient_otp_consent,
        require_social_report: settings.require_social_report,
        auto_publish_after_verify: settings.auto_publish_after_verify,
        default_patient_action: settings.default_patient_action,
        bid_duration_hours: settings.bid_duration_hours,
        max_bids_per_request: settings.max_bids_per_request,
      });
    }
  }, [settings]);

  const handleSave = () => updateSettings.mutate(form);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-cairo text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              إعدادات حوكمة المزادات
            </h1>
            <p className="text-sm text-muted-foreground font-cairo mt-1">
              تحكم في مسارات النشر وقواعد التحقق والموافقات
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="font-cairo gap-2">
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الإعدادات
          </Button>
        </div>

        {/* Initiation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              إعدادات بدء الطلب
            </CardTitle>
            <CardDescription className="font-cairo">
              من يستطيع إنشاء طلبات المزاد وما المسار الافتراضي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-cairo font-medium">السماح للمريض بإنشاء طلب مباشرة</Label>
                <p className="text-xs text-muted-foreground font-cairo">المريض يستطيع تقديم طلب بدون تدخل الطبيب</p>
              </div>
              <Switch
                checked={form.can_patient_post_directly}
                onCheckedChange={v => setForm(f => ({ ...f, can_patient_post_directly: v }))}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-cairo font-medium">الإجراء الافتراضي عند إنشاء المريض للطلب</Label>
              <Select
                value={form.default_patient_action}
                onValueChange={v => setForm(f => ({ ...f, default_patient_action: v }))}
              >
                <SelectTrigger className="font-cairo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="require_doctor" className="font-cairo">يحتاج تأكيد طبيب</SelectItem>
                  <SelectItem value="require_admin" className="font-cairo">يحتاج تأكيد أدمن</SelectItem>
                  <SelectItem value="auto_publish" className="font-cairo">نشر تلقائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Verification Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              قواعد التحقق والموافقة
            </CardTitle>
            <CardDescription className="font-cairo">
              المتطلبات الإلزامية قبل نشر المزاد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-cairo font-medium">إلزامية توقيع الطبيب</Label>
                <p className="text-xs text-muted-foreground font-cairo">طبيب معتمد يجب أن يؤكد التشخيص</p>
              </div>
              <Switch
                checked={form.require_doctor_signature}
                onCheckedChange={v => setForm(f => ({ ...f, require_doctor_signature: v }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-cairo font-medium">موافقة المريض الرقمية</Label>
                <p className="text-xs text-muted-foreground font-cairo">المريض يوافق رقمياً على نشر حالته</p>
              </div>
              <Switch
                checked={form.require_patient_otp_consent}
                onCheckedChange={v => setForm(f => ({ ...f, require_patient_otp_consent: v }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-cairo font-medium">إلزامية تقرير الحالة الاجتماعية</Label>
                <p className="text-xs text-muted-foreground font-cairo">تقرير فقر معتمد من باحث اجتماعي</p>
              </div>
              <Switch
                checked={form.require_social_report}
                onCheckedChange={v => setForm(f => ({ ...f, require_social_report: v }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-cairo font-medium">نشر تلقائي بعد التحقق</Label>
                <p className="text-xs text-muted-foreground font-cairo">نشر المزاد مباشرة بدون مراجعة الأدمن</p>
              </div>
              <Switch
                checked={form.auto_publish_after_verify}
                onCheckedChange={v => setForm(f => ({ ...f, auto_publish_after_verify: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bidding Config */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              إعدادات المزايدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-cairo">مدة المزايدة (ساعات)</Label>
                <Input
                  type="number"
                  value={form.bid_duration_hours}
                  onChange={e => setForm(f => ({ ...f, bid_duration_hours: parseInt(e.target.value) || 72 }))}
                  className="font-cairo"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-cairo">الحد الأقصى للعروض لكل طلب</Label>
                <Input
                  type="number"
                  value={form.max_bids_per_request}
                  onChange={e => setForm(f => ({ ...f, max_bids_per_request: parseInt(e.target.value) || 10 }))}
                  className="font-cairo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">معاينة مسار العمل الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 font-cairo text-sm">
              <Badge variant="outline">إنشاء الطلب</Badge>
              <span className="text-muted-foreground">←</span>
              {form.require_doctor_signature && (
                <>
                  <Badge className="bg-yellow-100 text-yellow-800">تحقق الطبيب</Badge>
                  <span className="text-muted-foreground">←</span>
                </>
              )}
              {form.require_patient_otp_consent && (
                <>
                  <Badge className="bg-orange-100 text-orange-800">موافقة المريض</Badge>
                  <span className="text-muted-foreground">←</span>
                </>
              )}
              {form.require_social_report && (
                <>
                  <Badge className="bg-blue-100 text-blue-800">تقرير اجتماعي</Badge>
                  <span className="text-muted-foreground">←</span>
                </>
              )}
              {!form.auto_publish_after_verify && (
                <>
                  <Badge className="bg-purple-100 text-purple-800">مراجعة الأدمن</Badge>
                  <span className="text-muted-foreground">←</span>
                </>
              )}
              <Badge className="bg-green-100 text-green-800">نشر للمزايدة</Badge>
              <span className="text-muted-foreground">←</span>
              <Badge className="bg-emerald-100 text-emerald-800">ترسية</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAuctionSettings;
