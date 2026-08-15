<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageBlockTranslation;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Services\PreviewPageRevisionAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PreviewPageRevisionActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_editor_preview_returns_draft_translation_and_rtl_direction_without_touching_public_revision(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $revision = PageRevision::query()->create(['page_id' => $page->id, 'revision_no' => (int) $page->revisions()->max('revision_no') + 1, 'template_key' => 'preview.v1', 'status' => 'draft', 'created_by_platform_user_id' => 1]);
        $block = PageBlock::query()->create(['page_revision_id' => $revision->id, 'public_id' => Str::ulid()->toBase32(), 'component_key' => 'hero.split', 'component_version' => '2.1.0', 'position' => 10, 'enabled' => true, 'variant_key' => 'industrial-dark', 'props_json' => ['title' => 'Default', 'subtitle' => '', 'cta' => ['label' => 'Contact', 'href' => '/contact']], 'style_json' => [], 'visibility_rules_json' => [], 'lock_version' => 1]);
        PageBlockTranslation::query()->create(['page_block_id' => $block->id, 'locale' => 'ar', 'props_json' => ['title' => 'معاينة عربية', 'subtitle' => '', 'cta' => ['label' => 'تواصل', 'href' => '/contact']]]);

        $preview = app(PreviewPageRevisionAction::class)->execute($revision, 'ar');

        self::assertSame('rtl', $preview['direction']);
        self::assertSame('معاينة عربية', $preview['blocks'][0]['props']['title']);
        self::assertSame($page->published_revision_id, $page->fresh()->published_revision_id);
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
