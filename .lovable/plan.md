

## التحليل والخطة الشاملة

### الوضع الحالي - المشاكل الجوهرية

بعد فحص الكود بالتفصيل، وجدت هذه المشاكل الأساسية:

1. **الحجز لا يدعم أفراد العائلة**: في `BookingSidebar.tsx` السطر 138، `patient_id` دائماً = `user.id`. اسم المريض يُخزّن كنص في حقل `notes` وليس بشكل هيكلي.

2. **لا يوجد جدول لأفراد العائلة**: لا يوجد `family_members` table في قاعدة البيانات.

3. **صفحة الحجوزات** (`DashboardBookings.tsx`): مجرد `DynamicCrud` خام — 42 سطر فقط، لا فلاتر، لا أزرار workflow.

4. **صفحة المرضى** (`DashboardPatients.tsx`): 253 سطر من كود مكرر (نسخة يدوية من DynamicCrud)، لا يوجد ملف مريض قابل للنقر.

5. **لا يوجد مسار `/dashboard/patients/:id`** لعرض الملف الطبي الكامل.

6. **صفحة العيادات** (`DashboardClinics.tsx`): 3 تبويبات DynamicCrud بسيطة، لا إحصائيات، لا toggle سريع.

---

### الخطة التنفيذية

#### 1. إنشاء جدول `family_members` (Migration)

```sql
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name_ar TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  gender TEXT,
  date_of_birth DATE,
  relationship TEXT NOT NULL, -- 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
-- User sees/manages own family
CREATE POLICY "User manages own family" ON public.family_members FOR ALL USING (user_id = auth.uid());
-- Doctors/admin can read for bookings
CREATE POLICY "Staff reads family" ON public.family_members FOR SELECT USING (
  has_role(auth.uid(), 'doctor') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
);
```

#### 2. تعديل BookingSidebar — دعم الحجز لأفراد العائلة

- إضافة Select لاختيار "لنفسي" أو أحد أفراد العائلة
- جلب `family_members` للمستخدم الحالي
- زر "إضافة فرد عائلة جديد" (inline form)
- عند الحجز: `patient_id` يبقى `user.id` (صاحب الحساب)، لكن نضيف `patient_info` JSONB أو نستخدم `notes` بشكل هيكلي

**بما أن جدول bookings ليس فيه عمود `family_member_id`** سنضيف عمود:
```sql
ALTER TABLE public.bookings ADD COLUMN family_member_id UUID REFERENCES public.family_members(id);
```

#### 3. إعادة بناء `DashboardBookings.tsx` بالكامل

```text
الهيكل الجديد:
┌─────────────────────────────────────────────────┐
│ إحصائيات: معلّق | مؤكد | مكتمل | ملغي | إجمالي │
├─────────────────────────────────────────────────┤
│ فلاتر: [تاريخ] [الحالة] [الطبيب*] [بحث]       │
├─────────────────────────────────────────────────┤
│ تبويبات: اليوم | كل الحجوزات                    │
├─────────────────────────────────────────────────┤
│ كل بطاقة حجز:                                  │
│  - اسم المريض (من profiles + family_members)    │
│  - التاريخ + الوقت + نوع الحجز                  │
│  - Badge حالة ملون                              │
│  - أزرار: تأكيد | إلغاء | بدء جلسة | سجل طبي  │
└─────────────────────────────────────────────────┘
```

- الطبيب: يرى حجوزاته فقط (auto-filter by doctorId)
- الأدمن: يرى كل الحجوزات مع فلتر بالطبيب
- زر "بدء جلسة" → navigate `/dashboard/consultation?booking=ID`
- زر "سجل طبي" → navigate `/dashboard/patients/{patient_id}`

#### 4. إنشاء `DashboardPatientRecord.tsx` — صفحة الملف الطبي الكامل

**مسار جديد:** `/dashboard/patients/:patientId`

```text
┌──────────────────────────────────────────────┐
│ رأس: صورة + اسم + عمر + جنس + هاتف         │
│ إحصائيات: زيارات | جلسات | وصفات | طلبات    │
├──────────────────────────────────────────────┤
│ أفراد العائلة المسجلين (إن وجدوا)           │
├──────────────────────────────────────────────┤
│ تبويبات:                                     │
│  [الزيارات] [الوصفات] [التحاليل] [الحجوزات] │
│                                              │
│  - الزيارات: treatment_sessions مع تشخيص    │
│  - الوصفات: prescriptions + items            │
│  - التحاليل: provider_orders                 │
│  - الحجوزات: كل حجوزات المريض               │
└──────────────────────────────────────────────┘
```

Data: يجلب من `profiles`, `treatment_sessions`, `prescriptions`, `prescription_items`, `provider_orders`, `bookings`, `family_members`.

#### 5. تبسيط `DashboardPatients.tsx`

- حذف الـ 180 سطر من DynamicCrudFilteredByIds المكرر
- جدول بسيط ونظيف: اسم + هاتف + جنس + عمر + عدد الزيارات
- كل صف قابل للنقر → navigate `/dashboard/patients/:id`
- بحث بالاسم + فلتر بالجنس
- إحصائيات: إجمالي المرضى، ذكور/إناث

#### 6. تحسين `DashboardClinics.tsx`

```text
إضافات:
- بطاقات إحصائية: عدد العيادات | الأطباء | الموظفين النشطين
- تبويب الأطباء: عمود "متاح اليوم" مع Switch للتبديل الفوري
- تبويب الأطباء: عمود "عدد حجوزات اليوم"
- تبويب العيادات: عمود "عدد الأطباء" لكل عيادة
```

#### 7. تسجيل الموديولات `src/config/modules.ts`

```text
Module Registry:
- تعريف كل موديول: id, label, icon, route, roles, group, defaultEnabled
- مجموعات: core | clinical | admin | events
- DashboardLayout يقرأ الموديولات المفعّلة ويفلتر navItems
- الحالة تُحفظ في localStorage (SaaS-ready: مستقبلاً DB)
```

---

### الملفات المتأثرة

```text
جديد:
  src/config/modules.ts                              — Module Registry
  src/pages/dashboard/DashboardPatientRecord.tsx      — ملف المريض الكامل

Migration:
  family_members table + bookings.family_member_id    — دعم العائلة

إعادة بناء:
  src/pages/dashboard/DashboardBookings.tsx           — مركز قيادة الحجوزات
  src/pages/dashboard/DashboardPatients.tsx           — تبسيط + ربط بالملف

تعديل:
  src/pages/dashboard/DashboardClinics.tsx            — إحصائيات + toggle
  src/components/doctor/BookingSidebar.tsx             — اختيار فرد العائلة
  src/components/dashboard/DashboardLayout.tsx         — module-based nav
  src/App.tsx                                         — route /patients/:patientId
```

### ترتيب التنفيذ

```text
1. Migration: family_members + bookings.family_member_id
2. src/config/modules.ts
3. DashboardPatientRecord.tsx (جديد)
4. DashboardBookings.tsx (rebuild)
5. DashboardPatients.tsx (تبسيط)
6. BookingSidebar.tsx (دعم العائلة)
7. DashboardClinics.tsx (تحسين)
8. DashboardLayout.tsx (modules nav)
9. App.tsx (route جديد)
```

