# توثيق مشروع صحتك (Sihhatak) — للتسليم لفريق التطوير

> **تاريخ التوثيق:** 2026-03-10  
> **نسخة:** MVP v2.1  
> **المنصة:** React + Vite + Tailwind CSS + Lovable Cloud (Supabase)

---

## 1. نظرة عامة

منصة **صحتك** هي نظام إدارة رعاية صحية مجتمعي شامل يستهدف السوق اليمني. يعمل بالعربية (RTL) ويتضمن:
- إدارة العيادات والأطباء
- نظام حجز مواعيد متقدم (فترات + مواعيد محددة أو طابور مرن)
- جلسات علاج ووصفات طبية
- ملفات طبية ورفع صور/نتائج
- أحداث طبية (مخيمات) مع نظام تسجيل atomic
- حالات إنسانية وتبرعات
- إشعارات فورية (Realtime)
- نظام أدوار وصلاحيات شامل (RBAC)

---

## 2. التقنيات المستخدمة

| التقنية | الغرض |
|---------|-------|
| **React 18** + **TypeScript** | الواجهة الأمامية |
| **Vite** | أداة البناء |
| **Tailwind CSS** + **shadcn/ui** | التصميم |
| **React Router v6** | التوجيه |
| **TanStack React Query** | إدارة الحالة والتخزين المؤقت |
| **Supabase** (Lovable Cloud) | قاعدة البيانات + المصادقة + التخزين + Realtime |
| **Framer Motion** | الرسوم المتحركة |
| **Recharts** | الرسوم البيانية |
| **date-fns** | معالجة التواريخ |
| **Zod** + **React Hook Form** | التحقق من البيانات |

---

## 3. بنية الملفات

