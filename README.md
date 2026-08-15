# منصة مواقع الأعمال متعددة العملاء

> **حالة المستند:** مرجع حاكم للإنتاج.  
> **المنتج:** منصة SaaS ديناميكية بالكامل لإنشاء وتشغيل مواقع الشركات متعددة اللغات والقطاعات، مع حزم قابلة للتفعيل، Page Builder مُدار بالعقود، ولوحة تحكم واحدة وتطبيقات جوال أصلية.

## 1. الغرض وحدود المنتج

هذه المنصة ليست موقعًا واحدًا، وليست قالب WordPress، وليست مولد HTML ساكن. إنها **نظام تشغيل لمواقع الأعمال** يخدم شركات متعددة في قطاعات مثل المقاولات والطاقة الشمسية واللوجستيات والنقل والتصنيع والتعدين. يملك كل عميل موقعًا أو أكثر، نطاقات مخصصة، لغات متعددة، هوية بصرية، صفحات وإصدارات منشورة، وحزم قطاعية أو عامة يمكن تفعيلها أو تعطيلها وفق خطة العميل وصلاحياته.

يُرندر الموقع العام ديناميكيًا عبر PHP/Laravel وBlade في كل طلب. تُحفظ الصفحة كـ page/revision/blocks مهيكلة، ثم يحدد الطلب النطاق والعميل والموقع واللغة والإصدار المنشور والحزم الفعالة قبل الرندر. لا توجد عملية `static publishing` للصفحات، ولا يسمح للعميل بإدخال PHP أو JavaScript أو CSS حر داخل المحتوى.

| المجال | القرار المعتمد |
|---|---|
| مواقع الشركات العامة | Laravel + Blade + PHP Server-Side Rendering ديناميكي |
| API | Laravel JSON API منضبط بالعقود وversioning |
| تطبيقات Android وiOS | React Native + Expo؛ تعيد استخدام APIs والعقود وtokens لا HTML |
| لوحة التحكم | لوحة واحدة فوق Laravel باستخدام Backpack؛ لا Filament ولا لوحات منفصلة لكل عميل |
| بيانات العملاء | قاعدة MySQL مستقلة لكل عميل، وجميع الجداول InnoDB |
| بيانات المنصة | قاعدة MySQL مستقلة باسم `platform_core`، وجميع جداولها InnoDB |
| الاستضافة الأولى | Namecheap Shared Hosting لعدد 20–30 عميلًا بإنشاء متباعد ومراقب |
| الانتقال المستقبلي | VPS أو Dedicated أو Managed MySQL دون إعادة تصميم نموذج البيانات |

## 2. نطاق المستودع

يمثل هذا المستودع المصدر الحاكم لمنصة مواقع الأعمال متعددة العملاء. يبدأ تنفيذ المنتج ضمن هيكل `backend/`, `mobile/`, `contracts/`, `docs/`, و`infrastructure/` كما يحدد `TODO.md`. لا تدخل أي شفرة أو وثيقة أو أصل لا يخدم المعمارية المعتمدة إلى مسار التنفيذ.

## 3. المعمارية المرجعية

### 3.1 Control Plane وTenant Data Plane

تملك المنصة قاعدتي MySQL منطقية في كل مسار تشغيل: `platform_core` لإدارة المنصة، و`tenant_<slug>` لكل عميل. في بيئة الإنتاج سيكون هناك `platform_core` واحد وقاعدة مستقلة لكل Tenant، وليست قاعدة موحدة بكل العملاء. يظل التطبيق Laravel واحدًا ولوحة التحكم واحدة؛ العزل يقع في البيانات واتصالات قواعد البيانات، لا في نسخ الشفرة.

```text
طلب HTTP
  → Address Resolver في platform_core
  → Tenant Context غير قابل للتعديل ضمن الطلب
  → Tenant Database Manager يختار tenant_<slug>
  → Site + Locale + Published Revision + Active Packages
  → Component Renderer (Blade)
  → HTML ديناميكي
```

| قاعدة البيانات | تملك | لا تملك |
|---|---|---|
| `platform_core` | users، MFA، tenants، memberships، plans، entitlements، package catalog، domain mappings، tenant database registry، migration/provisioning runs، audit المنصة | pages، blocks، forms، leads، projects، media metadata، محتوى العميل |
| `tenant_<slug>` | sites، locales، theme tokens، pages، revisions، blocks، translations، menus، package activations، forms، media metadata، audit العميل، والجداول القطاعية | كلمات مرور المستخدمين، اشتراكات المنصة، أسرار قواعد بيانات أخرى، بيانات عملاء آخرين |

هوية المستخدم مركزية في `platform_core`. لا تنسخ accounts أو passwords داخل قواعد العملاء. أما مالك المحتوى أو ناشره في جداول العميل فيشار إليه عبر `platform_user_id` فقط.

### 3.2 الفصل الطبقي

