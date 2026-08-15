<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Sites\Models\Site;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class ThemeTokenResolver
{
    public function __construct(private readonly ThemeCatalog $themes) {}

    /** @return array<string, string> */
    public function resolve(Site $site): array
    {
        $blueprint = DB::connection((string) config('platform.tenant_connection_name'))
            ->table('site_settings')
            ->where('site_id', $site->id)
            ->where('setting_key', 'sector.blueprint')
            ->value('value_json');
        $themeKey = 'industrial';
        if (is_string($blueprint)) {
            $blueprintValue = json_decode($blueprint, true, flags: JSON_THROW_ON_ERROR);
            $themeKey = (string) ($blueprintValue['theme']['themeKey'] ?? $themeKey);
        }

        $theme = $this->themes->require($themeKey);
        /** @var array<string, array<string, string>> $groups */
        $groups = $theme['tokens'];
        $tokens = $this->flatten($groups);
        $allowed = array_flip($theme['siteOverridePolicy']['allowedTokenKeys']);
        $overrides = DB::connection((string) config('platform.tenant_connection_name'))
            ->table('site_theme_tokens')
            ->where('site_id', $site->id)
            ->get(['token_key', 'token_value']);

        foreach ($overrides as $override) {
            $tokenKey = (string) $override->token_key;
            if (! isset($allowed[$tokenKey])) {
                throw new RuntimeException("Site [{$site->public_id}] overrides non-permitted theme token [{$tokenKey}].");
            }

            $value = (string) $override->token_value;
            if (str_contains($value, ';') || str_contains($value, '{') || str_contains($value, '}')) {
                throw new RuntimeException("Site [{$site->public_id}] contains unsafe theme token value [{$tokenKey}].");
            }

            $tokens[$tokenKey] = $value;
        }

        return $tokens;
    }

    /** @param array<string, array<string, string>> $groups @return array<string, string> */
    private function flatten(array $groups): array
    {
        $tokens = [];
        foreach ($groups as $group => $values) {
            foreach ($values as $key => $value) {
                $tokens["{$group}.{$key}"] = $value;
            }
        }

        return $tokens;
    }
}
