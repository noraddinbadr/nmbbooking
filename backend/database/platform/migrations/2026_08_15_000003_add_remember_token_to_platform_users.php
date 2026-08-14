<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection((string) config('platform.platform_migrations_connection_name'))
            ->table('users', function (Blueprint $table): void {
                $table->rememberToken()->after('password');
            });
    }

    public function down(): void
    {
        Schema::connection((string) config('platform.platform_migrations_connection_name'))
            ->table('users', function (Blueprint $table): void {
                $table->dropRememberToken();
            });
    }
};