يعتمد Backend على تنظيم عملي قريب من Modular Monolith، لا microservices مصطنعة:

```text
backend/
  app/Domain/            # قواعد الأعمال، القيمة، events، policies
  app/Application/       # use cases / actions / DTOs / workflows
  app/Infrastructure/    # MySQL repositories، storage، cache، adapters
  app/Http/              # Controllers، Requests، Resources، Middleware
  app/Modules/           # Identity، Tenancy، Sites، Content، Packages ...
  app/Admin/             # شاشات Backpack المخصصة
  resources/views/       # Blade themes وcomponent renderers
  database/
    platform/            # migrations وseeders لـ platform_core
    tenant/              # migrations وseeders المشتركة لكل Tenant DB
```

طبقة HTTP لا تتخذ قرارات النشر أو تفعيل الحزم أو عزل العميل. تستدعي Action أو Use Case واحدًا محددًا. والمكونات الإدارية لا تصل مباشرة إلى database models عند وجود workflow متعدد الخطوات؛ تستهلك Application Actions موثقة وقابلة للاختبار.

## 4. وحدات المنتج

| الوحدة | المسؤولية الأساسية |
|---|---|
| `Identity` | الحسابات، الجلسات، MFA، recovery، audit للمصادقة |
| `Tenancy` | tenant lifecycle، memberships، connection resolver، address mapping، provisioning |
| `Plans & Entitlements` | الخطط، التراخيص، حدود الحزم والاستخدام |
| `Sites` | المواقع، النطاقات، locales، settings، theme tokens، header/footer |
| `Content` | pages، revisions، workflow النشر، menus، redirects، SEO |
| `Components` | registry، schemas، variants، renderers، editor metadata، migrations بين الإصدارات |
| `Packages` | catalog، dependencies، compatibility، activation/config، capabilities |
| `Sector Blueprints` | حزم وقوالب افتراضية حسب القطاع مع إصدارات لا تغير العملاء بصمت |
| `Media` | uploads، metadata، variants، private access، retention، manifests |
| `Forms & Leads` | form contracts، submissions، spam controls، notifications، exports |
| `Localization & AI` | locales، glossary، JSON translation jobs، review workflow، usage log |
| `Admin` | لوحة واحدة، tenant/site switcher، RBAC، Marketplace، Page Builder، operations |
| `Mobile` | Expo application، auth، site/lead dashboards، APIs وtokens المشتركة |
| `Operations` | backup/restore drills، migrations، health checks، deployment، migration to VPS |

## 5. الحزم والـ Components: عقود لا حقول حرة

تُعرّف الحزم والقطاعات والـ components بالعقود الموجودة في `contracts/`. Code package جزء من release التطبيق، ويحتوي migrations وrenderers والسياسات والاختبارات. تفعيل الحزمة في Tenant DB لا يشغل migration ولا Composer ولا تنزيلات؛ ينشئ activation/config فقط بعد التحقق من entitlement والاعتماديات والتعارضات.

كل block على الصفحة يحمل `componentKey` و`componentVersion` و`props` متحققًا منهما. لا يتجاوز المحرر JSON schema للعقد. وتُستخدم variants وdesign tokens للاستايل بدلاً من CSS حر غير قابل للدعم.

## 6. نموذج النشر والتحرير

الإصدار المنشور هو مصدر الحقيقة للزوار. لا تغير المسودة الموقع الحي. تسير النسخ عبر الحالات:

```text
draft → in_review → approved → scheduled → published → superseded
                                     ↘ rollback إلى revision منشور سابق
```

يلزم Page Builder أن يوفر drag-and-drop قابلًا للوصول، live preview، responsive/RTL preview، autosave، content locks، conflict resolution، undo/redo داخل جلسة التحرير، global sections، header/footer builder، navigation builder، وSEO editor. كل قدرة من هذه القدرات لها معايير قبول في `TODO.md` قبل اعتبارها مكتملة.

## 7. الأداء والأمن

الديناميكية لا تعني استعلامات غير محدودة. يستخدم التطبيق fragment/data cache لـ domain mapping والحزم النشطة وtheme tokens والقوائم وview models البطيئة. يستخدم Laravel Cache abstraction كي يبدأ بـ file/database cache على shared hosting ثم ينتقل إلى Redis دون إعادة كتابة منطق الأعمال.

الأمان متطلب إطلاق وليس مرحلة تحسين:

| المجال | الضابط الأدنى |
|---|---|
| عزل العميل | Host موثق → TenantContext → DB connection صحيحة؛ لا tenant identifier من user request |
| الصلاحيات | membership + role + policy + site scope؛ لا إخفاء UI فقط |
| المحتوى | escaping افتراضي، HTML sanitization محدد، حظر PHP/JS/CSS الخام |
| الملفات | MIME/magic byte/size validation، private storage، authorization وسجلات تنزيل |
| HTTP | trusted hosts، CSRF، rate limits، CSP، secure cookies، security headers |
| الأسرار | لا كلمات مرور DB في جداول أعمال أو logs أو repository؛ secret references فقط |
| الاختبارات | IDOR، cross-tenant، privilege escalation، upload abuse، SSRF، XSS، workflow bypass |

