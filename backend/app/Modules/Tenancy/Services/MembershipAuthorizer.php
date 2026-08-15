<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Models\User;
use App\Modules\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;

final class MembershipAuthorizer
{
    public function allows(User $user, Tenant $tenant, string $permissionKey, ?string $sitePublicId = null): bool
    {
        if (str_starts_with($permissionKey, 'platform:')) {
            return $user->hasPlatformPermission($permissionKey);
        }

        $permission = DB::connection('platform')
            ->table('permissions')
            ->where('key', $permissionKey)
            ->first(['id', 'scope']);

        if ($permission === null) {
            return false;
        }

        $membership = DB::connection('platform')
            ->table('tenant_memberships as membership')
            ->join('roles', 'roles.id', '=', 'membership.role_id')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'roles.id')
            ->where('membership.tenant_id', $tenant->id)
            ->where('membership.user_id', $user->id)
            ->where('membership.status', 'active')
            ->where('role_permissions.permission_id', $permission->id)
            ->first(['membership.id', 'roles.scope as role_scope']);

        if ($membership === null) {
            return false;
        }

        if ($permission->scope !== 'site') {
            return true;
        }

        if (! is_string($sitePublicId) || $sitePublicId === '') {
            return false;
        }

        if ($membership->role_scope === 'tenant') {
            return true;
        }

        return DB::connection('platform')
            ->table('membership_site_scopes')
            ->where('membership_id', $membership->id)
            ->where('site_public_id', $sitePublicId)
            ->exists();
    }
}
