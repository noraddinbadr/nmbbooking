<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Tenancy\Models\Tenant;
use App\Modules\Tenancy\Services\TenantLifecycleService;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

final class TenantLifecycleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_active_tenant_can_be_suspended_and_resumed_with_an_audit_record(): void
    {
        $tenant = Tenant::query()->with('database')->where('slug', 'acme')->firstOrFail();
        $lifecycle = app(TenantLifecycleService::class);

        $suspended = $lifecycle->transition($tenant, 'suspended', reason: 'Billing review');
        self::assertSame('suspended', $suspended->status);

        $resumed = $lifecycle->transition($suspended, 'active', reason: 'Billing cleared');
        self::assertSame('active', $resumed->status);
        $this->assertDatabaseHas('platform_audit_events', [
            'tenant_id' => $tenant->id,
            'event_key' => 'tenant.lifecycle.transitioned',
        ], 'platform');
    }

    public function test_tenant_cannot_activate_before_its_database_is_ready(): void
    {
        $tenant = Tenant::query()->create([
            'public_id' => Str::ulid()->toBase32(),
            'name' => 'Unprovisioned Tenant',
            'slug' => 'pending-'.Str::lower(Str::random(8)),
            'status' => 'provisioning',
            'data_placement' => 'shared_host',
            'timezone' => 'UTC',
        ]);

        $this->expectException(LogicException::class);
        app(TenantLifecycleService::class)->transition($tenant, 'active');
    }
}
