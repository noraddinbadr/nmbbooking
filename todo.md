# TODO — خارطة تنفيذ المنتج الإنتاجي

> **قاعدة العمل:** لا يُغلق بند لأنه «ظاهر في الواجهة». يغلق فقط بعد تحقق العقد، migration، الصلاحيات، الاختبارات، observability، التوثيق، ومعايير القبول ذات الصلة.  
> **الترتيب:** المراحل مرتبة تبعيًا ولا تبدأ مرحلة لاحقة إذا كانت بوابة جودة المرحلة السابقة غير ناجحة.

## حالات التنفيذ

| الرمز | المعنى |
|---|---|
| `[ ]` | لم يبدأ |
| `[-]` | قيد التنفيذ أو يحتاج قرارًا موثقًا |
| `[x]` | مكتمل ومتحقق منه |
| `[!]` | قرار أو مخاطرة تمنع التنفيذ |

---

## Phase 0 — الحوكمة وإعادة التأطير

- [ ] اعتماد اسم المنتج واسم النطاق والـ tenant slug policy.
- [ ] اعتماد نطاق المنتج وحدوده التقنية وخطة إصداراته قبل توسيع التنفيذ.
- [ ] تحديد مصير الشفرة الحالية: archive branch أو repository منفصل أو إزالة مصادق عليها؛ لا تُحذف قبل backup وقرار مكتوب.
- [ ] إنشاء `backend/`, `mobile/`, `infrastructure/`, و`contracts/` وفق README.
- [ ] إنشاء `CODEOWNERS` و`CONTRIBUTING.md` و`SECURITY.md` و`LICENSE` بعد قرار المالك.
- [ ] اعتماد semantic versioning للتطبيق والحزم والـ components والعقود.
- [ ] اعتماد naming conventions لقواعد العملاء، الملفات، public IDs، API routes، وpackage keys.
- [ ] إنشاء سجل قرارات ADR؛ كل تغيير في tenancy/storage/package lifecycle/deployment يحتاج ADR.
- [ ] تحديد بيئات `local`, `staging`, `production`، ومن يملك حق النشر لكل بيئة.
- [ ] تحديد الميزانية التشغيلية: العملاء الأوائل، المواقع لكل Tenant، الملفات، عدد اللغات، وحجم النسخ الاحتياطي.

### بوابة Phase 0

- [ ] README وPRD وADR-0001 متوافقة وتحدد المنتج الحالي وعقوده وحدوده بلا تعارض.
- [ ] لا توجد أسرار حقيقية في المستودع أو سجل Git.
- [ ] يوجد قرار مكتوب لمسار فصل الشفرة القديمة قبل أي تعديل جذري عليها.

---

## Phase 1 — Laravel Workspace وقواعد التطوير

- [x] تثبيت Laravel 13 على PHP 8.3 محليًا؛ يبقى التحقق من نسخة حساب Namecheap الحقيقي شرط نشر.
- [x] إنشاء تطبيق Laravel داخل `backend/` مع Composer lock وبنية Backend منفصلة.
- [-] تفعيل Pint وPHPStan/Psalm بمستوى صارم تدريجيًا؛ Pint وLarastan مفعّلان ويجتازان الشفرة عند المستوى 3، ومندمجان في CI؛ يبقى رفع مستوى التحليل تدريجيًا مع توسع الوحدات.
- [-] تفعيل PHPUnit أو Pest، وتهيئة coverage reports؛ PHPUnit مفعّل مع اختبارات تكامل MySQL للرندر والعزل والحزم والصحة وواجهات API، ويبقى تقرير التغطية ضمن CI.
- [-] إنشاء Modular Monolith؛ أنجزت boundaries الفعلية لـ `Modules/Tenancy`, `Sites`, `Content`, `Packages`, `Components` و`Admin`، وتستكمل طبقات Domain/Application/Infrastructure المنفصلة.
- [ ] تعريف قاعدة منع Controllers من احتواء workflow أو SQL مباشر.
- [ ] تعريف قاعدة منع Views/Admin Resources من تجاوز Policies وApplication Actions.
- [x] إنشاء error envelope موحد للـ API وcorrelation ID لكل طلب؛ نُفذ `X-Request-Id` آمن ومربوط بالـ response/log context، وAPI يعيد envelope آمنًا ثابتًا ومختبرًا للأخطاء المتوقعة.
- [-] إنشاء structured logging مع tenant/public request context من دون أسرار أو PII حساس؛ نُفذ request context، ويبقى إثراؤه بسياق Tenant/Audit وسياسة تنقيح البيانات.
- [x] إضافة health endpoints داخلية: app, platform-db, tenant-db, storage, cache؛ نُفذت جميع الفحوصات، ومساراتها محمية برمز مراقبة ومختبرة مركزيًا وضمن سياق عميل موثق.
- [x] إعداد Laravel Cache abstraction وdrivers المحلية؛ محلل العناوين يستخدم `CacheRepository` بمفتاح معزول ومختبر، ولا يعتمد منطق الأعمال على Redis مباشرة.
- [x] إعداد mail abstraction وfake driver للاختبارات؛ تدفقات المنصة تعتمد `EmailDispatcher` ورسالة Laravel قابلة للاختبار، واختبار mail fake يثبت عدم وجود إرسال خارجي.
- [x] إعداد filesystem disks: tenant-public وtenant-private وtemporary، مع public link للوسائط المنشورة فقط وفحص health ينظف أثره المؤقت.
- [x] إعداد Vite pipeline للـ admin assets والـ public theme assets؛ build ينجح محليًا عبر lockfile وخطوة build معرّفة في CI.

