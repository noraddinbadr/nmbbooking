<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final readonly class DisablePackageAction
{
    public function __construct(private PackageCatalog $catalog) {}

    public function execute(
        TenantContext $context,
        string $packageKey,
        ?Site $site,
        int $actorPlatformUserId,
        ?string $reason = null,
    ): PackageActivation {
        $manifest = $this->catalog->require($packageKey);
        $this->assertScope($manifest, $site);
        $this->assertNoActiveDependents($packageKey, $site);

        $activation = DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($manifest, $packageKey, $site, $actorPlatformUserId, $reason): PackageActivation {
                $activation = PackageActivation::query()
                    ->where('package_key', $packageKey)
                    ->where('scope_type', $manifest['scope'])
                    ->where('site_id', $site?->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($activation->status !== 'disabled') {
                    $activation->forceFill([
                        'status' => 'disabled',
                        'disabled_at' => now(),
                    ])->save();

                    DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
                        'actor_platform_user_id' => $actorPlatformUserId,
                        'event_key' => 'package.disabled',
                        'subject_type' => PackageActivation::class,
                        'subject_public_id' => null,
                        'metadata_json' => json_encode([
                            'package_key' => $packageKey,
                            'scope' => $manifest['scope'],
                            'site_public_id' => $site?->public_id,
                            'reason' => $reason,
                            'data_policy' => 'retain',
                        ], JSON_THROW_ON_ERROR),
                        'created_at' => now(),
                    ]);
                }

                return $activation;
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
            throw new RuntimeException('Package scope does not match the selected activation target.');
        }
    }

    private function assertNoActiveDependents(string $packageKey, ?Site $site): void
    {
        foreach ($this->catalog->all() as $dependentPackageKey => $dependentManifest) {
            foreach ($dependentManifest['dependencies'] as $dependency) {
                if (($dependency['packageKey'] ?? null) !== $packageKey || ($dependency['required'] ?? true) !== true) {
                    continue;
                }

                $query = PackageActivation::query()
                    ->where('package_key', $dependentPackageKey)
                    ->where('status', 'active');

                if ($site !== null) {
                    $query->where('site_id', $site->id);
                }

                if ($query->exists()) {
                    throw new RuntimeException("Package [{$packageKey}] is required by active package [{$dependentPackageKey}].");
                }
            }
        }
    }
}
