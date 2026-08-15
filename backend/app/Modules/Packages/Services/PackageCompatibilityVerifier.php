<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Shared\Services\SemverConstraint;
use App\Modules\Tenancy\Models\TenantDatabase;
use App\Modules\Tenancy\Services\TenantContext;
use RuntimeException;

final class PackageCompatibilityVerifier
{
    public function __construct(private readonly SemverConstraint $semver) {}

    /** @param array<string, mixed> $manifest */
    public function assertCompatible(array $manifest, TenantContext $context): void
    {
        /** @var array<string, string> $constraints */
        $constraints = $manifest['compatibility'];
        $versions = [
            'platform' => (string) config('platform.version'),
            'php' => PHP_VERSION,
            'laravel' => app()->version(),
            'tenantSchema' => $this->tenantSchemaVersion($context),
        ];

        foreach ($constraints as $runtime => $constraint) {
            $version = $versions[$runtime] ?? null;
            if ($version === null || ! $this->semver->satisfies($version, $constraint)) {
                throw new RuntimeException(sprintf(
                    'Package [%s] is incompatible with %s version [%s]; expected [%s].',
                    (string) $manifest['packageKey'],
                    $runtime,
                    $version ?? 'unknown',
                    $constraint,
                ));
            }
        }
    }

    private function tenantSchemaVersion(TenantContext $context): string
    {
        $version = TenantDatabase::query()
            ->whereKey($context->tenantDatabaseId)
            ->where('tenant_id', $context->tenantId)
            ->value('schema_version');

        if (! is_string($version) || $version === '') {
            throw new RuntimeException("Tenant database [{$context->tenantDatabaseId}] does not expose a schema version.");
        }

        return $version;
    }
}
