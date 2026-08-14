# Production Readiness — التشغيل، النشر، والاستعادة

**الحالة:** متطلب إلزامي قبل أول إطلاق تجاري.  
**البيئة الأولى:** Namecheap Shared Hosting لعدد محدود من العملاء وقواعد MySQL مستقلة.  
**البيئة المستهدفة للنمو:** VPS أو Dedicated أو Managed MySQL حسب triggers المحددة.

## 1. مبدأ التشغيل

تعتمد المنصة على تطبيق Laravel واحد وقاعدة `platform_core` وقاعدة MySQL مستقلة لكل Tenant. لا يجعل shared hosting هذا التصميم غير صحيح عند 20–30 عميلًا وإنشاء متباعد، لكنه يفرض تشغيلًا متحكمًا به: لا workers دائمة، لا provisioning واسع متزامن، لا jobs كثيفة، ولا عمليات cron متقاربة أو غير idempotent. تتحقق نسخة PHP وامتداداتها، وإعداد MySQL، وحدود الخطة الفعلية في cPanel قبل كل إطلاق؛ لا تعتمد وثيقة على افتراض التسويق أو بيئة التطوير.

## 2. مصفوفة الجاهزية

| المجال | شرط البداية | دليل التحقق |
|---|---|---|
| PHP | إصدار Laravel المدعوم، PDO MySQL، mbstring، openssl، fileinfo، intl حسب المنتج | `php -m` وhealth endpoint من حساب staging |
| MySQL | InnoDB، utf8mb4، users أدنى صلاحية، backup/restore متاح | schema check و`SHOW TABLE STATUS` وrestore drill |
| Files | private/public paths خارج أو محمية عن web root بحسب نوع الملف | upload/download authorization tests |
| cron | jobs قصيرة idempotent بتواتر موافق للخطة | scheduled job log + retry test |
| SSL/Domains | SSL فعال وcanonical host وredirect policy | external HTTPS and host-header tests |
| Cache | file/database driver وعزل keys حسب tenant/site/locale/version | cache-leak regression test |
| Secrets | env/config محمية لا داخل repo أو business tables | secret scan وpermission review |
| Monitoring | uptime/health/error notifications ومراجعة logs | simulated failure notification |

## 3. تدفق النشر

كل deploy ينفذ من build artifact مع إصدار معروف. لا تعدل ملفات production يدويًا إلا في runbook حادث موثق.

```text
1. Preflight: CI green, contracts valid, security scan accepted, backup verified
2. Enable maintenance window إن كانت migration غير متوافقة
3. Deploy immutable application artifact
4. composer install --no-dev / asset build خارج production إن أمكن
5. Laravel optimize/config cache وفق البيئة
6. platform_core migrations
7. tenant migrations بالتتابع مع tenant_migration_runs
8. cache clear/rebuild بالمفاتيح الصحيحة
9. smoke tests: domain→tenant→page, admin login, publish, private media
10. disable maintenance, observe, record release
```

لا تنفذ tenant migrations متوازية في shared hosting. كل Tenant له status: `pending`, `running`, `succeeded`, `failed`, `rolled_back`. عند failure يتوقف rollout ويطبق runbook التحقيق/rollback، ولا ينتقل للعميل التالي.

## 4. النسخ الاحتياطي والاستعادة

| الأصل | النسخة | التواتر وسياسة الاحتفاظ | اختبار الاستعادة |
|---|---|---|---|
| `platform_core` | logical MySQL dump مشفر | حسب RPO المعتمد؛ يحتفظ خارج حساب الويب | restore إلى قاعدة معزولة وفحص counts/schema |
| `tenant_<slug>` | logical dump مشفر مستقل لكل Tenant | حسب الخطة وحجم البيانات؛ manifest بإصدار schema | restore Tenant واحد وsmoke test domain/content |
| tenant storage | manifest + checksum + نسخة خارجية | متسق مع DB backup point | read private/public media بعد restore |
| application release | git tag/artifact/lock files | لكل deploy | rollback artifact على staging |

يجب مراقبة حجم قواعد البيانات وملفات dumps ووسائط العميل قبل حدود الاستضافة. لا يحفظ dump داخل public root. لا تمنح ملفات backup صلاحيات تنزيل عامة. يختبر restore على الأقل كل ربع سنة وكل تغيير كبير في schema أو storage.

## 5. Provisioning Tenant

لا يصبح Tenant نشطًا لمجرد إنشاء record. يتبع المشغل runbook:

