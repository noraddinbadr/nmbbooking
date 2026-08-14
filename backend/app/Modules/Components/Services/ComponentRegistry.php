<?php

declare(strict_types=1);

namespace App\Modules\Components\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class ComponentRegistry
{
    public function __construct(private readonly JsonSchemaValidator $schemas) {}

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return Cache::remember('platform:component-registry:v1', 300, function (): array {
            $path = rtrim((string) config('platform.contracts_path'), '/').'/catalogs/components.catalog.json';
            $raw = file_get_contents($path);

            if ($raw === false) {
                throw new RuntimeException('Component catalog cannot be read.');
            }

            $catalog = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
            $schemaPath = rtrim((string) config('platform.contracts_path'), '/').'/schemas/component.schema.json';
            $schema = $this->schemas->schemaFile($schemaPath);
            $components = [];

            foreach (($catalog['components'] ?? []) as $component) {
                $this->schemas->assertValid($component, $schema, 'component:'.($component['componentKey'] ?? 'unknown'));
                $key = ($component['componentKey'] ?? '').'@'.($component['version'] ?? '');
                if ($key === '@') {
                    throw new RuntimeException('Component catalog contains an invalid component.');
                }

                $components[$key] = $component;
            }

            return $components;
        });
    }

    /** @return array<string, mixed> */
    public function require(string $componentKey, string $version): array
    {
        $component = $this->all()["{$componentKey}@{$version}"] ?? null;

        if (! is_array($component)) {
            throw new RuntimeException("Unsupported component [{$componentKey}@{$version}].");
        }

        return $component;
    }
}
