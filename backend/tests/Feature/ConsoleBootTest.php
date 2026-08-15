<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Tenancy\Services\TenantContext;
use Tests\TestCase;

final class ConsoleBootTest extends TestCase
{
    public function test_console_commands_boot_without_a_tenant_context(): void
    {
        self::assertFalse(app()->bound(TenantContext::class));

        $this->artisan('about')
            ->assertExitCode(0);
    }
}
