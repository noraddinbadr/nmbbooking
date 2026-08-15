<?php

use App\Http\Controllers\Admin\PackageMarketplaceController;
use App\Http\Controllers\Admin\PlatformDashboardController;
use Illuminate\Support\Facades\Route;

// --------------------------
// Custom Backpack Routes
// --------------------------
// This route file is loaded automatically by Backpack\CRUD.
// Routes you generate using Backpack\Generators will be placed here.

Route::group([
    'prefix' => config('backpack.base.route_prefix', 'admin'),
    'middleware' => array_merge(
        (array) config('backpack.base.web_middleware', 'web'),
        (array) config('backpack.base.middleware_key', 'admin')
    ),
    'namespace' => 'App\Http\Controllers\Admin',
], function () { // custom admin routes
    Route::get('platform', PlatformDashboardController::class)
        ->name('platform.dashboard');
    Route::get('packages', PackageMarketplaceController::class)
        ->name('platform.packages.marketplace');
}); // this should be the absolute last line of this file

/**
 * DO NOT ADD ANYTHING HERE.
 */
