<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Components\Services\ComponentRendererRegistry;
use App\Modules\Content\Models\PageRevision;
use RuntimeException;

final class PreviewPageRevisionAction
{
    public function __construct(
        private readonly ComponentRendererRegistry $renderers,
        private readonly ThemeTokenResolver $themes,
    ) {}

    /** @return array<string, mixed> */
    public function execute(PageRevision $revision, string $locale): array
    {
        if (! in_array($revision->status, ['draft', 'in_review', 'approved'], true)) {
            throw new RuntimeException('Only non-public revisions may be previewed through the editor.');
        }

        $revision->loadMissing(['page.site', 'blocks.translations']);
        $site = $revision->page->site;
        $activeLocale = $site->locales()->where('locale', $locale)->where('status', 'active')->first();
        if ($activeLocale === null) {
            $activeLocale = $site->locales()->where('locale', $site->default_locale)->firstOrFail();
        }

        return [
            'revision' => $revision,
            'locale' => $activeLocale->locale,
            'direction' => $activeLocale->direction,
            'themeTokens' => $this->themes->resolve($site),
            'blocks' => $revision->blocks->where('enabled', true)->map(fn ($block): array => [
                'publicId' => $block->public_id,
                'view' => $this->renderers->bladeView($block->component_key, $block->component_version),
                'props' => $block->translations->firstWhere('locale', $activeLocale->locale)?->props_json ?? $block->props_json,
                'variant' => $block->variant_key,
                'style' => $block->style_json ?? [],
            ])->values()->all(),
        ];
    }
}
