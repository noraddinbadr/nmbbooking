<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class AcmeConstructionSeeder extends Seeder
{
    private const TENANT_PUBLIC_ID = '01JZZZZZZZZZZZZZZZZZZZZZZZ';

    private const SITE_PUBLIC_ID = '01JZZZZZZZZZZZZZZZZZZZZZZY';

    private const PAGE_PUBLIC_ID = '01JZZZZZZZZZZZZZZZZZZZZZZX';

    public function run(): void
    {
        $platform = DB::connection('platform');
        $tenant = DB::connection((string) config('platform.tenant_connection_name'));

        $platform->transaction(function () use ($platform): void {
            $owner = User::query()->updateOrCreate(
                ['email' => 'owner@example.test'],
                ['name' => 'Platform Owner', 'password' => Hash::make('ChangeMe_2026!'), 'status' => 'active'],
            );
            $ownerRoleId = (int) $platform->table('roles')->where('key', 'platform-owner')->value('id');
            $platform->table('platform_user_roles')->updateOrInsert([
                'user_id' => $owner->id,
                'role_id' => $ownerRoleId,
            ]);

            $platform->table('tenants')->updateOrInsert(
                ['slug' => 'acme'],
                [
                    'public_id' => self::TENANT_PUBLIC_ID,
                    'name' => 'شركة Acme للمقاولات',
                    'status' => 'active',
                    'data_placement' => 'shared_host',
                    'timezone' => 'Asia/Riyadh',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $tenantId = (int) $platform->table('tenants')->where('slug', 'acme')->value('id');
            $platform->table('tenant_databases')->updateOrInsert(
                ['tenant_id' => $tenantId],
                [
                    'connection_key' => 'tenant_acme',
                    'database_name' => 'tenant_acme',
                    'db_host' => '127.0.0.1',
                    'db_port' => 3306,
                    'db_username' => 'tenant_acme_app',
                    'credential_ref' => 'local://tenant-acme/runtime',
                    'schema_version' => '1.0.0',
                    'status' => 'ready',
                    'last_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $platform->table('site_addresses')->updateOrInsert(
                ['hostname' => 'acme.localhost', 'path_prefix' => '/'],
                [
                    'tenant_id' => $tenantId,
                    'site_public_id' => self::SITE_PUBLIC_ID,
                    'address_type' => 'platform_subdomain',
                    'is_primary' => true,
                    'status' => 'active',
                    'verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            foreach ($platform->table('package_definitions')->pluck('id', 'package_key') as $packageKey => $packageId) {
                $platform->table('tenant_entitlements')->updateOrInsert(
                    ['tenant_id' => $tenantId, 'package_id' => $packageId],
                    ['is_enabled' => true, 'expires_at' => null, 'created_at' => now(), 'updated_at' => now()],
                );
            }
        });

        $tenant->transaction(function () use ($tenant): void {
            $tenant->table('sites')->updateOrInsert(
                ['code' => 'main'],
                [
                    'public_id' => self::SITE_PUBLIC_ID,
                    'name' => 'شركة Acme للمقاولات',
                    'default_locale' => 'ar',
                    'status' => 'active',
                    'published_content_version' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $siteId = (int) $tenant->table('sites')->where('code', 'main')->value('id');
            foreach ([['ar', 'rtl', true], ['en', 'ltr', false]] as [$locale, $direction, $isDefault]) {
                $tenant->table('site_locales')->updateOrInsert(
                    ['site_id' => $siteId, 'locale' => $locale],
                    ['direction' => $direction, 'is_default' => $isDefault, 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
                );
            }

            $tenant->table('pages')->updateOrInsert(
                ['site_id' => $siteId, 'route_path' => '/'],
                [
                    'public_id' => self::PAGE_PUBLIC_ID,
                    'page_type' => 'landing',
                    'status' => 'published',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
            $pageId = (int) $tenant->table('pages')->where('site_id', $siteId)->where('route_path', '/')->value('id');

            $tenant->table('page_revisions')->updateOrInsert(
                ['page_id' => $pageId, 'revision_no' => 1],
                [
                    'template_key' => 'construction.home.v1',
                    'status' => 'published',
                    'created_by_platform_user_id' => 1,
                    'published_by_platform_user_id' => 1,
                    'published_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
            $revisionId = (int) $tenant->table('page_revisions')->where('page_id', $pageId)->where('revision_no', 1)->value('id');
            $tenant->table('pages')->where('id', $pageId)->update(['published_revision_id' => $revisionId, 'updated_at' => now()]);

            $tenant->table('page_translations')->updateOrInsert(
                ['page_id' => $pageId, 'locale' => 'ar'],
                ['site_id' => $siteId, 'title' => 'شركة Acme للمقاولات', 'slug' => 'الرئيسية', 'seo_json' => json_encode(['description' => 'مقاولات هندسية وتنفيذ منضبط'], JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()],
            );
            $tenant->table('page_translations')->updateOrInsert(
                ['page_id' => $pageId, 'locale' => 'en'],
                ['site_id' => $siteId, 'title' => 'Acme Construction', 'slug' => 'home', 'seo_json' => json_encode(['description' => 'Engineering and disciplined delivery'], JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()],
            );

            $heroId = Str::ulid()->toBase32();
            $servicesId = Str::ulid()->toBase32();
            $tenant->table('page_blocks')->updateOrInsert(
                ['page_revision_id' => $revisionId, 'position' => 10],
                ['public_id' => $heroId, 'component_key' => 'hero.split', 'component_version' => '2.1.0', 'enabled' => true, 'variant_key' => 'industrial-dark', 'props_json' => json_encode(['title' => 'نبني مشاريع تصمد أمام الزمن', 'subtitle' => 'خبرة هندسية وتنفيذ منضبط من التخطيط حتى التسليم.', 'cta' => ['label' => 'اطلب عرضًا', 'href' => '/contact']], JSON_THROW_ON_ERROR), 'style_json' => json_encode([], JSON_THROW_ON_ERROR), 'visibility_rules_json' => json_encode([], JSON_THROW_ON_ERROR), 'lock_version' => 1, 'created_at' => now(), 'updated_at' => now()],
            );
            $tenant->table('page_blocks')->updateOrInsert(
                ['page_revision_id' => $revisionId, 'position' => 20],
                ['public_id' => $servicesId, 'component_key' => 'services.grid', 'component_version' => '1.0.0', 'enabled' => true, 'variant_key' => 'cards', 'props_json' => json_encode(['heading' => 'خدماتنا الأساسية', 'items' => [['title' => 'مقاولات عامة', 'summary' => 'تنفيذ منضبط للمشروعات.'], ['title' => 'إدارة مشروعات', 'summary' => 'حوكمة وتسليم ضمن الجدول.'], ['title' => 'بنية تحتية', 'summary' => 'حلول متكاملة قابلة للتوسع.']]], JSON_THROW_ON_ERROR), 'style_json' => json_encode([], JSON_THROW_ON_ERROR), 'visibility_rules_json' => json_encode([], JSON_THROW_ON_ERROR), 'lock_version' => 1, 'created_at' => now(), 'updated_at' => now()],
            );

            foreach ([
                ['media.library', '1.0.0', 'tenant', null, []],
                ['seo.core', '1.0.0', 'site', $siteId, ['generateSitemap' => true, 'allowNoindex' => false]],
                ['forms.leads', '1.0.0', 'site', $siteId, ['antiSpam' => true, 'recipientEmails' => []]],
                ['construction.projects', '1.0.0', 'site', $siteId, ['featuredLimit' => 6]],
            ] as [$key, $version, $scope, $scopeSiteId, $config]) {
                $tenant->table('package_activations')->updateOrInsert(
                    ['package_key' => $key, 'scope_type' => $scope, 'site_id' => $scopeSiteId],
                    ['package_version' => $version, 'status' => 'active', 'config_json' => json_encode($config, JSON_THROW_ON_ERROR), 'enabled_by_platform_user_id' => 1, 'enabled_at' => now(), 'created_at' => now(), 'updated_at' => now()],
                );
            }
        });
    }
}
