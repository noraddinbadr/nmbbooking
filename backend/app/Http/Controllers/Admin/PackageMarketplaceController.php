<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Modules\Packages\Services\PackageCatalog;
use Illuminate\Contracts\View\View;

final class PackageMarketplaceController
{
    public function __invoke(PackageCatalog $catalog): View
    {
        $packages = collect($catalog->all())
            ->sortBy('packageKey')
            ->map(static function (array $manifest): array {
                /** @var array<string, int> $capabilityCounts */
                $capabilityCounts = collect($manifest['capabilities'])
                    ->map(static fn (array $items): int => count($items))
                    ->all();

                return [
                    'key' => (string) $manifest['packageKey'],
                    'version' => (string) $manifest['version'],
                    'displayName' => $manifest['displayName'],
                    'category' => (string) $manifest['category'],
                    'scope' => (string) $manifest['scope'],
                    'disablePolicy' => (string) $manifest['lifecycle']['disablePolicy'],
                    'compatibility' => $manifest['compatibility'],
                    'dependencyCount' => count($manifest['dependencies']),
                    'conflictCount' => count($manifest['conflicts']),
                    'capabilityCounts' => $capabilityCounts,
                ];
            })
            ->values();

        return view('admin.package-marketplace', compact('packages'));
    }
}
