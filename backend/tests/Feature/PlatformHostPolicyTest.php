<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class PlatformHostPolicyTest extends TestCase
{
    public function test_platform_surfaces_reject_unlisted_hosts_without_affecting_the_route_contract(): void
    {
        config()->set('platform.allowed_hosts', 'platform.localhost,*.platform.test');

        $this->postJson('http://untrusted.invalid/api/platform/auth/login', [])
            ->assertNotFound();

        $this->postJson('http://platform.localhost/api/platform/auth/login', [])
            ->assertUnprocessable();
    }
}
