<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Models\PageTranslation;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class ApplySectorBlueprintAction
{
    public function __construct(
        private SectorBlueprintCatalog $blueprints,
        private PackageCatalog $packages,
        private ActivatePackageAction $activatePackage,
    ) {}

    /**
     * @return array{dry_run: bool, sector_key: string, blueprint_version: string, packages: array<int, string>, pages: array<int, string>}
     */
    public function execute(
        TenantContext $context,
        Site $site,
        string $sectorKey,
        int $actorPlatformUserId,
        bool $dryRun = false,
    ): array {
        $blueprint = $this->blueprints->require($sectorKey);
        $packageKeys = [];
        $pagePaths = [];

        foreach ($blueprint['packages'] as $package) {
            if (($package['activationMode'] ?? 'optional') !== 'optional') {
                $packageKeys[] = (string) $package['packageKey'];
            }
        }
        foreach ($blueprint['templates'] as $template) {
            $pagePaths[] = (string) $template['routePath'];
        }

        $report = [
            'dry_run' => $dryRun,
            'sector_key' => $sectorKey,
            'blueprint_version' => (string) $blueprint['version'],
            'packages' => $packageKeys,
            'pages' => $pagePaths,
        ];

        if ($dryRun) {
            return $report;
        }

        DB::connection((string) config('platform.tenant_connection_name'))->transaction(function () use ($site, $blueprint, $sectorKey, $actorPlatformUserId): void {
            $site->forceFill(['default_locale' => $blueprint['defaultLocale']])->save();
            DB::connection((string) config('platform.tenant_connection_name'))->table('site_settings')->updateOrInsert(
                ['site_id' => $site->id, 'setting_key' => 'sector.blueprint'],
                [
                    'value_json' => json_encode([
                        'sector_key' => $sectorKey,
                        'version' => $blueprint['version'],
                        'theme' => $blueprint['theme'],
                        'requires_review_before_publish' => true,
                    ], JSON_THROW_ON_ERROR),
                    'version' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            foreach ($blueprint['templates'] as $template) {
                $page = Page::query()->firstOrCreate(
                    ['site_id' => $site->id, 'route_path' => $template['routePath']],
                    [
                        'public_id' => Str::ulid()->toBase32(),
                        'page_type' => $template['purpose'],
                        'status' => 'draft',
                    ],
                );

                $revision = PageRevision::query()->firstOrCreate(
                    ['page_id' => $page->id, 'revision_no' => 1],
                    [
                        'template_key' => $template['templateKey'],
                        'status' => 'draft',
                        'created_by_platform_user_id' => $actorPlatformUserId,
                    ],
                );

                PageTranslation::query()->firstOrCreate(
                    ['page_id' => $page->id, 'locale' => $blueprint['defaultLocale']],
                    [
                        'site_id' => $site->id,
                        'title' => (string) $template['purpose'],
                        'slug' => trim((string) $template['routePath'], '/') ?: 'home',
                        'seo_json' => [],
                    ],
                );
            }

            DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
                'actor_platform_user_id' => $actorPlatformUserId,
                'event_key' => 'sector.blueprint.applied',
                'subject_type' => Site::class,
                'subject_public_id' => $site->public_id,
                'metadata_json' => json_encode([
                    'sector_key' => $sectorKey,
                    'version' => $blueprint['version'],
                ], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);
        });

        foreach ($blueprint['packages'] as $package) {
            if (($package['activationMode'] ?? 'optional') === 'optional') {
                continue;
            }

            $manifest = $this->packages->require((string) $package['packageKey']);
            $this->activatePackage->execute(
                context: $context,
                packageKey: (string) $package['packageKey'],
                site: $manifest['scope'] === 'tenant' ? null : $site,
                config: array_replace(
                    (array) ($manifest['configuration']['defaults'] ?? []),
                    (array) $package['config'],
                ),
                actorPlatformUserId: $actorPlatformUserId,
            );
        }

        return $report;
    }
}
