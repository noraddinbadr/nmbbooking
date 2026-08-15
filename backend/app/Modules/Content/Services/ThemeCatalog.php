<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

final class ThemeCatalog
{
    public function __construct(private readonly JsonSchemaValidator $schemas) {}

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return Cache::remember('platform:theme-catalog:v1', 300, function (): array {
            $path = rtrim((string) config('platform.contracts_path'), '/').'/catalogs/themes.catalog.json';
            $raw = file_get_contents($path);
            if ($raw === false) {
                throw new RuntimeException('Theme catalog cannot be read.');
            }

            $catalog = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
            $schema = $this->schemas->schemaFile(rtrim((string) config('platform.contracts_path'), '/').'/schemas/theme.schema.json');
            $themes = [];
            foreach (($catalog['themes'] ?? []) as $theme) {
                $this->schemas->assertValid($theme, $schema, 'theme:'.($theme['themeKey'] ?? 'unknown'));
                $themeKey = (string) $theme['themeKey'];
                if (array_key_exists($themeKey, $themes)) {
                    throw new RuntimeException("Theme catalog contains duplicate key [{$themeKey}].");
                }

                $themes[$themeKey] = $theme;
            }

            return $themes;
        });
    }

    /** @return array<string, mixed> */
    public function require(string $themeKey): array
    {
        $theme = $this->all()[$themeKey] ?? null;
        if (! is_array($theme)) {
            throw new RuntimeException("Unsupported theme [{$themeKey}].");
        }

        return $theme;
    }
}
