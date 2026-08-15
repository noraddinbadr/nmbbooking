<?php

declare(strict_types=1);

namespace Tests\Feature;

use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Tests\TestCase;

final class InternalHealthTest extends TestCase
{
    private const INTERNAL_HEALTH_TOKEN = 'test-internal-health-token';

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('platform.internal_health_token', self::INTERNAL_HEALTH_TOKEN);
        config()->set('platform.allow_unauthenticated_internal_health_in_local', false);
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_internal_health_reports_application_platform_database_and_cache_status(): void
    {
        $response = $this->withHeader('X-Internal-Health-Token', self::INTERNAL_HEALTH_TOKEN)
            ->getJson('/api/internal/health');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.application.status', 'ok')
            ->assertJsonPath('checks.platform_database.status', 'ok')
            ->assertJsonPath('checks.cache.status', 'ok')
            ->assertJsonPath('checks.storage.status', 'ok')
            ->assertJsonPath('checks.storage.disk', 'temporary')
            ->assertHeader('Content-Security-Policy')
            ->assertHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('X-Request-Id');

        self::assertMatchesRegularExpression(
            '/^[A-Za-z0-9][A-Za-z0-9._-]{7,63}$/',
            (string) $response->headers->get('X-Request-Id'),
        );
    }

    public function test_safe_request_identifier_is_preserved_in_the_response_and_body(): void
    {
        $requestId = 'release-check-20260815';

        $response = $this->withHeaders([
            'X-Internal-Health-Token' => self::INTERNAL_HEALTH_TOKEN,
            'X-Request-Id' => $requestId,
        ])->getJson('/api/internal/health');

        $response
            ->assertOk()
            ->assertHeader('X-Request-Id', $requestId)
            ->assertJsonPath('meta.request_id', $requestId);
    }

    public function test_unsafe_request_identifier_is_replaced(): void
    {
        $response = $this->withHeaders([
            'X-Internal-Health-Token' => self::INTERNAL_HEALTH_TOKEN,
            'X-Request-Id' => "unsafe\nvalue",
        ])->getJson('/api/internal/health');

        $response->assertOk()->assertHeader('X-Request-Id');

        self::assertNotSame("unsafe\nvalue", $response->headers->get('X-Request-Id'));
    }

    public function test_internal_health_rejects_requests_without_the_monitoring_token(): void
    {
        $this->getJson('/api/internal/health')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'not_found');
    }

    public function test_verified_tenant_health_includes_the_tenant_database_check(): void
    {
        $response = $this->withHeader('X-Internal-Health-Token', self::INTERNAL_HEALTH_TOKEN)
            ->getJson('http://acme.localhost/api/v1/internal/health');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.tenant_database.status', 'ok')
            ->assertJsonPath('checks.tenant_database.connection', 'tenant');
    }

    public function test_unknown_tenant_api_host_returns_a_safe_traced_error_envelope(): void
    {
        $response = $this->getJson('http://unknown.localhost/api/v1/pages');
        $requestId = (string) $response->headers->get('X-Request-Id');

        $response
            ->assertNotFound()
            ->assertHeader('X-Request-Id', $requestId)
            ->assertJsonPath('error.code', 'not_found')
            ->assertJsonPath('meta.request_id', $requestId);
    }
}