```
src/
├── App.tsx                    # التوجيه الرئيسي
├── main.tsx                   # نقطة الدخول
├── index.css                  # المتغيرات والتنسيقات الأساسية
├── contexts/
│   └── AuthContext.tsx         # سياق المصادقة + الأدوار
├── components/
│   ├── ui/                    # مكونات shadcn/ui
│   ├── admin/                 # إدارة المستخدمين والأدوار
│   ├── dashboard/             # تخطيط لوحة التحكم
│   ├── doctor/                # مكونات ملف الطبيب والحجز
│   ├── events/                # مكونات الأحداث الطبية
│   ├── medical/               # رفع الملفات الطبية
│   ├── Navbar.tsx             # شريط التنقل الرئيسي
│   ├── Footer.tsx             # التذييل
│   ├── HeroSearch.tsx         # بحث الصفحة الرئيسية
│   ├── SpecialtyGrid.tsx      # شبكة التخصصات
│   ├── FeaturedDoctors.tsx    # الأطباء المميزون
│   ├── DoctorCard.tsx         # بطاقة الطبيب
│   └── ProtectedRoute.tsx     # حماية المسارات بالأدوار
├── pages/
│   ├── Index.tsx              # الصفحة الرئيسية
│   ├── Doctors.tsx            # قائمة الأطباء
│   ├── DoctorProfile.tsx      # ملف الطبيب + الحجز
│   ├── MyBookings.tsx         # حجوزاتي (للمريض)
│   ├── SignIn/SignUp.tsx       # تسجيل الدخول/التسجيل
│   ├── ForgotPassword.tsx     # نسيت كلمة المرور
│   ├── ResetPassword.tsx      # إعادة تعيين كلمة المرور
│   ├── KioskCheckin.tsx       # تسجيل الحضور
│   ├── CasesList.tsx          # قائمة الحالات الإنسانية
│   ├── events/
│   │   ├── EventList.tsx      # قائمة الأحداث
│   │   └── EventDetail.tsx    # تفاصيل الحدث
│   └── dashboard/
│       ├── DashboardHome.tsx          # الرئيسية
│       ├── DashboardBookings.tsx      # الحجوزات
│       ├── DashboardCalendar.tsx      # التقويم
│       ├── DashboardPatients.tsx      # المرضى
│       ├── DashboardPatientRecord.tsx # ملف المريض
│       ├── DashboardProfile.tsx       # الملف الشخصي
│       ├── DashboardSettings.tsx      # الإعدادات (فترات + أسعار + موظفين)
│       ├── DashboardServices.tsx      # الخدمات
│       ├── DashboardReports.tsx       # التقارير
│       ├── DashboardNotifications.tsx # الإشعارات
│       ├── DashboardClinics.tsx       # العيادات
│       ├── DashboardCatalog.tsx       # كتالوج الخدمات
│       ├── DashboardUsers.tsx         # إدارة المستخدمين (admin)
│       ├── DashboardProviders.tsx     # مزودو الخدمات
│       ├── DashboardEventsAdmin.tsx   # إدارة الأحداث
│       ├── DashboardMedicalCases.tsx  # الحالات الطبية
│       ├── DashboardTreatment.tsx     # العلاج
│       ├── ActiveConsultation.tsx     # جلسة العلاج النشطة
│       └── PatientDashboard.tsx       # لوحة المريض
├── hooks/
│   ├── useDoctors.ts          # جلب الأطباء
│   ├── useDashboardStats.ts   # إحصائيات لوحة التحكم
│   ├── useHomeStats.ts        # إحصائيات الصفحة الرئيسية
│   ├── useNotifications.ts    # الإشعارات + Realtime
│   └── useHolds.ts            # إدارة holds للأحداث
├── data/
│   ├── types.ts               # أنواع TypeScript الرئيسية
│   ├── eventsTypes.ts         # أنواع الأحداث
│   ├── constants.ts           # الثوابت
│   ├── serviceCatalog.ts      # كتالوج الخدمات
│   └── mockData.ts            # بيانات تجريبية (fallback)
├── lib/
│   ├── utils.ts               # دوال مساعدة
│   └── slots.ts               # توليد المواعيد
└── integrations/
    └── supabase/
        ├── client.ts          # عميل Supabase (تلقائي)
        └── types.ts           # أنواع قاعدة البيانات (تلقائي)

supabase/
├── config.toml                # إعدادات المشروع
├── functions/
│   ├── seed-users/index.ts    # إنشاء مستخدمين تجريبيين
│   └── send-reminders/index.ts # إرسال تذكيرات
└── migrations/                # ملفات الترحيل (تلقائية)

sql/
├── full_backup.sql            # نسخة احتياطية كاملة
├── events_ddl.sql             # DDL الأحداث
└── seed_events.sql            # بيانات تجريبية للأحداث
```

---

## 4. قاعدة البيانات

### 4.1 الجداول (25 جدول)

| الجدول | الوصف | RLS |
|--------|-------|-----|
| `profiles` | بيانات المستخدمين (اسم، هاتف، صورة) | ✅ |
| `user_roles` | أدوار المستخدمين (جدول منفصل) | ✅ |
| `clinics` | العيادات | ✅ |
| `doctors` | الأطباء + تخصصات + أسعار | ✅ |
| `doctor_shifts` | فترات عمل الأطباء | ✅ |
| `bookings` | الحجوزات | ✅ |
| `family_members` | أفراد عائلة المريض | ✅ |
| `staff_members` | موظفو العيادة + صلاحيات | ✅ |
| `notifications` | الإشعارات | ✅ |
| `treatment_sessions` | جلسات العلاج | ✅ |
| `prescriptions` | الوصفات الطبية | ✅ |
| `prescription_items` | عناصر الوصفة (أدوية) | ✅ |
| `medical_files` | الملفات الطبية (صور، تحاليل) | ✅ |
| `medical_camps` | المخيمات/الأحداث الطبية | ✅ |
| `event_schedules` | جداول الأحداث | ✅ |
| `registrations` | تسجيلات الأحداث (مع hold atomicity) | ✅ |
| `medical_cases` | الحالات الإنسانية | ✅ |
| `donations` | التبرعات | ✅ |
| `providers` | مزودو الخدمات (مختبرات، صيدليات) | ✅ |
| `provider_orders` | طلبات مزودي الخدمات | ✅ |
| `services` | الخدمات الطبية | ✅ |
| `service_categories` | تصنيفات الخدمات | ✅ |
| `sponsors` | الرعاة | ✅ |
| `sponsor_types` | أنواع الرعاة | ✅ |
| `audit_logs` | سجل التدقيق | ✅ |

