<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use JsonException;
use RuntimeException;

final class PlatformCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $connection = DB::connection('platform');
        $packages = $this->catalog('packages.catalog.json');
        $permissions = $this->catalog('permissions.catalog.json');

        foreach ($permissions['resources'] as $resource) {
            foreach ($resource['actions'] as $action) {
                $key = "{$resource['scope']}:{$resource['resource']}:{$action}";
                $connection->table('permissions')->updateOrInsert(
                    ['key' => $key],
                    [
                        'scope' => $resource['scope'],
                        'resource' => $resource['resource'],
                        'action' => $action,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }

        /** @var array<string, array<string, mixed>> $rolesByKey */
        $rolesByKey = [];
        foreach ($permissions['roles'] as $role) {
            $rolesByKey[(string) $role['key']] = $role;
            $connection->table('roles')->updateOrInsert(
                ['key' => $role['key']],
                ['scope' => $role['scope'], 'name' => $role['key'], 'created_at' => now(), 'updated_at' => now()],
            );
        }

        foreach ($permissions['roles'] as $role) {
            $roleId = (int) $connection->table('roles')->where('key', $role['key'])->value('id');

            foreach ($this->resolvedPermissions($role, $rolesByKey) as $permissionKey) {
                $permissionId = $connection->table('permissions')->where('key', $permissionKey)->value('id');
                if ($permissionId !== null) {
                    $connection->table('role_permissions')->updateOrInsert([
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        }

        foreach ($packages['packages'] as $manifest) {
            $connection->table('package_definitions')->updateOrInsert(
                ['package_key' => $manifest['packageKey']],
                [
                    'category' => $manifest['category'],
                    'scope' => $manifest['scope'],
                    'display_name_json' => json_encode($manifest['displayName'], JSON_THROW_ON_ERROR),
                    'is_listed' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $packageId = (int) $connection->table('package_definitions')
                ->where('package_key', $manifest['packageKey'])
                ->value('id');

            $connection->table('package_versions')->updateOrInsert(
                ['package_id' => $packageId, 'version' => $manifest['version']],
                [
                    'manifest_json' => json_encode($manifest, JSON_THROW_ON_ERROR),
                    'is_active' => true,
                    'released_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    /**
     * @param  array<string, mixed>  $role
     * @param  array<string, array<string, mixed>>  $rolesByKey
     * @param  array<string, true>  $visited
     * @return array<int, string>
     */
    private function resolvedPermissions(array $role, array $rolesByKey, array $visited = []): array
    {
        $roleKey = (string) ($role['key'] ?? '');
        if ($roleKey === '' || isset($visited[$roleKey])) {
            throw new RuntimeException("Role inheritance contains a cycle at [{$roleKey}].");
        }

        $visited[$roleKey] = true;
        $permissionKeys = array_values(array_filter($role['permissions'] ?? [], 'is_string'));

        foreach (array_values(array_filter($role['inherits'] ?? [], 'is_string')) as $parentKey) {
            $parentRole = $rolesByKey[$parentKey] ?? null;
            if (! is_array($parentRole)) {
                throw new RuntimeException("Role [{$roleKey}] inherits unknown role [{$parentKey}].");
            }

            $permissionKeys = [...$permissionKeys, ...$this->resolvedPermissions($parentRole, $rolesByKey, $visited)];
        }

        return array_values(array_unique($permissionKeys));
    }

    /** @return array<string, mixed> */
    private function catalog(string $filename): array
    {
        $path = rtrim((string) config('platform.contracts_path'), '/').'/catalogs/'.$filename;
        $json = file_get_contents($path);
        if ($json === false) {
            throw new RuntimeException("Catalog [{$filename}] is not readable.");
        }

        try {
            return json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("Catalog [{$filename}] is invalid JSON.", previous: $exception);
        }
    }
}
