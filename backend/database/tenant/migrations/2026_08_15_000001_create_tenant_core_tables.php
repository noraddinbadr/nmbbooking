<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $schema = Schema::connection((string) config('platform.tenant_migrations_connection_name'));

        $schema->create('sites', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->ulid('public_id')->unique();
            $table->string('name', 160);
            $table->string('code', 80)->unique();
            $table->string('default_locale', 12)->default('ar');
            $table->string('status', 32)->default('active')->index();
            $table->unsignedBigInteger('published_content_version')->default(0);
            $table->timestamps();
        });

        $schema->create('site_locales', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('locale', 12);
            $table->string('direction', 3);
            $table->boolean('is_default')->default(false);
            $table->string('status', 32)->default('active')->index();
            $table->timestamps();
            $table->unique(['site_id', 'locale']);
        });

        $schema->create('site_settings', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('setting_key', 120);
            $table->json('value_json');
            $table->unsignedBigInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['site_id', 'setting_key']);
        });

        $schema->create('site_theme_tokens', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('token_key', 120);
            $table->string('token_value', 500);
            $table->unsignedBigInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['site_id', 'token_key']);
        });

        $schema->create('pages', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->string('route_path', 512);
            $table->string('page_type', 64)->default('standard');
            $table->string('status', 32)->default('draft')->index();
            $table->unsignedBigInteger('published_revision_id')->nullable();
            $table->timestamps();
            $table->unique(['site_id', 'route_path']);
            $table->index(['site_id', 'status']);
        });

        $schema->create('page_revisions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->unsignedInteger('revision_no');
            $table->string('template_key', 120);
            $table->string('status', 32)->default('draft')->index();
            $table->unsignedBigInteger('created_by_platform_user_id');
            $table->unsignedBigInteger('published_by_platform_user_id')->nullable();
            $table->timestamp('scheduled_for')->nullable()->index();
            $table->timestamp('published_at')->nullable();
            $table->text('change_note')->nullable();
            $table->timestamps();
            $table->unique(['page_id', 'revision_no']);
            $table->index(['page_id', 'status']);
        });

        $schema->create('page_blocks', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('page_revision_id')->constrained('page_revisions')->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->string('component_key', 120);
            $table->string('component_version', 32);
            $table->unsignedSmallInteger('position');
            $table->boolean('enabled')->default(true)->index();
            $table->string('variant_key', 80)->nullable();
            $table->json('props_json');
            $table->json('style_json')->nullable();
            $table->json('visibility_rules_json')->nullable();
            $table->unsignedBigInteger('lock_version')->default(1);
            $table->timestamps();
            $table->unique(['page_revision_id', 'position']);
            $table->index(['page_revision_id', 'enabled']);
            $table->index(['component_key', 'component_version']);
        });

        $schema->create('page_translations', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('locale', 12);
            $table->string('title', 255);
            $table->string('slug', 190);
            $table->json('seo_json')->nullable();
            $table->timestamps();
            $table->unique(['page_id', 'locale']);
            $table->unique(['site_id', 'locale', 'slug']);
        });

        $schema->create('page_block_translations', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('page_block_id')->constrained('page_blocks')->cascadeOnDelete();
            $table->string('locale', 12);
            $table->json('props_json');
            $table->timestamps();
            $table->unique(['page_block_id', 'locale']);
        });

        $schema->create('menus', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->string('key', 80);
            $table->string('status', 32)->default('draft');
            $table->timestamps();
            $table->unique(['site_id', 'key']);
        });

        $schema->create('menu_items', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('link_type', 32);
            $table->string('target', 500);
            $table->json('label_json');
            $table->timestamps();
            $table->unique(['menu_id', 'position']);
        });

        $schema->create('redirects', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('from_path', 512);
            $table->string('to_path', 512);
            $table->unsignedSmallInteger('http_status')->default(301);
            $table->string('status', 32)->default('active')->index();
            $table->timestamps();
            $table->unique(['site_id', 'from_path']);
        });

        $schema->create('package_activations', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('package_key', 120);
            $table->string('package_version', 32);
            $table->string('scope_type', 32);
            $table->foreignId('site_id')->nullable()->constrained('sites')->cascadeOnDelete();
            $table->string('status', 32)->default('pending')->index();
            $table->json('config_json')->nullable();
            $table->unsignedBigInteger('enabled_by_platform_user_id')->nullable();
            $table->timestamp('enabled_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->timestamps();
            $table->unique(['package_key', 'scope_type', 'site_id']);
        });

        $schema->create('media_assets', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->ulid('public_id')->unique();
            $table->foreignId('site_id')->nullable()->constrained('sites')->nullOnDelete();
            $table->string('disk', 80);
            $table->string('storage_key', 512)->unique();
            $table->string('original_filename', 255);
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('bytes');
            $table->string('sha256', 64)->index();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('visibility', 32)->index();
            $table->unsignedBigInteger('uploaded_by_platform_user_id')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
            $table->index(['site_id', 'visibility']);
        });

        $schema->create('media_variants', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('asset_id')->constrained('media_assets')->cascadeOnDelete();
            $table->string('variant_key', 80);
            $table->string('storage_key', 512)->unique();
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('bytes');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();
            $table->unique(['asset_id', 'variant_key']);
        });

        $schema->create('forms', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->string('key', 80);
            $table->json('schema_json');
            $table->json('settings_json');
            $table->string('status', 32)->default('draft')->index();
            $table->timestamps();
            $table->unique(['site_id', 'key']);
        });

        $schema->create('form_submissions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('form_id')->constrained('forms')->cascadeOnDelete();
            $table->ulid('public_id')->unique();
            $table->json('payload_json');
            $table->json('consent_json')->nullable();
            $table->string('status', 32)->default('new')->index();
            $table->string('ip_hash', 64)->nullable()->index();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();
            $table->index(['form_id', 'status', 'submitted_at']);
        });

        $schema->create('audit_events', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('actor_platform_user_id')->nullable();
            $table->string('event_key', 120);
            $table->string('subject_type', 120)->nullable();
            $table->string('subject_public_id', 26)->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['subject_type', 'subject_public_id']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        $schema = Schema::connection((string) config('platform.tenant_migrations_connection_name'));

        foreach ([
            'audit_events', 'form_submissions', 'forms', 'media_variants', 'media_assets',
            'package_activations', 'redirects', 'menu_items', 'menus', 'page_block_translations',
            'page_translations', 'page_blocks', 'page_revisions', 'pages', 'site_theme_tokens',
            'site_settings', 'site_locales', 'sites',
        ] as $table) {
            $schema->dropIfExists($table);
        }
    }
};
