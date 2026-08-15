<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class SectorBlueprintCatalog
{
    public function __construct(private readonly JsonSchemaValidator $schemas) {}

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return Cache::remember('platform:sector-blueprint-catalog:v1', 300, function (): array {
            $contractsPath = rtrim((string) config('platform.contracts_path'), '/');
            $raw = file_get_contents($contractsPath.'/catalogs/sectors.catalog.json');
            if ($raw === false) {
                throw new RuntimeException('Sector blueprint catalog cannot be read.');
            }

            $catalog = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
            $schema = $this->schemas->schemaFile($contractsPath.'/schemas/sector-blueprint.schema.json');
            $blueprints = [];

            foreach (($catalog['blueprints'] ?? []) as $blueprint) {
                $validationBlueprint = $blueprint;
                foreach ($validationBlueprint['packages'] ?? [] as $index => $package) {
                    if (($package['config'] ?? null) === []) {
                        $validationBlueprint['packages'][$index]['config'] = (object) [];
                    }
                }

                $this->schemas->assertValid($validationBlueprint, $schema, 'sector-blueprint:'.($blueprint['sectorKey'] ?? 'unknown'));
                $blueprints[$blueprint['sectorKey']] = $blueprint;
            }

            return $blueprints;
        });
    }

    /** @return array<string, mixed> */
    public function require(string $sectorKey): array
    {
        $blueprint = $this->all()[$sectorKey] ?? null;
        if (! is_array($blueprint)) {
            throw new RuntimeException("Unknown sector blueprint [{$sectorKey}].");
        }

        return $blueprint;
    }
}
