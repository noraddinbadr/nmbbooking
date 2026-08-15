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
            ->create('tenant_invitations', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->ulid('public_id')->unique();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('role_id')->constrained('roles');
                $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('email', 190);
                $table->string('token_hash', 64)->unique();
                $table->json('site_scope_public_ids_json')->nullable();
                $table->timestamp('expires_at')->index();
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('revoked_at')->nullable();
                $table->timestamps();
                $table->index(['tenant_id', 'email']);
                $table->index(['tenant_id', 'accepted_at', 'revoked_at']);
            });
    }

    public function down(): void
    {
        Schema::connection((string) config('platform.platform_migrations_connection_name'))
            ->dropIfExists('tenant_invitations');
    }
};