### بوابة Phase 1

- [-] `composer test`, static analysis, formatter, وbuild assets تعمل في CI من clone نظيف؛ contracts وVite وPint وLarastan وPHPUnit معرّفة في workflow المحلي، ويبقى دفعه وتأكيده على GitHub.
- [x] application boot لا يحتاج بيانات tenant عند CLI/migrations؛ اختبار `artisan about` يثبت الإقلاع من دون Tenant Context.
- [-] baseline security headers وerror handling لا يظهران stack traces في production mode؛ نُفذت CSP قابلة للضبط ورؤوس حماية وAPI error envelope واختُبرت، ويبقى smoke test صريح بوضع production قبل الإغلاق.

---

## Phase 2 — MySQL: Control Plane وTenant Schema

- [x] إنشاء اتصال `platform_core` وإعداد migrations منفصلة في `database/platform`.
- [x] إنشاء migrations مستقلة لقواعد العملاء في `database/tenant` وrunner `tenants:migrate` متسلسل يسجل نجاح أو فشل كل Tenant.
- [-] تفعيل `utf8mb4` وInnoDB وstrict connections في السكيما؛ تكتمل سياسة timezone وmigrations الموسعة ضمن التشغيل.
- [x] إنشاء `tenants` و`tenant_databases` و`site_addresses` و`provisioning_runs` و`tenant_migration_runs` ضمن migrations المنفصلة للمنصة.
- [-] إنشاء users, memberships, roles, permissions, MFA factors, sessions في `platform_core`؛ الجداول الأساسية موجودة، وأضيفت `mfa_factors` و`platform_sessions` باختبار سكيما؛ تبقى تدفقات الهوية وMFA العملية في المرحلة التالية.
- [x] إنشاء plans, subscriptions, entitlements, package catalog, package versions في `platform_core`.
- [-] تعريف database credentials references؛ تستخدم `tenant_databases.credential_ref` مرجعًا لا كلمة مرور وتوجد اختبارات عزل؛ تبقى واجهة secret provider الإنتاجية وسياسات التدوير.
- [x] إنشاء Tenant schema: sites, locales, settings, themes, pages, revisions, blocks, translations, menus, redirects.
- [x] إنشاء Tenant schema: package activations/configs, media assets/variants/links, forms/submissions, audit events.
- [ ] إنشاء infrastructure migrations للجداول القطاعية فقط عبر code packages.
- [ ] إضافة index review لكل query path: domain resolution، page render، publication، media، forms، admin lists.
- [ ] إضافة foreign keys وunique constraints وsoft-delete policy صريحة لكل كيان.
- [-] إنشاء seeders لـ `platform_core` وTenant مقاولات عربي/إنجليزي؛ تستكمل blueprints والقطاعات الأخرى.
- [x] إنشاء schema version tracking لكل قاعدة Tenant وتحديثه عبر runner الترحيل.
- [ ] كتابة restore-safe migrations وفق Expand → Data Migration → Contract.
- [x] اختبار حسابات MySQL محليًا: `platform_app` لا يقرأ `tenant_acme` و`tenant_acme_app` لا يقرأ `platform_core`.

### بوابة Phase 2

