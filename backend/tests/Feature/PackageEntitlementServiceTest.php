<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Packages\Services\ActivatePackageAction;
use App\Modules\Packages\Services\PackageEntitlementService;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

final class PackageEntitlementServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_entitlements_drive_the_marketplace_and_block_activation_when_disabled_or_expired(): void
    {
        $context = $this->context();
        $service = app(PackageEntitlementService::class);
        $initialListing = $service->marketplace($context)->keyBy('packageKey');

        self::assertCount(5, $initialListing);
        self::assertTrue($initialListing['construction.projects']['entitled']);
        self::assertSame('مشروعات المقاولات', $initialListing['construction.projects']['displayName']['ar']);

        DB::connection('platform')
            ->table('tenant_entitlements as entitlement')
            ->join('package_definitions as package', 'package.id', '=', 'entitlement.package_id')
            ->where('entitlement.tenant_id', $context->tenantId)
            ->where('package.package_key', 'logistics.fleet')
            ->update(['entitlement.is_enabled' => false]);
        DB::connection('platform')
            ->table('tenant_entitlements as entitlement')
            ->join('package_definitions as package', 'package.id', '=', 'entitlement.package_id')
            ->where('entitlement.tenant_id', $context->tenantId)
            ->where('package.package_key', 'seo.core')
            ->update(['entitlement.expires_at' => now()->subSecond()]);

        $listing = $service->marketplace($context)->keyBy('packageKey');
        self::assertFalse($listing['logistics.fleet']['entitled']);
        self::assertFalse($listing['seo.core']['entitled']);
        self::assertFalse($service->isGranted($context, 'logistics.fleet'));
        self::assertFalse($service->isGranted($context, 'seo.core'));

        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tenant is not entitled to package [logistics.fleet].');

        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            config: ['showVehicleCount' => true],
            actorPlatformUserId: 1,
        );
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