### 4.2 الأنواع المخصصة (Enums)

| Enum | القيم |
|------|-------|
| `app_role` | admin, doctor, clinic_admin, staff, patient, donor, provider |
| `booking_status` | pending, confirmed, completed, cancelled |
| `booking_type` | clinic, hospital, home, video, voice, lab |
| `camp_status` | draft, published, active, completed, cancelled |
| `case_status` | open, funded, partially_funded, in_treatment, closed |
| `discount_type` | none, percentage, fixed |
| `donation_status` | pledged, received, verified, refunded |
| `order_status` | pending, received, sample_taken, results_uploaded, delivered |
| `registration_status` | held, confirmed, checked_in, completed, expired, cancelled |

### 4.3 الدوال (Functions)

| الدالة | الغرض |
|--------|-------|
| `has_role(_user_id, _role)` | التحقق من دور المستخدم (SECURITY DEFINER) |
| `is_clinic_member(_user_id, _clinic_id)` | التحقق من عضوية العيادة |
| `get_staff_permission(_user_id, _clinic_id, _permission)` | صلاحية موظف محددة |
| `handle_new_user()` | إنشاء profile + دور patient تلقائياً عند التسجيل |
| `check_shift_overlap()` | منع تعارض فترات العمل |
| `notify_doctor_on_booking()` | إشعار الطبيب عند حجز جديد |
| `notify_on_booking_update()` | إشعار عند تغيير حالة الحجز (تأكيد/إلغاء/إكمال) |
| `notify_on_order_results()` | إشعار عند جاهزية نتائج التحاليل |
| `hold_event_slot(...)` | حجز مؤقت atomic لموعد حدث (5 دقائق) |
| `confirm_hold(...)` | تأكيد الحجز المؤقت |
| `reclaim_expired_holds()` | استرجاع الأماكن من الحجوزات المنتهية |
| `update_updated_at()` | تحديث updated_at تلقائياً |

### 4.4 المشغلات (Triggers)

| Trigger | الجدول | الحدث |
|---------|--------|-------|
| `trg_check_shift_overlap` | doctor_shifts | BEFORE INSERT/UPDATE |
| `trg_notify_doctor_on_booking` | bookings | AFTER INSERT |
| `trg_notify_on_booking_update` | bookings | AFTER UPDATE |
| `trg_notify_order_results` | provider_orders | AFTER UPDATE |
| `trg_*_updated` | متعددة | BEFORE UPDATE (updated_at) |
| `on_auth_user_created` | auth.users | AFTER INSERT |

### 4.5 التخزين (Storage Buckets)

| Bucket | النوع | الاستخدام |
|--------|-------|----------|
| `avatars` | عام (public) | صور البروفايل |
| `medical-files` | خاص (private) | ملفات طبية، تحاليل، أشعة |

### 4.6 Realtime

مفعّل على: `bookings`, `notifications`

---

## 5. نظام المصادقة والأدوار (RBAC)

### 5.1 الأدوار السبعة

| الدور | الوصف | الصلاحيات الرئيسية |
|-------|-------|-------------------|
| `admin` | مدير النظام | كل شيء |
| `doctor` | طبيب | إدارة عيادته، حجوزاته، جلسات العلاج |
| `clinic_admin` | مدير عيادة | إدارة العيادة والموظفين |
| `staff` | موظف | صلاحيات حسب الأذونات (JSON) |
| `patient` | مريض | حجز مواعيد، عرض سجلاته |
| `donor` | متبرع | التبرع للحالات |
| `provider` | مزود خدمة | إدارة الطلبات الموردة |

### 5.2 صلاحيات الموظف (Granular Permissions)

