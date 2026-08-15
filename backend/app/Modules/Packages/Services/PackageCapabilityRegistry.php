<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class PackageCapabilityRegistry
{
    /** @var list<string> */
    private const CAPABILITY_TYPES = ['components', 'adminScreens', 'apiScopes', 'routes', 'events'];

    public function __construct(
        private readonly PackageCatalog $catalog,
        private readonly CacheRepository $cache,
    ) {}

    /** @return Collection<string, int> */
    public function activePackageKeys(TenantContext $context, Site $site): Collection
    {
        return $this->cache->remember(
            $this->cacheKey($context, $site, 'keys'),
            300,
            function () use ($site): Collection {
                return $this->applicableActivePackages($site)
                    ->pluck('package_key')
                    ->flip();
            },
        );
    }

    /** @return array<string, list<string>> */
    public function all(TenantContext $context, Site $site): array
    {
        return $this->cache->remember(
            $this->cacheKey($context, $site, 'surfaces'),
            300,
            function () use ($context, $site): array {
                $capabilities = array_fill_keys(self::CAPABILITY_TYPES, []);

                foreach ($this->activePackageKeys($context, $site)->keys() as $packageKey) {
                    $manifest = $this->catalog->require($packageKey);
                    foreach (self::CAPABILITY_TYPES as $type) {
                        /** @var list<string> $declared */
                        $declared = $manifest['capabilities'][$type];
                        $capabilities[$type] = [...$capabilities[$type], ...$declared];
                    }
                }

                foreach (self::CAPABILITY_TYPES as $type) {
                    $capabilities[$type] = array_values(array_unique($capabilities[$type]));
                }

                return $capabilities;
            },
        );
    }

    public function forget(TenantContext $context, ?Site $site): void
    {
        $sitePublicIds = $site === null
            ? Site::query()->pluck('public_id')->all()
            : [$site->public_id];

        foreach ($sitePublicIds as $sitePublicId) {
            foreach (['keys', 'surfaces'] as $suffix) {
                $this->cache->forget("tenant:{$context->tenantPublicId}:site:{$sitePublicId}:packages:{$suffix}:v1");
            }
        }
    }

    public function hasPackage(TenantContext $context, Site $site, string $packageKey): bool
    {
        return $this->activePackageKeys($context, $site)->has($packageKey);
    }

    public function hasComponent(TenantContext $context, Site $site, string $componentKey): bool
    {
        return $this->has($context, $site, 'components', $componentKey);
    }

    public function hasAdminScreen(TenantContext $context, Site $site, string $screenKey): bool
    {
        return $this->has($context, $site, 'adminScreens', $screenKey);
    }

    public function hasApiScope(TenantContext $context, Site $site, string $scope): bool
    {
        return $this->has($context, $site, 'apiScopes', $scope);
    }

    public function hasRoute(TenantContext $context, Site $site, string $routeKey): bool
    {
        return $this->has($context, $site, 'routes', $routeKey);
    }

    public function hasEvent(TenantContext $context, Site $site, string $eventKey): bool
    {
        return $this->has($context, $site, 'events', $eventKey);
    }

    private function has(TenantContext $context, Site $site, string $type, string $value): bool
    {
        return in_array($value, $this->all($context, $site)[$type], true);
    }

    /** @return Builder<PackageActivation> */
    private function applicableActivePackages(Site $site): Builder
    {
        return PackageActivation::query()
            ->where('status', 'active')
            ->where(function ($query) use ($site): void {
                $query->where(function ($nested): void {
                    $nested->where('scope_type', 'tenant')->whereNull('site_id');
                })->orWhere(function ($nested) use ($site): void {
                    $nested->where('scope_type', 'site')->where('site_id', $site->id);
                });
            });
    }

    private function cacheKey(TenantContext $context, Site $site, string $suffix): string
    {
        return "tenant:{$context->tenantPublicId}:site:{$site->public_id}:packages:{$suffix}:v1";
    }
}
