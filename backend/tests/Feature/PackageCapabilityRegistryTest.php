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

    public function test_general_packages_activate_with_validated_configuration_and_expose_declared_capabilities(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();

        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'social.links',
            site: $site,
            config: ['networks' => [['network' => 'linkedin', 'url' => 'https://www.linkedin.com/company/acme']]],
            actorPlatformUserId: 1,
        );
        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'analytics.config',
            site: $site,
            config: ['provider' => 'plausible', 'measurementId' => 'acme.example'],
            actorPlatformUserId: 1,
        );

        $registry = app(PackageCapabilityRegistry::class);
        self::assertTrue($registry->hasAdminScreen($context, $site, 'social.links'));
        self::assertTrue($registry->hasApiScope($context, $site, 'social:write'));
        self::assertTrue($registry->hasEvent($context, $site, 'social.links-updated'));
        self::assertTrue($registry->hasAdminScreen($context, $site, 'analytics.settings'));
        self::assertTrue($registry->hasApiScope($context, $site, 'analytics:read'));
        self::assertTrue($registry->hasEvent($context, $site, 'analytics.configuration-updated'));
    }

    public function test_activation_merges_manifest_defaults_before_validating_and_persisting_configuration(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $action = app(ActivatePackageAction::class);

        $social = $action->execute($context, 'social.links', $site, [], 1);
        $analytics = $action->execute($context, 'analytics.config', $site, ['provider' => 'plausible'], 1);

        self::assertSame(['networks' => []], $social->config_json);
        self::assertSame(['provider' => 'plausible', 'measurementId' => ''], $analytics->config_json);
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