```json
{
  "canViewPatients": true,
  "canEditPatients": false,
  "canManageBookings": false,
  "canCheckIn": false,
  "canPrescribe": false,
  "canOrderLabs": false,
  "canOrderImaging": false,
  "canViewReports": false,
  "canExportData": false,
  "canManageStaff": false,
  "canManageEvents": false,
  "canManageSettings": false
}
```

### 5.3 الأمان

- ✅ جميع الجداول محمية بـ **RLS**
- ✅ الأدوار مخزنة في جدول منفصل (`user_roles`) — **ليس** في profiles
- ✅ `has_role()` بـ **SECURITY DEFINER** لمنع التكرار في RLS
- ✅ **لا يوجد** أي فحص أدوار من localStorage أو client-side
- ✅ Trigger تلقائي لإنشاء profile + دور `patient` عند التسجيل

---

## 6. المسارات (Routes)

### 6.1 المسارات العامة

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | Index | الصفحة الرئيسية |
| `/doctors` | Doctors | قائمة الأطباء |
| `/doctor/:id` | DoctorProfile | ملف الطبيب + الحجز |
| `/sign-in` | SignIn | تسجيل الدخول |
| `/sign-up` | SignUp | التسجيل |
| `/forgot-password` | ForgotPassword | نسيت كلمة المرور |
| `/reset-password` | ResetPassword | إعادة التعيين |
| `/events` | EventList | الأحداث الطبية |
| `/events/:id` | EventDetail | تفاصيل الحدث |
| `/cases` | CasesList | الحالات الإنسانية |

### 6.2 مسارات المريض (authenticated)

| المسار | الصفحة |
|--------|--------|
| `/my-bookings` | حجوزاتي |
| `/dashboard/patient` | لوحة المريض |

### 6.3 مسارات لوحة التحكم (doctor/admin/staff)

| المسار | الأدوار المطلوبة |
|--------|-----------------|
| `/dashboard` | doctor, admin, clinic_admin, staff |
| `/dashboard/bookings` | doctor, admin, clinic_admin, staff |
| `/dashboard/calendar` | doctor, admin, clinic_admin, staff |
| `/dashboard/patients` | doctor, admin, clinic_admin, staff |
| `/dashboard/patients/:id` | doctor, admin, clinic_admin, staff |
| `/dashboard/consultation` | doctor |
| `/dashboard/services` | doctor, admin, clinic_admin |
| `/dashboard/treatment` | doctor, admin |
| `/dashboard/reports` | doctor, admin, clinic_admin |
| `/dashboard/events` | doctor, admin, clinic_admin |
| `/dashboard/kiosk` | doctor, admin, clinic_admin, staff |

### 6.4 مسارات المدير (admin)

| المسار | الصفحة |
|--------|--------|
| `/dashboard/users` | إدارة المستخدمين |
| `/dashboard/providers` | مزودو الخدمات |
| `/dashboard/catalog` | كتالوج الخدمات |
| `/dashboard/clinics` | العيادات |
| `/dashboard/cases` | الحالات الطبية |

### 6.5 مسارات مشتركة

| المسار | الصفحة |
|--------|--------|
| `/dashboard/profile` | الملف الشخصي |
| `/dashboard/settings` | الإعدادات |
| `/dashboard/notifications` | الإشعارات |

---

## 7. تدفقات العمل الأساسية

### 7.1 تدفق الحجز
```
المريض يفتح ملف الطبيب → يختار الفترة → يختار التاريخ →
يختار الموعد (slot) أو طابور مرن → يدخل البيانات →
يؤكد الحجز → INSERT في bookings →
Trigger يرسل إشعار للطبيب → Realtime يظهر إشعار فوري
```

### 7.2 تدفق جلسة العلاج
```
الطبيب يفتح الحجز → يبدأ الاستشارة →
يسجل الأعراض → الفحص → التشخيص →
يكتب الوصفة (prescriptions + prescription_items) →
يرفع ملفات طبية (medical_files) →
يحدد موعد المتابعة → يكمل الجلسة →
يتحول الحجز إلى completed → إشعار للمريض
```

