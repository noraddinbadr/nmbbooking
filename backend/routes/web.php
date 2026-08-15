<?php

declare(strict_types=1);

use App\Modules\Content\Http\PublicPageController;
use App\Modules\Content\Http\PublicSeoController;
use Illuminate\Support\Facades\Route;

Route::middleware('tenant.resolve')->group(function (): void {
    Route::get('/robots.txt', [PublicSeoController::class, 'robots'])->name('public.robots');
    Route::get('/sitemap.xml', [PublicSeoController::class, 'sitemap'])->name('public.sitemap');
    Route::get('/{path?}', PublicPageController::class)
        ->where('path', '.*')
        ->name('public.page');
});
