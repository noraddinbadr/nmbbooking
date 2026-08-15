<?php

declare(strict_types=1);

use App\Modules\Content\Http\PublicSiteApiController;
use App\Modules\Identity\Http\MfaController;
use App\Modules\Identity\Http\PlatformAuthController;
use App\Modules\Shared\Http\Controllers\InternalHealthController;
use Illuminate\Support\Facades\Route;

Route::get('/internal/health', InternalHealthController::class)
    ->middleware('internal.health')
    ->name('internal.health');

Route::prefix('platform/auth')->middleware('throttle:10,1')->group(function (): void {
    Route::post('/register', [PlatformAuthController::class, 'register'])
        ->name('platform.auth.register');
    Route::post('/login', [PlatformAuthController::class, 'login'])
        ->name('platform.auth.login');
    Route::post('/mfa/verify', [PlatformAuthController::class, 'completeMfaLogin'])
        ->name('platform.auth.mfa.verify');
    Route::post('/password/forgot', [PlatformAuthController::class, 'sendPasswordResetLink'])
        ->name('platform.auth.password.forgot');
    Route::post('/password/reset', [PlatformAuthController::class, 'resetPassword'])
        ->name('platform.auth.password.reset');
});

Route::prefix('platform')->middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [PlatformAuthController::class, 'me'])
        ->name('platform.auth.me');
    Route::post('/logout', [PlatformAuthController::class, 'logout'])
        ->name('platform.auth.logout');
    Route::prefix('mfa/totp')->group(function (): void {
        Route::post('/prepare', [MfaController::class, 'prepare'])->name('platform.mfa.totp.prepare');
        Route::post('/confirm', [MfaController::class, 'confirm'])->name('platform.mfa.totp.confirm');
        Route::post('/disable', [MfaController::class, 'disable'])->name('platform.mfa.totp.disable');
    });
});

Route::prefix('v1')->middleware(['tenant.resolve', 'internal.health'])->group(function (): void {
    Route::get('/internal/health', InternalHealthController::class)
        ->name('api.v1.internal.health');
});

Route::prefix('v1')->middleware('tenant.resolve')->group(function (): void {
    Route::get('/pages/{path?}', PublicSiteApiController::class)
        ->where('path', '.*')
        ->name('api.v1.public-page');
});
