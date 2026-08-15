<?php

declare(strict_types=1);

namespace Tests\Feature;

use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class PermissionCatalogInheritanceTest extends TestCase
{
    public function test_inherited_role_permissions_are_materialized_in_the_platform_catalog(): void
    {
        $this->seed(PlatformCatalogSeeder::class);

        self::assertTrue($this->roleHasPermission('site-publisher', 'site:pages:review'));
        self::assertTrue($this->roleHasPermission('site-publisher', 'site:pages:write'));
        self::assertTrue($this->roleHasPermission('tenant-owner', 'site:pages:publish'));
        self::assertTrue($this->roleHasPermission('tenant-owner', 'site:components:use'));
    }

    private function roleHasPermission(string $roleKey, string $permissionKey): bool
    {
        return DB::connection('platform')
            ->table('role_permissions')
            ->join('roles', 'roles.id', '=', 'role_permissions.role_id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('roles.key', $roleKey)
            ->where('permissions.key', $permissionKey)
            ->exists();
    }
}
