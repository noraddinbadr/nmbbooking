# PRD — منصة مواقع الأعمال متعددة العملاء

**الإصدار:** 1.0.0  
**الحالة:** معتمد كأساس تنفيذ  
**المنتج:** منصة SaaS لإدارة وبناء مواقع الأعمال متعددة اللغات والقطاعات.

## المشكلة

يتعامل فريق المنصة مع عملاء يطلبون مواقع شركات مختلفة في التصميم والمحتوى والقطاع، مع احتياجات متباينة في الصفحات والنماذج والمشاريع وSEO واللغات. بناء موقع منفصل لكل عميل يكرر الشفرة ويصعب التحديث، بينما CMS عام بحقول مفتوحة لا يضمن جودة العرض أو أمانه أو قابلية تشغيله. المطلوب منتج واحد منظم يسمح بتكوين موقع مخصص دون تحويل كل عميل إلى fork برمجي.

## المستخدمون

| الشخصية | الهدف | ما لا يملك حقه |
|---|---|---|
| مالك المنصة | إدارة العملاء والخطط والحزم والتشغيل | تعديل محتوى العميل اليومي بلا سبب تشغيلي |
| مشغل المنصة | إنشاء العميل، الربط بالنطاق، معالجة failures | تجاوز سياسات البيانات أو النشر دون audit |
| مالك العميل | إدارة أعضاء شركته ومواقعها وحزمها وفوترتها | الوصول إلى بيانات عميل آخر أو إعدادات المنصة الحساسة |
| محرر الموقع | كتابة المحتوى وبناء الصفحات وترجمة المسودات | النشر النهائي إذا لم يملك الصلاحية |
| مراجع/ناشر | مراجعة المحتوى واعتماده وجدولته واستعادته | تحرير كل إعدادات tenant أو platform |
| زائر الموقع | تصفح صفحة شركة سريعة ومتاحة بلغته | الوصول إلى المسودات أو البيانات الخاصة |
| مستخدم التطبيق | متابعة مواقع/Leads/اعتمادات ضمن عضويته | اختيار Tenant أو scope مزور من العميل |

## أهداف المنتج

1. إنشاء موقع أعمال ديناميكي بالكامل من بيانات منظمة وإصدار منشور.
2. ربط كل طلب بنطاق وموقع ولغة وTenant صحيحة قبل الوصول إلى بيانات المحتوى.
3. تمكين الحزم والقطاعات من إضافة capabilities منضبطة من دون fields عشوائية أو runtime migrations.
4. دعم العربية RTL والإنجليزية وغيرها مع ترجمة AI تعتمد JSON schema ومراجعة بشرية.
5. تقديم Page Builder حقيقي يخدم المحرر مع revisions وpreview وreview/publish/rollback.
6. حماية العزل متعدد العملاء، الملفات، النماذج، workflows، وواجهات API من اليوم الأول.
7. تشغيل 20–30 عميلًا على shared hosting بإنشاء متباعد ثم الانتقال إلى VPS/Dedicated بلا إعادة تصميم.

## خارج النطاق في الإصدار التأسيسي

| العنصر | سبب الاستبعاد أو التأجيل |
|---|---|
| إنشاء كود/حزمة طرف ثالث من زر العميل | خطر أمني وتشغيلي؛ الحزم لا تدخل إلا مع release مراجع |
| موقع static publishing | يتعارض مع قرار الرندر الديناميكي الكامل |
| Marketplace خارجي للمطورين غير الموثوقين | يحتاج sandbox, signing, review, legal process غير موجودة بعد |
| محرر CSS/JS/PHP حر للعميل | يوسع سطح XSS/RCE ويفقد ضمان الجودة |
| WebSocket أو worker دائم على shared hosting | يؤجل إلى VPS/Managed runtime |
| Billing/Payments provider محدد | يحتاج قرار بلد ومزود وسياسات مالية منفصلة |

## تدفقات المنتج الحاكمة

### 1. إنشاء Tenant وموقع أول

```text
Platform operator
  → Tenant record (provisioning)
  → MySQL tenant database + restricted user
  → Verify connection
  → tenant schema migrate
  → seed packages/sector blueprint/theme
  → create admin membership
  → verify address/domain
  → smoke tests
  → Tenant active
```

لا يعرض الموقع للعامة قبل نجاح smoke tests. تكون كل خطوة idempotent ومسجلة في `provisioning_runs`، ويمكن إعادة تشغيل الخطوة الفاشلة من دون خلق memberships أو pages أو databases مكررة.

