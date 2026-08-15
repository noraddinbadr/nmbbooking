<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Packages\Services\ActivatePackageAction;
use App\Modules\Packages\Services\PackageCatalog;
use App\Modules\Packages\Services\PackageCompatibilityVerifier;
use App\Modules\Shared\Services\SemverConstraint;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class PackageManifestCompatibilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_semver_constraints_cover_caret_tilde_comparators_wildcards_and_alternatives(): void
    {
        $semver = app(SemverConstraint::class);

        self::assertTrue($semver->satisfies('1.4.2', '^1.0.0'));
        self::assertFalse($semver->satisfies('2.0.0', '^1.0.0'));
        self::assertTrue($semver->satisfies('1.4.2', '~1.4.0'));
        self::assertFalse($semver->satisfies('1.5.0', '~1.4.0'));
        self::assertTrue($semver->satisfies('13.17.0', '>=13.0 <14.0'));
        self::assertTrue($semver->satisfies('1.4.2', '1.4.* || ^2.0.0'));
    }

    public function test_compatibility_verifier_rejects_a_manifest_that_exceeds_the_tenant_schema_version(): void
    {
        $context = $this->context();
        $manifest = app(PackageCatalog::class)->require('construction.projects');
        $manifest['compatibility']['tenantSchema'] = '^2.0.0';

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('tenantSchema version [1.0.0]; expected [^2.0.0]');

        app(PackageCompatibilityVerifier::class)->assertCompatible($manifest, $context);
    }

    public function test_activation_rejects_an_active_dependency_at_an_incompatible_version(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        PackageActivation::query()
            ->where('package_key', 'media.library')
            ->update(['package_version' => '0.9.0']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Required package [media.library] is active at incompatible version [0.9.0]; expected [^1.0.0].');

        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            config: ['showVehicleCount' => true],
            actorPlatformUserId: 1,
        );
    }

    public function test_catalog_rejects_a_manifest_with_an_unknown_dependency_before_activation(): void
    {
        $root = storage_path('framework/testing/contracts-'.Str::lower(Str::random(12)));
        $previousPath = config('platform.contracts_path');
        $catalog = json_decode((string) file_get_contents(base_path('../contracts/catalogs/packages.catalog.json')), true, flags: JSON_THROW_ON_ERROR);
        $catalog['packages'][0]['dependencies'] = [[
            'packageKey' => 'missing.package',
            'versionConstraint' => '^1.0.0',
            'required' => true,
        ]];

        File::ensureDirectoryExists($root.'/catalogs');
        File::ensureDirectoryExists($root.'/schemas');
        File::put($root.'/catalogs/packages.catalog.json', json_encode($catalog, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        File::copy(base_path('../contracts/schemas/package.schema.json'), $root.'/schemas/package.schema.json');
        config(['platform.contracts_path' => $root]);
        Cache::forget('platform:package-catalog:v2');

        try {
            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('Package [seo.core] depends on unknown package [missing.package].');

            app(PackageCatalog::class)->all();
        } finally {
            config(['platform.contracts_path' => $previousPath]);
            Cache::forget('platform:package-catalog:v2');
            File::deleteDirectory($root);
        }
    }

    public function test_activation_is_idempotent_for_the_same_package_and_scope(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $action = app(ActivatePackageAction::class);

        $first = $action->execute($context, 'social.links', $site, ['networks' => []], 1);
        $second = $action->execute($context, 'social.links', $site, ['networks' => []], 1);

        self::assertSame($first->id, $second->id);
        self::assertSame(1, PackageActivation::query()
            ->where('package_key', 'social.links')
            ->where('site_id', $site->id)
            ->count());
    }

    public function test_activation_rejects_a_declared_conflict_with_an_active_package(): void
    {
        $root = storage_path('framework/testing/contracts-'.Str::lower(Str::random(12)));
        $previousPath = config('platform.contracts_path');
        $catalog = json_decode((string) file_get_contents(base_path('../contracts/catalogs/packages.catalog.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($catalog['packages'] as &$package) {
            if ($package['packageKey'] === 'analytics.config') {
                $package['conflicts'] = ['social.links'];
            }
        }
        unset($package);

        File::ensureDirectoryExists($root.'/catalogs');
        File::ensureDirectoryExists($root.'/schemas');
        File::put($root.'/catalogs/packages.catalog.json', json_encode($catalog, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        File::copy(base_path('../contracts/schemas/package.schema.json'), $root.'/schemas/package.schema.json');
        config(['platform.contracts_path' => $root]);
        Cache::forget('platform:package-catalog:v2');

        try {
            $context = $this->context();
            $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
            PackageActivation::query()
                ->where('package_key', 'analytics.config')
                ->where('site_id', $site->id)
                ->update(['status' => 'disabled', 'disabled_at' => now()]);
            $action = app(ActivatePackageAction::class);
            $action->execute($context, 'social.links', $site, ['networks' => []], 1);

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('Package [analytics.config] conflicts with active package [social.links].');

            $action->execute($context, 'analytics.config', $site, ['provider' => 'none', 'measurementId' => ''], 1);
        } finally {
            config(['platform.contracts_path' => $previousPath]);
            Cache::forget('platform:package-catalog:v2');
            File::deleteDirectory($root);
        }
    }

    private function context(): TenantContext
    {
        $request = Request::create('http://acme.localhost/');
        $context = app(AddressResolver::class)->resolve($request);
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
