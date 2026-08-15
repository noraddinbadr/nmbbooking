<?php

namespace App\Providers;

use App\Modules\Shared\Mail\EmailDispatcher;
use App\Modules\Shared\Mail\LaravelEmailDispatcher;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(EmailDispatcher::class, LaravelEmailDispatcher::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
