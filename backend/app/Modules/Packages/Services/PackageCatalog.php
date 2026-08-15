<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use App\Modules\Shared\Services\SemverConstraint;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class PackageCatalog
{
    public function __construct(
        private readonly JsonSchemaValidator $schemas,
        private readonly SemverConstraint $semver,
    ) {}

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return Cache::remember('platform:package-catalog:v2', 300, function (): array {
            $path = rtrim((string) config('platform.contracts_path'), '/').'/catalogs/packages.catalog.json';
            $raw = file_get_contents($path);

            if ($raw === false) {
                throw new RuntimeException('Package catalog cannot be read.');
            }

            $catalog = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
            $schemaPath = rtrim((string) config('platform.contracts_path'), '/').'/schemas/package.schema.json';
            $schema = $this->schemas->schemaFile($schemaPath);
            $packages = [];

            foreach (($catalog['packages'] ?? []) as $package) {
                $this->schemas->assertValid($package, $schema, 'package:'.($package['packageKey'] ?? 'unknown'));
                $packageKey = (string) $package['packageKey'];
                if (array_key_exists($packageKey, $packages)) {
                    throw new RuntimeException("Package catalog contains duplicate key [{$packageKey}].");
                }

                $packages[$packageKey] = $package;
            }

            $this->assertManifestGraph($packages);

            return $packages;
        });
    }

    /** @param array<string, array<string, mixed>> $packages */
    private function assertManifestGraph(array $packages): void
    {
        foreach ($packages as $packageKey => $manifest) {
            foreach ($manifest['dependencies'] as $dependency) {
                $dependencyKey = $dependency['packageKey'];
                $dependencyManifest = $packages[$dependencyKey] ?? null;
                if (! is_array($dependencyManifest)) {
                    throw new RuntimeException("Package [{$packageKey}] depends on unknown package [{$dependencyKey}].");
                }

                if ($dependencyKey === $packageKey) {
                    throw new RuntimeException("Package [{$packageKey}] cannot depend on itself.");
                }

                if (! $this->semver->satisfies($dependencyManifest['version'], $dependency['versionConstraint'])) {
                    throw new RuntimeException(sprintf(
                        'Package [%s] dependency [%s] version [%s] does not satisfy [%s].',
                        $packageKey,
                        $dependencyKey,
                        $dependencyManifest['version'],
                        $dependency['versionConstraint'],
                    ));
                }
            }

            foreach ($manifest['conflicts'] as $conflictKey) {
                if (! array_key_exists($conflictKey, $packages)) {
                    throw new RuntimeException("Package [{$packageKey}] conflicts with unknown package [{$conflictKey}].");
                }

                if ($conflictKey === $packageKey) {
                    throw new RuntimeException("Package [{$packageKey}] cannot conflict with itself.");
                }
            }
        }
    }

    /** @return array<string, mixed> */
    public function require(string $packageKey): array
    {
        $manifest = $this->all()[$packageKey] ?? null;
        if (! is_array($manifest)) {
            throw new RuntimeException("Unknown package [{$packageKey}].");
        }

        return $manifest;
    }
}
