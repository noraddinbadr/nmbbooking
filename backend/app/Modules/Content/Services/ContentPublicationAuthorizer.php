<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Models\User;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Models\Tenant;
use App\Modules\Tenancy\Services\MembershipAuthorizer;
use App\Modules\Tenancy\Services\TenantContext;
use RuntimeException;

final class ContentPublicationAuthorizer
{
    public function __construct(private readonly MembershipAuthorizer $memberships) {}

    public function assertAllows(User $actor, TenantContext $context, Site $site, string $permissionKey): void
    {
        $tenant = Tenant::query()->findOrFail($context->tenantId);
        if (! $this->memberships->allows($actor, $tenant, $permissionKey, $site->public_id)) {
            throw new RuntimeException("Actor is not permitted to perform [{$permissionKey}] for site [{$site->public_id}].");
        }
    }
}
