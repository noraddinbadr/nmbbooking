<?php

declare(strict_types=1);

namespace App\Modules\Components\Services;

use Illuminate\Contracts\View\Factory as ViewFactory;
use RuntimeException;

final class ComponentRendererRegistry
{
    public function __construct(
        private readonly ComponentRegistry $components,
        private readonly ViewFactory $views,
    ) {}

    public function bladeView(string $componentKey, string $componentVersion): string
    {
        $manifest = $this->components->require($componentKey, $componentVersion);
        $view = $manifest['renderer']['bladeView'] ?? null;
        if (! is_string($view) || ! str_starts_with($view, 'themes.components.')) {
            throw new RuntimeException("Component [{$componentKey}@{$componentVersion}] has an unsafe renderer view.");
        }

        if (! $this->views->exists($view)) {
            throw new RuntimeException("Component [{$componentKey}@{$componentVersion}] references unavailable renderer [{$view}].");
        }

        return $view;
    }
}