- [ ] يمكن إنشاء `platform_core` وTenant جديد من الصفر في بيئة CI/local.
- [ ] كل جدول يستخدم InnoDB وutf8mb4 ويملك primary key وفهارس مقصودة.
- [ ] migration tenant واحدة فاشلة لا تفسد حالة Tenant أو تؤثر على Tenant آخر.
- [ ] backup/restore dry-run موثق لقاعدة منصة وقاعدة Tenant واحدة.

---

## Phase 3 — Identity وTenancy وAddress Resolution

- [-] بناء registration/invitation/login/logout/password reset/email verification؛ نُفذت endpoints التسجيل والدخول والخروج والاستعادة والتحقق البريدي الموقّع، ودعوات برمز مجزأ وقبول ذري؛ تبقى واجهات الإدارة وتجارب المستخدم.
- [-] بناء MFA اختياري للمشرفين وrecovery codes وسياسة قفل الحساب؛ نُفذ TOTP مشفر وrecovery codes أحادية الاستعمال وتحدي دخول قصير العمر قبل إصدار API token، وتبقى سياسة قفل الحساب وإدارة عوامل متقدمة.
- [-] بناء `TenantMembership` مع role وsite scopes وحالة invitation/disabled؛ نُفذت نماذج العضوية والدعوة وقبول الدعوة الذري ونطاق الموقع، وتبقى واجهات إدارة الحالة وسياسات التعطيل.
- [-] بناء Permission catalog وربط role-permission ومصفوفة ownership؛ استيراد الكتالوج يحل وراثة الأدوار، وخدمة التفويض تتحقق من العضوية والدور ونطاق الموقع خادميًا باختبار تكامل؛ تبقى Laravel Policies ومصفوفة ownership الكاملة.
- [-] بناء `AddressResolver` للنطاق وplatform subdomain مع أطول path prefix؛ يحتاج workflow توثيق custom domain.
- [-] رفض host غير موثق وتطبيق trusted hosts/canonical host policy؛ أسطح المنصة والإدارة والصحة تقبل قائمة مضيفات صريحة وتُرجع 404 لغير الموثق باختبار تكامل؛ يبقى canonical redirect ونطاقات الإنتاج النهائية.
- [-] بناء `TenantContext` immutable لكل طلب HTTP مع Tenant DB Manager؛ يحتاج ربط background jobs عند تنفيذها.
- [x] بناء `TenantDatabaseManager` يختار connection من registry ولا يقبل connection key من request.
- [ ] بناء policies لكل موارد المنصة والمحتوى والنشر والملفات والحزم.
- [ ] بناء tenant/site switcher داخل لوحة واحدة فقط.
- [-] بناء tenant lifecycle: provisioning, active, suspended, failed, archived؛ نُفذت انتقالات الحالة المسموحة وتدقيقها والتحقق من جاهزية قاعدة العميل قبل التفعيل؛ يبقى provisioning القابل للاستئناف وواجهات الإدارة.
- [-] بناء suspend policy تمنع الرندر/الإدارة حسب نوع التعليق مع صفحة عامة آمنة؛ `AddressResolver` يرفض العميل غير النشط، وتبقى صفحة التعليق العامة وسياسة الإدارة التفصيلية.
- [ ] بناء provisioning workflow قابل للاستئناف وidempotent.
- [ ] بناء request audit للعمليات الحساسة: login، invitation، domain mapping، package activation، publish، download.

### بوابة Phase 3

- [ ] اختبارات cross-tenant وIDOR وrole escalation تمر جميعًا.
- [x] Host غير معروف يعيد 404/رفض آمن ولا يمكنه اختيار Tenant من URL parameter؛ يغلق `AddressResolver` نطاقات العميل غير الموثقة وسياسة المضيفات أسطح المنصة.
- [ ] مستخدم متعدد العضويات لا يرى أو يعدل إلا tenant/site scope المصرح بها.
- [ ] provisioning يعيد الحالة الصحيحة بعد failure/retry ولا ينشئ قاعدة أو membership مكررة.

---

## Phase 4 — Package Platform وSector Blueprints

