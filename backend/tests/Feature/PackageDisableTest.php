<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Packages\Services\ActivatePackageAction;
use App\Modules\Packages\Services\DisablePackageAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class PackageDisableTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_active_package_can_be_disabled_without_deleting_its_activation_record(): void
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertNotNull($context);
        app(TenantDatabaseManager::class)->activate($context);
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();

        app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            config: ['showVehicleCount' => true],
            actorPlatformUserId: 1,
        );

        $activation = app(DisablePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            actorPlatformUserId: 1,
            reason: 'Tenant requested deactivation',
        );

        self::assertSame('disabled', $activation->status);
        self::assertNotNull($activation->disabled_at);
        self::assertTrue(PackageActivation::query()
            ->whereKey($activation->id)
            ->where('status', 'disabled')
            ->exists());
        self::assertTrue(DB::connection('tenant')
            ->table('audit_events')
            ->where('event_key', 'package.disabled')
            ->exists());
    }
}
