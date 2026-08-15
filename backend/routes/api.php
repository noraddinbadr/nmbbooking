<?php

declare(strict_types=1);

use App\Modules\Content\Http\PublicSiteApiController;
use App\Modules\Shared\Http\Controllers\InternalHealthController;
use Illuminate\Support\Facades\Route;

Route::get('/internal/health', InternalHealthController::class)
    ->middleware('internal.health')
    ->name('internal.health');

Route::prefix('v1')->middleware(['tenant.resolve', 'internal.health'])->group(function (): void {
    Route::get('/internal/health', InternalHealthController::class)
        ->name('api.v1.internal.health');
});

Route::prefix('v1')->middleware('tenant.resolve')->group(function (): void {
    Route::get('/pages/{path?}', PublicSiteApiController::class)
        ->where('path', '.*')
        ->name('api.v1.public-page');
});