- [x] تنفيذ `PackageManifest` من JSON Schema والتأكد من compatibility/version/dependencies/conflicts؛ الكتالوج يرفض المفاتيح المكررة والاعتماديات/التعارضات الذاتية أو المجهولة وقيود النسخ غير المتحققة، والتحقق مغطى بالاختبارات.
- [-] بناء package catalog مركزي وواجهة Marketplace داخل لوحة التحكم؛ كتالوج manifests وخدمة القائمة وصفحة Marketplace للقراءة داخل Backpack مكتملة ومختبرة، وتبقى actions إدارة الاستحقاقات والتفعيل/التعطيل عبر الواجهة.
- [x] بناء entitlement check حسب plan وTenant وموقع؛ خدمة مركزية تتحقق من entitlement المدرج والمفعّل وغير المنتهي وتنتج قائمة Marketplace خادمية، وتمنع activation عند السحب أو الانتهاء باختبار تكامل.
- [-] بناء `ActivatePackageAction` ضمن transaction: entitlement → dependencies → config defaults → seed → audit → cache invalidation؛ entitlement والتوافق والاعتماديات ودمج config defaults والتحقق والتدقيق الذري وcache invalidation منجزة ومختبرة، وتبقى seed hooks.
- [-] بناء `DisablePackageAction` مع سياسة البيانات: hide/retain/export/delete after retention؛ نُفذ الإيقاف بسياسة retain وتدقيق وإبطال cache ومنع تعطيل اعتماد نشط؛ تبقى export/delete after retention.
- [ ] منع أي migration أو Composer أو external download عند activation.
- [-] بناء package capabilities registry للـ admin menus/API routes/public components/background actions؛ سجل مركزي يشتق surfaces من manifests النشطة ويُبطل cache فور lifecycle change، والرندر المنشور يعتمد عليه لإخفاء البلوكات المعطلة؛ تبقى middleware وربط Backpack والـ jobs.
- [x] بناء package compatibility matrix وsemver rules؛ المتحقق يدعم caret/tilde/comparators/wildcards/alternatives ويقارن manifest بإصدار المنصة وPHP وLaravel وschema العميل، وتفشل الاعتماديات النشطة ذات النسخة غير المتوافقة.
- [x] كتابة package lifecycle tests: activate, duplicate, dependency, conflict, disabled render, rollback؛ تغطي الاختبارات activation الذري وidempotency وdependency غير المتوافقة وconflict وdisabled render وrollback في المسار القائم.
- [x] تنفيذ Sector Blueprint versioning وsnapshot عند إنشاء موقع؛ التطبيق يحفظ العقد الكامل مع checksum ونسخته في إعداد الموقع وتدقيقه، يسمح بإعادة التطبيق المتطابقة فقط ويرفض استبدال blueprint بعد التأسيس باختبار تكامل.
- [x] تنفيذ `ApplySectorBlueprintAction` مع dry-run/report قبل التفعيل؛ ينشئ صفحات مسودات فقط ويدمج defaults الحزم ثم يفعلها بلا نشر تلقائي وباختبار تكامل.
- [x] إضافة blueprints أولية: construction, solar-energy, logistics, transport, manufacturing, mining؛ جميعها متحققة بالعقد، وtransport/mining يستخدمان الحزم العامة بتكوينات افتراضية آمنة وتبقي الصفحات مسودات للمراجعة.
- [x] بناء حزم عامة: `seo.core`, `forms.leads`, `media.library`, `social.links`, `analytics.config`؛ عقودها وصلاحياتها وentitlements وcapabilities مكتملة، واختُبر تفعيل social/analytics مع تحقق config خادمي.
- [-] بناء حزم قطاعية أولية حسب catalog وقيودها؛ construction.projects وlogistics.fleet معرفتان ومتوافقتان ومغطاتان باختبارات lifecycle، وتبقى حزم قطاعات الطاقة والتصنيع والنقل والتعدين.

### بوابة Phase 4

- [-] تفعيل حزمة يغير capabilities المقصودة فقط ولا ينفذ migration أو يكسر موقعًا منشورًا؛ سجل capabilities والرندر واختباراتهما يثبتون surfaces المشتقة وإبطال cache، وتبقى حراسة كل route/menu/job وقاعدة منع migration.
- [-] إيقاف حزمة يخفي surface الخاص بها من public/admin/API وفق policy دون فقد صامت للبيانات؛ حالة التفعيل تحفظ كـ disabled مع البيانات وaudit، والرندر وسجل capabilities يخفيا surfaces المشتقة باختبارات تكامل؛ تبقى واجهات Backpack وAPI middleware.
- [-] أي package manifest غير مطابق للعقد يرفض في CI وقبل النشر؛ JSON Schema وmanifest graph يتحققان عند تحميل الكتالوج، وتبقى خطوة CI التي تثبت رفض fixture غير مطابق بصورة مستقلة.

---

## Phase 5 — Components، Themes، وPage Builder

