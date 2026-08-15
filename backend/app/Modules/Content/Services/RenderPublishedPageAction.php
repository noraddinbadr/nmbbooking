<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Components\Services\ComponentRegistry;
use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Packages\Services\PackageCapabilityRegistry;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class RenderPublishedPageAction
{
    public function __construct(
        private readonly ComponentRegistry $components,
        private readonly PackageCapabilityRegistry $capabilities,
    ) {}

    /** @return array<string, mixed> */
    public function execute(Request $request, TenantContext $context, string $routePath): array
    {
        $site = Site::query()
            ->where('public_id', $context->sitePublicId)
            ->where('status', 'active')
            ->firstOrFail();

        $locale = $this->resolveLocale($request, $site);
        $page = Page::query()
            ->where('site_id', $site->id)
            ->where('route_path', $routePath)
            ->where('status', 'published')
            ->whereNotNull('published_revision_id')
            ->firstOrFail();

        $revision = PageRevision::query()
            ->whereKey($page->published_revision_id)
            ->where('page_id', $page->id)
            ->where('status', 'published')
            ->with(['blocks' => fn ($query) => $query->where('enabled', true)->with('translations')])
            ->firstOrFail();

        $translation = $page->translations()->where('locale', $locale)->first();
        if ($translation === null) {
            $translation = $page->translations()->where('locale', $site->default_locale)->firstOrFail();
            $locale = $site->default_locale;
        }

        return [
            'tenant' => $context,
            'site' => $site,
            'locale' => $locale,
            'direction' => $site->locales()->where('locale', $locale)->value('direction') ?? 'ltr',
            'page' => $page,
            'title' => $translation->title,
            'seo' => $translation->seo_json ?? [],
            'blocks' => $this->viewModels($revision->blocks, $locale, $this->capabilities->activePackageKeys($context, $site)),
        ];
    }

    private function resolveLocale(Request $request, Site $site): string
    {
        $requested = strtolower((string) $request->query('lang', $site->default_locale));
        $isActive = $site->locales()
            ->where('locale', $requested)
            ->where('status', 'active')
            ->exists();

        return $isActive ? $requested : $site->default_locale;
    }

    /** @param Collection<int, PageBlock> $blocks @param Collection<string, int> $activePackages */
    private function viewModels(Collection $blocks, string $locale, Collection $activePackages): array
    {
        return $blocks
            ->filter(function (PageBlock $block) use ($activePackages): bool {
                $manifest = $this->components->require($block->component_key, $block->component_version);

                return collect($manifest['requiredPackages'] ?? [])
                    ->every(fn (string $packageKey): bool => $activePackages->has($packageKey));
            })
            ->map(function (PageBlock $block) use ($locale): array {
                $manifest = $this->components->require($block->component_key, $block->component_version);
                $translation = $block->translations->firstWhere('locale', $locale);

                return [
                    'publicId' => $block->public_id,
                    'componentKey' => $block->component_key,
                    'componentVersion' => $block->component_version,
                    'view' => $manifest['renderer']['bladeView'],
                    'variant' => $block->variant_key,
                    'props' => $translation?->props_json ?? $block->props_json,
                    'style' => $block->style_json ?? [],
                ];
            })
            ->values()
            ->all();
    }
}
