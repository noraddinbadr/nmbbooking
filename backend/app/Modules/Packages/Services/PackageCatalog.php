<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class PackageCatalog
{
    public function __construct(private readonly JsonSchemaValidator $schemas) {}

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return Cache::remember('platform:package-catalog:v1', 300, function (): array {
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
                $packages[$package['packageKey']] = $package;
            }

            return $packages;
        });
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
