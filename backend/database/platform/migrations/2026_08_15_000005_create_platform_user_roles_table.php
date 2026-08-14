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
            ->create('platform_user_roles', function (Blueprint $table): void {
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
                $table->primary(['user_id', 'role_id']);
            });
    }

    public function down(): void
    {
        Schema::connection((string) config('platform.platform_migrations_connection_name'))
            ->dropIfExists('platform_user_roles');
    }
};
