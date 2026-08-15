<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Modules\Tenancy\Models\SiteAddress;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Request;

final class AddressResolver
{
    public function __construct(private readonly CacheRepository $cache) {}

    public function resolve(Request $request): ?TenantContext
    {
        $hostname = strtolower(rtrim($request->getHost(), '.'));
        $path = '/'.ltrim($request->getPathInfo(), '/');
        $cacheKey = 'tenant-context:'.hash('sha256', $hostname."\n".$path);
        $cachedContext = $this->cache->get($cacheKey);

        if ($cachedContext instanceof TenantContext) {
            return $cachedContext;
        }

        $context = $this->resolveUncached($hostname, $path);

        if ($context instanceof TenantContext) {
            $this->cache->put(
                $cacheKey,
                $context,
                now()->addSeconds(max(1, (int) config('platform.tenant_cache_ttl_seconds'))),
            );
        }

        return $context;
    }

    private function resolveUncached(string $hostname, string $path): ?TenantContext
    {
        $address = SiteAddress::query()
            ->with(['tenant.database'])
            ->where('hostname', $hostname)
            ->where('status', 'active')
            ->orderByRaw('CHAR_LENGTH(path_prefix) DESC')
            ->get()
            ->first(function (SiteAddress $candidate) use ($path): bool {
                $prefix = rtrim($candidate->path_prefix, '/') ?: '/';

                return $prefix === '/' || $path === $prefix || str_starts_with($path, $prefix.'/');
            });

        if (! $address || ! $address->tenant || $address->tenant->status !== 'active') {
            return null;
        }

        $database = $address->tenant->database;
        if (! $database || $database->status !== 'ready') {
            return null;
        }

        return new TenantContext(
            tenantId: $address->tenant->id,
            tenantPublicId: $address->tenant->public_id,
            tenantSlug: $address->tenant->slug,
            tenantDatabaseId: $database->id,
            connectionKey: $database->connection_key,
            databaseName: $database->database_name,
            databaseHost: $database->db_host,
            databasePort: (int) $database->db_port,
            databaseUsername: $database->db_username,
            credentialReference: $database->credential_ref,
            sitePublicId: $address->site_public_id,
            hostname: $hostname,
            pathPrefix: $address->path_prefix,
        );
    }
}