- [x] تنفيذ Component Registry يقرأ key/version/renderer/variants/required packages من عقود JSON المصدرية.
- [-] تنفيذ JSON Schema validation server-side لكل block props قبل الحفظ والنشر؛ خدمة تتحقق من props الأصلية والمترجمة عند الحفظ لمسودة وعند الاعتماد وتمنع المحتوى غير الصالح باختبارات تكامل، وتبقى API/controller.
- [ ] تنفيذ component migration adapters للإصدارات غير المتوافقة.
- [x] بناء renderer registry في Blade ومنع class names أو templates من customer input؛ الرندر لا يعتمد إلا Blade view محصورًا تحت `themes.components` من manifest موثق ويتحقق من وجوده قبل التضمين.
- [x] بناء theme catalog وtheme tokens: colors, typography, spacing, radii, shadows, breakpoints؛ كتالوج عقود متحقق يغطي ثيمات جميع blueprints ويرتبط بفاحص العقود.
- [x] بناء site-level overrides وinheritance policy للـ theme tokens؛ resolver يورث tokens من theme القطاعي مع fallback آمن ويقبل فقط المفاتيح المصرح بها والقيم غير القابلة لحقن CSS، وتطبق tokens فعليًا في الرندر العام.
- [-] بناء Page, Revision, Block, Global Section, Header, Footer, Menu models وActions؛ نماذج Page/Revision/Block والترجمات قائمة، وAction ينشئ مسودة مستقلة بنسخ البلوكات والترجمات من المصدر المنشور، وتبقى global sections/header/footer/menu actions.
- [-] بناء content locks وoptimistic concurrency وconflict UI contract؛ `UpdatePageBlockAction` يقفل الصف ويطابق `lock_version` ويرفض stale writes ويدقق التعديل، وتبقى API وواجهة التعارض وlocks طويلة العمر.
- [-] بناء autosave workflow وrecovery للـ draft غير المنشور؛ Action للحفظ التلقائي يستخدم تحقق props وoptimistic lock ويكتب أثرًا مدققًا قابلًا للتتبع، وتبقى واجهة الاسترداد وجدولة العميل.
- [-] بناء drag-and-drop ordering مع keyboard accessibility؛ Action خادمي يعيد ترتيب كل بلوكات المسودة ذريًا مع إزاحة MySQL آمنة ويرفض القوائم الناقصة/المكررة، وتبقى واجهة السحب ولوحة المفاتيح.
- [-] بناء responsive preview وRTL/LTR preview وlocale preview؛ خدمة preview خادمية ترجع مسودة محددة مع locale/fallback وdirection وtheme tokens وترجمات البلوكات بلا لمس revision العامة، وتبقى واجهة responsive.
- [ ] بناء undo/redo داخل session مع حدود تخزين واضحة.
- [ ] بناء template library وclone-from-template مع revision provenance.
- [ ] بناء global sections وتحديثها بمراجعة impact قبل النشر.
- [ ] بناء navigation/header/footer editor بعقود صريحة.
- [ ] تنفيذ component catalog أولي: hero, rich-content, services-grid, projects-grid, gallery, CTA, FAQ, testimonials, team, map, contact-form, logo-wall, downloads.
- [ ] تنفيذ visual regression tests للمكونات الأساسية على desktop/tablet/mobile وRTL.

### بوابة Phase 5

- [-] لا يمكن حفظ block بprops لا تطابق schema أو بحزمة غير مفعلة؛ الحفظ في المسودة والاعتماد يرفضان props غير المطابقة، والرندر يخفي الحزمة غير المفعلة، وتبقى حماية API.
- [x] تعديل مسودة لا يغير public site قبل publish؛ إنشاء المسودة ينسخ revision المنشورة إلى draft جديد ببلوكات public IDs مستقلة ويبقي `published_revision_id` ومصدر الزوار دون تغيير باختبار تكامل.
- [-] conflict متزامن لا يؤدي إلى silent overwrite؛ Action الحفظ يفرض lock version ويرفض الكاتب المتأخر باختبار تكامل، وتبقى معالجة UX/API.
- [ ] جميع components الأساسية تمر accessibility وvisual regression baseline.

---

## Phase 6 — النشر والرندر العام وSEO

