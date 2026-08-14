<?php

declare(strict_types=1);

use App\Modules\Content\Http\PublicSiteApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('tenant.resolve')->group(function (): void {
    Route::get('/pages/{path?}', PublicSiteApiController::class)
        ->where('path', '.*')
        ->name('api.v1.public-page');
});
