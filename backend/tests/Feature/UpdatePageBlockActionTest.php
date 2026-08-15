<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Services\AutosavePageBlockAction;
use App\Modules\Content\Services\UpdatePageBlockAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class UpdatePageBlockActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_draft_block_updates_validate_props_update_locale_and_detect_stale_writers(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $revision = PageRevision::query()->create([
            'page_id' => $page->id,
            'revision_no' => (int) $page->revisions()->max('revision_no') + 1,
            'template_key' => 'block-edit.v1',
            'status' => 'draft',
            'created_by_platform_user_id' => 1,
        ]);
        $block = PageBlock::query()->create([
            'page_revision_id' => $revision->id,
            'public_id' => Str::ulid()->toBase32(),
            'component_key' => 'hero.split',
            'component_version' => '2.1.0',
            'position' => 10,
            'enabled' => true,
            'variant_key' => 'industrial-dark',
            'props_json' => ['title' => 'العنوان الأول', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
            'style_json' => [],
            'visibility_rules_json' => [],
            'lock_version' => 1,
        ]);
        $action = app(UpdatePageBlockAction::class);

        $updated = $action->execute(
            $block,
            1,
            ['title' => 'العنوان المحدّث', 'subtitle' => 'وصف', 'cta' => ['label' => 'تواصل', 'href' => '/contact']],
            1,
        );
        self::assertSame(2, $updated->lock_version);
        self::assertSame('العنوان المحدّث', $updated->props_json['title']);

        $translated = $action->execute(
            $updated,
            2,
            ['title' => 'Updated title', 'subtitle' => 'Description', 'cta' => ['label' => 'Contact', 'href' => '/contact']],
            1,
            'en',
        );
        self::assertSame(3, $translated->lock_version);
        self::assertSame('Updated title', $translated->translations->firstWhere('locale', 'en')->props_json['title']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Block edit conflict');
        $action->execute(
            $translated,
            2,
            ['title' => 'تحديث قديم', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
            1,
        );
    }

    public function test_autosave_uses_the_same_draft_lock_and_records_a_recovery_audit_event(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $revision = PageRevision::query()->create([
            'page_id' => $page->id,
            'revision_no' => (int) $page->revisions()->max('revision_no') + 1,
            'template_key' => 'autosave.v1',
            'status' => 'draft',
            'created_by_platform_user_id' => 1,
        ]);
        $block = PageBlock::query()->create([
            'page_revision_id' => $revision->id,
            'public_id' => Str::ulid()->toBase32(),
            'component_key' => 'hero.split',
            'component_version' => '2.1.0',
            'position' => 10,
            'enabled' => true,
            'variant_key' => 'industrial-dark',
            'props_json' => ['title' => 'قبل الحفظ', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
            'style_json' => [],
            'visibility_rules_json' => [],
            'lock_version' => 1,
        ]);

        $saved = app(AutosavePageBlockAction::class)->execute(
            $block,
            1,
            ['title' => 'بعد الحفظ التلقائي', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
            1,
        );

        self::assertSame(2, $saved->lock_version);
        self::assertSame('بعد الحفظ التلقائي', $saved->props_json['title']);
        self::assertTrue(DB::connection('tenant')->table('audit_events')
            ->where('event_key', 'content.page-block.autosaved')
            ->where('subject_public_id', $block->public_id)
            ->exists());
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