### 7.3 تدفق الحدث الطبي (المخيم)
```
المنظم ينشئ المخيم (draft) → يضيف جداول ومواعيد →
ينشره (published) → المريض يسجل →
hold_event_slot() ← حجز atomic 5 دقائق →
confirm_hold() ← تأكيد →
يوم الحدث: check-in → فحص → إنشاء حالة (medical_case) →
تبرعات → طلبات مزودي خدمات
```

### 7.4 تدفق الإشعارات
```
حدث (حجز جديد / تغيير حالة / نتائج جاهزة) →
Trigger في DB يُدرج إشعار في notifications →
Realtime يوصل الإشعار للواجهة فوراً →
Toast + جرس مع عدّاد → قراءة / قراءة الكل
```

---

## 8. حسابات الاختبار

| الدور | البريد | كلمة المرور | UUID |
|-------|--------|-------------|------|
| admin | admin@sihhatak.com | Test1234! | `1739bc5b-...` |
| doctor | doctor@sihhatak.com | Test1234! | `5c07ee24-...` |
| patient | patient@sihhatak.com | Test1234! | `53365438-...` |
| staff | staff@sihhatak.com | Test1234! | `638d4940-...` |
| clinic_admin | clinicadmin@sihhatak.com | Test1234! | `913d20d9-...` |
| donor | donor@sihhatak.com | Test1234! | `b363b49c-...` |
| provider | provider@sihhatak.com | Test1234! | `cd182368-...` |

---

## 9. نسب الإنجاز حسب الوحدة

| الوحدة | النسبة | الحالة | ملاحظات |
|--------|--------|--------|---------|
| **المصادقة (Auth)** | 95% | ✅ | RBAC + 7 أدوار + إعادة كلمة مرور |
| **الصفحة الرئيسية** | 90% | ✅ | إحصائيات + تخصصات + أطباء مميزون من DB |
| **قائمة الأطباء** | 90% | ✅ | بحث وتصفية ديناميكي |
| **ملف الطبيب والحجز** | 85% | ✅ | فترات ديناميكية + حجز حقيقي |
| **إعدادات الطبيب** | 95% | ✅ | فترات + أسعار + موظفين + صلاحيات |
| **لوحة التحكم** | 90% | ✅ | بيانات حية من DB |
| **الإشعارات** | 95% | ✅ | Realtime + جرس + قراءة |
| **الملف الشخصي** | 90% | ✅ | رفع صورة + مزامنة profile↔doctors |
| **الملفات الطبية** | 85% | ✅ | رفع + تصنيف + معاينة + ربط بالجلسة |
| **التقارير** | 75% | ⚠️ | يومية ديناميكية — ينقص رسوم بيانية تاريخية |
| **إدارة المرضى** | 65% | ⚠️ | CRUD + ملف أساسي — ينقص تاريخ شامل |
| **إدارة الحجوزات** | 80% | ✅ | عرض وتعديل حالة الحجز |
| **جلسة العلاج** | 75% | ⚠️ | أعراض→فحص→تشخيص→وصفة — ينقص ربط أعمق |
| **الأحداث الطبية** | 90% | ✅ | مخيمات + hold/confirm atomic + تسجيل |
| **الحالات الإنسانية** | 70% | ⚠️ | إنشاء + تمويل — ينقص تتبع العلاج |
| **مزودو الخدمات** | 75% | ⚠️ | CRUD + طلبات — ينقص تتبع النتائج |
| **المستخدمين (Admin)** | 85% | ✅ | إدارة مستخدمين + أدوار |
| **العيادات** | 80% | ✅ | CRUD عيادات وأطباء |
| **التقويم** | 50% | ⚠️ | واجهة أساسية — يحتاج ربط كامل |
| **Kiosk** | 70% | ⚠️ | واجهة kiosk — ينقص QR code |
| **الكتالوج** | 80% | ✅ | خدمات + تصنيفات ديناميكية |

### **النسبة الإجمالية: ~80%**

---

## 10. الفجوات والمطلوب إكمالها

### 🔴 أولوية عالية

