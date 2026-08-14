<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Modules\Tenancy\Models\SiteAddress;
use Illuminate\Http\Request;

final class AddressResolver
{
    public function resolve(Request $request): ?TenantContext
    {
        $hostname = strtolower(rtrim($request->getHost(), '.'));
        $path = '/'.ltrim($request->getPathInfo(), '/');

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
