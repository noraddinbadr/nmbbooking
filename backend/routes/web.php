<?php

declare(strict_types=1);

use App\Modules\Content\Http\PublicPageController;
use Illuminate\Support\Facades\Route;

Route::middleware('tenant.resolve')->group(function (): void {
    Route::get('/{path?}', PublicPageController::class)
        ->where('path', '.*')
        ->name('public.page');
});