| # | العنصر | الوصف |
|---|--------|-------|
| 1 | **ملف المريض الشامل** | صفحة تعرض كل زيارات المريض + وصفات + تحاليل + ملفات — مع timeline |
| 2 | **ربط أعمق لجلسة العلاج** | ربط الجلسة بطلبات تحاليل/أشعة من provider_orders + عرض النتائج في الجلسة |
| 3 | **التقويم المتقدم** | عرض شهري/أسبوعي مع ربط بالفترات والحجوزات |

### 🟡 أولوية متوسطة

| # | العنصر | الوصف |
|---|--------|-------|
| 4 | **التقارير التاريخية** | رسوم بيانية بـ recharts (إيرادات شهرية، توزيع التخصصات، أكثر الخدمات) |
| 5 | **لوحة المريض المتقدمة** | عرض حجوزاتي + وصفاتي + نتائج تحاليلي + ملفاتي |
| 6 | **QR Code للحضور** | توليد QR عند الحجز + مسح في Kiosk |
| 7 | **إشعارات متنوعة** | تذكيرات مواعيد + إشعارات إدارية |

### 🟢 أولوية منخفضة

| # | العنصر | الوصف |
|---|--------|-------|
| 8 | **الدفع الإلكتروني** | ربط بوابة دفع |
| 9 | **إشعارات بريد إلكتروني** | Edge function لتأكيد الحجز بالإيميل |
| 10 | **تقارير PDF** | تصدير الوصفات والتقارير كـ PDF |
| 11 | **نظام المواعيد المتكرر** | حجز دوري (كل أسبوع/شهر) |

---

## 11. ملاحظات تقنية مهمة لفريق التطوير

### الملفات التي **لا يجب تعديلها** يدوياً:
- `src/integrations/supabase/client.ts` — يتولد تلقائياً
- `src/integrations/supabase/types.ts` — يتولد تلقائياً
- `supabase/config.toml` — يتولد تلقائياً
- `.env` — يتولد تلقائياً

### أنماط الكود المستخدمة:
- **React Query** لكل طلبات DB مع `staleTime` و `refetchInterval`
- **Design tokens** في `index.css` — لا تستخدم ألوان مباشرة في المكونات
- **shadcn/ui** كنظام تصميم أساسي
- **RTL** — اتجاه يمين لليسار في كل الصفحات
- **Semantic tokens**: `--primary`, `--secondary`, `--muted`, `--accent`, etc.

### أنماط قاعدة البيانات:
- **لا تستخدم** CHECK constraints مع `now()` — استخدم triggers بدلاً منها
- **لا تعدل** schemas محجوزة: `auth`, `storage`, `realtime`
- الأدوار **دائماً** في جدول `user_roles` المنفصل
- `has_role()` مع SECURITY DEFINER لتجنب التكرار في RLS

### النسخة الاحتياطية:
- ملف `sql/full_backup.sql` يحتوي على DDL + Functions + Triggers + RLS + Seed Data كاملة
- يمكن تنفيذه على قاعدة بيانات Supabase جديدة لإعادة إنشاء البنية بالكامل

---

## 12. Edge Functions

| الدالة | المسار | الغرض |
|--------|--------|-------|
| `seed-users` | `/functions/v1/seed-users` | إنشاء المستخدمين التجريبيين السبعة |
| `send-reminders` | `/functions/v1/send-reminders` | إرسال تذكيرات المواعيد |

---

## 13. خاتمة

المشروع في حالة **MVP متقدم** (~80% إنجاز). جميع الأساسيات (مصادقة، حجز، إشعارات، إعدادات) تعمل ديناميكياً من قاعدة البيانات مع حماية RLS شاملة. الفجوات الرئيسية هي:
1. **ملف المريض الشامل** مع timeline
2. **ربط أعمق** بين الجلسات والتحاليل والأشعة
3. **التقويم المتقدم** مع عرض حقيقي للمواعيد

الـ backup الكامل متوفر في `sql/full_backup.sql` ويمكن استخدامه لإعادة بناء البيئة بالكامل.
