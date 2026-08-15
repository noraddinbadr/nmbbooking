<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Services\CreateDraftRevisionAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Tests\TestCase;

final class CreateDraftRevisionActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_draft_clones_the_published_revision_without_changing_the_public_source(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $publishedRevisionId = $page->published_revision_id;
        $published = $page->revisions()->with('blocks.translations')->findOrFail($publishedRevisionId);

        $draft = app(CreateDraftRevisionAction::class)->execute($page, 1, 'تحضير تعديل المحتوى');

        self::assertSame('draft', $draft->status);
        self::assertNotSame($published->id, $draft->id);
        self::assertSame($published->blocks->count(), $draft->blocks->count());
        self::assertSame($published->blocks->first()->component_key, $draft->blocks->first()->component_key);
        self::assertSame($published->blocks->first()->public_id === $draft->blocks->first()->public_id, false);
        self::assertSame($publishedRevisionId, $page->fresh()->published_revision_id);
        self::assertSame('published', $published->fresh()->status);
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