- [-] تنفيذ models وسكيما revisions والإصدار المنشور والرندر؛ Page/Revision/Block وapprove/publish ورندر revision منشورة مطبقة، وتبقى rollback وscheduler وسياسات النشر والمراقبة.
- [x] تعيين `published_revision_id` مصدر الحقيقة الوحيد للزوار؛ الرندر العام لا يجلب إلا page المنشورة وrevision المنشورة المشار إليها، وتغطيه اختبارات المسودة والرندر.
- [ ] تنفيذ publish approvals حسب permission/site policy.
- [ ] تنفيذ scheduler idempotent ملائم لقيود shared hosting.
- [ ] تنفيذ rollback مع audit ومقارنة revision ومحو cache مضبوط.
- [-] تنفيذ public route resolution لمواقع ولغات ومسارات منشورة؛ AddressResolver والرندر العام يدعمان tenant host وroutePath وlocale/fallback وdirection، وتبقى redirects وصفحات الأخطاء.
- [x] تنفيذ Blade rendering من component registry وحزم نشطة فقط؛ Renderer Registry يحصر Blade views في manifests موثقة وسجل capabilities يخفي البلوكات التابعة لحزمة معطلة.
- [ ] تنفيذ fragment cache keys باسم tenant/site/locale/revision/package-config version.
- [ ] تنفيذ cache invalidation matrix لكل publish/config/package/theme/menu change.
- [-] تنفيذ canonical URLs وhreflang وsitemap وrobots وRSS policy إن لزم؛ sitemap.xml وrobots.txt وcanonical وhreflang للغات الموقع النشطة مكتملة وتقتصر على الصفحات المنشورة، وتبقى RSS.
- [ ] تنفيذ metadata editor وOpen Graph/Twitter cards وJSON-LD policy.
- [ ] تنفيذ redirects 301/302 مع loop detection وimport/export.
- [ ] تنفيذ 404/410/maintenance pages tenant-aware.
- [ ] اختبار response headers وETag/Cache-Control حيث يلائم المحتوى الديناميكي.
- [ ] قياس query count وN+1 والـ render time لكل template/component path.

### بوابة Phase 6

- [ ] لا يمكن الوصول إلى draft أو future scheduled revision من public URL.
- [ ] publish/rollback يغير public output ويرفع audit/cache versions كما هو متوقع.
- [x] sitemap/robots/canonical/hreflang صحيحون لTenant ولغة ومسار؛ جميعها اختبرت لنطاق العميل والصفحات المنشورة واللغة النشطة.
- [ ] الصفحات الأساسية تتجاوز ميزانية الأداء المتفق عليها في staging.

---

## Phase 7 — المحتوى، الترجمة، AI، الوسائط، والنماذج

- [ ] بناء SiteLocale policy: default, fallback, direction, activation/deactivation.
- [ ] بناء Page/Block/SEO translations بدون نسخ block structure بين اللغات.
- [ ] تنفيذ slug uniqueness scoped بالموقع واللغة وسياسة redirects عند تغييره.
- [ ] تنفيذ glossary وbrand terms لكل Tenant/قطاع.
- [ ] تنفيذ Translation Job JSON contract وprovider abstraction وusage/cost ledger.
- [ ] تنفيذ human review queue؛ لا AI auto-publish.
- [ ] تنفيذ media upload pipeline: MIME, magic bytes, dimensions, size, hash, visibility, variants.
- [ ] تنفيذ WebP/AVIF/thumbnail/medium/large creation عبر job مناسب للبيئة.
- [ ] تنفيذ private downloads مع authorization وسجل تنزيل وexpiration policy.
- [ ] تنفيذ retention وgarbage collection للوسائط غير المرتبطة بحذر.
- [ ] تنفيذ form definitions من schemas وform submission anti-spam/rate limits/consent logs.
- [ ] تنفيذ lead notification routing وexport وstatus workflow.
- [ ] تنفيذ webhook/outbound integration policy مع retry/signature/audit.

### بوابة Phase 7

- [ ] الترجمة المخالفة للعقد لا تحفظ، ولا تنشر AI بلا approval.
- [ ] private asset غير قابل للتنزيل من رابط معلوم بلا authorization.
- [ ] uploads مضرة أو غير مطابقة أو متجاوزة للحدود ترفض وتُسجل بأمان.
- [ ] form abuse test وconsent/audit tests تمر.

---

## Phase 8 — لوحة Backpack الواحدة

