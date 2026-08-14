<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

final readonly class TenantContext
{
    public function __construct(
        public int $tenantId,
        public string $tenantPublicId,
        public string $tenantSlug,
        public int $tenantDatabaseId,
        public string $connectionKey,
        public string $databaseName,
        public string $databaseHost,
        public int $databasePort,
        public string $databaseUsername,
        public string $credentialReference,
        public string $sitePublicId,
        public string $hostname,
        public string $pathPrefix,
    ) {}
}