1. إنشاء `tenant` في `provisioning` واختيار plan/sector/default locale.
2. إنشاء قاعدة MySQL وuser أدنى صلاحية عبر cPanel أو آلية API مثبتة للحساب.
3. تسجيل connection reference من دون كشف credential في admin UI أو logs.
4. التحقق من الاتصال ثم تشغيل tenant migrations وseeders.
5. تطبيق Sector Blueprint وحزم required/default فقط.
6. إنشاء أول site وعضوية مالك العميل وعنوان platform subdomain.
7. إجراء domain/site/page/policy/media smoke tests.
8. تسجيل audit وتغيير status إلى `active`.

كل خطوة idempotent. يعاد تشغيل failure من آخر checkpoint ولا يجرى cleanup مدمر بلا export/backup واضح.

## 6. الصحة والمراقبة

| الفحص | التوقع | التصرف عند الفشل |
|---|---|---|
| application health | boot/config/cache/log path صحي | منع release أو تفعيل maintenance |
| platform DB | اتصال وquery بسيطة وزمن ضمن SLO | إيقاف provisioning/العمليات الإدارية الحساسة |
| tenant DB | اتصال + schema version + read published page | عزل Tenant المتأثر وإظهار صفحة آمنة لا خطأ عام |
| storage | write/read test محدود ومحمٍ | إيقاف uploads وتسجيل alert |
| scheduler | آخر تنفيذ ونتيجة/مدة | تشغيل retry آمن أو تدخل يدوي |
| backups | آخر نسخة ناجحة وقابلة للاستعادة | تصعيد فوري قبل حذف أو deploy جديد |
| TLS/domain | certificate/canonical routes صحية | تجميد domain activation وإصلاح DNS/SSL |

تحتوي logs على request/correlation ID وtenant public ID عند اللزوم، لكنها لا تحتوي secrets أو payload نماذج حساس أو ملفًا خاصًا كاملًا.

## 7. الحوادث والrollback

| الحالة | الاستجابة الأولى |
|---|---|
| deploy أدى إلى أخطاء عامة | maintenance محدود، rollback artifact، حفظ logs/correlation IDs |
| platform migration فاشلة | وقف rollout، restore أو forward-fix وفق ADR migration، لا تستمر tenant migration |
| tenant migration فاشلة | عزل العميل، restore آخر backup أو rollback migration، لا يمس tenants الآخرين |
| تسريب محتمل بين العملاء | تعليق endpoint/tenant المتأثر، حفظ الأدلة، credential/session review، incident process |
| ملف خاص مكشوف | إبطال signed URLs، تغيير storage key عند الحاجة، audit access، مراجعة policy |
| فقدان/فساد media | restore manifest/objects والتحقق من checksums قبل re-enable |

## 8. Triggers الانتقال إلى VPS أو Dedicated

ينقل التطبيق قبل أن تصبح shared hosting سبب عطل عندما يوجد واحد أو أكثر من التالي:

- throttling متكرر بعد تحسين queries/cache.
- الحاجة إلى Redis أو queue worker أو WebSocket أو media processing ثقيل.
- onboarding متزامن أو عدد قواعد عملاء يجعل provision/migration اليدويين غير آمنين.
- التزام SLA أو RPO/RTO لا يمكن إثباته على shared hosting.
- قرب storage/database/dump quotas أو تعقيد backup lifecycle.
- طلب عزل تنظيمي/تعاقدي أو قاعدة مدارة لعميل Enterprise.

## 9. Runbook الانتقال

1. تجهيز الوجهة الجديدة وإثبات PHP/Laravel/MySQL/storage compatibility في staging.
2. نقل `platform_core` ثم كل Tenant DB مع schema/count/checksum checks.
3. نسخ storage وفق manifest/checksum والتحقق من private/public permissions.
4. تشغيل application release نفسه مع tenant database registry محدثة.
5. maintenance window، final delta، DNS/host cutover، smoke tests، وmonitoring مكثف.
6. الاحتفاظ بالوجهة القديمة read-only داخل rollback window.
7. تفعيل Redis/workers/provisioner تدريجيًا بعد استقرار المسار الأساسي، لا مع cutover نفسه.

## 10. مراجع يجب مراجعتها عند النشر

- Namecheap Shared Hosting resource restrictions: https://www.namecheap.com/support/knowledgebase/article.aspx/157/22/do-you-have-any-server-resource-restrictions/
- Namecheap Hosting Acceptable Use Policy: https://www.namecheap.com/legal/hosting/aup/
- Namecheap cPanel database management: https://www.namecheap.com/support/knowledgebase/article.aspx/9363/2180/how-to-create-and-maintain-databases-in-cpanel/
- Laravel Deployment: https://laravel.com/docs/13.x/deployment
- Laravel Cache: https://laravel.com/docs/13.x/cache

> تخضع هذه المصادر والتفاصيل التشغيلية لتغيير المزود والإصدار. يثبت فريق التشغيل إعداد الحساب الفعلي عبر staging قبل أي التزام إنتاجي.
