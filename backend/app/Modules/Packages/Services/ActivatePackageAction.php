<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Shared\Services\JsonSchemaValidator;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class ActivatePackageAction
{
    public function __construct(
        private readonly PackageCatalog $catalog,
        private readonly JsonSchemaValidator $schemas,
    ) {}

    /** @param array<string, mixed> $config */
    public function execute(
        TenantContext $context,
        string $packageKey,
        ?Site $site,
        array $config,
        int $actorPlatformUserId,
    ): PackageActivation {
        $manifest = $this->catalog->require($packageKey);
        $this->assertEntitled($context, $packageKey);
        $this->assertScope($manifest, $site);
        $this->assertDependenciesAreActive($manifest, $site);
        $this->assertConfig($manifest, $config);

        $activation = DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($manifest, $packageKey, $site, $config, $actorPlatformUserId): PackageActivation {
                return PackageActivation::query()->updateOrCreate(
                    [
                        'package_key' => $packageKey,
                        'scope_type' => $manifest['scope'],
                        'site_id' => $site?->id,
                    ],
                    [
                        'package_version' => $manifest['version'],
                        'status' => 'active',
                        'config_json' => $config,
                        'enabled_by_platform_user_id' => $actorPlatformUserId,
                        'enabled_at' => now(),
                        'disabled_at' => null,
                    ],
                );
            },
        );

        Cache::forget("tenant:{$context->tenantPublicId}:site:".($site?->public_id ?? 'tenant').':packages');

        return $activation;
    }

    /** @param array<string, mixed> $manifest */
    private function assertScope(array $manifest, ?Site $site): void
    {
        $isTenantScoped = $manifest['scope'] === 'tenant';

        if (($isTenantScoped && $site !== null) || (! $isTenantScoped && $site === null)) {
            throw ValidationException::withMessages([
                'scope' => 'Package scope does not match the selected activation target.',
            ]);
        }
    }

    private function assertEntitled(TenantContext $context, string $packageKey): void
    {
        $allowed = DB::connection('platform')
            ->table('tenant_entitlements as entitlement')
            ->join('package_definitions as package', 'package.id', '=', 'entitlement.package_id')
            ->where('entitlement.tenant_id', $context->tenantId)
            ->where('package.package_key', $packageKey)
            ->where('entitlement.is_enabled', true)
            ->where(fn ($query) => $query->whereNull('entitlement.expires_at')->orWhere('entitlement.expires_at', '>', now()))
            ->exists();

        if (! $allowed) {
            throw new RuntimeException("Tenant is not entitled to package [{$packageKey}].");
        }
    }

    /** @param array<string, mixed> $manifest */
    private function assertDependenciesAreActive(array $manifest, ?Site $site): void
    {
        foreach ($manifest['dependencies'] as $dependency) {
            if (($dependency['required'] ?? true) !== true) {
                continue;
            }

            $active = PackageActivation::query()
                ->where('package_key', $dependency['packageKey'])
                ->where('status', 'active')
                ->where(function ($query) use ($site): void {
                    $query->where(function ($nested): void {
                        $nested->where('scope_type', 'tenant')->whereNull('site_id');
                    });

                    if ($site !== null) {
                        $query->orWhere(function ($nested) use ($site): void {
                            $nested->where('scope_type', 'site')->where('site_id', $site->id);
                        });
                    }
                })
                ->exists();

            if (! $active) {
                throw new RuntimeException("Required package [{$dependency['packageKey']}] is inactive.");
            }
        }
    }

    /** @param array<string, mixed> $manifest @param array<string, mixed> $config */
    private function assertConfig(array $manifest, array $config): void
    {
        try {
            $this->schemas->assertValid(
                $config,
                (array) ($manifest['configuration']['jsonSchema'] ?? []),
                'package-config:'.$manifest['packageKey'],
            );
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['config' => $exception->getMessage()]);
        }
    }
}