## 8. التشغيل على Namecheap Shared Hosting

المرحلة الأولى تستهدف 20–30 Tenant بإنشاء متباعد. ينفذ provisioning بشكل متحكم به وقابل للاستئناف: إنشاء قاعدة MySQL وuser محدود الصلاحية من cPanel أو API موثقة بعد POC، ثم verify connection، migrations، seed، blueprint، domain mapping، وsmoke tests. لا يعتمد النظام على daemons أو workers دائمة أو cron عالي التواتر داخل shared hosting.

تنتقل البنية إلى VPS أو Dedicated عندما تظهر حاجة إلى Redis أو queue workers أو provisioning واسع أو معالجة وسائط كثيفة أو SLA/point-in-time recovery. يبقى نموذج البيانات والكود والعقود ثابتًا؛ يتغير driver والبنية التشغيلية فقط.

## 9. هيكل المستودع المستهدف

```text
.
├── backend/                     # Laravel production application
├── mobile/                      # Expo / React Native application
├── contracts/
│   ├── schemas/                 # JSON Schemas القابلة للتحقق
│   └── catalogs/                # package/component/sector/permission catalogs
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   ├── product/                 # PRD، NFR، UX flows، acceptance criteria
│   └── operations/              # deploy, backup, restore, migration, runbooks
├── infrastructure/
│   ├── shared-hosting/          # cPanel/deployment constraints and scripts
│   ├── vps/                     # future deployment configuration
│   └── ci/                      # validation and quality pipeline
├── README.md                    # هذا المرجع
└── TODO.md                      # خارطة التنفيذ القابلة للتدقيق
```

## 10. العقود والوثائق الحاكمة

| الملف | الحالة | الغرض |
|---|---|---|
| `TODO.md` | حاكم التنفيذ | مراحل، تبعيات، Definition of Done، quality gates |
| `contracts/schemas/package.schema.json` | قابل للتحقق | عقد حزمة قابل للتفعيل |
| `contracts/schemas/component.schema.json` | قابل للتحقق | عقد Component/Block وإصداره وprops |
| `contracts/schemas/sector-blueprint.schema.json` | قابل للتحقق | عقد تهيئة قطاعية إصدارية |
| `contracts/schemas/translation-job.schema.json` | قابل للتحقق | عقد JSON للترجمة بالذكاء الاصطناعي والمراجعة البشرية |
| `contracts/catalogs/packages.catalog.json` | أولي | الحزم الأساسية والقطاعية المعتمدة |
| `contracts/catalogs/sectors.catalog.json` | أولي | blueprints للقطاعات المدعومة أولًا |
| `contracts/catalogs/permissions.catalog.json` | حاكم | موارد وأفعال صلاحيات المنصة |
| `docs/adr/ADR-0001-platform-foundation.md` | معتمد | قرار تأسيس المنصة واعتماد Laravel/MySQL |
| `docs/product/PRD.md` | حاكم | نطاق المنتج، personas، workflows، NFRs |
| `docs/operations/production-readiness.md` | حاكم | متطلبات الإطلاق والتشغيل والترحيل |

## 11. قواعد المساهمة والتنفيذ

لا يبدأ تطوير feature من واجهة أو جدول عشوائي. يبدأ بالترتيب: قرار/عقد → migration → domain/application action → policy → API/admin/view renderer → tests → observability → documentation. أي feature لا يمر بالاختبارات والعقود وقياسات الأداء والأمن المحددة في `TODO.md` لا يُعتبر مكتملًا.

لا تعد هذه الوثيقة بوصول المنتج إلى «عدم الحاجة إلى أي تعديل لاحقًا»؛ ذلك وعد غير هندسي. لكنها تفرض أن تكون كل إضافة أو تعديل لاحق **متوافقًا بالعقود، قابلًا للترقية، مختبرًا، ومحدود الأثر** بدل ترقيعات تفرض إعادة بناء.

## 12. البداية

الخطوة المعتمدة هي تنفيذ **Phase 0–2** من `TODO.md`: تثبيت boundaries، إنشاء Laravel workspace وقاعدتي migrations، تطبيق tenancy والهوية، ثم بناء content/component/package foundations قبل أي شاشة تجميلية أو صفحة قطاعية.

---

**المراجع الخارجية:** تُحفظ المصادر المقيدة بالاستضافة وLaravel في `docs/operations/production-readiness.md` وتراجع عند لحظة النشر الفعلية؛ لا تعامل هذه الوثيقة كبديل عن التحقق من خطة Namecheap وإصدارات PHP/MySQL الفعلية للحساب.