- [ ] تثبيت Backpack وتهيئة brand/theme/RTL/accessibility baseline.
- [ ] بناء authentication bridge مع platform identity وMFA/policies.
- [ ] بناء tenant/site switcher في نفس اللوحة.
- [ ] بناء Dashboard عمليات: health، tenant status، provisioning/migration failures، content workflow.
- [ ] بناء screens مخصصة لـ Tenants، Addresses، Plans/Entitlements، Package Catalog، Blueprints.
- [ ] بناء screens مخصصة لـ Page Builder shell وrevision compare/approval/publish/rollback.
- [ ] بناء screens مخصصة لـ Media Library، Forms/Leads، Localization/AI review، SEO/Redirects.
- [ ] بناء screens operations: backups، migration runs، audit search، maintenance mode.
- [ ] منع auto-generated CRUD من أن يصبح الواجهة النهائية للـ product workflows.
- [ ] اختبار RTL، keyboard navigation، screen-reader labels، empty/loading/error states.
- [ ] اختبار permissions على كل screen/action/export/download.

### بوابة Phase 8

- [ ] يوجد Admin panel واحد فقط، وكل surface يطبق Tenant/Site scope وPolicy.
- [ ] screens الحرجة لا تحتوي N+1 أو load-all queries ولا تعتمد على client-side authorization.
- [ ] تدفقات publish/package/provisioning لا يمكن bypass لها من UI أو direct endpoint.

---

## Phase 9 — API وتطبيقات Expo

- [ ] تحديد API versioning, pagination, filtering, error envelope, idempotency conventions.
- [ ] كتابة OpenAPI contract وتوليد/التحقق من clients وأنواع الجوال.
- [ ] تنفيذ Sanctum أو auth strategy مع device/session lifecycle وrevocation.
- [ ] تنفيذ mobile scopes وtenant/site selection من membership لا من client claims.
- [ ] إنشاء Expo workspace مع lint/test/build profiles وenvironment management.
- [ ] بناء authentication, tenant/site switcher, dashboard, leads, content approvals, notifications screens.
- [ ] بناء design tokens shared package بصيغة platform-neutral.
- [ ] تنفيذ offline/read cache policy ومزامنة/error recovery واضحة.
- [ ] تنفيذ push notification abstraction وconsent/device registration.
- [ ] تنفيذ deep links وسياق tenant/site بأمان.
- [ ] اختبار iOS/Android accessibility وnetwork failure وtoken expiry.

### بوابة Phase 9

- [ ] API contract tests تمر بين Laravel وmobile client.
- [ ] التطبيق لا يقرأ بيانات Tenant آخر عند تبديل الحساب أو deep link مزور.
- [ ] build قابل للتوقيع والنشر التجريبي على Android/iOS من CI.

---

## Phase 10 — الأمن، الخصوصية، والموثوقية

- [ ] threat model رسمي: tenants، admin، editor، anonymous visitor، malicious uploader، compromised integration.
- [ ] مراجعة authentication/session/CSRF/CORS/CSP/headers/trusted hosts.
- [ ] مراجعة IDOR, cross-tenant, mass assignment, XSS, SQL injection, SSRF, open redirect, upload abuse.
- [ ] تفعيل rate limiting وسياسات lockout وCAPTCHA/turnstile قرارًا حسب النماذج.
- [ ] تنفيذ encryption policy للحقول الحساسة وkey rotation plan.
- [ ] تنفيذ data retention/deletion/export policy لكل Tenant.
- [ ] تنفيذ immutable-ish audit strategy مع append-only permissions وفصل platform/tenant audit.
- [ ] تنفيذ incident logging/alerting/runbook واستجابة key compromise.
- [ ] تنفيذ dependency/SBOM/vulnerability scanning وlicense review.
- [ ] تنفيذ backup encryption، restore access policy، وdisaster-recovery exercise.

### بوابة Phase 10

- [ ] يمر security review وDAST/SAST baseline ولا تبقى ثغرات حرجة/عالية بلا قرار مخاطرة موقع.
- [ ] تنجح restore drill وtenant data export/delete drill.
- [ ] لا يظهر PII أو token أو password في logs أو error responses أو analytics.

---

## Phase 11 — التشغيل والنشر وNamecheap

