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
            ->create('password_reset_tokens', function (Blueprint $table): void {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
    }

    public function down(): void
    {
        Schema::connection((string) config('platform.platform_migrations_connection_name'))
            ->dropIfExists('password_reset_tokens');
    }
};
