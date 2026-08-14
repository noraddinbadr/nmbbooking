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

        $schema->create('users', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->ulid('public_id')->unique();
            $table->string('name', 160);
            $table->string('email', 190)->unique();
            $table->string('password');
            $table->string('status', 32)->default('active')->index();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        $schema->create('tenants', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->ulid('public_id')->unique();
            $table->string('name', 160);
            $table->string('slug', 80)->unique();
            $table->string('status', 32)->default('provisioning')->index();
            $table->string('data_placement', 32)->default('shared_host');
            $table->string('timezone', 64)->default('UTC');
            $table->timestamps();
        });

        $schema->create('plans', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('key', 80)->unique();
            $table->string('name', 160);
            $table->json('limits_json');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        $schema->create('tenant_subscriptions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans');
            $table->string('status', 32)->default('trialing')->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        $schema->create('tenant_databases', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();
            $table->string('connection_key', 80)->unique();
            $table->string('database_name', 96)->unique();
            $table->string('db_host', 253);
            $table->unsignedSmallInteger('db_port')->default(3306);
            $table->string('db_username', 96);
            $table->string('credential_ref', 190);
            $table->string('schema_version', 32)->default('0.0.0');
            $table->string('status', 32)->default('requested')->index();
            $table->timestamp('last_verified_at')->nullable();
            $table->timestamps();
        });

        $schema->create('site_addresses', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->ulid('site_public_id');
            $table->string('address_type', 32);
            $table->string('hostname', 253);
            $table->string('path_prefix', 255)->default('/');
            $table->boolean('is_primary')->default(false);
            $table->string('status', 32)->default('pending')->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->unique(['hostname', 'path_prefix']);
            $table->index(['tenant_id', 'status']);
        });

        $schema->create('roles', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('key', 80)->unique();
            $table->string('scope', 32);
            $table->string('name', 160);
            $table->timestamps();
        });

        $schema->create('permissions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('key', 120)->unique();
            $table->string('scope', 32);
            $table->string('resource', 80);
            $table->string('action', 80);
            $table->timestamps();
        });

        $schema->create('role_permissions', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        $schema->create('tenant_memberships', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles');
            $table->string('status', 32)->default('invited')->index();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        $schema->create('membership_site_scopes', function (Blueprint $table): void {
            $table->foreignId('membership_id')->constrained('tenant_memberships')->cascadeOnDelete();
            $table->ulid('site_public_id');
            $table->primary(['membership_id', 'site_public_id']);
        });

        $schema->create('package_definitions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('package_key', 120)->unique();
            $table->string('category', 32);
            $table->string('scope', 32);
            $table->json('display_name_json');
            $table->boolean('is_listed')->default(true)->index();
            $table->timestamps();
        });

        $schema->create('package_versions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('package_id')->constrained('package_definitions')->cascadeOnDelete();
            $table->string('version', 32);
            $table->json('manifest_json');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
            $table->unique(['package_id', 'version']);
        });

        $schema->create('tenant_entitlements', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('package_id')->constrained('package_definitions')->cascadeOnDelete();
            $table->boolean('is_enabled')->default(false)->index();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'package_id']);
        });

        $schema->create('provisioning_runs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('step', 80);
            $table->string('status', 32)->default('pending')->index();
            $table->json('metadata_json')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'step']);
        });

        $schema->create('tenant_migration_runs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('release_version', 32);
            $table->string('status', 32)->default('pending')->index();
            $table->json('migrations_json');
            $table->text('failure_reason')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'release_version']);
        });

        $schema->create('platform_audit_events', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_key', 120);
            $table->string('subject_type', 120)->nullable();
            $table->string('subject_public_id', 26)->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['tenant_id', 'created_at']);
            $table->index(['subject_type', 'subject_public_id']);
        });
    }

    public function down(): void
    {
        $schema = Schema::connection((string) config('platform.platform_migrations_connection_name'));

        foreach ([
            'platform_audit_events', 'tenant_migration_runs', 'provisioning_runs', 'tenant_entitlements',
            'package_versions', 'package_definitions', 'membership_site_scopes', 'tenant_memberships',
            'role_permissions', 'permissions', 'roles', 'site_addresses', 'tenant_databases',
            'tenant_subscriptions', 'plans', 'tenants', 'users',
        ] as $table) {
            $schema->dropIfExists($table);
        }
    }
};
