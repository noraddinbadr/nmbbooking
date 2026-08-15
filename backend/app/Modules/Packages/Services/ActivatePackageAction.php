<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Shared\Services\JsonSchemaValidator;
use App\Modules\Shared\Services\SemverConstraint;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class ActivatePackageAction
{
    public function __construct(
        private readonly PackageCatalog $catalog,
        private readonly PackageCapabilityRegistry $capabilities,
        private readonly PackageCompatibilityVerifier $compatibility,
        private readonly PackageEntitlementService $entitlements,
        private readonly JsonSchemaValidator $schemas,
        private readonly SemverConstraint $semver,
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
        $this->compatibility->assertCompatible($manifest, $context);
        $this->entitlements->assertGranted($context, $packageKey);
        $this->assertScope($manifest, $site);
        $this->assertDependenciesAreActive($manifest, $site);
        $this->assertNoActiveConflicts($manifest, $site);
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
        $this->capabilities->forget($context, $site);

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

    /** @param array<string, mixed> $manifest */
    private function assertDependenciesAreActive(array $manifest, ?Site $site): void
    {
        foreach ($manifest['dependencies'] as $dependency) {
            if (($dependency['required'] ?? true) !== true) {
                continue;
            }

            $activation = $this->applicableActivePackages($site)
                ->where('package_key', $dependency['packageKey'])
                ->first();

            if ($activation === null) {
                throw new RuntimeException("Required package [{$dependency['packageKey']}] is inactive.");
            }

            if (! $this->semver->satisfies($activation->package_version, $dependency['versionConstraint'])) {
                throw new RuntimeException(sprintf(
                    'Required package [%s] is active at incompatible version [%s]; expected [%s].',
                    $dependency['packageKey'],
                    $activation->package_version,
                    $dependency['versionConstraint'],
                ));
            }
        }
    }

    /** @param array<string, mixed> $manifest */
    private function assertNoActiveConflicts(array $manifest, ?Site $site): void
    {
        $activePackages = $this->applicableActivePackages($site)->get();
        foreach ($activePackages as $activation) {
            $activeManifest = $this->catalog->require($activation->package_key);
            $declaresConflict = in_array($activation->package_key, $manifest['conflicts'], true)
                || in_array($manifest['packageKey'], $activeManifest['conflicts'], true);

            if ($declaresConflict) {
                throw new RuntimeException(sprintf(
                    'Package [%s] conflicts with active package [%s].',
                    $manifest['packageKey'],
                    $activation->package_key,
                ));
            }
        }
    }

    /** @return Builder<PackageActivation> */
    private function applicableActivePackages(?Site $site): Builder
    {
        return PackageActivation::query()
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
            });
    }

    /** @param array<string, mixed> $manifest @param array<string, mixed> $config */
    private function assertConfig(array $manifest, array $config): void
    {
        try {
            $this->schemas->assertValid(
                $config === [] ? (object) [] : $config,
                (array) ($manifest['configuration']['jsonSchema'] ?? []),
                'package-config:'.$manifest['packageKey'],
            );
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['config' => $exception->getMessage()]);
        }
    }
}