- [ ] التحقق من نسخ PHP/MySQL/extensions/cron/limits الفعلية للحساب المستهدف قبل deploy.
- [ ] إعداد `.env` production خارج public root، file permissions، ownership، وconfig cache.
- [ ] إعداد deployment runbook: maintenance، backup، code release، migrations platform، migrations tenants، smoke tests، rollback.
- [ ] إعداد cPanel domain/document-root strategy وSSL/renewal/redirect policy.
- [ ] إعداد queue/scheduler strategy المتوافقة مع حدود shared hosting؛ jobs قصيرة وidempotent فقط.
- [ ] إعداد health monitoring/uptime/error notifications بوسيلة لا تحتاج daemon محلي دائم.
- [ ] إعداد storage quotas وdatabase/dump size monitoring وretention cleanup.
- [ ] إعداد backup repository خارج الحساب أو قرار retention موثق قبل الحد التشغيلي.
- [ ] إجراء deploy rehearsal على staging مماثل.
- [ ] إجراء rollback rehearsal: code، platform DB، tenant DB، files، domains.

### بوابة Phase 11

- [ ] production deploy من clone/build artifact موثق وقابل للإعادة.
- [ ] smoke tests تغطي domain → tenant → page render → admin login → media private access.
- [ ] backup/restore/rollback drill ناجحان بزمن موثق.

---

## Phase 12 — الأداء، القبول، والإطلاق

- [ ] تعريف SLOs: availability، p95 public render، admin actions، error rate، RPO/RTO.
- [ ] إنشاء performance fixtures: Tenant بعدة مواقع ولغات وصفحات وblocks وحزم ووسائط.
- [ ] اختبار load واقعي على public routes وform submissions وadmin publish.
- [ ] مراجعة MySQL indexes وEXPLAIN لكل query حرج.
- [ ] مراجعة cache hit/miss وinvalidation correctness وno-cache data leaks.
- [ ] إنشاء end-to-end tests لتدفقات: provision، domain verification، activate package، create page، translate، approve، publish، rollback، disable package، restore.
- [ ] تنفيذ accessibility review للـ public themes ولوحة الإدارة والجوال.
- [ ] تنفيذ content/SEO review للقطاعات الأساسية.
- [ ] إجراء UAT مع مستخدم منصة ومحرر عميل ومراجع ناشر.
- [ ] إنشاء release notes، known limitations، support procedures، ومصفوفة escalation.
- [ ] اعتماد Go/No-Go مكتوب من مالك المنتج والهندسة والأمن والتشغيل.

### بوابة الإطلاق

- [ ] جميع بوابات Phase 0–12 ناجحة أو تحمل استثناءات موثقة ومقبولة من المالك.
- [ ] لا توجد أخطاء حرجة أو عالية مفتوحة بلا mitigation.
- [ ] توجد خطة مراقبة ونسخ واستعادة ودعم لليوم الأول بعد الإطلاق.
- [ ] tenant أول حقيقي يمر provisioning والنشر والاستعادة في بيئة production بصورة متحكم بها.

---

## Phase 13 — الانتقال إلى VPS أو Dedicated عند الحاجة

- [ ] تحديد triggers النقل: حدود التخزين/DB، throttling، SLA، Redis/workers، onboarding، أو media processing.
- [ ] تجهيز VPS/Dedicated/Managed MySQL وفق security baseline وIaC/automation المناسبة.
- [ ] نقل `platform_core` مع verification للـ schema والبيانات.
- [ ] نقل كل Tenant DB على دفعات مع checksum/schema/row count verification.
- [ ] نقل storage وفق manifest/checksum، مع private access validation.
- [ ] تنفيذ cutover مع maintenance window وDNS strategy وrollback window.
- [ ] تشغيل Redis/workers/provisioner/monitoring على الوجهة الجديدة تدريجيًا.
- [ ] إعادة اختبار security/performance/backup/restore على البيئة الجديدة.
- [ ] توثيق decommission للاستضافة القديمة بعد نجاح فترة الاستقرار.

---

## سجل العناصر المحظورة

- [ ] لا static HTML publishing للصفحات العامة.
- [ ] لا SQLite كمصدر حقيقة للمنصة أو بيانات العملاء.
- [ ] لا قاعدة مشتركة للعملاء في النطاق التشغيلي المعتمد؛ قاعدة MySQL مستقلة لكل Tenant.
- [ ] لا migrations أو Composer أو تنزيل كود عند تفعيل الحزمة.
- [ ] لا PHP/JS/CSS خام من إدخال العميل.
- [ ] لا لوحات تحكم متعددة ولا Filament.
- [ ] لا تكرار users/passwords بين `platform_core` وقواعد العملاء.
- [ ] لا secrets في source control أو logs أو business tables.
- [ ] لا اعتبار أي feature مكتملًا بلا اختبارات وصلاحيات وrunbook إن كان تشغيليًا.
