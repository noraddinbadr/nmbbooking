<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $schema = Schema::connection((string) config('platform.platform_migrations_connection_name'));

        if (! $schema->hasTable('mfa_factors')) {
            $schema->create('mfa_factors', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->ulid('public_id')->unique();
                $table->string('type', 32);
                $table->text('secret_encrypted');
                $table->text('recovery_codes_encrypted')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('disabled_at')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'type']);
                $table->index(['user_id', 'disabled_at']);
            });
        }

        $schema->create('platform_sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        $schema = Schema::connection((string) config('platform.platform_migrations_connection_name'));

        $schema->dropIfExists('platform_sessions');
        $schema->dropIfExists('mfa_factors');
    }
};