### 2. إنشاء صفحة ونشرها

```text
Editor creates/opens page
  → draft revision + validated component blocks
  → autosave and conflict detection
  → reviewer changes state to in_review/approved
  → publisher publishes or schedules
  → pages.published_revision_id updates atomically
  → cache invalidation + audit event
  → visitor sees new dynamic output
```

### 3. تفعيل حزمة

```text
Tenant owner requests activation
  → check plan entitlement
  → check dependencies/conflicts/compatibility
  → write package activation/config in Tenant DB
  → seed allowed defaults
  → invalidate scoped cache
  → show capabilities in public/admin/API
```

أي فشل يعيد transaction أو يضع activation في `error` مع سبب قابل للتشخيص. لا تتغير schema وقت التفعيل.

### 4. ترجمة بالذكاء الاصطناعي

```text
Editor selects translatable subject and target locale
  → validate JSON subject against component/page contract
  → create translation job
  → provider returns JSON fields only
  → validate result against contract and glossary
  → save translation draft
  → human approval
  → publication workflow
```

## المتطلبات الوظيفية الأساسية

| المجال | المتطلبات |
|---|---|
| Tenancy | قاعدة MySQL مستقلة لكل Tenant، مواقع متعددة، نطاقات مخصصة وsubdomains، statuses وsuspension |
| Content | pages/revisions/blocks/global sections/header/footer/menus/redirects/SEO |
| Builder | component catalog، drag-drop، variants، design tokens، responsive/RTL preview، autosave، undo/redo، locks |
| Packages | catalog، compatibility، dependencies/conflicts، entitlement، activation/config، disable retention policy |
| Localization | locale settings، translations، slug scoping، glossary، AI review queue، hreflang |
| Media | public/private assets، variants، metadata، access control، storage quotas، cleanup policy |
| Forms | schema-driven forms، submissions، anti-spam، consent، status workflow، notifications/export |
| Admin | لوحة واحدة، RBAC، tenant/site switcher، operational views، audit، package/blueprint marketplace |
| Mobile | Expo apps لنطاق العمليات والإدارة، Laravel APIs مقيدة بالعقود وعضويات المستخدم |
| Operations | provisioning، migration runs، backups، restore drills، health checks، deployment/rollback |

## المتطلبات غير الوظيفية

| المجال | المتطلب القابل للقياس قبل الإطلاق |
|---|---|
| العزل | 100% من اختبارات cross-tenant/IDOR/role escalation ناجحة |
| الإتاحة | SLO أولي يحدد بعد اختبار shared hosting وقياس uptime monitoring |
| الأداء | تحدد ميزانية p95 وquery count لكل route عام وadmin action في staging قبل Go/No-Go |
| الاستعادة | restore drill ناجح ومقاس لـ platform_core وTenant واحد على الأقل |
| الإصدارات | جميع releases قابلة للrollback وخالية من destructive schema change غير مرحلي |
| الوصولية | WCAG review للمكونات الأساسية واللوحة، RTL وkeyboard navigation |
| الملاحظة | correlation IDs، audit للعمليات الحساسة، health checks، logs بلا أسرار |
| الأمن | لا ثغرات حرجة/عالية مفتوحة بلا mitigation معتمد قبل الإطلاق |

## معايير نجاح الإصدار الأول

يعتبر الإصدار الأول جاهزًا للاستخدام التجاري المحدود عندما يمكن لمشغل المنصة إنشاء Tenant، ربط نطاقه، اختيار قطاع، تفعيل حزم مرخصة، بناء صفحة عربية/إنجليزية، مراجعتها ونشرها واستعادتها، استقبال lead آمن، تصدير بياناته، وعمل restore مستقل لقاعدة ذلك العميل. يجب أن تتم هذه السلسلة على staging وproduction مع سجل تدقيق واختبارات عزل وأمن وأداء مقبولة.

## القرارات المعلّقة التي تحتاج مالك المنتج

1. اسم المنتج النهائي وسياسة العلامة التجارية والمنصات/النطاقات.
2. مزود المدفوعات والبلدان والعملات والفوترة والضرائب.
3. مزود البريد ومزود إرسال الرسائل/MFA.
4. مزود الذكاء الاصطناعي والحدود السعرية وسياسة الاحتفاظ بالبيانات.
5. وجهة backup الخارجية وسياسة RPO/RTO النهائية.
6. scope أول تطبيق جوال: العمليات الداخلية فقط أم portal للعميل أيضًا.
7. سياسة دعم Subdirectory؛ الافتراضي هو custom domain وplatform subdomain.
