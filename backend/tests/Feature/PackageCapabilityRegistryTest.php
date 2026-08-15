<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Packages\Services\ActivatePackageAction;
use App\Modules\Packages\Services\DisablePackageAction;
use App\Modules\Packages\Services\PackageCapabilityRegistry;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Tests\TestCase;

final class PackageCapabilityRegistryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_registry_derives_active_surfaces_and_invalidates_them_after_lifecycle_changes(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $registry = app(PackageCapabilityRegistry::class);

        if ($registry->hasPackage($context, $site, 'logistics.fleet')) {
            app(DisablePackageAction::class)->execute($context, 'logistics.fleet', $site, 1);
        }

        self::assertTrue($registry->hasPackage($context, $site, 'construction.projects'));
        self::assertTrue($registry->hasComponent($context, $site, 'projects.grid'));
        self::assertTrue($registry->hasAdminScreen($context, $site, 'construction.projects'));
        self::assertTrue($registry->hasApiScope($context, $site, 'projects:read'));
        self::assertTrue($registry->hasRoute($context, $site, 'projects.index'));
        self::assertTrue($registry->hasEvent($context, $site, 'project.published'));
        self::assertFalse($registry->hasComponent($context, $site, 'fleet.grid'));

        app(DisablePackageAction::class)->execute($context, 'construction.projects', $site, 1);

        self::assertFalse($registry->hasPackage($context, $site, 'construction.projects'));
        self::assertFalse($registry->hasComponent($context, $site, 'projects.grid'));
        self::assertFalse($registry->hasApiScope($context, $site, 'projects:read'));

        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            config: ['showVehicleCount' => true],
            actorPlatformUserId: 1,
        );

        self::assertTrue($registry->hasComponent($context, $site, 'fleet.grid'));
        self::assertTrue($registry->hasAdminScreen($context, $site, 'logistics.fleet'));
        self::assertTrue($registry->hasApiScope($context, $site, 'fleet:write'));
        self::assertTrue($registry->hasRoute($context, $site, 'fleet.index'));
        self::assertTrue($registry->hasEvent($context, $site, 'fleet.vehicle-updated'));
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
